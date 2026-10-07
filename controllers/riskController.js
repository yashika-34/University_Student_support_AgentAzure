import mongoose from 'mongoose';
import { AzureOpenAI } from 'openai';
import RiskAlert from '../models/RiskAlert.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Marks from '../models/Marks.js';
import Assignment from '../models/Assignment.js';
import DigitalTwin from '../models/DigitalTwin.js';
import TwinConversation from '../models/TwinConversation.js';

// ── Azure OpenAI client ──────────────────────────────────────────────────────
const getAIClient = () =>
  new AzureOpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview'
  });

const DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4.1-mini';

// ── Helpers ──────────────────────────────────────────────────────────────────

function scoreToStatus(score) {
  if (score >= 80) return 'safe';
  if (score >= 60) return 'warning';
  if (score >= 40) return 'danger';
  return 'critical';
}

function overallRiskLevel(score) {
  if (score >= 80) return 'safe';
  if (score >= 60) return 'monitor';
  if (score >= 40) return 'at_risk';
  return 'critical';
}

// Compute weighted overall score from factor scores
function computeOverallScore(factors) {
  const weights = {
    Attendance: 0.30,
    Marks: 0.30,
    Assignments: 0.25,
    Engagement: 0.15
  };
  let total = 0;
  let weightSum = 0;
  for (const f of factors) {
    const w = weights[f.factor] || 0.1;
    total += f.score * w;
    weightSum += w;
  }
  return weightSum > 0 ? Math.round(total / weightSum) : 50;
}

// ── Core data aggregation for one student ────────────────────────────────────

async function aggregateStudentData(student) {
  const studentId = student._id;

  // 1. ATTENDANCE
  const attRecords = await Attendance.find({ student: studentId });
  const totalClasses = attRecords.length;
  const attended = attRecords.filter(r => r.status === 'present' || r.status === 'late').length;
  const attendancePercent = totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0;

  // 2. MARKS
  const marksRecords = await Marks.find({ student: studentId });
  const avgMarksPercent = marksRecords.length > 0
    ? Math.round(marksRecords.reduce((s, m) => s + (m.percentage || 0), 0) / marksRecords.length)
    : 0;

  // 3. ASSIGNMENTS — find assignments where the student's course is enrolled
  const enrolledCourseIds = student.enrolledCourses.map(c => c.courseId);
  const allAssignments = await Assignment.find({ course: { $in: enrolledCourseIds } });
  let submitted = 0, missed = 0, late = 0;
  for (const asgn of allAssignments) {
    const sub = asgn.submissions.find(s => s.student.toString() === studentId.toString());
    if (!sub) {
      if (new Date(asgn.dueDate) < new Date()) missed++;
    } else if (sub.status === 'late') {
      late++;
      submitted++;
    } else {
      submitted++;
    }
  }
  const totalAssignments = allAssignments.length;
  const assignmentSubmissionRate = totalAssignments > 0
    ? Math.round((submitted / totalAssignments) * 100)
    : 100;

  // 4. DIGITAL TWIN ENGAGEMENT
  let twinSessions = 0;
  let escalatedDoubts = 0;
  try {
    const twins = await DigitalTwin.find({ linkedCourses: { $in: enrolledCourseIds } });
    for (const twin of twins) {
      escalatedDoubts += (twin.escalatedDoubts || []).filter(
        d => d.studentId?.toString() === student.userId?.toString()
      ).length;
    }
    // Count TwinConversation sessions if model exists
    if (TwinConversation) {
      twinSessions = await TwinConversation.countDocuments({
        $or: [
          { student: studentId },
          { user: student.userId }
        ]
      }).catch(() => 0);
    }
  } catch (_) {
    // Digital twin data unavailable
  }

  return {
    attendancePercent,
    avgMarksPercent,
    assignmentSubmissionRate,
    missedAssignments: missed,
    lateSubmissions: late,
    totalAssignments,
    submitted,
    cgpa: student.cgpa || 0,
    digitalTwinSessions: twinSessions,
    escalatedDoubts
  };
}

// ── Compute risk factors from aggregated data ─────────────────────────────────

function computeRiskFactors(data) {
  const factors = [];

  // Attendance factor (0-100 score)
  const attScore = Math.min(100, data.attendancePercent);
  factors.push({
    factor: 'Attendance',
    score: attScore,
    status: scoreToStatus(attScore),
    detail: `${data.attendancePercent}% attendance. ${
      data.attendancePercent < 75
        ? `⚠️ Below the 75% minimum threshold — at risk of detention.`
        : `✅ Above the 75% required minimum.`
    }`,
    rawData: { attendancePercent: data.attendancePercent }
  });

  // Marks factor
  const marksScore = Math.min(100, data.avgMarksPercent);
  factors.push({
    factor: 'Marks',
    score: marksScore,
    status: scoreToStatus(marksScore),
    detail: `Average performance: ${data.avgMarksPercent}%. CGPA: ${data.cgpa}. ${
      data.avgMarksPercent < 40
        ? '🚨 Failing threshold — immediate academic intervention required.'
        : data.avgMarksPercent < 60
        ? '⚠️ Below satisfactory performance.'
        : '✅ Acceptable academic performance.'
    }`,
    rawData: { avgMarksPercent: data.avgMarksPercent, cgpa: data.cgpa }
  });

  // Assignment factor
  const asgScore = data.assignmentSubmissionRate;
  factors.push({
    factor: 'Assignments',
    score: asgScore,
    status: scoreToStatus(asgScore),
    detail: `Submitted ${data.submitted}/${data.totalAssignments} assignments (${data.assignmentSubmissionRate}%). ${data.missedAssignments} missed, ${data.lateSubmissions} late.`,
    rawData: {
      submissionRate: data.assignmentSubmissionRate,
      missed: data.missedAssignments,
      late: data.lateSubmissions
    }
  });

  // Digital Twin Engagement factor
  const engagementScore = Math.min(100, data.digitalTwinSessions * 10 + 40); // baseline 40, +10 per session
  factors.push({
    factor: 'Engagement',
    score: engagementScore,
    status: scoreToStatus(engagementScore),
    detail: `${data.digitalTwinSessions} AI Twin sessions. ${data.escalatedDoubts} doubts escalated to faculty. ${
      data.digitalTwinSessions === 0
        ? '⚠️ No AI learning sessions recorded — student may be disengaged.'
        : '✅ Student is using AI learning tools.'
    }`,
    rawData: {
      sessions: data.digitalTwinSessions,
      escalatedDoubts: data.escalatedDoubts
    }
  });

  return factors;
}

// ── AI Summary + Recovery Plan via Azure OpenAI ───────────────────────────────

async function generateAIAnalysis(studentName, data, factors, riskLevel) {
  const client = getAIClient();

  const factorText = factors.map(f =>
    `• ${f.factor}: Score ${f.score}/100 (${f.status.toUpperCase()}) — ${f.detail}`
  ).join('\n');

  const prompt = `You are an academic early-warning AI system for a university. Analyze the following student performance data and generate a concise risk report and recovery plan.

STUDENT: ${studentName}
RISK LEVEL: ${riskLevel.toUpperCase().replace('_', ' ')}

PERFORMANCE DATA:
${factorText}

Raw Metrics:
- Attendance: ${data.attendancePercent}%
- Average Marks: ${data.avgMarksPercent}%
- Assignment Submission Rate: ${data.assignmentSubmissionRate}%
- Missed Assignments: ${data.missedAssignments}
- CGPA: ${data.cgpa}
- AI Twin Sessions: ${data.digitalTwinSessions}

Respond in the following strict JSON format (no markdown, no extra text):
{
  "summary": "2-3 sentence academic risk summary for this student",
  "recoveryPlan": {
    "headline": "Short motivational headline for the recovery plan",
    "estimatedRecoveryWeeks": <number 1-12>,
    "steps": [
      { "priority": 1, "action": "specific actionable step", "deadline": "e.g. Within 1 week", "owner": "student|faculty|advisor" },
      { "priority": 2, "action": "...", "deadline": "...", "owner": "..." },
      { "priority": 3, "action": "...", "deadline": "...", "owner": "..." },
      { "priority": 4, "action": "...", "deadline": "...", "owner": "..." }
    ]
  }
}`;

  try {
    const response = await client.chat.completions.create({
      model: DEPLOYMENT,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 800
    });

    const raw = response.choices[0]?.message?.content?.trim() || '{}';
    const parsed = JSON.parse(raw);
    return {
      aiSummary: parsed.summary || 'AI analysis unavailable.',
      recoveryPlan: {
        headline: parsed.recoveryPlan?.headline || 'Academic Recovery Plan',
        estimatedRecoveryWeeks: parsed.recoveryPlan?.estimatedRecoveryWeeks || 4,
        steps: parsed.recoveryPlan?.steps || []
      }
    };
  } catch (err) {
    console.error('[RiskAI] AI generation error:', err.message);
    return {
      aiSummary: `Student ${studentName} shows ${riskLevel.replace('_', ' ')} risk level. Key concerns: ${factors.filter(f => f.status !== 'safe').map(f => f.factor).join(', ')}.`,
      recoveryPlan: {
        headline: 'Immediate Academic Recovery Required',
        estimatedRecoveryWeeks: 4,
        steps: [
          { priority: 1, action: 'Meet with academic advisor this week', deadline: 'Within 3 days', owner: 'student' },
          { priority: 2, action: 'Attend all remaining classes without exception', deadline: 'Ongoing', owner: 'student' },
          { priority: 3, action: 'Submit all pending assignments', deadline: 'Within 1 week', owner: 'student' },
          { priority: 4, action: 'Faculty to schedule one-on-one counseling session', deadline: 'Within 1 week', owner: 'faculty' }
        ]
      }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Run AI risk assessment for a specific student
 * @route   POST /api/v1/risk/analyze/:studentId
 * @access  Private (Faculty, Admin)
 */
export const analyzeStudentRisk = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId).populate('userId', 'fullName firstName lastName email');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const studentName = student.userId?.fullName || `${student.userId?.firstName} ${student.userId?.lastName}` || 'Student';

    // Aggregate data
    const data = await aggregateStudentData(student);

    // Compute risk factors
    const riskFactors = computeRiskFactors(data);

    // Overall score & risk level
    const overallScore = computeOverallScore(riskFactors);
    const riskLevel = overallRiskLevel(overallScore);

    // AI Summary + Recovery Plan
    const { aiSummary, recoveryPlan } = await generateAIAnalysis(studentName, data, riskFactors, riskLevel);

    // Save to DB
    const alert = await RiskAlert.create({
      student: student._id,
      generatedBy: req.user._id,
      overallRiskScore: overallScore,
      riskLevel,
      riskFactors,
      aiSummary,
      recoveryPlan,
      snapshotData: {
        attendancePercent: data.attendancePercent,
        avgMarksPercent: data.avgMarksPercent,
        assignmentSubmissionRate: data.assignmentSubmissionRate,
        missedAssignments: data.missedAssignments,
        lateSubmissions: data.lateSubmissions,
        cgpa: data.cgpa,
        digitalTwinSessions: data.digitalTwinSessions,
        escalatedDoubts: data.escalatedDoubts
      },
      semester: student.currentSemester
    });

    return res.status(201).json({
      success: true,
      message: 'Risk analysis complete.',
      data: alert
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Batch analyze risk for ALL students (or a department)
 * @route   POST /api/v1/risk/batch-analyze
 * @access  Private (Faculty, Admin)
 */
export const batchAnalyzeRisk = async (req, res, next) => {
  try {
    const { department, semester } = req.body;

    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.currentSemester = parseInt(semester);

    const students = await Student.find(filter)
      .populate('userId', 'fullName firstName lastName email')
      .limit(50); // Safety limit

    if (!students.length) {
      return res.status(404).json({ success: false, message: 'No students found matching criteria.' });
    }

    const results = [];
    let processed = 0;

    for (const student of students) {
      try {
        const studentName = student.userId?.fullName ||
          `${student.userId?.firstName || ''} ${student.userId?.lastName || ''}`.trim() || 'Student';

        const data = await aggregateStudentData(student);
        const riskFactors = computeRiskFactors(data);
        const overallScore = computeOverallScore(riskFactors);
        const riskLevel = overallRiskLevel(overallScore);

        // Only run AI for at-risk+ to save quota; use fallback for others
        let aiSummary, recoveryPlan;
        if (riskLevel === 'at_risk' || riskLevel === 'critical') {
          const aiResult = await generateAIAnalysis(studentName, data, riskFactors, riskLevel);
          aiSummary = aiResult.aiSummary;
          recoveryPlan = aiResult.recoveryPlan;
        } else {
          aiSummary = `${studentName} is currently ${riskLevel === 'safe' ? 'performing well' : 'at a monitor level'}. Continue current engagement.`;
          recoveryPlan = {
            headline: riskLevel === 'safe' ? 'Keep up the great work!' : 'Maintain consistency',
            estimatedRecoveryWeeks: 0,
            steps: riskLevel === 'monitor' ? [
              { priority: 1, action: 'Maintain attendance above 80%', deadline: 'Ongoing', owner: 'student' },
              { priority: 2, action: 'Review weak subjects proactively', deadline: 'This week', owner: 'student' }
            ] : []
          };
        }

        const alert = await RiskAlert.create({
          student: student._id,
          generatedBy: req.user._id,
          overallRiskScore: overallScore,
          riskLevel,
          riskFactors,
          aiSummary,
          recoveryPlan,
          snapshotData: {
            attendancePercent: data.attendancePercent,
            avgMarksPercent: data.avgMarksPercent,
            assignmentSubmissionRate: data.assignmentSubmissionRate,
            missedAssignments: data.missedAssignments,
            lateSubmissions: data.lateSubmissions,
            cgpa: data.cgpa,
            digitalTwinSessions: data.digitalTwinSessions,
            escalatedDoubts: data.escalatedDoubts
          },
          semester: student.currentSemester
        });

        results.push({
          studentId: student._id,
          studentName,
          riskLevel,
          overallRiskScore: overallScore,
          alertId: alert._id
        });
        processed++;
      } catch (err) {
        console.error(`[RiskBatch] Failed for student ${student._id}:`, err.message);
      }
    }

    const summary = {
      total: processed,
      critical: results.filter(r => r.riskLevel === 'critical').length,
      at_risk: results.filter(r => r.riskLevel === 'at_risk').length,
      monitor: results.filter(r => r.riskLevel === 'monitor').length,
      safe: results.filter(r => r.riskLevel === 'safe').length
    };

    return res.status(200).json({
      success: true,
      message: `Batch analysis complete for ${processed} students.`,
      summary,
      data: results
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all risk alerts (with filters)
 * @route   GET /api/v1/risk/alerts
 * @access  Private (Faculty, Admin)
 */
export const getRiskAlerts = async (req, res, next) => {
  try {
    const { riskLevel, acknowledged, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (riskLevel) filter.riskLevel = riskLevel;
    if (acknowledged !== undefined) filter.isAcknowledged = acknowledged === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [alerts, total] = await Promise.all([
      RiskAlert.find(filter)
        .populate('student', 'studentId department currentSemester cgpa batch')
        .populate({ path: 'student', populate: { path: 'userId', select: 'fullName firstName lastName email' } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      RiskAlert.countDocuments(filter)
    ]);

    const summary = await RiskAlert.aggregate([
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      summary: summary.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      data: alerts
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a single risk alert by ID
 * @route   GET /api/v1/risk/alerts/:alertId
 * @access  Private
 */
export const getRiskAlertById = async (req, res, next) => {
  try {
    const alert = await RiskAlert.findById(req.params.alertId)
      .populate('student', 'studentId department currentSemester cgpa batch')
      .populate({ path: 'student', populate: { path: 'userId', select: 'fullName firstName lastName email' } });

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Risk alert not found.' });
    }

    return res.status(200).json({ success: true, data: alert });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get risk history for a specific student
 * @route   GET /api/v1/risk/student/:studentId
 * @access  Private
 */
export const getStudentRiskHistory = async (req, res, next) => {
  try {
    const alerts = await RiskAlert.find({ student: req.params.studentId })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({ success: true, data: alerts });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Acknowledge a risk alert
 * @route   PATCH /api/v1/risk/alerts/:alertId/acknowledge
 * @access  Private (Faculty, Admin)
 */
export const acknowledgeAlert = async (req, res, next) => {
  try {
    const alert = await RiskAlert.findByIdAndUpdate(
      req.params.alertId,
      {
        isAcknowledged: true,
        acknowledgedBy: req.user._id,
        acknowledgedAt: new Date()
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }

    return res.status(200).json({ success: true, message: 'Alert acknowledged.', data: alert });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get dashboard statistics for risk overview
 * @route   GET /api/v1/risk/dashboard-stats
 * @access  Private (Faculty, Admin)
 */
export const getRiskDashboardStats = async (req, res, next) => {
  try {
    const [levelCounts, recentCritical, unacknowledgedCount] = await Promise.all([
      RiskAlert.aggregate([
        { $sort: { student: 1, createdAt: -1 } },
        { $group: { _id: '$student', latestLevel: { $first: '$riskLevel' }, latestScore: { $first: '$overallRiskScore' } } },
        { $group: { _id: '$latestLevel', count: { $sum: 1 } } }
      ]),
      RiskAlert.find({ riskLevel: { $in: ['critical', 'at_risk'] }, isAcknowledged: false })
        .populate('student', 'studentId currentSemester department')
        .populate({ path: 'student', populate: { path: 'userId', select: 'fullName firstName lastName' } })
        .sort({ createdAt: -1 })
        .limit(5),
      RiskAlert.countDocuments({ isAcknowledged: false, riskLevel: { $in: ['at_risk', 'critical'] } })
    ]);

    const counts = levelCounts.reduce((acc, l) => ({ ...acc, [l._id]: l.count }), {});

    return res.status(200).json({
      success: true,
      data: {
        counts: {
          safe: counts.safe || 0,
          monitor: counts.monitor || 0,
          at_risk: counts.at_risk || 0,
          critical: counts.critical || 0,
          total: Object.values(counts).reduce((s, v) => s + v, 0)
        },
        unacknowledgedCount,
        recentCritical
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a risk alert
 * @route   DELETE /api/v1/risk/alerts/:alertId
 * @access  Private (Admin)
 */
export const deleteRiskAlert = async (req, res, next) => {
  try {
    await RiskAlert.findByIdAndDelete(req.params.alertId);
    return res.status(200).json({ success: true, message: 'Alert deleted.' });
  } catch (err) {
    next(err);
  }
};
