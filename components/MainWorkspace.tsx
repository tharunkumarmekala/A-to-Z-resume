
import React from 'react';
import { ResumePreview, TemplatePreviewContainer } from './ResumePreview';
import { DownloadResume } from './DownloadResume';
import { LoadingSpinner } from './LoadingSpinner';

interface MainWorkspaceProps {
  resumeText: string;
  isLoading?: boolean;
}

export const MainWorkspace: React.FC<MainWorkspaceProps> = ({ resumeText, isLoading }) => {
    const mainClass = "flex-1 flex flex-col items-center min-w-0";

    return (
        <main className={mainClass}>
            {isLoading ? (
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                        <LoadingSpinner size="lg" />
                        <p className="mt-4 text-gray-600 font-semibold">AI is structuring your resume...</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="w-full max-w-4xl mb-6 flex-shrink-0">
                        <DownloadResume resumeText={resumeText} />
                    </div>
                    <div className="w-full max-w-4xl flex-grow flex justify-center items-start min-h-0">
                       <div className="w-full">
                           <TemplatePreviewContainer>
                                <div className="w-[816px] h-[1056px]">
                                    <ResumePreview resumeText={resumeText} />
                                </div>
                            </TemplatePreviewContainer>
                       </div>
                    </div>
                </>
            )}
        </main>
    );
};
