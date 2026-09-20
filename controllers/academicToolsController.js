import { AcademicPrediction, Quiz, StudyPlan } from '../models/index.js';

/**
 * Predict Attendance & Recovery Trajectory
 */
export const predictAttendance = async (req, res) => {
  try {
    const { attended = 18, total = 22, hypotheticalAction = 'attend', count = 3, targetPercentage = 75 } = req.body;

    const newTotal = total + Number(count);
    const newAttended = hypotheticalAction === 'attend' ? attended + Number(count) : attended;
    const projectedPercentage = Number(((newAttended / newTotal) * 100).toFixed(1));

    // Calculate maximum safe classes to miss while staying >= targetPercentage:
    // attended / (total + x) >= (target / 100) => total + x <= attended / (target / 100)
    const targetDecimal = targetPercentage / 100;
    const maxSafeMisses = Math.max(0, Math.floor(attended / targetDecimal - total));

    // Calculate consecutive classes needed to attend to reach targetPercentage:
    // (attended + y) / (total + y) >= targetDecimal => attended + y >= targetDecimal * total + targetDecimal * y
    // y * (1 - targetDecimal) >= targetDecimal * total - attended
    const currentPercentage = Number(((attended / total) * 100).toFixed(1));
    const neededConsecutive = currentPercentage < targetPercentage
      ? Math.max(0, Math.ceil((targetDecimal * total - attended) / (1 - targetDecimal)))
      : 0;

    res.status(200).json({
      success: true,
      data: {
        currentPercentage,
        projectedPercentage,
        attended: newAttended,
        totalClasses: newTotal,
        maxSafeMisses,
        neededConsecutive,
        isDebarredRisk: projectedPercentage < targetPercentage,
        recommendation: projectedPercentage < targetPercentage
          ? `High alert: attend next ${neededConsecutive} consecutive classes to avoid exam debarment.`
          : `Safe status: you can afford up to ${maxSafeMisses} absences without violating the ${targetPercentage}% university policy.`
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Predict SGPA & CGPA Trajectory
 */
export const predictSGPA = async (req, res) => {
  try {
    const { courses = [], currentCgpa = 3.82, completedCredits = 74 } = req.body;

    const gradePointsMap = {
      'A+': 4.0,
      'A': 4.0,
      'A-': 3.7,
      'B+': 3.3,
      'B': 3.0,
      'B-': 2.7,
      'C+': 2.3,
      'C': 2.0,
      'D': 1.0,
      'F': 0.0
    };

    let totalSemesterCredits = 0;
    let totalGradePointsEarned = 0;

    const evaluatedCourses = courses.map((c) => {
      const credits = Number(c.credits) || 3;
      const point = gradePointsMap[c.expectedGrade] ?? 3.5;
      totalSemesterCredits += credits;
      totalGradePointsEarned += credits * point;
      return {
        ...c,
        gradePoint: point,
        weightedPoints: credits * point
      };
    });

    const predictedSGPA = totalSemesterCredits > 0
      ? Number((totalGradePointsEarned / totalSemesterCredits).toFixed(2))
      : currentCgpa;

    // Projected Cumulative GPA
    const totalNewCredits = completedCredits + totalSemesterCredits;
    const projectedCGPA = totalNewCredits > 0
      ? Number(((currentCgpa * completedCredits + totalGradePointsEarned) / totalNewCredits).toFixed(2))
      : currentCgpa;

    res.status(200).json({
      success: true,
      data: {
        courses: evaluatedCourses,
        semesterCredits: totalSemesterCredits,
        predictedSGPA,
        projectedCGPA,
        performanceLabel: predictedSGPA >= 3.8 ? "Dean's Honors List Potential" : predictedSGPA >= 3.5 ? 'Good Academic Standing' : 'Needs Reinforcement'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Generate AI Practice Quiz
 */
export const generateQuiz = async (req, res) => {
  try {
    const { courseCode = 'CS-301', topic = 'Dynamic Programming', difficulty = 'Intermediate' } = req.body;

    const quizBanks = {
      'CS-301': [
        {
          id: 1,
          questionText: 'What is the optimal time complexity of solving the 0/1 Knapsack problem using Dynamic Programming?',
          options: ['O(N * W)', 'O(2^N)', 'O(N log N)', 'O(W^2)'],
          correctIndex: 0,
          explanation: '0/1 Knapsack with N items and weight capacity W runs in pseudo-polynomial time O(N * W).'
        },
        {
          id: 2,
          questionText: 'Which property distinguishes Dynamic Programming from Divide and Conquer?',
          options: ['Overlapping Subproblems', 'Recursion', 'Independent Subproblems', 'Greedy Choice Property'],
          correctIndex: 0,
          explanation: 'Dynamic Programming optimizes problems with overlapping subproblems and optimal substructure via memoization or tabulation.'
        },
        {
          id: 3,
          questionText: 'In Longest Common Subsequence (LCS) of two strings of lengths m and n, what is the space complexity of the standard 2D table?',
          options: ['O(m * n)', 'O(m + n)', 'O(2^(m+n))', 'O(1)'],
          correctIndex: 0,
          explanation: 'The standard DP grid requires an (m+1) x (n+1) matrix, requiring O(m * n) space.'
        }
      ],
      'CS-305': [
        {
          id: 1,
          questionText: 'What constitutes the key advantage of containerization (Docker) over traditional Virtual Machines?',
          options: ['Shares host OS kernel with lower overhead', 'Provides complete hardware emulation', 'Requires dedicated guest OS per instance', 'Disables network bridging'],
          correctIndex: 0,
          explanation: 'Containers share the host operating system kernel and isolate user spaces, resulting in lightweight resource consumption.'
        },
        {
          id: 2,
          questionText: 'Which Azure cloud compute service provides fully managed serverless event-driven execution?',
          options: ['Azure Functions', 'Azure Virtual Machines', 'Azure Blob Storage', 'Azure ExpressRoute'],
          correctIndex: 0,
          explanation: 'Azure Functions is Microsoft’s serverless compute service that runs event-triggered code on demand.'
        }
      ]
    };

    const selectedQuestions = quizBanks[courseCode] || quizBanks['CS-301'];

    res.status(200).json({
      success: true,
      data: {
        courseCode,
        topic,
        difficulty,
        totalQuestions: selectedQuestions.length,
        questions: selectedQuestions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Personalized Study Planner
 */
export const getStudyPlan = async (req, res) => {
  try {
    const defaultPlan = {
      weeklyTargetHours: 24,
      completedHours: 14,
      schedule: [
        { id: 's1', day: 'Monday', time: '16:00 - 18:00', courseCode: 'CS-301', topic: 'Bellman-Ford & Floyd-Warshall Algorithms', isCompleted: true },
        { id: 's2', day: 'Tuesday', time: '17:00 - 19:00', courseCode: 'CS-305', topic: 'Kubernetes Pod Networking & Helm Charts', isCompleted: true },
        { id: 's3', day: 'Wednesday', time: '15:30 - 17:30', courseCode: 'CS-309', topic: 'Backpropagation & Loss Gradients in PyTorch', isCompleted: false },
        { id: 's4', day: 'Thursday', time: '18:00 - 20:00', courseCode: 'CS-301', topic: 'Problem Set 1 Tabulation Implementation', isCompleted: false },
        { id: 's5', day: 'Friday', time: '14:00 - 16:30', courseCode: 'CS-305', topic: 'Azure Cosmos DB Sharding Lab', isCompleted: false }
      ]
    };

    res.status(200).json({ success: true, data: defaultPlan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * AI Learning Recommendations
 */
export const getLearningRecommendations = async (req, res) => {
  try {
    const recommendations = [
      {
        id: 'rec-1',
        courseCode: 'CS-305',
        title: 'Mastering Microservices on Azure App Services',
        type: 'Interactive Lab & Tutorial',
        duration: '45 mins',
        source: 'Microsoft Learn & UniAssist AI',
        urgency: 'High (Attendance is 72.2%)',
        reason: 'Recommended due to low lecture attendance in Cloud Computing',
        url: 'https://learn.microsoft.com/en-us/azure/'
      },
      {
        id: 'rec-2',
        courseCode: 'CS-301',
        title: 'Advanced Dynamic Programming: State Compression',
        type: 'Video Lecture & Problem Practice',
        duration: '35 mins',
        source: 'MIT OpenCourseWare',
        urgency: 'Medium',
        reason: 'Recommended for upcoming Problem Set 1 deadline in 3 days',
        url: 'https://ocw.mit.edu/'
      },
      {
        id: 'rec-3',
        courseCode: 'CS-309',
        title: 'Attention Mechanisms and Transformer Architectures',
        type: 'Guided Colab Notebook',
        duration: '60 mins',
        source: 'Stanford CS224N',
        urgency: 'Low (Enrichment)',
        reason: 'Recommended to achieve top grade in AI & Neural Networks',
        url: 'https://stanford.edu/'
      }
    ];

    res.status(200).json({ success: true, data: recommendations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
