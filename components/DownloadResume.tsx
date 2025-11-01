import React, { useState } from 'react';
import { Button } from './Button';
import { getStyledResumeHtml, getResumeStyles, renderResumeToHtml } from './resumeUtils';

interface DownloadResumeProps {
  resumeText: string;
}

// Declare globals for libraries loaded via script tags
declare const jspdf: any;
declare const html2canvas: any;

export const DownloadResume: React.FC<DownloadResumeProps> = ({ resumeText }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePreview = () => {
    if (!resumeText) return;
    const htmlContent = getStyledResumeHtml(resumeText);
    const previewWindow = window.open();
    if (previewWindow) {
      previewWindow.document.write(htmlContent);
      previewWindow.document.close();
    } else {
      alert('Please allow popups for this site to preview your resume.');
    }
  };
  
  const handleDownload = async () => {
    if (!resumeText) return;
    if (typeof jspdf === 'undefined' || typeof html2canvas === 'undefined') {
        alert('PDF generation libraries are not available. Please try again in a moment or use the Preview option.');
        console.error("jsPDF or html2canvas not loaded");
        return;
    }

    setIsDownloading(true);
    const renderContainer = document.createElement('div');
    
    try {
        const { jsPDF } = jspdf;
        
        // Position it invisibly on the page to ensure it's part of the render tree
        renderContainer.style.position = 'absolute';
        renderContainer.style.top = '0';
        renderContainer.style.left = '0';
        renderContainer.style.width = '8.5in'; 
        renderContainer.style.zIndex = '-1';
        renderContainer.style.opacity = '0';
        document.body.appendChild(renderContainer);

        const resumeHtml = renderResumeToHtml(resumeText, false);
        const styles = getResumeStyles();
        
        renderContainer.innerHTML = `<style>${styles}</style>${resumeHtml}`;
        
        const resumeElementToCapture = renderContainer.querySelector('.resume-container');
        if (!resumeElementToCapture) {
            throw new Error("Could not find resume element to render.");
        }

        // Add a small delay to ensure all content (like web fonts) has rendered
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(resumeElementToCapture as HTMLElement, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'letter'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('resume.pdf');

    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Sorry, there was an error generating the PDF. Please try the preview option instead.");
    } finally {
        if (renderContainer.parentNode) {
            renderContainer.parentNode.removeChild(renderContainer);
        }
        setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
        <Button
            onClick={handlePreview}
            disabled={!resumeText || isDownloading}
            className="w-full"
        >
            Preview Resume
        </Button>
        <Button
            onClick={handleDownload}
            disabled={!resumeText || isDownloading}
            isLoading={isDownloading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300"
        >
            {isDownloading ? 'Generating PDF...' : 'Download as PDF'}
        </Button>
    </div>
  );
};