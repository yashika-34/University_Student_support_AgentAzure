import Placement from '../models/Placement.js';
import PlacementRegistration from '../models/PlacementRegistration.js';
import CareerProfile from '../models/CareerProfile.js';
import Student from '../models/Student.js';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';

/**
 * Career & Placement Controller
 * DB-backed Placement Eligibility, ATS Resume Upload & Analysis, Counseling, Mock Interview
 */

// ─── Role-specific ATS keyword banks ───────────────────────────────────────
const ROLE_KEYWORDS = {
  'Fullstack Cloud Engineer': [
    'react', 'node.js', 'express', 'mongodb', 'docker', 'azure', 'rest api',
    'git', 'sql', 'ci/cd', 'typescript', 'microservices', 'kubernetes',
    'redis', 'graphql', 'aws', 'postgresql', 'jest', 'webpack', 'nginx'
  ],
  'Frontend Developer': [
    'react', 'vue', 'angular', 'typescript', 'css', 'webpack', 'jest',
    'accessibility', 'responsive design', 'html5', 'sass', 'redux',
    'next.js', 'performance', 'ui/ux', 'tailwind', 'figma', 'rest api',
    'web vitals', 'progressive web app'
  ],
  'Backend Developer': [
    'node.js', 'python', 'java', 'sql', 'postgresql', 'redis', 'docker',
    'rest api', 'graphql', 'microservices', 'authentication', 'caching',
    'message queue', 'orm', 'unit testing', 'express', 'spring boot',
    'mongodb', 'kafka', 'rabbitmq', 'api gateway'
  ],
  'Data Scientist': [
    'python', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'machine learning',
    'deep learning', 'sql', 'jupyter', 'matplotlib', 'nlp', 'feature engineering',
    'model deployment', 'statistics', 'pytorch', 'data visualization',
    'regression', 'classification', 'clustering', 'hypothesis testing'
  ],
  'DevOps Engineer': [
    'docker', 'kubernetes', 'terraform', 'ci/cd', 'jenkins', 'ansible',
    'aws', 'azure', 'monitoring', 'prometheus', 'grafana', 'linux', 'bash',
    'helm', 'gitops', 'infrastructure as code', 'pipelines', 'containerization',
    'networking', 'security'
  ],
  'Cloud Architect': [
    'aws', 'azure', 'gcp', 'kubernetes', 'terraform', 'microservices',
    'serverless', 'iam', 'vpc', 'load balancing', 'disaster recovery',
    'multi-cloud', 'cost optimization', 'cloud native', 'api gateway',
    'event-driven', 'data lakes', 'security', 'compliance', 'devops'
  ],
  'Machine Learning Engineer': [
    'python', 'tensorflow', 'pytorch', 'mlflow', 'model serving', 'feature store',
    'a/b testing', 'data pipeline', 'gpu', 'transformer', 'fine-tuning',
    'model optimization', 'embeddings', 'llm', 'rag', 'langchain',
    'scikit-learn', 'hugging face', 'mlops', 'docker'
  ],
  'Software Development Engineer': [
    'data structures', 'algorithms', 'system design', 'object-oriented',
    'design patterns', 'unit testing', 'code review', 'agile', 'git',
    'ci/cd', 'debugging', 'java', 'c++', 'python', 'rest api',
    'multithreading', 'sql', 'microservices', 'problem solving'
  ]
};

// ─── Section header patterns ────────────────────────────────────────────────
const SECTION_PATTERNS = {
  'Summary / Objective': /\b(summary|objective|profile|about me|professional summary)\b/i,
  'Education': /\b(education|academic|university|degree|bachelor|master|b\.tech|b\.e|b\.sc)\b/i,
  'Experience': /\b(experience|work experience|employment|internship|professional experience)\b/i,
  'Skills': /\b(skills|technical skills|technologies|competencies|proficiencies|expertise)\b/i,
  'Projects': /\b(projects|project experience|key projects|academic projects|personal projects)\b/i,
  'Certifications': /\b(certifications?|certificates?|courses?|training|badges)\b/i,
  'Achievements': /\b(achievements?|awards?|honors?|accomplishments?|recognition)\b/i,
  'Languages': /\b(languages?|spoken languages?|programming languages?)\b/i
};

// ─── Action verb list ────────────────────────────────────────────────────────
const ACTION_VERBS = [
  'developed', 'built', 'designed', 'implemented', 'created', 'led', 'managed',
  'optimized', 'improved', 'reduced', 'increased', 'deployed', 'architected',
  'engineered', 'delivered', 'automated', 'integrated', 'launched', 'established',
  'collaborated', 'mentored', 'analyzed', 'researched', 'resolved', 'migrated',
  'refactored', 'scaled', 'coordinated', 'streamlined', 'achieved', 'maintained',
  'configured', 'monitored', 'tested', 'debugged', 'reviewed', 'documented'
];

/**
 * Extract text from PDF or DOCX buffer
 */
const extractTextFromBuffer = async (buffer, mimetype, originalname) => {
  const ext = (originalname || '').toLowerCase();

  if (mimetype === 'application/pdf' || ext.endsWith('.pdf')) {
    try {
      const data = await pdfParse(buffer);
      return data.text || '';
    } catch (e) {
      throw new Error('Failed to parse PDF. Ensure the file is a valid, non-scanned PDF.');
    }
  }

  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext.endsWith('.docx')
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } catch (e) {
      throw new Error('Failed to parse DOCX file.');
    }
  }

  throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
};

/**
 * Detect which resume sections are present
 */
const detectSections = (text) => {
  const found = [];
  for (const [sectionName, pattern] of Object.entries(SECTION_PATTERNS)) {
    if (pattern.test(text)) found.push(sectionName);
  }
  return found;
};

/**
 * Score resume against keyword bank
 */
const scoreKeywords = (text, role) => {
  const keywords = ROLE_KEYWORDS[role] || ROLE_KEYWORDS['Fullstack Cloud Engineer'];
  const lowerText = text.toLowerCase();
  const matched = keywords.filter((kw) => lowerText.includes(kw.toLowerCase()));
  const missing = keywords.filter((kw) => !lowerText.includes(kw.toLowerCase()));
  const score = keywords.length > 0 ? Math.round((matched.length / keywords.length) * 100) : 0;
  return { matched, missing, score };
};

/**
 * Score against a custom job description
 */
const scoreJobDescription = (resumeText, jobDescription) => {
  if (!jobDescription || jobDescription.trim().length < 30) return { jdMatchScore: 0, jdMatched: [], jdMissing: [] };
  const lowerJD = jobDescription.toLowerCase();
  const lowerResume = resumeText.toLowerCase();
  // Extract meaningful words from JD (4+ chars, not common stopwords)
  const stopwords = new Set(['with', 'that', 'this', 'from', 'your', 'will', 'have', 'about', 'into', 'their', 'been', 'what', 'when', 'where', 'which']);
  const jdWords = [...new Set(
    lowerJD.match(/\b[a-z][a-z0-9.+#/-]{2,}\b/g) || []
  )].filter((w) => w.length >= 4 && !stopwords.has(w));

  const jdMatched = jdWords.filter((w) => lowerResume.includes(w));
  const jdMissing = jdWords.filter((w) => !lowerResume.includes(w)).slice(0, 15);
  const jdMatchScore = jdWords.length > 0 ? Math.min(100, Math.round((jdMatched.length / jdWords.length) * 100)) : 0;
  return { jdMatchScore, jdMatched: jdMatched.slice(0, 20), jdMissing };
};

/**
 * Compute full ATS score with weighted breakdown
 */
const computeAtsScore = (text, role, jobDescription) => {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const lowerText = text.toLowerCase();

  // 1. Keywords (40% weight)
  const { matched, missing, score: kwScore } = scoreKeywords(text, role);

  // 2. Section completeness (20% weight)
  const detectedSections = detectSections(text);
  const coreRequiredSections = ['Education', 'Skills', 'Experience', 'Projects'];
  const foundCore = coreRequiredSections.filter((s) =>
    detectedSections.some((d) => d.startsWith(s))
  );
  const sectionScore = Math.round((foundCore.length / coreRequiredSections.length) * 100);

  // 3. Quantification / metrics (15% weight)
  const metricMatches = (text.match(/\d+[\s]*(%|percent|users?|projects?|services?|applications?|systems?|ms|mb|gb|k\b|million|billion|\+)/gi) || []).length;
  const quantScore = Math.min(100, metricMatches * 12);

  // 4. Action verb density (10% weight)
  const verbsFound = ACTION_VERBS.filter((v) => lowerText.includes(v));
  const verbScore = Math.min(100, verbsFound.length * 5);

  // 5. Word count / length (10% weight)
  let lengthScore = 0;
  if (wordCount >= 400 && wordCount <= 900) lengthScore = 100;
  else if (wordCount >= 250) lengthScore = 70;
  else if (wordCount >= 100) lengthScore = 40;
  else lengthScore = 10;

  // Weighted sum (without JD bonus)
  const rawScore = Math.round(
    kwScore * 0.40 +
    sectionScore * 0.20 +
    quantScore * 0.15 +
    verbScore * 0.10 +
    lengthScore * 0.10
  );

  // 6. JD Match bonus (up to +15%)
  const { jdMatchScore, jdMatched, jdMissing } = scoreJobDescription(text, jobDescription);
  const jdBonus = jobDescription && jobDescription.trim().length > 30
    ? Math.round(jdMatchScore * 0.15)
    : 0;

  const finalScore = Math.min(98, Math.max(18, rawScore + jdBonus));

  // Grade
  let grade = 'Needs ATS Optimization';
  if (finalScore >= 82) grade = 'Optimal Candidate Match';
  else if (finalScore >= 65) grade = 'Competitive Candidate Match';
  else if (finalScore >= 45) grade = 'Moderate ATS Compatibility';

  // Generate feedback
  const feedback = [];
  const strengths = [];

  if (kwScore < 50) feedback.push(`Increase role-specific keyword density — add: ${missing.slice(0, 4).join(', ')}.`);
  else strengths.push(`Strong keyword alignment with ${role} job market requirements.`);

  if (sectionScore < 75) feedback.push(`Ensure all standard sections are present: ${coreRequiredSections.filter((s) => !foundCore.includes(s)).join(', ')}.`);
  else strengths.push('Well-structured resume with all core sections detected.');

  if (quantScore < 40) feedback.push('Quantify achievements with numbers, percentages, and impact metrics (e.g. "reduced API latency by 40%").');
  else strengths.push('Good use of quantifiable metrics and measurable impact statements.');

  if (verbScore < 50) feedback.push(`Open bullet points with powerful action verbs: ${['built', 'optimized', 'led', 'deployed', 'architected'].filter((v) => !lowerText.includes(v)).slice(0, 4).join(', ')}.`);

  if (wordCount < 250) feedback.push('Resume content too brief — expand experience descriptions to 300–700 words for ATS parsers.');
  else if (wordCount > 1000) feedback.push('Resume may be too long. ATS parsers prefer concise 1-2 page resumes (400–900 words).');

  if (jdMatchScore > 0 && jdMatchScore < 50 && jobDescription) {
    feedback.push(`Low job description match (${jdMatchScore}%). Tailor your resume to use more JD-specific terminology: ${jdMissing.slice(0, 4).join(', ')}.`);
  }

  feedback.push('Ensure contact info, LinkedIn URL, and GitHub profile are visible at the top of the resume.');
  feedback.push('Use ATS-friendly fonts (Arial, Calibri) and avoid tables, columns, and images that confuse parsers.');

  if (strengths.length === 0) strengths.push('Resume submitted for ATS review — apply the recommendations above to improve your score.');

  return {
    atsScore: finalScore,
    grade,
    matched,
    missing,
    detectedSections,
    wordCount,
    sectionScores: {
      keywords: kwScore,
      sections: sectionScore,
      quantification: quantScore,
      actionVerbs: verbScore,
      length: lengthScore
    },
    jdMatchScore,
    jdMatched,
    jdMissing,
    feedback,
    strengths
  };
};

/**
 * Get all placement drives from MongoDB
 */
export const getPlacements = async (req, res, next) => {
  try {
    let placements = await Placement.find().sort({ packageLPA: -1 });

    if (placements.length === 0) {
      const initialDrives = [
        {
          companyName: 'Microsoft Corporation',
          tier: 'Tier-1 (Super Dream)',
          roleTitle: 'Software Development Engineer I',
          packageLPA: 45.0,
          minCgpa: 8.5,
          maxBacklogsAllowed: 0,
          eligibleDepartments: ['Computer Science', 'Information Technology', 'Electronics'],
          requiredSkills: ['Data Structures & Algorithms', 'System Design', 'C++/Java/Python'],
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          openPositions: 5
        },
        {
          companyName: 'Amazon Web Services (AWS)',
          tier: 'Tier-1 (Super Dream)',
          roleTitle: 'Cloud Support / DevOps Associate',
          packageLPA: 32.5,
          minCgpa: 8.0,
          maxBacklogsAllowed: 0,
          eligibleDepartments: ['Computer Science', 'Information Technology'],
          requiredSkills: ['Linux', 'Docker', 'Networking', 'Distributed Systems'],
          deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
          openPositions: 8
        },
        {
          companyName: 'Deloitte Digital',
          tier: 'Tier-2 (Dream)',
          roleTitle: 'Technology Consultant',
          packageLPA: 14.0,
          minCgpa: 7.0,
          maxBacklogsAllowed: 1,
          eligibleDepartments: ['All Engineering Branches'],
          requiredSkills: ['SQL', 'Business Analysis', 'Cloud Computing', 'Python'],
          deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
          openPositions: 15
        },
        {
          companyName: 'Cognizant Technology',
          tier: 'Service',
          roleTitle: 'Programmer Analyst Trainee',
          packageLPA: 7.5,
          minCgpa: 6.5,
          maxBacklogsAllowed: 2,
          eligibleDepartments: ['All Engineering Branches'],
          requiredSkills: ['Java/C#', 'Web Fundamentals', 'Database Basics'],
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          openPositions: 30
        }
      ];
      placements = await Placement.insertMany(initialDrives);
    }

    res.status(200).json({ success: true, data: placements });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new placement drive (Faculty / Admin only)
 */
export const createPlacement = async (req, res, next) => {
  try {
    const placement = await Placement.create(req.body);
    res.status(201).json({ success: true, message: 'Placement drive published successfully.', data: placement });
  } catch (error) {
    next(error);
  }
};

/**
 * Placement Eligibility Checker querying live MongoDB Placements and Student records
 */
export const checkPlacementEligibility = async (req, res, next) => {
  try {
    let studentCgpa = req.body.cgpa !== undefined ? Number(req.body.cgpa) : 8.65;
    let studentBacklogs = req.body.backlogs !== undefined ? Number(req.body.backlogs) : 0;
    let studentDepartment = req.body.department || 'Computer Science';

    if (req.user) {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        if (student.cgpa) studentCgpa = student.cgpa <= 4.0 ? Number((student.cgpa * 2.5).toFixed(2)) : student.cgpa;
        if (student.department) studentDepartment = student.department;
      }
    }

    let placements = await Placement.find().sort({ packageLPA: -1 });

    if (placements.length === 0) {
      const initialDrives = [
        { companyName: 'Microsoft Corporation', tier: 'Tier-1 (Super Dream)', roleTitle: 'Software Development Engineer I', packageLPA: 45.0, minCgpa: 8.5, maxBacklogsAllowed: 0, eligibleDepartments: ['Computer Science', 'Information Technology', 'Electronics'], requiredSkills: ['Data Structures & Algorithms', 'System Design', 'C++/Java/Python'], deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), openPositions: 5 },
        { companyName: 'Amazon Web Services (AWS)', tier: 'Tier-1 (Super Dream)', roleTitle: 'Cloud Support / DevOps Associate', packageLPA: 32.5, minCgpa: 8.0, maxBacklogsAllowed: 0, eligibleDepartments: ['Computer Science', 'Information Technology'], requiredSkills: ['Linux', 'Docker', 'Networking', 'Distributed Systems'], deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), openPositions: 8 },
        { companyName: 'Deloitte Digital', tier: 'Tier-2 (Dream)', roleTitle: 'Technology Consultant', packageLPA: 14.0, minCgpa: 7.0, maxBacklogsAllowed: 1, eligibleDepartments: ['All Engineering Branches'], requiredSkills: ['SQL', 'Business Analysis', 'Cloud Computing', 'Python'], deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), openPositions: 15 },
        { companyName: 'Cognizant Technology', tier: 'Service', roleTitle: 'Programmer Analyst Trainee', packageLPA: 7.5, minCgpa: 6.5, maxBacklogsAllowed: 2, eligibleDepartments: ['All Engineering Branches'], requiredSkills: ['Java/C#', 'Web Fundamentals', 'Database Basics'], deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), openPositions: 30 }
      ];
      placements = await Placement.insertMany(initialDrives);
    }

    const results = placements.map((p) => {
      const isCgpaEligible = studentCgpa >= (p.minCgpa || 0);
      const isBacklogEligible = studentBacklogs <= (p.maxBacklogsAllowed ?? 0);
      const isEligible = isCgpaEligible && isBacklogEligible;
      let reason = 'Eligible for placement drive.';
      if (!isCgpaEligible) reason = `Requires minimum CGPA of ${p.minCgpa} (current: ${studentCgpa}).`;
      else if (!isBacklogEligible) reason = `Max backlogs allowed is ${p.maxBacklogsAllowed} (current: ${studentBacklogs}).`;
      return {
        id: p._id, name: p.companyName, tier: p.tier, role: p.roleTitle,
        packageLPA: p.packageLPA, minCgpa: p.minCgpa, maxBacklogs: p.maxBacklogsAllowed,
        eligibleDepartments: p.eligibleDepartments, requiredSkills: p.requiredSkills,
        deadline: p.deadline, openPositions: p.openPositions, isEligible, statusReason: reason
      };
    });

    const eligibleCount = results.filter((c) => c.isEligible).length;
    res.status(200).json({
      success: true,
      data: {
        studentMetrics: { cgpa: studentCgpa, backlogs: studentBacklogs, department: studentDepartment },
        totalDrives: results.length,
        eligibleCount,
        eligibilityPercentage: results.length > 0 ? Math.round((eligibleCount / results.length) * 100) : 0,
        companies: results
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ─── NEW: Upload PDF/DOCX resume, extract text, run full ATS analysis ────────
 * POST /api/v1/career/upload-resume
 * Body: multipart/form-data { resume: File, targetRole: string, jobDescription: string }
 */
export const uploadAndAnalyzeResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No resume file uploaded. Please upload a PDF or DOCX file.' });
    }

    const { targetRole = 'Fullstack Cloud Engineer', jobDescription = '' } = req.body;

    // Extract text
    const extractedText = await extractTextFromBuffer(req.file.buffer, req.file.mimetype, req.file.originalname);

    if (!extractedText || extractedText.trim().length < 30) {
      return res.status(422).json({ success: false, message: 'Could not extract meaningful text from the uploaded file. Please ensure it is a text-based (non-scanned) PDF or DOCX.' });
    }

    // Run ATS analysis
    const analysis = computeAtsScore(extractedText, targetRole, jobDescription);

    // Build analysis record
    const analysisRecord = {
      originalFileName: req.file.originalname,
      uploadedAt: new Date(),
      targetRole,
      jobDescription: jobDescription.substring(0, 2000),
      extractedTextSnippet: extractedText.substring(0, 500),
      wordCount: analysis.wordCount,
      detectedSections: analysis.detectedSections,
      atsScore: analysis.atsScore,
      jdMatchScore: analysis.jdMatchScore,
      grade: analysis.grade,
      matchedKeywords: analysis.matched,
      missingKeywords: analysis.missing,
      jdMatchedKeywords: analysis.jdMatched || [],
      jdMissingKeywords: analysis.jdMissing || [],
      sectionScores: analysis.sectionScores,
      feedback: analysis.feedback,
      strengths: analysis.strengths
    };

    // Persist to MongoDB if authenticated
    let savedAnalysisId = null;
    if (req.user) {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        const profile = await CareerProfile.findOneAndUpdate(
          { student: student._id },
          {
            targetDomain: targetRole,
            atsScore: analysis.atsScore,
            resumeKeywordsMatched: analysis.matched,
            missingKeywords: analysis.missing,
            resumeFeedback: analysis.feedback,
            $push: { resumeAnalyses: { $each: [analysisRecord], $position: 0 } }
          },
          { upsert: true, new: true }
        );
        savedAnalysisId = profile.resumeAnalyses?.[0]?._id;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        analysisId: savedAnalysisId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        targetRole,
        wordCount: analysis.wordCount,
        detectedSections: analysis.detectedSections,
        atsScore: analysis.atsScore,
        jdMatchScore: analysis.jdMatchScore,
        grade: analysis.grade,
        matchedKeywords: analysis.matched,
        missingKeywords: analysis.missing,
        jdMatchedKeywords: analysis.jdMatched || [],
        jdMissingKeywords: analysis.jdMissing || [],
        sectionScores: analysis.sectionScores,
        feedback: analysis.feedback,
        strengths: analysis.strengths,
        hasJobDescription: jobDescription.trim().length > 30
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ─── NEW: Get resume analysis history for authenticated student ───────────────
 * GET /api/v1/career/resume-history
 */
export const getResumeHistory = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });

    const profile = await CareerProfile.findOne({ student: student._id });
    if (!profile || !profile.resumeAnalyses || profile.resumeAnalyses.length === 0) {
      return res.status(200).json({ success: true, data: { analyses: [], totalAnalyses: 0 } });
    }

    const summaries = profile.resumeAnalyses.map((a) => ({
      id: a._id,
      fileName: a.originalFileName,
      uploadedAt: a.uploadedAt,
      targetRole: a.targetRole,
      atsScore: a.atsScore,
      jdMatchScore: a.jdMatchScore,
      grade: a.grade,
      wordCount: a.wordCount,
      detectedSections: a.detectedSections,
      matchedKeywords: a.matchedKeywords,
      missingKeywords: a.missingKeywords,
      sectionScores: a.sectionScores,
      feedback: a.feedback,
      strengths: a.strengths,
      hasJobDescription: !!(a.jobDescription && a.jobDescription.trim().length > 10)
    }));

    res.status(200).json({ success: true, data: { analyses: summaries, totalAnalyses: summaries.length } });
  } catch (err) {
    next(err);
  }
};

/**
 * ─── NEW: Generate downloadable HTML report for a specific analysis ───────────
 * GET /api/v1/career/resume-report/:analysisId
 */
export const generateResumeReport = async (req, res, next) => {
  try {
    const { analysisId } = req.params;
    let analysis = null;
    let student = null;

    if (req.user) {
      student = await Student.findOne({ userId: req.user._id }).populate('userId', 'firstName lastName email');
      if (student) {
        const profile = await CareerProfile.findOne({ student: student._id });
        if (profile) {
          analysis = profile.resumeAnalyses.id(analysisId);
        }
      }
    }

    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Analysis report not found.' });
    }

    const studentName = student?.userId ? `${student.userId.firstName} ${student.userId.lastName}` : 'Student';
    const uploadDate = new Date(analysis.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const scoreColor = analysis.atsScore >= 82 ? '#10b981' : analysis.atsScore >= 65 ? '#3b82f6' : '#f59e0b';
    const sectionRows = Object.entries(analysis.sectionScores || {}).map(([k, v]) =>
      `<tr><td>${k.charAt(0).toUpperCase() + k.slice(1)}</td><td><div style="background:#1e293b;border-radius:4px;height:10px;width:100%"><div style="background:${scoreColor};border-radius:4px;height:10px;width:${v}%"></div></div></td><td style="text-align:right;font-weight:700">${v}%</td></tr>`
    ).join('');

    const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ATS Resume Analysis Report — ${studentName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem; }
  .header { background: linear-gradient(135deg, #1e3a8a 0%, #4f46e5 100%); padding: 2rem; border-radius: 12px; margin-bottom: 2rem; }
  .header h1 { font-size: 1.8rem; color: #fff; margin-bottom: 0.25rem; }
  .header p { color: rgba(255,255,255,0.75); font-size: 0.9rem; }
  .score-section { display: flex; gap: 1.5rem; margin-bottom: 2rem; flex-wrap: wrap; }
  .score-card { background: #1e293b; border-radius: 12px; padding: 1.5rem; flex: 1; min-width: 160px; border: 1px solid #334155; text-align: center; }
  .score-big { font-size: 3rem; font-weight: 800; color: ${scoreColor}; line-height: 1; }
  .score-label { font-size: 0.8rem; color: #94a3b8; margin-top: 0.25rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .grade-badge { display: inline-block; padding: 0.35rem 0.85rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700; background: ${analysis.atsScore >= 82 ? 'rgba(16,185,129,0.2)' : analysis.atsScore >= 65 ? 'rgba(59,130,246,0.2)' : 'rgba(245,158,11,0.2)'}; color: ${scoreColor}; border: 1px solid ${scoreColor}40; margin-top: 0.5rem; }
  section { background: #1e293b; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid #334155; }
  section h2 { font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; color: #f8fafc; border-bottom: 1px solid #334155; padding-bottom: 0.75rem; }
  .chip { display: inline-block; padding: 0.25rem 0.65rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; margin: 0.2rem; }
  .chip-green { background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
  .chip-red { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
  .chip-blue { background: rgba(59,130,246,0.15); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 0.65rem 0; font-size: 0.88rem; vertical-align: middle; }
  td:first-child { color: #94a3b8; width: 160px; }
  td:last-child { width: 60px; font-size: 0.85rem; }
  ul { list-style: none; }
  ul li { padding: 0.5rem 0; font-size: 0.9rem; border-bottom: 1px solid #1e293b; color: #cbd5e1; display: flex; gap: 0.5rem; }
  ul li::before { content: '→'; color: ${scoreColor}; font-weight: 700; flex-shrink: 0; }
  .section-badge { display: inline-block; padding: 0.25rem 0.65rem; border-radius: 6px; font-size: 0.8rem; margin: 0.2rem; background: rgba(99,102,241,0.15); color: #818cf8; border: 1px solid rgba(99,102,241,0.3); }
  .footer { text-align: center; color: #475569; font-size: 0.8rem; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #1e293b; }
  @media print { body { background: #fff; color: #1e293b; } .score-card, section { background: #f8fafc; border-color: #e2e8f0; } }
</style>
</head>
<body>
<div class="header">
  <h1>📊 ATS Resume Analysis Report</h1>
  <p><strong>${studentName}</strong> &nbsp;|&nbsp; ${uploadDate} &nbsp;|&nbsp; ${analysis.originalFileName} &nbsp;|&nbsp; Target: ${analysis.targetRole}</p>
</div>

<div class="score-section">
  <div class="score-card">
    <div class="score-big">${analysis.atsScore}</div>
    <div class="score-label">ATS Score / 100</div>
    <div class="grade-badge">${analysis.grade}</div>
  </div>
  ${analysis.jdMatchScore > 0 ? `
  <div class="score-card">
    <div class="score-big" style="color:#6366f1">${analysis.jdMatchScore}%</div>
    <div class="score-label">JD Match Score</div>
    <div class="grade-badge" style="background:rgba(99,102,241,0.2);color:#6366f1;border-color:#6366f140">Job Description Alignment</div>
  </div>` : ''}
  <div class="score-card">
    <div class="score-big" style="color:#f8fafc;font-size:2rem">${analysis.wordCount}</div>
    <div class="score-label">Word Count</div>
    <div class="grade-badge" style="background:rgba(148,163,184,0.15);color:#94a3b8;border-color:#94a3b840">${analysis.wordCount >= 250 && analysis.wordCount <= 900 ? '✓ Optimal Length' : analysis.wordCount < 250 ? 'Too Short' : 'Too Long'}</div>
  </div>
  <div class="score-card">
    <div class="score-big" style="color:#f8fafc;font-size:1.5rem">${(analysis.detectedSections || []).length}</div>
    <div class="score-label">Sections Detected</div>
    <div class="grade-badge" style="background:rgba(148,163,184,0.15);color:#94a3b8;border-color:#94a3b840">${(analysis.detectedSections || []).length >= 4 ? '✓ Well Structured' : 'Add More Sections'}</div>
  </div>
</div>

<section>
  <h2>📐 Score Breakdown</h2>
  <table>${sectionRows}</table>
</section>

<section>
  <h2>📋 Detected Sections</h2>
  <div>${(analysis.detectedSections || []).map((s) => `<span class="section-badge">${s}</span>`).join('') || '<p style="color:#64748b">No standard sections detected. Add clearly labeled section headers.</p>'}</div>
</section>

<section>
  <h2>✅ Matched Keywords (${(analysis.matchedKeywords || []).length})</h2>
  <div>${(analysis.matchedKeywords || []).map((kw) => `<span class="chip chip-green">✓ ${kw}</span>`).join('') || '<p style="color:#64748b">No role-specific keywords detected.</p>'}</div>
</section>

<section>
  <h2>❌ Missing Keywords (${(analysis.missingKeywords || []).length})</h2>
  <div>${(analysis.missingKeywords || []).map((kw) => `<span class="chip chip-red">✗ ${kw}</span>`).join('') || '<p style="color:#10b981">✓ All role keywords are present!</p>'}</div>
</section>

${analysis.jdMatchScore > 0 ? `
<section>
  <h2>🎯 Job Description Match — Top Keywords</h2>
  <p style="font-size:0.85rem;color:#94a3b8;margin-bottom:0.75rem">Keywords found in JD that are present/missing in your resume:</p>
  <div>${(analysis.jdMatchedKeywords || []).slice(0, 15).map((kw) => `<span class="chip chip-green">✓ ${kw}</span>`).join('')}</div>
  ${(analysis.jdMissingKeywords || []).length > 0 ? `<div style="margin-top:0.75rem">${(analysis.jdMissingKeywords || []).slice(0, 15).map((kw) => `<span class="chip chip-red">✗ ${kw}</span>`).join('')}</div>` : ''}
</section>` : ''}

<section>
  <h2>💪 Strengths</h2>
  <ul>${(analysis.strengths || []).map((s) => `<li>${s}</li>`).join('')}</ul>
</section>

<section>
  <h2>🔧 Actionable Recommendations</h2>
  <ul>${(analysis.feedback || []).map((f) => `<li>${f}</li>`).join('')}</ul>
</section>

<div class="footer">
  <p>Generated by UniAssist AI · ATS Resume Analyzer · ${new Date().toLocaleString('en-IN')}</p>
  <p style="margin-top:0.25rem">This report is based on algorithmic keyword analysis. Human review is always recommended.</p>
</div>
</body>
</html>`;

    res.status(200).json({
      success: true,
      data: {
        reportHtml,
        studentName,
        uploadDate,
        targetRole: analysis.targetRole,
        atsScore: analysis.atsScore,
        fileName: analysis.originalFileName
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Legacy text-based ATS analyzer (kept for backward compatibility)
 */
export const analyzeResume = async (req, res, next) => {
  try {
    const { resumeText = '', targetRole = 'Fullstack Cloud Engineer', jobDescription = '' } = req.body;
    if (!resumeText.trim()) return res.status(400).json({ success: false, message: 'Resume text is required.' });

    const analysis = computeAtsScore(resumeText, targetRole, jobDescription);

    if (req.user) {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        await CareerProfile.findOneAndUpdate(
          { student: student._id },
          { targetDomain: targetRole, atsScore: analysis.atsScore, resumeKeywordsMatched: analysis.matched, missingKeywords: analysis.missing, resumeFeedback: analysis.feedback },
          { upsert: true, new: true }
        );
      }
    }

    res.status(200).json({
      success: true,
      data: {
        targetRole,
        atsScore: analysis.atsScore,
        grade: analysis.grade,
        matchedKeywords: analysis.matched,
        missingKeywords: analysis.missing,
        feedback: analysis.feedback
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * AI Career Counselor
 */
export const getCareerCounseling = async (req, res, next) => {
  try {
    const { primaryInterest = 'Cloud & AI Architecture', semester = 5 } = req.body;
    const careerProfiles = {
      'Cloud & AI Architecture': {
        title: 'Cloud & AI Solutions Architect',
        expectedStartingSalary: '$95,000 - $135,000 / ₹18 - ₹30 LPA',
        growthOutlook: '32% Projected 5-Year Growth (Very High)',
        keyCompetencies: ['Azure AI Foundry', 'Kubernetes & Docker', 'Terraform', 'Distributed Systems'],
        certificationsRecommended: ['Microsoft Certified: Azure Solutions Architect Expert', 'AWS Certified Solutions Architect – Associate', 'HashiCorp Certified: Terraform Associate'],
        nextElectives: ['CS-402 Advanced Cloud Systems', 'CS-408 Deep Learning & LLMs'],
        milestones: [
          { phase: 'Semester 5 (Current)', goal: 'Master container orchestration & build production RAG chatbot' },
          { phase: 'Semester 6', goal: 'Complete cloud certification & secure summer internship' },
          { phase: 'Semester 7-8', goal: 'Publish capstone system & target Tier-1 on-campus drives' }
        ]
      }
    };
    const counselorData = careerProfiles[primaryInterest] || careerProfiles['Cloud & AI Architecture'];
    res.status(200).json({ success: true, data: counselorData });
  } catch (err) {
    next(err);
  }
};

/**
 * AI Mock Interview Simulator
 */
export const simulateInterview = async (req, res, next) => {
  try {
    const { role = 'Fullstack Engineer', questionId = 1, answerText = '' } = req.body;
    const questions = [
      { id: 1, question: 'Explain how React Virtual DOM diffing algorithm minimizes layout reflows and improves performance.', category: 'Frontend Engineering' },
      { id: 2, question: 'How do you structure database indexing in MongoDB to optimize queries with multiple filter keys?', category: 'Backend Architecture' },
      { id: 3, question: 'Describe a situation where an assignment deliverable had ambiguous requirements. How did you resolve it?', category: 'Behavioral / Teamwork' }
    ];
    const currentQ = questions.find((q) => q.id === Number(questionId)) || questions[0];

    let feedbackScore = 80;
    let feedbackNotes = 'Solid understanding articulated with clear technical terminology.';
    if (answerText.trim().length < 40) {
      feedbackScore = 45;
      feedbackNotes = 'Answer is too brief. Elaborate with specific architectural mechanisms or real-world project context.';
    } else if (answerText.toLowerCase().includes('reconciliation') || answerText.toLowerCase().includes('virtual dom') || answerText.toLowerCase().includes('compound index')) {
      feedbackScore = 95;
      feedbackNotes = 'Exceptional depth. Accurate terminology and strong comprehension demonstrated.';
    }

    if (req.user) {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        await CareerProfile.findOneAndUpdate(
          { student: student._id },
          { $push: { interviewSimulations: { sessionDate: new Date(), roleTitle: role, difficulty: 'Junior', score: feedbackScore, strengths: ['Relevant conceptual alignment', 'Clear structure'], improvements: ['Include production trade-offs'], qaTranscript: [{ question: currentQ.question, answer: answerText, feedback: feedbackNotes, rating: feedbackScore }] } } },
          { upsert: true }
        );
      }
    }

    res.status(200).json({
      success: true,
      data: { question: currentQ, evaluatedAnswer: answerText, score: feedbackScore, notes: feedbackNotes, strengths: ['Relevant conceptual alignment', 'Clear structure'], improvement: 'Include a brief real-world production tradeoff to elevate to Senior rating.' }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ─── Register student for a placement drive ──────────────────────────────────
 * POST /api/v1/career/placements/:id/register
 */
export const registerForPlacement = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'You must be logged in to register for a placement drive.' });

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found. Please complete your profile first.' });

    const placement = await Placement.findById(req.params.id);
    if (!placement) return res.status(404).json({ success: false, message: 'Placement drive not found.' });

    // Eligibility check
    const studentCgpa = student.cgpa <= 4.0 ? Number((student.cgpa * 2.5).toFixed(2)) : student.cgpa;
    if (studentCgpa < (placement.minCgpa || 0)) {
      return res.status(403).json({
        success: false,
        message: `Your CGPA (${studentCgpa}) does not meet the minimum required CGPA of ${placement.minCgpa} for this drive.`
      });
    }

    // Duplicate check — let DB unique index handle it gracefully
    const existing = await PlacementRegistration.findOne({ student: student._id, placement: placement._id });
    if (existing) {
      return res.status(409).json({
        success: false,
        alreadyRegistered: true,
        message: `You are already registered for ${placement.companyName}. You cannot register again.`,
        data: {
          registrationId: existing._id,
          registeredAt: existing.registeredAt,
          status: existing.status
        }
      });
    }

    // Create registration
    const registration = await PlacementRegistration.create({
      student: student._id,
      placement: placement._id,
      cgpaAtRegistration: studentCgpa,
      status: 'registered'
    });

    res.status(201).json({
      success: true,
      message: `Successfully registered for ${placement.companyName}! You will receive further updates via email.`,
      data: {
        registrationId: registration._id,
        companyName: placement.companyName,
        roleTitle: placement.roleTitle,
        packageLPA: placement.packageLPA,
        registeredAt: registration.registeredAt,
        status: registration.status
      }
    });
  } catch (err) {
    // Handle MongoDB duplicate key error (code 11000) as fallback
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        alreadyRegistered: true,
        message: 'You are already registered for this placement drive.'
      });
    }
    next(err);
  }
};

/**
 * ─── Get all placement registrations for the logged-in student ───────────────
 * GET /api/v1/career/my-registrations
 */
export const getMyRegistrations = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(200).json({ success: true, data: { registrations: [], registeredIds: [] } });

    const registrations = await PlacementRegistration
      .find({ student: student._id })
      .populate('placement', 'companyName roleTitle packageLPA tier deadline minCgpa')
      .sort({ registeredAt: -1 })
      .lean();

    const registeredIds = registrations.map((r) => r.placement?._id?.toString()).filter(Boolean);

    res.status(200).json({
      success: true,
      data: {
        registrations: registrations.map((r) => ({
          registrationId: r._id,
          placementId: r.placement?._id,
          companyName: r.placement?.companyName,
          roleTitle: r.placement?.roleTitle,
          packageLPA: r.placement?.packageLPA,
          tier: r.placement?.tier,
          deadline: r.placement?.deadline,
          registeredAt: r.registeredAt,
          status: r.status,
          cgpaAtRegistration: r.cgpaAtRegistration
        })),
        registeredIds,
        totalRegistrations: registrations.length
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ─── Cancel / withdraw placement registration ─────────────────────────────────
 * DELETE /api/v1/career/placements/:id/register
 */
export const cancelRegistration = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });

    const registration = await PlacementRegistration.findOneAndDelete({
      student: student._id,
      placement: req.params.id
    });

    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found.' });

    res.status(200).json({ success: true, message: 'Registration cancelled successfully.' });
  } catch (err) {
    next(err);
  }
};
