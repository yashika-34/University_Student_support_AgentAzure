import Placement from '../models/Placement.js';
import CareerProfile from '../models/CareerProfile.js';
import Student from '../models/Student.js';

/**
 * Career & Placement Controller: DB-backed Placement Eligibility, ATS Resume, Counseling, Mock Interview
 */

/**
 * Get all placement drives from MongoDB
 */
export const getPlacements = async (req, res, next) => {
  try {
    let placements = await Placement.find().sort({ packageLPA: -1 });

    if (placements.length === 0) {
      // Initialize MongoDB with university placement drives if collection is empty
      const initialDrives = [
        {
          companyName: 'Microsoft Corporation',
          tier: 'Tier-1 (Super Dream)',
          roleTitle: 'Software Development Engineer I',
          packageLPA: 45.0,
          minCgpa: 3.5,
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
          minCgpa: 3.3,
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
          minCgpa: 3.0,
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
          minCgpa: 2.8,
          maxBacklogsAllowed: 2,
          eligibleDepartments: ['All Engineering Branches'],
          requiredSkills: ['Java/C#', 'Web Fundamentals', 'Database Basics'],
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          openPositions: 30
        }
      ];
      placements = await Placement.insertMany(initialDrives);
    }

    res.status(200).json({
      success: true,
      data: placements
    });
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
    res.status(201).json({
      success: true,
      message: 'Placement drive published successfully.',
      data: placement
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Placement Eligibility Checker querying live MongoDB Placements and Student records
 */
export const checkPlacementEligibility = async (req, res, next) => {
  try {
    let studentCgpa = req.body.cgpa !== undefined ? Number(req.body.cgpa) : 3.82;
    let studentBacklogs = req.body.backlogs !== undefined ? Number(req.body.backlogs) : 0;
    let studentDepartment = req.body.department || 'Computer Science';

    // If student is authenticated, pull verified records from DB
    if (req.user) {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        if (student.cgpa) studentCgpa = student.cgpa;
        if (student.department) studentDepartment = student.department;
      }
    }

    let placements = await Placement.find().sort({ packageLPA: -1 });

    if (placements.length === 0) {
      const initialDrives = [
        {
          companyName: 'Microsoft Corporation',
          tier: 'Tier-1 (Super Dream)',
          roleTitle: 'Software Development Engineer I',
          packageLPA: 45.0,
          minCgpa: 3.5,
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
          minCgpa: 3.3,
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
          minCgpa: 3.0,
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
          minCgpa: 2.8,
          maxBacklogsAllowed: 2,
          eligibleDepartments: ['All Engineering Branches'],
          requiredSkills: ['Java/C#', 'Web Fundamentals', 'Database Basics'],
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          openPositions: 30
        }
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
        id: p._id,
        name: p.companyName,
        tier: p.tier,
        role: p.roleTitle,
        packageLPA: p.packageLPA,
        minCgpa: p.minCgpa,
        maxBacklogs: p.maxBacklogsAllowed,
        eligibleDepartments: p.eligibleDepartments,
        requiredSkills: p.requiredSkills,
        deadline: p.deadline,
        openPositions: p.openPositions,
        isEligible,
        statusReason: reason
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
 * Resume ATS Analyzer with MongoDB CareerProfile persistence
 */
export const analyzeResume = async (req, res, next) => {
  try {
    const { resumeText = '', targetRole = 'Fullstack Cloud Engineer' } = req.body;

    const keywordsRequired = [
      'react', 'node.js', 'express', 'mongodb', 'docker',
      'azure', 'rest api', 'git', 'sql', 'ci/cd', 'typescript', 'microservices'
    ];

    const lowerText = resumeText.toLowerCase();
    const matched = [];
    const missing = [];

    keywordsRequired.forEach((kw) => {
      if (lowerText.includes(kw)) {
        matched.push(kw);
      } else {
        missing.push(kw);
      }
    });

    const atsScore = Math.min(98, Math.max(30, Math.round((matched.length / keywordsRequired.length) * 100)));

    const recommendations = [];
    if (missing.length > 0) {
      recommendations.push(`Incorporate key industry terms: ${missing.slice(0, 4).join(', ')}.`);
    }
    if (!lowerText.includes('achieved') && !lowerText.includes('improved') && !lowerText.includes('reduced')) {
      recommendations.push('Quantify project impacts using metric verbs (e.g. "reduced latency by 35%").');
    }
    if (resumeText.length < 200) {
      recommendations.push('Expand your experience and project descriptions to meet minimum ATS depth (300+ words).');
    }
    recommendations.push('Ensure standard sections: Summary, Technical Skills, Projects, Education, Certifications.');

    // Save to CareerProfile in MongoDB if user is a student
    if (req.user) {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        await CareerProfile.findOneAndUpdate(
          { student: student._id },
          {
            targetDomain: targetRole,
            atsScore,
            resumeKeywordsMatched: matched,
            missingKeywords: missing,
            resumeFeedback: recommendations
          },
          { upsert: true, new: true }
        );
      }
    }

    res.status(200).json({
      success: true,
      data: {
        targetRole,
        atsScore,
        grade: atsScore >= 80 ? 'Optimal Candidate Match' : atsScore >= 65 ? 'Competitive Candidate Match' : 'Needs ATS Optimization',
        matchedKeywords: matched,
        missingKeywords: missing,
        feedback: recommendations
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * AI Career Counselor with personalized recommendations
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
        certificationsRecommended: [
          'Microsoft Certified: Azure Solutions Architect Expert',
          'AWS Certified Solutions Architect – Associate',
          'HashiCorp Certified: Terraform Associate'
        ],
        nextElectives: ['CS-402 Advanced Cloud Systems', 'CS-408 Deep Learning & LLMs'],
        milestones: [
          { phase: 'Semester 5 (Current)', goal: 'Master container orchestration & build production RAG chatbot' },
          { phase: 'Semester 6', goal: 'Complete cloud certification & secure summer internship' },
          { phase: 'Semester 7-8', goal: 'Publish capstone system & target Tier-1 on-campus drives' }
        ]
      }
    };

    const counselorData = careerProfiles[primaryInterest] || careerProfiles['Cloud & AI Architecture'];

    res.status(200).json({
      success: true,
      data: counselorData
    });
  } catch (err) {
    next(err);
  }
};

/**
 * AI Mock Interview Simulator with MongoDB simulation history
 */
export const simulateInterview = async (req, res, next) => {
  try {
    const { role = 'Fullstack Engineer', questionId = 1, answerText = '' } = req.body;

    const questions = [
      {
        id: 1,
        question: 'Explain how React Virtual DOM diffing algorithm minimizes layout reflows and improves performance.',
        category: 'Frontend Engineering'
      },
      {
        id: 2,
        question: 'How do you structure database indexing in MongoDB to optimize queries with multiple filter keys?',
        category: 'Backend Architecture'
      },
      {
        id: 3,
        question: 'Describe a situation where an assignment deliverable had ambiguous requirements. How did you resolve it?',
        category: 'Behavioral / Teamwork'
      }
    ];

    const currentQ = questions.find((q) => q.id === Number(questionId)) || questions[0];

    // Evaluate answer heuristics
    let feedbackScore = 80;
    let feedbackNotes = 'Solid understanding articulated with clear technical terminology.';

    if (answerText.trim().length < 40) {
      feedbackScore = 45;
      feedbackNotes = 'Answer is too brief. Elaborate with specific architectural mechanisms, state management trade-offs, or real-world project context.';
    } else if (
      answerText.toLowerCase().includes('heuristic') ||
      answerText.toLowerCase().includes('reconciliation') ||
      answerText.toLowerCase().includes('virtual dom') ||
      answerText.toLowerCase().includes('compound index')
    ) {
      feedbackScore = 95;
      feedbackNotes = 'Exceptional depth. Accurate terminology and strong comprehension demonstrated.';
    }

    // Save simulation record to MongoDB CareerProfile
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
                difficulty: 'Junior',
                score: feedbackScore,
                strengths: ['Relevant conceptual alignment', 'Clear structure'],
                improvements: ['Include production trade-offs'],
                qaTranscript: [
                  {
                    question: currentQ.question,
                    answer: answerText,
                    feedback: feedbackNotes,
                    rating: feedbackScore
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
        question: currentQ,
        evaluatedAnswer: answerText,
        score: feedbackScore,
        notes: feedbackNotes,
        strengths: ['Relevant conceptual alignment', 'Clear structure'],
        improvement: 'Include a brief real-world production tradeoff to elevate to Senior rating.'
      }
    });
  } catch (err) {
    next(err);
  }
};
