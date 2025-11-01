import React, { useState, useCallback, useRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface FileUploadProps {
  onFileUpload: (content: string) => void;
  acceptedFileTypes?: string;
}

declare const pdfjsLib: any;
declare const mammoth: any;

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, acceptedFileTypes = '.pdf,.docx,.txt,.md' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileRead = async (file: File) => {
    setError(null);
    setFileName(null);
    setIsParsing(true);

    try {
      let content = '';
      if (file.type === 'text/plain' || file.type === 'text/markdown') {
        content = await file.text();
      } else if (file.type === 'application/pdf') {
        if (typeof pdfjsLib === 'undefined') {
          throw new Error('PDF parsing library is not loaded.');
        }
        const reader = new FileReader();
        const data = await new Promise<ArrayBuffer>((resolve, reject) => {
            reader.onload = e => resolve(e.target?.result as ArrayBuffer);
            reader.onerror = err => reject(err);
            reader.readAsArrayBuffer(file);
        });
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        let textContent = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            textContent += text.items.map((item: any) => item.str).join(' ');
            textContent += '\n';
        }
        content = textContent;
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        if (typeof mammoth === 'undefined') {
          throw new Error('DOCX parsing library is not loaded.');
        }
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
      } else {
        throw new Error(`Unsupported file type. Please use PDF, DOCX, TXT, or MD.`);
      }

      onFileUpload(content);
      setFileName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileRead(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [onFileUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileRead(e.target.files[0]);
    }
  };

  return (
    <div>
        <label className="mb-2 font-semibold text-gray-700 block">Upload Resume</label>
        <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center w-full min-h-[12rem] border-2 border-dashed rounded-lg transition-colors p-4
                ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50'}`}
        >
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept={acceptedFileTypes}
                aria-label="File upload"
                disabled={isParsing}
            />
             <div className="flex flex-col items-center justify-center text-center">
                {isParsing ? (
                    <>
                        <LoadingSpinner />
                        <p className="mt-2 text-sm text-gray-600">Parsing your resume...</p>
                    </>
                ) : (
                    <>
                        <svg className="mx-auto h-10 w-10 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">
                            Drag and drop resume here
                        </p>
                        {fileName && !error ? (
                            <p className="text-sm font-semibold text-green-600 truncate mt-2">Loaded: {fileName}</p>
                        ) : (
                           <p className="text-xs text-gray-500 mt-1">PDF, DOCX, TXT, or MD</p>
                        )}
                         <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isParsing}
                            className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm disabled:bg-indigo-300"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            {fileName ? 'Upload Another' : 'Choose File'}
                        </button>
                    </>
                )}
            </div>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};