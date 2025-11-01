
# Resume A to Z: AI-Powered Resume Optimization Platform

**Resume A to Z** is an intelligent, web-based platform designed to help job seekers craft, tailor, and validate their resumes with the power of Google's Gemini models. It provides a suite of tools that guide users from an initial draft to a polished, job-ready document that can beat Applicant Tracking Systems (ATS) and catch a recruiter's eye.

## Core Features

*   **📄 Resume Optimizer:** Engage in an interactive chat session with an AI career coach. Upload your resume and an optional job description, and receive tailored suggestions, keyword optimizations, and content refinements in real-time. The AI can directly update the resume in the editor using function calling.

*   **📊 ATS Compatibility Checker:** Get an instant analysis of your resume's ATS-friendliness. The tool provides a score out of 100, a summary of its findings, and actionable suggestions to improve parsing and keyword matching.

*   **🔍 Skill Gap Analysis:** Compare your resume against a target job description to identify critical skills and keywords you might be missing. The analysis provides a clear breakdown of included, missing, and partially matched skills, along with prioritized recommendations.

*   **🌐 AI-Powered Job Alerts:** Find live, relevant job postings using the power of Google Search grounding. Simply enter a role and location, and the AI will fetch recent job listings, complete with summaries and direct links.

*   **✨ Professional Templates:** Start with a strong foundation by choosing from several professionally designed, ATS-friendly resume templates. The AI generates distinct templates for various career profiles, such as recent graduates, mid-career professionals, and career changers.

*   **📤 Multi-Format File Upload:** Easily import your existing resume by uploading a PDF, DOCX, TXT, or Markdown file. The application uses advanced parsing to extract the text and structure it into a clean, editable format.

*   **👁️ Live Preview & PDF Download:** See a live, beautifully formatted preview of your resume as you edit. When you're ready, you can download a high-quality PDF of your resume generated directly in the browser.

## Technology Stack

This project is a modern, single-page application built with a focus on a seamless user experience and powerful AI capabilities.

*   **Frontend:**
    *   **React:** For building a dynamic and component-based user interface.
    *   **TypeScript:** For type safety and improved developer experience.
    *   **Tailwind CSS:** For rapid, utility-first styling.

*   **AI & Backend Logic:**
    *   **Google Gemini API (`@google/genai`):** The core engine for all intelligent features.
        *   **Gemini 2.5 Pro:** Powers complex, creative, and reasoning-heavy tasks like the Optimizer chat, Skill Gap Analysis, and template generation.
        *   **Gemini 2.5 Flash with Google Search:** Used for the Job Alerts feature to provide grounded, real-time results from the web.
        *   **Gemini 2.5 Flash Lite:** Powers the fast and efficient ATS Checker.

*   **Client-Side Libraries:**
    *   **pdf.js:** For parsing text content from PDF files directly in the browser.
    *   **mammoth.js:** For extracting raw text from DOCX files on the client side.
    *   **html2canvas & jsPDF:** For generating high-quality PDF downloads on the client side.

## How to Use the Application

1.  **Get Started:** On the homepage, you can choose to:
    *   **Start From Scratch:** Open the editor with a blank slate.
    *   **Upload Your Resume:** Use the file uploader in any tool tab to parse your existing resume (PDF, DOCX, etc.).
    *   **Use a Template:** Browse the AI-generated templates and select one to begin your session.

2.  **Optimize with AI:**
    *   Navigate to the **Optimizer** tab.
    *   If you haven't already, upload your resume.
    *   Optionally, paste a job description into the corresponding text area.
    *   Click "Start Optimizing Chat" to begin an interactive session. Ask the AI for specific changes, like "Make my bullet points more impactful" or "Help me add these keywords from the job description."

3.  **Analyze Your Resume:**
    *   Go to the **ATS Checker** tab to get a compatibility score and improvement tips.
    *   Go to the **Skill Gap** tab, provide a job description, and get a detailed analysis of missing skills.

4.  **Find Jobs:**
    *   In the **Job Alerts** tab, enter your desired role and location to find current job openings.

5.  **Download Your Resume:**
    *   As you work, your resume is displayed in the main workspace.
    *   Use the **Download as PDF** button to save a professional-quality PDF of your final resume.

## Running the Application

This is a static frontend application that can be run in any modern web browser. It can be served from any static file server or deployed to a hosting provider like Vercel, Netlify, or GitHub Pages.

### API Key Requirement

To function, the application needs a valid Google Gemini API key. The application is designed to get this key in two ways:

1.  **Environment Variable:** The primary method is through an environment variable `process.env.API_KEY`. The hosting environment must be configured to make this key available to the application at runtime.

2.  **API Key Selector:** If the application detects an invalid or missing key (e.g., due to quota issues), it will display a prompt allowing the user to select their own API key. This functionality relies on an integration with the host platform (e.g., `window.aistudio.openSelectKey()`), making it ideal for environments like Google's AI Studio.
