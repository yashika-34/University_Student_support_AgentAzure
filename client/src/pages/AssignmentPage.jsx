import React, { useState, useEffect } from 'react';
import ModalPortal from '../components/ModalPortal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { assignmentAPI, courseAPI } from '../services/api.js';
import {
  Clock,
  CheckCircle2,
  Upload,
  PlusCircle,
  X,
  Send,
  Bell,
  Loader2,
  FileText,
  AlertCircle,
  Eye
} from 'lucide-react';

const AssignmentPage = () => {
  const { role } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [viewAssignment, setViewAssignment] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [facultyCourses, setFacultyCourses] = useState([]);

  // Faculty state: Create new assignment
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    courseId: '',
    title: '',
    description: '',
    maxScore: 100,
    dueDate: ''
  });
  const [createLoading, setCreateLoading] = useState(false);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      if (role === 'student') {
        const res = await assignmentAPI.getMyAssignments();
        setAssignments(res.data?.data || []);
      } else {
        // Faculty: load courses first
        const cRes = await courseAPI.getMyCourses();
        const courses = cRes.data?.data || [];
        setFacultyCourses(courses);
        if (courses.length > 0) {
          setNewAssignment((prev) => ({ ...prev, courseId: courses[0]._id }));
          const asgRes = await assignmentAPI.getByCourse(courses[0]._id);
          setAssignments(asgRes.data?.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [role]);

  const handleFacultyCourseFilter = async (courseId) => {
    setNewAssignment((prev) => ({ ...prev, courseId }));
    try {
      const asgRes = await assignmentAPI.getByCourse(courseId);
      setAssignments(asgRes.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = assignments.filter((item) => {
    if (activeFilter === 'pending') return item.status === 'pending' || item.status === 'overdue';
    if (activeFilter === 'submitted') return item.status === 'submitted' || item.status === 'graded';
    return true;
  });

  const handleOpenSubmit = (assignment) => {
    setSelectedAssignment(assignment);
    setUploadFile(null);
    setSubmissionText('');
    setSubmittedSuccess(false);
  };

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    setSubmitting(true);

    try {
      const fileName = uploadFile ? uploadFile.name : 'Solution_Document.pdf';
      await assignmentAPI.submit(selectedAssignment.id, {
        fileName,
        fileUrl: fileName,
        content: submissionText || `Submitted solution file: ${fileName}`
      });

      setSubmittedSuccess(true);
      setTimeout(() => {
        setSelectedAssignment(null);
        setSubmittedSuccess(false);
        loadAssignments();
      }, 1500);
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await assignmentAPI.create({
        courseId: newAssignment.courseId,
        title: newAssignment.title,
        description: newAssignment.description,
        maxScore: Number(newAssignment.maxScore),
        dueDate: new Date(newAssignment.dueDate).toISOString()
      });
      setShowCreateModal(false);
      setNewAssignment({
        courseId: facultyCourses[0]?._id || '',
        title: '',
        description: '',
        maxScore: 100,
        dueDate: ''
      });
      loadAssignments();
    } catch (err) {
      console.error('Failed to create assignment:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <Loader2 size={36} className="animate-spin" color="var(--primary)" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading assignments from database...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Course Assignments &amp; Submissions
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Track task deadlines, upload homework deliverables (PDF, DOCX), and view grades stored in MongoDB.
          </p>
        </div>

        {role === 'faculty' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <PlusCircle size={18} /> Post New Assignment
          </button>
        )}
      </div>

      {/* Course Selector for Faculty */}
      {role === 'faculty' && facultyCourses.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter by Course:</span>
          {facultyCourses.map((c) => (
            <button
              key={c._id}
              onClick={() => handleFacultyCourseFilter(c._id)}
              className={`btn ${newAssignment.courseId === c._id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            >
              {c.courseCode} — {c.courseName}
            </button>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {['all', 'pending', 'submitted'].map((tab) => (
          <button
            key={tab}
            className={`btn ${activeFilter === tab ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveFilter(tab)}
            style={{ textTransform: 'capitalize' }}
          >
            {tab === 'all' ? 'All Assignments' : tab}
          </button>
        ))}
      </div>

      {/* Assignment List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filtered.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2rem', gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)' }}>
            No assignments found matching this filter.
          </div>
        ) : (
          filtered.map((item) => {
            const isDueSoon = new Date(item.dueDate) - new Date() < 3 * 24 * 60 * 60 * 1000 && item.status === 'pending';
            return (
              <div key={item.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: isDueSoon ? '4px solid var(--warning)' : '1px solid var(--border)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span className="badge badge-primary">{item.courseCode || item.course?.courseCode}</span>
                    <span className={`badge ${item.status === 'submitted' || item.status === 'graded' ? 'badge-success' : item.status === 'overdue' ? 'badge-danger' : 'badge-warning'}`}>
                      {item.status}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{item.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                    {item.description}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={14} /> Due: {new Date(item.dueDate).toLocaleDateString()}
                    </span>
                    <span>Max Points: <strong>{item.maxScore}</strong></span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => setViewAssignment(item)}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }}
                    >
                      <Eye size={14} /> View Details
                    </button>
                    {role === 'student' && (
                      item.status === 'pending' || item.status === 'overdue' ? (
                        <button
                          onClick={() => handleOpenSubmit(item)}
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }}
                        >
                          <Upload size={14} /> Submit Solution
                        </button>
                      ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--success)', fontSize: '0.82rem', fontWeight: 600 }}>
                          <CheckCircle2 size={15} /> Submitted
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── View Assignment Details Modal via ModalPortal ── */}
      <ModalPortal isOpen={Boolean(viewAssignment)}>
        {viewAssignment && (
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
            onClick={() => setViewAssignment(null)}
          >
            <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90vw',
                maxWidth: '620px',
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
                  <span className="badge badge-primary">{viewAssignment.courseCode || 'Course'}</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Assignment Overview
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewAssignment(null)}
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
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Title
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {viewAssignment.title}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', background: 'var(--bg-input, rgba(255,255,255,0.04))', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</div>
                    <div style={{ fontWeight: 600, color: viewAssignment.isSubmitted ? 'var(--success)' : 'var(--warning)', marginTop: '0.2rem' }}>
                      {viewAssignment.status || (viewAssignment.isSubmitted ? 'Submitted' : 'Pending')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max Score</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      {viewAssignment.maxScore} Points
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due Date</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      {new Date(viewAssignment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    Description &amp; Rubric Instructions
                  </div>
                  <div style={{ background: 'var(--bg-input, rgba(255,255,255,0.04))', padding: '1.2rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.92rem', whiteSpace: 'pre-wrap' }}>
                    {viewAssignment.description || 'No detailed instructions provided.'}
                  </div>
                </div>
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
                  className="btn btn-secondary"
                  onClick={() => setViewAssignment(null)}
                >
                  Close
                </button>
                {role === 'student' && (viewAssignment.status === 'pending' || viewAssignment.status === 'overdue') && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      const cur = viewAssignment;
                      setViewAssignment(null);
                      handleOpenSubmit(cur);
                    }}
                  >
                    <Upload size={14} /> Submit Solution
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* ── Submission Modal via ModalPortal ── */}
      <ModalPortal isOpen={Boolean(selectedAssignment)}>
        {selectedAssignment && (
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
            onClick={() => setSelectedAssignment(null)}
          >
            <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90vw',
                maxWidth: '540px',
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
                  Submit Assignment
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
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
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  Submitting solution for: <strong style={{ color: 'var(--text-primary)' }}>{selectedAssignment.title}</strong>
                </p>

                {submittedSuccess ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--success)' }}>
                    <CheckCircle2 size={52} style={{ margin: '0 auto 1rem auto' }} />
                    <h4 style={{ fontWeight: 700, fontSize: '1.2rem' }}>Submission Received!</h4>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      Solution record updated in university database.
                    </p>
                  </div>
                ) : (
                  <form id="assignment-submit-form" onSubmit={handleConfirmSubmit}>
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label className="form-label">Upload Solution File (PDF, DOCX, ZIP, IPYNB)</label>
                      <input
                        type="file"
                        className="form-input"
                        accept=".pdf,.docx,.doc,.zip,.ipynb"
                        onChange={(e) => setUploadFile(e.target.files[0])}
                      />
                      {uploadFile && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--primary)', marginTop: '0.4rem', fontWeight: 600 }}>
                          Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                      <label className="form-label">Submission Notes / Code Repository URL (Optional)</label>
                      <textarea
                        className="form-input"
                        rows={3}
                        placeholder="Enter notes, explanation, or GitHub repository link..."
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                      />
                    </div>
                  </form>
                )}
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
                  className="btn btn-secondary"
                  onClick={() => setSelectedAssignment(null)}
                >
                  {submittedSuccess ? 'Close' : 'Cancel'}
                </button>
                {!submittedSuccess && (
                  <button
                    type="submit"
                    form="assignment-submit-form"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Confirm Submission'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* ── Faculty Create Assignment Modal via ModalPortal ── */}
      <ModalPortal isOpen={showCreateModal}>
        {showCreateModal && (
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
            onClick={() => setShowCreateModal(false)}
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
                  Post Course Assignment
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                <form id="create-assignment-form" onSubmit={handleCreateAssignment}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Course</label>
                    <select
                      className="form-input"
                      value={newAssignment.courseId}
                      onChange={(e) => setNewAssignment({ ...newAssignment, courseId: e.target.value })}
                      required
                    >
                      {facultyCourses.map((c) => (
                        <option key={c._id} value={c._id}>{c.courseCode} — {c.courseName}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Assignment Title</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Lab Exercise 3: Azure Cosmos DB"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Description &amp; Rubric</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="Describe requirements, instructions, and grading criteria..."
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="form-label">Max Score</label>
                      <input
                        type="number"
                        className="form-input"
                        value={newAssignment.maxScore}
                        onChange={(e) => setNewAssignment({ ...newAssignment, maxScore: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Due Date &amp; Time</label>
                      <input
                        type="datetime-local"
                        className="form-input"
                        value={newAssignment.dueDate}
                        onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                        required
                      />
                    </div>
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
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="create-assignment-form"
                  className="btn btn-primary"
                  disabled={createLoading}
                >
                  {createLoading ? 'Publishing...' : 'Publish to Students'}
                </button>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>

    </div>
  );
};

export default AssignmentPage;
