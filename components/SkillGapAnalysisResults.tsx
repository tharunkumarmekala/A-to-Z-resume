import React from 'react';
import { SkillGapResult } from '../types';

// Icons as SVG components
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const WarningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const ExclamationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const LightbulbIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M12 21a9 9 0 110-18 9 9 0 010 18z" />
    </svg>
);


const statusStyles = {
  Included: {
    icon: <CheckIcon />,
    container: 'bg-white border-gray-200',
    badge: 'bg-green-100 text-green-800',
    iconContainer: 'text-green-600',
  },
  Missing: {
    icon: <XIcon />,
    container: 'bg-white border-gray-200',
    badge: 'bg-red-100 text-red-800',
    iconContainer: 'text-red-600',
  },
  Partial: {
    icon: <WarningIcon />,
    container: 'bg-white border-gray-200',
    badge: 'bg-orange-100 text-orange-800',
    iconContainer: 'text-orange-500',
  },
};

const priorityStyles = {
    CRITICAL: {
      icon: <ExclamationIcon />,
      badge: 'text-red-600 font-bold',
      container: 'bg-white',
    },
    RECOMMENDED: {
      icon: <LightbulbIcon />,
      badge: 'text-orange-600 font-bold',
      container: 'bg-white',
    },
};


interface SkillGapAnalysisResultsProps {
  result: SkillGapResult;
}

export const SkillGapAnalysisResults: React.FC<SkillGapAnalysisResultsProps> = ({ result }) => {
  return (
    <div className="space-y-8">
      <div>
        <h4 className="font-semibold text-lg text-gray-800 mb-4">Keyword Analysis</h4>
        <div className="flex flex-wrap gap-3">
          {result.keywordAnalysis.map(({ keyword, status }) => {
            const styles = statusStyles[status];
            return (
              <div key={keyword} className={`flex items-center justify-between p-2.5 rounded-lg shadow-sm border w-full sm:w-auto sm:min-w-[180px] ${styles.container}`}>
                <div className="flex items-center">
                    <div className={`flex items-center justify-center h-5 w-5 rounded-full mr-2 ${styles.iconContainer}`}>
                        {styles.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{keyword}</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles.badge}`}>
                  {status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-lg text-gray-800 mb-4">Actionable Suggestions</h4>
        <div className="space-y-4">
          {result.actionableSuggestions.map(({ title, description, priority }) => {
             const styles = priorityStyles[priority];
             return (
                <div key={title} className={`p-4 rounded-lg shadow-sm border ${styles.container}`}>
                    <div className="flex items-start">
                        <div className="flex-shrink-0">{styles.icon}</div>
                        <div className="ml-3 flex-1">
                            <div className="flex justify-between items-baseline">
                                <p className="text-sm font-semibold text-gray-800">{title}</p>
                                <span className={`text-xs uppercase tracking-wider ${styles.badge}`}>{priority}</span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">{description}</p>
                        </div>
                    </div>
                </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
