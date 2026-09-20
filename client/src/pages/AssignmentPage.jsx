import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { mockData } from '../services/api.js';
import {
  Clock,
  CheckCircle2,
  Upload,
  PlusCircle,
  X,
  Send,
  Bell
} from 'lucide-react';

const AssignmentPage = () => {
  const { role } = useAuth();
  const [assignments, setAssignments] = useState(mockData.assignments);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [reminders, setReminders] = useState({ 'asg-1': true });

  const toggleReminder = (id) => {
    setReminders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Faculty state: Create new assignment
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    courseCode: 'CS-301',
    title: '',
    description: '',
    maxScore: 100,
    dueDate: ''
  });

  const filtered = assignments.filter((item) => {
    if (activeFilter === 'pending') return item.status === 'pending';
    if (activeFilter === 'submitted') return item.status === 'submitted' || item.status === 'graded';
    return true;
  });

  const handleOpenSubmit = (assignment) => {
    setSelectedAssignment(assignment);
    setUploadFile(null);
    setSubmittedSuccess(false);
  };

  const handleConfirmSubmit = (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    // Update state
    const updated = assignments.map((a) => {
      if (a.id === selectedAssignment.id) {
        return { ...a, status: 'submitted' };
      }
      return a;
    });

    setAssignments(updated);
    setSubmittedSuccess(true);
    setTimeout(() => {
      setSelectedAssignment(null);
      setSubmittedSuccess(false);
    }, 1800);
  };

  const handleCreateAssignment = (e) => {
    e.preventDefault();
    const created = {
      id: `asg-${Date.now()}`,
      courseCode: newAssignment.courseCode,
      title: newAssignment.title,
      description: newAssignment.description,
      maxScore: Number(newAssignment.maxScore),
      dueDate: newAssignment.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending'
    };

    setAssignments([created, ...assignments]);
    setShowCreateModal(false);
    setNewAssignment({ courseCode: 'CS-301', title: '', description: '', maxScore: 100, dueDate: '' });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Assignments &amp; Deliverables
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Track project milestones, upload problem sets, and view faculty evaluation feedback.
          </p>
        </div>

        {role === 'faculty' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ padding: '0.65rem 1.25rem' }}
          >
            <PlusCircle size={16} /> Create Assignment
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        {['all', 'pending', 'submitted'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            style={{
              background: activeFilter === tab ? 'var(--primary)' : 'transparent',
              color: activeFilter === tab ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              textTransform: 'capitalize'
            }}
          >
            {tab === 'all' ? 'All Deliverables' : tab}
          </button>
        ))}
      </div>

      {/* Assignments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filtered.map((item) => {
          const isPending = item.status === 'pending';
          const dueDateFormatted = new Date(item.dueDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div
              key={item.id}
              className="glass-panel"
              style={{
                padding: '1.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.5rem',
                borderLeft: isPending ? '4px solid var(--warning)' : '4px solid var(--success)'
              }}
            >
              <div style={{ flex: '1', minWidth: '280px' }}>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="badge badge-primary">{item.courseCode}</span>
                  <span className={`badge ${isPending ? 'badge-warning' : 'badge-success'}`}>
                    {item.status}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Max: {item.maxScore} pts
                  </span>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  {item.title}
                </h3>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                  {item.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  <Clock size={14} /> Deadline: <strong style={{ color: 'var(--text-primary)' }}>{dueDateFormatted}</strong>
                </div>
              </div>

              {/* Action & Reminder */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {isPending && (
                  <button
                    onClick={() => toggleReminder(item.id)}
                    style={{
                      background: reminders[item.id] ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-input)',
                      border: `1px solid ${reminders[item.id] ? 'var(--primary)' : 'var(--border-subtle)'}`,
                      color: reminders[item.id] ? 'var(--primary)' : 'var(--text-muted)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.65rem 0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.82rem',
                      fontWeight: 600
                    }}
                    title={reminders[item.id] ? 'Reminder active: 24h & 2h before deadline' : 'Set deadline reminder'}
                  >
                    <Bell size={14} />
                    {reminders[item.id] ? 'Reminder Active' : 'Set Reminder'}
                  </button>
                )}

                {isPending ? (
                  <button
                    onClick={() => handleOpenSubmit(item)}
                    className="btn btn-primary"
                    style={{ padding: '0.65rem 1.4rem' }}
                  >
                    <Upload size={16} /> Submit Solution
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem' }}>
                    <CheckCircle2 size={18} /> Uploaded &amp; Verified
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submission Modal */}
      {selectedAssignment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '500px', width: '100%', padding: '2rem', position: 'relative' }}>
            <button
              onClick={() => setSelectedAssignment(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>{selectedAssignment.courseCode}</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{selectedAssignment.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Upload your completed report or code archive. Supported formats: .pdf, .zip, .docx.
            </p>

            {submittedSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--success)' }}>
                <CheckCircle2 size={48} style={{ margin: '0 auto 0.75rem' }} />
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Assignment Submitted Successfully!</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Timestamp recorded. Verified by faculty evaluator.</div>
              </div>
            ) : (
              <form onSubmit={handleConfirmSubmit}>
                <div style={{
                  border: '2px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  background: 'var(--bg-input)',
                  marginBottom: '1.5rem',
                  cursor: 'pointer'
                }}>
                  <Upload size={32} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    {uploadFile ? uploadFile.name : 'Choose a file or drag here'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PDF, ZIP up to 25MB</div>
                  <input
                    type="file"
                    required
                    style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}
                    onChange={(e) => setUploadFile(e.target.files[0])}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setSelectedAssignment(null)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={!uploadFile}>
                    <Send size={16} /> Confirm Submission
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Faculty Create Assignment Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '540px', width: '100%', padding: '2rem', position: 'relative' }}>
            <button
              onClick={() => setShowCreateModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.25rem' }}>Publish New Assignment</h3>

            <form onSubmit={handleCreateAssignment}>
              <div className="form-group">
                <label className="form-label">Course</label>
                <select
                  className="form-select"
                  value={newAssignment.courseCode}
                  onChange={(e) => setNewAssignment({ ...newAssignment, courseCode: e.target.value })}
                >
                  <option value="CS-301">CS-301 (Algorithms)</option>
                  <option value="CS-305">CS-305 (Cloud Computing)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assignment Title</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Midterm Project: Neural Network Classifier"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description &amp; Guidelines</label>
                <textarea
                  required
                  rows="3"
                  className="form-textarea"
                  placeholder="Specify problem statements, submission requirements, and rubrics..."
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Max Points</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newAssignment.maxScore}
                    onChange={(e) => setNewAssignment({ ...newAssignment, maxScore: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish to Students
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AssignmentPage;
