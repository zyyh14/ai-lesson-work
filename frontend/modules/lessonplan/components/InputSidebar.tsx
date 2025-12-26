import React, { useRef } from 'react';
import { LessonPlanHistoryItem, LessonPlanRequest } from '../types';
import { Sparkles, BookOpen, Clock, Target, FileText, GraduationCap, Trash2, Image as ImageIcon, X } from 'lucide-react';

interface InputSidebarProps {
  inputs: LessonPlanRequest;
  setInputs: React.Dispatch<React.SetStateAction<LessonPlanRequest>>;
  onGenerate: () => void | Promise<void>;
  isGenerating: boolean;
  onClear: () => void;
  historyItems: LessonPlanHistoryItem[];
  onLoadHistory: (id: number) => void | Promise<void>;
  onRefreshHistory: () => void | Promise<void>;
  onDeleteHistory: (id: number) => void | Promise<void>;
}

const SUBJECT_OPTIONS = ['语文', '数学', '英语', '物理', '化学', '历史', '地理', '体育', '美术', '音乐'];
const GRADE_OPTIONS = ['小学一年级', '小学三年级', '小学六年级', '初一', '初二', '初三', '高一', '高二', '高三'];

const InputSidebar: React.FC<InputSidebarProps> = ({ inputs, setInputs, onGenerate, isGenerating, onClear, historyItems, onLoadHistory, onRefreshHistory, onDeleteHistory }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleChange = (field: keyof LessonPlanRequest, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInputs(prev => ({ ...prev, templateImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputs(prev => ({ ...prev, templateImage: undefined }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full lg:w-[420px] bg-white border-r border-gray-200 h-full flex flex-col no-print shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 flex-shrink-0">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50/50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="bg-indigo-600 p-2 rounded-xl shadow-sm shadow-indigo-200">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">教案生成配置</h1>
            </div>
            <p className="text-xs text-indigo-600/80 font-medium ml-12">TeacherAI PlanGen</p>
          </div>
          <button 
            onClick={onClear}
            className="group flex items-center justify-center w-8 h-8 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all duration-200"
            title="重置所有选项"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

        <div className="group">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              近期生成
            </label>
            <button
              onClick={onRefreshHistory}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              type="button"
            >
              刷新
            </button>
          </div>

          {historyItems && historyItems.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {historyItems.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onLoadHistory(item.id)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-indigo-200 transition-all"
                  title="点击载入该教案"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-gray-800 truncate">
                      {item.topic || '未命名课题'}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-[10px] text-gray-400">
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteHistory(item.id);
                        }}
                        className="w-7 h-7 rounded-md border border-gray-200 bg-white text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 flex items-center justify-center"
                        title="删除该记录"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                    <span className="truncate">{item.subject} / {item.gradeLevel}</span>
                    {item.hasTemplate ? (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] flex-shrink-0">有模板</span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-gray-50 text-gray-600 border border-gray-100 text-[10px] flex-shrink-0">无模板</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg p-3">
              暂无记录。生成一次教案后会自动出现在这里。
            </div>
          )}
        </div>
        
        {/* Subject */}
        <div className="group">
          <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" /> 
            学科选择
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {SUBJECT_OPTIONS.map(sub => (
              <button
                key={sub}
                onClick={() => handleChange('subject', sub)}
                className={`text-xs px-2.5 py-1 rounded-md border transition-all duration-200 ${
                  inputs.subject === sub 
                    ? 'bg-indigo-100 border-indigo-200 text-indigo-700 font-medium' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-200 hover:text-indigo-600'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
            placeholder="或输入其他学科..."
            value={inputs.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
          />
        </div>

        {/* Grade */}
        <div className="group">
          <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-500" /> 
            年级设定
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {GRADE_OPTIONS.map(grade => (
              <button
                key={grade}
                onClick={() => handleChange('gradeLevel', grade)}
                className={`text-xs px-2.5 py-1 rounded-md border transition-all duration-200 ${
                  inputs.gradeLevel === grade 
                    ? 'bg-indigo-100 border-indigo-200 text-indigo-700 font-medium' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-200 hover:text-indigo-600'
                }`}
              >
                {grade}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
            placeholder="输入年级..."
            value={inputs.gradeLevel}
            onChange={(e) => handleChange('gradeLevel', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Topic */}
          <div className="col-span-2 group">
            <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" /> 
              课题/单元
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
              placeholder="例如：分数的加减法"
              value={inputs.topic}
              onChange={(e) => handleChange('topic', e.target.value)}
            />
          </div>

          {/* Duration */}
          <div className="col-span-2 group">
            <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" /> 
              课时时长
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
              placeholder="例如：45分钟"
              value={inputs.duration}
              onChange={(e) => handleChange('duration', e.target.value)}
            />
          </div>
        </div>

        {/* Objectives */}
        <div className="group">
          <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-500" /> 
            教学目标
          </label>
          <textarea
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm h-28 resize-none transition-all leading-relaxed"
            placeholder="本节课学生需要掌握什么核心知识或技能？"
            value={inputs.objectives}
            onChange={(e) => handleChange('objectives', e.target.value)}
          />
        </div>
        
        {/* Template Image Upload */}
        <div className="group">
          <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-500" /> 
            参考教案表格/图片 (可选)
          </label>
          
          {!inputs.templateImage ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 hover:border-indigo-300 transition-all cursor-pointer group/upload text-center"
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 bg-indigo-50 rounded-full text-indigo-500 group-hover/upload:scale-110 transition-transform">
                    <ImageIcon className="w-5 h-5" />
                </div>
                <div className="text-gray-500 text-xs">
                    <span className="font-semibold text-indigo-600">点击上传</span> 图片
                    <p className="mt-1 text-gray-400">AI 将模仿图片中的表格/格式生成教案</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative rounded-xl border border-gray-200 overflow-hidden group/image shadow-sm">
              <img src={inputs.templateImage} alt="Template" className="w-full h-32 object-cover opacity-95" />
              <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors" />
              <button 
                onClick={removeImage}
                className="absolute top-2 right-2 bg-white/90 text-gray-500 p-1.5 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm opacity-0 group-hover/image:opacity-100"
                title="移除图片"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-[10px] text-white backdrop-blur-sm">
                已启用格式参考
              </div>
            </div>
          )}
        </div>

        {/* Additional Notes */}
        <div className="group">
          <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" /> 
            额外要求 (AI 提示词)
          </label>
          <textarea
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm h-24 resize-none transition-all leading-relaxed"
            placeholder="例如：希望包含一个有趣的小组活动，或者使用多媒体教学..."
            value={inputs.additionalNotes}
            onChange={(e) => handleChange('additionalNotes', e.target.value)}
          />
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <button
          onClick={onGenerate}
          disabled={isGenerating || !inputs.topic || !inputs.subject}
          className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-white font-semibold text-base transition-all duration-300
            ${isGenerating || !inputs.topic || !inputs.subject
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.99]'
            }`}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              正在生成教案...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              开始生成教案
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InputSidebar;