import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { renderResumeToHtml, getResumeStyles } from './resumeUtils';


interface ResumePreviewProps {
  resumeText: string;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ resumeText }) => {
    const bodyHtml = useMemo(() => renderResumeToHtml(resumeText), [resumeText]);
    const styles = useMemo(() => getResumeStyles(), []);

    if (!resumeText) {
        return <p className="text-center text-gray-400 p-8">Upload or select a template to see a live preview.</p>;
    }

    return (
        <>
            <style>{styles}</style>
            <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        </>
    );
};

export const TemplatePreviewContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    const contentWidth = 816; // Based on 8.5in at 96dpi

    useLayoutEffect(() => {
        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width } = entry.contentRect;
                if (width > 0) {
                    setScale(width / contentWidth);
                }
            }
        });

        const currentRef = containerRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [contentWidth]);

    return (
        <div
            ref={containerRef}
            className="aspect-[8.5/11] w-full overflow-hidden"
        >
            <div
                className="transform origin-top-left pointer-events-none"
                style={{
                    transform: `scale(${scale})`,
                    width: `${contentWidth}px`,
                }}
            >
                {children}
            </div>
        </div>
    );
};