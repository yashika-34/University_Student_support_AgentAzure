import crypto from 'crypto';
import Placement from '../models/Placement.js';
import PlacementRegistration from '../models/PlacementRegistration.js';
import CareerProfile from '../models/CareerProfile.js';
import CareerCounselingChat from '../models/CareerCounselingChat.js';
import Student from '../models/Student.js';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import { AzureOpenAI } from 'openai';
import { getEffectiveAzureConfig } from '../services/azureAiService.js';


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
      console.error('[pdfParse error]:', e);
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
 * ─── Run Azure OpenAI GPT-4.1-mini ATS Evaluation ────────────────────────────
 */
const runAzureOpenAiAtsAnalysis = async (resumeText, targetRole, jobDescription = '') => {
  const azureConfig = getEffectiveAzureConfig();

  // Fallback to rule engine if credentials are not configured or mock
  if (!azureConfig.isConfigured) {
    const fallback = computeAtsScore(resumeText, targetRole, jobDescription);
    return {
      atsScore: fallback.atsScore,
      grade: fallback.grade,
      resumeSummary: `Resume evaluated for ${targetRole} with ${fallback.wordCount} words across ${(fallback.detectedSections || []).length} recognized sections.`,
      skillsDetected: fallback.matched || [],
      missingSkills: fallback.missing || [],
      keywordMatchAnalysis: {
        matchPercentage: fallback.sectionScores?.keywords ? Math.round((fallback.sectionScores.keywords / 40) * 100) : 65,
        matchedKeywords: fallback.matched || [],
        missingKeywords: fallback.missing || [],
        suggestedKeywords: fallback.missing?.slice(0, 5) || []
      },
      experienceAnalysis: {
        rating: fallback.sectionScores?.actionVerbs > 6 ? 'Strong' : 'Moderate',
        feedback: 'Experience contains technical phrasing. Ensure each bullet point contains quantifiable metric outcomes.',
        strengths: fallback.strengths || [],
        improvements: ['Include more metrics (e.g. % improved, ms reduced, users impacted)']
      },
      educationAnalysis: {
        rating: fallback.detectedSections?.includes('education') ? 'Strong' : 'Needs Optimization',
        feedback: 'Education credentials identified. Include coursework and cumulative GPA.'
      },
      sectionFeedback: {
        contactInfo: { score: 90, status: 'Complete', feedback: 'Contact information present.' },
        summary: { score: fallback.detectedSections?.includes('summary') ? 85 : 50, status: fallback.detectedSections?.includes('summary') ? 'Present' : 'Missing', feedback: 'Include a 2-3 line summary tailored to ' + targetRole },
        skills: { score: fallback.matched?.length > 6 ? 90 : 65, status: 'Evaluated', feedback: `Detected ${fallback.matched?.length || 0} core technical skills.` },
        projects: { score: fallback.detectedSections?.includes('projects') ? 85 : 60, status: 'Evaluated', feedback: 'Highlight architecture, tools, and live deployment links.' },
        experience: { score: fallback.sectionScores?.actionVerbs || 70, status: 'Evaluated', feedback: 'Ensure action verbs begin every bullet point.' },
        education: { score: 90, status: 'Complete', feedback: 'Degree and university details formatted.' }
      },
      strengths: fallback.strengths || ['Good overall structure', 'Relevant domain keywords present'],
      weaknesses: fallback.feedback || ['Add quantifiable metrics', 'Include missing target keywords'],
      improvementSuggestions: fallback.feedback || ['Add missing core keywords', 'Emphasize cloud technologies'],
      careerRecommendations: {
        recommendedRoles: [targetRole, 'Cloud Solutions Associate', 'Software Development Engineer'],
        recommendedCertifications: ['Microsoft Certified: Azure Fundamentals (AZ-900)', 'AWS Certified Cloud Practitioner'],
        actionPlan: ['Align resume bullets with job posting requirements', 'Build a production cloud capstone project']
      },
      jobDescriptionComparison: {
        hasJd: Boolean(jobDescription && jobDescription.trim().length > 30),
        matchScore: fallback.jdMatchScore || 0,
        alignmentSummary: jobDescription ? 'Evaluated against custom job description.' : 'Evaluated against industry benchmarks.',
        matchedRequirements: fallback.jdMatched || [],
        missingRequirements: fallback.jdMissing || []
      },
      wordCount: fallback.wordCount,
      detectedSections: fallback.detectedSections,
      analyzedBy: 'UniAssist Rule Engine'
    };
  }

  const client = new AzureOpenAI({
    endpoint: azureConfig.endpoint,
    apiKey: azureConfig.apiKey,
    apiVersion: azureConfig.apiVersion,
    deployment: azureConfig.primaryDeployment
  });

  const systemPrompt = `You are a principal technical recruiter and expert ATS (Applicant Tracking System) optimization engine.
Analyze candidate resumes objectively against target industry roles and job descriptions.
Return ONLY valid raw JSON adhering strictly to the schema below.
Rules:
1. Do NOT wrap output in markdown code fences (no \`\`\`json or \`\`\`).
2. Provide constructive, precise feedback and high-impact keyword recommendations.
3. Every required field must be populated with meaningful content.`;

  const userPrompt = `Target Job Role: "${targetRole}"
${jobDescription && jobDescription.trim().length > 20 ? `Job Description: """${jobDescription.substring(0, 3000)}"""` : 'No specific Job Description provided. Evaluate against top industry benchmarks for this role.'}

Candidate Resume Text:
"""
${resumeText.substring(0, 8000)}
"""

JSON Schema:
{
  "atsScore": 85,
  "grade": "Strong Match",
  "resumeSummary": "Executive professional summary of candidate...",
  "skillsDetected": ["skill1", "skill2"],
  "missingSkills": ["skill3", "skill4"],
  "keywordMatchAnalysis": {
    "matchPercentage": 82,
    "matchedKeywords": ["kw1", "kw2"],
    "missingKeywords": ["kw3", "kw4"],
    "suggestedKeywords": ["suggestedKw1", "suggestedKw2"]
  },
  "experienceAnalysis": {
    "rating": "Strong",
    "feedback": "Detailed assessment of work, internships, leadership, and metrics...",
    "strengths": ["Clear metrics provided", "Action-driven bullets"],
    "improvements": ["Elaborate on production scale"]
  },
  "educationAnalysis": {
    "rating": "Strong",
    "feedback": "Assessment of degree, GPA, coursework relevance..."
  },
  "sectionFeedback": {
    "contactInfo": { "score": 95, "status": "Complete", "feedback": "..." },
    "summary": { "score": 75, "status": "Present", "feedback": "..." },
    "skills": { "score": 88, "status": "Strong", "feedback": "..." },
    "projects": { "score": 85, "status": "Strong", "feedback": "..." },
    "experience": { "score": 82, "status": "Good", "feedback": "..." },
    "education": { "score": 90, "status": "Complete", "feedback": "..." }
  },
  "strengths": [
    "Strength 1...",
    "Strength 2...",
    "Strength 3..."
  ],
  "weaknesses": [
    "Weakness 1...",
    "Weakness 2...",
    "Weakness 3..."
  ],
  "improvementSuggestions": [
    "Actionable suggestion 1...",
    "Actionable suggestion 2...",
    "Actionable suggestion 3...",
    "Actionable suggestion 4..."
  ],
  "careerRecommendations": {
    "recommendedRoles": ["Role 1", "Role 2", "Role 3"],
    "recommendedCertifications": ["Cert 1", "Cert 2"],
    "actionPlan": ["Step 1", "Step 2", "Step 3"]
  },
  "jobDescriptionComparison": {
    "hasJd": ${Boolean(jobDescription && jobDescription.trim().length > 30)},
    "matchScore": 75,
    "alignmentSummary": "Summary of alignment with the target role...",
    "matchedRequirements": ["Req 1", "Req 2"],
    "missingRequirements": ["Req 3", "Req 4"]
  }
}`;

  let parsed = null;
  let lastErr = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: attempt === 1 ? 0.3 : 0.1,
        max_tokens: 3500
      });

      let content = response.choices[0]?.message?.content?.trim() || '';
      if (content.startsWith('```')) {
        content = content.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
      }

      parsed = JSON.parse(content);
      if (parsed && typeof parsed.atsScore === 'number') {
        break;
      }
    } catch (err) {
      lastErr = err;
      console.warn(`[Azure ATS Analyzer] Attempt ${attempt} failed:`, err.message);
    }
  }

  if (!parsed || typeof parsed.atsScore !== 'number') {
    console.warn('[Azure ATS Analyzer] AI parsing failed, falling back to rule engine:', lastErr?.message);
    return computeAtsScore(resumeText, targetRole, jobDescription);
  }

  // Enrich with basic text metrics
  parsed.wordCount = (resumeText.match(/\S+/g) || []).length;
  parsed.detectedSections = detectSections(resumeText);
  parsed.analyzedBy = `Azure OpenAI (${process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4.1-mini'})`;

  return parsed;
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

    // Extract text from buffer (pdfParse or mammoth)
    const extractedText = await extractTextFromBuffer(req.file.buffer, req.file.mimetype, req.file.originalname);

    if (!extractedText || extractedText.trim().length < 30) {
      return res.status(422).json({ success: false, message: 'Could not extract meaningful text from the uploaded file. Please ensure it is a text-based (non-scanned) PDF or DOCX.' });
    }

    // Run Azure OpenAI GPT-4.1-mini ATS analysis
    const analysis = await runAzureOpenAiAtsAnalysis(extractedText, targetRole, jobDescription);

    // Build analysis record to persist in MongoDB
    const analysisRecord = {
      originalFileName: req.file.originalname,
      uploadedAt: new Date(),
      targetRole,
      jobDescription: jobDescription.substring(0, 3000),
      extractedTextSnippet: extractedText.substring(0, 500),
      wordCount: analysis.wordCount || (extractedText.match(/\S+/g) || []).length,
      detectedSections: analysis.detectedSections || [],
      atsScore: analysis.atsScore,
      grade: analysis.grade,
      resumeSummary: analysis.resumeSummary,
      skillsDetected: analysis.skillsDetected || [],
      missingSkills: analysis.missingSkills || [],
      keywordMatchAnalysis: analysis.keywordMatchAnalysis || {},
      experienceAnalysis: analysis.experienceAnalysis || {},
      educationAnalysis: analysis.educationAnalysis || {},
      sectionFeedback: analysis.sectionFeedback || {},
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      improvementSuggestions: analysis.improvementSuggestions || [],
      careerRecommendations: analysis.careerRecommendations || {},
      jobDescriptionComparison: analysis.jobDescriptionComparison || {},
      analyzedBy: analysis.analyzedBy || 'Azure OpenAI (gpt-4.1-mini)'
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
            resumeKeywordsMatched: analysis.keywordMatchAnalysis?.matchedKeywords || analysis.matchedKeywords || [],
            missingKeywords: analysis.keywordMatchAnalysis?.missingKeywords || analysis.missingKeywords || [],
            resumeFeedback: analysis.improvementSuggestions || analysis.feedback || [],
            $push: { resumeAnalyses: { $each: [analysisRecord], $position: 0 } }
          },
          { upsert: true, new: true }
        );
        savedAnalysisId = profile.resumeAnalyses?.[0]?._id;
      }
    }

    res.status(200).json({
      success: true,
      message: `Resume successfully analyzed with ${analysis.analyzedBy}`,
      data: {
        analysisId: savedAnalysisId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        targetRole,
        extractedTextSnippet: extractedText.substring(0, 200),
        ...analysis,
        // Backward-compatibility aliases
        matchedKeywords: analysis.keywordMatchAnalysis?.matchedKeywords || analysis.matched || [],
        missingKeywords: analysis.keywordMatchAnalysis?.missingKeywords || analysis.missing || [],
        feedback: analysis.improvementSuggestions || analysis.feedback || [],
        jdMatchScore: analysis.jobDescriptionComparison?.matchScore || 0,
        hasJobDescription: Boolean(jobDescription && jobDescription.trim().length > 30)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ─── Get resume analysis history for authenticated student ────────────────────
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
      _id: a._id,
      fileName: a.originalFileName,
      uploadedAt: a.uploadedAt,
      targetRole: a.targetRole,
      atsScore: a.atsScore,
      grade: a.grade,
      resumeSummary: a.resumeSummary,
      skillsDetected: a.skillsDetected,
      missingSkills: a.missingSkills,
      keywordMatchAnalysis: a.keywordMatchAnalysis,
      experienceAnalysis: a.experienceAnalysis,
      educationAnalysis: a.educationAnalysis,
      sectionFeedback: a.sectionFeedback,
      strengths: a.strengths,
      weaknesses: a.weaknesses,
      improvementSuggestions: a.improvementSuggestions,
      careerRecommendations: a.careerRecommendations,
      jobDescriptionComparison: a.jobDescriptionComparison,
      jdMatchScore: a.jobDescriptionComparison?.matchScore || a.jdMatchScore || 0,
      wordCount: a.wordCount,
      analyzedBy: a.analyzedBy,
      hasJobDescription: !!(a.jobDescription && a.jobDescription.trim().length > 10)
    }));

    res.status(200).json({ success: true, data: { analyses: summaries, totalAnalyses: summaries.length } });
  } catch (err) {
    next(err);
  }
};

/**
 * ─── Get Single Past Resume Analysis by ID ─────────────────────────────────────
 * GET /api/v1/career/resume-history/:analysisId
 */
export const getSingleResumeAnalysis = async (req, res, next) => {
  try {
    const { analysisId } = req.params;
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });

    const profile = await CareerProfile.findOne({ student: student._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Career profile not found.' });

    const analysis = profile.resumeAnalyses.id(analysisId);
    if (!analysis) return res.status(404).json({ success: false, message: 'Analysis not found.' });

    res.status(200).json({ success: true, data: analysis });
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

    const analysis = await runAzureOpenAiAtsAnalysis(resumeText, targetRole, jobDescription);

    const analysisRecord = {
      originalFileName: 'Pasted_Resume_Text',
      uploadedAt: new Date(),
      targetRole,
      jobDescription: jobDescription.substring(0, 3000),
      extractedTextSnippet: resumeText.substring(0, 500),
      wordCount: analysis.wordCount || (resumeText.match(/\S+/g) || []).length,
      detectedSections: analysis.detectedSections || [],
      atsScore: analysis.atsScore,
      grade: analysis.grade,
      resumeSummary: analysis.resumeSummary,
      skillsDetected: analysis.skillsDetected || [],
      missingSkills: analysis.missingSkills || [],
      keywordMatchAnalysis: analysis.keywordMatchAnalysis || {},
      experienceAnalysis: analysis.experienceAnalysis || {},
      educationAnalysis: analysis.educationAnalysis || {},
      sectionFeedback: analysis.sectionFeedback || {},
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      improvementSuggestions: analysis.improvementSuggestions || [],
      careerRecommendations: analysis.careerRecommendations || {},
      jobDescriptionComparison: analysis.jobDescriptionComparison || {},
      analyzedBy: analysis.analyzedBy || 'Azure OpenAI (gpt-4.1-mini)'
    };

    let savedAnalysisId = null;
    if (req.user) {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        const profile = await CareerProfile.findOneAndUpdate(
          { student: student._id },
          {
            targetDomain: targetRole,
            atsScore: analysis.atsScore,
            resumeKeywordsMatched: analysis.keywordMatchAnalysis?.matchedKeywords || analysis.matched || [],
            missingKeywords: analysis.keywordMatchAnalysis?.missingKeywords || analysis.missing || [],
            resumeFeedback: analysis.improvementSuggestions || analysis.feedback || [],
            $push: { resumeAnalyses: { $each: [analysisRecord], $position: 0 } }
          },
          { upsert: true, new: true }
        );
        savedAnalysisId = profile.resumeAnalyses?.[0]?._id;
      }
    }

    res.status(200).json({
      success: true,
      message: `Resume successfully analyzed with ${analysis.analyzedBy}`,
      data: {
        analysisId: savedAnalysisId,
        fileName: 'Pasted Resume Text',
        targetRole,
        extractedTextSnippet: resumeText.substring(0, 200),
        ...analysis,
        // Backward-compatibility aliases
        matchedKeywords: analysis.keywordMatchAnalysis?.matchedKeywords || analysis.matched || [],
        missingKeywords: analysis.keywordMatchAnalysis?.missingKeywords || analysis.missing || [],
        feedback: analysis.improvementSuggestions || analysis.feedback || [],
        jdMatchScore: analysis.jobDescriptionComparison?.matchScore || 0,
        hasJobDescription: Boolean(jobDescription && jobDescription.trim().length > 30)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * AI Career Counselor - Dynamic Roadmap using Azure OpenAI GPT-4.1-mini
 */
export const getCareerCounseling = async (req, res, next) => {
  try {
    const {
      primaryInterest = 'Cloud & AI Architecture',
      semester = 5,
      skills = [],
      careerGoals = ''
    } = req.body;

    const azureConfig = getEffectiveAzureConfig();

    if (azureConfig.isConfigured) {
      try {
        const client = new AzureOpenAI({
          endpoint: azureConfig.endpoint,
          apiKey: azureConfig.apiKey,
          apiVersion: azureConfig.apiVersion,
          deployment: azureConfig.primaryDeployment
        });

        const prompt = `You are a principal university career strategist. Generate a cutting-edge career profile and semester-by-semester milestone roadmap for an undergraduate student.
Target Domain/Interest: "${primaryInterest}"
Current Semester: ${semester}
Current Skills: ${Array.isArray(skills) && skills.length ? skills.join(', ') : 'Software engineering fundamentals'}
Career Goals: ${careerGoals || 'Secure top tier-1 placement in product or cloud company'}

Respond ONLY with valid JSON matching this schema exactly (no markdown wrapper, no backticks, no code blocks):
{
  "title": "Professional Title (e.g. Cloud & AI Solutions Architect)",
  "expectedStartingSalary": "$95,000 - $140,000 / ₹18 - ₹32 LPA",
  "growthOutlook": "34% Projected 5-Year Growth (Very High)",
  "keyCompetencies": ["Competency 1", "Competency 2", "Competency 3", "Competency 4"],
  "certificationsRecommended": ["Certification 1", "Certification 2", "Certification 3"],
  "nextElectives": ["CS-402 Advanced Cloud Systems", "CS-408 Deep Learning & LLMs"],
  "milestones": [
    { "phase": "Semester ${semester} (Current)", "goal": "Specific actionable goal for this semester" },
    { "phase": "Semester ${Number(semester) + 1 <= 8 ? Number(semester) + 1 : 'Graduation'}", "goal": "Specific milestone for next semester" },
    { "phase": "Semester 7-8 / Campus Drives", "goal": "Capstone, campus recruitment, and placement strategy" }
  ]
}`;

        const response = await client.chat.completions.create({
          model: azureConfig.primaryDeployment,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 1200
        });

        let content = response.choices[0]?.message?.content?.trim() || '';
        if (content.startsWith('```')) {
          content = content.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
        }
        const parsed = JSON.parse(content);
        return res.status(200).json({ success: true, data: parsed });
      } catch (aiErr) {
        console.warn('[Azure Career Roadmap] Fallback triggered:', aiErr.message);
      }
    }

    // Dynamic fallback structure
    const fallbackData = {
      title: `${primaryInterest} Specialist`,
      expectedStartingSalary: '$85,000 - $130,000 / ₹15 - ₹28 LPA',
      growthOutlook: '28% Projected 5-Year Growth (High)',
      keyCompetencies: ['Azure AI Foundry & Cloud Services', 'System Design & Distributed Architectures', 'Modern CI/CD & DevOps', 'Problem Solving & Algorithms'],
      certificationsRecommended: ['Microsoft Certified: Azure Fundamentals (AZ-900)', 'Azure AI Engineer Associate (AI-102)', 'HashiCorp Certified Terraform Associate'],
      nextElectives: ['CS-402 Advanced Cloud Systems', 'CS-408 Deep Learning & LLMs', 'CS-415 Scalable Distributed Systems'],
      milestones: [
        { phase: `Semester ${semester} (Current)`, goal: 'Build a production-grade fullstack cloud application with live Azure AI endpoints' },
        { phase: `Semester ${Number(semester) + 1}`, goal: 'Earn industry certifications and complete an off-campus or research internship' },
        { phase: 'Semester 7-8', goal: 'Polish portfolio, practice system design rounds, and target Tier-1 on-campus drives' }
      ]
    };
    res.status(200).json({ success: true, data: fallbackData });
  } catch (err) {
    next(err);
  }
};

/**
 * AI Career Counselor - Conversational Chat with Azure AI Foundry (GPT-4.1-mini)
 * Dynamic responses, profile integration (interests, skills, goals), MongoDB persistence
 */
export const chatWithCareerCounselor = async (req, res, next) => {
  try {
    const {
      sessionId: incomingSessionId,
      message,
      interests = [],
      skills = [],
      careerGoals = '',
      targetDomain = 'Cloud & AI Architecture',
      semester = 5,
      cgpa = ''
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    const sessionId = incomingSessionId || crypto.randomUUID();
    let studentDoc = null;
    let userId = req.user?._id || null;

    if (userId) {
      studentDoc = await Student.findOne({ userId });
    }

    // Load or create MongoDB session
    let chatSession = await CareerCounselingChat.findOne({ sessionId });
    if (!chatSession) {
      const sessionTitle = careerGoals
        ? `${targetDomain} — ${careerGoals.slice(0, 30)}`
        : `${targetDomain} Career Strategy`;

      chatSession = new CareerCounselingChat({
        sessionId,
        user: userId,
        student: studentDoc?._id || null,
        title: sessionTitle,
        interests: Array.isArray(interests) ? interests : [interests].filter(Boolean),
        skills: Array.isArray(skills) ? skills : [skills].filter(Boolean),
        careerGoals: careerGoals || '',
        targetDomain: targetDomain || 'Cloud & AI Architecture',
        semester: Number(semester) || studentDoc?.currentSemester || 5,
        cgpa: cgpa || (studentDoc?.cgpa ? String(studentDoc.cgpa) : ''),
        messages: []
      });
    } else {
      // Update session metadata if passed in latest request
      if (interests && Array.isArray(interests) && interests.length > 0) chatSession.interests = interests;
      if (skills && Array.isArray(skills) && skills.length > 0) chatSession.skills = skills;
      if (careerGoals && careerGoals.trim()) chatSession.careerGoals = careerGoals.trim();
      if (targetDomain) chatSession.targetDomain = targetDomain;
      if (semester) chatSession.semester = Number(semester);
      if (cgpa) chatSession.cgpa = cgpa;
      if (userId && !chatSession.user) chatSession.user = userId;
      if (studentDoc && !chatSession.student) chatSession.student = studentDoc._id;
    }

    // Append user message
    const userMsgObj = {
      messageId: crypto.randomUUID(),
      sender: 'user',
      content: message.trim(),
      timestamp: new Date()
    };
    chatSession.messages.push(userMsgObj);

    // Call Azure OpenAI GPT-4.1-mini
    const azureConfig = getEffectiveAzureConfig();

    let aiReplyText = '';
    let suggestedNextSteps = [];
    let recommendedRoles = [];

    if (azureConfig.isConfigured) {
      const client = new AzureOpenAI({
        endpoint: azureConfig.endpoint,
        apiKey: azureConfig.apiKey,
        apiVersion: azureConfig.apiVersion,
        deployment: azureConfig.primaryDeployment
      });

      const systemPrompt = `You are the University's Chief AI Career Counselor & Placement Strategist powered by Azure AI Foundry (${azureConfig.primaryDeployment}).
Your objective is to provide students with dynamic, personalized, actionable, and industry-grade career guidance.

Student Profile:
- Target Domain: ${chatSession.targetDomain}
- Current Semester: ${chatSession.semester}
- Stated Interests: ${chatSession.interests?.length ? chatSession.interests.join(', ') : 'General Computer Science'}
- Current Skills: ${chatSession.skills?.length ? chatSession.skills.join(', ') : 'Basic Programming'}
- Career Goals: ${chatSession.careerGoals || 'Prepare for high-growth tech careers'}
- Academic CGPA: ${chatSession.cgpa || 'In Good Standing'}

Counseling Rules:
1. Provide personalized advice directly addressing the student's message, current skills, semester, and stated career goals.
2. Highlight skill gaps, recommended next electives or certifications (e.g. Microsoft Azure, AWS, Docker/Kubernetes, LeetCode patterns).
3. Use formatted Markdown with bold headings, bulleted action items, and clear numbered steps.
4. Keep the tone encouraging, authoritative, and practical for university campus recruitment and industry hiring.
5. Never provide generic or repetitive canned responses. Every response must incorporate their specific profile context.
6. Append a JSON metadata trailer on a new line at the very end of your response:
<<<METADATA:{"roles":["Role 1","Role 2"],"nextSteps":["Action 1","Action 2","Action 3"]}>>>`;

      // Pass previous turns for coherent conversational memory (up to last 10 messages)
      const messageHistory = chatSession.messages.slice(-10, -1).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

      const openAiMessages = [
        { role: 'system', content: systemPrompt },
        ...messageHistory,
        { role: 'user', content: message.trim() }
      ];

      try {
        const completion = await client.chat.completions.create({
          model: azureConfig.primaryDeployment,
          messages: openAiMessages,
          temperature: 0.4,
          max_tokens: 1500
        });

        let rawResponse = completion.choices[0]?.message?.content?.trim() || '';

        // Extract metadata block
        const metaMatch = rawResponse.match(/<<<METADATA:(.*?)>>>/s);
        if (metaMatch) {
          try {
            const parsedMeta = JSON.parse(metaMatch[1]);
            if (Array.isArray(parsedMeta.roles)) recommendedRoles = parsedMeta.roles;
            if (Array.isArray(parsedMeta.nextSteps)) suggestedNextSteps = parsedMeta.nextSteps;
          } catch (e) {
            // non-fatal parse error
          }
          rawResponse = rawResponse.replace(/<<<METADATA:(.*?)>>>/s, '').trim();
        }

        aiReplyText = rawResponse;
      } catch (azureErr) {
        console.error('[Career Counselor Azure OpenAI Error]:', azureErr.message);
      }
    }

    // Fallback if Azure AI unavailable
    if (!aiReplyText) {
      aiReplyText = `### 🚀 Career Roadmap & Strategic Counsel: ${chatSession.targetDomain}\n\nBased on your current semester (**Semester ${chatSession.semester}**) and your background with **${chatSession.skills.join(', ') || 'core computer science'}**, here is your strategic action plan to achieve **${chatSession.careerGoals || 'Tier-1 tech placement'}**:\n\n1. **Skill Gap Remediation**: Complement your current skills with distributed systems architecture, cloud deployment, and containerization.\n2. **Hands-On Capstone**: Build and deploy an end-to-end cloud-native microservice on Microsoft Azure with CI/CD GitHub Actions.\n3. **Placement Preparation**: Target 3-5 LeetCode medium questions weekly focusing on Trees, Graphs, and Dynamic Programming.\n4. **Industry Certification**: Target Microsoft Certified: Azure Developer Associate (AZ-204) or Azure AI Fundamentals (AI-900).\n\n*What specific company interview or domain challenge would you like to explore next?*`;
      suggestedNextSteps = [
        'Complete end-to-end cloud microservice project',
        'Solve 5 LeetCode medium questions on graphs/DP',
        'Enroll in Azure AI Fundamentals certification'
      ];
      recommendedRoles = [chatSession.targetDomain, 'Cloud Solutions Associate', 'Fullstack Engineer'];
    }

    // Append AI message
    const assistantMsgObj = {
      messageId: crypto.randomUUID(),
      sender: 'assistant',
      content: aiReplyText,
      suggestedNextSteps,
      recommendedRoles,
      timestamp: new Date()
    };
    chatSession.messages.push(assistantMsgObj);
    chatSession.lastActiveAt = new Date();

    await chatSession.save();

    res.status(200).json({
      success: true,
      data: {
        sessionId: chatSession.sessionId,
        title: chatSession.title,
        message: assistantMsgObj,
        interests: chatSession.interests,
        skills: chatSession.skills,
        careerGoals: chatSession.careerGoals,
        targetDomain: chatSession.targetDomain,
        semester: chatSession.semester,
        totalMessages: chatSession.messages.length
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all career counselor chat sessions for logged-in user
 */
export const getCounselorSessions = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(200).json({ success: true, data: [] });
    }

    const sessions = await CareerCounselingChat.find({ user: userId })
      .select('sessionId title targetDomain semester careerGoals interests skills lastActiveAt createdAt messages')
      .sort({ lastActiveAt: -1 })
      .limit(25);

    const formatted = sessions.map((s) => ({
      sessionId: s.sessionId,
      title: s.title || `${s.targetDomain} Session`,
      targetDomain: s.targetDomain,
      semester: s.semester,
      careerGoals: s.careerGoals,
      interests: s.interests,
      skills: s.skills,
      messageCount: s.messages?.length || 0,
      lastMessageSnippet: s.messages?.length ? s.messages[s.messages.length - 1].content.slice(0, 80) + '...' : '',
      lastActiveAt: s.lastActiveAt || s.createdAt
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
};

/**
 * Get a specific counselor session by sessionId
 */
export const getCounselorSessionById = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await CareerCounselingChat.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Career counseling session not found.' });
    }

    res.status(200).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a counselor chat session
 */
export const deleteCounselorSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    await CareerCounselingChat.deleteOne({ sessionId });
    res.status(200).json({ success: true, message: 'Counseling session deleted successfully.' });
  } catch (err) {
    next(err);
  }
};


/**
 * AI Mock Interview - Dynamic Question Generator (Azure OpenAI GPT-4.1-mini)
 * Generates role-specific, difficulty-graded, and category-aligned technical/behavioral interview questions
 */
export const generateInterviewQuestion = async (req, res, next) => {
  try {
    const {
      role = 'Fullstack Engineer',
      difficulty = 'Junior',
      category = 'Technical Concepts',
      previousQuestions = []
    } = req.body;

    const azureConfig = getEffectiveAzureConfig();

    if (azureConfig.isConfigured) {
      try {
        const client = new AzureOpenAI({
          endpoint: azureConfig.endpoint,
          apiKey: azureConfig.apiKey,
          apiVersion: azureConfig.apiVersion,
          deployment: azureConfig.primaryDeployment
        });

        const prompt = `You are a Principal Technical Interviewer and Bar Raiser at a top tier-1 technology enterprise.
Generate ONE realistic, rigorous, and relevant interview question for a candidate.

Interview Parameters:
- Target Role: "${role}"
- Difficulty Level: "${difficulty}" (Junior = foundational & practical implementation; Mid = edge cases & performance; Senior = high-scale system trade-offs & architecture)
- Category: "${category}"
${Array.isArray(previousQuestions) && previousQuestions.length > 0 ? `Do NOT repeat any of these previously asked questions:\n${previousQuestions.slice(-5).map((q, i) => `${i + 1}. ${q}`).join('\n')}` : ''}

Respond ONLY with valid JSON matching this schema exactly (no markdown wrapper, no backticks, no code fences):
{
  "id": "${crypto.randomUUID()}",
  "question": "The realistic interview question text",
  "category": "${category}",
  "role": "${role}",
  "difficulty": "${difficulty}",
  "expectedKeyPoints": ["Core concept 1", "Core concept 2", "Core concept 3"],
  "tip": "Short actionable tip on how the student should structure their response"
}`;

        const response = await client.chat.completions.create({
          model: azureConfig.primaryDeployment,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 600
        });

        let content = response.choices[0]?.message?.content?.trim() || '';
        if (content.startsWith('```')) {
          content = content.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
        }

        const parsed = JSON.parse(content);
        return res.status(200).json({ success: true, data: parsed });
      } catch (aiErr) {
        console.warn('[Azure Interview Question AI Error]:', aiErr.message);
      }
    }

    // Dynamic fallback question bank
    const fallbackBank = [
      {
        id: crypto.randomUUID(),
        question: `Explain how you design a resilient, high-throughput microservices architecture in ${role}, including circuit breaking, distributed caching, and eventual consistency.`,
        category: 'System Design & Architecture',
        role,
        difficulty,
        expectedKeyPoints: ['Circuit breaker pattern', 'Redis distributed caching', 'Eventual consistency guarantees'],
        tip: 'Clearly articulate trade-offs between latency, data consistency, and system availability.'
      },
      {
        id: crypto.randomUUID(),
        question: `Walk through a situation where a production service you were maintaining suffered from sudden latency degradation or memory leakage. How did you diagnose and resolve it?`,
        category: 'Problem Solving & Troubleshooting',
        role,
        difficulty,
        expectedKeyPoints: ['Profiling & telemetry metrics', 'Root cause analysis', 'Mitigation and regression tests'],
        tip: 'Use the STAR method: Situation, Task, Action, and Quantifiable Results.'
      }
    ];
    const fallback = fallbackBank[Math.floor(Math.random() * fallbackBank.length)];
    res.status(200).json({ success: true, data: fallback });
  } catch (err) {
    next(err);
  }
};

/**
 * AI Mock Interview - Dynamic Answer Evaluation (Azure OpenAI GPT-4.1-mini)
 * Objectively evaluates correctness, depth, terminology, strengths, improvements, and ideal response outline
 */
export const simulateInterview = async (req, res, next) => {
  try {
    const {
      role = 'Fullstack Engineer',
      question = '',
      category = 'Technical Concepts',
      difficulty = 'Junior',
      answerText = ''
    } = req.body;

    if (!answerText || !answerText.trim()) {
      return res.status(400).json({ success: false, message: 'Candidate response is required.' });
    }

    const azureConfig = getEffectiveAzureConfig();

    let evaluationResult = null;

    if (azureConfig.isConfigured) {
      try {
        const client = new AzureOpenAI({
          endpoint: azureConfig.endpoint,
          apiKey: azureConfig.apiKey,
          apiVersion: azureConfig.apiVersion,
          deployment: azureConfig.primaryDeployment
        });

        const prompt = `You are a Principal Technical Interviewer and Hiring Bar Raiser evaluating a student candidate's interview response.
Interview Context:
- Target Role: "${role}"
- Difficulty Level: "${difficulty}"
- Question Category: "${category}"
- Interview Question: """${question || 'Explain technical concepts and system trade-offs'}"""
- Candidate's Answer:
"""
${answerText.trim().substring(0, 4000)}
"""

Evaluate this answer thoroughly, objectively, and constructively.
Respond ONLY with valid raw JSON adhering strictly to this schema (no markdown wrapper, no backticks, no code fences):
{
  "score": 85,
  "grade": "Strong Pass",
  "notes": "Detailed critique assessing correctness, technical depth, edge cases, and communication clarity...",
  "strengths": ["Clear understanding of concurrency", "Accurately mentioned cache eviction strategies"],
  "improvements": ["Elaborate on real-world fault tolerance", "Quantify latency or memory trade-offs"],
  "improvement": "Single most impactful piece of advice to elevate this specific response",
  "idealAnswerOutline": [
    "State core definition and architectural rationale",
    "Analyze time/space complexity or system trade-offs",
    "Describe real-world failure mode or scale scenario"
  ]
}`;

        const response = await client.chat.completions.create({
          model: azureConfig.primaryDeployment,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 1200
        });

        let content = response.choices[0]?.message?.content?.trim() || '';
        if (content.startsWith('```')) {
          content = content.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
        }

        evaluationResult = JSON.parse(content);
      } catch (aiErr) {
        console.warn('[Azure Interview Evaluation AI Error]:', aiErr.message);
      }
    }

    // Fallback heuristic if Azure AI unreachable
    if (!evaluationResult || typeof evaluationResult.score !== 'number') {
      const len = answerText.trim().length;
      let score = 75;
      let grade = 'Good';
      if (len < 60) { score = 45; grade = 'Needs Improvement'; }
      else if (len > 300) { score = 88; grade = 'Strong Pass'; }

      evaluationResult = {
        score,
        grade,
        notes: `Your response shows practical understanding for ${role}. To reach a senior interview standard, include deeper performance trade-offs, real-world constraints, and edge cases.`,
        strengths: ['Relevant conceptual alignment', 'Structured reasoning'],
        improvements: ['Include production trade-offs and scalability limits'],
        improvement: 'Articulate specific architectural patterns or metrics (e.g. latency, throughput) to demonstrate senior mastery.',
        idealAnswerOutline: ['State the core definition', 'Discuss time/space complexity or system trade-offs', 'Provide a production example']
      };
    }

    // Persist in MongoDB CareerProfile for logged-in student
    if (req.user) {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        await CareerProfile.findOneAndUpdate(
          { student: student._id },
          {
            $push: {
              interviewSimulations: {
                sessionDate: new Date(),
                roleTitle: role,
                difficulty: difficulty || 'Junior',
                score: evaluationResult.score,
                strengths: evaluationResult.strengths || [],
                improvements: evaluationResult.improvements || [],
                qaTranscript: [
                  {
                    question: question,
                    answer: answerText,
                    feedback: evaluationResult.notes,
                    rating: evaluationResult.score
                  }
                ]
              }
            }
          },
          { upsert: true }
        );
      }
    }

    res.status(200).json({
      success: true,
      data: {
        role,
        question,
        evaluatedAnswer: answerText,
        score: evaluationResult.score,
        grade: evaluationResult.grade,
        notes: evaluationResult.notes,
        strengths: evaluationResult.strengths || [],
        improvements: evaluationResult.improvements || [],
        improvement: evaluationResult.improvement,
        idealAnswerOutline: evaluationResult.idealAnswerOutline || []
      }
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
