import { AzureOpenAI } from 'openai';
import { getEffectiveAzureConfig } from '../services/azureAiService.js';
import Job from '../models/Job.js';
import Resume from '../models/Resume.js';
import Recommendation from '../models/Recommendation.js';

/**
 * Intelligent Job Matching Engine
 * Evaluates candidate skillsets against tech industry roles using Azure OpenAI
 */
export const generateJobMatches = async (req, res, next) => {
  try {
    const { skills = 'React, Node.js, Python, SQL, REST APIs, Git' } = req.body;
    const candidateSkills = String(skills).trim();
    const azureConfig = getEffectiveAzureConfig();

    let matches = [];

    if (azureConfig.isConfigured) {
      try {
        const client = new AzureOpenAI({
          endpoint: azureConfig.endpoint,
          apiKey: azureConfig.apiKey,
          apiVersion: azureConfig.apiVersion,
          deployment: azureConfig.primaryDeployment
        });

        const prompt = `You are a high-level University Career & Placement AI Advisor.
Evaluate the candidate's skills: "${candidateSkills}".
Return a JSON array of 3 top industry job recommendations matching their skillset.

For each job object, provide:
- "title": Job title (e.g., "Fullstack React/Node Engineer", "Cloud Backend Developer", "Data Analyst")
- "company": Prominent technology company or enterprise hiring for this profile
- "requiredSkills": Array of 4-6 key technical & architectural skills
- "description": 2-3 sentences highlighting role impact and core responsibilities
- "location": City / Remote policy (e.g. "Hybrid / Seattle, WA" or "Remote")
- "matchScore": Integer between 70 and 98 based on real overlap with candidate's listed skills.
- "matchReason": Brief 1-sentence explanation of why their profile matches.

Return valid JSON only.`;

        const response = await client.chat.completions.create({
          model: azureConfig.primaryDeployment,
          messages: [
            { role: 'system', content: 'You are an AI Technical Job Matchmaker returning valid JSON.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.4,
          max_tokens: 1600
        });

        let content = response.choices[0]?.message?.content?.trim() || '{}';
        if (content.startsWith('```')) {
          content = content.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
        }
        const parsed = JSON.parse(content);
        const rawJobs = Array.isArray(parsed) ? parsed : parsed.jobs || parsed.matches || [];

        if (Array.isArray(rawJobs) && rawJobs.length > 0) {
          matches = rawJobs.map((j) => {
            const reqArray = Array.isArray(j.requiredSkills)
              ? j.requiredSkills
              : String(j.requiredSkills || '').split(/,\s*/);
            return {
              title: j.title || 'Software Development Engineer',
              company: j.company || 'Enterprise Technology Corp',
              requiredSkills: reqArray,
              description: j.description || 'Deliver high-performance cloud and web software solutions.',
              location: j.location || 'Remote / Hybrid',
              matchScore: typeof j.matchScore === 'number' ? Math.min(99, Math.max(65, j.matchScore)) : 88,
              matchReason: j.matchReason || `Strong alignment with ${candidateSkills.slice(0, 30)}.`
            };
          });
        }
      } catch (azureErr) {
        console.warn('[AI Job Matcher] Azure OpenAI synthesis failed, using domain matcher:', azureErr.message);
      }
    }

    // Fallback if offline or quota exceeded
    if (matches.length === 0) {
      const skillsLower = candidateSkills.toLowerCase();
      matches = [
        {
          title: skillsLower.includes('python') || skillsLower.includes('data') ? 'AI/ML Software Engineer' : 'Fullstack Cloud Engineer',
          company: 'Microsoft / Azure Cloud Ecosystem',
          requiredSkills: ['Node.js', 'React', 'TypeScript', 'REST APIs', 'Cloud Architecture'],
          description: 'Design and deploy scalable university cloud services and distributed customer platforms.',
          location: 'Hybrid / Redmond, WA',
          matchScore: 92,
          matchReason: 'Direct overlap with your modern web and backend engineering skillset.'
        },
        {
          title: 'Backend Platform Engineer',
          company: 'Stripe / Fintech Services',
          requiredSkills: ['Python', 'SQL', 'Distributed Systems', 'Docker', 'Redis'],
          description: 'Architect resilient transactional pipelines and microservices handling millions of API requests.',
          location: 'San Francisco, CA (Remote Friendly)',
          matchScore: 86,
          matchReason: 'Solid foundation in databases, API protocols, and computational scalability.'
        },
        {
          title: 'Frontend UI/UX Systems Engineer',
          company: 'Atlassian / Productivity Cloud',
          requiredSkills: ['React', 'TypeScript', 'Tailwind/CSS3', 'Jest', 'Web Performance'],
          description: 'Build responsive, accessible, and delightful interactive portals for enterprise users.',
          location: 'Remote',
          matchScore: 84,
          matchReason: 'Relevant background in modern component design and user experience delivery.'
        }
      ];
    }

    res.status(200).json({ success: true, data: matches });
  } catch (err) {
    next(err);
  }
};

/**
 * Skill Gap Analysis and 2-Week Upskill Roadmap
 */
export const generateSkillGapAndRoadmap = async (req, res, next) => {
  try {
    const { jobTitle = 'Software Engineer', userSkills = 'React, JavaScript, HTML/CSS' } = req.body;
    const azureConfig = getEffectiveAzureConfig();

    let roadmapText = '';

    if (azureConfig.isConfigured) {
      try {
        const client = new AzureOpenAI({
          endpoint: azureConfig.endpoint,
          apiKey: azureConfig.apiKey,
          apiVersion: azureConfig.apiVersion,
          deployment: azureConfig.primaryDeployment
        });

        const prompt = `Candidate Skills: ${userSkills}
Target Job Role: ${jobTitle}

Perform a rigorous technical Skill Gap Analysis and produce a targeted 2-Week Sprint Upskill Roadmap.
Format in clean, beautiful GitHub-flavored Markdown with:
1. ### 🔍 Core Skill Gap Summary (Identified missing technologies & architectural concepts)
2. ### 📅 Week 1: Foundational Technologies & Labs (Day-by-day action items)
3. ### 🚀 Week 2: Production Capstone & Interview Readiness (Projects to build, testing, metrics)
4. ### 💡 Pro Interview Tips (High-yield technical keywords & STAR framing for this role)`;

        const response = await client.chat.completions.create({
          model: azureConfig.primaryDeployment,
          messages: [
            { role: 'system', content: 'You are an Elite University Career Upskill Coach.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 1800
        });

        roadmapText = response.choices[0]?.message?.content?.trim();
      } catch (azureErr) {
        console.warn('[Skill Gap] Azure OpenAI call failed:', azureErr.message);
      }
    }

    if (!roadmapText) {
      roadmapText = `### 🔍 Core Skill Gap Summary for **${jobTitle}**\n\n` +
        `Based on your current profile (**${userSkills}**), your primary growth opportunities are in:\n` +
        `- Production microservice architecture and distributed caching (Redis/Memcached)\n` +
        `- Cloud deployment (Docker, CI/CD pipelines, Azure/AWS primitives)\n` +
        `- Automated unit testing & API integration benchmarks\n\n` +
        `### 📅 Week 1: Architectural Foundations\n` +
        `- **Days 1–2**: Deep dive into non-blocking I/O, database indexing, and query optimization.\n` +
        `- **Days 3–4**: Implement containerized microservices with Docker Compose.\n` +
        `- **Days 5–7**: Build secure JWT/OAuth2 authentication and role-based access control.\n\n` +
        `### 🚀 Week 2: Capstone & Interview Readiness\n` +
        `- **Days 8–10**: Integrate automated unit tests (Jest/Mocha) with 85%+ code coverage.\n` +
        `- **Days 11–12**: Deploy the service to cloud infrastructure and configure observability.\n` +
        `- **Days 13–14**: Mock interview drills and STAR-method articulation of project challenges.`;
    }

    res.status(200).json({ success: true, data: roadmapText });
  } catch (err) {
    next(err);
  }
};

/**
 * High-Impact Professional Cover Letter Generator
 */
export const generateCoverLetter = async (req, res, next) => {
  try {
    const { jobTitle = 'Software Engineer', company = 'Technology Partner', userSkills = 'React, Node.js, Cloud APIs' } = req.body;
    const azureConfig = getEffectiveAzureConfig();

    let coverLetterText = '';

    if (azureConfig.isConfigured) {
      try {
        const client = new AzureOpenAI({
          endpoint: azureConfig.endpoint,
          apiKey: azureConfig.apiKey,
          apiVersion: azureConfig.apiVersion,
          deployment: azureConfig.primaryDeployment
        });

        const prompt = `Candidate Skills: ${userSkills}
Target Job: ${jobTitle}
Company: ${company}

Draft a compelling, highly personalized, and ATS-optimized 3-paragraph software engineering Cover Letter:
- Opening: Hook mentioning excitement for ${company} and stating their core technical value proposition.
- Body: 2 quantifiable project achievements integrating ${userSkills}, highlighting scalability and business impact.
- Closing: Professional call-to-action requesting an interview.
Do not use generic placeholders like [Insert Date]. Write fully realized professional prose.`;

        const response = await client.chat.completions.create({
          model: azureConfig.primaryDeployment,
          messages: [
            { role: 'system', content: 'You are an Executive Technical Resume & Cover Letter Specialist.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.4,
          max_tokens: 1500
        });

        coverLetterText = response.choices[0]?.message?.content?.trim();
      } catch (azureErr) {
        console.warn('[Cover Letter] Azure OpenAI call failed:', azureErr.message);
      }
    }

    if (!coverLetterText) {
      coverLetterText = `Dear Hiring Team at ${company},\n\n` +
        `I am writing to express my enthusiastic interest in the ${jobTitle} position at ${company}. Having followed ${company}'s technological innovations in cloud computing and user experience, I am excited by the opportunity to contribute my expertise in ${userSkills} to your engineering mission.\n\n` +
        `Throughout my academic and project initiatives, I have engineered full-stack applications with an emphasis on modular architecture, query optimization, and intuitive user workflows. Specifically, leveraging ${userSkills}, I architected distributed systems that achieved sub-200ms response times while ensuring 99.9% availability across continuous integration deployments. My background enables me to bridge rigorous system fundamentals with agile software delivery.\n\n` +
        `I welcome the opportunity to discuss how my technical acumen and problem-solving drive align with ${company}'s engineering objectives. Thank you for your time and consideration, and I look forward to speaking with your team.\n\n` +
        `Sincerely,\nUniversity Engineering Candidate`;
    }

    res.status(200).json({ success: true, data: coverLetterText });
  } catch (err) {
    next(err);
  }
};

/**
 * Start Interactive AI Mock Interview Question
 */
export const startMockInterview = async (req, res, next) => {
  try {
    const { role = 'Fullstack Engineer', difficulty = 'Medium', category = 'Technical', previousQuestions = [] } = req.body;
    const azureConfig = getEffectiveAzureConfig();

    let question = '';

    if (azureConfig.isConfigured) {
      try {
        const client = new AzureOpenAI({
          endpoint: azureConfig.endpoint,
          apiKey: azureConfig.apiKey,
          apiVersion: azureConfig.apiVersion,
          deployment: azureConfig.primaryDeployment
        });

        const prompt = `Generate a single realistic technical interview question for a ${difficulty} level candidate interviewing for a ${role} position focusing on ${category}.
Avoid common trivia; ask an applied scenario or design question testing real-world engineering judgment.
Must NOT duplicate any of these prior questions: ${previousQuestions.join(' | ')}.
Return ONLY the question text without conversational preamble.`;

        const response = await client.chat.completions.create({
          model: azureConfig.primaryDeployment,
          messages: [
            { role: 'system', content: 'You are a Senior Principal Engineer conducting a technical interview.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.6,
          max_tokens: 300
        });

        question = response.choices[0]?.message?.content?.trim();
      } catch (azureErr) {
        console.warn('[Mock Interview Question] Azure OpenAI failed:', azureErr.message);
      }
    }

    if (!question) {
      const fallbackQuestions = [
        `How would you architect a distributed caching layer using Redis to mitigate database connection spikes during high-concurrency events?`,
        `Describe how you prevent and diagnose SQL/NoSQL performance bottlenecks in an API handling thousands of concurrent writes.`,
        `STAR Scenario: Walk me through a situation where a deployed software change caused unexpected latency in production. How did you diagnose and remediate it?`
      ];
      question = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
    }

    res.status(200).json({ success: true, data: question });
  } catch (err) {
    next(err);
  }
};

/**
 * Evaluate Candidate's Interview Response with STAR Rubric
 */
export const evaluateInterviewAnswer = async (req, res, next) => {
  try {
    const { question, answer = '', role = 'Software Engineer' } = req.body;
    const azureConfig = getEffectiveAzureConfig();

    let evaluation = null;

    if (azureConfig.isConfigured && answer.trim().length > 10) {
      try {
        const client = new AzureOpenAI({
          endpoint: azureConfig.endpoint,
          apiKey: azureConfig.apiKey,
          apiVersion: azureConfig.apiVersion,
          deployment: azureConfig.primaryDeployment
        });

        const prompt = `Interview Question: "${question}"
Candidate's Answer: "${answer}"
Role: "${role}"

Evaluate the candidate's answer using industry technical hiring standards (accuracy, depth, structure, STAR methodology).
Return a JSON object with:
{
  "score": integer between 40 and 100,
  "feedback": "2-3 sentences of constructive, specific critique highlighting strengths and omissions",
  "idealAnswer": "Concise, master-level answer demonstrating optimal technical keywords and architectural judgment",
  "keyImprovement": "Single highest-impact action the candidate should take to improve this answer"
}`;

        const response = await client.chat.completions.create({
          model: azureConfig.primaryDeployment,
          messages: [
            { role: 'system', content: 'You are an Expert Technical Hiring Manager returning valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 1200
        });

        let raw = response.choices[0]?.message?.content?.trim() || '{}';
        if (raw.startsWith('```')) {
          raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
        }
        evaluation = JSON.parse(raw);
      } catch (azureErr) {
        console.warn('[Evaluate Answer] Azure OpenAI failed:', azureErr.message);
      }
    }

    if (!evaluation || !evaluation.score) {
      const wordCount = answer.trim().split(/\s+/).length;
      const estimatedScore = Math.min(95, Math.max(55, 50 + wordCount * 2));
      evaluation = {
        score: estimatedScore,
        feedback: answer.trim().length > 30
          ? 'Good foundational grasp of the core concepts. To elevate your answer to senior level, provide concrete quantitative metrics and explicitly discuss architectural tradeoffs.'
          : 'Answer is too brief. Provide a step-by-step technical explanation detailing the underlying mechanisms and failure modes.',
        idealAnswer: 'A high-scoring answer details the architectural trade-offs, specifies precise caching/database strategies, mentions error resilience, and illustrates resolution with a concrete production example.',
        keyImprovement: 'Use the STAR method (Situation, Task, Action, Result) and state measurable results (e.g. reduced latency by 35%).'
      };
    }

    res.status(200).json({ success: true, data: evaluation });
  } catch (err) {
    next(err);
  }
};
