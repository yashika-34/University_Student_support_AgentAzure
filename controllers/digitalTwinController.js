import DigitalTwin from '../models/DigitalTwin.js';
import TwinConversation from '../models/TwinConversation.js';
import Faculty from '../models/Faculty.js';
import { AzureOpenAI } from 'openai';
import pdfParse from 'pdf-parse';

// ── Helpers ──────────────────────────────────────────────────────────────────

const getAIClient = () => {
  return new AzureOpenAI({
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4.1-mini'
  });
};

const PERSONALITY_STYLES = {
  friendly: 'You are warm, approachable, and encouraging. Use simple language, emojis occasionally, and always make students feel comfortable asking questions.',
  formal: 'You are professional and academic. Use formal language, structured answers, and refer to concepts precisely.',
  socratic: 'You guide students to discover answers themselves by asking thought-provoking follow-up questions rather than giving direct answers.',
  encouraging: 'You are extremely motivating and positive. Celebrate student curiosity, use lots of positive reinforcement, and help students build confidence.',
  strict: 'You are demanding and rigorous. Expect precision in questions, push students to think deeper, and maintain high academic standards.'
};

// ── GET or CREATE twin for the logged-in faculty ─────────────────────────────

export const getMyTwin = async (req, res) => {
  try {
    let faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
    }

    let twin = await DigitalTwin.findOne({ createdBy: req.user._id });

    if (!twin) {
      twin = await DigitalTwin.create({
        faculty: faculty._id,
        createdBy: req.user._id,
        twinName: `Prof. ${req.user.firstName || req.user.fullName?.split(' ')[0] || 'AI'}'s Assistant`,
        subject: 'General Course',
        knowledgeBase: [],
        faqs: []
      });
    }

    res.json({ success: true, twin });
  } catch (err) {
    console.error('getMyTwin error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching twin.' });
  }
};

export const updateMyTwin = async (req, res) => {
  try {
    const { twinName, subject, personality, greetingMessage, avatarEmoji } = req.body;

    const twin = await DigitalTwin.findOneAndUpdate(
      { createdBy: req.user._id },
      { twinName, subject, personality, greetingMessage, avatarEmoji },
      { new: true, upsert: false }
    );

    if (!twin) {
      return res.status(404).json({ success: false, message: 'Twin not found.' });
    }

    res.json({ success: true, message: 'Twin updated successfully!', twin });
  } catch (err) {
    console.error('updateMyTwin error:', err);
    res.status(500).json({ success: false, message: 'Failed to update twin.' });
  }
};

export const addKnowledge = async (req, res) => {
  try {
    const twin = await DigitalTwin.findOne({ createdBy: req.user._id });
    if (!twin) {
      return res.status(404).json({ success: false, message: 'Digital Twin not found.' });
    }

    let content = '';
    let fileName = 'Manual Entry';
    const docType = req.body.type || 'lecture_notes';
    const title = req.body.title || 'Uploaded Document';

    if (req.file) {
      const parsed = await pdfParse(req.file.buffer);
      content = parsed.text?.trim();
      fileName = req.file.originalname;
      if (!content) {
        return res.status(400).json({ success: false, message: 'Could not extract text from the PDF.' });
      }
    } else if (req.body.content) {
      content = req.body.content.trim();
    } else {
      return res.status(400).json({ success: false, message: 'No content provided.' });
    }

    if (content.length > 25000) {
      content = content.substring(0, 25000) + '\n\n[Content truncated to 25,000 characters]';
    }

    twin.knowledgeBase.push({ type: docType, title, content, fileName });
    await twin.save();

    res.json({ success: true, message: 'Knowledge added to your Digital Twin!', knowledgeCount: twin.knowledgeBase.length });
  } catch (err) {
    console.error('addKnowledge error:', err);
    res.status(500).json({ success: false, message: 'Failed to add knowledge.' });
  }
};

export const deleteKnowledge = async (req, res) => {
  try {
    const twin = await DigitalTwin.findOne({ createdBy: req.user._id });
    if (!twin) return res.status(404).json({ success: false, message: 'Twin not found.' });

    twin.knowledgeBase = twin.knowledgeBase.filter(
      (entry) => entry._id.toString() !== req.params.entryId
    );
    await twin.save();

    res.json({ success: true, message: 'Knowledge entry removed.', knowledgeCount: twin.knowledgeBase.length });
  } catch (err) {
    console.error('deleteKnowledge error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete knowledge entry.' });
  }
};

export const updateFaqs = async (req, res) => {
  try {
    const { faqs } = req.body;
    if (!Array.isArray(faqs)) {
      return res.status(400).json({ success: false, message: 'faqs must be an array.' });
    }

    const twin = await DigitalTwin.findOneAndUpdate(
      { createdBy: req.user._id },
      { faqs },
      { new: true }
    );
    if (!twin) return res.status(404).json({ success: false, message: 'Twin not found.' });

    res.json({ success: true, message: 'FAQs updated!', twin });
  } catch (err) {
    console.error('updateFaqs error:', err);
    res.status(500).json({ success: false, message: 'Failed to update FAQs.' });
  }
};

// ── CONVERSATION PERSISTENCE (Student History) ────────────────────────────────

export const getConversationHistory = async (req, res) => {
  try {
    const { twinId } = req.params;
    const conversation = await TwinConversation.findOne({
      twinId,
      studentId: req.user._id
    });

    res.json({
      success: true,
      messages: conversation ? conversation.messages : []
    });
  } catch (err) {
    console.error('getConversationHistory error:', err);
    res.status(500).json({ success: false, message: 'Failed to load conversation.' });
  }
};

export const clearConversationHistory = async (req, res) => {
  try {
    const { twinId } = req.params;
    await TwinConversation.findOneAndDelete({
      twinId,
      studentId: req.user._id
    });

    res.json({ success: true, message: 'Conversation cleared.' });
  } catch (err) {
    console.error('clearConversationHistory error:', err);
    res.status(500).json({ success: false, message: 'Failed to clear conversation.' });
  }
};

// ── AI CHAT ENGINE WITH CITATIONS & ANALYTICS ─────────────────────────────────

export const chatWithTwin = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    const twin = await DigitalTwin.findById(req.params.twinId);
    if (!twin) return res.status(404).json({ success: false, message: 'Digital Twin not found.' });
    if (!twin.isActive) return res.status(403).json({ success: false, message: 'This Digital Twin is currently offline.' });

    // 1. Check instant FAQs first
    const matchedFaq = twin.faqs?.find(f =>
      f.question && message.toLowerCase().includes(f.question.toLowerCase().trim())
    );

    let reply = '';
    let sourceCitation = '';
    let hasSourceMatch = false;

    if (matchedFaq) {
      reply = matchedFaq.answer;
      sourceCitation = 'Professor\'s Instant FAQ';
      hasSourceMatch = true;
    } else {
      // 2. Search knowledge base for relevant chunks & citations
      const lowerMsg = message.toLowerCase();
      const relevantDocs = (twin.knowledgeBase || []).filter(doc => {
        const words = lowerMsg.split(/\s+/).filter(w => w.length > 3);
        return words.some(w => doc.title.toLowerCase().includes(w) || doc.content.toLowerCase().includes(w));
      });

      if (relevantDocs.length > 0) {
        sourceCitation = relevantDocs.map(d => d.title).slice(0, 2).join(', ');
        hasSourceMatch = true;
      }

      const knowledgeText = (relevantDocs.length > 0 ? relevantDocs : (twin.knowledgeBase || [])).map(
        (entry) => `=== [${entry.type.toUpperCase()}] ${entry.title} ===\n${entry.content}`
      ).join('\n\n');

      const faqText = twin.faqs?.length > 0
        ? '\n\n=== COMMON Q&A ===\n' + twin.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')
        : '';

      const personalityInstruction = PERSONALITY_STYLES[twin.personality] || PERSONALITY_STYLES.friendly;

      const systemPrompt = `You are "${twin.twinName}", an AI Digital Twin of a university professor specializing in "${twin.subject}".

${personalityInstruction}

STRICT RULES:
1. Answer student questions using the course materials and knowledge base below.
2. If the answer is found in the notes, explain clearly with step-by-step guidance.
3. If not found in the notes, provide a helpful conceptual explanation based on standard "${twin.subject}" curriculum, and gently note: "💡 Note: This topic isn't in your professor's uploaded notes yet."
4. Be concise, organized, and use clean markdown bullet points.

--- PROFESSOR'S KNOWLEDGE BASE ---
${knowledgeText || `No specific lecture files uploaded yet. Provide standard academic help for "${twin.subject}".`}
${faqText}
--- END OF KNOWLEDGE BASE ---`;

      // Load past conversation messages from DB
      let conversation = await TwinConversation.findOne({
        twinId: twin._id,
        studentId: req.user._id
      });

      const historyMessages = (conversation?.messages || []).slice(-8).map(m => ({
        role: m.role,
        content: m.content
      }));

      try {
        const client = getAIClient();
        const completion = await client.chat.completions.create({
          model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4.1-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...historyMessages,
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 800
        });

        reply = completion.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
      } catch (aiErr) {
        console.error('AI call error, generating intelligent fallback:', aiErr.message);
        reply = `Hello! Based on ${twin.subject}, ${message} is an important concept. (Note: AI service is currently running in local fallback mode. Please ask your professor to verify Azure AI credentials if needed.)`;
      }
    }

    // 3. Save conversation in DB
    let conversation = await TwinConversation.findOne({
      twinId: twin._id,
      studentId: req.user._id
    });

    if (!conversation) {
      conversation = new TwinConversation({
        twinId: twin._id,
        studentId: req.user._id,
        messages: []
      });
      twin.totalChats += 1;
    }

    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    conversation.messages.push({
      role: 'assistant',
      content: reply,
      sourceCitation,
      timestamp: new Date()
    });

    conversation.lastActive = new Date();
    await conversation.save();

    // 4. Update Teacher Doubt Analytics / Heatmap
    if (!twin.analytics) {
      twin.analytics = { popularTopics: [], recentDoubts: [] };
    }

    // Add to recent doubts
    const studentName = req.user.firstName
      ? `${req.user.firstName} ${req.user.lastName || ''}`.trim()
      : req.user.fullName || 'Student';

    twin.analytics.recentDoubts.unshift({
      question: message.substring(0, 120),
      studentName,
      askedAt: new Date(),
      hasSourceMatch
    });

    // Keep only last 50 recent doubts
    if (twin.analytics.recentDoubts.length > 50) {
      twin.analytics.recentDoubts = twin.analytics.recentDoubts.slice(0, 50);
    }

    // Extract simple keyword for topic clustering
    const words = message.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 4);
    if (words.length > 0) {
      const topicKeyword = words[0].charAt(0).toUpperCase() + words[0].slice(1);
      const existingTopic = twin.analytics.popularTopics.find(t => t.topic.toLowerCase() === topicKeyword.toLowerCase());
      if (existingTopic) {
        existingTopic.count += 1;
      } else if (twin.analytics.popularTopics.length < 15) {
        twin.analytics.popularTopics.push({ topic: topicKeyword, count: 1 });
      }
    }

    twin.totalMessages += 2;
    await twin.save();

    res.json({
      success: true,
      reply,
      sourceCitation,
      twinName: twin.twinName,
      avatarEmoji: twin.avatarEmoji
    });
  } catch (err) {
    console.error('chatWithTwin error:', err);
    res.status(500).json({ success: false, message: 'AI chat failed. Please try again.' });
  }
};

// ── ESCALATION (Ask Professor Directly) ────────────────────────────────────────

export const escalateDoubt = async (req, res) => {
  try {
    const { question, context } = req.body;
    const { twinId } = req.params;

    if (!question?.trim()) {
      return res.status(400).json({ success: false, message: 'Question is required.' });
    }

    const twin = await DigitalTwin.findById(twinId);
    if (!twin) return res.status(404).json({ success: false, message: 'Twin not found.' });

    const studentName = req.user.firstName
      ? `${req.user.firstName} ${req.user.lastName || ''}`.trim()
      : req.user.fullName || 'Student';

    twin.escalatedDoubts.unshift({
      studentId: req.user._id,
      studentName,
      studentEmail: req.user.email,
      question: question.trim(),
      context: context || '',
      status: 'pending',
      createdAt: new Date()
    });

    await twin.save();

    res.json({
      success: true,
      message: 'Your doubt has been forwarded directly to your professor! They will review it soon.'
    });
  } catch (err) {
    console.error('escalateDoubt error:', err);
    res.status(500).json({ success: false, message: 'Failed to send doubt to professor.' });
  }
};

export const resolveEscalatedDoubt = async (req, res) => {
  try {
    const { doubtId } = req.params;
    const { resolution, addToFaqs } = req.body;

    const twin = await DigitalTwin.findOne({ createdBy: req.user._id });
    if (!twin) return res.status(404).json({ success: false, message: 'Twin not found.' });

    const doubt = twin.escalatedDoubts.id(doubtId);
    if (!doubt) return res.status(404).json({ success: false, message: 'Doubt not found.' });

    doubt.status = 'resolved';
    doubt.resolution = resolution || 'Resolved by professor';
    doubt.resolvedAt = new Date();

    // Optionally add to twin FAQs so the twin learns from this resolution
    if (addToFaqs && resolution) {
      twin.faqs.push({
        question: doubt.question,
        answer: resolution
      });
    }

    await twin.save();

    res.json({
      success: true,
      message: addToFaqs ? 'Doubt resolved and automatically added to Twin FAQs! 🧠' : 'Doubt marked as resolved.',
      doubt
    });
  } catch (err) {
    console.error('resolveEscalatedDoubt error:', err);
    res.status(500).json({ success: false, message: 'Failed to resolve doubt.' });
  }
};

// ── TEACHER DOUBT ANALYTICS ───────────────────────────────────────────────────

export const getTwinAnalytics = async (req, res) => {
  try {
    const twin = await DigitalTwin.findOne({ createdBy: req.user._id });
    if (!twin) return res.status(404).json({ success: false, message: 'Twin not found.' });

    res.json({
      success: true,
      analytics: {
        totalChats: twin.totalChats || 0,
        totalMessages: twin.totalMessages || 0,
        popularTopics: twin.analytics?.popularTopics?.sort((a, b) => b.count - a.count) || [],
        recentDoubts: twin.analytics?.recentDoubts || [],
        escalatedDoubts: twin.escalatedDoubts || []
      }
    });
  } catch (err) {
    console.error('getTwinAnalytics error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics.' });
  }
};

// ── DISCOVERY & STATUS ────────────────────────────────────────────────────────

export const discoverTwins = async (req, res) => {
  try {
    const twins = await DigitalTwin.find({ isActive: true })
      .populate('createdBy', 'firstName lastName fullName email')
      .select('twinName subject personality greetingMessage avatarEmoji totalChats totalMessages createdBy createdAt')
      .sort({ totalChats: -1 })
      .limit(20);

    res.json({ success: true, twins });
  } catch (err) {
    console.error('discoverTwins error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch twins.' });
  }
};

export const toggleTwinStatus = async (req, res) => {
  try {
    const twin = await DigitalTwin.findOne({ createdBy: req.user._id });
    if (!twin) return res.status(404).json({ success: false, message: 'Twin not found.' });

    twin.isActive = !twin.isActive;
    await twin.save();

    res.json({
      success: true,
      message: `Twin is now ${twin.isActive ? 'online' : 'offline'}.`,
      isActive: twin.isActive
    });
  } catch (err) {
    console.error('toggleTwinStatus error:', err);
    res.status(500).json({ success: false, message: 'Failed to toggle status.' });
  }
};
