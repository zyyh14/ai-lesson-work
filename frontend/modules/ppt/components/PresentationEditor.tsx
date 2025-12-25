import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatInterface from './ChatInterface';
import VisualEditor from './VisualEditor'; 
import MarkdownEditor from './MarkdownEditor';
import Sidebar from './SideBar';
import { sendMessageToAI } from '../services/aiService';
import { lessonService } from '../services/api';
import { importPptxToMarkdown } from '../services/importService';
import { generatePPTX } from '../utils/pptGenerator';
import { Message, Sender, Presentation as PresentationType, Slide, AIModel, LessonSummary, AI_MODELS } from '../types';
import { markdownToPresentation, presentationToMarkdown, DEFAULT_THEME } from '../utils/presentationSync'; 
import { Presentation, Download, LayoutTemplate, Code, Check, RefreshCw, AlertCircle, WifiOff, PanelRightClose, PanelRightOpen, Menu, RotateCcw } from 'lucide-react';

type SaveStatus = 'saved' | 'saving' | 'error' | 'unsaved' | 'conflict' | 'offline';

function PresentationEditor() {
  // --- UI State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [showCodeView, setShowCodeView] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

  // --- Data State ---
  const [lessonList, setLessonList] = useState<LessonSummary[]>([]);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  
  // Current Lesson Data
  const [markdown, setMarkdown] = useState<string>("");
  const [presentation, setPresentation] = useState<PresentationType>({ title: '', theme: DEFAULT_THEME, slides: [] });
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0].id);
  
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // --- Undo History (for AI / editor changes) ---
  type HistoryEntry = { markdown: string; presentation: PresentationType };
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const pushHistorySnapshot = useCallback(() => {
    setHistory(prev => {
      const snapshot: HistoryEntry = {
        markdown,
        presentation,
      };
      const next = [...prev, snapshot];
      // Keep only last 20 snapshots to avoid unbounded growth
      return next.length > 20 ? next.slice(next.length - 20) : next;
    });
  }, [markdown, presentation]);

  // --- Initialization & Lesson List ---
  useEffect(() => {
      const loadList = async () => {
          const list = await lessonService.getAllLessons();
          setLessonList(list);
          if (list.length > 0) {
              setCurrentLessonId(list[0].id);
          } else {
              // Create default if completely empty
              const newId = await lessonService.createLesson();
              setCurrentLessonId(newId);
              setLessonList(await lessonService.getAllLessons());
          }
      };
      loadList();
  }, []);

  // --- Load Lesson Detail ---
  useEffect(() => {
    const loadLesson = async () => {
        if (!currentLessonId) return;

        setSaveStatus('saved'); // Reset status on switch
        try {
            const data = await lessonService.getLesson(currentLessonId);
            setPresentation(data.lesson);
            setMessages(data.history);
            setMarkdown(presentationToMarkdown(data.lesson));
            setCurrentSlideIndex(0);
            
            if (data.offline) {
                setSaveStatus('offline');
            }
        } catch (e) {
            console.error("Failed to load lesson", e);
        }
    };
    loadLesson();
  }, [currentLessonId]);

  // --- Auto-Save Logic ---
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
      // Don't auto-save on initial load or if no ID
      if (!currentLessonId || saveStatus === 'conflict') return;

      // Avoid saving immediately after loading (comparing if presentation matches loaded state would be better, but simple debounce works for now)
      setSaveStatus('unsaved');
      
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      saveTimeoutRef.current = setTimeout(async () => {
          setSaveStatus('saving');
          try {
              // Ensure we are saving the presentation that matches the markdown
              // (In a real app, we might want to ensure sync before save)
              const response = await lessonService.syncLesson(presentation, markdown);
              
              setPresentation(prev => ({ ...prev, version: response.version }));
              setSaveStatus(response.offline ? 'offline' : 'saved');
              
              // Refresh list to update "Last Modified"
              const list = await lessonService.getAllLessons();
              setLessonList(list);
          } catch (e: any) {
              console.error("Save failed", e);
              setSaveStatus('error');
          }
      }, 2000);

      return () => {
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      };
  }, [presentation.slides, presentation.title, presentation.theme, markdown]); // Dependencies trigger save

  // --- Sidebar Actions ---

  const handleCreateLesson = async () => {
      const newId = await lessonService.createLesson();
      setLessonList(await lessonService.getAllLessons());
      setCurrentLessonId(newId);
      // On mobile, maybe close sidebar
      if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleImportLesson = async (file: File) => {
      try {
        const importedMarkdown = await importPptxToMarkdown(file);
        
        // 生成唯一标题，避免重名冲突
        const title = `${file.name.replace('.pptx', '')}-${new Date().getTime()}`;
        const newId = await lessonService.createLesson();
        
        // Immediate update of the new lesson
        const initialPres = markdownToPresentation(importedMarkdown);
        initialPres.id = newId;
        initialPres.title = title;
        // 后端新建课件的初始版本是 1，这里显式对齐，避免首次同步出现 409 CONFLICT
        initialPres.version = 1;
        
        await lessonService.syncLesson(initialPres, importedMarkdown);
        
        setLessonList(await lessonService.getAllLessons());
        setCurrentLessonId(newId);
        
        // 在移动端关闭侧边栏
        if (window.innerWidth < 768) setIsSidebarOpen(false);
      } catch (e: any) {
          console.error('Import failed:', e);
          alert(`导入失败: ${e.message}`);
      }
  };

  const handleDeleteLesson = async (id: string) => {
      await lessonService.deleteLesson(id);
      const list = await lessonService.getAllLessons();
      setLessonList(list);
      
      if (currentLessonId === id) {
          if (list.length > 0) setCurrentLessonId(list[0].id);
          else handleCreateLesson(); 
      }
  };

  const handleRenameLesson = async (id: string, newTitle: string) => {
      await lessonService.renameLesson(id, newTitle);
      setLessonList(await lessonService.getAllLessons());
      if (currentLessonId === id) {
          setPresentation(prev => ({ ...prev, title: newTitle }));
      }
  };


  // --- Logic & Handlers ---

  const handleMarkdownFromAI = useCallback((newMarkdown: string) => {
    // Save snapshot before applying AI / markdown changes
    pushHistorySnapshot();

    setMarkdown(newMarkdown);
    const newPresentation = markdownToPresentation(newMarkdown);
    setPresentation(prev => ({
        ...newPresentation,
        id: prev.id,
        version: prev.version
    }));
    
    // Ensure index is valid
    if (currentSlideIndex >= newPresentation.slides.length) {
        setCurrentSlideIndex(Math.max(0, newPresentation.slides.length - 1));
    }
  }, [currentSlideIndex, pushHistorySnapshot]);

  const handleVisualUpdate = (newSlides: Slide[]) => {
      // Save snapshot before visual edits
      pushHistorySnapshot();

      const newPres = { ...presentation, slides: newSlides };
      setPresentation(newPres);
      const newMd = presentationToMarkdown(newPres);
      setMarkdown(newMd);
  };

  const handleUpdateSlide = (index: number, updatedSlide: Slide) => {
      const newSlides = [...presentation.slides];
      newSlides[index] = updatedSlide;
      handleVisualUpdate(newSlides);
  };

  const handleDeleteSlide = (index: number) => {
      if (presentation.slides.length <= 1) return; 
      const newSlides = presentation.slides.filter((_, i) => i !== index);
      handleVisualUpdate(newSlides);
      if (currentSlideIndex >= newSlides.length) {
          setCurrentSlideIndex(newSlides.length - 1);
      }
  };

  const handleAddSlide = (index: number) => {
      const newSlide: Slide = {
          id: Date.now().toString(),
          type: 'content',
          title: '新幻灯片',
          content: ['点击添加内容...']
      };
      const newSlides = [...presentation.slides];
      newSlides.splice(index, 0, newSlide);
      handleVisualUpdate(newSlides);
      setCurrentSlideIndex(index);
  };

  const handleUndo = () => {
      setHistory(prev => {
          if (prev.length === 0) return prev;

          const last = prev[prev.length - 1];
          // Restore previous version of markdown & presentation
          setMarkdown(last.markdown);
          setPresentation(last.presentation);

          return prev.slice(0, -1);
      });
  };

  const handleSendMessage = async (text: string) => {
    if (!currentLessonId) return;
    
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: Sender.USER,
      timestamp: Date.now(),
    };
    
    setMessages((prev) => [...prev, newUserMsg]);
    lessonService.saveMessage(currentLessonId, newUserMsg);
    
    setIsLoading(true);

    try {
      const responseText = await sendMessageToAI(
        text, 
        selectedModel,
        markdown, 
        (updatedMd) => handleMarkdownFromAI(updatedMd)
      );

      const newBotMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: Sender.BOT,
        timestamp: Date.now(),
      };
      
      setMessages((prev) => [...prev, newBotMsg]);
      lessonService.saveMessage(currentLessonId, newBotMsg);
    } catch (e: any) {
        setMessages((prev) => [...prev, {
            id: Date.now().toString(),
            text: `Error: ${e.message}`,
            sender: Sender.SYSTEM,
            timestamp: Date.now(),
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans text-slate-900">
       
       {/* 1. Left Sidebar (Lesson Manager) */}
       <Sidebar 
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          lessons={lessonList}
          currentLessonId={currentLessonId || ''}
          onSelectLesson={(id) => setCurrentLessonId(id)}
          onCreateLesson={handleCreateLesson}
          onImportLesson={handleImportLesson}
          onDeleteLesson={handleDeleteLesson}
          onRenameLesson={handleRenameLesson}
       />

       {/* 2. Main Center Content */}
       <div className="flex-1 flex flex-col h-full min-w-0 bg-white relative">
          
          {/* Toolbar */}
          <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm z-10 shrink-0">
              
              <div className="flex items-center gap-4 min-w-0">
                  <button 
                     onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                     className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                  >
                      <Menu size={20} />
                  </button>
                  
                  <div className="flex items-center gap-2 min-w-0">
                    <Presentation className="text-indigo-600 shrink-0" size={20} />
                    <h1 className="font-bold text-slate-700 text-lg truncate max-w-[200px] md:max-w-[400px]" title={presentation.title}>
                        {presentation.title || "未命名课件"}
                    </h1>
                  </div>
                  
                  {/* Save Status */}
                  <div className="hidden md:flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 whitespace-nowrap">
                      {saveStatus === 'saved' && <><Check size={14} className="text-green-500"/> <span className="text-slate-500">已保存</span></>}
                      {saveStatus === 'saving' && <><RefreshCw size={14} className="text-blue-500 animate-spin"/> <span className="text-blue-500">保存中...</span></>}
                      {saveStatus === 'unsaved' && <><div className="w-2 h-2 rounded-full bg-amber-500"/> <span className="text-amber-500">未保存</span></>}
                      {saveStatus === 'offline' && <><WifiOff size={14} className="text-slate-400"/> <span className="text-slate-400">离线</span></>}
                  </div>
              </div>

              <div className="flex items-center gap-2">
                  <div className="hidden md:flex bg-slate-100 p-1 rounded-lg">
                      <button 
                         onClick={() => setShowCodeView(false)}
                         className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${!showCodeView ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                          <LayoutTemplate size={16} /> 编辑
                      </button>
                      <button 
                         onClick={() => setShowCodeView(true)}
                         className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${showCodeView ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                          <Code size={16} /> 源码
                      </button>
                  </div>
                  
                  <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>

                  {/* Undo Button */}
                  <button
                      onClick={handleUndo}
                      disabled={history.length === 0}
                      className="hidden md:inline-flex items-center gap-1 px-2 py-1 text-sm rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="回退到上一个版本"
                  >
                      <RotateCcw size={16} /> 回退
                  </button>

                  <button 
                      onClick={() => generatePPTX(markdown)}
                      className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap text-sm md:text-base"
                  >
                      <Download size={18} /> <span className="hidden md:inline">导出</span>
                  </button>

                  <div className="h-6 w-px bg-slate-200 mx-1"></div>
                  
                  <button 
                     onClick={() => setIsChatOpen(!isChatOpen)}
                     className={`p-2 rounded-lg transition-colors ${isChatOpen ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-500'}`}
                     title={isChatOpen ? "收起助手" : "展开助手"}
                  >
                      {isChatOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
                  </button>
              </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 overflow-hidden relative">
              {showCodeView ? (
                  <MarkdownEditor 
                      value={markdown} 
                      onChange={(val) => {
                          if (val !== undefined) handleMarkdownFromAI(val);
                      }} 
                  />
              ) : (
                  <VisualEditor 
                      slides={presentation.slides}
                      currentSlideIndex={currentSlideIndex}
                      theme={presentation.theme}
                      onUpdateSlide={handleUpdateSlide}
                      onDeleteSlide={handleDeleteSlide}
                      onAddSlide={handleAddSlide}
                      onSelectSlide={setCurrentSlideIndex}
                  />
              )}
          </div>
       </div>

       {/* 3. Right Sidebar (Chat) */}
       <div 
          className={`${isChatOpen ? 'w-[380px]' : 'w-0'} flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden border-l border-slate-200 bg-white relative z-20 shadow-xl`}
       >
          <div className="w-[380px] h-full">
             <ChatInterface 
                messages={messages} 
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                selectedModel={selectedModel}
                modelOptions={AI_MODELS.map((m) => ({ label: m.name, value: m.id }))}
                onSelectModel={(m) => setSelectedModel(m as AIModel)}
             />
          </div>
       </div>

    </div>
  );
}

export default PresentationEditor;