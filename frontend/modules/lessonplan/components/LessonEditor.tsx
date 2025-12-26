import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ViewMode } from '../types';
import { Edit3, Eye, Download, Printer, Copy, Check, FileText, Sparkles, FileType } from 'lucide-react';

interface LessonEditorProps {
  content: string;
  setContent: (content: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isGenerating: boolean;
}

const LessonEditor: React.FC<LessonEditorProps> = ({ 
  content, 
  setContent, 
  viewMode, 
  setViewMode,
  isGenerating 
}) => {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to clean content (remove markdown code blocks if AI adds them)
  const getCleanContent = (raw: string) => {
    let cleaned = raw.trim();
    // Remove ```html ... ``` or ``` ... ```
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```[a-z]*\n?/, '').replace(/```$/, '');
    }
    return cleaned.trim();
  };

  const cleanContent = getCleanContent(content);
  
  // Robust HTML detection: looks for HTML tags, not just starting character
  // This handles cases where AI might add a small preamble like "Here is the table:"
  const isHtml = /<table|<div|<h[1-6]|<!DOCTYPE|<html/i.test(cleanContent);

  // Auto-resize textarea
  useEffect(() => {
    if (viewMode === ViewMode.EDIT && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content, viewMode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMD = () => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = "lesson-plan.md";
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
  };

  const handleExportWord = () => {
    // We create a complete HTML document structure that Word interprets correctly as a .doc file.
    // This allows tables, styles, and formatting to be preserved and editable.
    const preHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Lesson Plan</title>
        <style>
          /* Basic styles to ensure the document looks good in Word */
          body { 
            font-family: 'SimSun', 'Songti SC', serif; /* Use a standard Chinese font fallback */
            line-height: 1.5;
          }
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin-bottom: 1em;
          }
          td, th { 
            border: 1px solid #000; 
            padding: 8px 12px; 
            vertical-align: top;
          }
          h1, h2, h3 { color: #2e2e2e; }
        </style>
      </head>
      <body>
    `;
    const postHtml = "</body></html>";
    
    // If it's Markdown, parse it simply for the export, or just wrap it. 
    // Ideally, for the "Format Copying" feature, isHtml is true.
    let contentToExport = cleanContent;
    
    if (!isHtml) {
       // If it's markdown, we wrap it in a container to preserve whitespace slightly better, 
       // but strictly speaking, a Markdown->HTML converter would be better here.
       // For now, we assume this button is most critical for the HTML table mode.
       contentToExport = `<div style="white-space: pre-wrap; font-family: sans-serif;">${cleanContent}</div>`;
    }

    const fullHtml = preHtml + contentToExport + postHtml;

    // Create a Blob with the correct MIME type for Word
    const blob = new Blob(['\ufeff', fullHtml], {
        type: 'application/msword'
    });
    
    // Use URL.createObjectURL for robust large file support
    const url = URL.createObjectURL(blob);
    
    const element = document.createElement("a");
    element.href = url;
    // Naming it .doc ensures Word opens it in compatibility mode and renders HTML
    element.download = `lesson-plan-${new Date().toISOString().slice(0,10)}.doc`;
    document.body.appendChild(element);
    element.click();
    
    // Cleanup
    document.body.removeChild(element);
    URL.revokeObjectURL(url);
  };

  if (!content && !isGenerating) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 p-8 text-center text-gray-500 h-full select-none">
        <div className="max-w-lg animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-10 rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] mb-8 border border-gray-100">
             <div className="flex justify-center gap-4 mb-6">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500">
                  <Sparkles className="w-8 h-8" />
                </div>
             </div>
             <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">智能备课助手</h3>
             <p className="text-gray-500 text-lg leading-relaxed mb-6">
               在左侧上传<b>教案表格图片</b>，AI 将自动识别结构，
               生成完全一致的表格，并支持<b>导出 Word</b>。
             </p>
             <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
               <span className="w-2 h-2 rounded-full bg-gray-300"></span>
               <span>支持制式表格识别</span>
               <span className="w-2 h-2 rounded-full bg-gray-300"></span>
               <span>一键导出 Word</span>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-100/50 overflow-hidden relative">
      {/* Top Toolbar */}
      <div className="h-18 bg-white border-b border-gray-200 flex items-center justify-between px-6 py-3 flex-shrink-0 no-print z-10 sticky top-0 shadow-sm">
        
        {/* Left: View Modes */}
        <div className="flex items-center gap-1 bg-gray-100/80 p-1.5 rounded-lg border border-gray-200/60">
          <button
            onClick={() => setViewMode(ViewMode.EDIT)}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
              viewMode === ViewMode.EDIT 
                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            <Edit3 className="w-4 h-4" /> 
            {isHtml ? '源代码' : '编辑'}
          </button>
          <button
            onClick={() => setViewMode(ViewMode.PREVIEW)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
              viewMode === ViewMode.PREVIEW 
                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            <Eye className="w-4 h-4" /> 预览
          </button>
        </div>

        {/* Right: Export Actions */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-px bg-gray-200 mx-2"></div>
          
          <button 
            onClick={handleCopy}
            className="group flex flex-col items-center justify-center px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-indigo-600"
            title="复制"
          >
            {copied ? <Check className="w-5 h-5 text-green-500 mb-0.5" /> : <Copy className="w-5 h-5 mb-0.5 group-hover:scale-110 transition-transform" />}
            <span className="text-[10px] font-medium leading-none">复制</span>
          </button>

          {/* Conditional Export Buttons based on format */}
          {isHtml ? (
            <button 
              onClick={handleExportWord}
              className="group flex flex-col items-center justify-center px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors text-blue-600 hover:text-blue-700"
              title="导出为 Word"
            >
              <FileType className="w-5 h-5 mb-0.5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium leading-none">Word导出</span>
            </button>
          ) : (
            <button 
              onClick={handleDownloadMD}
              className="group flex flex-col items-center justify-center px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-indigo-600"
              title="导出 Markdown"
            >
              <Download className="w-5 h-5 mb-0.5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium leading-none">Markdown</span>
            </button>
          )}

          <button 
            onClick={handlePrint}
            className="group flex flex-col items-center justify-center px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-indigo-600"
            title="打印"
          >
            <Printer className="w-5 h-5 mb-0.5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium leading-none">打印</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-5xl mx-auto bg-white min-h-[calc(100vh-10rem)] shadow-sm border border-gray-200/80 rounded-xl print-only page-container overflow-hidden">
          
          {viewMode === ViewMode.EDIT ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isGenerating}
              className={`w-full h-full min-h-[800px] p-10 md:p-14 focus:outline-none text-gray-800 text-sm md:text-base leading-loose resize-none font-mono
                ${isGenerating ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'bg-transparent'}`}
              placeholder="内容..."
              spellCheck={false}
            />
          ) : (
            <div className="p-10 md:p-14">
               {/* Add a subtle indicator if generating */}
               {isGenerating && (
                 <div className="flex items-center gap-2 text-indigo-600 mb-6 animate-pulse">
                   <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                   <span className="text-sm font-medium">AI 正在撰写中...</span>
                 </div>
               )}
               
               {/* Conditional Rendering: HTML or Markdown */}
               {isHtml ? (
                 <div 
                   className="w-full overflow-x-auto prose prose-slate max-w-none"
                   // Allow rendering of the table structure generated by AI
                   dangerouslySetInnerHTML={{ __html: cleanContent }}
                 />
               ) : (
                 <div className="prose prose-slate prose-lg max-w-none">
                   <ReactMarkdown>{content}</ReactMarkdown>
                 </div>
               )}
            </div>
          )}
          
        </div>
        <div className="text-center mt-6 mb-2 text-gray-400 text-xs no-print flex items-center justify-center gap-1">
          TeacherAI Generated Content <span className="w-1 h-1 rounded-full bg-gray-300"></span> Check for accuracy
        </div>
      </div>
    </div>
  );
};

export default LessonEditor;