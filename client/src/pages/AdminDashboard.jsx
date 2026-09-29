import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api.js';
import {
  Users, Shield, Activity, FileText, Trash2, ToggleLeft, ToggleRight,
  AlertTriangle, CheckCircle, Clock, Search, Filter, RefreshCw, Eye,
  TrendingUp, Database, Cpu, Server, Lock, UserCheck, UserX, ChevronDown,
  BarChart3, Loader2, X, Settings
} from 'lucide-react';

/* ─────────────── Helpers ─────────────── */
const ROLE_COLORS = {
  super_admin: '#ef4444',
  admin: '#f97316',
  faculty: '#8b5cf6',
  teacher: '#8b5cf6',
  student: '#3b82f6'
};

const ACTION_COLORS = {
  LOGIN: '#10b981',
  LOGOUT: '#6b7280',
  UPDATE_MARKS: '#3b82f6',
  DELETE_MARKS: '#ef4444',
  PUBLISH_NOTICE: '#f59e0b',
  DELETE_USER: '#ef4444',
  CHANGE_ROLE: '#8b5cf6',
  REGISTER: '#10b981'
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ─────────────── Stat Card ─────────────── */
const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
    <div style={{
      width: 52, height: 52, borderRadius: 14,
      background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      <Icon size={24} color={color} />
    </div>
    <div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

/* ─────────────── Role Badge ─────────────── */
const RoleBadge = ({ role }) => (
  <span style={{
    background: `${ROLE_COLORS[role] || '#6b7280'}22`,
    color: ROLE_COLORS[role] || '#6b7280',
    border: `1px solid ${ROLE_COLORS[role] || '#6b7280'}44`,
    borderRadius: 6, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase'
  }}>{role?.replace('_', ' ')}</span>
);

/* ─────────────── Section Header ─────────────── */
const SectionHeader = ({ icon: Icon, title, count, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Icon size={18} color="var(--primary)" />
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{title}</h2>
      {count !== undefined && (
        <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{count}</span>
      )}
    </div>
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>{children}</div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   ADMIN DASHBOARD
═══════════════════════════════════════════════════════════ */
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [aiUsage, setAiUsage] = useState(null);
  const [loading, setLoading] = useState({ stats: true, users: false, logs: false, ai: false });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [logAction, setLogAction] = useState('all');
  const [logPage, setLogPage] = useState(1);
  const [logTotal, setLogTotal] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionMsg, setActionMsg] = useState('');

  /* ── Fetch system stats ── */
  const fetchStats = useCallback(async () => {
    setLoading((p) => ({ ...p, stats: true }));
    try {
      const res = await adminAPI.getSystemStats();
      setStats(res.data?.stats || res.data);
    } catch (e) {
      console.error('Stats error:', e);
    } finally {
      setLoading((p) => ({ ...p, stats: false }));
    }
  }, []);

  /* ── Fetch users ── */
  const fetchUsers = useCallback(async () => {
    setLoading((p) => ({ ...p, users: true }));
    try {
      const res = await adminAPI.getAllUsers({ role: roleFilter !== 'all' ? roleFilter : undefined, search: search || undefined });
      setUsers(res.data?.users || res.data?.data || []);
    } catch (e) {
      console.error('Users error:', e);
    } finally {
      setLoading((p) => ({ ...p, users: false }));
    }
  }, [roleFilter, search]);

  /* ── Fetch audit logs ── */
  const fetchLogs = useCallback(async () => {
    setLoading((p) => ({ ...p, logs: true }));
    try {
      const res = await adminAPI.getAuditLogs({
        action: logAction !== 'all' ? logAction : undefined,
        page: logPage,
        limit: 20
      });
      setAuditLogs(res.data?.logs || res.data?.data || []);
      setLogTotal(res.data?.total || 0);
    } catch (e) {
      console.error('Logs error:', e);
    } finally {
      setLoading((p) => ({ ...p, logs: false }));
    }
  }, [logAction, logPage]);

  /* ── Fetch AI usage ── */
  const fetchAI = useCallback(async () => {
    setLoading((p) => ({ ...p, ai: true }));
    try {
      const res = await adminAPI.getAIUsage();
      setAiUsage(res.data?.stats || res.data);
    } catch (e) {
      console.error('AI usage error:', e);
    } finally {
      setLoading((p) => ({ ...p, ai: false }));
    }
  }, []);

  /* ── Initial load ── */
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { if (activeTab === 'users') fetchUsers(); }, [activeTab, fetchUsers]);
  useEffect(() => { if (activeTab === 'logs') fetchLogs(); }, [activeTab, fetchLogs]);
  useEffect(() => { if (activeTab === 'ai') fetchAI(); }, [activeTab, fetchAI]);

  /* ── Actions ── */
  const showMsg = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = !user.isActive;
      await adminAPI.toggleUserStatus(user._id, { isActive: newStatus });
      setUsers((prev) => prev.map((u) => u._id === user._id ? { ...u, isActive: newStatus } : u));
      showMsg(`User ${newStatus ? 'activated' : 'deactivated'} successfully.`);
    } catch {
      showMsg('Action failed. Please try again.');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, { role: newRole });
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role: newRole } : u));
      showMsg('Role updated successfully.');
    } catch {
      showMsg('Role change failed.');
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmDelete) return;
    try {
      await adminAPI.deleteUser(confirmDelete._id);
      setUsers((prev) => prev.filter((u) => u._id !== confirmDelete._id));
      showMsg('User deleted permanently.');
    } catch {
      showMsg('Delete failed.');
    } finally {
      setConfirmDelete(null);
    }
  };

  /* ── Tabs ── */
  const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'logs', label: 'Audit Logs', icon: FileText },
    { id: 'ai', label: 'AI Analytics', icon: Cpu }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* ── Header ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
          <Shield size={16} /> System Administration
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Admin Control Panel</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Full system telemetry, user governance, audit logging and AI usage analytics.
        </p>
      </div>

      {/* ── Action Message Toast ── */}
      {actionMsg && (
        <div style={{
          background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 600, fontSize: '0.875rem'
        }}>
          <CheckCircle size={16} /> {actionMsg}
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1px' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`admin-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.6rem 1rem', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
              background: activeTab === tab.id ? 'var(--surface-2)' : 'transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent'
            }}
          >
            <tab.icon size={15} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════ OVERVIEW TAB ══════════════ */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {loading.stats ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader2 size={32} className="animate-spin" color="var(--primary)" />
            </div>
          ) : (
            <>
              {/* Stat Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <StatCard icon={Users} label="Total Users" value={stats?.totalUsers} color="#3b82f6" sub={`${stats?.activeUsers || 0} active`} />
                <StatCard icon={UserCheck} label="Students" value={stats?.students} color="#10b981" />
                <StatCard icon={Shield} label="Faculty / Staff" value={stats?.faculty} color="#8b5cf6" />
                <StatCard icon={FileText} label="Audit Events (30d)" value={stats?.auditEvents || stats?.recentAuditCount} color="#f97316" />
                <StatCard icon={Cpu} label="AI Requests (30d)" value={stats?.aiRequests || stats?.totalAiRequests} color="#ec4899" />
                <StatCard icon={Database} label="DB Collections" value={stats?.collections || '11'} color="#06b6d4" sub="MongoDB" />
              </div>

              {/* System Health */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <SectionHeader icon={Server} title="System Health">
                  <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }} onClick={fetchStats}>
                    <RefreshCw size={13} /> Refresh
                  </button>
                </SectionHeader>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  {[
                    { label: 'API Server', status: 'Online', color: '#10b981' },
                    { label: 'MongoDB', status: 'Connected', color: '#10b981' },
                    { label: 'Azure AI', status: stats?.azureAiStatus || 'Active', color: '#3b82f6' },
                    { label: 'SMTP Mailer', status: stats?.smtpStatus || 'Configured', color: '#f59e0b' }
                  ].map((s) => (
                    <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--surface-3)', borderRadius: 8 }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.label}</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: s.color }}>{s.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity Summary */}
              {stats?.recentActivity && stats.recentActivity.length > 0 && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <SectionHeader icon={Activity} title="Recent Activity" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {stats.recentActivity.slice(0, 8).map((log, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                        <span style={{
                          background: `${ACTION_COLORS[log.action] || '#6b7280'}22`,
                          color: ACTION_COLORS[log.action] || '#6b7280',
                          fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, flexShrink: 0
                        }}>{log.action}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}>
                          {log.performedBy?.firstName} {log.performedBy?.lastName}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{timeAgo(log.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════ USERS TAB ══════════════ */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="admin-user-search"
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                className="form-input"
                style={{ paddingLeft: 36, width: '100%' }}
              />
            </div>
            <select id="admin-role-filter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="form-input" style={{ minWidth: 140 }}>
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <button id="admin-fetch-users" className="btn btn-primary" onClick={fetchUsers} style={{ padding: '0.5rem 1rem' }}>
              <Search size={14} /> Search
            </button>
          </div>

          {/* User Table */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <SectionHeader icon={Users} title="Registered Users" count={users.length}>
              <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }} onClick={fetchUsers}>
                <RefreshCw size={13} /> Refresh
              </button>
            </SectionHeader>

            {loading.users ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <Loader2 size={28} className="animate-spin" color="var(--primary)" />
              </div>
            ) : users.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No users found. Use the search above to load users.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                        <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                          {user.firstName} {user.lastName}
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{user.email}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <select
                            value={user.role}
                            onChange={(e) => handleChangeRole(user._id, e.target.value)}
                            style={{ background: `${ROLE_COLORS[user.role] || '#6b7280'}22`, color: ROLE_COLORS[user.role] || '#6b7280', border: `1px solid ${ROLE_COLORS[user.role] || '#6b7280'}44`, borderRadius: 6, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ color: user.isActive ? '#10b981' : '#ef4444', fontWeight: 600, fontSize: '0.78rem' }}>
                            {user.isActive ? '● Active' : '● Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{fmtDate(user.createdAt)}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              id={`toggle-user-${user._id}`}
                              onClick={() => handleToggleStatus(user)}
                              title={user.isActive ? 'Deactivate' : 'Activate'}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: user.isActive ? '#10b981' : '#6b7280', padding: 4 }}
                            >
                              {user.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            </button>
                            <button
                              id={`delete-user-${user._id}`}
                              onClick={() => setConfirmDelete(user)}
                              title="Delete User"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ AUDIT LOGS TAB ══════════════ */}
      {activeTab === 'logs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select id="admin-log-action-filter" value={logAction} onChange={(e) => { setLogAction(e.target.value); setLogPage(1); }} className="form-input" style={{ minWidth: 180 }}>
              <option value="all">All Actions</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="REGISTER">REGISTER</option>
              <option value="UPDATE_MARKS">UPDATE_MARKS</option>
              <option value="DELETE_MARKS">DELETE_MARKS</option>
              <option value="PUBLISH_NOTICE">PUBLISH_NOTICE</option>
              <option value="DELETE_USER">DELETE_USER</option>
              <option value="CHANGE_ROLE">CHANGE_ROLE</option>
            </select>
            <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.5rem 0.8rem' }} onClick={fetchLogs}>
              <RefreshCw size={13} /> Reload
            </button>
            {logTotal > 0 && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{logTotal} total events</span>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <SectionHeader icon={FileText} title="Audit Event Log" count={auditLogs.length} />

            {loading.logs ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <Loader2 size={28} className="animate-spin" color="var(--primary)" />
              </div>
            ) : auditLogs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No audit logs found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {auditLogs.map((log, i) => (
                  <div key={log._id || i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '0.75rem 0', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                    <div style={{ flexShrink: 0, paddingTop: 2 }}>
                      <span style={{
                        background: `${ACTION_COLORS[log.action] || '#6b7280'}22`,
                        color: ACTION_COLORS[log.action] || '#6b7280',
                        fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4, display: 'inline-block'
                      }}>{log.action || 'SYSTEM'}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {log.performedBy?.firstName || 'System'} {log.performedBy?.lastName || ''}
                        {log.performedByRole && <RoleBadge role={log.performedByRole} />}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        {log.resourceType && <><strong>{log.resourceType}</strong> · </>}
                        {log.metadata && typeof log.metadata === 'object' && Object.entries(log.metadata).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      <Clock size={11} style={{ display: 'inline', marginRight: 4 }} />
                      {timeAgo(log.createdAt)}
                    </div>
                    {log.ipAddress && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>IP: {log.ipAddress}</div>
                    )}
                  </div>
                ))}
                {/* Pagination */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                    disabled={logPage === 1} onClick={() => setLogPage((p) => Math.max(1, p - 1))}>← Prev</button>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>Page {logPage}</span>
                  <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                    disabled={auditLogs.length < 20} onClick={() => setLogPage((p) => p + 1)}>Next →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ AI ANALYTICS TAB ══════════════ */}
      {activeTab === 'ai' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loading.ai ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader2 size={28} className="animate-spin" color="var(--primary)" />
            </div>
          ) : !aiUsage ? (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No AI usage data available yet. Interactions will appear here as students use the AI features.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* AI Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <StatCard icon={Cpu} label="Total AI Calls" value={aiUsage.totalRequests} color="#ec4899" />
                <StatCard icon={CheckCircle} label="Successful" value={aiUsage.successful} color="#10b981" />
                <StatCard icon={AlertTriangle} label="Failed / Fallback" value={aiUsage.failed} color="#ef4444" />
                <StatCard icon={TrendingUp} label="Avg Response Time" value={aiUsage.avgResponseTime ? `${aiUsage.avgResponseTime}ms` : '—'} color="#f59e0b" />
              </div>

              {/* By Feature Breakdown */}
              {aiUsage.byFeature && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <SectionHeader icon={BarChart3} title="Usage by Feature" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {Object.entries(aiUsage.byFeature).map(([feature, count]) => {
                      const pct = aiUsage.totalRequests ? Math.round((count / aiUsage.totalRequests) * 100) : 0;
                      return (
                        <div key={feature}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                            <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{feature.replace(/_/g, ' ')}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{count} ({pct}%)</span>
                          </div>
                          <div style={{ background: 'var(--surface-3)', borderRadius: 4, height: 8 }}>
                            <div style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent-purple))', borderRadius: 4, height: '100%', transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent AI Requests */}
              {aiUsage.recentRequests && aiUsage.recentRequests.length > 0 && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <SectionHeader icon={Clock} title="Recent AI Requests" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {aiUsage.recentRequests.slice(0, 10).map((req, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
                        <span style={{ color: req.success ? '#10b981' : '#ef4444', flexShrink: 0 }}>
                          {req.success ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                        </span>
                        <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{req.feature || req.tool || '—'}</span>
                        {req.responseTime && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{req.responseTime}ms</span>}
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{timeAgo(req.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ Delete Confirm Modal ══════════════ */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <AlertTriangle size={40} color="#ef4444" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Delete User?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              This will <strong>permanently delete</strong> {confirmDelete.firstName} {confirmDelete.lastName} ({confirmDelete.email}). This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button id="confirm-delete-cancel" className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button id="confirm-delete-execute" className="btn" style={{ background: '#ef4444', color: '#fff', border: 'none' }} onClick={handleDeleteUser}>
                <Trash2 size={14} /> Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
