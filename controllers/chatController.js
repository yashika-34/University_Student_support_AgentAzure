import { v4 as uuidv4 } from 'uuid';
import ChatHistory from '../models/ChatHistory.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import { runStudentSupportAgent } from '../services/azureAiService.js';

/**
 * @desc    Send a message to the AI Chat Agent
 * @route   POST /api/v1/chat/message
 * @access  Private
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
    }

    const currentSessionId = sessionId || uuidv4();
    const userRole = req.user.role;

    // Load student or faculty profile for context injection
    let studentProfile = null;
    let facultyProfile = null;

    if (userRole === 'student') {
      studentProfile = await Student.findOne({ userId: req.user._id });
    } else if (userRole === 'faculty') {
      facultyProfile = await Faculty.findOne({ userId: req.user._id });
    }

    // Find or create chat session
    let chatSession = await ChatHistory.findOne({ sessionId: currentSessionId, user: req.user._id });
    if (!chatSession) {
      chatSession = new ChatHistory({
        sessionId: currentSessionId,
        user: req.user._id,
        userRole,
        sessionTitle: message.slice(0, 45) + '...',
        messages: []
      });
    }

    // Append user message
    const userMessageId = uuidv4();
    chatSession.messages.push({
      messageId: userMessageId,
      sender: 'user',
      content: message,
      timestamp: new Date()
    });

    // Execute Azure AI Foundry Agent (or resilient fallback)
    const agentResult = await runStudentSupportAgent({
      userMessage: message,
      conversationHistory: chatSession.messages,
      user: req.user,
      studentProfile,
      facultyProfile
    });

    // Append AI response
    const aiMessageId = uuidv4();
    const aiMessageObj = {
      messageId: aiMessageId,
      sender: 'assistant',
      content: agentResult.content,
      toolCalls: agentResult.toolCalls || [],
      groundingSources: agentResult.groundingSources || [],
      timestamp: new Date()
    };

    chatSession.messages.push(aiMessageObj);
    chatSession.lastActiveAt = new Date();
    await chatSession.save();

    res.status(200).json({
      success: true,
      sessionId: currentSessionId,
      reply: aiMessageObj
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's chat sessions
 * @route   GET /api/v1/chat/sessions
 * @access  Private
 */
export const getUserSessions = async (req, res, next) => {
  try {
    const sessions = await ChatHistory.find({ user: req.user._id })
      .select('sessionId sessionTitle status lastActiveAt createdAt')
      .sort({ lastActiveAt: -1 });

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all messages for a specific chat session
 * @route   GET /api/v1/chat/sessions/:sessionId/messages
 * @access  Private
 */
export const getSessionMessages = async (req, res, next) => {
  try {
    const session = await ChatHistory.findOne({
      sessionId: req.params.sessionId,
      user: req.user._id
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Chat session not found.' });
    }

    res.status(200).json({
      success: true,
      sessionId: session.sessionId,
      sessionTitle: session.sessionTitle,
      status: session.status,
      messages: session.messages
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Escalate a chat session to a human support ticket
 * @route   POST /api/v1/chat/sessions/:sessionId/escalate
 * @access  Private
 */
export const escalateSession = async (req, res, next) => {
  try {
    const { subject, description, priority = 'medium' } = req.body;
    const session = await ChatHistory.findOne({
      sessionId: req.params.sessionId,
      user: req.user._id
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Chat session not found.' });
    }

    const ticketId = `TICK-${Date.now().toString().slice(-6)}`;
    session.status = 'escalated';
    session.escalatedTicketId = ticketId;

    // Append system turn noting the escalation
    session.messages.push({
      messageId: uuidv4(),
      sender: 'system',
      content: `This inquiry has been escalated to human support under Ticket #${ticketId}. A university support officer has been notified.`,
      timestamp: new Date()
    });

    await session.save();

    res.status(200).json({
      success: true,
      message: `Inquiry successfully escalated to human support.`,
      ticketId,
      status: 'escalated'
    });
  } catch (error) {
    next(error);
  }
};
