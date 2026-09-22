import { AzureOpenAI } from 'openai';
import { AcademicPrediction, Quiz, StudyPlan } from '../models/index.js';
import ExamSchedule from '../models/ExamSchedule.js';

/**
 * Initialize Azure OpenAI Client with fallback handling
 */
const getAzureOpenAIClient = () => {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;

  if (!endpoint || !apiKey || endpoint.includes('mock-')) {
    return null;
  }

  return new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4.1-mini'
  });
};

/**
 * Subject reference mapping
 */
const SUBJECT_DETAILS = {
  'DNN': 'Deep Neural Networks (Architectures, Backpropagation, CNNs, RNNs, Transformers, Optimization, Activation Functions)',
  'CNDC': 'Computer Networks and Data Communication (OSI & TCP/IP models, Routing Protocols, IP Addressing, Congestion Control, Transport Layer, Sockets)',
  'Programming Abstractions': 'Programming Abstractions (Object-Oriented Design, Functional Programming, Memory Management, Polymorphism, Concurrency, Design Patterns)',
  'System Design': 'System Design (Scalability, Load Balancing, Caching, Sharding, Microservices, CAP Theorem, Database Replication, Message Queues)',
  'Data Structures & Algorithms': 'Data Structures & Algorithms (Trees, Graphs, Dynamic Programming, Heaps, Hashing, Time & Space Complexity, Greedy Algorithms)'
};

/**
 * Validate and sanitize generated MCQs
 */
const validateAndFormatQuestions = (rawQuestions) => {
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    throw new Error('AI response did not contain an array of questions.');
  }

  return rawQuestions.map((q, idx) => {
    const questionText = (q.question || q.questionText || '').trim();
    if (!questionText) {
      throw new Error(`Question at index ${idx} is missing question text.`);
    }

    const options = Array.isArray(q.options) ? q.options.map((opt) => String(opt).trim()) : [];
    if (options.length !== 4 || options.some((opt) => !opt)) {
      throw new Error(`Question "${questionText.slice(0, 30)}..." must have exactly 4 valid non-empty options.`);
    }

    let correctIndex = q.correctOptionIndex !== undefined ? q.correctOptionIndex : q.correctIndex;
    if (typeof correctIndex === 'string') {
      correctIndex = parseInt(correctIndex, 10);
    }
    if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      correctIndex = 0;
    }

    const explanation = (q.explanation || 'Review the core concept principles.').trim();

    return {
      questionId: `q-${idx + 1}-${Date.now().toString(36)}`,
      questionText,
      question: questionText,
      options,
      correctIndex,
      correctOptionIndex: correctIndex,
      explanation
    };
  });
};

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
    const { courses = [], currentCgpa = 8.65, completedCredits = 74 } = req.body;

    const gradePointsMap = {
      'A+': 10.0,
      'A': 9.0,
      'A-': 8.5,
      'B+': 8.0,
      'B': 7.0,
      'B-': 6.5,
      'C+': 6.0,
      'C': 5.0,
      'D': 4.0,
      'F': 0.0
    };

    let semesterPoints = 0;
    let semesterCredits = 0;

    courses.forEach((c) => {
      const credits = Number(c.credits) || 3;
      const points = gradePointsMap[c.expectedGrade] || 8.0;
      semesterPoints += points * credits;
      semesterCredits += credits;
    });

    const projectedSgpa = semesterCredits > 0
      ? Number((semesterPoints / semesterCredits).toFixed(2))
      : 8.5;

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
        honorsEligible: projectedCgpa >= 8.5
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Generate AI Practice Quiz using Azure AI Foundry (Azure OpenAI GPT-4.1-mini)
 * Accepts: topic, difficulty ('Easy', 'Medium', 'Hard'), numberOfQuestions (count)
 */
export const generateQuiz = async (req, res) => {
  try {
    const {
      topic = 'Data Structures & Algorithms',
      difficulty = 'Medium',
      count,
      numberOfQuestions = 5,
      courseCode
    } = req.body;

    const numQuestions = Math.min(Math.max(parseInt(count || numberOfQuestions, 10) || 5, 2), 10);
    const validDifficulty = ['Easy', 'Medium', 'Hard'].includes(difficulty) ? difficulty : 'Medium';
    const resolvedSubject = SUBJECT_DETAILS[topic] || topic;
    const subjectCode = courseCode || (Object.keys(SUBJECT_DETAILS).includes(topic) ? topic : 'CS-AI');

    const client = getAzureOpenAIClient();

    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'Azure OpenAI is not configured in the backend environment.'
      });
    }

    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4.1-mini';

    const systemPrompt = `You are a distinguished university computer science professor.
Your role is to generate high-yield, academically rigorous multiple-choice practice questions (MCQs).
Rules:
1. Return ONLY a valid JSON array of question objects.
2. Do NOT include markdown code blocks (\`\`\`json or \`\`\`), backticks, or any conversational preamble.
3. Every question must have exactly 4 options.
4. "correctOptionIndex" must be the integer 0, 1, 2, or 3 corresponding to the correct option in "options".
5. Provide a clear, educational "explanation" for why that option is correct.
JSON Schema:
[
  {
    "question": "Question text...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOptionIndex": 0,
    "explanation": "Detailed explanation..."
  }
]`;

    const userPrompt = `Generate ${numQuestions} multiple-choice questions on the topic: "${resolvedSubject}".
Difficulty Level: ${validDifficulty}.
Ensure options are distinct and plausible, with no ambiguous answers. Return valid JSON only.`;

    let questions = null;
    let lastError = null;

    // Retry mechanism: up to 2 attempts
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const completion = await client.chat.completions.create({
          model: deployment,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: attempt === 1 ? 0.4 : 0.2,
          max_tokens: 2200
        });

        let rawContent = completion.choices[0]?.message?.content?.trim() || '';

        // Clean any markdown wrappers
        if (rawContent.startsWith('```')) {
          rawContent = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
        }

        const parsedJson = JSON.parse(rawContent);
        questions = validateAndFormatQuestions(parsedJson);

        if (questions && questions.length > 0) {
          break; // Successfully validated
        }
      } catch (err) {
        lastError = err;
        console.warn(`[AI Quiz Studio] Generation attempt ${attempt} failed:`, err.message);
      }
    }

    if (!questions || questions.length === 0) {
      throw new Error(lastError ? `Azure OpenAI generation failed: ${lastError.message}` : 'Failed to generate valid quiz questions.');
    }

    // Save quiz to MongoDB using Quiz model
    const studentId = req.user?._id || req.user?.id || null;

    const newQuiz = await Quiz.create({
      courseCode: subjectCode,
      topic: topic,
      difficulty: validDifficulty,
      numberOfQuestions: questions.length,
      questions: questions.map((q) => ({
        questionId: q.questionId,
        questionText: q.questionText,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation
      })),
      createdBy: `Azure OpenAI (${deployment})`,
      student: studentId
    });

    res.status(200).json({
      success: true,
      message: `Generated ${questions.length} questions using Azure AI (${deployment})`,
      data: {
        quizId: newQuiz._id,
        courseCode: newQuiz.courseCode,
        topic: newQuiz.topic,
        difficulty: newQuiz.difficulty,
        totalQuestions: questions.length,
        questions: questions,
        createdAt: newQuiz.createdAt
      }
    });
  } catch (err) {
    console.error('[generateQuiz Error]:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to generate AI quiz. Please try again.'
    });
  }
};

/**
 * Submit Quiz Answers and Calculate Score
 * @route POST /api/v1/academic/quizzes/:id/submit OR /api/v1/academic/submit-quiz
 */
export const submitQuiz = async (req, res) => {
  try {
    const quizId = req.params.id || req.body.quizId;
    const { selectedAnswers = {} } = req.body;

    if (!quizId) {
      return res.status(400).json({ success: false, message: 'Quiz ID is required for submission.' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    const totalQuestions = quiz.questions.length;
    let correctCount = 0;

    const evaluatedQuestions = quiz.questions.map((q, idx) => {
      const selected = selectedAnswers[idx] !== undefined
        ? Number(selectedAnswers[idx])
        : selectedAnswers[q.questionId] !== undefined
          ? Number(selectedAnswers[q.questionId])
          : -1;

      const isCorrect = selected === q.correctIndex;
      if (isCorrect) correctCount++;

      return {
        index: idx,
        questionId: q.questionId,
        questionText: q.questionText,
        options: q.options,
        selectedOptionIndex: selected,
        correctOptionIndex: q.correctIndex,
        isCorrect,
        explanation: q.explanation
      };
    });

    const wrongCount = totalQuestions - correctCount;
    const percentage = totalQuestions > 0 ? Number(((correctCount / totalQuestions) * 100).toFixed(1)) : 0;

    // Save attempt onto Quiz document
    quiz.attempt = {
      score: correctCount,
      totalQuestions,
      correctCount,
      wrongCount,
      percentage,
      selectedAnswers,
      submittedAt: new Date()
    };

    if (req.user?._id && !quiz.student) {
      quiz.student = req.user._id;
    }

    await quiz.save();

    res.status(200).json({
      success: true,
      message: 'Quiz evaluated and score recorded successfully.',
      data: {
        quizId: quiz._id,
        topic: quiz.topic,
        difficulty: quiz.difficulty,
        totalQuestions,
        totalScore: `${correctCount} / ${totalQuestions}`,
        score: correctCount,
        correctAnswers: correctCount,
        wrongAnswers: wrongCount,
        percentage,
        evaluatedQuestions,
        submittedAt: quiz.attempt.submittedAt
      }
    });
  } catch (err) {
    console.error('[submitQuiz Error]:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to evaluate quiz.' });
  }
};

/**
 * Get Quiz History for Current Student
 * @route GET /api/v1/academic/quiz-history
 */
export const getQuizHistory = async (req, res) => {
  try {
    const studentId = req.user?._id || req.user?.id;
    const filter = studentId ? { student: studentId } : {};

    const quizzes = await Quiz.find(filter)
      .sort({ createdAt: -1 })
      .limit(20)
      .select('topic difficulty courseCode numberOfQuestions attempt createdAt createdBy');

    res.status(200).json({
      success: true,
      count: quizzes.length,
      data: quizzes
    });
  } catch (err) {
    console.error('[getQuizHistory Error]:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to retrieve quiz history.' });
  }
};

/**
 * Get Single Quiz by ID
 * @route GET /api/v1/academic/quizzes/:id
 */
export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to load quiz.' });
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