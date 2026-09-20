/**
 * Career & Placement Controller: Eligibility, ATS Resume, Counseling, Mock Interview
 */

/**
 * Placement Eligibility Checker
 */
export const checkPlacementEligibility = async (req, res) => {
  try {
    const { cgpa = 3.82, backlogs = 0, department = 'Computer Science' } = req.body;

    const companies = [
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
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
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
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
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
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'comp-4',
        name: 'Cognizant Technology',
        tier: 'Service',
        role: 'Programmer Analyst Trainee',
        packageLPA: 7.5,
        minCgpa: 2.8,
        maxBacklogs: 2,
        eligibleDepartments: ['All Engineering Branches'],
        requiredSkills: ['Java/C#', 'Web Fundamentals', 'Database Basics'],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const results = companies.map((c) => {
      const isCgpaEligible = cgpa >= c.minCgpa;
      const isBacklogEligible = backlogs <= c.maxBacklogs;
      const isEligible = isCgpaEligible && isBacklogEligible;

      let reason = 'Eligible for placement drive.';
      if (!isCgpaEligible) reason = `Requires minimum CGPA of ${c.minCgpa} (current: ${cgpa}).`;
      else if (!isBacklogEligible) reason = `Max backlogs allowed is ${c.maxBacklogs} (current: ${backlogs}).`;

      return {
        ...c,
        isEligible,
        statusReason: reason
      };
    });

    const eligibleCount = results.filter((c) => c.isEligible).length;

    res.status(200).json({
      success: true,
      data: {
        studentMetrics: { cgpa, backlogs, department },
        totalDrives: results.length,
        eligibleCount,
        eligibilityPercentage: Math.round((eligibleCount / results.length) * 100),
        companies: results
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Resume ATS Analyzer
 */
export const analyzeResume = async (req, res) => {
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

    const atsScore = Math.min(95, Math.max(35, Math.round((matched.length / keywordsRequired.length) * 100)));

    const recommendations = [];
    if (missing.length > 0) {
      recommendations.push(`Incorporate key industry terms: ${missing.slice(0, 4).join(', ')}.`);
    }
    if (!lowerText.includes('achieved') && !lowerText.includes('improved') && !lowerText.includes('reduced')) {
      recommendations.push('Quantify project impacts using metric verbs (e.g. "reduced latency by 35%").');
    }
    if (resumeText.length < 300) {
      recommendations.push('Expand your experience and project descriptions to meet minimum ATS depth (500+ words).');
    }
    recommendations.push('Ensure standard sections: Summary, Technical Skills, Projects, Education, Certifications.');

    res.status(200).json({
      success: true,
      data: {
        targetRole,
        atsScore,
        grade: atsScore >= 80 ? 'Excellent Match' : atsScore >= 65 ? 'Competitive Match' : 'Needs ATS Optimization',
        matchedKeywords: matched,
        missingKeywords: missing,
        recommendations
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * AI Career Counselor
 */
export const getCareerCounseling = async (req, res) => {
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
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * AI Mock Interview Simulator
 */
export const simulateInterview = async (req, res) => {
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
    } else if (answerText.toLowerCase().includes('heuristic') || answerText.toLowerCase().includes('reconciliation') || answerText.toLowerCase().includes('compound index')) {
      feedbackScore = 95;
      feedbackNotes = 'Exceptional depth. Accurate terminology and strong comprehension demonstrated.';
    }

    res.status(200).json({
      success: true,
      data: {
        question: currentQ,
        evaluatedAnswer: answerText,
        score: feedbackScore,
        feedback: feedbackNotes,
        strengths: ['Relevant conceptual alignment', 'Clear structure'],
        improvementTip: 'Include a brief real-world production tradeoff to elevate to Senior rating.'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
