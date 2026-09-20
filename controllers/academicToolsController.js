import { AcademicPrediction, Quiz, StudyPlan } from '../models/index.js';
import ExamSchedule from '../models/ExamSchedule.js';

/**
 * Predict Attendance & Recovery Trajectory
 */
export const predictAttendance = async (req, res) => {
  try {
    const { attended = 18, total = 22, hypotheticalAction = 'attend', count = 3, targetPercentage = 75 } = req.body;

    const newTotal = total + Number(count);
    const newAttended = hypotheticalAction === 'attend' ? attended + Number(count) : attended;
    const projectedPercentage = Number(((newAttended / newTotal) * 100).toFixed(1));

    const targetDecimal = targetPercentage / 100;
    const maxSafeMisses = Math.max(0, Math.floor(attended / targetDecimal - total));

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

    let semesterPoints = 0;
    let semesterCredits = 0;

    courses.forEach((c) => {
      const credits = Number(c.credits) || 3;
      const points = gradePointsMap[c.expectedGrade] || 3.0;
      semesterPoints += points * credits;
      semesterCredits += credits;
    });

    const projectedSgpa = semesterCredits > 0
      ? Number((semesterPoints / semesterCredits).toFixed(2))
      : 3.5;

    const totalCredits = completedCredits + semesterCredits;
    const totalWeightedPoints = (currentCgpa * completedCredits) + semesterPoints;
    const projectedCgpa = totalCredits > 0
      ? Number((totalWeightedPoints / totalCredits).toFixed(2))
      : currentCgpa;

    res.status(200).json({
      success: true,
      data: {
        currentCgpa,
        projectedSgpa,
        projectedCgpa,
        completedCredits,
        semesterCredits,
        totalCredits,
        honorsEligible: projectedCgpa >= 3.8
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
    const { topic = 'Dynamic Programming & Memoization', difficulty = 'Medium', count = 3 } = req.body;

    const quizQuestions = [
      {
        questionId: 'q1',
        question: 'What is the primary difference between top-down memoization and bottom-up tabulation in Dynamic Programming?',
        options: [
          'Memoization is iterative while tabulation uses recursion.',
          'Memoization uses recursion with cached subproblem results while tabulation solves subproblems iteratively.',
          'Tabulation requires exponential memory whereas memoization is O(1) space.',
          'There is no theoretical or operational difference.'
        ],
        correctOptionIndex: 1,
        explanation: 'Top-down memoization maintains recursive call stacks and caches solutions, while bottom-up tabulation builds the solution iteratively from the base cases.'
      },
      {
        questionId: 'q2',
        question: 'In the 0/1 Knapsack Problem with N items and maximum weight W, what is the optimal dynamic programming time complexity?',
        options: ['O(N log N)', 'O(N * W)', 'O(2^N)', 'O(N^2)'],
        correctOptionIndex: 1,
        explanation: 'The standard dynamic programming solution runs in pseudo-polynomial time O(N * W) using a 2D table or 1D array optimization.'
      },
      {
        questionId: 'q3',
        question: 'Which of the following shortest path algorithms can handle negative weight edges without negative cycles?',
        options: ["Dijkstra's Algorithm", 'Bellman-Ford Algorithm', "Prim's MST", "Kruskal's Algorithm"],
        correctOptionIndex: 1,
        explanation: 'The Bellman-Ford algorithm relaxes edges V-1 times and correctly determines shortest paths in graphs with negative weight edges, also detecting negative cycles.'
      }
    ];

    res.status(200).json({
      success: true,
      data: {
        topic,
        difficulty,
        totalQuestions: quizQuestions.length,
        questions: quizQuestions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get Study Plan & Schedule
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

/**
 * Get Exam Schedules
 * @route GET /api/v1/academic/exam-schedules
 */
export const getExamSchedules = async (req, res) => {
  try {
    const { term, status } = req.query;
    const filter = {};
    if (term) filter.term = term;
    if (status && status !== 'all') filter.status = status;

    const schedules = await ExamSchedule.find(filter)
      .populate('course', 'courseCode courseName credits')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Create Exam Schedule
 * @route POST /api/v1/academic/exam-schedules
 */
export const createExamSchedule = async (req, res) => {
  try {
    const schedule = await ExamSchedule.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Exam schedule entry created successfully.',
      data: schedule
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
