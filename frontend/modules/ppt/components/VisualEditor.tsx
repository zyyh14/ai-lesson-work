
import React, { useState } from 'react';
import { Slide, SlideTheme } from '../types';
import { Trash2, Plus, Image as ImageIcon, Code, X, Check, Layout, Mic, AlignLeft, Square, Columns } from 'lucide-react';
import MermaidRenderer from './MermaidRenderer';

/**
 * 幻灯片可视化编辑器：
 * - 支持选择/新增/删除幻灯片，编辑标题、列表、图片、Mermaid 图。
 * - 底部提供“演讲者备注”面板，直接写入 slide.notes（用于导出/演讲者模式）。
 * - 以 props 方式回调更新，保持与 Markdown/AI 同步。
 */

interface VisualEditorProps {
  slides: Slide[];
  currentSlideIndex: number;
  theme: SlideTheme;
  onUpdateSlide: (index: number, updatedSlide: Slide) => void;
  onDeleteSlide: (index: number) => void;
  onAddSlide: (index: number) => void;
  onSelectSlide: (index: number) => void;
}

const VisualEditor: React.FC<VisualEditorProps> = ({
  slides,
  currentSlideIndex,
  theme,
  onUpdateSlide,
  onDeleteSlide,
  onAddSlide,
  onSelectSlide
}) => {
  const [editingDiagram, setEditingDiagram] = useState<boolean>(false);
  const [tempMermaidCode, setTempMermaidCode] = useState<string>("");
  const [showNotes, setShowNotes] = useState(true);
  
  if (!slides || slides.length === 0) {
      return <div className="flex items-center justify-center h-full text-slate-400">暂无幻灯片，请让 AI 生成或手动添加。</div>;
  }

  const slide = slides[currentSlideIndex];

  // --- Handlers ---

  const handleTitleBlur = (e: React.FocusEvent<HTMLHeadingElement>) => {
    if (e.currentTarget.innerText !== slide.title) {
      onUpdateSlide(currentSlideIndex, { ...slide, title: e.currentTarget.innerText });
    }
  };

  const handleContentBlur = (index: number, e: React.FocusEvent<HTMLParagraphElement>) => {
     const newContent = [...slide.content];
     newContent[index] = e.currentTarget.innerText;
     onUpdateSlide(currentSlideIndex, { ...slide, content: newContent });
  };

  const handleDeleteLine = (contentIndex: number) => {
      const newContent = slide.content.filter((_, i) => i !== contentIndex);
      onUpdateSlide(currentSlideIndex, { ...slide, content: newContent });
  }

  const handleAddLine = () => {
      const newContent = [...slide.content, "点击编辑新内容"];
      onUpdateSlide(currentSlideIndex, { ...slide, content: newContent });
  }

  const handleDiagramClick = () => {
      setTempMermaidCode(slide.mermaidCode || "graph TD;\nA-->B;");
      setEditingDiagram(true);
  }

  const saveDiagram = () => {
      onUpdateSlide(currentSlideIndex, { ...slide, mermaidCode: tempMermaidCode });
      setEditingDiagram(false);
  }

  const changeLayout = (type: Slide['type']) => {
      // Logic to preserve data when switching types would go here
      // For now, we just switch the type marker and data structure adaptations
      let updates: Partial<Slide> = { type };
      
      if (type === 'diagram' && !slide.mermaidCode) {
          updates.mermaidCode = "graph TD;\n  A[Start] --> B[End];";
      }
      if (type === 'two-column' && !slide.image) {
          updates.image = "https://picsum.photos/seed/slide/800/600";
      }
      
      onUpdateSlide(currentSlideIndex, { ...slide, ...updates });
  }

  const updateNotes = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onUpdateSlide(currentSlideIndex, { ...slide, notes: e.target.value });
  }

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 overflow-hidden relative">
      
      {/* Diagram Editor Modal */}
      {editingDiagram && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-8">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-700 flex items-center gap-2"><Code size={18}/> 编辑图表代码 (Mermaid)</h3>
                      <button onClick={() => setEditingDiagram(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-0 flex-1 h-[400px]">
                      <textarea
                          value={tempMermaidCode}
                          onChange={(e) => setTempMermaidCode(e.target.value)}
                          className="w-full h-full p-4 font-mono text-sm bg-slate-900 text-green-400 resize-none focus:outline-none"
                          spellCheck={false}
                      />
                  </div>
                  <div className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
                      <button onClick={() => setEditingDiagram(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">取消</button>
                      <button onClick={saveDiagram} className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-2 transition-colors">
                          <Check size={16} /> 保存更改
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Main Workspace Area (Top) */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden p-8 pb-0">
          
          {/* Canvas Wrapper */}
          <div 
            className="group aspect-video w-full max-w-5xl bg-white shadow-2xl rounded-lg relative flex flex-col overflow-hidden transition-all ring-1 ring-slate-900/5"
            style={{ backgroundColor: theme.backgroundColor }}
          >
             {/* Slide Type Indicator / Layout Switcher Overlay */}
             <div className="absolute top-4 left-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1.5 rounded-lg shadow-sm border border-slate-100 backdrop-blur-sm">
                 <button 
                    onClick={() => changeLayout('title')}
                    className={`p-1.5 rounded hover:bg-slate-100 ${slide.type === 'title' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    title="封面 / 标题页"
                 >
                     <Square size={18} />
                 </button>
                 <button 
                    onClick={() => changeLayout('content')}
                    className={`p-1.5 rounded hover:bg-slate-100 ${slide.type === 'content' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    title="正文页"
                 >
                     <AlignLeft size={18} />
                 </button>
                 <button 
                    onClick={() => changeLayout('two-column')}
                    className={`p-1.5 rounded hover:bg-slate-100 ${slide.type === 'two-column' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    title="图文混排"
                 >
                     <Columns size={18} />
                 </button>
                 <button 
                    onClick={() => changeLayout('diagram')}
                    className={`p-1.5 rounded hover:bg-slate-100 ${slide.type === 'diagram' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    title="图表页"
                 >
                     <Code size={18} />
                 </button>
             </div>

             {/* Action Toolbar Overlay */}
             <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2 z-20">
                <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteSlide(currentSlideIndex); }}
                    className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 shadow-sm border border-red-100 transition-colors"
                    title="删除当前页"
                >
                    <Trash2 size={18} />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onAddSlide(currentSlideIndex + 1); }}
                    className="p-2 bg-indigo-50 text-indigo-500 rounded-full hover:bg-indigo-100 shadow-sm border border-indigo-100 transition-colors"
                    title="在后方插入新页"
                >
                    <Plus size={18} />
                </button>
             </div>

             {/* Render Content Based on Layout Type */}
             <div className={`flex-1 p-16 flex flex-col relative overflow-hidden ${slide.type === 'title' ? 'items-center justify-center text-center' : ''}`}>
                
                {/* Title */}
                <h1 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={handleTitleBlur}
                    className={`${slide.type === 'title' ? 'text-6xl' : 'text-5xl'} font-bold mb-6 outline-none border-b border-transparent focus:border-indigo-200 transition-colors z-10 relative`}
                    style={{ color: theme.titleColor, fontFamily: theme.fontFamily }}
                >
                    {slide.title}
                </h1>

                {/* Body */}
                {slide.type === 'diagram' && slide.mermaidCode ? (
                    <div className="flex-1 w-full relative group/diagram cursor-pointer" onClick={handleDiagramClick}>
                        <div className="absolute inset-0 z-0">
                             <MermaidRenderer code={slide.mermaidCode} />
                        </div>
                        <div className="absolute inset-0 bg-indigo-50/50 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover/diagram:opacity-100 transition-opacity z-10 border-2 border-indigo-200 border-dashed rounded-xl">
                            <span className="bg-white text-indigo-600 px-4 py-2 rounded-full shadow-md font-medium flex items-center gap-2">
                                <Code size={16} /> 点击编辑图表代码
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className={`flex-1 flex gap-8 z-10 relative w-full ${slide.type === 'title' ? 'hidden' : ''}`}>
                        <div className={`${slide.type === 'two-column' ? 'w-1/2' : 'w-full'} space-y-4`}>
                            {slide.content.map((line, idx) => (
                                <div key={idx} className="group/line flex items-start gap-2 relative pl-2">
                                    <div className="mt-2.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: theme.accentColor }}></div>
                                    <p
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => handleContentBlur(idx, e)}
                                        className="text-2xl outline-none flex-1 py-1 border-l-2 border-transparent focus:border-indigo-300 pl-2 transition-colors"
                                        style={{ color: theme.textColor, fontFamily: theme.fontFamily }}
                                    >
                                        {line.replace(/\*\*/g, '')}
                                    </p>
                                    <button 
                                        onClick={() => handleDeleteLine(idx)}
                                        className="absolute -left-8 top-2 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover/line:opacity-100 transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            <button 
                                onClick={handleAddLine}
                                className="flex items-center gap-2 text-slate-400 hover:text-indigo-500 mt-4 text-sm font-medium px-2 py-1 rounded hover:bg-slate-50 transition-colors"
                            >
                                <Plus size={14} /> 添加内容点
                            </button>
                        </div>

                        {slide.type === 'two-column' && (
                            <div className="w-1/2 flex items-center justify-center relative group/image">
                                {slide.image ? (
                                    <>
                                        <img 
                                            src={slide.image} 
                                            alt="Slide visual" 
                                            className="rounded-lg shadow-lg object-cover max-h-[400px] w-full"
                                        />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity rounded-lg text-white font-medium cursor-pointer">
                                            <ImageIcon size={24} className="mr-2" /> 
                                            更换图片
                                        </div>
                                    </>
                                ) : (
                                     <div className="w-full h-64 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400">
                                         <ImageIcon size={32} className="mb-2"/>
                                         <span>暂无图片</span>
                                     </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
             </div>

             {/* Footer Number */}
             <div className="absolute bottom-6 right-8 text-slate-400 font-medium select-none z-10">
                 {currentSlideIndex + 1}
             </div>
          </div>
      </div>

      {/* Navigation Strip & Notes Panel (Bottom) */}
      <div className="flex-shrink-0 bg-white border-t border-slate-200 flex flex-col">
          
          {/* Notes Toggle Header */}
          <div 
             className="h-8 bg-slate-50 border-b border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-100"
             onClick={() => setShowNotes(!showNotes)}
          >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <Mic size={12} /> 演讲者备注 {showNotes ? '▼' : '▲'}
              </div>
          </div>

          {/* Collapsible Area */}
          <div className="flex overflow-hidden" style={{ height: showNotes ? '200px' : '110px', transition: 'height 0.3s ease' }}>
             
             {/* Slide Strip */}
             <div className="flex-1 overflow-x-auto p-4 flex gap-4 custom-scrollbar bg-slate-100/50">
                {slides.map((s, idx) => (
                    <div 
                        key={s.id}
                        onClick={() => onSelectSlide(idx)}
                        className={`flex-shrink-0 w-32 aspect-video bg-white rounded border-2 cursor-pointer transition-all relative overflow-hidden
                            ${idx === currentSlideIndex ? 'border-indigo-500 shadow-md scale-100' : 'border-transparent hover:border-slate-300 opacity-80'}`}
                    >
                        <div className="p-2 transform scale-[0.25] origin-top-left w-[400%] select-none pointer-events-none">
                            <h1 className="font-bold text-slate-800 mb-2 truncate">{s.title}</h1>
                            <div className="w-full h-1 bg-slate-200 rounded"></div>
                        </div>
                        <div className="absolute bottom-1 right-2 text-[10px] text-slate-400 font-bold select-none">{idx + 1}</div>
                    </div>
                ))}
                <button 
                    onClick={() => onAddSlide(slides.length)}
                    className="flex-shrink-0 w-32 aspect-video bg-white rounded border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-300 transition-all"
                >
                    <Plus size={24} />
                </button>
             </div>

             {/* Speaker Notes Editor */}
             {showNotes && (
                 <div className="w-[30%] border-l border-slate-200 bg-white flex flex-col">
                     <div className="p-2 border-b border-slate-100 text-xs text-slate-400 flex justify-between">
                         <span>当前页备注</span>
                         <span className={slide.notes ? 'text-green-500' : ''}>{slide.notes?.length || 0} 字</span>
                     </div>
                     <textarea 
                        className="flex-1 w-full p-4 resize-none focus:outline-none text-sm text-slate-600 leading-relaxed"
                        placeholder="在此输入演讲备注 (生成的 PPT 将包含此内容)..."
                        value={slide.notes || ''}
                        onChange={updateNotes}
                     />
                 </div>
             )}
          </div>
      </div>
    </div>
  );
};

export default VisualEditor;
