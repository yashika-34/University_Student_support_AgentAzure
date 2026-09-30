import crypto from 'crypto';
import mongoose from 'mongoose';
import { AzureOpenAI } from 'openai';
import FlashcardDeck from '../models/FlashcardDeck.js';
import FlashcardProgress from '../models/FlashcardProgress.js';
import ExamSchedule from '../models/ExamSchedule.js';
import Quiz from '../models/Quiz.js';
import Student from '../models/Student.js';
import { getEffectiveAzureConfig } from '../services/azureAiService.js';

/**
 * SuperMemo SM-2 Spaced Repetition Algorithm
 * @param {number} quality - Rating (0: Blackout, 1: Wrong, 2: Hard, 3: Pass, 4: Good, 5: Perfect)
 * @param {number} repetitions - Consecutive successful recall reviews
 * @param {number} interval - Current review interval in days
 * @param {number} easeFactor - Current ease factor (minimum 1.3)
 */
export const calculateSM2 = (quality = 4, repetitions = 0, interval = 1, easeFactor = 2.5) => {
  const q = Math.max(0, Math.min(5, Number(quality)));
  let nextRepetitions = repetitions;
  let nextInterval = interval;
  let nextEaseFactor = easeFactor;

  if (q >= 3) {
    if (nextRepetitions === 0) {
      nextInterval = 1;
    } else if (nextRepetitions === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.max(1, Math.round(interval * nextEaseFactor));
    }
    nextRepetitions += 1;
  } else {
    nextRepetitions = 0;
    nextInterval = 1;
  }

  nextEaseFactor = nextEaseFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (nextEaseFactor < 1.3) {
    nextEaseFactor = 1.3;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

  return {
    quality: q,
    repetitions: nextRepetitions,
    interval: nextInterval,
    easeFactor: Number(nextEaseFactor.toFixed(2)),
    nextReviewDate
  };
};

/**
 * Helper to update or initialize user's FlashcardProgress, XP, and daily streak
 */
const trackProgressUpdate = async (userId, { isKnown, needsRevision, isBookmarked, card, deckId, quality = 4 }) => {
  if (!userId) return null;
  const today = new Date().toISOString().split('T')[0];

  let progress = await FlashcardProgress.findOne({ userId });
  if (!progress) {
    progress = new FlashcardProgress({
      userId,
      dailyStreak: 1,
      longestStreak: 1,
      lastActiveDate: today,
      totalReviewed: 0,
      totalKnown: 0,
      totalNeedsRevision: 0,
      totalXP: 0,
      level: 1,
      badges: [],
      reviewHeatmap: [],
      weakTopics: [],
      bookmarkedCards: []
    });
  }

  // Update streak based on last active date
  if (progress.lastActiveDate) {
    const lastDate = new Date(progress.lastActiveDate);
    const currDate = new Date(today);
    const diffTime = currDate - lastDate;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      progress.dailyStreak += 1;
      if (progress.dailyStreak > (progress.longestStreak || 0)) {
        progress.longestStreak = progress.dailyStreak;
      }
    } else if (diffDays > 1) {
      progress.dailyStreak = 1;
    }
  } else {
    progress.dailyStreak = 1;
    progress.longestStreak = 1;
  }

  progress.lastActiveDate = today;
  progress.totalReviewed += 1;

  if (isKnown) {
    progress.totalKnown += 1;
  }
  if (needsRevision) {
    progress.totalNeedsRevision += 1;
    if (card?.category && !progress.weakTopics.includes(card.category)) {
      progress.weakTopics.push(card.category);
    }
  }

  // Calculate XP reward
  let earnedXP = 10; // Base XP for review
  if (quality >= 4 || isKnown) earnedXP += 10;
  if (quality === 5) earnedXP += 5;
  if (progress.dailyStreak >= 3) earnedXP += 5; // Streak bonus

  progress.awardXP(earnedXP, 'Card review');

  // Bookmark management
  if (isBookmarked && card) {
    const existingIndex = progress.bookmarkedCards.findIndex((b) => b.cardId === card.cardId);
    if (existingIndex === -1) {
      progress.bookmarkedCards.push({
        cardId: card.cardId,
        deckId: deckId || null,
        front: card.front,
        back: card.back,
        category: card.category || 'General',
        bookmarkedAt: new Date()
      });
    }
  } else if (isBookmarked === false && card) {
    progress.bookmarkedCards = progress.bookmarkedCards.filter((b) => b.cardId !== card.cardId);
  }

  await progress.save();
  return progress;
};

/**
 * @desc Generate dynamic AI flashcards from any module context using Azure OpenAI GPT-4.1-mini
 * @route POST /api/v1/flashcards/generate
 */
export const generateFlashcards = async (req, res, next) => {
  try {
    const {
      sourceModule = 'custom',
      type = 'general',
      title = 'AI Flashcard Deck',
      context = '',
      count = 8,
      metadata = {},
      save = false
    } = req.body;

    const azureConfig = getEffectiveAzureConfig();
    let cards = [];

    if (azureConfig.isConfigured) {
      try {
        const client = new AzureOpenAI({
          endpoint: azureConfig.endpoint,
          apiKey: azureConfig.apiKey,
          apiVersion: azureConfig.apiVersion,
          deployment: azureConfig.primaryDeployment
        });

        const prompt = `You are an elite academic AI learning coach and memory retention specialist for a University Student Support platform.
Create high-yield, interactive flashcards for university students.

MODULE: ${sourceModule}
TYPE: ${type}
TITLE: ${title}
DESIRED CARD COUNT: ${count}
CONTEXT / SOURCE MATERIAL:
${typeof context === 'object' ? JSON.stringify(context, null, 2).substring(0, 12000) : String(context).substring(0, 12000)}

SPECIAL INSTRUCTIONS PER TYPE:
- If type is 'role_interview' or 'interview_revise_before_next':
  * Generate realistic technical/behavioral interview questions, STAR method guidelines, or questions directly addressing the candidate's incorrect answers/weaknesses.
  * Front: Question / Concept / Interview Prompt.
  * Back: Ideal concise answer, key technical keywords to mention, and pro interview tips.
- If type is 'required_skills' or 'tech_stack':
  * Focus on real-world industry applications, architectural concepts, and hands-on usage of the skill.
- If type is 'company_prep':
  * Focus on company culture, core values, technical standards, and domain questions.
- If type is 'ats_improvement' or 'ats_weakness' or 'skill_gap':
  * Highlight specific bullet point rewrites, missing industry keywords, and ATS action verbs.
- If type is 'cover_letter_tips':
  * Focus on value proposition, opening hooks, quantifiable achievements, and closing calls-to-action.
- If type is 'chatbot_quick_revision', 'chatbot_concept', 'chatbot_formula', or 'chatbot_definition':
  * Focus on core academic principles, definitions, mathematical formulas/equations, and key takeaways from the conversation.
- If type is 'chapter_syllabus', 'exam_revision', 'important_topics', or 'unit_quick_revision':
  * Break down the syllabus into high-frequency exam questions, critical theorems, definitions, and chapter-wise core concepts.

OUTPUT FORMAT:
Return a JSON object containing a "cards" array with exactly this structure:
{
  "cards": [
    {
      "front": "Clear, concise Question, Concept, Term, or Challenge",
      "back": "Accurate, comprehensive, and student-friendly Answer, Explanation, Formula, or Method",
      "category": "e.g., Technical, DSA, ATS, Formula, Behavioral, Core Concept, etc.",
      "difficulty": "Easy" | "Medium" | "Hard",
      "tags": ["tag1", "tag2"],
      "latexFormula": "Optional LaTeX math string if applicable (e.g. \\sum_{i=1}^n x_i or E = mc^2)"
    }
  ]
}
Return raw JSON only without markdown formatting.`;

        const response = await client.chat.completions.create({
          model: azureConfig.primaryDeployment,
          messages: [
            { role: 'system', content: 'You are an AI Flashcard Engine returning valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.4,
          max_tokens: 2200
        });

        const parsed = JSON.parse(response.choices[0]?.message?.content?.trim() || '{}');
        if (parsed.cards && Array.isArray(parsed.cards)) {
          cards = parsed.cards.map((c, idx) => ({
            cardId: `ai-${Date.now()}-${idx}`,
            front: c.front,
            back: c.back,
            category: c.category || 'General',
            difficulty: c.difficulty || 'Medium',
            tags: c.tags || [],
            latexFormula: c.latexFormula || null,
            frontImage: null,
            backImage: null,
            notes: '',
            isKnown: false,
            needsRevision: false,
            isBookmarked: false,
            reviewCount: 0,
            interval: 1,
            repetitions: 0,
            easeFactor: 2.5,
            nextReviewDate: new Date()
          }));
        }
      } catch (err) {
        console.warn('[Flashcard Azure Generation Error, falling back to smart templates]:', err.message);
      }
    }

    if (cards.length === 0) {
      cards = generateLocalFallbackCards(sourceModule, type, title, context, count);
    }

    // Optionally persist newly generated deck
    let savedDeck = null;
    if (save && req.user?._id) {
      savedDeck = await FlashcardDeck.create({
        user: req.user._id,
        title,
        description: `AI Generated Deck from ${sourceModule} (${type})`,
        sourceModule,
        category: cards[0]?.category || 'Academic',
        cards,
        metadata,
        completionRate: 0
      });
    }

    res.status(200).json({
      success: true,
      count: cards.length,
      data: {
        title,
        sourceModule,
        type,
        savedDeckId: savedDeck?._id || null,
        cards
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * High-quality fallback generator when Azure OpenAI is offline
 */
function generateLocalFallbackCards(sourceModule, type, title, context, count = 8) {
  const cards = [];
  const textContext = typeof context === 'object' ? JSON.stringify(context) : String(context || '');

  if (sourceModule === 'job_matcher' || sourceModule === 'resume_analyzer' || type.includes('ats')) {
    cards.push(
      {
        cardId: `fb-ats-1`,
        front: 'What makes a strong, ATS-compliant bullet point on a software engineer resume?',
        back: 'The Google XYZ Formula: "Accomplished [X] as measured by [Y], by doing [Z]". Include quantifiable metrics (percentages, latency, revenue), start with strong action verbs (Architected, Deployed, Spearheaded), and omit personal pronouns.',
        category: 'ATS & Resume',
        difficulty: 'Easy',
        tags: ['Resume', 'ATS', 'Career']
      },
      {
        cardId: `fb-ats-2`,
        front: 'Why should you avoid multi-column layouts, tables, and text boxes in ATS resumes?',
        back: 'Older and standard parsing engines (Workday, Taleo, Greenhouse) read resumes in a linear top-down stream. Two-column grids or text boxes often cause content to be concatenated out-of-order or completely dropped by the parser.',
        category: 'ATS & Resume',
        difficulty: 'Medium',
        tags: ['Resume', 'Formatting']
      }
    );
  } else if (sourceModule === 'mock_interview' || type.includes('interview')) {
    cards.push(
      {
        cardId: `fb-int-1`,
        front: 'What is the STAR Method for behavioral interview questions?',
        back: 'Situation: Set the scene and context.\nTask: Explain the responsibility or problem to solve.\nAction: Detail the specific steps YOU took (technologies, leadership, decisions).\nResult: Quantifiable outcome, business impact, and key learning.',
        category: 'Behavioral Interview',
        difficulty: 'Easy',
        tags: ['STAR', 'Interview']
      },
      {
        cardId: `fb-int-2`,
        front: 'System Design: What is the CAP Theorem and what trade-offs does it mandate?',
        back: 'Consistency: Every read receives the most recent write or an error.\nAvailability: Every request receives a non-error response without guarantee of most recent data.\nPartition Tolerance: System continues despite network drops.\n\nIn a distributed network with partitions (P), you must choose between CP or AP.',
        category: 'System Design',
        difficulty: 'Hard',
        tags: ['System Design', 'Architecture'],
        latexFormula: '\\text{Consistency} \\land \\text{Availability} \\implies \\text{No Network Partition}'
      }
    );
  } else {
    cards.push(
      {
        cardId: `fb-gen-1`,
        front: `Core Principle: What is the foundational concept behind ${title || 'this coursework'}?`,
        back: `This module emphasizes rigorous theoretical grounding, boundary condition verification, and scalable design patterns. Review lecture derivations and syllabus notes to reinforce mental models.`,
        category: 'Foundations',
        difficulty: 'Medium',
        tags: ['Theory', 'Foundations']
      },
      {
        cardId: `fb-gen-2`,
        front: 'Active Recall vs Passive Reading: What does cognitive science prove?',
        back: 'Testing memory recall without looking at the answer triggers neural reconsolidation, resulting in up to 50% higher long-term retention compared to passively re-reading textbooks or highlighting notes.',
        category: 'Study Strategy',
        difficulty: 'Easy',
        tags: ['Memory', 'Retention']
      }
    );
  }

  return cards.slice(0, count);
}

/**
 * @desc Save a new deck or update an existing deck in MongoDB
 * @route POST /api/v1/flashcards/decks
 */
export const saveDeck = async (req, res, next) => {
  try {
    const {
      title,
      description,
      sourceModule = 'custom',
      category = 'General',
      subject = 'General',
      difficulty = 'Mixed',
      isPublic = false,
      tags = [],
      cards = [],
      metadata = {}
    } = req.body;
    const userId = req.user?._id || null;

    if (!title || !Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ success: false, message: 'Deck title and at least one card are required.' });
    }

    const formattedCards = cards.map((c) => ({
      cardId: c.cardId || crypto.randomUUID(),
      front: c.front,
      back: c.back,
      category: c.category || category || 'General',
      difficulty: c.difficulty || 'Medium',
      tags: c.tags || [],
      frontImage: c.frontImage || null,
      backImage: c.backImage || null,
      latexFormula: c.latexFormula || null,
      notes: c.notes || '',
      isKnown: Boolean(c.isKnown),
      needsRevision: Boolean(c.needsRevision),
      isBookmarked: Boolean(c.isBookmarked),
      reviewCount: c.reviewCount || 0,
      interval: c.interval || 1,
      repetitions: c.repetitions || 0,
      easeFactor: c.easeFactor || 2.5,
      quality: c.quality || 0,
      nextReviewDate: c.nextReviewDate ? new Date(c.nextReviewDate) : new Date()
    }));

    const knownCount = formattedCards.filter((c) => c.isKnown).length;
    const completionRate = Math.round((knownCount / formattedCards.length) * 100);

    const deck = await FlashcardDeck.create({
      user: userId,
      title,
      description: description || '',
      sourceModule,
      category,
      subject,
      difficulty,
      isPublic: Boolean(isPublic),
      tags,
      cards: formattedCards,
      metadata,
      completionRate
    });

    // If deck creator is logged in, award creator XP badge
    if (userId) {
      const progress = await FlashcardProgress.findOne({ userId });
      if (progress) {
        progress.awardXP(25, 'Created Deck');
        await progress.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Flashcard deck saved successfully.',
      data: deck
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Update deck metadata (title, description, tags, isPublic)
 * @route PUT /api/v1/flashcards/decks/:id
 */
export const updateDeck = async (req, res, next) => {
  try {
    const deck = await FlashcardDeck.findById(req.params.id);
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found.' });
    }

    if (deck.user && req.user && String(deck.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this deck.' });
    }

    const { title, description, category, subject, difficulty, tags, isPublic } = req.body;
    if (title !== undefined) deck.title = title;
    if (description !== undefined) deck.description = description;
    if (category !== undefined) deck.category = category;
    if (subject !== undefined) deck.subject = subject;
    if (difficulty !== undefined) deck.difficulty = difficulty;
    if (tags !== undefined) deck.tags = tags;
    if (isPublic !== undefined) deck.isPublic = isPublic;

    await deck.save();

    res.status(200).json({
      success: true,
      message: 'Deck updated successfully.',
      data: deck
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Get user's saved decks
 * @route GET /api/v1/flashcards/decks
 */
export const getMyDecks = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { sourceModule, category, search } = req.query;

    const filter = {};
    if (userId) {
      filter.$or = [{ user: userId }, { user: null }];
    }
    if (sourceModule) filter.sourceModule = sourceModule;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const decks = await FlashcardDeck.find(filter).sort({ updatedAt: -1 }).limit(50);

    res.status(200).json({
      success: true,
      count: decks.length,
      data: decks
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Get a single deck by ID
 * @route GET /api/v1/flashcards/decks/:id
 */
export const getDeckById = async (req, res, next) => {
  try {
    const deck = await FlashcardDeck.findById(req.params.id).populate('user', 'firstName lastName avatarUrl');
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Flashcard deck not found.' });
    }

    res.status(200).json({
      success: true,
      data: deck
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Add a manual card to an existing deck
 * @route POST /api/v1/flashcards/decks/:id/cards
 */
export const addCardToDeck = async (req, res, next) => {
  try {
    const deck = await FlashcardDeck.findById(req.params.id);
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found.' });
    }

    if (deck.user && req.user && String(deck.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this deck.' });
    }

    const {
      front,
      back,
      category = 'General',
      difficulty = 'Medium',
      tags = [],
      frontImage = null,
      backImage = null,
      latexFormula = null,
      notes = ''
    } = req.body;

    if (!front || !back) {
      return res.status(400).json({ success: false, message: 'Card Front and Back are required.' });
    }

    const newCard = {
      cardId: new mongoose.Types.ObjectId().toString(),
      front,
      back,
      category,
      difficulty,
      tags,
      frontImage,
      backImage,
      latexFormula,
      notes,
      isKnown: false,
      needsRevision: false,
      isBookmarked: false,
      reviewCount: 0,
      interval: 1,
      repetitions: 0,
      easeFactor: 2.5,
      quality: 0,
      nextReviewDate: new Date()
    };

    deck.cards.push(newCard);
    const knownCount = deck.cards.filter((c) => c.isKnown).length;
    deck.completionRate = Math.round((knownCount / deck.cards.length) * 100);

    await deck.save();

    res.status(201).json({
      success: true,
      message: 'Card added successfully.',
      data: {
        card: newCard,
        totalCards: deck.cards.length
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Update a manual card in a deck
 * @route PUT /api/v1/flashcards/decks/:id/cards/:cardId
 */
export const updateCardInDeck = async (req, res, next) => {
  try {
    const deck = await FlashcardDeck.findById(req.params.id);
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found.' });
    }

    if (deck.user && req.user && String(deck.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this card.' });
    }

    const card = deck.cards.find((c) => c.cardId === req.params.cardId);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found in deck.' });
    }

    const {
      front,
      back,
      category,
      difficulty,
      tags,
      frontImage,
      backImage,
      latexFormula,
      notes,
      isKnown,
      needsRevision,
      isBookmarked
    } = req.body;

    if (front !== undefined) card.front = front;
    if (back !== undefined) card.back = back;
    if (category !== undefined) card.category = category;
    if (difficulty !== undefined) card.difficulty = difficulty;
    if (tags !== undefined) card.tags = tags;
    if (frontImage !== undefined) card.frontImage = frontImage;
    if (backImage !== undefined) card.backImage = backImage;
    if (latexFormula !== undefined) card.latexFormula = latexFormula;
    if (notes !== undefined) card.notes = notes;
    if (isKnown !== undefined) card.isKnown = isKnown;
    if (needsRevision !== undefined) card.needsRevision = needsRevision;
    if (isBookmarked !== undefined) card.isBookmarked = isBookmarked;

    const knownCount = deck.cards.filter((c) => c.isKnown).length;
    deck.completionRate = Math.round((knownCount / deck.cards.length) * 100);

    await deck.save();

    res.status(200).json({
      success: true,
      message: 'Card updated successfully.',
      data: card
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Delete a card from a deck
 * @route DELETE /api/v1/flashcards/decks/:id/cards/:cardId
 */
export const deleteCardFromDeck = async (req, res, next) => {
  try {
    const deck = await FlashcardDeck.findById(req.params.id);
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found.' });
    }

    if (deck.user && req.user && String(deck.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete cards from this deck.' });
    }

    const initialCount = deck.cards.length;
    deck.cards = deck.cards.filter((c) => c.cardId !== req.params.cardId);

    if (deck.cards.length === initialCount) {
      return res.status(404).json({ success: false, message: 'Card not found in deck.' });
    }

    const knownCount = deck.cards.filter((c) => c.isKnown).length;
    deck.completionRate = deck.cards.length > 0 ? Math.round((knownCount / deck.cards.length) * 100) : 0;

    await deck.save();

    res.status(200).json({
      success: true,
      message: 'Card deleted successfully.',
      data: { remainingCards: deck.cards.length }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Delete an entire deck
 * @route DELETE /api/v1/flashcards/decks/:id
 */
export const deleteDeck = async (req, res, next) => {
  try {
    const deck = await FlashcardDeck.findById(req.params.id);
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found.' });
    }
    if (deck.user && req.user && String(deck.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this deck.' });
    }

    await FlashcardDeck.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Deck deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Update a single card status (SM-2 rating, Known, Needs Revision, Bookmark) & update XP/streak
 * @route PUT /api/v1/flashcards/card-status
 */
export const updateCardStatus = async (req, res, next) => {
  try {
    const { deckId, cardId, isKnown, needsRevision, isBookmarked, quality } = req.body;
    const userId = req.user?._id || null;

    let targetCard = null;

    if (deckId) {
      const deck = await FlashcardDeck.findById(deckId);
      if (deck) {
        const cardIndex = deck.cards.findIndex((c) => c.cardId === cardId);
        if (cardIndex !== -1) {
          if (isKnown !== undefined) deck.cards[cardIndex].isKnown = isKnown;
          if (needsRevision !== undefined) deck.cards[cardIndex].needsRevision = needsRevision;
          if (isBookmarked !== undefined) deck.cards[cardIndex].isBookmarked = isBookmarked;
          deck.cards[cardIndex].reviewCount = (deck.cards[cardIndex].reviewCount || 0) + 1;
          deck.cards[cardIndex].lastReviewedAt = new Date();

          // Calculate SM-2 Spaced Repetition values
          const rating = quality !== undefined ? Number(quality) : isKnown ? 4 : needsRevision ? 2 : 3;
          const sm2 = calculateSM2(
            rating,
            deck.cards[cardIndex].repetitions || 0,
            deck.cards[cardIndex].interval || 1,
            deck.cards[cardIndex].easeFactor || 2.5
          );

          deck.cards[cardIndex].quality = sm2.quality;
          deck.cards[cardIndex].repetitions = sm2.repetitions;
          deck.cards[cardIndex].interval = sm2.interval;
          deck.cards[cardIndex].easeFactor = sm2.easeFactor;
          deck.cards[cardIndex].nextReviewDate = sm2.nextReviewDate;

          const knownCount = deck.cards.filter((c) => c.isKnown).length;
          deck.completionRate = Math.round((knownCount / deck.cards.length) * 100);

          await deck.save();
          targetCard = deck.cards[cardIndex];
        }
      }
    }

    // Update user's aggregate progress, XP, badges, and streak
    let progress = null;
    if (userId) {
      progress = await trackProgressUpdate(userId, {
        isKnown,
        needsRevision,
        isBookmarked,
        card: targetCard || { cardId, category: 'General' },
        deckId,
        quality: quality !== undefined ? Number(quality) : isKnown ? 4 : 2
      });
    }

    res.status(200).json({
      success: true,
      data: {
        cardId,
        isKnown,
        needsRevision,
        isBookmarked,
        sm2: targetCard
          ? {
              interval: targetCard.interval,
              repetitions: targetCard.repetitions,
              easeFactor: targetCard.easeFactor,
              nextReviewDate: targetCard.nextReviewDate
            }
          : null,
        progress: progress
          ? {
              dailyStreak: progress.dailyStreak,
              longestStreak: progress.longestStreak,
              totalReviewed: progress.totalReviewed,
              totalKnown: progress.totalKnown,
              totalNeedsRevision: progress.totalNeedsRevision,
              totalXP: progress.totalXP,
              level: progress.level,
              badges: progress.badges
            }
          : null
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Get deep analytics for a specific deck
 * @route GET /api/v1/flashcards/decks/:id/analytics
 */
export const getDeckAnalytics = async (req, res, next) => {
  try {
    const deck = await FlashcardDeck.findById(req.params.id);
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found.' });
    }

    const now = new Date();
    const totalCards = deck.cards.length;
    const masteredCount = deck.cards.filter((c) => c.isKnown || (c.repetitions || 0) >= 3).length;
    const needsRevisionCount = deck.cards.filter((c) => c.needsRevision).length;
    const bookmarkedCount = deck.cards.filter((c) => c.isBookmarked).length;
    const dueCount = deck.cards.filter((c) => !c.nextReviewDate || new Date(c.nextReviewDate) <= now).length;

    // SM-2 Stages
    const stages = {
      learning: deck.cards.filter((c) => (c.repetitions || 0) <= 1).length,
      reviewing: deck.cards.filter((c) => (c.repetitions || 0) > 1 && (c.repetitions || 0) < 5).length,
      mastered: deck.cards.filter((c) => (c.repetitions || 0) >= 5).length
    };

    // Average Ease Factor
    const totalEase = deck.cards.reduce((acc, c) => acc + (c.easeFactor || 2.5), 0);
    const avgEaseFactor = totalCards > 0 ? Number((totalEase / totalCards).toFixed(2)) : 2.5;

    // Difficulty breakdown
    const difficultyDistribution = {
      Easy: deck.cards.filter((c) => c.difficulty === 'Easy').length,
      Medium: deck.cards.filter((c) => c.difficulty === 'Medium').length,
      Hard: deck.cards.filter((c) => c.difficulty === 'Hard').length
    };

    // Retention rate
    const reviewedTotal = masteredCount + needsRevisionCount;
    const retentionRate = reviewedTotal > 0 ? Math.round((masteredCount / reviewedTotal) * 100) : 100;

    res.status(200).json({
      success: true,
      data: {
        deckId: deck._id,
        title: deck.title,
        category: deck.category,
        totalCards,
        masteredCount,
        needsRevisionCount,
        bookmarkedCount,
        dueCount,
        completionRate: deck.completionRate || 0,
        retentionRate,
        avgEaseFactor,
        stages,
        difficultyDistribution,
        lastReviewedAt: deck.updatedAt
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Get public/community shared decks
 * @route GET /api/v1/flashcards/community
 */
export const getPublicCommunityDecks = async (req, res, next) => {
  try {
    const { category, search, difficulty, limit = 30 } = req.query;

    const filter = { isPublic: true };
    if (category && category !== 'All') filter.category = category;
    if (difficulty && difficulty !== 'All') filter.difficulty = difficulty;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const decks = await FlashcardDeck.find(filter)
      .populate('user', 'firstName lastName avatarUrl')
      .sort({ likes: -1, forkCount: -1, createdAt: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: decks.length,
      data: decks
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Fork / Clone a community deck into user's personal decks
 * @route POST /api/v1/flashcards/decks/:id/fork
 */
export const forkPublicDeck = async (req, res, next) => {
  try {
    const originalDeck = await FlashcardDeck.findById(req.params.id);
    if (!originalDeck) {
      return res.status(404).json({ success: false, message: 'Original deck not found.' });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required to fork decks.' });
    }

    // Reset card progress for the clone
    const clonedCards = originalDeck.cards.map((c) => ({
      cardId: crypto.randomUUID(),
      front: c.front,
      back: c.back,
      category: c.category,
      difficulty: c.difficulty,
      tags: c.tags,
      frontImage: c.frontImage || null,
      backImage: c.backImage || null,
      latexFormula: c.latexFormula || null,
      notes: c.notes || '',
      isKnown: false,
      needsRevision: false,
      isBookmarked: false,
      reviewCount: 0,
      interval: 1,
      repetitions: 0,
      easeFactor: 2.5,
      quality: 0,
      nextReviewDate: new Date()
    }));

    const forkedDeck = await FlashcardDeck.create({
      user: userId,
      title: `${originalDeck.title} (Forked)`,
      description: originalDeck.description,
      sourceModule: 'community',
      category: originalDeck.category,
      subject: originalDeck.subject,
      difficulty: originalDeck.difficulty,
      tags: originalDeck.tags,
      cards: clonedCards,
      isPublic: false,
      originalAuthor: originalDeck.user
    });

    originalDeck.forkCount = (originalDeck.forkCount || 0) + 1;
    await originalDeck.save();

    res.status(201).json({
      success: true,
      message: 'Deck successfully cloned to your collection.',
      data: forkedDeck
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Like / Upvote a deck
 * @route POST /api/v1/flashcards/decks/:id/like
 */
export const toggleLikeDeck = async (req, res, next) => {
  try {
    const deck = await FlashcardDeck.findById(req.params.id);
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found.' });
    }

    deck.likes = (deck.likes || 0) + 1;
    await deck.save();

    res.status(200).json({
      success: true,
      data: { likes: deck.likes }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Get user's flashcard progress, XP, badges, heatmap, and review stats
 * @route GET /api/v1/flashcards/stats
 */
export const getUserFlashcardStats = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const now = new Date();

    let progress = null;
    if (userId) {
      progress = await FlashcardProgress.findOne({ userId });
    }

    if (!progress) {
      progress = {
        dailyStreak: 0,
        longestStreak: 0,
        totalReviewed: 0,
        totalKnown: 0,
        totalNeedsRevision: 0,
        totalXP: 0,
        level: 1,
        badges: [],
        reviewHeatmap: [],
        weakTopics: [],
        bookmarkedCards: [],
        dailyReminder: { enabled: true, reminderTime: '19:00', emailNotification: false }
      };
    }

    // Calculate completion percentage
    const total = (progress.totalKnown || 0) + (progress.totalNeedsRevision || 0);
    const completionPercentage = total > 0 ? Math.round(((progress.totalKnown || 0) / total) * 100) : 0;

    // Fetch user's recent decks
    const recentDecks = userId
      ? await FlashcardDeck.find({ user: userId }).sort({ updatedAt: -1 }).limit(6)
      : [];

    // Count real due cards
    let dueTodayCount = 0;
    if (userId) {
      const allUserDecks = await FlashcardDeck.find({ user: userId });
      allUserDecks.forEach((d) => {
        d.cards.forEach((c) => {
          if (!c.nextReviewDate || new Date(c.nextReviewDate) <= now) {
            dueTodayCount += 1;
          }
        });
      });
    }

    res.status(200).json({
      success: true,
      data: {
        dailyStreak: progress.dailyStreak || 0,
        longestStreak: progress.longestStreak || 0,
        totalReviewed: progress.totalReviewed || 0,
        totalKnown: progress.totalKnown || 0,
        totalNeedsRevision: progress.totalNeedsRevision || 0,
        totalXP: progress.totalXP || 0,
        level: progress.level || 1,
        badges: progress.badges || [],
        reviewHeatmap: progress.reviewHeatmap || [],
        completionPercentage,
        weakTopics: progress.weakTopics || [],
        bookmarkedCount: progress.bookmarkedCards ? progress.bookmarkedCards.length : 0,
        dueTodayCount,
        dailyReminder: progress.dailyReminder,
        recentDecks
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Get & update review reminder settings
 * @route GET /api/v1/flashcards/reminders
 * @route PUT /api/v1/flashcards/reminders
 */
export const getReminderSettings = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });

    const progress = await FlashcardProgress.findOne({ userId });
    res.status(200).json({
      success: true,
      data: progress?.dailyReminder || { enabled: true, reminderTime: '19:00', emailNotification: false }
    });
  } catch (err) {
    next(err);
  }
};

export const updateReminderSettings = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });

    const { enabled, reminderTime, emailNotification } = req.body;
    let progress = await FlashcardProgress.findOne({ userId });
    if (!progress) {
      progress = new FlashcardProgress({ userId });
    }

    progress.dailyReminder = {
      enabled: enabled !== undefined ? enabled : progress.dailyReminder?.enabled ?? true,
      reminderTime: reminderTime || progress.dailyReminder?.reminderTime || '19:00',
      emailNotification: emailNotification !== undefined ? emailNotification : progress.dailyReminder?.emailNotification ?? false
    };

    await progress.save();

    res.status(200).json({
      success: true,
      message: 'Reminder preferences saved.',
      data: progress.dailyReminder
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Smart AI Recommendations before exams, interviews, and after low scores
 * @route GET /api/v1/flashcards/recommended
 */
export const getRecommendedFlashcards = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const recommendations = [];

    // 1. Check for upcoming exams in the next 14 days
    try {
      const upcomingExams = await ExamSchedule.find({
        examDate: { $gte: new Date() }
      })
        .sort({ examDate: 1 })
        .limit(2);

      if (upcomingExams.length > 0) {
        upcomingExams.forEach((exam) => {
          recommendations.push({
            reason: `🗓️ Exam in ${Math.ceil((new Date(exam.examDate) - new Date()) / (1000 * 60 * 60 * 24))} days (${exam.courseCode})`,
            type: 'exam_revision',
            title: `${exam.courseCode} High-Yield Exam Revision`,
            sourceModule: 'paper_generator',
            urgency: 'high',
            subject: exam.courseCode,
            description: `Review critical theorems, formulas, and high-frequency exam questions for ${exam.courseName || exam.courseCode}.`
          });
        });
      }
    } catch (_) {}

    // 2. Check for low quiz attempts in database
    try {
      if (userId) {
        const student = await Student.findOne({ userId });
        if (student) {
          const lowQuizzes = await Quiz.find({
            'attempts.student': student._id,
            'attempts.percentage': { $lt: 70 }
          })
            .sort({ updatedAt: -1 })
            .limit(1);

          if (lowQuizzes.length > 0) {
            recommendations.push({
              reason: `⚠️ Low Quiz Score detected in ${lowQuizzes[0].topic}`,
              type: 'quiz_remedial',
              title: `${lowQuizzes[0].topic}: Remedial Concepts Deck`,
              sourceModule: 'quiz',
              urgency: 'medium',
              subject: lowQuizzes[0].topic,
              description: `Strengthen the core concepts you missed in your recent quiz attempt.`
            });
          }
        }
      }
    } catch (_) {}

    // 3. Interview Booster
    recommendations.push({
      reason: '🎯 Target Placement Readiness Booster',
      type: 'role_interview',
      title: 'Top 10 Fullstack & Cloud Technical Questions',
      sourceModule: 'mock_interview',
      urgency: 'medium',
      subject: 'Interview Prep',
      description: 'Frequently asked FAANG/Tier-1 questions covering System Design, React, Node.js, and Cloud architectures.'
    });

    res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Get all cards scheduled for review today according to SM-2 spaced repetition
 * @route GET /api/v1/flashcards/due-today
 */
export const getDueTodayCards = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const now = new Date();

    const dueCards = [];

    if (userId) {
      const decks = await FlashcardDeck.find({ user: userId });
      decks.forEach((deck) => {
        deck.cards.forEach((card) => {
          const isDue = !card.nextReviewDate || new Date(card.nextReviewDate) <= now;
          if (isDue) {
            dueCards.push({
              cardId: card.cardId,
              front: card.front,
              back: card.back,
              category: card.category,
              difficulty: card.difficulty,
              tags: card.tags,
              frontImage: card.frontImage,
              backImage: card.backImage,
              latexFormula: card.latexFormula,
              notes: card.notes,
              isKnown: card.isKnown,
              needsRevision: card.needsRevision,
              isBookmarked: card.isBookmarked,
              reviewCount: card.reviewCount,
              interval: card.interval || 1,
              repetitions: card.repetitions || 0,
              easeFactor: card.easeFactor || 2.5,
              quality: card.quality || 0,
              nextReviewDate: card.nextReviewDate,
              deckId: deck._id,
              deckTitle: deck.title,
              sourceModule: deck.sourceModule
            });
          }
        });
      });
    }

    res.status(200).json({
      success: true,
      count: dueCards.length,
      data: dueCards
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Export a flashcard deck to Anki format (.tsv / .txt)
 * @route GET /api/v1/flashcards/decks/:id/export-anki
 */
export const exportDeckToAnki = async (req, res, next) => {
  try {
    const deck = await FlashcardDeck.findById(req.params.id);
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found.' });
    }

    // Format Anki header & TSV
    let ankiContent = `#separator:tab\n#html:true\n#tags column:4\n#deck:${deck.title}\n`;
    deck.cards.forEach((c) => {
      const cleanFront = c.front.replace(/\t/g, ' ').replace(/\n/g, '<br>');
      const cleanBack = c.back.replace(/\t/g, ' ').replace(/\n/g, '<br>');
      const category = (c.category || 'General').replace(/\t/g, ' ');
      const tags = (c.tags || []).join(' ');
      ankiContent += `${cleanFront}\t${cleanBack}\t${category}\t${tags}\n`;
    });

    res.setHeader('Content-Type', 'text/tab-separated-values; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${deck.title.replace(/[^a-z0-9]/gi, '_')}_anki.txt"`);
    return res.send(ankiContent);
  } catch (err) {
    next(err);
  }
};
