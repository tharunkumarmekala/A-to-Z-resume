import React from 'react';
import { ResumeTemplate } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from './Button';
import { ResumePreview } from './ResumePreview';

interface HomePageProps {
  onStartFromScratch: () => void;
  templates: ResumeTemplate[] | null;
  isLoading: boolean;
  onUseTemplate: (content: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onStartFromScratch, templates, isLoading, onUseTemplate }) => {
  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16 md:py-24 text-center">
        <h2 className="text-4xl md:text-6xl font-extrabold text-gray-800 leading-tight">
          Still crafting your resume by hand? <br className="hidden md:block" />
          <span className="text-indigo-600">It's 2025.</span>
        </h2>
        <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
          Supercharge your job hunt with our suite of AI-powered tools. From optimization to ATS checking, we help you build a resume that lands interviews.
        </p>
        <button onClick={onStartFromScratch} className="mt-10 px-8 py-4 bg-indigo-600 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-105 transition-all">
          Start From Scratch
        </button>
      </main>

      {/* Template Preview Section */}
      <section id="templates" className="py-20 bg-white">
        <div className="container mx-auto px-6 text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800">Or, Get a Head Start with a Template</h3>
            <p className="text-gray-600 mt-2 mb-12">No resume? No problem. Choose a professionally designed, ATS-friendly template to begin.</p>
            {isLoading ? (
                <div className="flex justify-center">
                    <LoadingSpinner size="lg" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
                    {(templates || []).slice(0, 5).map((template) => (
                        <div key={template.name} className="flex flex-col border border-gray-200 rounded-lg bg-white shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                           <div className="p-6">
                             <h4 className="font-bold text-xl text-indigo-700 truncate">{template.name}</h4>
                           </div>
                            <div className="px-6 pb-2 flex-grow min-h-0">
                                <div className="h-96 border rounded-lg overflow-y-scroll bg-gray-200 shadow-inner">
                                    <div className="bg-white p-8">
                                        <ResumePreview resumeText={template.content} />
                                    </div>
                                </div>
                            </div>
                           <div className="p-6 bg-gray-50 rounded-b-lg mt-auto">
                               <Button onClick={() => onUseTemplate(template.content)} className="w-full">
                                    Use This Resume
                               </Button>
                           </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </section>
    </div>
  );
};