

const applyInlineMarkdown = (text: string): string => {
    // Sanitize first
    const sanitized = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return sanitized
        .replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>')
        .replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>');
};

export const parseResumeContent = (content: string): string => {
    if (!content) return '';
    
    const lines = content.trim().split('\n');
    const processedLines: string[] = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
        const trimmedLine = lines[i].trim();
        
        if (!trimmedLine) {
            if (inList) {
                processedLines.push('</ul>');
                inList = false;
            }
            continue;
        }

        if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
            if (!inList) {
                processedLines.push('<ul class="content-list">');
                inList = true;
            }
            processedLines.push(`<li>${applyInlineMarkdown(trimmedLine.substring(2))}</li>`);
        } else { // It's not a list item
            if (inList) {
                processedLines.push('</ul>');
                inList = false;
            }
            
            // Check for the multi-line entry pattern (e.g., Experience, Education)
            const nextLine = lines[i + 1]?.trim();

            // Pattern: Current line is text, next line is also text (often italicized/containing '|') and is NOT a list item.
            // This identifies things like "Company Name" followed by "*Role | Date*".
            if (nextLine && !nextLine.startsWith('* ') && !nextLine.startsWith('- ')) {
                 // Heuristic check if the next line is a date/role line vs another paragraph
                const isRoleLine = nextLine.includes('|') || (nextLine.startsWith('*') && nextLine.endsWith('*')) || (nextLine.startsWith('_') && nextLine.endsWith('_'));
                // And check that it's not followed immediately by a list, which would make the current line a subheading.
                const nextNextLine = lines[i + 2]?.trim();
                const isFollowedByList = nextNextLine?.startsWith('* ') || nextNextLine?.startsWith('- ');

                if (isRoleLine && !isFollowedByList) {
                    processedLines.push(`<div class="entry">`);
                    processedLines.push(`<p class="entry-primary">${applyInlineMarkdown(trimmedLine)}</p>`);
                    processedLines.push(`<p class="entry-secondary">${applyInlineMarkdown(nextLine)}</p>`);
                    processedLines.push(`</div>`);
                    i++; // Skip the next line since we've processed it.
                    continue;
                }
            }

            // Heuristic: A non-list line followed by a list is a subheading for that list.
            let isSubheading = false;
            for (let j = i + 1; j < lines.length; j++) {
                const futureLineTrimmed = lines[j].trim();
                if (futureLineTrimmed) {
                    isSubheading = futureLineTrimmed.startsWith('* ') || futureLineTrimmed.startsWith('- ');
                    break;
                }
            }
            
            const lineHtml = applyInlineMarkdown(trimmedLine);
            if (isSubheading) {
                processedLines.push(`<p class="subheading">${lineHtml}</p>`);
            } else {
                processedLines.push(`<p>${lineHtml}</p>`);
            }
        }
    }

    if (inList) {
        processedLines.push('</ul>');
    }
    
    return processedLines.join('\n');
};

interface ResumeSection {
    title: string;
    content: string;
    level: number;
}

export interface ParsedResume {
    header: string;
    sections: ResumeSection[];
}

export const parseResumeText = (markdown: string): ParsedResume => {
    const lines = markdown.split('\n');
    let headerLines: string[] = [];
    let sections: ResumeSection[] = [];
    let currentSectionContent: string[] = [];
    let currentSectionTitle = '';
    let currentLevel = 0;

    let headerParsed = false;

    for (const line of lines) {
        const trimmedLine = line.trim();
        const match = trimmedLine.match(/^(#{1,3})\s+(.*)/);

        if (match) {
            headerParsed = true;
            if (currentSectionTitle) {
                sections.push({ title: currentSectionTitle, content: currentSectionContent.join('\n'), level: currentLevel });
            }
            currentLevel = match[1].length;
            currentSectionTitle = match[2];
            currentSectionContent = [];
        } else {
            if (!headerParsed) {
                headerLines.push(line);
            } else {
                currentSectionContent.push(line);
            }
        }
    }
    
    if (currentSectionTitle) {
        sections.push({ title: currentSectionTitle, content: currentSectionContent.join('\n'), level: currentLevel });
    }
    
    if (sections.length === 0 && headerLines.length > 0) {
       return { header: headerLines.join('\n'), sections: [] };
    }

    return { header: headerLines.join('\n'), sections };
};

export const getResumeStyles = (): string => {
    return `
    <style>
      body, .resume-container { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
        font-size: 10.5pt;
        line-height: 1.5; 
        color: #2d3748; 
        background-color: transparent; 
        margin: 0; 
        padding: 0; 
        overflow-wrap: break-word;
      }
      .resume-container { 
        padding: 2.5rem;
        box-sizing: border-box;
        background-color: #fff;
        margin: 2rem auto;
        max-width: 8.5in;
        min-height: 11in;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
      }
      .resume-container.preview-mode {
        padding: 0;
        margin: 0;
        max-width: 100%;
        min-height: 0;
        box-shadow: none;
        background-color: transparent;
      }
      /* HEADER */
      header { 
        text-align: left; 
        margin-bottom: 1.5rem;
        border-bottom: 1px solid #cbd5e0;
        padding-bottom: 1rem;
      }
      header h1 {
        font-size: 2.2rem;
        font-weight: 800;
        color: #1a202c;
        line-height: 1.1;
        margin: 0;
        text-transform: uppercase;
      }
      header p {
        font-size: 0.9rem;
        color: #4a5568;
        margin-top: 0.5rem;
      }
      /* SECTIONS */
      .sections-wrapper > section {
          margin-bottom: 1.5rem;
      }
      section h2 {
        font-size: 1rem;
        font-weight: 700;
        color: #2c5282;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding-left: 0.75rem;
        border-left: 3px solid #2c5282;
        margin-bottom: 1rem;
      }
      /* CONTENT */
      .content p {
        margin: 0 0 0.5rem 0;
      }
      .content .subheading {
        font-weight: 500; /* Medium weight for project titles, certs, etc. */
        color: #1a202c;
        margin: 0.75rem 0 0.25rem 0;
      }
      .content .subheading:first-child {
        margin-top: 0;
      }
       .content .entry {
        margin-bottom: 0.75rem;
      }
      .content .entry-primary {
        font-weight: 600;
        color: #1a202c;
        margin: 0;
      }
      .content .entry-secondary {
        color: #4a5568;
        margin: 0.1rem 0 0 0;
      }
      .content-list {
        list-style-type: none;
        padding-left: 1.25rem;
        margin: 0.5rem 0 0 0;
      }
      .content-list li {
        margin-bottom: 0.25rem;
        position: relative;
      }
      .content-list li::before {
        content: '•';
        position: absolute;
        left: -1.25rem;
        color: #2c5282;
        font-weight: bold;
      }
      strong {
        font-weight: 600;
        color: #1a202c;
      }
      em {
        font-style: italic;
      }
      @media print {
        body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            background-color: #fff !important; 
            font-size: 9.5pt;
            line-height: 1.35;
        }
        .print-hide { display: none !important; }
        @page { 
            margin: 0; 
            size: letter; 
        }
        .resume-container { 
            padding: 2rem !important;
            margin: 0 !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            width: 8.5in !important;
            height: 11in !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
        }
        header {
            margin-bottom: 1rem !important;
            padding-bottom: 0.75rem !important;
        }
        header h1 {
            font-size: 2rem !important;
        }
        header p {
            font-size: 0.8rem !important;
        }
        section h2 {
            font-size: 0.9rem !important;
            margin-bottom: 0.6rem !important;
        }
        .sections-wrapper > section {
            margin-bottom: 1rem !important;
        }
      }
    </style>
    `;
};

export const renderResumeToHtml = (markdown: string, isPreviewMode: boolean = true): string => {
    if (!markdown) return '';
    const { header, sections } = parseResumeText(markdown);
    const headerParts = header.split('\n').filter(line => line.trim() !== '');
    const name = headerParts[0] || '';
    const contactInfo = headerParts.slice(1).map(applyInlineMarkdown);

    const headerHtml = name ? `
        <header>
            <h1>${applyInlineMarkdown(name)}</h1>
            ${contactInfo.length > 0 ? `<p>${contactInfo.join(' | ')}</p>` : ''}
        </header>
    ` : '';
    
    const sectionsHtml = sections.map(section => `
        <section>
            <h2>${applyInlineMarkdown(section.title)}</h2>
            <div class="content">${parseResumeContent(section.content)}</div>
        </section>
    `).join('');

    const fallbackHtml = (sections.length === 0 && !name) ? `<div class="content">${parseResumeContent(markdown)}</div>` : '';
    
    const containerClass = isPreviewMode ? "resume-container preview-mode" : "resume-container";

    return `
        <div class="${containerClass}">
            ${headerHtml}
            <div class="sections-wrapper">
                ${sectionsHtml}
            </div>
            ${fallbackHtml}
        </div>
    `;
};


export const getStyledResumeHtml = (markdown: string): string => {
    const bodyContent = renderResumeToHtml(markdown, false);

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Resume</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      ${getResumeStyles()}
    </head>
    <body>
      <div class="print-hide" style="position: sticky; top: 0; background: white; padding: 1rem; border-bottom: 1px solid #e2e8f0; text-align: center; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <p style="margin: 0 0 0.75rem 0; font-size: 0.9rem; color: #4a5568;">Use your browser's print function (Ctrl/Cmd + P) to save as a PDF.</p>
        <button onclick="window.print()" style="padding: 0.5rem 1.5rem; background-color: #4f46e5; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: bold; font-size: 1rem; transition: background-color 0.2s;">
          Print / Save as PDF
        </button>
      </div>
      ${bodyContent}
    </body>
    </html>
  `;
};