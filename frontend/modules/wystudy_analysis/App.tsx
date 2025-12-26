import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { InputForm } from './components/InputForm';
import { AnalysisReport } from './components/AnalysisReport';
import { RemedialPaper } from './components/RemedialPaper';
import { ClassInput, AnalysisResult, LoadingState, RemedialPaper as RemedialPaperType } from './types';
import { generateAnalysis, generateRemedialPaper, getArkApiKey } from './services/geminiService';
import { Info, Bell } from 'lucide-react';

const App: React.FC = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // State for Remedial Paper
  const [paperState, setPaperState] = useState<LoadingState>(LoadingState.IDLE);
  const [remedialPaper, setRemedialPaper] = useState<RemedialPaperType | null>(null);

  const handleAnalysisSubmit = async (data: ClassInput) => {
    if (getArkApiKey().length === 0) {
      setErrorMsg('分析生成失败：缺少 Ark API Key：请在项目根目录配置环境变量 VITE_ARK_API_KEY（例如 .env.local）后重启开发服务器。');
      setLoadingState(LoadingState.ERROR);
      return;
    }

    setLoadingState(LoadingState.LOADING);
    setErrorMsg(null);
    setAnalysisResult(null);

    try {
      const result = await generateAnalysis(data);
      setAnalysisResult(result);
      setLoadingState(LoadingState.SUCCESS);
    } catch (error: any) {
      console.error("分析失败:", error);
      const errorMsg = error?.message || "分析生成失败，请确保上传了有效的数据或图片，或稍后重试。";
      setErrorMsg(errorMsg);
      setLoadingState(LoadingState.ERROR);
    }
  };

  const handleGenerateExam = async (mistakes: string[]) => {
     setPaperState(LoadingState.GENERATING_PAPER);
     try {
       // Just pass mistakes now, context is inferred
       const paper = await generateRemedialPaper(mistakes);
       setRemedialPaper(paper);
       setPaperState(LoadingState.SUCCESS);
     } catch (error) {
       console.error("Paper generation failed", error);
       alert("试卷生成失败，请重试"); 
       setPaperState(LoadingState.ERROR);
     }
  };

  return (
    <div className="min-h-screen bg-slate-50 md:pl-64">
      <Sidebar />
      
      {/* Header */}
      <header className="bg-white h-16 border-b border-slate-200 sticky top-0 z-10 px-8 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">学情分析中心</h2>
        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
            TE
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Intro Card */}
        {loadingState === LoadingState.IDLE && !analysisResult && (
           <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 text-blue-800">
             <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
             <p className="text-sm">
               欢迎使用智能学情分析。您可以粘贴 Excel 成绩、拍照上传成绩单，或上传学生试卷。
               AI 将自动识别表格和错题，为您生成包含图表的详细报告和个性化学习方案。
             </p>
           </div>
        )}

        {/* Input Area */}
        {(!analysisResult || loadingState === LoadingState.LOADING) && (
             <InputForm onSubmit={handleAnalysisSubmit} loadingState={loadingState} />
        )}

        {loadingState === LoadingState.ERROR && (
           <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-800 text-center">
             {errorMsg}
           </div>
        )}

        {/* Report Area */}
        {analysisResult && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="text-2xl font-bold text-slate-800">分析报告</h3>
               <button 
                 onClick={() => { setAnalysisResult(null); setLoadingState(LoadingState.IDLE); }}
                 className="text-sm text-slate-500 hover:text-slate-800 underline"
               >
                 重新分析
               </button>
            </div>
            <AnalysisReport 
              result={analysisResult} 
              onGenerateExam={handleGenerateExam}
              examGenerationState={paperState}
            />
          </div>
        )}
      </main>
      
      {/* Remedial Paper Modal Overlay */}
      {remedialPaper && (
         <RemedialPaper 
           paper={remedialPaper} 
           onClose={() => {
             setRemedialPaper(null);
             setPaperState(LoadingState.IDLE);
           }} 
         />
      )}
    </div>
  );
};

export default App;
