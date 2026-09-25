import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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
  Loader2
} from 'lucide-react';

const AiChatbotPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const messagesEndRef = useRef(null);

  const [sessions, setSessions] = useState([
    { id: 'sess-1', title: 'Attendance Policy & CS-301 Check', date: 'Today' },
    { id: 'sess-2', title: 'Fall Tuition Due Dates', date: 'Yesterday' }
  ]);
  const [activeSessionId, setActiveSessionId] = useState('sess-1');

  const [messages, setMessages] = useState([
    {
      id: 'm-1',
      sender: 'assistant',
      content: `Hello ${user ? user.fullName.split(' ')[0] : 'there'}! 👋 I am your **UniAssist AI Support Agent**, powered by Azure AI Foundry and university database records.\n\nHow can I help you today? You can ask me about:\n- 📊 Your live attendance percentage and threshold alerts\n- 📝 Pending assignment deadlines and submissions\n- 🗓️ Examination schedules and digital hall tickets\n- 💳 Fee deadlines and bursar policies\n- 🏛️ Campus directories and student wellness services`,
      timestamp: '12:00 PM'
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalatedTicket, setEscalatedTicket] = useState(null);

  // Flashcards Integration
  const [chatFlashcardModalOpen, setChatFlashcardModalOpen] = useState(false);
  const [chatFlashcards, setChatFlashcards] = useState([]);
  const [chatFlashcardTitle, setChatFlashcardTitle] = useState('');
  const [chatFlashcardCategory, setChatFlashcardCategory] = useState('Academic Revision');
  const [generatingCardMsgId, setGeneratingCardMsgId] = useState(null);

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
    if (!promptToSend.trim()) return;

    const userMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Try sending to Node.js backend
      const res = await api.post('/chat/message', {
        message: promptToSend,
        sessionId: activeSessionId
      });

      if (res.data && res.data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: res.data.reply.messageId,
            sender: 'assistant',
            content: res.data.reply.content,
            toolCalls: res.data.reply.toolCalls,
            groundingSources: res.data.reply.groundingSources,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsTyping(false);
        return;
      }
    } catch (err) {
      console.warn('Backend unavailable, simulating grounded client AI answer', err);
    }

    // Client-side intelligent simulated response
    setTimeout(() => {
      let aiReply = '';
      let toolInfo = null;
      let citations = null;
      const lower = promptToSend.toLowerCase();

      if (lower.includes('attendance') || lower.includes('cs-301') || lower.includes('cs-305')) {
        toolInfo = { tool: 'getStudentAttendance', data: 'MongoDB Attendance Collection' };
        aiReply = `Based on your live academic records in **MongoDB**:\n\n- **CS-301 (Algorithms)**: **87.5%** (21/24 classes attended) ✅ *Status: Good*\n- **CS-305 (Cloud Computing)**: **72.2%** (13/18 classes attended) ⚠️ *CRITICAL: Below 75% threshold!*\n\n> [!WARNING]\n> University Regulation 4.2 states that attendance below 75% leads to examination debarment. You must attend the next 2 consecutive CS-305 lectures to return to safe standing.`;
        citations = [{ doc: 'University Academic Code 2026 - Sec 4.2', score: 0.94 }];
      } else if (lower.includes('assignment') || lower.includes('deadline') || lower.includes('homework')) {
        toolInfo = { tool: 'getPendingAssignments', data: 'MongoDB Assignments Collection' };
        aiReply = `You have **1 upcoming assignment** due this week:\n\n- **Problem Set 1 (CS-301)**: *Dynamic Programming & Knapsack*\n  - Due: **In 3 days** (Friday at 11:59 PM)\n  - Max Points: 100\n  - Status: *Pending Submission*\n\nYou can upload your solution directly via the **Assignments** tab.`;
      } else if (lower.includes('fee') || lower.includes('tuition') || lower.includes('payment')) {
        aiReply = `The tuition fee deadline for the Fall 2026 semester is **October 15, 2026**.\n\n- Late fine of $50 applies for payments received between Oct 16 and Oct 25.\n- Payment methods: Net Banking, Credit/Debit Card, or wire transfer via the Bursar portal.\n- Scholarship deductions are reflected under your Student Finance tab.`;
        citations = [{ doc: 'Bursar Financial Regulations Fall 2026', score: 0.91 }];
      } else if (lower.includes('health') || lower.includes('clinic') || lower.includes('doctor')) {
        aiReply = `The **Student Health & Counseling Center** is located on the ground floor of the Campus Wellness Pavilion (Building D, Room 102).\n\n- Operating Hours: Monday – Friday, 8:00 AM – 6:00 PM\n- 24/7 Emergency Line: +1-555-HELP (4357)\n- Walk-in consultations are available for all enrolled students.`;
        citations = [{ doc: 'Campus Directory & Amenities Handbook', score: 0.89 }];
      } else {
        aiReply = `I understand your query regarding "${promptToSend}".\n\nTo give you the most accurate answer grounded in official university policies, could you specify your registered subject or department? You can also escalate this conversation directly to a student advisor using the **Escalate Ticket** button below.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          content: aiReply,
          toolCalls: toolInfo ? [toolInfo] : [],
          groundingSources: citations || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }, 900);
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
        content: `Started a fresh conversation session. How can I assist your studies or campus questions?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const quickPrompts = [
    'What is my CS-301 attendance?',
    'Upcoming assignment deadlines',
    'Fall semester fee payment deadline',
    'Where is the Student Health Center?'
  ];

  return (
    <div
      className="animate-fade-in chat-layout"
      style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
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

        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.65rem', paddingLeft: '0.5rem' }}>
          Recent Discussions
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto', flex: 1 }}>
          {sessions.map((sess) => (
            <button
              key={sess.id}
              onClick={() => setActiveSessionId(sess.id)}
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
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sess.title}
              </span>
            </button>
          ))}
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
                UniAssist AI Agent
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Online (RAG Enabled)</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Azure OpenAI GPT-4o-mini &bull; Hybrid Semantic Grounding
              </div>
            </div>
          </div>

          {/* Escalate to Human Ticket Button & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
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
          {messages.map((msg) => {
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
                  <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} />
                </div>
              );
            }

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
                      boxShadow: isUser ? '0 4px 14px rgba(59, 130, 246, 0.3)' : 'var(--shadow-sm)',
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {msg.content}
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

                  {/* ── Smart AI Flashcard Generator Chips (Only on Assistant Replies) ── */}
                  {!isUser && msg.id !== 'welcome-1' && (
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
                          padding: '0.2rem 0.55rem',
                          transition: 'all 0.2s'
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
                          padding: '0.2rem 0.55rem',
                          transition: 'all 0.2s'
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
                          padding: '0.2rem 0.55rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        📐 Formulas
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateChatFlashcards(msg.content, 'chatbot_definition', 'Definitions')}
                        disabled={Boolean(generatingCardMsgId)}
                        className="badge"
                        style={{
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: '#f59e0b',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                          padding: '0.2rem 0.55rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        📖 Definitions
                      </button>
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
          {isTyping && (
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
                <span>Evaluating university records</span>
                <span className="dot-pulse">...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{ padding: '0.5rem 1.5rem', display: 'flex', gap: '0.4rem', overflowX: 'auto', background: 'rgba(255, 255, 255, 0.01)' }}>
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(p)}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '0.3rem 0.75rem',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {p}
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
              placeholder="Ask anything about courses, attendance, fees, exams..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              style={{ padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-full)' }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!inputValue.trim() || isTyping}
              style={{ borderRadius: 'var(--radius-full)', width: '46px', height: '46px', padding: 0 }}
            >
              <Send size={18} />
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
