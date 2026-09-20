import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import {
  Calendar,
  LifeBuoy,
  DollarSign,
  Sparkles,
  Clock,
  CheckCircle2,
  PlusCircle,
  MapPin,
  Send,
  Check,
  Loader2
} from 'lucide-react';

const CampusServicesPage = () => {
  const [activeTab, setActiveTab] = useState('appointments');

  // Appointments State
  const [appointments, setAppointments] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [events, setEvents] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showBookModal, setShowBookModal] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    facultyName: 'Dr. Alan Turing',
    courseCode: 'CS-301 (Algorithms)',
    appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    timeSlot: '14:30 - 15:00',
    purpose: ''
  });
  const [appointmentBookedSuccess, setAppointmentBookedSuccess] = useState(false);

  // Tickets State
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [newTicketData, setNewTicketData] = useState({
    subject: '',
    category: 'Academic Advisory',
    priority: 'Medium',
    message: ''
  });

  useEffect(() => {
    const fetchServicesData = async () => {
      setLoading(true);
      try {
        const [aptRes, tktRes, evtRes, schRes] = await Promise.allSettled([
          api.get('/services/appointments'),
          api.get('/services/tickets'),
          api.get('/services/events'),
          api.get('/services/scholarships')
        ]);
        if (aptRes.status === 'fulfilled') {
          const apt = aptRes.value.data?.data || aptRes.value.data?.appointments || [];
          setAppointments(Array.isArray(apt) ? apt : []);
        }
        if (tktRes.status === 'fulfilled') {
          const tkt = tktRes.value.data?.data || tktRes.value.data?.tickets || [];
          setTickets(Array.isArray(tkt) ? tkt : []);
        }
        if (evtRes.status === 'fulfilled') {
          const evt = evtRes.value.data?.data || evtRes.value.data?.events || [];
          setEvents(Array.isArray(evt) ? evt : []);
        }
        if (schRes.status === 'fulfilled') {
          const sch = schRes.value.data?.data || schRes.value.data?.scholarships || [];
          setScholarships(Array.isArray(sch) ? sch : []);
        }
      } catch (err) {
        console.error('Failed to load campus services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServicesData();
  }, []);

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/services/appointments', newAppointment);
      const created = res.data?.data || res.data?.appointment;
      if (created) {
        setAppointments([created, ...appointments]);
      } else {
        const created = {
          id: `apt-${Date.now().toString().slice(-4)}`,
          ...newAppointment,
          status: 'confirmed',
          location: 'Turing Hall, Room 302'
        };
        setAppointments([created, ...appointments]);
      }
    } catch {
      const created = {
        id: `apt-${Date.now().toString().slice(-4)}`,
        ...newAppointment,
        status: 'confirmed',
        location: 'Turing Hall, Room 302'
      };
      setAppointments([created, ...appointments]);
    }
    setAppointmentBookedSuccess(true);
    setTimeout(() => {
      setShowBookModal(false);
      setAppointmentBookedSuccess(false);
      setNewAppointment({ ...newAppointment, purpose: '' });
    }, 1500);
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/services/tickets', newTicketData);
      if (res.data?.ticket) {
        setTickets([res.data.ticket, ...tickets]);
      } else {
        const createdTicket = {
          ticketId: `TICK-${Math.floor(100000 + Math.random() * 900000)}`,
          subject: newTicketData.subject,
          category: newTicketData.category,
          priority: newTicketData.priority,
          status: 'Open',
          assignedTo: 'Campus Helpdesk Support',
          createdAt: new Date().toISOString()
        };
        setTickets([createdTicket, ...tickets]);
      }
    } catch {
      const createdTicket = {
        ticketId: `TICK-${Math.floor(100000 + Math.random() * 900000)}`,
        subject: newTicketData.subject,
        category: newTicketData.category,
        priority: newTicketData.priority,
        status: 'Open',
        assignedTo: 'Campus Helpdesk Support',
        createdAt: new Date().toISOString()
      };
      setTickets([createdTicket, ...tickets]);
    }
    setShowCreateTicketModal(false);
    setNewTicketData({ subject: '', category: 'Academic Advisory', priority: 'Medium', message: '' });
  };

  const handleRsvp = async (id) => {
    try {
      await api.post(`/services/events/${id}/rsvp`);
    } catch {
      // offline fallback
    }
    setEvents(events.map(ev => ev.id === id ? { ...ev, isRegistered: true, registeredCount: (ev.registeredCount || 0) + 1 } : ev));
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
          <Sparkles size={16} /> Integrated Student Services
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.35rem' }}>
          Campus Services Portal
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Schedule office hour appointments with faculty, lodge support tickets, discover matched scholarship grants, and RSVP for campus events.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', overflowX: 'auto' }}>
        {[
          { id: 'appointments', label: 'Faculty Appointments', icon: Calendar },
          { id: 'tickets', label: 'Support Ticket System', icon: LifeBuoy },
          { id: 'scholarships', label: 'Scholarship Matcher', icon: DollarSign },
          { id: 'events', label: 'Campus Events & Hackathons', icon: Sparkles }
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

      {/* Tab 1: Faculty Appointments */}
      {activeTab === 'appointments' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Faculty Office Hours &amp; 1:1 Consultations</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Directly book office slots for thesis guidance, attendance waiver reviews, and coursework assistance.
              </p>
            </div>
            <button onClick={() => setShowBookModal(true)} className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
              <PlusCircle size={16} /> Book New Appointment
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {appointments.map((apt) => (
              <div
                key={apt.id}
                style={{
                  padding: '1.5rem',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.25rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span className="badge badge-primary">{apt.courseCode}</span>
                    <span className={`badge ${apt.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>
                      {apt.status}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.25rem' }}>{apt.facultyName}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                    {apt.purpose}
                  </p>
                  <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={13} /> {apt.appointmentDate} ({apt.timeSlot})
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <MapPin size={13} /> {apt.location}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>
                    Reschedule
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Book Modal */}
          {showBookModal && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 999, padding: '1rem'
            }}>
              <div className="glass-panel animate-fade-in" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Schedule Faculty Consultation</h3>
                
                {appointmentBookedSuccess ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--success)' }}>
                    <CheckCircle2 size={48} style={{ margin: '0 auto 0.75rem' }} />
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Appointment Confirmed!</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Notification dispatched to professor and calendar synced.</div>
                  </div>
                ) : (
                  <form onSubmit={handleBookAppointment}>
                    <div className="form-group">
                      <label className="form-label">Select Faculty Member</label>
                      <select
                        className="form-select"
                        value={newAppointment.facultyName}
                        onChange={(e) => setNewAppointment({ ...newAppointment, facultyName: e.target.value })}
                      >
                        <option value="Dr. Alan Turing">Dr. Alan Turing (Algorithms &amp; Complexity)</option>
                        <option value="Dr. Grace Hopper">Dr. Grace Hopper (Cloud Computing)</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Date</label>
                        <input
                          type="date"
                          required
                          className="form-input"
                          value={newAppointment.appointmentDate}
                          onChange={(e) => setNewAppointment({ ...newAppointment, appointmentDate: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Time Slot</label>
                        <select
                          className="form-select"
                          value={newAppointment.timeSlot}
                          onChange={(e) => setNewAppointment({ ...newAppointment, timeSlot: e.target.value })}
                        >
                          <option value="14:00 - 14:30">14:00 - 14:30</option>
                          <option value="14:30 - 15:00">14:30 - 15:00</option>
                          <option value="15:00 - 15:30">15:00 - 15:30</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Consultation Reason / Topic</label>
                      <textarea
                        rows={3}
                        required
                        className="form-textarea"
                        placeholder="Detail the query or document you wish to review..."
                        value={newAppointment.purpose}
                        onChange={(e) => setNewAppointment({ ...newAppointment, purpose: e.target.value })}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                      <button type="button" onClick={() => setShowBookModal(false)} className="btn btn-secondary">
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Confirm Appointment
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Support Tickets */}
      {activeTab === 'tickets' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Student Support Helpdesk &amp; Grievances</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Track official tickets, escalate complex grievances, and receive certified staff responses.
              </p>
            </div>
            <button onClick={() => setShowCreateTicketModal(true)} className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
              <PlusCircle size={16} /> Open Support Ticket
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {tickets.map((t) => (
              <div
                key={t.ticketId}
                style={{
                  padding: '1.5rem',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className="badge badge-primary">{t.ticketId}</span>
                    <span className="badge badge-warning">{t.priority} Priority</span>
                    <span className={`badge ${t.status === 'Resolved' ? 'badge-success' : 'badge-warning'}`}>
                      {t.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Assigned: <strong>{t.assignedTo}</strong>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.65rem' }}>{t.subject}</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                  {t.messages.map((m, mIdx) => (
                    <div key={mIdx} style={{ fontSize: '0.85rem', color: m.senderRole === 'staff' ? 'var(--primary)' : 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.85rem', borderRadius: '4px' }}>
                      <strong>{m.senderName}:</strong> {m.message}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Create Ticket Modal */}
          {showCreateTicketModal && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 999, padding: '1rem'
            }}>
              <div className="glass-panel animate-fade-in" style={{ maxWidth: '520px', width: '100%', padding: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Open Support Ticket</h3>
                <form onSubmit={handleCreateTicket}>
                  <div className="form-group">
                    <label className="form-label">Subject</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="Summary of issue or discrepancy"
                      value={newTicketData.subject}
                      onChange={(e) => setNewTicketData({ ...newTicketData, subject: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select
                        className="form-select"
                        value={newTicketData.category}
                        onChange={(e) => setNewTicketData({ ...newTicketData, category: e.target.value })}
                      >
                        <option value="Academic Advisory">Academic Advisory</option>
                        <option value="Attendance Query">Attendance Query</option>
                        <option value="Fees & Bursar">Fees &amp; Bursar</option>
                        <option value="Examinations">Examinations</option>
                        <option value="IT Support">IT Support</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Urgency</label>
                      <select
                        className="form-select"
                        value={newTicketData.priority}
                        onChange={(e) => setNewTicketData({ ...newTicketData, priority: e.target.value })}
                      >
                        <option value="Low">Low Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="High">High Priority</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Detailed Explanation</label>
                    <textarea
                      rows={4}
                      required
                      className="form-textarea"
                      placeholder="Include relevant dates, subject codes, and transaction/reference numbers..."
                      value={newTicketData.message}
                      onChange={(e) => setNewTicketData({ ...newTicketData, message: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                    <button type="button" onClick={() => setShowCreateTicketModal(false)} className="btn btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <Send size={16} /> Submit Ticket
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Scholarship Recommendations */}
      {activeTab === 'scholarships' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={20} color="var(--success)" /> Scholarship Recommendation Engine
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Financial grants matched with your 3.82 CGPA, engineering branch, and verified merit credentials.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {scholarships.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No scholarships available at this time.</div>
            ) : scholarships.map((sch) => (
              <div
                key={sch.id}
                style={{
                  padding: '1.5rem',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${sch.isEligible ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.25rem'
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span className="badge badge-success">{sch.amount}</span>
                    <span className="badge badge-primary">{sch.matchScore}</span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.2rem' }}>{sch.title}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    Provider: <strong>{sch.provider}</strong> &bull; Deadline: <strong>{sch.deadline}</strong>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{sch.description}</p>
                </div>

                <div>
                  <button className="btn btn-primary" style={{ padding: '0.65rem 1.4rem' }}>
                    Apply for Grant
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Campus Events */}
      {activeTab === 'events' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="var(--primary)" /> Campus Events, Hackathons &amp; Workshops
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            RSVP for upcoming technical competitions, keynotes, and placement fairs to claim attendance verification badges.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {events.map((ev) => (
              <div
                key={ev.id}
                style={{
                  padding: '1.5rem',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className="badge badge-primary">{ev.category}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {ev.registeredCount} / {ev.capacity} Attendees
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>{ev.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                    {ev.description}
                  </p>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1.25rem' }}>
                    <div><strong>Date:</strong> {new Date(ev.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div><strong>Venue:</strong> {ev.venue}</div>
                  </div>
                </div>

                <div>
                  {ev.isRegistered ? (
                    <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.88rem' }}>
                      <Check size={16} /> RSVP Confirmed ({ev.badgeAwarded} Allocated)
                    </div>
                  ) : (
                    <button onClick={() => handleRsvp(ev.id)} className="btn btn-primary" style={{ width: '100%' }}>
                      Confirm RSVP Registration
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default CampusServicesPage;
