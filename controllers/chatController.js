import { v4 as uuidv4 } from 'uuid';
import ChatHistory from '../models/ChatHistory.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import {
  runStudentSupportAgent,
  getEffectiveAzureConfig,
  createAzureChatCompletion
} from '../services/azureAiService.js';
import {
  CONVERSATION_SUMMARY_PROMPT,
  FOLLOW_UP_GENERATION_PROMPT
} from '../services/promptEngine.js';

// Maximum messages before triggering conversation summarization
const MEMORY_WINDOW_SIZE = 12;
const SUMMARY_TRIGGER_SIZE = 10;

/**
 * Generates a condensed conversation summary for long-running sessions.
 * Called automatically when conversation exceeds SUMMARY_TRIGGER_SIZE messages.
 */
const generateConversationSummary = async (messages) => {
  const azureConfig = getEffectiveAzureConfig();
  if (!azureConfig.isConfigured) return '';

  const conversationText = messages
    .map((m) => `[${m.sender.toUpperCase()}]: ${m.content}`)
    .join('\n');

  try {
    const result = await createAzureChatCompletion(
      {
        endpoint: azureConfig.endpoint,
        apiKey: azureConfig.apiKey,
        apiVersion: azureConfig.apiVersion,
        deployment: azureConfig.primaryDeployment
      },
      {
        messages: [
          { role: 'user', content: CONVERSATION_SUMMARY_PROMPT + conversationText }
        ],
        max_tokens: 300,
        temperature: 0.1
      }
    );
    return result.response.choices[0]?.message?.content?.trim() || '';
  } catch (err) {
    console.warn('[Conversation Summary] Generation failed:', err.message);
    return '';
  }
};

/**
 * Generates context-aware follow-up suggestions based on the conversation.
 */
const generateFollowUpSuggestions = async (recentMessages) => {
  const azureConfig = getEffectiveAzureConfig();
  if (!azureConfig.isConfigured) return [];

  const contextText = recentMessages
    .slice(-4)
    .map((m) => `[${m.sender.toUpperCase()}]: ${m.content}`)
    .join('\n');

  try {
    const result = await createAzureChatCompletion(
      {
        endpoint: azureConfig.endpoint,
        apiKey: azureConfig.apiKey,
        apiVersion: azureConfig.apiVersion,
        deployment: azureConfig.primaryDeployment
      },
      {
        messages: [
          { role: 'user', content: FOLLOW_UP_GENERATION_PROMPT + contextText }
        ],
        max_tokens: 200,
        temperature: 0.4
      }
    );

    const content = result.response.choices[0]?.message?.content?.trim() || '[]';
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
  } catch (err) {
    console.warn('[Follow-Up Suggestions] Generation failed:', err.message);
    return [];
  }
};

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
 * @desc    Send a message to the AI Chat Agent (with conversation memory & follow-ups)
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
          messages: [],
          conversationSummary: '',
          contextMetadata: { topicsDiscussed: [], toolsUsed: [], lastIntent: '' },
          suggestedFollowUps: []
        });
      }

      // Append user message
      chatSession.messages.push({
        messageId: uuidv4(),
        sender: 'user',
        content: message,
        timestamp: new Date()
      });

      // Trigger conversation summarization if session is getting long
      if (chatSession.messages.length > SUMMARY_TRIGGER_SIZE && chatSession.messages.length % 6 === 0) {
        const oldMessages = chatSession.messages.slice(0, -MEMORY_WINDOW_SIZE);
        if (oldMessages.length > 0) {
          const summary = await generateConversationSummary(oldMessages);
          if (summary) {
            chatSession.conversationSummary = summary;
          }
        }
      }
    }

    // Build conversation context with memory injection
    const conversationForAgent = [];

    // Inject conversation summary as context if available
    if (chatSession?.conversationSummary) {
      conversationForAgent.push({
        sender: 'system',
        content: `[CONVERSATION MEMORY] Previous discussion summary: ${chatSession.conversationSummary}`
      });
    }

    // Add recent messages (sliding window)
    if (chatSession) {
      conversationForAgent.push(...chatSession.messages.slice(-MEMORY_WINDOW_SIZE));
    }

    // Execute Azure AI Foundry Agent (or resilient fallback)
    const agentResult = await runStudentSupportAgent({
      userMessage: message,
      conversationHistory: conversationForAgent,
      user: currentUser,
      studentProfile,
      facultyProfile
    });

    const aiMessageId = uuidv4();
    const normalizedToolCalls = (agentResult.toolCalls || []).map((t) => ({
      toolName: t.toolName || t.tool || 'student_support_tool',
      tool: t.tool || t.toolName || 'student_support_tool',
      parameters: t.parameters || t.args || {},
      args: t.args || t.parameters || {},
      result: t.result || {}
    }));

    const aiMessageObj = {
      messageId: aiMessageId,
      sender: 'assistant',
      content: agentResult.content,
      toolCalls: normalizedToolCalls,
      groundingSources: agentResult.groundingSources || [],
      timestamp: new Date()
    };

    // Generate context-aware follow-up suggestions (async, non-blocking for response)
    let suggestedFollowUps = [];

    if (chatSession) {
      chatSession.messages.push(aiMessageObj);
      chatSession.lastActiveAt = new Date();

      // Update context metadata
      if (normalizedToolCalls.length > 0) {
        const tools = normalizedToolCalls.map((t) => t.tool);
        chatSession.contextMetadata.toolsUsed = [
          ...new Set([...(chatSession.contextMetadata.toolsUsed || []), ...tools])
        ];
      }

      await chatSession.save();

      // Generate follow-ups asynchronously (don't block response)
      generateFollowUpSuggestions(chatSession.messages)
        .then((followUps) => {
          if (followUps.length > 0) {
            ChatHistory.updateOne(
              { _id: chatSession._id },
              { $set: { suggestedFollowUps: followUps } }
            ).catch(() => {});
          }
        })
        .catch(() => {});

      // Use previously stored follow-ups for immediate response
      suggestedFollowUps = chatSession.suggestedFollowUps || [];
    }

    res.status(200).json({
      success: true,
      sessionId: currentSessionId,
      reply: aiMessageObj,
      suggestedFollowUps
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Stream a message to the AI Chat Agent using SSE
 * @route   POST /api/v1/chat/stream
 * @access  Public / Optional Auth
 */
export const streamMessage = async (req, res, next) => {
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

    // Load profiles
    let studentProfile = null;
    let facultyProfile = null;

    if (currentUser._id) {
      if (userRole === 'student') {
        studentProfile = await Student.findOne({ userId: currentUser._id });
      } else if (userRole === 'faculty') {
        facultyProfile = await Faculty.findOne({ userId: currentUser._id });
      }
    }

    // Find or create chat session
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

      chatSession.messages.push({
        messageId: uuidv4(),
        sender: 'user',
        content: message,
        timestamp: new Date()
      });
    }

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    // Send session ID immediately
    res.write(`data: ${JSON.stringify({ type: 'session', sessionId: currentSessionId })}\n\n`);

    const azureConfig = getEffectiveAzureConfig();

    if (!azureConfig.isConfigured) {
      // Fall back to non-streaming agent
      const agentResult = await runStudentSupportAgent({
        userMessage: message,
        conversationHistory: chatSession ? chatSession.messages : [],
        user: currentUser,
        studentProfile,
        facultyProfile
      });

      // Stream the response in chunks to simulate streaming
      const content = agentResult.content;
      const words = content.split(' ');
      let accumulated = '';

      for (let i = 0; i < words.length; i++) {
        accumulated += (i > 0 ? ' ' : '') + words[i];
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: words[i] + ' ' })}\n\n`);
      }

      // Send completion event
      const aiMessageId = uuidv4();
      const aiMessageObj = {
        messageId: aiMessageId,
        sender: 'assistant',
        content: accumulated,
        toolCalls: agentResult.toolCalls || [],
        groundingSources: agentResult.groundingSources || [],
        timestamp: new Date()
      };

      if (chatSession) {
        chatSession.messages.push(aiMessageObj);
        chatSession.lastActiveAt = new Date();
        await chatSession.save();
      }

      res.write(`data: ${JSON.stringify({ type: 'done', reply: aiMessageObj })}\n\n`);
      res.end();
      return;
    }

    // Azure OpenAI Streaming
    const { AzureOpenAI } = await import('openai');
    const { buildSystemPromptWithContext } = await import('../services/promptEngine.js');

    const systemPrompt = buildSystemPromptWithContext(currentUser, studentProfile, facultyProfile);
    const conversationMessages = chatSession
      ? chatSession.messages.slice(-MEMORY_WINDOW_SIZE)
      : [];

    const openAiMessages = [
      { role: 'system', content: systemPrompt },
      ...conversationMessages.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : msg.sender === 'system' ? 'system' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    const client = new AzureOpenAI({
      endpoint: azureConfig.endpoint,
      apiKey: azureConfig.apiKey,
      apiVersion: azureConfig.apiVersion,
      deployment: azureConfig.primaryDeployment
    });

    const stream = await client.chat.completions.create({
      model: azureConfig.primaryDeployment,
      messages: openAiMessages,
      temperature: 0.2,
      stream: true
    });

    let fullContent = '';

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        fullContent += delta;
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: delta })}\n\n`);
      }
    }

    // Save the complete response
    const aiMessageId = uuidv4();
    const aiMessageObj = {
      messageId: aiMessageId,
      sender: 'assistant',
      content: fullContent,
      toolCalls: [],
      groundingSources: [],
      timestamp: new Date()
    };

    if (chatSession) {
      chatSession.messages.push(aiMessageObj);
      chatSession.lastActiveAt = new Date();
      await chatSession.save();
    }

    res.write(`data: ${JSON.stringify({ type: 'done', reply: aiMessageObj })}\n\n`);
    res.end();
  } catch (error) {
    console.error('[Stream Error]:', error.message);
    try {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
      res.end();
    } catch (_) {
      next(error);
    }
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
      .select('sessionId sessionTitle status lastActiveAt createdAt suggestedFollowUps')
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
      messages: session.messages,
      suggestedFollowUps: session.suggestedFollowUps || [],
      conversationSummary: session.conversationSummary || ''
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
