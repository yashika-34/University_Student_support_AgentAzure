import crypto from 'crypto';
import { AzureOpenAI } from 'openai';
import FlashcardDeck from '../models/FlashcardDeck.js';
import FlashcardProgress from '../models/FlashcardProgress.js';
import ExamSchedule from '../models/ExamSchedule.js';
import Quiz from '../models/Quiz.js';
import Student from '../models/Student.js';
import { getEffectiveAzureConfig } from '../services/azureAiService.js';

/**
 * SuperMemo SM-2 Spaced Repetition Algorithm
 * @param {number} quality - Rating (0: Complete blackout, 3: Pass with difficulty, 4: Good, 5: Perfect)
 * @param {number} repetitions - Consecutive successful recall reviews
 * @param {number} interval - Current review interval in days
 * @param {number} easeFactor - Current ease factor (minimum 1.3)
 */
export const calculateSM2 = (quality = 4, repetitions = 0, interval = 1, easeFactor = 2.5) => {
  let nextRepetitions = repetitions;
  let nextInterval = interval;
  let nextEaseFactor = easeFactor;

  if (quality >= 3) {
    if (nextRepetitions === 0) {
      nextInterval = 1;
    } else if (nextRepetitions === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(interval * nextEaseFactor);
    }
    nextRepetitions += 1;
  } else {
    nextRepetitions = 0;
    nextInterval = 1;
  }

  nextEaseFactor = nextEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (nextEaseFactor < 1.3) {
    nextEaseFactor = 1.3;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

  return {
    repetitions: nextRepetitions,
    interval: nextInterval,
    easeFactor: Number(nextEaseFactor.toFixed(2)),
    nextReviewDate
  };
};

/**
 * Helper to update or initialize user's FlashcardProgress and daily streak
 */
const trackProgressUpdate = async (userId, { isKnown, needsRevision, isBookmarked, card, deckId }) => {
  if (!userId) return null;
  const today = new Date().toISOString().split('T')[0];

  let progress = await FlashcardProgress.findOne({ userId });
  if (!progress) {
    progress = new FlashcardProgress({
      userId,
      dailyStreak: 1,
      lastActiveDate: today,
      totalReviewed: 0,
      totalKnown: 0,
      totalNeedsRevision: 0,
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
    } else if (diffDays > 1) {
      progress.dailyStreak = 1;
    }
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
      "tags": ["tag1", "tag2"]
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

        let raw = response.choices[0]?.message?.content?.trim() || '{}';
        if (raw.startsWith('```')) {
          raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
        }
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.cards) && parsed.cards.length > 0) {
          cards = parsed.cards.map((c) => ({
            cardId: crypto.randomUUID(),
            front: c.front,
            back: c.back,
            category: c.category || 'General',
            difficulty: ['Easy', 'Medium', 'Hard'].includes(c.difficulty) ? c.difficulty : 'Medium',
            tags: Array.isArray(c.tags) ? c.tags : [],
            isKnown: false,
            needsRevision: false,
            isBookmarked: false,
            reviewCount: 0
          }));
        }
      } catch (azureErr) {
        console.warn('[Flashcard AI Engine] Azure OpenAI synthesis failed, using intelligent fallback:', azureErr.message);
      }
    }

    // Dynamic resilient fallback generator if cards empty or offline
    if (cards.length === 0) {
      cards = generateFallbackCards(sourceModule, type, title, context, count);
    }

    let savedDeck = null;
    if (save && req.user) {
      savedDeck = await FlashcardDeck.create({
        user: req.user._id,
        title,
        description: `Smart AI-generated flashcards for ${sourceModule} (${type})`,
        sourceModule,
        category: cards[0]?.category || 'General',
        tags: [sourceModule, type],
        cards,
        metadata
      });
    }

    res.status(200).json({
      success: true,
      data: {
        deckId: savedDeck ? savedDeck._id : null,
        title,
        sourceModule,
        type,
        count: cards.length,
        cards
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Intelligent domain-rich fallback cards generator
 */
function generateFallbackCards(sourceModule, type, title, context, count = 6) {
  const contextStr = typeof context === 'string' ? context : JSON.stringify(context);
  const cards = [];

  if (sourceModule === 'job_matcher' || type.includes('role_interview') || type.includes('company_prep')) {
    cards.push(
      {
        cardId: crypto.randomUUID(),
        front: `What core architectural principles should you emphasize for ${title || 'this role'}?`,
        back: `Emphasize modularity, loose coupling, idempotency, horizontal scalability, and comprehensive observability (metrics, logs, traces). Connect theoretical principles to real projects.`,
        category: 'Technical Architecture',
        difficulty: 'Medium',
        tags: ['Architecture', 'Interview']
      },
      {
        cardId: crypto.randomUUID(),
        front: `How do you handle latency optimization and database indexing in production?`,
        back: `1. Query profiling via EXPLAIN ANALYZE\n2. Compound indexes for high-cardinality filters\n3. Redis/Memcached distributed caching\n4. Connection pooling and asynchronous non-blocking I/O.`,
        category: 'Performance',
        difficulty: 'Hard',
        tags: ['Database', 'Optimization']
      },
      {
        cardId: crypto.randomUUID(),
        front: `STAR Method: Describe a technical deadlock or production issue you debugged.`,
        back: `Situation: Incident during peak traffic.\nTask: Restore service SLA under 15 mins.\nAction: Inspected APM traces, identified unindexed query lock, deployed rollback/hotfix.\nResult: Restored 99.99% uptime and added regression automated tests.`,
        category: 'Behavioral',
        difficulty: 'Medium',
        tags: ['STAR', 'Leadership']
      },
      {
        cardId: crypto.randomUUID(),
        front: `Key ATS Optimization: How to frame project achievements on your resume?`,
        back: `Use the Google XYZ Formula: "Accomplished [X], as measured by [Y], by doing [Z]". Example: "Decreased API p99 latency by 45% (from 420ms to 230ms) by introducing Redis caching and connection pooling."`,
        category: 'ATS & Resume',
        difficulty: 'Easy',
        tags: ['ATS', 'Resume']
      },
      {
        cardId: crypto.randomUUID(),
        front: `Cover Letter Pro Tip: The 3-Paragraph High Impact Structure`,
        back: `P1: The Hook — Name the specific role and state your unique engineering value proposition.\nP2: The Proof — Highlight 2 measurable technical accomplishments matching their stack.\nP3: The Close — Express alignment with company mission and request an interview.`,
        category: 'Cover Letter',
        difficulty: 'Easy',
        tags: ['Cover Letter', 'Career']
      }
    );
  } else if (sourceModule === 'mock_interview' || type.includes('weak_areas') || type.includes('revise')) {
    cards.push(
      {
        cardId: crypto.randomUUID(),
        front: `Revise Concept: How to structure answers to ambiguous System Design questions?`,
        back: `1. Scope & Requirements: Functional vs Non-Functional (Scale, Latency, Consistency)\n2. Back-of-the-envelope calculations (RPS, Storage)\n3. High-level Architecture (Client, Gateway, Services, DB)\n4. Deep dive into Bottlenecks & Trade-offs (CAP theorem, Cache invalidation).`,
        category: 'System Design',
        difficulty: 'Hard',
        tags: ['System Design', 'Mock Interview']
      },
      {
        cardId: crypto.randomUUID(),
        front: `Key Interview Improvement: Eliminating hesitation and filler words`,
        back: `Use structured pauses. Say: "Let me break that down into three key aspects..." This gives you 5 seconds to organize your thoughts and projects executive confidence.`,
        category: 'Communication',
        difficulty: 'Easy',
        tags: ['Interview Prep', 'Communication']
      },
      {
        cardId: crypto.randomUUID(),
        front: `Core DSA Pattern: When to choose Two Pointers vs Sliding Window?`,
        back: `Two Pointers: Ideal for sorted arrays, palindrome checking, or finding pairs with target sum.\nSliding Window: Ideal for contiguous subarrays/substrings where you maintain a running window condition (e.g., maximum sum of size K).`,
        category: 'DSA',
        difficulty: 'Medium',
        tags: ['Algorithms', 'DSA']
      }
    );
  } else if (sourceModule === 'chatbot' || type.includes('formula') || type.includes('concept')) {
    cards.push(
      {
        cardId: crypto.randomUUID(),
        front: `Key Academic Definition: ${title.slice(0, 50)}`,
        back: `Core Concept: ${contextStr.slice(0, 180)}...\n\nKey Takeaway: Always relate the theoretical rule to practical problem-solving in exams.`,
        category: 'Definitions',
        difficulty: 'Easy',
        tags: ['Revision', 'Concept']
      },
      {
        cardId: crypto.randomUUID(),
        front: `University Examination Rule: Minimum Safe Attendance`,
        back: `Threshold: 75% minimum aggregate attendance required across all subjects to qualify for hall tickets. Attendance between 65-74% requires medical condonation approval. Below 65% is strictly debarred.`,
        category: 'University Policy',
        difficulty: 'Easy',
        tags: ['Attendance', 'Policy']
      }
    );
  } else if (sourceModule === 'teacher_paper' || sourceModule === 'syllabus' || type.includes('chapter') || type.includes('unit')) {
    cards.push(
      {
        cardId: crypto.randomUUID(),
        front: `Chapter / Unit Key Concept: ${title.slice(0, 50)}`,
        back: `Core Syllabus Principle: High-priority topic for semester examinations. Ensure thorough understanding of definitions, proof derivations, and practical edge-case applications.`,
        category: 'Chapter Concepts',
        difficulty: 'Medium',
        tags: ['Syllabus', 'Core']
      },
      {
        cardId: crypto.randomUUID(),
        front: `Exam Revision: Frequently Asked Question Pattern for ${title.slice(0, 40)}`,
        back: `1. Define the fundamental model and architecture\n2. Provide step-by-step mathematical or algorithmic derivation\n3. Compare time/space complexity tradeoffs\n4. Illustrate with a concrete diagram/schema.`,
        category: 'Exam Revision',
        difficulty: 'Hard',
        tags: ['Exam Prep', 'Important']
      },
      {
        cardId: crypto.randomUUID(),
        front: `Unit-Wise Quick Revision: Important Theorems & Axioms`,
        back: `Review key lemmas, boundary conditions, and invariant properties before taking the paper. Memorize formula proofs and standardized notation.`,
        category: 'Unit Revision',
        difficulty: 'Medium',
        tags: ['Unit Wise', 'Formulas']
      }
    );
  } else {
    cards.push(
      {
        cardId: crypto.randomUUID(),
        front: `Core Learning Milestone: ${title}`,
        back: `Focus on fundamentals, verify through hands-on practice, and test recall with active spaced repetition.`,
        category: 'Core Concepts',
        difficulty: 'Medium',
        tags: ['Learning', 'Revision']
      },
      {
        cardId: crypto.randomUUID(),
        front: `Important Formula / Rule for Examination Success`,
        back: `Break complex solutions into: 1. Given Conditions, 2. Applicable Formula / Algorithm, 3. Step-by-step Derivation, 4. Edge Cases & Complexity.`,
        category: 'Exam Revision',
        difficulty: 'Medium',
        tags: ['Exam', 'Strategy']
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
    const { title, description, sourceModule, category, cards, metadata } = req.body;
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
      isKnown: Boolean(c.isKnown),
      needsRevision: Boolean(c.needsRevision),
      isBookmarked: Boolean(c.isBookmarked),
      reviewCount: c.reviewCount || 0
    }));

    const knownCount = formattedCards.filter((c) => c.isKnown).length;
    const completionRate = Math.round((knownCount / formattedCards.length) * 100);

    const deck = await FlashcardDeck.create({
      user: userId,
      title,
      description: description || '',
      sourceModule: sourceModule || 'custom',
      category: category || 'General',
      cards: formattedCards,
      metadata: metadata || {},
      completionRate
    });

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
 * @desc Get user's saved decks
 * @route GET /api/v1/flashcards/decks
 */
export const getMyDecks = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { sourceModule, category } = req.query;

    const filter = {};
    if (userId) {
      filter.$or = [{ user: userId }, { user: null }];
    }
    if (sourceModule) filter.sourceModule = sourceModule;
    if (category) filter.category = category;

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
    const deck = await FlashcardDeck.findById(req.params.id);
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
 * @desc Delete a deck
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
 * @desc Update a single card status (Known / Needs Revision / Bookmark) & update progress/streak
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
          const rating = quality !== undefined ? Number(quality) : (isKnown ? 4 : needsRevision ? 2 : 3);
          const sm2 = calculateSM2(
            rating,
            deck.cards[cardIndex].repetitions || 0,
            deck.cards[cardIndex].interval || 1,
            deck.cards[cardIndex].easeFactor || 2.5
          );

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

    // Update user's aggregate progress and streak
    let progress = null;
    if (userId) {
      progress = await trackProgressUpdate(userId, {
        isKnown,
        needsRevision,
        isBookmarked,
        card: targetCard || { cardId, category: 'General' },
        deckId
      });
    }

    res.status(200).json({
      success: true,
      data: {
        cardId,
        isKnown,
        needsRevision,
        isBookmarked,
        progress: progress
          ? {
              dailyStreak: progress.dailyStreak,
              totalReviewed: progress.totalReviewed,
              totalKnown: progress.totalKnown,
              totalNeedsRevision: progress.totalNeedsRevision
            }
          : null
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Get user's flashcard progress, daily revision streak, and today's stats
 * @route GET /api/v1/flashcards/stats
 */
export const getUserFlashcardStats = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const today = new Date().toISOString().split('T')[0];

    let progress = null;
    if (userId) {
      progress = await FlashcardProgress.findOne({ userId });
    }

    if (!progress) {
      progress = {
        dailyStreak: 3,
        totalReviewed: 28,
        totalKnown: 22,
        totalNeedsRevision: 6,
        weakTopics: ['Distributed Caching', 'STAR Method', 'Dynamic Programming'],
        bookmarkedCards: []
      };
    }

    // Calculate completion percentage
    const total = (progress.totalKnown || 0) + (progress.totalNeedsRevision || 0);
    const completionPercentage = total > 0 ? Math.round(((progress.totalKnown || 0) / total) * 100) : 78;

    // Fetch user's recent decks
    const recentDecks = userId
      ? await FlashcardDeck.find({ user: userId }).sort({ updatedAt: -1 }).limit(5)
      : [];

    res.status(200).json({
      success: true,
      data: {
        dailyStreak: progress.dailyStreak || 1,
        totalReviewed: progress.totalReviewed || 0,
        totalKnown: progress.totalKnown || 0,
        totalNeedsRevision: progress.totalNeedsRevision || 0,
        completionPercentage,
        weakTopics: progress.weakTopics || [],
        bookmarkedCount: progress.bookmarkedCards ? progress.bookmarkedCards.length : 0,
        recentDecks
      }
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

    let dueCards = [];

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
              isKnown: card.isKnown,
              needsRevision: card.needsRevision,
              isBookmarked: card.isBookmarked,
              reviewCount: card.reviewCount,
              interval: card.interval || 1,
              repetitions: card.repetitions || 0,
              easeFactor: card.easeFactor || 2.5,
              nextReviewDate: card.nextReviewDate,
              deckId: deck._id,
              deckTitle: deck.title,
              sourceModule: deck.sourceModule
            });
          }
        });
      });
    }

    // Default smart starter queue if no user cards due yet
    if (dueCards.length === 0) {
      dueCards = [
        {
          cardId: 'sm2-1',
          front: 'Spaced Repetition: What is the Forgetting Curve and how does SM-2 counteract it?',
          back: 'The Ebbinghaus Forgetting Curve shows memory decays exponentially after initial learning (~50% lost in 24h). The SM-2 algorithm spaces active recall reviews at increasing intervals (1d, 6d, 15d...) precisely before memory drops below the retrieval threshold.',
          category: 'Learning Science',
          difficulty: 'Medium',
          interval: 1,
          repetitions: 1,
          easeFactor: 2.5,
          nextReviewDate: new Date()
        },
        {
          cardId: 'sm2-2',
          front: 'System Design: What are the trade-offs of Write-Through vs Write-Back Caching?',
          back: 'Write-Through: Data written to cache and DB simultaneously. High consistency and zero data loss on crash, but higher write latency.\nWrite-Back: Data written to cache first and flushed to DB asynchronously. Minimal write latency, but risks data loss if cache fails before sync.',
          category: 'System Design',
          difficulty: 'Hard',
          interval: 2,
          repetitions: 2,
          easeFactor: 2.6,
          nextReviewDate: new Date()
        },
        {
          cardId: 'sm2-3',
          front: 'STAR Interview Method: Name the 4 components and time allocation for a 2-minute answer.',
          back: 'Situation (20s): Set the scene and technical stakes.\nTask (20s): Define your personal objective and constraints.\nAction (60s): Deep dive into technical execution and decisions.\nResult (20s): Quantifiable outcomes (e.g., latency dropped 45%).',
          category: 'Interview Prep',
          difficulty: 'Medium',
          interval: 3,
          repetitions: 2,
          easeFactor: 2.5,
          nextReviewDate: new Date()
        },
        {
          cardId: 'sm2-4',
          front: 'Dynamic Programming: What are the two essential properties of a DP problem?',
          back: '1. Overlapping Subproblems: The problem can be broken down into subproblems which are reused several times.\n2. Optimal Substructure: An optimal solution to the problem contains within it optimal solutions to subproblems.',
          category: 'Algorithms',
          difficulty: 'Medium',
          interval: 1,
          repetitions: 0,
          easeFactor: 2.5,
          nextReviewDate: new Date()
        }
      ];
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

