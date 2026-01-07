import React, { useState } from 'react';
import { AnalysisResult, KnowledgePoint, StudentGroup, MistakePoint, LoadingState } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BookOpen, Users, TrendingUp, AlertCircle, CheckCircle2, Lightbulb, GraduationCap, ClipboardList, BrainCircuit, Loader2, ArrowRight } from 'lucide-react';

interface AnalysisReportProps {
  result: AnalysisResult;
  onGenerateExam: (mistakes: string[]) => void;
  examGenerationState: LoadingState;
}

const COLORS = ['#4F46E5', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];

export const AnalysisReport: React.FC<AnalysisReportProps> = ({ result, onGenerateExam, examGenerationState }) => {
  const [selectedMistakes, setSelectedMistakes] = useState<string[]>([]);

  const toggleMistake = (topic: string) => {
    setSelectedMistakes(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const hasScoreData = result.scoreDistribution && result.scoreDistribution.length > 0;
  const hasPaperData = result.identifiedMistakes && result.identifiedMistakes.length > 0;

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      
      {/* 1. Summary Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          {hasPaperData && !hasScoreData ? '试卷诊断综述' : '整体学情综述'}
        </h3>
        <p className="text-slate-600 leading-relaxed text-lg">
          {result.summary}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-green-50 p-4 rounded-xl border border-green-100">
            <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> 优势亮点
            </h4>
            <ul className="list-disc list-inside space-y-1 text-green-700">
              {result.strengths.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
            <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> 待提升点
            </h4>
            <ul className="list-disc list-inside space-y-1 text-amber-700">
              {result.weaknesses.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 2. Charts Section (Conditional) */}
      {(hasScoreData || (result.knowledgePoints && result.knowledgePoints.length > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Score Distribution - Only show if data exists */}
          {hasScoreData ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 min-h-[400px]">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                成绩分布
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="range" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]}>
                        {result.scoreDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            // Placeholder or Knowledge Chart full width if no score data
            <></>
          )}

          {/* Knowledge Points - Show if data exists */}
          {result.knowledgePoints && result.knowledgePoints.length > 0 && (
            <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 min-h-[400px] ${!hasScoreData ? 'col-span-1 lg:col-span-2' : ''}`}>
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-500" />
                知识点掌握度诊断
              </h3>
              <div className="space-y-4">
                {result.knowledgePoints.map((point, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium text-slate-700 truncate" title={point.topic}>{point.topic}</div>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${point.status === 'Critical' ? 'bg-red-500' : point.status === 'Warning' ? 'bg-amber-400' : 'bg-green-500'}`} style={{ width: `${point.masteryRate}%` }} />
                    </div>
                    <div className="w-12 text-right text-sm text-slate-500">{point.masteryRate}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Mistake Bank & Exam Generation (Only for Paper Analysis) */}
      {hasPaperData && (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg animate-fade-in">
           <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <BrainCircuit className="w-6 h-6 text-pink-400" />
                  错题挖掘 & 举一反三
                </h3>
                <p className="text-slate-400 text-sm mt-1">勾选高频错题，AI 自动生成针对性巩固试卷</p>
              </div>
              <button
                onClick={() => onGenerateExam(selectedMistakes)}
                disabled={selectedMistakes.length === 0 || examGenerationState === LoadingState.GENERATING_PAPER}
                className={`px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
                  selectedMistakes.length > 0 
                    ? 'bg-pink-500 hover:bg-pink-400 text-white shadow-lg shadow-pink-500/20' 
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                {examGenerationState === LoadingState.GENERATING_PAPER ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ClipboardList className="w-4 h-4" />
                )}
                生成巩固试卷 ({selectedMistakes.length})
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.identifiedMistakes.map((mistake) => (
                 <div 
                    key={mistake.id}
                    onClick={() => toggleMistake(mistake.description)}
                    className={`
                      p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group
                      ${selectedMistakes.includes(mistake.description) 
                        ? 'bg-pink-500/10 border-pink-500/50' 
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600'}
                    `}
                 >
                    <div className="flex justify-between items-start mb-2">
                       <span className={`text-xs font-bold px-2 py-0.5 rounded ${selectedMistakes.includes(mistake.description) ? 'bg-pink-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                          {mistake.topic}
                       </span>
                       <span className="text-xs text-red-400 font-mono">错误率 {mistake.errorRate}%</span>
                    </div>
                    <p className="text-sm text-slate-200 font-medium mb-1">{mistake.description}</p>
                    <p className="text-xs text-slate-500">例：{mistake.exampleQuestion}</p>
                    
                    {/* Checkmark indicator */}
                    <div className={`absolute top-2 right-2 transition-opacity ${selectedMistakes.includes(mistake.description) ? 'opacity-100' : 'opacity-0 group-hover:opacity-20'}`}>
                       <CheckCircle2 className="w-5 h-5 text-pink-400" />
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* 4. Student Insights */}
      {result.studentInsights && result.studentInsights.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              {hasPaperData ? '学生个性化提升方案' : '重点学生关注名单'}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
               <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
                  <tr>
                     <th className="px-4 py-3 rounded-l-lg w-32">姓名/ID</th>
                     <th className="px-4 py-3 w-24">{hasPaperData ? '预估水平' : '分数'}</th>
                     <th className="px-4 py-3 min-w-[200px] w-1/4">核心薄弱项</th>
                     <th className="px-4 py-3 min-w-[300px]">个性化建议 / 学习计划</th>
                     <th className="px-4 py-3 rounded-r-lg text-center w-24">操作</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {result.studentInsights.map((student, idx) => (
                     <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-4 py-4 font-medium text-slate-900 align-top">
                           <div className="flex items-center gap-2">
                               {student.name}
                               {student.trend === 'down' && <span className="text-red-500 text-xs">↓</span>}
                           </div>
                        </td>
                        <td className="px-4 py-4 font-mono text-slate-600 align-top">{student.score}</td>
                        <td className="px-4 py-4 align-top">
                           <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-xs border border-red-100 leading-relaxed whitespace-normal break-words">
                             {student.weakness}
                           </div>
                        </td>
                        <td className="px-4 py-4 text-slate-600 align-top leading-relaxed whitespace-normal break-words">
                           {student.learningPlan}
                        </td>
                        <td className="px-4 py-4 text-center align-top">
                           <button className="text-blue-600 hover:text-blue-800 text-xs font-medium border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                              导出计划
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Suggestions */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100">
        <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-indigo-600" />
            后续教学策略建议
        </h3>
        <div className="space-y-3">
          {result.teachingSuggestions.map((suggestion, idx) => (
            <div key={idx} className="flex gap-3 items-start bg-white/60 p-3 rounded-lg">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                {idx + 1}
              </span>
              <p className="text-indigo-900 text-sm leading-6">{suggestion}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};