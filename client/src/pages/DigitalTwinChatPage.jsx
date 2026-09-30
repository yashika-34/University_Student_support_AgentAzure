import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { digitalTwinAPI } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import {
  Send, ArrowLeft, Brain, Loader2, Sparkles, 
  RotateCcw, Copy, Check, Search, BookOpen,
  Mic, MicOff, Volume2, VolumeX, Download, 
  HelpCircle, UserCheck, AlertCircle, X, Square
} from 'lucide-react';

// Lightweight markdown renderer
const renderMarkdown = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(99,102,241,0.12);padding:0.15rem 0.4rem;border-radius:4px;font-size:0.88em;font-family:monospace">$1</code>')
    .replace(/^### (.*$)/gm, '<h4 style="margin:0.75rem 0 0.25rem;font-size:0.95rem;font-weight:700">$1</h4>')
    .replace(/^## (.*$)/gm, '<h3 style="margin:0.85rem 0 0.35rem;font-size:1.05rem;font-weight:700">$1</h3>')
    .replace(/^# (.*$)/gm, '<h2 style="margin:1rem 0 0.5rem;font-size:1.15rem;font-weight:800">$1</h2>')
    .replace(/^\* (.*$)/gm, '<li style="margin-left:1.25rem;margin-bottom:0.25rem">$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li style="margin-left:1.25rem;margin-bottom:0.25rem;list-style-type:decimal">$1</li>')
    .replace(/\n\n/g, '</p><p style="margin:0.5rem 0">')
    .replace(/\n/g, '<br/>');
};

// ── 1. Clean Twin Discovery Grid ──────────────────────────────────────────────
const DiscoverPanel = ({ onSelectTwin }) => {
  const [twins, setTwins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    digitalTwinAPI.discoverTwins()
      .then(res => setTwins(res.data.twins || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredTwins = twins.filter(t =>
    t.twinName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.createdBy?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '1rem',
        padding: '2rem 1.75rem',
        marginBottom: '1.75rem',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))',
          fontSize: '1.75rem', marginBottom: '0.75rem'
        }}>
          🧠
        </div>
        <h1 style={{ margin: '0 0 0.35rem', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Faculty AI Twins
        </h1>
        <p style={{ margin: '0 auto 1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: 520, lineHeight: 1.5 }}>
          24/7 AI assistants trained directly on your professors' actual lecture notes, syllabus, and course materials.
        </p>

        {/* Search */}
        <div style={{
          maxWidth: 440, margin: '0 auto',
          position: 'relative', display: 'flex', alignItems: 'center'
        }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by professor, subject, or course..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem', borderRadius: '999px', fontSize: '0.88rem' }}
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent-primary)', marginBottom: '0.75rem' }} />
          <p style={{ fontSize: '0.9rem' }}>Finding available teacher twins...</p>
        </div>
      ) : filteredTwins.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', borderRadius: '1rem' }}>
          <Brain size={44} style={{ opacity: 0.25, marginBottom: '0.75rem' }} />
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem' }}>No Teacher Twins Found</h3>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            {searchQuery ? 'No twins match your search query.' : 'Ask your professors to publish their Digital Twins!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {filteredTwins.map((twin) => (
            <div
              key={twin._id}
              onClick={() => onSelectTwin(twin._id)}
              className="card"
              style={{
                padding: '1.25rem',
                borderRadius: '1rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
                border: '1px solid var(--border-subtle)',
                position: 'relative'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(99,102,241,0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.6rem'
                  }}>
                    {twin.avatarEmoji || '🧑‍🏫'}
                  </div>

                  <span style={{
                    padding: '0.15rem 0.5rem', borderRadius: '999px',
                    fontSize: '0.7rem', fontWeight: 600,
                    background: 'rgba(16, 185, 129, 0.12)', color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.25)'
                  }}>
                    ● Online
                  </span>
                </div>

                <h3 style={{ margin: '0 0 0.2rem', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {twin.twinName}
                </h3>

                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 600,
                  marginBottom: '0.75rem'
                }}>
                  <BookOpen size={13} /> {twin.subject}
                </div>

                <p style={{
                  margin: '0 0 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)',
                  lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>
                  {twin.greetingMessage || 'Available to answer all your course questions 24/7.'}
                </p>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.78rem', color: 'var(--text-secondary)'
              }}>
                <span>{twin.knowledgeBase?.length || 0} notes loaded</span>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Start Chat →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── 2. Complete, Feature-Packed Modern Chat Interface ────────────────────────
const ChatInterface = ({ twinId, onBack }) => {
  const toast = useToast();
  const [twin, setTwin] = useState(null);
  const [loadingTwin, setLoadingTwin] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  
  // Voice interaction states
  const [isListening, setIsListening] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);

  // Escalation Modal
  const [escalatingMsg, setEscalatingMsg] = useState(null);
  const [escalateNote, setEscalateNote] = useState('');
  const [submittingEscalate, setSubmittingEscalate] = useState(false);

  const messagesEndRef = useRef();
  const textareaRef = useRef();
  const recognitionRef = useRef(null);

  const SUGGESTIONS = [
    'What are the key concepts in this subject?',
    'Can you explain the most challenging topic simply?',
    'What should I prioritize when studying for the exam?',
    'Give me 3 practice questions with hints'
  ];

  // Stop text-to-speech immediately
  const handleStopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingIdx(null);
  };

  // Stop microphone listening immediately
  const handleStopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
    }
    setIsListening(false);
  };

  // Safe Back handler that terminates all active audio/mic
  const handleSafeBack = () => {
    handleStopSpeaking();
    handleStopListening();
    onBack();
  };

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Fetch twin details and student's persistent conversation history
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingTwin(true);
        const discoverRes = await digitalTwinAPI.discoverTwins();
        const found = discoverRes.data.twins?.find(t => t._id === twinId);
        if (found) setTwin(found);

        const historyRes = await digitalTwinAPI.getConversationHistory(twinId);
        if (historyRes.data.messages && historyRes.data.messages.length > 0) {
          setMessages(historyRes.data.messages);
        } else if (found) {
          setMessages([
            { role: 'assistant', content: found.greetingMessage || 'Hello! How can I assist you with your studies today?', isGreeting: true }
          ]);
        }
      } catch (err) {
        toast.error('Could not load twin or chat history.');
      } finally {
        setLoadingTwin(false);
      }
    };

    loadData();

    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, [twinId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = async (customText) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || sending) return;

    // Stop any ongoing audio playback or voice input
    handleStopSpeaking();
    handleStopListening();

    const userMsg = { role: 'user', content: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await digitalTwinAPI.chatWithTwin(twinId, {
        message: textToSend
      });
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.data.reply,
          sourceCitation: res.data.sourceCitation,
          timestamp: new Date()
        }
      ]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Unable to connect to AI Twin. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errMsg}`, isError: true }]);
    } finally {
      setSending(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Toggle Voice Input (Speech-to-Text)
  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Voice recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      handleStopListening();
      toast.info('Stopped listening.');
    } else {
      handleStopSpeaking(); // Stop any audio playing
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.info('Listening... Speak your question now! 🎙️');
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  // Text-to-Speech (Read Aloud Toggle)
  const handleToggleSpeak = (text, idx) => {
    if (!('speechSynthesis' in window)) {
      toast.error('Text-to-speech is not supported in this browser.');
      return;
    }

    if (speakingIdx === idx) {
      handleStopSpeaking();
    } else {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#`_]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.onend = () => setSpeakingIdx(null);
      utterance.onerror = () => setSpeakingIdx(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingIdx(idx);
    }
  };

  // Clear / Reset Conversation
  const handleClear = async () => {
    if (!twin) return;
    handleStopSpeaking();
    handleStopListening();
    try {
      await digitalTwinAPI.clearConversationHistory(twinId);
      setMessages([
        { role: 'assistant', content: twin.greetingMessage || 'Chat reset! How can I help you today?', isGreeting: true }
      ]);
      toast.success('Conversation history cleared.');
    } catch (err) {
      toast.error('Failed to reset conversation.');
    }
  };

  // Export Chat as Study Notes (.md / .txt)
  const handleExportNotes = () => {
    if (messages.length <= 1) {
      toast.info('No conversation to export yet.');
      return;
    }

    let markdown = `# Study Revision Notes - ${twin?.subject || 'Course'}\n`;
    markdown += `Generated from session with ${twin?.twinName || 'AI Professor Twin'}\n`;
    markdown += `Date: ${new Date().toLocaleDateString()}\n\n---\n\n`;

    messages.forEach((msg, idx) => {
      if (msg.role === 'user') {
        markdown += `### ❓ Question:\n${msg.content}\n\n`;
      } else {
        markdown += `### 💡 Professor's Answer:\n${msg.content}\n\n`;
        if (msg.sourceCitation) {
          markdown += `*Reference: ${msg.sourceCitation}*\n\n`;
        }
        markdown += `---\n\n`;
      }
    });

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(twin?.subject || 'Study_Notes').replace(/[^a-zA-Z0-9]/g, '_')}_Revision_Notes.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Study notes downloaded! 📥');
  };

  // Submit Doubt Escalation to Professor
  const handleConfirmEscalate = async () => {
    if (!escalatingMsg) return;
    setSubmittingEscalate(true);
    try {
      await digitalTwinAPI.escalateDoubt(twinId, {
        question: escalatingMsg.content,
        context: escalateNote
      });
      toast.success('Doubt forwarded directly to your professor! 📬');
      setEscalatingMsg(null);
      setEscalateNote('');
    } catch (err) {
      toast.error('Failed to escalate doubt.');
    } finally {
      setSubmittingEscalate(false);
    }
  };

  if (loadingTwin) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '0.75rem' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Connecting with professor's twin...</span>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 860, margin: '0 auto', height: 'calc(100vh - 120px)',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-card)', borderRadius: '1rem',
      border: '1px solid var(--border-subtle)', overflow: 'hidden',
      boxShadow: '0 8px 30px rgba(0,0,0,0.06)', position: 'relative'
    }}>
      {/* ── Top Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.85rem 1.25rem',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-card)', flexWrap: 'wrap', gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleSafeBack}
            className="btn btn-secondary"
            style={{ padding: '0.4rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center' }}
            title="Back to directory"
          >
            <ArrowLeft size={16} />
          </button>

          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem', flexShrink: 0
          }}>
            {twin?.avatarEmoji || '🧑‍🏫'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                {twin?.twinName}
              </span>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#10b981', display: 'inline-block'
              }} />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {twin?.subject}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Prominent Audio Stop Button in top bar if audio is playing */}
          {speakingIdx !== null && (
            <button
              onClick={handleStopSpeaking}
              style={{
                padding: '0.35rem 0.75rem', borderRadius: '999px',
                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#ef4444', fontSize: '0.78rem', fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem',
                transition: 'all 0.15s'
              }}
              title="Stop audio readout immediately"
            >
              <VolumeX size={14} /> Stop Audio ⏹️
            </button>
          )}

          <button
            onClick={handleExportNotes}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            title="Download conversation as study notes"
          >
            <Download size={13} /> Notes
          </button>

          <button
            onClick={handleClear}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            title="Restart conversation"
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      {/* ── Chat Messages Feed ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '1.25rem',
        display: 'flex', flexDirection: 'column', gap: '1rem',
        background: 'var(--bg-secondary)'
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              gap: '0.6rem',
              alignItems: 'flex-start'
            }}
          >
            {/* Avatar */}
            {msg.role === 'assistant' && (
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.95rem'
              }}>
                {twin?.avatarEmoji || '🧑‍🏫'}
              </div>
            )}

            <div style={{
              maxWidth: '82%', position: 'relative',
              padding: '0.85rem 1.15rem',
              borderRadius: msg.role === 'user'
                ? '1rem 0.25rem 1rem 1rem'
                : '0.25rem 1rem 1rem 1rem',
              background: msg.role === 'user'
                ? 'var(--accent-primary)'
                : 'var(--bg-card)',
              color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
              border: msg.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
              fontSize: '0.88rem', lineHeight: 1.6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              {msg.role === 'assistant' ? (
                <div>
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />

                  {/* Source Citation Badge */}
                  {msg.sourceCitation && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      marginTop: '0.6rem', padding: '0.2rem 0.6rem', borderRadius: '0.4rem',
                      background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                      fontSize: '0.74rem', color: 'var(--accent-primary)', fontWeight: 600
                    }}>
                      <BookOpen size={12} /> Source: {msg.sourceCitation}
                    </div>
                  )}

                  {/* Message Bottom Action Toolbar */}
                  {!msg.isGreeting && !msg.isError && (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                      gap: '0.6rem', marginTop: '0.6rem', borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '0.4rem'
                    }}>
                      {/* Read Aloud / Stop Audio Button */}
                      {speakingIdx === idx ? (
                        <button
                          onClick={handleStopSpeaking}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            borderRadius: '0.35rem',
                            cursor: 'pointer',
                            color: '#ef4444',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.2rem 0.55rem'
                          }}
                          title="Stop audio playback"
                        >
                          <VolumeX size={13} /> Stop Audio ⏹️
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleSpeak(msg.content, idx)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-secondary)', fontSize: '0.72rem',
                            display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.35rem'
                          }}
                          title="Listen to this explanation"
                        >
                          <Volume2 size={12} /> Listen
                        </button>
                      )}

                      {/* Copy Button */}
                      <button
                        onClick={() => handleCopy(msg.content, idx)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-secondary)', fontSize: '0.72rem',
                          display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.35rem'
                        }}
                      >
                        {copiedIdx === idx ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                        {copiedIdx === idx ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div>{msg.content}</div>
                  {/* Escalate Doubt to Professor Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.35rem' }}>
                    <button
                      onClick={() => setEscalatingMsg(msg)}
                      style={{
                        background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '0.3rem',
                        cursor: 'pointer', color: '#fff', fontSize: '0.7rem',
                        display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.45rem'
                      }}
                      title="Send this question directly to your professor"
                    >
                      <HelpCircle size={11} /> Ask Prof
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {sending && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem'
            }}>
              {twin?.avatarEmoji || '🧑‍🏫'}
            </div>
            <div style={{
              padding: '0.6rem 0.9rem', borderRadius: '0.25rem 1rem 1rem 1rem',
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8rem'
            }}>
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
              <span>Thinking with course notes...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Suggested Question Chips ── */}
      {messages.length <= 1 && !sending && (
        <div style={{
          padding: '0.6rem 1rem', background: 'var(--bg-card)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', gap: '0.4rem', overflowX: 'auto', whiteSpace: 'nowrap'
        }}>
          {SUGGESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              style={{
                padding: '0.35rem 0.75rem', borderRadius: '999px',
                background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)', fontSize: '0.76rem', cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.color = 'var(--accent-primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* ── Active Listening Bar (When Mic is active) ── */}
      {isListening && (
        <div style={{
          padding: '0.6rem 1.25rem',
          background: 'rgba(239,68,68,0.08)',
          borderTop: '1px solid rgba(239,68,68,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.82rem',
          color: '#ef4444',
          fontWeight: 600
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: '#ef4444',
              display: 'inline-block', animation: 'pulse 1s infinite'
            }} />
            <span>🎙️ Listening to you... Speak your doubt clearly.</span>
          </div>

          <button
            onClick={handleStopListening}
            style={{
              background: '#ef4444', color: '#fff', border: 'none',
              borderRadius: '0.4rem', padding: '0.3rem 0.75rem',
              fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              boxShadow: '0 2px 8px rgba(239,68,68,0.3)'
            }}
          >
            <MicOff size={13} /> Stop Listening ⏹️
          </button>
        </div>
      )}

      {/* ── Input Bar with Voice & Send ── */}
      <div style={{
        padding: '0.75rem 1rem',
        background: 'var(--bg-card)',
        borderTop: isListening ? 'none' : '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: '0.6rem'
      }}>
        {/* Voice Input Button */}
        <button
          onClick={toggleListening}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: isListening ? '#ef4444' : 'var(--bg-secondary)',
            color: isListening ? '#fff' : 'var(--text-secondary)',
            border: isListening ? 'none' : '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
            animation: isListening ? 'pulse 1.5s infinite' : 'none'
          }}
          title={isListening ? 'Click to Stop Listening' : 'Speak doubt (Mic)'}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? 'Listening to your voice...' : `Ask ${twin?.twinName || 'AI Twin'} about ${twin?.subject || 'this course'}...`}
          rows={1}
          style={{
            flex: 1, resize: 'none', border: '1px solid var(--border-subtle)',
            borderRadius: '999px', padding: '0.65rem 1.15rem',
            background: 'var(--bg-secondary)', color: 'var(--text-primary)',
            fontSize: '0.88rem', outline: 'none', lineHeight: 1.4,
            fontFamily: 'inherit'
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
        />

        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || sending}
          className="btn btn-primary"
          style={{
            width: 40, height: 40, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0, flexShrink: 0
          }}
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>

      {/* ── Escalate Doubt Modal ── */}
      {escalatingMsg && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', zIndex: 100
        }}>
          <div className="card" style={{ maxWidth: 440, width: '100%', padding: '1.5rem', borderRadius: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={20} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Ask Professor Directly</h3>
              </div>
              <button
                onClick={() => setEscalatingMsg(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Forward this doubt to your professor's inbox. They will see your question and reply directly.
            </p>

            <div style={{
              padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)', marginBottom: '1rem',
              fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)'
            }}>
              "{escalatingMsg.content}"
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Additional Context or Note (Optional)</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="e.g. I need clarification on step 3 specifically for the assignment..."
                value={escalateNote}
                onChange={e => setEscalateNote(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                onClick={() => setEscalatingMsg(null)}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEscalate}
                disabled={submittingEscalate}
                className="btn btn-primary"
                style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                {submittingEscalate ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Send to Professor
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>

    </div>
  );
};

// ── 3. Page Router Component ──────────────────────────────────────────────────
const DigitalTwinChatPage = () => {
  const { twinId: paramTwinId } = useParams();
  const [selectedTwinId, setSelectedTwinId] = useState(paramTwinId || null);

  useEffect(() => {
    if (paramTwinId) {
      setSelectedTwinId(paramTwinId);
    }
  }, [paramTwinId]);

  if (selectedTwinId) {
    return (
      <div className="page-wrapper" style={{ padding: '1rem 0' }}>
        <ChatInterface twinId={selectedTwinId} onBack={() => setSelectedTwinId(null)} />
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ padding: '1.5rem 0' }}>
      <DiscoverPanel onSelectTwin={setSelectedTwinId} />
    </div>
  );
};

export default DigitalTwinChatPage;
