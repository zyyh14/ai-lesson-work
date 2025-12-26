import React, { useState, useRef } from 'react';
import { ClassInput, LoadingState } from '../types';
import { Loader2, Sparkles, FileSpreadsheet, Image as ImageIcon, X, UploadCloud, FileType2 } from 'lucide-react';

interface InputFormProps {
  onSubmit: (data: ClassInput) => void;
  loadingState: LoadingState;
}

type Tab = 'grades' | 'paper';

// Utility to resize and compress images
const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // API 要求：高度至少 300px
        const MIN_HEIGHT = 300;
        // 最大尺寸 1500px 以平衡质量和文件大小
        const MAX_SIZE = 1500;
        
        // 如果高度小于最小值，按比例放大
        if (height < MIN_HEIGHT) {
          const scale = MIN_HEIGHT / height;
          width = Math.round(width * scale);
          height = MIN_HEIGHT;
        }
        
        // 如果宽度或高度超过最大值，按比例缩小
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round(height * (MAX_SIZE / width));
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round(width * (MAX_SIZE / height));
              height = MAX_SIZE;
            }
          }
        }
        
        // 确保最终高度至少 300px（如果缩小后小于 300px，再次调整）
        if (height < MIN_HEIGHT) {
          const scale = MIN_HEIGHT / height;
          width = Math.round(width * scale);
          height = MIN_HEIGHT;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
             // Fallback if context fails
             resolve(e.target?.result as string);
             return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Compress to JPEG 0.7 quality
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, loadingState }) => {
  const [activeTab, setActiveTab] = useState<Tab>('grades');
  const [formData, setFormData] = useState<ClassInput>({
    gradeSheetText: '',
    gradeSheetImage: undefined,
    paperImage: undefined,
  });
  const [processingImage, setProcessingImage] = useState(false);

  const gradeImageRef = useRef<HTMLInputElement>(null);
  const paperImageRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, gradeSheetText: e.target.value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'gradeSheetImage' | 'paperImage') => {
    const file = e.target.files?.[0];
    if (file) {
      setProcessingImage(true);
      try {
        const resizedDataUrl = await resizeImage(file);
        setFormData(prev => ({ ...prev, [field]: resizedDataUrl }));
      } catch (error) {
        console.error("Image processing failed:", error);
        alert("图片处理失败，请重试或更换图片");
      } finally {
        setProcessingImage(false);
      }
    }
  };

  const clearImage = (e: React.MouseEvent, field: 'gradeSheetImage' | 'paperImage') => {
    e.stopPropagation();
    setFormData(prev => ({ ...prev, [field]: undefined }));
    if (field === 'gradeSheetImage' && gradeImageRef.current) gradeImageRef.current.value = '';
    if (field === 'paperImage' && paperImageRef.current) paperImageRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Only submit relevant data based on active tab
    const dataToSubmit: ClassInput = activeTab === 'grades' 
      ? { gradeSheetText: formData.gradeSheetText, gradeSheetImage: formData.gradeSheetImage }
      : { paperImage: formData.paperImage };
      
    onSubmit(dataToSubmit);
  };

  const isGenerating = loadingState === LoadingState.LOADING;

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      <div className="bg-slate-900 px-6 py-4 flex justify-between items-center flex-wrap gap-4">
        <div>
           <h2 className="text-white text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            数据导入与智能分析
          </h2>
          <p className="text-slate-400 text-xs mt-1">请选择一种分析模式</p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex bg-slate-800 p-1 rounded-lg">
          <button 
             type="button"
             onClick={() => setActiveTab('grades')}
             className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'grades' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            <FileSpreadsheet className="w-4 h-4" /> 成绩单分析
          </button>
          <button 
             type="button"
             onClick={() => setActiveTab('paper')}
             className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'paper' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            <ImageIcon className="w-4 h-4" /> 试卷诊断
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 md:p-8">
        
        {/* Tab Content: Grades */}
        <div className={activeTab === 'grades' ? 'block animate-fade-in' : 'hidden'}>
          <p className="text-sm text-slate-500 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
             📊 <b>成绩分析模式：</b> 侧重于分析班级整体分数段、平均分走势、优秀率及及格率。不支持具体错题挖掘。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Text Input */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <FileType2 className="w-4 h-4 text-blue-600" />
                粘贴文本/Excel数据
              </label>
              <textarea
                name="gradeSheetText"
                value={formData.gradeSheetText}
                onChange={handleChange}
                disabled={!!formData.gradeSheetImage}
                placeholder={`姓名  分数\n张三  88\n李四  92\n...`}
                className="w-full h-64 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm resize-none disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            {/* Right: Image Upload */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <UploadCloud className="w-4 h-4 text-blue-600" />
                上传成绩单照片
              </label>
              <div 
                onClick={() => !formData.gradeSheetText && gradeImageRef.current?.click()}
                className={`
                  h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-6 transition-all relative
                  ${formData.gradeSheetImage ? 'border-blue-500 bg-blue-50' : formData.gradeSheetText ? 'opacity-50 cursor-not-allowed border-slate-200' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50 cursor-pointer'}
                `}
              >
                {formData.gradeSheetImage ? (
                  <>
                     <img src={formData.gradeSheetImage} alt="Grade Sheet" className="max-h-full object-contain rounded" />
                     <button onClick={(e) => clearImage(e, 'gradeSheetImage')} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600">
                       <X className="w-4 h-4" />
                     </button>
                  </>
                ) : (
                  <>
                    {processingImage ? (
                      <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-3" />
                    ) : (
                      <FileSpreadsheet className="w-12 h-12 text-slate-300 mb-3" />
                    )}
                    <p className="text-slate-600 font-medium">{processingImage ? '正在处理图片...' : '点击上传图片'}</p>
                    <p className="text-slate-400 text-xs mt-2">AI 自动提取表格数据</p>
                    {formData.gradeSheetText && <p className="text-amber-600 text-xs mt-4 font-medium">(已输入文本，图片上传已禁用)</p>}
                  </>
                )}
                <input 
                  ref={gradeImageRef}
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'gradeSheetImage')}
                  className="hidden" 
                  disabled={!!formData.gradeSheetText || processingImage}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content: Paper */}
        <div className={activeTab === 'paper' ? 'block animate-fade-in' : 'hidden'}>
           <div className="max-w-2xl mx-auto space-y-4">
             <div className="bg-pink-50 border border-pink-100 p-4 rounded-xl text-pink-800 text-sm flex gap-3">
                <Sparkles className="w-5 h-5 flex-shrink-0" />
                <div>
                   <p className="font-bold mb-1">📝 试卷诊断模式：</p>
                   <p>上传学生的典型试卷或错题集照片，AI 将分析题目内容、识别共性错误，生成个性化方案及举一反三练习卷。</p>
                </div>
             </div>
             
             <div 
              onClick={() => paperImageRef.current?.click()}
              className={`
                h-72 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-8 transition-all relative cursor-pointer
                ${formData.paperImage ? 'border-pink-500 bg-pink-50' : 'border-slate-300 hover:border-pink-400 hover:bg-slate-50'}
              `}
             >
                {formData.paperImage ? (
                  <>
                     <img src={formData.paperImage} alt="Paper Scan" className="max-h-full object-contain rounded shadow-sm" />
                     <button onClick={(e) => clearImage(e, 'paperImage')} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600">
                       <X className="w-4 h-4" />
                     </button>
                  </>
                ) : (
                  <>
                    {processingImage ? (
                      <Loader2 className="w-16 h-16 text-pink-500 animate-spin mb-4" />
                    ) : (
                      <ImageIcon className="w-16 h-16 text-slate-300 mb-4" />
                    )}
                    <p className="text-slate-700 font-bold text-lg">{processingImage ? '正在压缩图片...' : '上传试卷/错题扫描件'}</p>
                    <p className="text-slate-400 text-sm mt-2">支持 JPG, PNG 格式</p>
                  </>
                )}
                <input 
                  ref={paperImageRef}
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'paperImage')}
                  className="hidden" 
                  disabled={processingImage}
                />
             </div>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-center mt-8 pt-6 border-t border-slate-100">
           <button
            type="submit"
            disabled={isGenerating || processingImage || (activeTab === 'grades' && !formData.gradeSheetText && !formData.gradeSheetImage) || (activeTab === 'paper' && !formData.paperImage)}
            className={`
              px-12 py-4 rounded-xl font-bold text-lg text-white shadow-xl transition-all flex items-center gap-3
              ${isGenerating || processingImage
                ? 'bg-slate-400 cursor-not-allowed' 
                : (activeTab === 'grades' && !formData.gradeSheetText && !formData.gradeSheetImage) || (activeTab === 'paper' && !formData.paperImage)
                  ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                  : activeTab === 'grades' 
                    ? 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 shadow-blue-500/30'
                    : 'bg-pink-600 hover:bg-pink-700 hover:-translate-y-0.5 shadow-pink-500/30'
              }
            `}
          >
            {isGenerating || processingImage ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                {processingImage ? '处理图片中...' : '正在智能分析...'}
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                {activeTab === 'grades' ? '生成成绩分析报告' : '生成试卷诊断报告'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
