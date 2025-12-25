import React from 'react';
import ReactMarkdown from 'react-markdown';

interface SlidePreviewProps {
  content: string;
  isActive: boolean;
}

const SlidePreview: React.FC<SlidePreviewProps> = ({ content, isActive }) => {
  if (!isActive) return null;

  return (
    <div className="w-full h-full bg-white shadow-lg rounded-xl overflow-y-auto p-12 flex flex-col items-center animate-in fade-in duration-300">
      <div className="prose prose-lg max-w-4xl w-full prose-headings:text-slate-800 prose-p:text-slate-600 prose-img:rounded-xl prose-img:shadow-md">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
};

export default SlidePreview;
