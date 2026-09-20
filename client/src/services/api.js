import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

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
      // Clear token if expired
      // localStorage.removeItem('uniassist_token');
    }
    return Promise.reject(error);
  }
);

// Fallback Mock Datasets for instant frontend demonstration
export const mockData = {
  student: {
    id: 'STU-2024-8842',
    name: 'Alex Mercer',
    email: 'alex.student@university.edu',
    role: 'student',
    department: 'Computer Science & Engineering',
    degreeProgram: 'B.S. in Computer Science',
    currentSemester: 5,
    cgpa: 3.82,
    completedCredits: 74,
    advisor: 'Dr. Alan Turing',
    emergencyContact: {
      name: 'Martha Mercer',
      relationship: 'Mother',
      phone: '+1-555-9988'
    }
  },
  faculty: {
    id: 'FAC-CS-101',
    name: 'Dr. Alan Turing',
    email: 'dr.alan@university.edu',
    role: 'faculty',
    department: 'Computer Science',
    designation: 'Professor',
    cabinOffice: 'Turing Hall, Room 302',
    officeHours: 'Tue & Thu: 2:00 PM - 4:00 PM',
    activeCoursesCount: 2,
    studentsTaught: 114
  },
  attendance: [
    {
      courseCode: 'CS-301',
      courseName: 'Algorithms & Complexity',
      credits: 4,
      attendedClasses: 21,
      totalClasses: 24,
      percentage: 87.5,
      isLowAttendance: false,
      statusLabel: 'Good'
    },
    {
      courseCode: 'CS-305',
      courseName: 'Cloud Computing & Distributed Systems',
      credits: 3,
      attendedClasses: 13,
      totalClasses: 18,
      percentage: 72.2,
      isLowAttendance: true,
      statusLabel: 'Critical Warning'
    },
    {
      courseCode: 'CS-309',
      courseName: 'Artificial Intelligence & Neural Networks',
      credits: 4,
      attendedClasses: 19,
      totalClasses: 20,
      percentage: 95.0,
      isLowAttendance: false,
      statusLabel: 'Good'
    }
  ],
  assignments: [
    {
      id: 'asg-1',
      courseCode: 'CS-301',
      title: 'Problem Set 1: Dynamic Programming & Knapsack',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      maxScore: 100,
      status: 'pending',
      description: 'Implement memoized and bottom-up solutions for 0/1 Knapsack and Longest Common Subsequence.'
    },
    {
      id: 'asg-2',
      courseCode: 'CS-305',
      title: 'Lab Exercise 2: Docker Containerization on Azure App Service',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      maxScore: 50,
      status: 'submitted',
      description: 'Containerize a multi-tier web application and configure continuous deployment via GitHub Actions.'
    }
  ],
  faqs: [
    {
      id: 'faq-1',
      question: 'What is the minimum attendance required to appear for final examinations?',
      answer: 'University academic regulations mandate a minimum of 75% aggregate attendance in each registered course. Students below 75% are ineligible for final exams unless official medical leave (Form MED-1) is approved.',
      category: 'Academics',
      helpfulCount: 84
    },
    {
      id: 'faq-2',
      question: 'When is the deadline to pay Fall semester tuition fees?',
      answer: 'The regular tuition fee payment deadline is October 15th, 2026. A late fee penalty of $50 applies from October 16th to October 25th.',
      category: 'Fees & Financial Aid',
      helpfulCount: 65
    },
    {
      id: 'faq-3',
      question: 'Where is the Student Health and Counseling Center located?',
      answer: 'The Student Health Center is located on the ground floor of the Campus Wellness Pavilion (Building D, Room 102). It is open Monday to Friday from 8:00 AM to 6:00 PM.',
      category: 'Campus Facilities',
      helpfulCount: 42
    },
    {
      id: 'faq-4',
      question: 'How do I download my official examination Hall Ticket / Admit Card?',
      answer: 'Navigate to the Exam Schedule tab in the student portal 7 days prior to exam commencement to view your verified digital hall ticket, room allocation, and downloadable QR badge.',
      category: 'Examinations',
      helpfulCount: 57
    }
  ],
  studyPlan: {
    weeklyTargetHours: 24,
    completedHours: 14,
    schedule: [
      { id: 's1', day: 'Monday', time: '16:00 - 18:00', courseCode: 'CS-301', topic: 'Bellman-Ford & Floyd-Warshall Algorithms', isCompleted: true },
      { id: 's2', day: 'Tuesday', time: '17:00 - 19:00', courseCode: 'CS-305', topic: 'Kubernetes Pod Networking & Helm Charts', isCompleted: true },
      { id: 's3', day: 'Wednesday', time: '15:30 - 17:30', courseCode: 'CS-309', topic: 'Backpropagation & Loss Gradients in PyTorch', isCompleted: false },
      { id: 's4', day: 'Thursday', time: '18:00 - 20:00', courseCode: 'CS-301', topic: 'Problem Set 1 Tabulation Implementation', isCompleted: false },
      { id: 's5', day: 'Friday', time: '14:00 - 16:30', courseCode: 'CS-305', topic: 'Azure Cosmos DB Sharding Lab', isCompleted: false }
    ]
  },
  placements: [
    {
      id: 'comp-1',
      name: 'Microsoft Corporation',
      tier: 'Tier-1 (Super Dream)',
      role: 'Software Development Engineer I',
      packageLPA: 45.0,
      minCgpa: 3.5,
      maxBacklogs: 0,
      eligibleDepartments: ['Computer Science', 'Information Technology', 'Electronics'],
      requiredSkills: ['Data Structures & Algorithms', 'System Design', 'C++/Java/Python'],
      deadline: '2026-10-15',
      isEligible: true
    },
    {
      id: 'comp-2',
      name: 'Amazon Web Services (AWS)',
      tier: 'Tier-1 (Super Dream)',
      role: 'Cloud Support / DevOps Associate',
      packageLPA: 32.5,
      minCgpa: 3.3,
      maxBacklogs: 0,
      eligibleDepartments: ['Computer Science', 'Information Technology'],
      requiredSkills: ['Linux', 'Docker', 'Networking', 'Distributed Systems'],
      deadline: '2026-10-22',
      isEligible: true
    },
    {
      id: 'comp-3',
      name: 'Deloitte Digital',
      tier: 'Tier-2 (Dream)',
      role: 'Technology Consultant',
      packageLPA: 14.0,
      minCgpa: 3.0,
      maxBacklogs: 1,
      eligibleDepartments: ['All Engineering Branches'],
      requiredSkills: ['SQL', 'Business Analysis', 'Cloud Computing', 'Python'],
      deadline: '2026-10-28',
      isEligible: true
    }
  ],
  appointments: [
    {
      id: 'apt-101',
      facultyName: 'Dr. Alan Turing',
      courseCode: 'CS-301 (Algorithms)',
      appointmentDate: '2026-10-02',
      timeSlot: '14:30 - 15:00',
      purpose: 'Review Dynamic Programming assignment rubric and grade clarification',
      status: 'confirmed',
      location: 'Turing Hall, Room 302'
    },
    {
      id: 'apt-102',
      facultyName: 'Dr. Alan Turing',
      courseCode: 'CS-305 (Cloud Computing)',
      appointmentDate: '2026-10-08',
      timeSlot: '11:00 - 11:30',
      purpose: 'Attendance deficit counseling & exam clearance',
      status: 'pending',
      location: 'Turing Hall, Room 302'
    }
  ],
  tickets: [
    {
      ticketId: 'TICK-482910',
      subject: 'Attendance Discrepancy for Lab Session 4 (CS-305)',
      category: 'Attendance Query',
      priority: 'High',
      status: 'In Progress',
      assignedTo: 'Prof. Registrar Office',
      createdAt: '2026-09-18T10:15:00.000Z',
      messages: [
        { senderRole: 'student', senderName: 'Alex Mercer', message: 'I was present in the lab on Sept 14th but marked absent on portal.', sentAt: '2026-09-18T10:15:00.000Z' },
        { senderRole: 'staff', senderName: 'Academic Officer', message: 'Verifying physical sign-in sheet with TA. Will update within 24h.', sentAt: '2026-09-19T09:00:00.000Z' }
      ]
    },
    {
      ticketId: 'TICK-338219',
      subject: 'Fall Semester Fee Receipt & Scholarship Adjustment',
      category: 'Fees & Bursar',
      priority: 'Medium',
      status: 'Resolved',
      assignedTo: 'Bursar Financial Services',
      createdAt: '2026-09-12T14:30:00.000Z',
      messages: [
        { senderRole: 'student', senderName: 'Alex Mercer', message: 'Requested updated invoice reflecting merit scholarship waiver.', sentAt: '2026-09-12T14:30:00.000Z' },
        { senderRole: 'staff', senderName: 'Finance Admin', message: 'Updated receipt generated. Deduction applied in student billing portal.', sentAt: '2026-09-13T11:20:00.000Z' }
      ]
    }
  ],
  scholarships: [
    {
      id: 'sch-1',
      title: 'Presidential Academic Excellence Merit Fellowship',
      provider: 'University Board of Regents',
      amount: '$5,000 / semester',
      minCgpa: 3.75,
      deadline: '2026-10-31',
      isEligible: true,
      matchScore: '98% Match',
      description: 'Awarded to top 5% GPA students maintaining exceptional academic and research standing.'
    },
    {
      id: 'sch-2',
      title: 'Women in Technology & AI Innovation Grant',
      provider: 'Azure Global STEM Foundation',
      amount: '$3,500 / year',
      minCgpa: 3.4,
      deadline: '2026-11-15',
      isEligible: true,
      matchScore: '92% Match',
      description: 'Empowers underrepresented student researchers in machine learning, cloud computing, and cybersecurity.'
    },
    {
      id: 'sch-3',
      title: 'Need-Based Tuition Assistance Bursary',
      provider: 'Student Financial Aid Office',
      amount: 'Up to 50% Tuition Waiver',
      minCgpa: 2.8,
      deadline: '2026-10-25',
      isEligible: false,
      matchScore: 'Criteria Verified',
      description: 'Comprehensive financial support covering course credits and laboratory charges for eligible domestic students.'
    }
  ],
  events: [
    {
      id: 'ev-1',
      title: 'HackUni 2026: 36-Hour Generative AI Hackathon',
      category: 'Hackathon',
      eventDate: '2026-10-18T09:00:00.000Z',
      venue: 'Student Innovation Center & Azure Cloud Lab',
      organizer: 'ACM Student Chapter & Google Developer Student Club',
      capacity: 250,
      registeredCount: 184,
      isRegistered: true,
      badgeAwarded: 'Hackathon Contender',
      description: 'Compete with 50+ multidisciplinary teams building AI solutions on Azure AI Foundry and Kubernetes.'
    },
    {
      id: 'ev-2',
      title: 'Industry Keynote: The Future of Distributed Systems',
      category: 'Guest Lecture',
      eventDate: '2026-10-22T15:00:00.000Z',
      venue: 'University Grand Auditorium',
      organizer: 'Department of Computer Science',
      capacity: 400,
      registeredCount: 290,
      isRegistered: false,
      badgeAwarded: 'Tech Enthusiast',
      description: 'Distinguished lecture by leading cloud architects from Microsoft and open Q&A on scalable microservices.'
    },
    {
      id: 'ev-3',
      title: 'Fall Career Fair: 40+ Tech & Finance Recruiters',
      category: 'Career Fair',
      eventDate: '2026-11-04T10:00:00.000Z',
      venue: 'Campus Recreation Pavilion',
      organizer: 'University Career & Placement Cell',
      capacity: 1000,
      registeredCount: 650,
      isRegistered: true,
      badgeAwarded: 'Career Ready',
      description: 'Bring verified resumes and portfolio QR codes to meet engineering hiring teams directly.'
    }
  ],
  badges: [
    {
      code: 'PERFECT_ATTENDANCE',
      title: 'Attendance Titan',
      description: 'Maintained 95%+ attendance across all registered courses for 4 consecutive weeks.',
      category: 'Attendance',
      icon: 'Award',
      unlocked: true,
      unlockedAt: '2026-09-10',
      xp: 250
    },
    {
      code: 'QUIZ_MASTER',
      title: 'Quiz Champion',
      description: 'Completed 10 AI generated practice quizzes with an average score above 85%.',
      category: 'Academic',
      icon: 'Sparkles',
      unlocked: true,
      unlockedAt: '2026-09-15',
      xp: 300
    },
    {
      code: 'COMMUNITY_PILLAR',
      title: 'Forum Contributor',
      description: 'Received 20+ upvotes on student technical answers in discussion boards.',
      category: 'Community',
      icon: 'Users',
      unlocked: true,
      unlockedAt: '2026-09-18',
      xp: 200
    },
    {
      code: 'DEANS_HONORS',
      title: "Dean's Scholar",
      description: 'Achieved Semester GPA of 3.80 or higher in semester final examinations.',
      category: 'Academic',
      icon: 'GraduationCap',
      unlocked: false,
      progress: '3.82 current estimate (in progress)',
      xp: 500
    }
  ],
  forumPosts: [
    {
      id: 'post-1',
      title: 'Tips for memoization vs tabulation in DP Problem Set 1 (CS-301)?',
      authorName: 'Alex Mercer',
      authorRole: 'student',
      category: 'Algorithms',
      content: 'When solving the Longest Common Subsequence, is it recommended to reconstruct the sequence path using a directional pointer matrix or recursive traceback?',
      upvotes: 24,
      isSolved: true,
      createdAt: '2026-09-17T11:20:00.000Z',
      replies: [
        {
          authorName: 'Dr. Alan Turing',
          authorRole: 'faculty',
          content: 'Directional traceback from cell (m, n) provides O(m+n) reconstruction without extra auxiliary memory if you navigate values directly.',
          isVerifiedAnswer: true,
          createdAt: '2026-09-17T14:40:00.000Z'
        }
      ]
    },
    {
      id: 'post-2',
      title: 'Configuring Azure Managed Identity in Docker containers',
      authorName: 'Liam Smith',
      authorRole: 'student',
      category: 'Cloud Computing',
      content: 'Has anyone faced token retrieval timeouts when running Azure Identity client inside local Docker desktop? Any workaround without hardcoding client secrets?',
      upvotes: 18,
      isSolved: false,
      createdAt: '2026-09-18T16:00:00.000Z',
      replies: []
    }
  ],
  analytics: {
    gpaTrend: [
      { semester: 'Sem 1', gpa: 3.65, classAverage: 3.25 },
      { semester: 'Sem 2', gpa: 3.72, classAverage: 3.30 },
      { semester: 'Sem 3', gpa: 3.80, classAverage: 3.32 },
      { semester: 'Sem 4', gpa: 3.85, classAverage: 3.35 },
      { semester: 'Sem 5 (Est)', gpa: 3.82, classAverage: 3.38 }
    ],
    attendanceStats: [
      { course: 'CS-301 (Algo)', percentage: 87.5, threshold: 75 },
      { course: 'CS-305 (Cloud)', percentage: 72.2, threshold: 75 },
      { course: 'CS-309 (AI/NN)', percentage: 95.0, threshold: 75 }
    ],
    studyHoursDistribution: [
      { day: 'Mon', hours: 4.5 },
      { day: 'Tue', hours: 3.5 },
      { day: 'Wed', hours: 5.0 },
      { day: 'Thu', hours: 4.0 },
      { day: 'Fri', hours: 3.0 },
      { day: 'Sat', hours: 6.5 },
      { day: 'Sun', hours: 4.5 }
    ]
  }
};

export default api;
