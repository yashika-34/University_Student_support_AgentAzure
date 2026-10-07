import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api/v1';
const API_BASE_URL = (() => {
  if (!rawBase) return '/api/v1';
  const trimmed = rawBase.replace(/\/+$/, '');
  if (trimmed.startsWith('http')) {
    return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
  }
  return trimmed;
})();

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('uniassist_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if invalid or expired
      localStorage.removeItem('uniassist_token');
      localStorage.removeItem('uniassist_user');
    }
    return Promise.reject(error);
  }
);

// All data is now served from MongoDB via REST APIs — no static mock data.

// ── Auth APIs ─────────────────────────────────────────────────────────────
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  updateProfile: (data) => api.put('/auth/profile', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  updatePassword: (data) => api.put('/auth/update-password', data)
};

// ── Student APIs ──────────────────────────────────────────────────────────
export const studentAPI = {
  getMyProfile: () => api.get('/students/me'),
  getAcademicSummary: () => api.get('/students/me/academic-summary'),
  getStudentAnalytics: () => api.get('/students/me/analytics'),
  getAIAssistant: () => api.get('/students/me/ai-assistant'),
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  updateProfile: (data) => api.put('/students/me', data)
};

// ── Attendance APIs ───────────────────────────────────────────────────────
export const attendanceAPI = {
  getMySummary: () => api.get('/attendance/my-summary'),
  getCatchUpData: () => api.get('/attendance/catch-up'),
  getCourseAttendance: (courseId, studentId) =>
    api.get(`/attendance/course/${courseId}`, { params: { studentId } }),
  markBatch: (batchData) => api.post('/attendance/mark-batch', batchData)
};

// ── Marks APIs ────────────────────────────────────────────────────────────
export const marksAPI = {
  getMyMarks: () => api.get('/marks/my'),
  getMarksSummary: () => api.get('/marks/summary'),
  getCourseMarks: (courseId = 'all', params) => api.get(`/marks/course/${courseId}`, { params }),
  uploadMarks: (marksData) => api.post('/marks/upload', marksData),
  addMarks: (marksData) => api.post('/marks', marksData),
  updateMarks: (id, data) => api.put(`/marks/${id}`, data),
  deleteMarks: (id) => api.delete(`/marks/${id}`),
  publishMarks: (id) => api.patch(`/marks/${id}/publish`),
  bulkPreview: (data) => api.post('/marks/bulk/preview', data),
  bulkImport: (data) => api.post('/marks/bulk/import', data)
};

// ── Course APIs ───────────────────────────────────────────────────────────
export const courseAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  getMyCourses: () => api.get('/courses/my-courses'),
  create: (data) => api.post('/courses', data),
  enroll: (courseId) => api.post(`/courses/${courseId}/enroll`),
  enrollStudent: (courseId, data) => api.post(`/courses/${courseId}/enroll`, data)
};

// ── Assignment APIs ───────────────────────────────────────────────────────
export const assignmentAPI = {
  getMyAssignments: () => api.get('/assignments/my'),
  getMyPending: () => api.get('/assignments/my-pending'),
  getByCourse: (courseId) => api.get(`/assignments/course/${courseId}`),
  create: (data) => api.post('/assignments', data),
  submit: (id, formData) => {
    if (formData instanceof FormData) {
      return api.post(`/assignments/${id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.post(`/assignments/${id}/submit`, formData);
  },
  grade: (id, data) => api.put(`/assignments/${id}/grade`, data),
  getSubmissions: (id) => api.get(`/assignments/${id}/submissions`)
};

// ── Notices & Notifications APIs ──────────────────────────────────────────
export const noticeAPI = {
  getNotices: (params) => api.get('/notifications/notices', { params }),
  createNotice: (data) => api.post('/notifications/notices', data),
  getMyNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read')
};

// ── Exam Schedule APIs ────────────────────────────────────────────────────
export const examAPI = {
  getMySchedule: () => api.get('/exams/my'),
  getSchedules: (params) => api.get('/exams', { params }),
  getById: (id) => api.get(`/exams/${id}`),
  createSchedule: (data) => api.post('/exams', data),
  updateSchedule: (id, data) => api.put(`/exams/${id}`, data),
  deleteSchedule: (id) => api.delete(`/exams/${id}`)
};

// ── RAG Knowledge Documents APIs ──────────────────────────────────────────
export const ragAPI = {
  list: () => api.get('/rag/documents'),
  getById: (id) => api.get(`/rag/documents/${id}`),
  delete: (id) => api.delete(`/rag/documents/${id}`),
  download: (id) => api.get(`/rag/documents/${id}/download`, { responseType: 'blob' }),
  upload: (formData) =>
    api.post('/rag/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
};

// ── AI Chatbot APIs ───────────────────────────────────────────────────────
export const chatAPI = {
  sendMessage: (data) => api.post('/chat/message', data),
  getSessions: () => api.get('/chat/sessions'),
  getSessionMessages: (sessionId) => api.get(`/chat/sessions/${sessionId}/messages`),
  escalate: (sessionId, data) => api.post(`/chat/sessions/${sessionId}/escalate`, data)
};

// ── Teacher / Faculty APIs ────────────────────────────────────────────────
export const teacherAPI = {
  getDashboard: () => api.get('/teacher/dashboard'),
  getCourseAnalytics: (courseId) => api.get(`/teacher/analytics/${courseId}`),
  getStudents: (params) => api.get('/teacher/students', { params }),
  getStudentDetail: (studentId) => api.get(`/teacher/students/${studentId}`),
  generateQuestionPaper: (data) => api.post('/teacher/question-paper', data),
  assignCourse: (data) => api.post('/teacher/courses/assign', data),
  createAndAssignCourse: (data) => api.post('/teacher/courses/create', data),
  unassignCourse: (courseId) => api.delete(`/teacher/courses/assign/${courseId}`),
  assignStudentToCourse: (data) => api.post('/teacher/courses/assign-student', data),
  // Student Management CRUD
  getManageStudents: (params) => api.get('/teacher/manage/students', { params }),
  addStudent: (data) => api.post('/teacher/manage/students', data),
  editStudent: (id, data) => api.put(`/teacher/manage/students/${id}`, data),
  deleteStudent: (id, hardDelete = false) => api.delete(`/teacher/manage/students/${id}`, { params: { hardDelete } }),
  approveStudent: (id, action) => api.put(`/teacher/manage/students/${id}/approve`, { action }),
  getDepartmentStats: () => api.get('/teacher/manage/departments'),
  addAttendance: (data) => api.post('/teacher/attendance', data),
  addMarks: (data) => api.post('/teacher/marks', data),
  createNotice: (data) => api.post('/teacher/notices', data),
  getClassReport: (courseId) => api.get(`/teacher/report/${courseId}`),
  generateVariant: (id, data) => api.post(`/teacher/question-paper/${id}/variant`, data),
  getTeacherPapers: () => api.get('/teacher/question-paper/my-papers')
};

// ── FAQs APIs ─────────────────────────────────────────────────────────────
export const faqAPI = {
  getAll: (params) => api.get('/faqs', { params }),
  getById: (id) => api.get(`/faqs/${id}`),
  voteHelpful: (id) => api.post(`/faqs/${id}/vote`, { isHelpful: true })
};

// ── Campus Services APIs ──────────────────────────────────────────────────
export const servicesAPI = {
  getTickets: () => api.get('/services/tickets'),
  createTicket: (data) => api.post('/services/tickets', data),
  getAppointments: () => api.get('/services/appointments'),
  bookAppointment: (data) => api.post('/services/appointments', data),
  getScholarships: () => api.get('/services/scholarships')
};

// ── Career Hub APIs ───────────────────────────────────────────────────────
export const careerAPI = {
  getPlacements: (params) => api.get('/career/placements', { params }),
  checkEligibility: (data) => api.post('/career/check-placement', data),
  analyzeResume: (data) => api.post('/career/analyze-resume', data),
  simulateInterview: (data) => api.post('/career/simulate-interview', data),
  getProfile: () => api.get('/career/profile'),
  updateProfile: (data) => api.put('/career/profile', data)
};

// ── Community Hub APIs ────────────────────────────────────────────────────
export const communityAPI = {
  getPosts: (params) => api.get('/engagement/forum', { params }),
  createPost: (data) => api.post('/engagement/forum', data),
  upvotePost: (id) => api.post(`/engagement/forum/${id}/upvote`),
  addReply: (id, data) => api.post(`/engagement/forum/${id}/replies`, data),
  getBadges: () => api.get('/engagement/badges'),
  getEvents: () => api.get('/services/events'),
  registerEvent: (id) => api.post(`/services/events/${id}/rsvp`)
};

// ── Academic Tools APIs ───────────────────────────────────────────────────
export const academicAPI = {
  predictAttendance: (data) => api.post('/academic/predict-attendance', data),
  predictSGPA: (data) => api.post('/academic/predict-sgpa', data),
  generateQuiz: (data) => api.post('/academic/generate-quiz', data),
  submitQuiz: (data) => api.post('/academic/submit-quiz', data),
  getQuizHistory: () => api.get('/academic/quiz-history'),
  getQuizById: (id) => api.get(`/academic/quizzes/${id}`),
  getStudyPlan: () => api.get('/academic/study-plan'),
  getRecommendations: () => api.get('/academic/recommendations')
};

// ── Flashcard APIs (Azure AI Powered Platform) ───────────────────────────
export const flashcardAPI = {
  generate: (data) => api.post('/flashcards/generate', data),
  saveDeck: (data) => api.post('/flashcards/decks', data),
  updateDeck: (id, data) => api.put(`/flashcards/decks/${id}`, data),
  getMyDecks: (params) => api.get('/flashcards/decks', { params }),
  getDeckById: (id) => api.get(`/flashcards/decks/${id}`),
  deleteDeck: (id) => api.delete(`/flashcards/decks/${id}`),
  addCard: (deckId, data) => api.post(`/flashcards/decks/${deckId}/cards`, data),
  updateCard: (deckId, cardId, data) => api.put(`/flashcards/decks/${deckId}/cards/${cardId}`, data),
  deleteCard: (deckId, cardId) => api.delete(`/flashcards/decks/${deckId}/cards/${cardId}`),
  getDeckAnalytics: (deckId) => api.get(`/flashcards/decks/${deckId}/analytics`),
  getCommunityDecks: (params) => api.get('/flashcards/community', { params }),
  forkDeck: (deckId) => api.post(`/flashcards/decks/${deckId}/fork`),
  likeDeck: (deckId) => api.post(`/flashcards/decks/${deckId}/like`),
  updateCardStatus: (data) => api.put('/flashcards/card-status', data),
  getStats: () => api.get('/flashcards/stats'),
  getReminders: () => api.get('/flashcards/reminders'),
  updateReminders: (data) => api.put('/flashcards/reminders', data),
  getRecommended: () => api.get('/flashcards/recommended'),
  getDueToday: () => api.get('/flashcards/due-today'),
  exportAnkiUrl: (deckId) => `/api/v1/flashcards/decks/${deckId}/export-anki`
};

// ── Digital Twin APIs ─────────────────────────────────────────────────────
export const digitalTwinAPI = {
  // Faculty management
  getMyTwin: () => api.get('/digital-twin/my-twin'),
  updateMyTwin: (data) => api.put('/digital-twin/my-twin', data),
  addKnowledgeText: (data) => api.post('/digital-twin/my-twin/knowledge', data),
  addKnowledgeFile: (formData) => api.post('/digital-twin/my-twin/knowledge', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteKnowledge: (entryId) => api.delete(`/digital-twin/my-twin/knowledge/${entryId}`),
  updateFaqs: (faqs) => api.put('/digital-twin/my-twin/faqs', { faqs }),
  toggleStatus: () => api.patch('/digital-twin/my-twin/toggle'),
  getAnalytics: () => api.get('/digital-twin/my-twin/analytics'),
  resolveDoubt: (doubtId, data) => api.post(`/digital-twin/my-twin/resolve-doubt/${doubtId}`, data),
  // Discovery & Chat (students & all roles)
  discoverTwins: () => api.get('/digital-twin/discover'),
  chatWithTwin: (twinId, data) => api.post(`/digital-twin/chat/${twinId}`, data),
  getConversationHistory: (twinId) => api.get(`/digital-twin/conversation/${twinId}`),
  clearConversationHistory: (twinId) => api.delete(`/digital-twin/conversation/${twinId}`),
  escalateDoubt: (twinId, data) => api.post(`/digital-twin/escalate/${twinId}`, data)
};

// ── AI Auto-Grader APIs ───────────────────────────────────────────────────
export const autoGraderAPI = {
  gradeSheet: (formData) => {
    if (formData instanceof FormData) {
      return api.post('/auto-grader/grade', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.post('/auto-grader/grade', formData);
  },
  getEvaluations: (params) => api.get('/auto-grader', { params }),
  getById: (id) => api.get(`/auto-grader/${id}`),
  syncToMarks: (id) => api.post(`/auto-grader/${id}/sync-marks`),
  deleteEvaluation: (id) => api.delete(`/auto-grader/${id}`),
  getQuestionPapers: () => api.get('/teacher/question-paper/my-papers')
};

// ── Admin APIs ────────────────────────────────────────────────────────────
export const adminAPI = {
  getSystemStats: () => api.get('/admin/stats'),
  getAIUsage: () => api.get('/admin/ai-usage'),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUserRole: (id, data) => api.put(`/admin/users/${id}/role`, data),
  toggleUserStatus: (id, data) => api.put(`/admin/users/${id}/status`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getStudents: (params) => api.get('/admin/students', { params }),
  getFaculty: (params) => api.get('/admin/teachers', { params })
};

// ── Search APIs ───────────────────────────────────────────────────────────
export const searchAPI = {
  globalSearch: (query, params) => api.get('/search', { params: { q: query, ...params } })
};

// ── Risk & Early Warning APIs ─────────────────────────────────────────────
export const riskAPI = {
  getDashboardStats: () => api.get('/risk/dashboard-stats'),
  analyzeStudent: (studentId) => api.post(`/risk/analyze/${studentId}`),
  batchAnalyze: (data) => api.post('/risk/batch-analyze', data),
  getAlerts: (params) => api.get('/risk/alerts', { params }),
  getAlertById: (alertId) => api.get(`/risk/alerts/${alertId}`),
  acknowledgeAlert: (alertId) => api.patch(`/risk/alerts/${alertId}/acknowledge`),
  deleteAlert: (alertId) => api.delete(`/risk/alerts/${alertId}`),
  getStudentHistory: (studentId) => api.get(`/risk/student/${studentId}`)
};

export default api;
