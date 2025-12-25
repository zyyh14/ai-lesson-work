import React, { useRef, useEffect, useState } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { Message, Sender } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  selectedModel: string;
  modelOptions: ReadonlyArray<{ label: string; value: string }>;
  onSelectModel: (model: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading, selectedModel, modelOptions, onSelectModel }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedLabel = (modelOptions.find((m) => m.value === selectedModel) || modelOptions[0])?.label;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200 relative">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
            <h2 className="font-bold text-slate-800">智能助手</h2>
            <p className="text-xs text-slate-500">{selectedLabel || selectedModel}</p>
            </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedModel}
            onChange={(e) => onSelectModel(e.target.value)}
            className="h-9 text-sm border border-slate-200 rounded-md px-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            title="选择 AI 模型"
            disabled={isLoading}
          >
            {modelOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center text-slate-400 mt-10">
            <p className="mb-2">你好！我可以帮你制作演示文稿。</p>
            <button
              type="button"
              onClick={() => setInput('创建一个关于太阳系的5页演示文稿')}
              className="text-sm text-indigo-600 hover:text-indigo-700"
              disabled={isLoading}
            >
              试着说：“创建一个关于太阳系的5页演示文稿”
            </button>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex max-w-[85%] rounded-2xl p-3 shadow-sm ${
                msg.sender === Sender.USER
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : msg.sender === Sender.SYSTEM 
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
              }`}
            >
              <div className="mr-2 mt-1 shrink-0">
                {msg.sender === Sender.USER ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start w-full">
            <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
              <Bot size={16} className="text-slate-400" />
              <span className="text-xs text-slate-400 animate-pulse">思考并更新幻灯片中...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="描述你的幻灯片需求..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm disabled:opacity-60"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;