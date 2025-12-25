
import React, { useState, useRef } from 'react';
import { LessonSummary } from '../types';
import { Plus, FileUp, MoreVertical, Trash2, Edit2, FileText, Menu, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  lessons: LessonSummary[];
  currentLessonId: string;
  onSelectLesson: (id: string) => void;
  onCreateLesson: () => void;
  onImportLesson: (file: File) => void;
  onDeleteLesson: (id: string) => void;
  onRenameLesson: (id: string, newTitle: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  lessons,
  currentLessonId,
  onSelectLesson,
  onCreateLesson,
  onImportLesson,
  onDeleteLesson,
  onRenameLesson
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportLesson(e.target.files[0]);
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const startEditing = (lesson: LessonSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(lesson.id);
    setEditTitle(lesson.title);
    setMenuOpenId(null);
  };

  const saveTitle = () => {
    if (editingId && editTitle.trim()) {
      onRenameLesson(editingId, editTitle);
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveTitle();
    if (e.key === 'Escape') setEditingId(null);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-30 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onToggle}
      />

      {/* Sidebar Container */}
      <div 
        className={`fixed md:relative z-40 h-full bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out flex flex-col border-r border-slate-800
          ${isOpen ? 'w-[280px] translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0 md:overflow-hidden'}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between min-w-[280px]">
          <div className="flex items-center gap-2 font-bold text-white">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <FileText className="text-white" size={18} />
            </div>
            <span>课件列表</span>
          </div>
          <button onClick={onToggle} className="md:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Actions */}
        <div className="p-4 grid grid-cols-2 gap-2 min-w-[280px]">
          <button 
            onClick={onCreateLesson}
            className="flex flex-col items-center justify-center gap-1 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Plus size={20} />
            <span className="text-xs font-medium">新建课件</span>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1 p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
          >
            <FileUp size={20} />
            <span className="text-xs font-medium">导入 PPT</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".pptx" 
            className="hidden" 
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto min-w-[280px]">
          <div className="px-2 pb-4 space-y-1">
             {lessons.map(lesson => (
               <div 
                 key={lesson.id}
                 className={`group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border border-transparent
                   ${lesson.id === currentLessonId ? 'bg-slate-800 border-slate-700 text-white' : 'hover:bg-slate-800/50 hover:text-white'}
                 `}
                 onClick={() => onSelectLesson(lesson.id)}
               >
                 <FileText size={18} className={lesson.id === currentLessonId ? 'text-indigo-400' : 'text-slate-500'} />
                 
                 {editingId === lesson.id ? (
                   <input 
                     autoFocus
                     className="flex-1 bg-slate-950 text-white px-2 py-1 rounded text-sm outline-none border border-indigo-500"
                     value={editTitle}
                     onChange={(e) => setEditTitle(e.target.value)}
                     onBlur={saveTitle}
                     onKeyDown={handleKeyDown}
                     onClick={(e) => e.stopPropagation()}
                   />
                 ) : (
                   <div className="flex-1 min-w-0">
                     <div className="truncate text-sm font-medium">{lesson.title}</div>
                     <div className="text-xs text-slate-500 truncate">{new Date(lesson.lastModified).toLocaleDateString()}</div>
                   </div>
                 )}

                 {/* Context Menu Trigger */}
                 {!editingId && (
                    <div className="relative">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(menuOpenId === lesson.id ? null : lesson.id);
                            }}
                            className={`p-1.5 rounded-md hover:bg-slate-700 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity ${menuOpenId === lesson.id ? 'opacity-100 bg-slate-700 text-white' : ''}`}
                        >
                            <MoreVertical size={16} />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {menuOpenId === lesson.id && (
                            <div className="absolute right-0 top-full mt-1 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                <button 
                                    onClick={(e) => startEditing(lesson, e)}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                                >
                                    <Edit2 size={14} /> 重命名
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if(confirm(`确定要删除 "${lesson.title}" 吗?`)) {
                                            onDeleteLesson(lesson.id);
                                        }
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 flex items-center gap-2"
                                >
                                    <Trash2 size={14} /> 删除
                                </button>
                            </div>
                        )}
                    </div>
                 )}
               </div>
             ))}
             {lessons.length === 0 && (
                 <div className="p-8 text-center text-slate-500 text-sm">
                     没有课件
                 </div>
             )}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-600 text-center min-w-[280px]">
           Gemini Presentation Architect v1.0
        </div>
      </div>
    </>
  );
};

export default Sidebar;
