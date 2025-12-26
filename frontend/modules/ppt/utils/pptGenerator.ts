
import PptxGenJS from "pptxgenjs";
import mermaid from "mermaid";

/**
 * Markdown -> PPTX 导出：
 * - 解析 Markdown（标题、列表、图片、mermaid、<!-- Note: ... --> 备注）为内部结构。
 * - 用 PptxGenJS 绘制标题、内容、图片，mermaid 转 PNG，备注写入 slide notes。
 * - 支持 16:9 版式，保留简洁样式，离线导出可用。
 */

// Initialize mermaid for offline/export context
mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
});

interface ParsedSlide {
  title: string;
  content: string[];
  images: string[];
  mermaidCode?: string;
  notes?: string;
}

const parseMarkdownWithDelimiters = (markdown: string): ParsedSlide[] => {
  const rawSlides = markdown.split(/\n\s*---\s*\n/);
  
  return rawSlides.map((rawSlide) => {
    const lines = rawSlide.trim().split("\n");
    let title = "";
    const content: string[] = [];
    const images: string[] = [];
    let mermaidCode = "";
    let notes = "";
    let inCodeBlock = false;
    let codeBlockLang = "";
    let codeBuffer = "";
    
    lines.forEach((line) => {
      const trimmed = line.trim();
      
      // Code Block Handling
      if (trimmed.startsWith('```')) {
          if (!inCodeBlock) {
              inCodeBlock = true;
              codeBlockLang = trimmed.replace('```', '').trim();
          } else {
              inCodeBlock = false;
              if (codeBlockLang === 'mermaid') {
                  mermaidCode = codeBuffer.trim();
              }
              codeBuffer = "";
          }
          return;
      }

      if (inCodeBlock) {
          codeBuffer += line + "\n";
          return;
      }

      // Notes
      if (trimmed.startsWith('<!-- Note:')) {
          notes = trimmed.replace('<!-- Note:', '').replace('-->', '').trim();
          return;
      }
      
      if (trimmed.startsWith("# ")) {
        if (!title) title = trimmed.replace(/^#\s+/, "");
      } else if (trimmed.startsWith("## ") && !title) {
         title = trimmed.replace(/^##\s+/, "");
      } 
      
      const imgMatch = trimmed.match(/!\[(.*?)\]\((.*?)\)/);
      if (imgMatch) {
         images.push(imgMatch[2]);
      } else if (trimmed.length > 0 && !trimmed.startsWith("#") && !trimmed.startsWith("---") && !trimmed.startsWith("<!--")) {
         content.push(trimmed.replace(/^[-*]\s+/, ""));
      }
    });

    return { title, content, images, mermaidCode, notes };
  });
};

/**
 * Converts a Mermaid code string to a Base64 Image URL.
 */
const mermaidToImage = async (code: string): Promise<string | null> => {
    const id = `mermaid-export-${Math.random().toString(36).substr(2, 9)}`;
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '800px'; 
    document.body.appendChild(tempDiv);

    try {
        const { svg } = await mermaid.render(id, code);
        tempDiv.innerHTML = svg;
        const svgElement = tempDiv.querySelector('svg');
        if (!svgElement) return null;

        // 保持导出简单：直接使用 SVG Data URL，避免 canvas 跨域污染导致 SecurityError
        const width = 800;
        const height = 600;
        svgElement.setAttribute('width', `${width}px`);
        svgElement.setAttribute('height', `${height}px`);

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
        const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

        document.body.removeChild(tempDiv);
        return dataUrl;
    } catch (e) {
        console.error("Export Diagram Failed:", e);
        document.body.removeChild(tempDiv);
        return null;
    }
};

export const generatePPTX = async (markdown: string) => {
  try {
    const pres = new PptxGenJS();
    pres.layout = "LAYOUT_16x9";
    pres.author = "Gemini AI Lesson Planner";
    pres.title = "AI Generated Lesson Plan";
    
    const slides = parseMarkdownWithDelimiters(markdown);

    for (const s of slides) {
      try {
        const slide = pres.addSlide();
        
        // Add Notes
        if (s.notes) {
            slide.addNotes(s.notes);
        }
        
        // Title
        if (s.title) {
           slide.addText(s.title, { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 32, bold: true, color: '363636' });
        }
        
        let currentY = 1.8;
        
        // Diagram Logic
        if (s.mermaidCode) {
            try {
                const base64Img = await mermaidToImage(s.mermaidCode);
                if (base64Img) {
                    slide.addImage({ 
                        data: base64Img, 
                        x: 1, y: currentY, w: 8, h: 4.5, 
                        sizing: { type: 'contain', w: 8, h: 4.5 } 
                    });
                    continue; 
                }
            } catch (err) {
                slide.addText("Error rendering diagram", { x: 1, y: 3, color: 'FF0000' });
            }
        }

        // Content (Left side if image exists, else full width)
        const hasImage = s.images.length > 0;
        const textWidth = hasImage ? '50%' : '90%';
        
        if (s.content.length > 0) {
           const textItems = s.content.map(t => ({ text: t, options: { breakLine: true, bullet: true } }));
           slide.addText(textItems, { x: 0.5, y: currentY, w: textWidth, h: 4, fontSize: 18, color: '666666', lineSpacing: 32 });
        }
        
        // Images (Right side)
        if (hasImage) {
           s.images.forEach((url, idx) => {
               if (idx === 0) {
                   // 防止外链图片失败中断导出，单独 try/catch
                   try {
                     slide.addImage({ 
                         path: url, 
                         x: s.content.length > 0 ? 5.5 : 0.5, 
                         y: currentY, 
                         w: 4.5, 
                         h: 3.5, 
                         sizing: { type: 'contain', w: 4.5, h: 3.5 } 
                     });
                   } catch (imgErr) {
                     slide.addText("Image load failed", { x: 5.5, y: currentY, color: 'FF0000', fontSize: 12 });
                   }
               }
           });
        }
      } catch (slideErr) {
        // 单页出错不阻断整体导出
        const fallback = pres.addSlide();
        fallback.addText(`Slide export failed: ${slideErr}`, { x: 0.5, y: 2, color: 'FF0000', w: 9, h: 1.5 });
      }
    }

    await pres.writeFile({ fileName: "教学课件.pptx" });
  } catch (e) {
    console.error("PPT export failed", e);
    alert(`导出失败：${e && (e as any).message ? (e as any).message : e}`);
  }
};
