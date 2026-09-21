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
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  updateProfile: (data) => api.put('/students/me', data)
};

// ── Attendance APIs ───────────────────────────────────────────────────────
export const attendanceAPI = {
  getMySummary: () => api.get('/attendance/my-summary'),
  getCourseAttendance: (courseId, studentId) =>
    api.get(`/attendance/course/${courseId}`, { params: { studentId } }),
  markBatch: (batchData) => api.post('/attendance/mark-batch', batchData)
};

// ── Marks APIs ────────────────────────────────────────────────────────────
export const marksAPI = {
  getMyMarks: () => api.get('/marks/my'),
  getMarksSummary: () => api.get('/marks/summary'),
  getCourseMarks: (courseId, params) => api.get(`/marks/course/${courseId}`, { params }),
  uploadMarks: (marksData) => api.post('/marks/upload', marksData),
  publishMarks: (publishData) => api.post('/marks/publish', publishData)
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
  grade: (id, data) => api.put(`/assignments/${id}/grade`, data)
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
  getSchedules: (params) => api.get('/academic/exam-schedules', { params }),
  createSchedule: (data) => api.post('/academic/exam-schedules', data)
};

// ── RAG Knowledge Documents APIs ──────────────────────────────────────────
export const ragAPI = {
  list: () => api.get('/rag/documents'),
  getById: (id) => api.get(`/rag/documents/${id}`),
  delete: (id) => api.delete(`/rag/documents/${id}`),
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
  getDepartmentStats: () => api.get('/teacher/manage/departments')
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
  getStudyPlan: () => api.get('/academic/study-plan'),
  getRecommendations: () => api.get('/academic/recommendations')
};

export default api;
