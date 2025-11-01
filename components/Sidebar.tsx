

import React, { useState } from 'react';
import { Tab, ResumeVersion, AtsResult, Job, GroundingChunk, SkillGapResult, ResumeTemplate } from '../types';
import { Button } from './Button';
import { DownloadResume } from './DownloadResume';
import { LoadingSpinner } from './LoadingSpinner';
import { FileUpload } from './FileUpload';
import { AtsScoreGauge } from './AtsScoreGauge';
import { ChatInterface } from './ChatInterface';
import { SkillGapAnalysisResults } from './SkillGapAnalysisResults';
import { ResumePreview } from './ResumePreview';

interface SidebarProps {
  activeTab: Tab;
  resumeText: string;
  setResumeText: (text: string) => void;
  jdText: string;
  setJdText: (text: string) => void;
  jobSearchQuery: { role: string; location: string };
  setJobSearchQuery: (query: { role: string; location: string }) => void;
  onAtsCheck: () => void;
  onFindJobs: () => void;
  onSkillGapAnalysis: () => void;
  isLoading: boolean;
  versions: ResumeVersion[];
  onSaveVersion: () => void;
  onRestoreVersion: (id: string) => void;
  onDeleteVersion: (id: string) => void;
  versionNotes: string;
  setVersionNotes: (notes: string) => void;
  error: string | null;
  atsResult: AtsResult | null;
  jobAlerts: Job[] | null;
  jobAlertsSources: GroundingChunk[];
  skillGapResult: SkillGapResult | null;
  templates: ResumeTemplate[] | null;
  onUseTemplate: (content: string) => void;
  // Chat-related props
  chatMessages: { role: 'user' | 'model'; content: string }[];
  onSendMessage: (message: string) => void;
  onStartChat: () => void;
  chatStarted: boolean;
  onFileUpload: (content: string) => void;
  isFullPage?: boolean;
  isTemplateFlow?: boolean;
}

const Editor: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder: string, title: string, height?: string }> = ({ value, onChange, placeholder, title, height = 'h-64' }) => (
  <div className="flex flex-col">
    <label className="mb-2 font-semibold text-gray-700">{title}</label>
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 resize-y bg-white text-gray-900 placeholder-gray-500 ${height}`}
      rows={15}
    />
  </div>
);

const VersionHistory: React.FC<{ 
  versions: ResumeVersion[], 
  onRestore: (id: string) => void, 
  onDelete: (id: string) => void 
}> = ({ versions, onRestore, onDelete }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border-t pt-4 mt-4">
      <button onClick={() => setIsOpen(!isOpen)} className="font-semibold text-gray-700 w-full text-left flex justify-between items-center">
        Version History ({versions.length})
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="mt-2 space-y-2 max-h-48 pr-2">
          {versions.length === 0 ? (
            <p className="text-sm text-gray-500">No versions saved yet.</p>
          ) : (
            versions.map(v => (
              <div key={v.id} className="text-sm border p-2 rounded-md bg-gray-50">
                <p className="font-semibold">{new Date(v.createdAt).toLocaleString()}</p>
                <p className="text-gray-600 italic">"{v.notes}"</p>
                <div className="mt-2 space-x-2">
                  <button onClick={() => onRestore(v.id)} className="text-indigo-600 hover:underline">Restore</button>
                  <button onClick={() => onDelete(v.id)} className="text-red-600 hover:underline">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const ResultDisplay: React.FC<Pick<SidebarProps, 'error' | 'atsResult' | 'jobAlerts' | 'jobAlertsSources' | 'skillGapResult'>> = (props) => {
    if (props.error) {
        return <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-bold">An Error Occurred</p>
            <p>{props.error}</p>
        </div>
    }

    if (props.atsResult) {
        return (
            <div className="space-y-8">
                <div className="flex flex-col items-center">
                    <AtsScoreGauge score={props.atsResult.score} />
                    <p className="text-base text-gray-600 italic mt-4 text-center max-w-2xl">{props.atsResult.summary}</p>
                </div>
                <div className="p-6 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-lg text-gray-800">Actionable Suggestions:</h4>
                    <ul className="list-disc list-inside text-base space-y-2 mt-3 text-gray-700">
                        {props.atsResult.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                </div>
                <div className="p-6 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-lg text-gray-800">Missing Keywords:</h4>
                    {props.atsResult.keyword_match.missing.length > 0 ? (
                        <div className="flex flex-wrap gap-3 mt-3">
                            {props.atsResult.keyword_match.missing.map((k, i) => <span key={i} className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">{k}</span>)}
                        </div>
                    ) : <p className="text-base text-gray-500 mt-2">None found, great job!</p>}
                </div>
            </div>
        )
    }

    if (props.skillGapResult) {
        return <SkillGapAnalysisResults result={props.skillGapResult} />;
    }

    if (props.jobAlerts) {
        return (
            <div className="space-y-4">
                {props.jobAlerts.length > 0 ? props.jobAlerts.map((job, i) => (
                    <div key={i} className="border p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200">
                        <h4 className="font-bold text-base md:text-lg text-indigo-700">{job.title}</h4>
                        <p className="text-sm md:text-base font-medium text-gray-800 mt-1">{job.company} - {job.location}</p>
                        <p className="text-sm text-gray-600 mt-3 leading-relaxed">{job.summary}</p>
                        <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-indigo-600 hover:underline mt-4 inline-block">View Job &rarr;</a>
                    </div>
                )) : <p className="text-gray-500">No jobs found for this query. Try being more general.</p>}
                {props.jobAlertsSources.length > 0 && (
                     <div className="pt-2 text-xs text-gray-500">
                         <p>Sources:</p>
                         <ul className="list-disc list-inside">
                             {props.jobAlertsSources.map((source, i) => (
                                 <li key={i}><a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="hover:underline">{source.web.title}</a></li>
                             ))}
                         </ul>
                     </div>
                )}
            </div>
        )
    }

    return null;
}


export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  resumeText,
  setResumeText,
  jdText,
  setJdText,
  jobSearchQuery,
  setJobSearchQuery,
  onAtsCheck,
  onFindJobs,
  onSkillGapAnalysis,
  isLoading,
  versions,
  onSaveVersion,
  onRestoreVersion,
  onDeleteVersion,
  versionNotes,
  setVersionNotes,
  templates,
  onUseTemplate,
  error,
  atsResult,
  jobAlerts,
  jobAlertsSources,
  skillGapResult,
  chatStarted,
  onStartChat,
  chatMessages,
  onSendMessage,
  onFileUpload,
  isFullPage = false,
  isTemplateFlow = false,
}) => {
  const renderInputs = () => {
    switch (activeTab) {
      case Tab.Optimizer:
        if (chatStarted) {
          return (
            <div className="flex flex-col flex-1 min-h-0">
              <h3 className="text-xl font-bold text-gray-800 mb-2 px-1 flex-shrink-0">Optimization Chat</h3>
              <ChatInterface messages={chatMessages} onSendMessage={onSendMessage} isLoading={isLoading} />
            </div>
          );
        }
        if (isTemplateFlow) {
          return (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 font-semibold text-gray-700">Preparing your optimization session...</p>
              <p className="text-sm text-gray-500">The AI career coach is analyzing your chosen template.</p>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Resume Optimizer</h3>
            <p className="text-sm text-gray-600 -mt-4">Upload your resume and optionally a job description to begin a chat session with our AI career coach.</p>
            <FileUpload onFileUpload={onFileUpload} />
            <Editor 
              title="Job Description (Optional)"
              value={jdText} 
              onChange={(e) => setJdText(e.target.value)} 
              placeholder="Paste the target job description to get tailored suggestions..."
              height="h-48"
            />
            <Button onClick={onStartChat} isLoading={isLoading} className="w-full" disabled={!resumeText}>
              Start Optimizing Chat
            </Button>
          </div>
        );
      case Tab.AtsChecker:
        return (
          <div className="space-y-6">
            <FileUpload onFileUpload={onFileUpload} />
            <Button onClick={onAtsCheck} isLoading={isLoading} className="w-full">
              Check ATS Score
            </Button>
          </div>
        );
      case Tab.SkillGap:
        return (
           <div className="space-y-6">
            <FileUpload onFileUpload={onFileUpload} />
            <Editor 
              title="Job Description"
              value={jdText} 
              onChange={(e) => setJdText(e.target.value)} 
              placeholder="Paste the relevant job description here..."
            />
            <Button onClick={onSkillGapAnalysis} isLoading={isLoading} className="w-full">
              Analyze Skill Gaps
            </Button>
          </div>
        );
      case Tab.JobAlerts:
         return (
          <div className="space-y-6">
            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-gray-700">Role</label>
              <input
                type="text"
                value={jobSearchQuery.role}
                onChange={(e) => setJobSearchQuery({ ...jobSearchQuery, role: e.target.value })}
                placeholder="e.g., Senior Frontend Developer"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-gray-700">Location</label>
              <input
                type="text"
                value={jobSearchQuery.location}
                onChange={(e) => setJobSearchQuery({ ...jobSearchQuery, location: e.target.value })}
                placeholder="e.g., San Francisco, CA or Remote"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
            <Button onClick={onFindJobs} isLoading={isLoading} className="w-full">
              Find Jobs
            </Button>
          </div>
        );
      case Tab.Templates:
        if (isLoading && !templates) {
          return (
            <div className="flex justify-center items-center h-full pt-10">
              <LoadingSpinner size="lg" />
            </div>
          );
        }
        if (!templates || templates.length === 0) {
          return <p className="text-center text-gray-600">No templates available. This could be due to an API issue. Try again later.</p>;
        }
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Choose a Resume Template</h3>
            <p className="text-sm text-gray-600">
              Select a professionally designed, ATS-friendly template to get started.
            </p>
            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.name} className="border border-gray-200 rounded-lg bg-gray-50 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200">
                  <div className="p-4 border-b">
                    <h4 className="font-semibold text-indigo-700 truncate">{template.name}</h4>
                  </div>
                  <div className="p-4 bg-gray-50">
                    <div className="h-96 border rounded-lg overflow-y-scroll bg-white shadow-inner">
                        <div className="p-8">
                            <ResumePreview resumeText={template.content} />
                        </div>
                    </div>
                  </div>
                  <div className="p-4 border-t">
                    <Button onClick={() => onUseTemplate(template.content)} className="w-full text-sm py-2">
                      Use This Template
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  const resultProps = { error, atsResult, jobAlerts, jobAlertsSources, skillGapResult };
  const hasResults = Object.values(resultProps).some(val => val !== null && (!Array.isArray(val) || val.length > 0));

  const isChatTab = activeTab === Tab.Optimizer && chatStarted;

  const containerClass = isFullPage
    ? 'w-full max-w-3xl bg-white p-6 md:p-8 rounded-xl shadow-lg flex flex-col'
    : `w-full md:w-2/5 xl:w-1/3 bg-white p-6 rounded-xl shadow-lg flex flex-col sticky top-[5.5rem] max-h-[calc(100vh-7rem)] overflow-y-auto`;


  const renderFullPageHeader = () => {
    if (!isFullPage) return null;
    let title = '';
    let subtitle = '';

    switch (activeTab) {
      case Tab.AtsChecker:
        title = 'ATS Compatibility Checker';
        subtitle = 'Upload your resume to see how well it would pass through an Applicant Tracking System.';
        break;
      case Tab.SkillGap:
        title = 'Skill Gap Analysis';
        subtitle = 'Compare your resume against a job description to identify missing skills.';
        break;
      case Tab.JobAlerts:
        title = 'AI-Powered Job Alerts';
        subtitle = 'Find relevant job postings based on your desired role and location, powered by Google Search.';
        break;

    }

    return (
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{title}</h2>
        <p className="mt-2 text-base text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
      </div>
    );
  };

  return (
    <aside className={containerClass}>
      {renderFullPageHeader()}
      <div className={`${isChatTab || (activeTab === Tab.Optimizer && isTemplateFlow) ? 'flex-grow min-h-0 flex flex-col' : 'space-y-6'}`}>
        {renderInputs()}
      </div>
       {!isChatTab && (
        <div className="flex-shrink-0 mt-6 border-t pt-4">
          <h3 className="font-semibold text-lg text-gray-800 mb-4">AI Suggestions</h3>
          <div>
            <ResultDisplay {...resultProps} />
            {!isLoading && !hasResults && (
                <p className="text-gray-500 text-center py-8">Your AI-powered suggestions will appear here.</p>
            )}
          </div>
        </div>
       )}
    </aside>
  );
};