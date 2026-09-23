import { v4 as uuidv4 } from 'uuid';
import ChatHistory from '../models/ChatHistory.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import {
  runStudentSupportAgent,
  getEffectiveAzureConfig,
  createAzureChatCompletion
} from '../services/azureAiService.js';

/**
 * @desc    Diagnostic healthcheck for Azure OpenAI connection on deployed instance
 * @route   GET /api/v1/chat/azure-status
 * @access  Public
 */
export const getAzureStatus = async (req, res) => {
  const config = getEffectiveAzureConfig();

  if (!config.isConfigured) {
    return res.status(200).json({
      success: false,
      configured: false,
      status: 'missing_credentials',
      message: 'Azure OpenAI is not configured in environment variables.',
      environmentDetails: {
        hasEndpoint: Boolean(process.env.AZURE_OPENAI_ENDPOINT),
        hasApiKey: Boolean(process.env.AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_KEY),
        deploymentName:
          process.env.AZURE_OPENAI_DEPLOYMENT_NAME ||
          process.env.AZURE_OPENAI_DEPLOYMENT ||
          'gpt-4.1-mini',
        apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview'
      },
      howToFix: [
        'Open Render Dashboard -> your service -> Environment',
        'Add AZURE_OPENAI_ENDPOINT (e.g. https://universitystudentsuppor-resource.services.ai.azure.com)',
        'Add AZURE_OPENAI_API_KEY (your Azure OpenAI key)',
        'Add AZURE_OPENAI_DEPLOYMENT_NAME = gpt-4.1-mini',
        'Add AZURE_OPENAI_API_VERSION = 2024-02-15-preview',
        'Click Save Changes and wait for automatic redeployment'
      ]
    });
  }

  try {
    const testResult = await createAzureChatCompletion(
      {
        endpoint: config.endpoint,
        apiKey: config.apiKey,
        apiVersion: config.apiVersion,
        deployment: config.primaryDeployment
      },
      {
        messages: [{ role: 'user', content: 'Respond with OK.' }],
        max_tokens: 10
      }
    );

    let host = '';
    try {
      host = new URL(config.endpoint).host;
    } catch (_) {
      host = config.endpoint;
    }

    return res.status(200).json({
      success: true,
      configured: true,
      status: 'connected',
      modelUsed: testResult.usedDeployment || config.primaryDeployment,
      endpointHost: host,
      sampleResponse: testResult.response?.choices?.[0]?.message?.content?.trim() || 'OK',
      message: 'Azure OpenAI model is active and responding successfully!'
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      configured: true,
      status: 'connection_failed',
      errorMessage: error.message,
      errorCode: error.code || null,
      statusCode: error.status || null,
      deployment: config.primaryDeployment,
      troubleshooting:
        error.status === 403
          ? 'Firewall error: In Azure Portal -> your Azure AI resource -> Networking, ensure "Public network access" is set to "All Networks".'
          : error.status === 401
          ? 'Authentication error: Check AZURE_OPENAI_API_KEY in Render environment settings.'
          : error.status === 404
          ? `Deployment not found: Ensure deployment name in Azure AI Foundry matches "${config.primaryDeployment}".`
          : 'Check Render service logs for full error details.'
    });
  }
};

/**
 * @desc    Send a message to the AI Chat Agent
 * @route   POST /api/v1/chat/message
 * @access  Public / Optional Auth
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
    }

    const currentSessionId = sessionId || uuidv4();
    const currentUser = req.user || {
      _id: null,
      role: 'guest',
      firstName: 'Guest',
      lastName: 'User'
    };
    const userRole = currentUser.role;

    // Load student or faculty profile for context injection
    let studentProfile = null;
    let facultyProfile = null;

    if (currentUser._id) {
      if (userRole === 'student') {
        studentProfile = await Student.findOne({ userId: currentUser._id });
      } else if (userRole === 'faculty') {
        facultyProfile = await Faculty.findOne({ userId: currentUser._id });
      }
    }

    // Find or create chat session if user is authenticated
    let chatSession = null;
    if (currentUser._id) {
      chatSession = await ChatHistory.findOne({ sessionId: currentSessionId, user: currentUser._id });
      if (!chatSession) {
        chatSession = new ChatHistory({
          sessionId: currentSessionId,
          user: currentUser._id,
          userRole,
          sessionTitle: message.slice(0, 45) + '...',
          messages: []
        });
      }

      // Append user message
      chatSession.messages.push({
        messageId: uuidv4(),
        sender: 'user',
        content: message,
        timestamp: new Date()
      });
    }

    // Execute Azure AI Foundry Agent (or resilient fallback)
    const agentResult = await runStudentSupportAgent({
      userMessage: message,
      conversationHistory: chatSession ? chatSession.messages : [],
      user: currentUser,
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

    if (chatSession) {
      chatSession.messages.push(aiMessageObj);
      chatSession.lastActiveAt = new Date();
      await chatSession.save();
    }

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
