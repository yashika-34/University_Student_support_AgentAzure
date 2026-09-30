import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext.jsx';
import api, { flashcardAPI } from '../services/api.js';
import FlashcardModal from '../components/flashcards/FlashcardModal.jsx';
import {
  Sparkles,
  Send,
  User,
  Bot,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  LifeBuoy,
  Check,
  BookOpen,
  Layers,
  HelpCircle,
  Loader2,
  Clock,
  Radio,
  CornerDownRight
} from 'lucide-react';

const AiChatbotPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const messagesEndRef = useRef(null);

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isStreamingEnabled, setIsStreamingEnabled] = useState(true);

  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'assistant',
      content: `Hello ${user ? user.fullName.split(' ')[0] : 'there'}! 👋 I am your **UniAssist AI Academic Agent**, powered by Azure AI Foundry and live university records.\n\nI have continuous conversation memory enabled and can help you with:\n- 📊 Live attendance percentage, missed classes, and threshold warnings\n- 📝 Pending assignment deadlines, submissions, and time allocation\n- 🗓️ Examination schedules, digital hall tickets, and syllabus reviews\n- 📚 Academic lecture notes, uploaded study materials, and policy handbooks`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [followUps, setFollowUps] = useState([
    'What is my current attendance in all courses?',
    'Which assignments are due this week?',
    'Summarize my missed classes and catch-up steps'
  ]);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalatedTicket, setEscalatedTicket] = useState(null);

  // Flashcards Integration
  const [chatFlashcardModalOpen, setChatFlashcardModalOpen] = useState(false);
  const [chatFlashcards, setChatFlashcards] = useState([]);
  const [chatFlashcardTitle, setChatFlashcardTitle] = useState('');
  const [chatFlashcardCategory, setChatFlashcardCategory] = useState('Academic Revision');
  const [generatingCardMsgId, setGeneratingCardMsgId] = useState(null);

  // Load real sessions from backend
  useEffect(() => {
    fetchSessions();
  }, [user]);

  const fetchSessions = async () => {
    if (!user) return;
    try {
      const res = await api.get('/chat/sessions');
      if (res.data?.sessions && res.data.sessions.length > 0) {
        const formatted = res.data.sessions.map((s) => ({
          id: s.sessionId,
          title: s.sessionTitle || 'Academic Consultation',
          date: new Date(s.lastActiveAt || s.createdAt).toLocaleDateString(),
          followUps: s.suggestedFollowUps || []
        }));
        setSessions(formatted);
        if (!activeSessionId) {
          setActiveSessionId(formatted[0].id);
          loadSessionMessages(formatted[0].id);
        }
      }
    } catch (e) {
      console.warn('Could not load past chat sessions:', e.message);
    }
  };

  const loadSessionMessages = async (sessionId) => {
    setActiveSessionId(sessionId);
    try {
      const res = await api.get(`/chat/sessions/${sessionId}/messages`);
      if (res.data?.messages && res.data.messages.length > 0) {
        setMessages(
          res.data.messages.map((m) => ({
            id: m.messageId || m._id || `msg-${Math.random()}`,
            sender: m.sender,
            content: m.content,
            toolCalls: m.toolCalls || [],
            groundingSources: m.groundingSources || [],
            timestamp: new Date(m.timestamp || Date.now()).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })
          }))
        );
        if (res.data.suggestedFollowUps && res.data.suggestedFollowUps.length > 0) {
          setFollowUps(res.data.suggestedFollowUps);
        }
      }
    } catch (e) {
      console.warn('Could not load session messages:', e.message);
    }
  };

  const handleGenerateChatFlashcards = async (msgContent, type = 'chatbot_quick_revision', title = 'Quick Revision') => {
    setGeneratingCardMsgId(type);
    try {
      const res = await flashcardAPI.generate({
        sourceModule: 'chatbot',
        type,
        title: `${title} Flashcards`,
        context: msgContent,
        count: 6,
        save: true
      });
      if (res.data?.data?.cards) {
        setChatFlashcards(res.data.data.cards);
        setChatFlashcardTitle(`${title} — Academic Revision Deck`);
        setChatFlashcardCategory(
          type === 'chatbot_formula' ? 'Important Formulas' :
          type === 'chatbot_concept' ? 'Core Concepts' :
          type === 'chatbot_definition' ? 'Definitions' : 'Quick Revision'
        );
        setChatFlashcardModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to generate flashcards from chat:', err);
      alert('Failed to generate revision flashcards. Please try again.');
    } finally {
      setGeneratingCardMsgId(null);
    }
  };

  // Auto-fill prompt if passed from another page via navigate state
  useEffect(() => {
    if (location.state && location.state.initialPrompt) {
      setInputValue(location.state.initialPrompt);
    }
  }, [location.state]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (customPrompt) => {
    const promptToSend = customPrompt || inputValue;
    if (!promptToSend.trim() || isTyping) return;

    const currentSession = activeSessionId || `sess-${Date.now()}`;
    if (!activeSessionId) setActiveSessionId(currentSession);

    const userMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    if (isStreamingEnabled) {
      // ── Streaming SSE Implementation ──────────────────────────────────────
      const assistantMsgId = `asst-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          sender: 'assistant',
          content: '',
          isStreaming: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      try {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/chat/stream', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: promptToSend,
            sessionId: currentSession
          })
        });

        if (!response.ok || !response.body) {
          throw new Error('Streaming failed, fallback to standard endpoint');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedContent = '';
        let finalReplyObj = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const textChunk = decoder.decode(value, { stream: true });
          const lines = textChunk.split('\n');

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              try {
                const eventData = JSON.parse(trimmed.slice(6));
                if (eventData.type === 'session' && eventData.sessionId) {
                  setActiveSessionId(eventData.sessionId);
                } else if (eventData.type === 'chunk' && eventData.content) {
                  accumulatedContent += eventData.content;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, content: accumulatedContent }
                        : m
                    )
                  );
                } else if (eventData.type === 'done' && eventData.reply) {
                  finalReplyObj = eventData.reply;
                }
              } catch (_) {}
            }
          }
        }

        // Finalize message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: finalReplyObj?.content || accumulatedContent,
                  toolCalls: finalReplyObj?.toolCalls || [],
                  groundingSources: finalReplyObj?.groundingSources || [],
                  isStreaming: false
                }
              : m
          )
        );

        fetchSessions();
        setIsTyping(false);
        return;
      } catch (streamErr) {
        console.warn('[Streaming SSE Error, using fallback]:', streamErr.message);
        // Remove the empty streaming message placeholder before non-streaming fallback
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
      }
    }

    // ── Standard Non-Streaming REST Fallback ────────────────────────────────
    try {
      const res = await api.post('/chat/message', {
        message: promptToSend,
        sessionId: currentSession
      });

      if (res.data && res.data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: res.data.reply.messageId || `asst-${Date.now()}`,
            sender: 'assistant',
            content: res.data.reply.content,
            toolCalls: res.data.reply.toolCalls || [],
            groundingSources: res.data.reply.groundingSources || [],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);

        if (res.data.suggestedFollowUps && res.data.suggestedFollowUps.length > 0) {
          setFollowUps(res.data.suggestedFollowUps);
        }

        fetchSessions();
      }
    } catch (err) {
      console.error('Chat API error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          content: 'Sorry, I am unable to connect to the AI service right now. Please check your connection or try again in a moment.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleEscalate = () => {
    const ticketId = `TICK-${Math.floor(100000 + Math.random() * 900000)}`;
    setEscalatedTicket(ticketId);
    setShowEscalateModal(false);

    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: 'system',
        content: `🎫 **Support Ticket Created: #${ticketId}**\n\nThis inquiry transcript has been dispatched to the Academic Advisory Helpdesk. A human staff officer will review your question and respond via university email within 24 hours.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const startNewSession = () => {
    const newId = `sess-${Date.now()}`;
    setSessions([{ id: newId, title: 'New Conversation', date: 'Just now' }, ...sessions]);
    setActiveSessionId(newId);
    setMessages([
      {
        id: `m-${Date.now()}`,
        sender: 'assistant',
        content: `Started a fresh conversation session with conversation memory enabled. How can I assist your studies or campus questions today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setFollowUps([
      'What is my CS-301 attendance?',
      'Upcoming assignment deadlines',
      'What are the semester exam dates?'
    ]);
  };

  const quickPrompts = [
    'What is my attendance percentage?',
    'Upcoming assignment deadlines',
    'Summarize my missed classes',
    'Exam preparation priorities'
  ];

  return (
    <div
      className="animate-fade-in chat-layout"
      style={{
        display: 'grid',
        gridTemplateColumns: '290px 1fr',
        height: 'calc(100vh - 120px)',
        gap: '1.25rem'
      }}
    >
      {/* Sessions History Sidebar */}
      <aside className="glass-panel chat-sidebar" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem 1rem', overflow: 'hidden' }}>
        <button
          onClick={startNewSession}
          className="btn btn-primary"
          style={{ width: '100%', marginBottom: '1.25rem', fontSize: '0.85rem', padding: '0.65rem' }}
        >
          <PlusCircle size={16} /> New Chat Session
        </button>

        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.65rem', paddingLeft: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Conversation History</span>
          <span style={{ fontSize: '0.68rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Memory On</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto', flex: 1 }}>
          {sessions.length === 0 ? (
            <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
              No previous sessions. Start asking questions to build your history!
            </div>
          ) : (
            sessions.map((sess) => (
              <button
                key={sess.id}
                onClick={() => loadSessionMessages(sess.id)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: activeSessionId === sess.id ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: activeSessionId === sess.id ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: activeSessionId === sess.id ? 600 : 500,
                  textAlign: 'left',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.15s'
                }}
              >
                <Sparkles size={14} color={activeSessionId === sess.id ? 'var(--primary)' : 'var(--text-muted)'} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {sess.title}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Security / FERPA Notice */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', marginTop: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ShieldCheck size={14} color="var(--success)" />
          <span>Azure AI Content Safety Active</span>
        </div>
      </aside>

      {/* Main Chat Conversation Stage */}
      <main className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Chat Top Banner */}
        <div style={{
          padding: '0.9rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(59, 130, 246, 0.4)'
            }}>
              <Bot size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                UniAssist Academic Agent
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                  {isStreamingEnabled ? 'Streaming Active' : 'Online (RAG Enabled)'}
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Azure OpenAI &bull; Conversation Memory &bull; Grounded Document Retrieval
              </div>
            </div>
          </div>

          {/* Controls: Streaming toggle & Escalate */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={() => setIsStreamingEnabled(!isStreamingEnabled)}
              className="badge"
              style={{
                cursor: 'pointer',
                background: isStreamingEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                color: isStreamingEnabled ? 'var(--success)' : 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
                padding: '0.35rem 0.65rem',
                fontSize: '0.72rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
              title="Toggle token-by-token streaming responses"
            >
              <Radio size={12} color={isStreamingEnabled ? 'var(--success)' : 'currentColor'} />
              <span>{isStreamingEnabled ? 'Streaming: ON' : 'Streaming: OFF'}</span>
            </button>

            {escalatedTicket && (
              <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                Ticket #{escalatedTicket}
              </span>
            )}
            <button
              onClick={() => setShowEscalateModal(true)}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
            >
              <LifeBuoy size={14} /> Escalate Ticket
            </button>
          </div>
        </div>

        {/* Message Thread Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {messages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            const isSystem = msg.sender === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} style={{
                  padding: '1rem 1.25rem',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.5
                }}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              );
            }

            const isLastAssistantMessage = !isUser && index === messages.length - 1;

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: isUser ? '80%' : '88%'
                }}
              >
                {!isUser && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--primary-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <Bot size={18} color="#fff" />
                  </div>
                )}

                <div>
                  <div
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isUser ? 'var(--primary-gradient)' : 'var(--bg-input)',
                      color: isUser ? '#ffffff' : 'var(--text-primary)',
                      fontSize: '0.925rem',
                      lineHeight: 1.6,
                      border: isUser ? 'none' : '1px solid var(--border-subtle)',
                      boxShadow: isUser ? '0 4px 14px rgba(59, 130, 246, 0.3)' : 'var(--shadow-sm)'
                    }}
                  >
                    {isUser ? (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    ) : (
                      <div className="prose" style={{ lineHeight: 1.65 }}>
                        <ReactMarkdown>{msg.content || (msg.isStreaming ? 'Thinking...' : '')}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Tool Call Pill */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--success)', marginTop: '0.4rem' }}>
                      <Check size={12} /> Executed tool: <code>{msg.toolCalls[0].tool}</code>
                    </div>
                  )}

                  {/* Grounding Citations */}
                  {msg.groundingSources && msg.groundingSources.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--accent-cyan)', marginTop: '0.3rem' }}>
                      <ExternalLink size={12} /> Grounded on: <strong>{msg.groundingSources[0].doc}</strong>
                    </div>
                  )}

                  {/* Smart AI Flashcard Generator Chips */}
                  {!isUser && msg.id !== 'welcome-1' && !msg.isStreaming && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Sparkles size={11} color="var(--primary)" /> Smart Flashcards:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleGenerateChatFlashcards(msg.content, 'chatbot_quick_revision', 'Quick Revision')}
                        disabled={Boolean(generatingCardMsgId)}
                        className="badge"
                        style={{
                          background: 'rgba(59, 130, 246, 0.12)',
                          color: 'var(--primary)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                          padding: '0.2rem 0.55rem'
                        }}
                      >
                        🎴 Quick Revision
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateChatFlashcards(msg.content, 'chatbot_concept', 'Concepts')}
                        disabled={Boolean(generatingCardMsgId)}
                        className="badge"
                        style={{
                          background: 'rgba(139, 92, 246, 0.12)',
                          color: 'var(--accent-purple)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                          padding: '0.2rem 0.55rem'
                        }}
                      >
                        💡 Concepts
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateChatFlashcards(msg.content, 'chatbot_formula', 'Important Formulas')}
                        disabled={Boolean(generatingCardMsgId)}
                        className="badge"
                        style={{
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: 'var(--success)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                          padding: '0.2rem 0.55rem'
                        }}
                      >
                        📐 Formulas
                      </button>
                    </div>
                  )}

                  {/* Context-Aware Follow-up Suggestions under latest assistant reply */}
                  {isLastAssistantMessage && !isTyping && followUps.length > 0 && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px dashed rgba(59, 130, 246, 0.25)' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Sparkles size={12} /> Suggested Follow-ups:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {followUps.map((q, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendMessage(q)}
                            style={{
                              textAlign: 'left',
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '6px',
                              padding: '0.45rem 0.75rem',
                              fontSize: '0.78rem',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--primary)';
                              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border-subtle)';
                              e.currentTarget.style.background = 'var(--bg-card)';
                            }}
                          >
                            <CornerDownRight size={13} color="var(--primary)" />
                            <span>{q}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: isUser ? 'right' : 'left' }}>
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <User size={18} color="#fff" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Animation */}
          {isTyping && !messages.some((m) => m.isStreaming) && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--primary-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot size={18} color="#fff" />
              </div>
              <div style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '16px 16px 16px 4px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <Loader2 size={14} className="animate-spin" color="var(--primary)" />
                <span>Accessing university databases &amp; synthesizing answer...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{ padding: '0.5rem 1.5rem', display: 'flex', gap: '0.4rem', overflowX: 'auto', background: 'rgba(255, 255, 255, 0.01)', borderTop: '1px solid var(--border-subtle)' }}>
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(p)}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '0.35rem 0.85rem',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <span>{p}</span>
            </button>
          ))}
        </div>

        {/* Message Input Bar */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          >
            <input
              type="text"
              className="form-input"
              placeholder="Ask anything about courses, attendance, fees, exams, syllabus..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
              style={{ padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-full)' }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!inputValue.trim() || isTyping}
              style={{ borderRadius: 'var(--radius-full)', width: '46px', height: '46px', padding: 0 }}
            >
              {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </main>

      {/* Escalation Modal */}
      {showEscalateModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999, padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '460px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Escalate to Human Staff</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Transfer this conversation transcript to an academic advisor or administration officer for personalized follow-up.
            </p>

            <div className="form-group">
              <label className="form-label">Query Subject</label>
              <input type="text" className="form-input" defaultValue="Academic Guidance / Special Exemption Request" />
            </div>

            <div className="form-group">
              <label className="form-label">Urgency</label>
              <select className="form-select">
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent (Exam within 48h)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setShowEscalateModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleEscalate} className="btn btn-primary">
                Confirm Escalation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Chatbot Flashcard Modal */}
      <FlashcardModal
        isOpen={chatFlashcardModalOpen}
        onClose={() => setChatFlashcardModalOpen(false)}
        title={chatFlashcardTitle}
        initialCards={chatFlashcards}
        sourceModule="chatbot"
        category={chatFlashcardCategory}
      />

      <style>{`
        @media (max-width: 850px) {
          .chat-layout { grid-template-columns: 1fr !important; }
          .chat-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default AiChatbotPage;
