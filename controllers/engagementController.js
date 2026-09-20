/**
 * Community, Gamification & Analytics Controller: Forum, Badges, Analytics Charts
 */

/**
 * Discussion Forum
 */
export const getForumPosts = async (req, res) => {
  try {
    const posts = [
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
        replies: [
          {
            authorName: 'Emma Watson',
            authorRole: 'student',
            content: 'Ensure Azure CLI is logged in on the host machine and pass the Azure credential environment flag or use Azure Developer CLI (azd).',
            isVerifiedAnswer: false,
            createdAt: '2026-09-18T17:15:00.000Z'
          }
        ]
      },
      {
        id: 'post-3',
        title: 'Recommended electives for Machine Learning & GenAI track in Semester 6',
        authorName: 'Sophia Chen',
        authorRole: 'student',
        category: 'Exam Prep',
        content: 'Looking for reviews on CS-408 Deep Learning vs CS-412 Information Retrieval. Which has better hands-on labs?',
        upvotes: 31,
        isSolved: false,
        createdAt: '2026-09-19T09:30:00.000Z',
        replies: []
      }
    ];

    res.status(200).json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createForumPost = async (req, res) => {
  try {
    const { title, category, content, authorName } = req.body;
    const newPost = {
      id: `post-${Date.now()}`,
      title,
      category: category || 'Algorithms',
      content,
      authorName: authorName || 'Alex Mercer',
      authorRole: 'student',
      upvotes: 1,
      isSolved: false,
      createdAt: new Date().toISOString(),
      replies: []
    };

    res.status(201).json({ success: true, data: newPost });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Achievements & Badge System
 */
export const getBadges = async (req, res) => {
  try {
    const badges = [
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
      },
      {
        code: 'CAREER_PRODIGY',
        title: 'ATS Resume Master',
        description: 'Obtained a 90%+ ATS optimization rating on uploaded technical portfolio.',
        category: 'Career',
        icon: 'FileText',
        unlocked: false,
        progress: 'Current score: 85%',
        xp: 350
      }
    ];

    const currentXp = 750;
    const nextLevelXp = 1000;

    res.status(200).json({
      success: true,
      data: {
        currentLevel: 4,
        rankTitle: 'Senior Scholar Specialist',
        currentXp,
        nextLevelXp,
        xpToNextLevel: nextLevelXp - currentXp,
        badges
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Analytics Dashboard with Visual Chart Data
 */
export const getAnalytics = async (req, res) => {
  try {
    const analytics = {
      // 5-Semester GPA Trajectory
      gpaTrend: [
        { semester: 'Sem 1', gpa: 3.65, classAverage: 3.25 },
        { semester: 'Sem 2', gpa: 3.72, classAverage: 3.30 },
        { semester: 'Sem 3', gpa: 3.80, classAverage: 3.32 },
        { semester: 'Sem 4', gpa: 3.85, classAverage: 3.35 },
        { semester: 'Sem 5 (Current)', gpa: 3.82, classAverage: 3.38 }
      ],

      // Attendance Distribution
      attendanceStats: [
        { course: 'CS-301 (Algo)', percentage: 87.5, threshold: 75 },
        { course: 'CS-305 (Cloud)', percentage: 72.2, threshold: 75 },
        { course: 'CS-309 (AI/NN)', percentage: 95.0, threshold: 75 }
      ],

      // Assignment Completion Status
      assignmentMetrics: {
        totalAssigned: 12,
        submittedOnTime: 10,
        pendingReview: 1,
        overdue: 0,
        averageScore: 92.4
      },

      // Weekly Study Time Breakdown (Hours)
      studyHoursDistribution: [
        { day: 'Mon', hours: 4.5 },
        { day: 'Tue', hours: 3.5 },
        { day: 'Wed', hours: 5.0 },
        { day: 'Thu', hours: 4.0 },
        { day: 'Fri', hours: 3.0 },
        { day: 'Sat', hours: 6.5 },
        { day: 'Sun', hours: 4.5 }
      ],

      // Peer Percentile Ranking
      percentileRank: {
        academicScore: 91,
        attendanceConsistency: 84,
        assignmentTurnaround: 96,
        overallIndex: 92
      }
    };

    res.status(200).json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
