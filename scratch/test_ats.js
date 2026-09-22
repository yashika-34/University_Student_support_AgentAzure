import dotenv from 'dotenv';
dotenv.config();
import { AzureOpenAI } from 'openai';

async function testAts() {
  try {
    const client = new AzureOpenAI({
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4.1-mini'
    });

    const sampleResume = `Alex Mercer
alex@university.edu | (555) 012-3456 | github.com/alex | linkedin.com/in/alex
EDUCATION
B.S. in Computer Science, State University, GPA: 8.8/10.0, Expected May 2025
Relevant Coursework: Data Structures, Algorithms, Cloud Computing, Distributed Systems
SKILLS
Languages: JavaScript, TypeScript, Python, Java, SQL
Frameworks: React, Node.js, Express, Next.js, Docker, Kubernetes, Azure, AWS
EXPERIENCE
Software Engineer Intern, CloudTech Labs (June 2024 - Aug 2024)
- Developed microservices in Node.js and deployed to Kubernetes clusters, improving latency by 25%.
- Integrated Redis caching layer, reducing database read load by 40%.
PROJECTS
UniAssist AI Portal: Fullstack university portal with RAG, Azure OpenAI integration, and React UI.
Distributed File Store: Built consistent hashing storage engine in Go with Raft consensus.`;

    const systemPrompt = `You are a principal technical recruiter and expert ATS (Applicant Tracking System) optimization engine.
Return ONLY valid raw JSON adhering strictly to the schema. No markdown code blocks (no \`\`\`json or \`\`\`), no conversational text.`;

    const userPrompt = `Analyze this resume for the target role: "Fullstack Cloud Engineer".
Resume text:
${sampleResume}

Return JSON with exactly these keys:
{
  "atsScore": 85,
  "grade": "Strong Match",
  "resumeSummary": "...",
  "skillsDetected": ["JavaScript", "Docker", ...],
  "missingSkills": ["CI/CD pipelines", "Terraform", ...],
  "keywordMatchAnalysis": {
    "matchPercentage": 82,
    "matchedKeywords": ["Node.js", "Kubernetes", "React", ...],
    "missingKeywords": ["GraphQL", "Terraform", ...],
    "suggestedKeywords": ["CloudWatch", "Microservices Architecture", ...]
  },
  "experienceAnalysis": {
    "rating": "Strong",
    "feedback": "...",
    "strengths": ["Clear metrics provided (25%, 40%)", ...],
    "improvements": ["Elaborate on testing methodologies", ...]
  },
  "educationAnalysis": {
    "rating": "Strong",
    "feedback": "..."
  },
  "sectionFeedback": {
    "contactInfo": { "score": 95, "status": "Complete", "feedback": "..." },
    "summary": { "score": 60, "status": "Missing", "feedback": "..." },
    "skills": { "score": 90, "status": "Strong", "feedback": "..." },
    "projects": { "score": 88, "status": "Strong", "feedback": "..." },
    "experience": { "score": 85, "status": "Good", "feedback": "..." },
    "education": { "score": 95, "status": "Complete", "feedback": "..." }
  },
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "improvementSuggestions": ["...", "..."],
  "careerRecommendations": {
    "recommendedRoles": ["Fullstack Engineer", "Cloud Solutions Associate"],
    "recommendedCertifications": ["Microsoft Certified: Azure Fundamentals (AZ-900)", "AWS Certified Solutions Architect - Associate"],
    "actionPlan": ["...", "..."]
  },
  "jobDescriptionComparison": {
    "hasJd": false,
    "matchScore": 0,
    "alignmentSummary": "No job description provided. Evaluated against industry standard requirements.",
    "matchedRequirements": [],
    "missingRequirements": []
  }
}`;

    const res = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 3000
    });

    const content = res.choices[0].message.content;
    const parsed = JSON.parse(content.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim());
    console.log('SUCCESS! ATS Score:', parsed.atsScore);
    console.log('Grade:', parsed.grade);
    console.log('Summary:', parsed.resumeSummary.substring(0, 80));
    console.log('Skills Detected:', parsed.skillsDetected.slice(0, 5));
    console.log('Strengths:', parsed.strengths.slice(0, 2));
    console.log('Weaknesses:', parsed.weaknesses.slice(0, 2));
  } catch (err) {
    console.error('ERROR in testAts:', err);
  }
}

testAts();
