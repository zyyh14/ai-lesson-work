import React, { useState, useEffect } from 'react';
import InputSidebar from './components/InputSidebar';
import LessonEditor from './components/LessonEditor';
import { LessonPlanHistoryItem, LessonPlanRequest, ViewMode } from './types';
import { generateLessonPlanStream } from './services/geminiService';
import { deleteLessonPlan, getLessonPlanDetail, listLessonPlans } from './services/historyService';

function App() {
  const [inputs, setInputs] = useState<LessonPlanRequest>({
    subject: '',
    gradeLevel: '',
    topic: '',
    duration: '',
    objectives: '',
    additionalNotes: '',
    templateImage: undefined
  });

  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.EDIT);
  const [historyItems, setHistoryItems] = useState<LessonPlanHistoryItem[]>([]);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedInputs = localStorage.getItem('teacherai_inputs');
      const savedContent = localStorage.getItem('teacherai_content');
      
      if (savedInputs) {
        setInputs(JSON.parse(savedInputs));
      }
      if (savedContent) {
        setGeneratedContent(savedContent);
        // If there is content, start in preview mode
        setViewMode(ViewMode.PREVIEW);
      }
    } catch (e) {
      console.error("Failed to load from localStorage", e);
    }
  }, []);

  const refreshHistory = async () => {
    try {
      const items = await listLessonPlans(20);
      setHistoryItems(items);
    } catch (e) {
      console.error('Failed to load history', e);
    }
  };

  useEffect(() => {
    refreshHistory();
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('teacherai_inputs', JSON.stringify(inputs));
      localStorage.setItem('teacherai_content', generatedContent);
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  }, [inputs, generatedContent]);

  const handleGenerate = async () => {
    if (!inputs.topic || !inputs.subject) return;

    setIsGenerating(true);
    setGeneratedContent(''); 
    
    // Switch to preview mode to watch the stream
    setViewMode(ViewMode.PREVIEW);

    try {
      await generateLessonPlanStream(inputs, (chunk) => {
        setGeneratedContent(chunk);
      });
      refreshHistory();
    } catch (error) {
      console.error("Failed to generate", error);
      const msg = error instanceof Error ? error.message : String(error);
      setGeneratedContent(prev => prev + `\n\n**Error:** ${msg}\n\n提示：\n- 如果看到 413/Request Entity Too Large，说明模板图片太大（base64）\n- 如果看到 500，去看后端控制台日志（可能是模型/配置问题）\n- 如果是 Failed to fetch，才可能是后端没启动或被防火墙拦截`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadHistory = async (id: number) => {
    try {
      const detail = await getLessonPlanDetail(id);
      setInputs({
        ...detail.request,
        templateImage: undefined
      });
      setGeneratedContent(detail.data || '');
      setViewMode(ViewMode.PREVIEW);
    } catch (e) {
      console.error('Failed to load history detail', e);
    }
  };

  const handleDeleteHistory = async (id: number) => {
    try {
      await deleteLessonPlan(id);
      refreshHistory();
    } catch (e) {
      console.error('Failed to delete history', e);
    }
  };

  const handleClear = () => {
    if (window.confirm('确定要清空所有输入和当前的教案吗？此操作无法撤销。')) {
      setInputs({
        subject: '',
        gradeLevel: '',
        topic: '',
        duration: '',
        objectives: '',
        additionalNotes: '',
        templateImage: undefined
      });
      setGeneratedContent('');
      setViewMode(ViewMode.EDIT);
      localStorage.removeItem('teacherai_inputs');
      localStorage.removeItem('teacherai_content');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-gray-100 overflow-hidden">
      <InputSidebar 
        inputs={inputs} 
        setInputs={setInputs} 
        onGenerate={handleGenerate} 
        isGenerating={isGenerating}
        onClear={handleClear}
        historyItems={historyItems}
        onLoadHistory={handleLoadHistory}
        onRefreshHistory={refreshHistory}
        onDeleteHistory={handleDeleteHistory}
      />
      <LessonEditor 
        content={generatedContent} 
        setContent={setGeneratedContent} 
        viewMode={viewMode}
        setViewMode={setViewMode}
        isGenerating={isGenerating}
      />
    </div>
  );
}

export default App;