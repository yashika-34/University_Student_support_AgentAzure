import React, { useState, useEffect } from 'react';
import ModalPortal from '../components/ModalPortal.jsx';
import api from '../services/api.js';
import {
  MessageSquare,
  Award,
  ThumbsUp,
  CheckCircle2,
  PlusCircle,
  Sparkles,
  Users,
  Search,
  Loader2,
  X,
  Send,
  Eye,
  MessageCircle
} from 'lucide-react';

const CommunityHubPage = () => {
  const [activeTab, setActiveTab] = useState('forum');

  // Forum State
  const [forumPosts, setForumPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCategory, setSearchCategory] = useState('All');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('Algorithms');
  const [newPostContent, setNewPostContent] = useState('');
  const [badges, setBadges] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    const loadCommunityData = async () => {
      setLoading(true);
      try {
        const [postsRes, badgesRes] = await Promise.allSettled([
          api.get('/engagement/forum'),
          api.get('/engagement/badges')
        ]);
        if (postsRes.status === 'fulfilled') {
          const posts = postsRes.value.data?.data || postsRes.value.data?.posts || [];
          setForumPosts(Array.isArray(posts) ? posts : []);
        }
        if (badgesRes.status === 'fulfilled') {
          const badgeData = badgesRes.value.data?.data;
          const badges = badgeData?.badges || (Array.isArray(badgeData) ? badgeData : []);
          setBadges(badges);
        }
      } catch (err) {
        console.error('Failed to load community data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCommunityData();
  }, []);

  const handleUpvote = (id) => {
    setForumPosts(forumPosts.map(p => p.id === id ? { ...p, upvotes: (p.upvotes || 0) + 1 } : p));
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: newPostTitle,
        category: newPostCategory,
        content: newPostContent
      };
      const res = await api.post('/engagement/forum', payload);
      const newPost = res.data?.data || res.data?.post;
      if (newPost) {
        setForumPosts([newPost, ...forumPosts]);
      } else {
        const localPost = {
          id: `post-${Date.now()}`,
          title: newPostTitle,
          category: newPostCategory,
          content: newPostContent,
          authorName: 'Alex Mercer',
          authorRole: 'student',
          upvotes: 1,
          isSolved: false,
          createdAt: new Date().toISOString(),
          replies: []
        };
        setForumPosts([localPost, ...forumPosts]);
      }
    } catch {
      const fallbackPost = {
        id: `post-${Date.now()}`,
        title: newPostTitle,
        category: newPostCategory,
        content: newPostContent,
        authorName: 'Alex Mercer',
        authorRole: 'student',
        upvotes: 1,
        isSolved: false,
        createdAt: new Date().toISOString(),
        replies: []
      };
      setForumPosts([fallbackPost, ...forumPosts]);
    }
    setShowNewPostModal(false);
    setNewPostTitle('');
    setNewPostContent('');
  };

  const handlePostReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedThread) return;
    setSubmittingReply(true);
    try {
      const newReply = {
        authorName: 'Alex Mercer',
        authorRole: 'student',
        content: replyText,
        isVerifiedAnswer: false,
        createdAt: new Date().toISOString()
      };

      try {
        await api.post(`/engagement/forum/${selectedThread.id}/reply`, { content: replyText });
      } catch (err) {
        // Fallback local update
      }

      const updatedPosts = forumPosts.map((p) => {
        if (p.id === selectedThread.id) {
          const replies = [...(p.replies || []), newReply];
          return { ...p, replies };
        }
        return p;
      });
      setForumPosts(updatedPosts);
      setSelectedThread((prev) => ({
        ...prev,
        replies: [...(prev.replies || []), newReply]
      }));
      setReplyText('');
    } finally {
      setSubmittingReply(false);
    }
  };

  const filteredPosts = searchCategory === 'All'
    ? forumPosts
    : forumPosts.filter(p => p.category === searchCategory);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
          <Users size={16} /> Campus Network &amp; Gamification
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.35rem' }}>
          Community &amp; Achievements Hub
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Collaborate with peers on course queries, review faculty-verified answers, and showcase earned academic badges and XP.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', overflowX: 'auto' }}>
        {[
          { id: 'forum', label: 'Student Discussion Forum', icon: MessageSquare },
          { id: 'badges', label: 'Achievements & Badge Showcase', icon: Award }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.1rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isActive ? 'var(--primary-gradient)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Discussion Forum */}
      {activeTab === 'forum' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Peer Academic Discussion Boards</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Ask code or theory questions, get answers reviewed by TAs and faculty.
              </p>
            </div>
            <button onClick={() => setShowNewPostModal(true)} className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
              <PlusCircle size={16} /> Start Discussion Thread
            </button>
          </div>

          {/* Categories */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {['All', 'Algorithms', 'Cloud Computing', 'Exam Prep'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSearchCategory(cat)}
                style={{
                  padding: '0.4rem 0.95rem',
                  borderRadius: 'var(--radius-full)',
                  border: searchCategory === cat ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                  background: searchCategory === cat ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-input)',
                  color: searchCategory === cat ? 'var(--primary)' : 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Post Thread List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                style={{
                  padding: '1.5rem',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '1rem' }}>
                  <div>
                    <span className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>{post.category}</span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{post.title}</h3>
                  </div>
                  <button
                    onClick={() => handleUpvote(post.id)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.4rem 0.75rem',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}
                  >
                    <ThumbsUp size={14} /> {post.upvotes}
                  </button>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1rem', lineHeight: 1.6 }}>
                  {post.content}
                </p>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Posted by <strong>{post.authorName}</strong> &bull; {new Date(post.createdAt).toLocaleDateString()}
                </div>

                {/* Replies */}
                {post.replies && post.replies.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {post.replies.map((r, rIdx) => (
                      <div key={rIdx} style={{ padding: '0.85rem', background: 'rgba(16, 185, 129, 0.08)', borderLeft: '3px solid var(--success)', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--success)' }}>{r.authorName} ({r.authorRole.toUpperCase()})</span>
                          {r.isVerifiedAnswer && (
                            <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                              <CheckCircle2 size={12} /> Verified Solution
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{r.content}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Discussion Action / Popup */}
                <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.85rem' }}>
                  <button
                    onClick={() => setSelectedThread(post)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.95rem' }}
                  >
                    <MessageCircle size={14} /> Open Thread &amp; Answers ({post.replies?.length || 0})
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── New Discussion Thread Modal via ModalPortal ── */}
          <ModalPortal isOpen={showNewPostModal}>
            {showNewPostModal && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(5px)',
                  zIndex: 99999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem',
                  animation: 'fadeIn 0.15s ease-out'
                }}
                onClick={() => setShowNewPostModal(false)}
              >
                <div
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '90vw',
                    maxWidth: '560px',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'var(--bg-surface, #1e293b)',
                    borderRadius: 'var(--radius-lg, 12px)',
                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
                    overflow: 'hidden',
                    zIndex: 100000
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Sticky Header */}
                  <div style={{
                    position: 'sticky',
                    top: 0,
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg-surface, #1e293b)',
                    zIndex: 10
                  }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      Start Discussion Thread
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowNewPostModal(false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px'
                      }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Scrollable Body */}
                  <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                    <form id="new-post-form" onSubmit={handleCreatePost}>
                      <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label">Discussion Title</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          placeholder="e.g. Best approach for Memoization in LCS"
                          value={newPostTitle}
                          onChange={(e) => setNewPostTitle(e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label">Subject Category</label>
                        <select
                          className="form-select"
                          value={newPostCategory}
                          onChange={(e) => setNewPostCategory(e.target.value)}
                        >
                          <option value="Algorithms">Algorithms</option>
                          <option value="Cloud Computing">Cloud Computing</option>
                          <option value="AI & Neural Networks">AI &amp; Neural Networks</option>
                          <option value="Exam Prep">Exam Prep</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <label className="form-label">Query Description</label>
                        <textarea
                          rows={4}
                          required
                          className="form-textarea"
                          placeholder="Detail your conceptual query or code snippet..."
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                        />
                      </div>
                    </form>
                  </div>

                  {/* Sticky Footer */}
                  <div style={{
                    position: 'sticky',
                    bottom: 0,
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    background: 'var(--bg-surface, #1e293b)',
                    zIndex: 10
                  }}>
                    <button
                      type="button"
                      onClick={() => setShowNewPostModal(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form="new-post-form"
                      className="btn btn-primary"
                    >
                      Publish Question
                    </button>
                  </div>
                </div>
              </div>
            )}
          </ModalPortal>

          {/* ── Thread Discussion & Answers Modal via ModalPortal ── */}
          <ModalPortal isOpen={Boolean(selectedThread)}>
            {selectedThread && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(5px)',
                  zIndex: 99999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem',
                  animation: 'fadeIn 0.15s ease-out'
                }}
                onClick={() => setSelectedThread(null)}
              >
                <div
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '90vw',
                    maxWidth: '680px',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'var(--bg-surface, #1e293b)',
                    borderRadius: 'var(--radius-lg, 12px)',
                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
                    overflow: 'hidden',
                    zIndex: 100000
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Sticky Header */}
                  <div style={{
                    position: 'sticky',
                    top: 0,
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg-surface, #1e293b)',
                    zIndex: 10
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span className="badge badge-primary">{selectedThread.category}</span>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                        Discussion Details
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedThread(null)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px'
                      }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Scrollable Body */}
                  <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        {selectedThread.title}
                      </h2>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Started by <strong>{selectedThread.authorName}</strong> ({selectedThread.authorRole}) &bull; {new Date(selectedThread.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-input, rgba(255,255,255,0.04))', padding: '1.2rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.92rem' }}>
                      {selectedThread.content}
                    </div>

                    {/* Replies list */}
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MessageSquare size={16} color="var(--primary)" /> Responses ({selectedThread.replies?.length || 0})
                      </h4>
                      {(!selectedThread.replies || selectedThread.replies.length === 0) ? (
                        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                          No replies posted yet. Be the first to contribute an answer!
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {selectedThread.replies.map((r, rIdx) => (
                            <div key={rIdx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderLeft: r.isVerifiedAnswer ? '3px solid var(--success)' : '3px solid var(--primary)', borderRadius: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: r.isVerifiedAnswer ? 'var(--success)' : 'var(--text-primary)' }}>
                                    {r.authorName} ({r.authorRole?.toUpperCase()})
                                  </span>
                                  {r.isVerifiedAnswer && (
                                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                                      <CheckCircle2 size={12} /> Verified
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                {r.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add reply form */}
                    <form id="thread-reply-form" onSubmit={handlePostReply} style={{ marginTop: '0.5rem' }}>
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Your Answer or Explanation</label>
                      <textarea
                        rows={3}
                        required
                        className="form-textarea"
                        placeholder="Write a clear, helpful reply with explanations or code snippets..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                    </form>
                  </div>

                  {/* Sticky Footer */}
                  <div style={{
                    position: 'sticky',
                    bottom: 0,
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    background: 'var(--bg-surface, #1e293b)',
                    zIndex: 10
                  }}>
                    <button
                      type="button"
                      onClick={() => setSelectedThread(null)}
                      className="btn btn-secondary"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      form="thread-reply-form"
                      className="btn btn-primary"
                      disabled={submittingReply || !replyText.trim()}
                    >
                      <Send size={15} /> {submittingReply ? 'Posting...' : 'Post Reply'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </ModalPortal>
        </div>
      )}

      {/* Tab 2: Achievements & Badges */}
      {activeTab === 'badges' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          
          {/* Level Progress Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1.75rem',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="badge badge-warning" style={{ marginBottom: '0.3rem' }}>Level 4 Scholar</span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Senior Academic Specialist</h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--warning)' }}>750 / 1,000 XP</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>250 XP until Level 5 Master</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ width: '75%', height: '100%', background: 'linear-gradient(90deg, #f59e0b 0%, #3b82f6 100%)', borderRadius: 'var(--radius-full)' }} />
            </div>
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>Earned &amp; Target Milestone Badges</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {badges.map((badge) => (
              <div
                key={badge.code}
                style={{
                  padding: '1.5rem',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  border: badge.unlocked ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  gap: '1rem',
                  opacity: badge.unlocked ? 1 : 0.65
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: badge.unlocked ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: badge.unlocked ? 'var(--warning)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Award size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{badge.title}</h4>
                    <span className="badge badge-warning">+{badge.xp} XP</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '0.5rem', lineHeight: 1.5 }}>
                    {badge.description}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: badge.unlocked ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600 }}>
                    {badge.unlocked ? `Unlocked on ${badge.unlockedAt}` : `In Progress: ${badge.progress}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default CommunityHubPage;
