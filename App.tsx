

import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MainWorkspace } from './components/MainWorkspace';
import { Header } from './components/Header';
import { ApiKeyPrompt } from './components/ApiKeyPrompt';
import { HomePage } from './components/HomePage';
import { runAtsCheck, findJobsWithGoogleSearch, runSkillGapAnalysis, getResumeTemplates, structureResume } from './services/geminiService';
import { Tab, AtsResult, Job, GroundingChunk, ResumeVersion, SkillGapResult, ResumeTemplate, ApiKeyError } from './types';
import { GoogleGenAI, FunctionDeclaration, Type, Chat } from '@google/genai';


const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'app'>('home');
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Optimizer);
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');
  const [jobSearchQuery, setJobSearchQuery] = useState({ role: 'Software Engineer', location: 'Remote' });
  const [versionNotes, setVersionNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsApiKeySelection, setNeedsApiKeySelection] = useState(false);
  const [isTemplateFlow, setIsTemplateFlow] = useState(false);

  // Results state
  const [atsResult, setAtsResult] = useState<AtsResult | null>(null);
  const [jobAlerts, setJobAlerts] = useState<Job[] | null>(null);
  const [jobAlertsSources, setJobAlertsSources] = useState<GroundingChunk[]>([]);
  const [skillGapResult, setSkillGapResult] = useState<SkillGapResult | null>(null);
  const [templates, setTemplates] = useState<ResumeTemplate[] | null>(null);
  
  // Chat state for Optimizer
  const [chat, setChat] = useState<Chat | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([]);

  // Versioning state
  const [versions, setVersions] = useState<ResumeVersion[]>([]);

  useEffect(() => {
    try {
      const savedVersions = localStorage.getItem('resumeVersions');
      if (savedVersions) {
        setVersions(JSON.parse(savedVersions));
      }
    } catch (e) {
      console.error("Failed to load resume versions from localStorage", e);
    }
  }, []);

  useEffect(() => {
    // Pre-fetch templates for the home page
    if (view === 'home' && !templates) {
        handleFetchTemplates();
    }
  }, [view, templates]);

  const withApiErrorHandler = useCallback(async (apiCall: () => Promise<void>) => {
    setError(null);
    setNeedsApiKeySelection(false);
    setIsLoading(true);
    // Do not clear all results here, specific handlers will clear their own results
    try {
      await apiCall();
    } catch (e) {
      if (e instanceof ApiKeyError) {
        setNeedsApiKeySelection(true);
        setError(e.message + " Please select your key and try again.");
      } else {
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      }
      setIsTemplateFlow(false); // Reset flow on error
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleStartChat = useCallback(() => {
    if (!resumeText) {
      setError('Please provide a resume to start the chat.');
      return;
    }
    withApiErrorHandler(async () => {
      clearResults(false); // Clear previous results but keep resume text
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const updateResumeTool: FunctionDeclaration = {
        name: 'updateResume',
        parameters: {
          type: Type.OBJECT,
          description: 'Updates the full content of the resume in the editor.',
          properties: {
            newResumeContent: {
              type: Type.STRING,
              description: 'The complete, updated markdown content of the resume.',
            },
          },
          required: ['newResumeContent'],
        },
      };

      const systemInstruction = `You are an expert career coach and resume writer conducting an interactive chat session.
      Your task is to help the user optimize their resume.
      ${jdText 
        ? "The user has provided a job description. Your primary goal is to tailor the resume to this specific role, focusing on ATS keywords and skill alignment." 
        : "The user has NOT provided a job description. Your primary goal is to provide general improvements to the resume, focusing on clarity, impact, action verbs, and modern formatting standards."}
      
      1. First, provide an initial analysis and high-level suggestions based on the provided documents.
      2. Then, wait for the user to ask for specific changes. Be conversational and helpful.
      3. When you provide an updated version of a section or the whole resume, you MUST use the 'updateResume' tool to reflect the change in the live preview editor. Do not just show the markdown in the chat. Call the tool with the complete, new resume content.
      4. Keep your chat responses concise and focused on the user's request.`;


      const newChat = ai.chats.create({
        model: 'gemini-2.5-pro',
        config: {
            systemInstruction: systemInstruction,
            tools: [{ functionDeclarations: [updateResumeTool] }],
        },
      });
      setChat(newChat);

      const initialMessage = `Here is my resume${jdText ? " and the job description I'm targeting" : ""}. Please provide your initial analysis.
      
      ${jdText ? `**Job Description:**\n---\n${jdText}\n---\n\n` : ''}**My Resume:**
      ---
      ${resumeText}
      ---
      `;
      
      setChatMessages([{ role: 'user', content: initialMessage }]);
      
      const responseStream = await newChat.sendMessageStream({ message: initialMessage });
      let fullResponseText = '';
      
      for await (const chunk of responseStream) {
        if (chunk.functionCalls) {
          for (const fc of chunk.functionCalls) {
            if (fc.name === 'updateResume' && typeof fc.args?.newResumeContent === 'string') {
              setResumeText(fc.args.newResumeContent);
            }
          }
        }
        if (chunk.text) {
          fullResponseText += chunk.text;
        }
      }
      setChatMessages(prev => [...prev, { role: 'model', content: fullResponseText }]);
      setIsTemplateFlow(false); // End of template flow
    });
  }, [resumeText, jdText, withApiErrorHandler]);

  // Effect to automatically start chat when a template is selected
  useEffect(() => {
    if (isTemplateFlow && activeTab === Tab.Optimizer && resumeText && !chat && !isLoading) {
        handleStartChat();
    }
  }, [isTemplateFlow, activeTab, resumeText, chat, isLoading, handleStartChat]);


  const handleSendMessage = useCallback(async (message: string) => {
    if (!chat) {
      setError("Chat not initialized.");
      return;
    }
    
    setIsLoading(true);
    setChatMessages(prev => [...prev, { role: 'user', content: message }]);
    
    try {
      const responseStream = await chat.sendMessageStream({ message });
      let fullResponseText = '';

      for await (const chunk of responseStream) {
         if (chunk.functionCalls) {
          for (const fc of chunk.functionCalls) {
            if (fc.name === 'updateResume' && typeof fc.args?.newResumeContent === 'string') {
              setResumeText(fc.args.newResumeContent);
            }
          }
        }
        if (chunk.text) {
          fullResponseText += chunk.text;
        }
      }
      setChatMessages(prev => [...prev, { role: 'model', content: fullResponseText }]);
    } catch (e) {
      if (e instanceof ApiKeyError) {
        setNeedsApiKeySelection(true);
        setError(e.message + " Please select your key and try again.");
      } else {
         const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during chat.';
         setChatMessages(prev => [...prev, { role: 'model', content: `Sorry, an error occurred: ${errorMessage}` }]);
         setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [chat]);

  const handleAtsCheck = useCallback(() => {
    if (!resumeText) {
      setError('Please upload a resume to check.');
      return;
    }
    withApiErrorHandler(async () => {
      setAtsResult(null);
      const result = await runAtsCheck(resumeText);
      if (result && typeof result.score === 'number' && Array.isArray(result.suggestions)) {
        setAtsResult(result);
      } else {
        throw new Error('Received malformed data from the server. Please try again.');
      }
    });
  }, [resumeText, withApiErrorHandler]);

  const handleFindJobs = useCallback(() => {
    withApiErrorHandler(async () => {
      setJobAlerts(null);
      const { jobs, sources } = await findJobsWithGoogleSearch(jobSearchQuery.role, jobSearchQuery.location);
       if (jobs && Array.isArray(jobs)) {
        setJobAlerts(jobs);
        setJobAlertsSources(sources);
      } else {
        throw new Error('Received malformed data for job alerts.');
      }
    });
  }, [jobSearchQuery, withApiErrorHandler]);
  
  const handleSkillGapAnalysis = useCallback(() => {
     if (!resumeText || !jdText) {
      setError('Please provide your resume and a target job description.');
      return;
    }
    withApiErrorHandler(async () => {
      setSkillGapResult(null);
      const result = await runSkillGapAnalysis(resumeText, jdText);
      setSkillGapResult(result);
    });
  }, [resumeText, jdText, withApiErrorHandler]);

  const handleFetchTemplates = useCallback(() => {
    if (templates) return; // Don't re-fetch if already loaded
    withApiErrorHandler(async () => {
      const result = await getResumeTemplates();
      setTemplates(result);
    });
  }, [templates, withApiErrorHandler]);

   const handleFileUpload = useCallback((rawText: string) => {
    if (!rawText) return;
    withApiErrorHandler(async () => {
      setResumeText(''); // Clear the preview first
      const structuredText = await structureResume(rawText);
      setResumeText(structuredText);
      clearResults(false);
    });
  }, [withApiErrorHandler]);

  const handleSaveVersion = () => {
    if (!resumeText) {
      setError("Cannot save an empty resume.");
      return;
    }
    const newVersion: ResumeVersion = {
      id: new Date().toISOString(),
      content: resumeText,
      notes: versionNotes || "Unsaved notes",
      createdAt: new Date().toISOString(),
    };
    const updatedVersions = [newVersion, ...versions];
    setVersions(updatedVersions);
    localStorage.setItem('resumeVersions', JSON.stringify(updatedVersions));
    setVersionNotes('');
  };

  const handleRestoreVersion = (versionId: string) => {
    const versionToRestore = versions.find(v => v.id === versionId);
    if (versionToRestore) {
      setResumeText(versionToRestore.content);
    }
  };

  const handleDeleteVersion = (versionId: string) => {
    const updatedVersions = versions.filter(v => v.id !== versionId);
    setVersions(updatedVersions);
    localStorage.setItem('resumeVersions', JSON.stringify(updatedVersions));
  };
  
  const handleUseTemplate = (content: string) => {
    setView('app');
    clearResults(true); // Clear everything
    setResumeText(content);
    setJdText('');
    setActiveTab(Tab.Optimizer);
    setIsTemplateFlow(true); // This will trigger the useEffect to start the chat
  };

  const clearResults = (clearInputs = true) => {
    if (clearInputs) {
      setResumeText('');
      setJdText('');
    }
    setChat(null);
    setChatMessages([]);
    setAtsResult(null);
    setJobAlerts(null);
    setError(null);
    setJobAlertsSources([]);
    setSkillGapResult(null);
    setIsTemplateFlow(false);
  };
  
  const handleTabChange = (tab: Tab) => {
    // From home page, start fresh
    if (view === 'home') {
      setView('app');
      clearResults(true);
      setActiveTab(tab);
      if (tab === Tab.Templates && !templates) {
        handleFetchTemplates();
      }
      return;
    }
  
    // When switching tabs within the app, clear results but keep inputs
    setAtsResult(null);
    setJobAlerts(null);
    setJobAlertsSources([]);
    setSkillGapResult(null);
    setError(null);
  
    // Special handling for Optimizer chat
    if (activeTab === Tab.Optimizer || tab === Tab.Optimizer) {
      setChat(null);
      setChatMessages([]);
      setIsTemplateFlow(false);
    }
  
    setActiveTab(tab);
  
    if (tab === Tab.Templates && !templates) {
      handleFetchTemplates();
    }
  };
  
  const handleSelectKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      setNeedsApiKeySelection(false);
      setError("API Key selected. Please try your request again.");
    } catch (e) {
      console.error("Failed to open API key selection", e);
      setError("Could not open the API key selection dialog.");
    }
  };
  
  const handleStartFromScratch = () => {
    setView('app');
    clearResults(true);
    setActiveTab(Tab.Optimizer);
  };

  const handleGoHome = () => {
    setView('home');
    clearResults(true);
  }
  
  const isFullPageTab = activeTab === Tab.AtsChecker || activeTab === Tab.SkillGap || activeTab === Tab.JobAlerts;

  const sidebarProps = {
      activeTab,
      resumeText,
      setResumeText,
      jdText,
      setJdText,
      jobSearchQuery,
      setJobSearchQuery,
      onAtsCheck: handleAtsCheck,
      onFindJobs: handleFindJobs,
      onSkillGapAnalysis: handleSkillGapAnalysis,
      isLoading,
      versions,
      onSaveVersion: handleSaveVersion,
      onRestoreVersion: handleRestoreVersion,
      onDeleteVersion: handleDeleteVersion,
      versionNotes,
      setVersionNotes,
      error,
      atsResult,
      jobAlerts,
      jobAlertsSources,
      skillGapResult,
      templates,
      onUseTemplate: handleUseTemplate,
      chatStarted: !!chat,
      onStartChat: handleStartChat,
      chatMessages,
      onSendMessage: handleSendMessage,
      onFileUpload: handleFileUpload,
      isFullPage: isFullPageTab,
      isTemplateFlow,
  };

  return (
    <div className="flex flex-col min-h-screen font-sans text-gray-800">
      {needsApiKeySelection && <ApiKeyPrompt onSelectKey={handleSelectKey} onDismiss={() => setNeedsApiKeySelection(false)} />}
      <Header 
        onGoHome={handleGoHome}
        activeTab={view === 'app' ? activeTab : null}
        onTabChange={handleTabChange}
      />
      <main className="flex-1">
        {view === 'home' ? (
          <HomePage 
            onStartFromScratch={handleStartFromScratch}
            templates={templates}
            isLoading={isLoading && !templates}
            onUseTemplate={handleUseTemplate}
          />
        ) : (
          <div className={`flex flex-col md:flex-row bg-gray-100 ${isFullPageTab ? 'p-4 md:p-8 justify-center' : 'items-start p-4 md:p-8 gap-8'}`}>
             <Sidebar {...sidebarProps} />
             {!isFullPageTab && (
                <MainWorkspace
                    resumeText={resumeText}
                    isLoading={isLoading && !resumeText}
                />
             )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;