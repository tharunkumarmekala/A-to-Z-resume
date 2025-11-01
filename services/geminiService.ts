import { GoogleGenAI } from "@google/genai";
import { AtsResult, Job, GroundingChunk, SkillGapResult, ResumeTemplate, ApiKeyError } from '../types';

const getAiClient = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY environment variable is not set or available.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const cleanJsonString = (str: string): string => {
  return str.replace(/^```json\s*|```\s*$/g, '').trim();
};

const handleApiError = (error: unknown): never => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error("Gemini API Error:", errorMessage);
  if (
    errorMessage.includes('API key not valid') ||
    errorMessage.includes('permission denied') ||
    errorMessage.includes('quota') ||
    errorMessage.includes('API_KEY_INVALID') ||
    errorMessage.includes('429') || // Too Many Requests
    errorMessage.includes('Requested entity was not found')
  ) {
    throw new ApiKeyError('Your API key may be invalid or has exceeded its quota.');
  }
  throw new Error(`Failed to get data from Gemini API: ${errorMessage}`);
};

export const structureResume = async (rawText: string): Promise<string> => {
    const ai = getAiClient();
    const model = 'gemini-2.5-pro';
    const prompt = `
        You are an expert resume formatter. Your task is to take the raw text extracted from a user's resume and restructure it into a clean, professional, and well-organized markdown format.
        You must use our standard template structure.

        **Standard Template Structure (Use these exact headings):**
        - Header: Name should be on its own line, followed by contact info (phone, email, linkedin, github) on the next line, separated by '|'. This should be at the very top without a markdown heading.
        - ## SUMMARY
        - ## EXPERIENCE
        - ## EDUCATION
        - ## SKILLS

        **Instructions:**
        1.  Parse the user's raw resume text and identify the content corresponding to each section of our standard template.
        2.  The user's resume might have different section titles (e.g., "Work History" instead of "EXPERIENCE", "Professional Summary" instead of "SUMMARY"). You must correctly map their content to our standard titles.
        3.  Format job experiences with the following pattern, with each bullet point on a new line:
            **Job Title**, Company Name - City, ST | YYYY – YYYY
            - Bullet point 1...
            - Bullet point 2...
        4.  Format education similarly:
            **Degree**, University Name - City, ST | YYYY
        5.  For skills, create a categorized list if possible (e.g., **Languages:**, **Frameworks/Libraries:**, **Tools:**). If not, a simple bulleted list under the main SKILLS heading is fine.
        6.  Clean up any OCR errors, strange line breaks, or formatting artifacts from the original file.
        7.  The final output MUST be a single block of clean markdown text following our template structure. Do not include any commentary or explanations.

        **Raw Resume Text:**
        ---
        ${rawText}
        ---

        Return ONLY the restructured markdown resume.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        handleApiError(error);
    }
};

export const runAtsCheck = async (resume: string): Promise<AtsResult> => {
  const ai = getAiClient();
  const model = 'gemini-2.5-flash-lite';
  const prompt = `
    Act as an advanced Applicant Tracking System (ATS) analyzer.
    Analyze the provided resume for general ATS compatibility and best practices. Do NOT compare it against a specific job description.
    Provide a score out of 100 based on formatting, readability, structure, and use of strong action verbs.
    Provide actionable suggestions for improvement.
    For the keyword_match section, identify strong action verbs or key skills as 'present' and suggest common ones that are 'missing' or could be added.

    Return a JSON object with the following structure:
    {
      "score": <a number between 0 and 100 representing ATS compatibility>,
      "summary": "<a brief one-sentence summary of the resume's ATS-friendliness>",
      "keyword_match": {
        "present": [<an array of strong action verbs or key skills found in the resume>],
        "missing": [<an array of suggested action verbs or industry keywords that could be included>]
      },
      "suggestions": [<an array of specific, actionable suggestions to improve the resume for ATS parsing (e.g., 'Use a standard font', 'Avoid tables or columns', 'Include a skills section')>]
    }

    **Resume:**
    ---
    ${resume}
    ---

    Return ONLY the JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const jsonText = cleanJsonString(response.text);
    return JSON.parse(jsonText) as AtsResult;
  } catch (error) {
    handleApiError(error);
  }
};

export const findJobsWithGoogleSearch = async (role: string, location: string): Promise<{jobs: Job[], sources: GroundingChunk[]}> => {
  const ai = getAiClient();
  const model = 'gemini-2.5-flash';
  const prompt = `
    You MUST use the provided Google Search tool to find 5 live, recent job postings for a "${role}" in "${location}".
    Do not use your training data; the results must come from the live search tool.
    For each job, provide the company name, job title, location, a brief summary of responsibilities, and a direct URL to the job posting.
    Return the result as a JSON array with this structure:
    [
      {
        "company": "...",
        "title": "...",
        "location": "...",
        "summary": "...",
        "url": "..."
      }
    ]

    Only return the JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const jsonText = cleanJsonString(response.text);
    const jobs = JSON.parse(jsonText) as Job[];
    const sources = (response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[]) || [];
    
    return { jobs, sources };
  } catch (error) {
    handleApiError(error);
  }
};

export const runSkillGapAnalysis = async (resume: string, jd: string): Promise<SkillGapResult> => {
  const ai = getAiClient();
  const model = 'gemini-2.5-pro';
  const prompt = `
    You are a senior technical recruiter and career development coach.
    Analyze the provided resume and compare it against the skills and qualifications in the job description.
    Your task is to provide a detailed skill gap analysis.

    1.  **Keyword Analysis**: Identify key skills and technologies from the job description. For each keyword, determine its status in the resume:
        *   'Included': The skill is clearly present.
        *   'Missing': The skill is not mentioned at all.
        *   'Partial': A related or less advanced version of the skill is present (e.g., resume mentions 'React' but JD requires 'React with Redux Toolkit').
    2.  **Actionable Suggestions**: Provide concrete, prioritized suggestions to bridge the gaps.
        *   'CRITICAL': Suggestions for missing skills that are core requirements of the job.
        *   'RECOMMENDED': Suggestions for improving the resume's impact or addressing secondary skills.

    Return the result as a single JSON object with the following structure:
    {
      "summary": "<A concise, one-sentence summary of the skill gap analysis>",
      "keywordAnalysis": [
        {
          "keyword": "<The skill or keyword from the JD>",
          "status": "<'Included', 'Missing', or 'Partial'>"
        }
      ],
      "actionableSuggestions": [
        {
          "title": "<A short, actionable title for the suggestion (e.g., 'Add the keyword \\'Roadmap\\'')>",
          "description": "<A brief explanation of why this is important and what to do>",
          "priority": "<'CRITICAL' or 'RECOMMENDED'>"
        }
      ]
    }

    **Job Description:**
    ---
    ${jd}
    ---

    **Resume:**
    ---
    ${resume}
    ---

    Return ONLY the JSON object.
  `;
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: 'application/json',
      },
    });
    const jsonText = cleanJsonString(response.text);
    return JSON.parse(jsonText) as SkillGapResult;
  } catch (error) {
    handleApiError(error);
  }
};

export const getResumeTemplates = async (): Promise<ResumeTemplate[]> => {
  const cachedTemplates = sessionStorage.getItem('resumeTemplates');
  if (cachedTemplates) {
    try {
      return JSON.parse(cachedTemplates);
    } catch(e) {
      console.error("Failed to parse cached templates", e);
      sessionStorage.removeItem('resumeTemplates');
    }
  }

  const ai = getAiClient();
  const model = 'gemini-2.5-pro';
  const prompt = `
    You are an expert resume designer specializing in templates that are highly compatible with modern Applicant Tracking Systems (ATS).
    Generate 5 distinct, ATS-friendly resume templates. Each template should cater to a slightly different professional profile (e.g., one for a recent graduate, one for a mid-career professional, one for a creative professional, one for a technical role, and one for a career changer).

    For each template, provide:
    1. A unique name (e.g., "The Chronological Classic", "The Modern Hybrid").
    2. A brief description of who the template is best for.
    3. The full content of the template in Markdown format, using common placeholders like "[Your Name]", "[Company Name]", "[Skill]", etc. The structure should be clear and easy to parse.

    Return the result as a JSON array, where each object has the following structure:
    {
      "name": "...",
      "description": "...",
      "content": "..."
    }

    Return ONLY the JSON array.
  `;
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
    const jsonText = cleanJsonString(response.text);
    const templates = JSON.parse(jsonText) as ResumeTemplate[];
    sessionStorage.setItem('resumeTemplates', JSON.stringify(templates));
    return templates;
  } catch (error) {
    handleApiError(error);
  }
};