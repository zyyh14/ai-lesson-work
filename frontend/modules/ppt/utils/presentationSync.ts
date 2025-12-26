
import { Presentation, Slide, SlideTheme } from "../types";

/**
 * Markdown <-> Presentation 同步工具：
 * - markdownToPresentation：解析标题、列表、图片、mermaid、<!-- Note: ... --> 备注为内部结构。
 * - presentationToMarkdown：将内部结构回写为 Markdown，保持分隔符与备注格式一致。
 * - 让前端编辑、AI 修改、PPT 导出使用统一数据协议。
 */

// Default Theme
export const DEFAULT_THEME: SlideTheme = {
  id: 'default',
  name: 'Minimal White',
  backgroundColor: '#ffffff',
  titleColor: '#1e293b', // slate-800
  textColor: '#475569',  // slate-600
  accentColor: '#4f46e5', // indigo-600
  fontFamily: 'sans-serif'
};

/**
 * Sync Engine: Markdown -> JSON Presentation Object
 */
export const markdownToPresentation = (markdown: string): Presentation => {
  const lines = markdown.split('\n');
  const slides: Slide[] = [];
  let currentSlide: Partial<Slide> = { content: [] };
  let isParsingStarted = false;
  let inCodeBlock = false;
  let codeBlockContent = "";
  let codeBlockLang = "";

  // Generate a simple ID
  const genId = () => Math.random().toString(36).substr(2, 9);

  const pushSlide = () => {
    // Determine type automatically if not set
    let type: Slide['type'] = 'content';
    if (currentSlide.image) type = 'two-column';
    if (currentSlide.mermaidCode) type = 'diagram';
    if (!currentSlide.content?.length && !currentSlide.image && !currentSlide.mermaidCode && currentSlide.title) type = 'title';

    if (currentSlide.title || (currentSlide.content && currentSlide.content.length > 0) || currentSlide.image || currentSlide.mermaidCode) {
      slides.push({
        id: genId(),
        type: type,
        title: currentSlide.title || 'Untitled Slide',
        content: currentSlide.content || [],
        image: currentSlide.image,
        notes: currentSlide.notes,
        mermaidCode: currentSlide.mermaidCode
      });
    }
    currentSlide = { content: [] };
  };

  lines.forEach(line => {
    // Robust trimming strictly for control flow, keep indentation for code
    const trimmed = line.trim();

    // Slide Separator
    if (trimmed === '---' && !inCodeBlock) {
      if (isParsingStarted) pushSlide();
      isParsingStarted = true;
      return;
    }

    // Handle Code Blocks
    if (trimmed.startsWith('```')) {
        if (!inCodeBlock) {
            inCodeBlock = true;
            codeBlockLang = trimmed.replace('```', '').trim();
            codeBlockContent = "";
        } else {
            inCodeBlock = false;
            // Check if it was mermaid
            if (codeBlockLang === 'mermaid') {
                currentSlide.mermaidCode = codeBlockContent.trim();
            } else {
                // Treat other code as content text
                currentSlide.content?.push(`\`\`\`${codeBlockLang}\n${codeBlockContent}\`\`\``);
            }
        }
        return;
    }

    if (inCodeBlock) {
        codeBlockContent += line + "\n";
        return;
    }

    // Speaker Notes (<!-- Note: ... -->)
    if (trimmed.startsWith('<!-- Note:')) {
        const noteContent = trimmed.replace('<!-- Note:', '').replace('-->', '').trim();
        currentSlide.notes = noteContent;
        return;
    }

    // Title (# )
    if (trimmed.startsWith('# ')) {
      if (!isParsingStarted) isParsingStarted = true;
      currentSlide.title = trimmed.replace(/^#\s+/, '');
    }
    // Subtitle / H2
    else if (trimmed.startsWith('## ')) {
      if (!currentSlide.title) {
        currentSlide.title = trimmed.replace(/^##\s+/, '');
      } else {
        currentSlide.content?.push(`**${trimmed.replace(/^##\s+/, '')}**`);
      }
    }
    // Image (![])
    else if (trimmed.match(/!\[(.*?)\]\((.*?)\)/)) {
      const match = trimmed.match(/!\[(.*?)\]\((.*?)\)/);
      if (match) currentSlide.image = match[2];
    }
    // Bullet Points
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      currentSlide.content?.push(trimmed.replace(/^[-*]\s+/, ''));
    }
    // Plain text
    else if (trimmed.length > 0 && !trimmed.startsWith('<!--')) {
       currentSlide.content?.push(trimmed);
    }
  });

  // Push last slide
  pushSlide();

  if (slides.length === 0) {
      return { title: "New Presentation", theme: DEFAULT_THEME, slides: [] };
  }

  return {
    title: slides[0].title || "Presentation",
    theme: DEFAULT_THEME, 
    slides
  };
};

/**
 * Sync Engine: JSON Presentation Object -> Markdown
 */
export const presentationToMarkdown = (pres: Presentation): string => {
  return pres.slides.map(slide => {
    let md = "";
    
    // Title
    if (slide.title) md += `# ${slide.title}\n\n`;
    
    // Mermaid Diagram
    if (slide.mermaidCode) {
        md += '```mermaid\n';
        md += slide.mermaidCode;
        md += '\n```\n\n';
    }

    // Content
    if (slide.content && slide.content.length > 0) {
      md += slide.content.map(c => {
          // If it looks like a code block stored in content, don't prefix with bullet
          if (c.startsWith('```')) return c;
          return `- ${c}`;
      }).join('\n');
      md += '\n\n';
    }
    
    // Image
    if (slide.image) {
      md += `![Image](${slide.image})\n\n`;
    }

    // Notes
    if (slide.notes) {
        md += `<!-- Note: ${slide.notes} -->\n`;
    }

    return md.trim();
  }).join('\n\n---\n\n');
};
