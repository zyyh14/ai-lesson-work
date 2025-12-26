import React from 'react';
import { RemedialPaper as RemedialPaperType } from '../types';
import { Download, CheckCircle, HelpCircle } from 'lucide-react';

interface Props {
  paper: RemedialPaperType;
  onClose: () => void;
}

export const RemedialPaper: React.FC<Props> = ({ paper, onClose }) => {
  const handleDownload = () => {
    let content = `试卷标题：${paper.title}\n\n`;
    paper.questions.forEach((q, idx) => {
      content += `【题目 ${idx + 1}】(知识点: ${q.knowledgePoint})\n`;
      content += `${q.question}\n`;
      if (q.options && q.options.length > 0) {
        content += `选项:\n${q.options.map((opt, i) => `  ${String.fromCharCode(65+i)}. ${opt}`).join('\n')}\n`;
      }
      content += `\n参考答案: ${q.answer}\n`;
      content += `解析: ${q.explanation}\n`;
      content += `------------------------------------------------\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${paper.title || '巩固练习卷'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{paper.title}</h2>
            <p className="text-slate-500 text-sm mt-1">AI 智能生成的举一反三变式训练</p>
          </div>
          <div className="flex gap-3">
             <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-200 bg-white"
             >
               <Download className="w-4 h-4" /> 下载试卷
             </button>
             <button 
               onClick={onClose}
               className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
             >
               完成
             </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
          {paper.questions.map((q, idx) => (
            <div key={idx} className="border border-slate-200 rounded-xl p-6 hover:shadow-sm transition-shadow">
               <div className="flex items-center gap-3 mb-4 flex-wrap">
                 <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                   {idx + 1}
                 </span>
                 <div className="flex items-center gap-2 text-xs font-medium px-3 py-1 bg-slate-100 rounded-full text-slate-500">
                    <HelpCircle className="w-3 h-3" />
                    知识点：{q.knowledgePoint}
                 </div>
                 <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                    错因回顾：{q.originalErrorContext}
                 </div>
               </div>
               
               <div className="ml-0 md:ml-11">
                 <p className="text-lg text-slate-800 font-medium mb-6 leading-relaxed whitespace-pre-wrap">
                   {q.question}
                 </p>
                 
                 {q.options && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                     {q.options.map((opt, i) => (
                       <div key={i} className="p-3 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer">
                         {opt}
                       </div>
                     ))}
                   </div>
                 )}

                 <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 mt-6">
                   <div className="flex items-start gap-2">
                     <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                     <div>
                       <span className="font-bold text-slate-700 mr-2">参考答案:</span>
                       <span className="text-slate-800 font-mono">{q.answer}</span>
                       <div className="mt-2 text-sm text-slate-600">
                         <span className="font-semibold text-slate-500">解析:</span> {q.explanation}
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};