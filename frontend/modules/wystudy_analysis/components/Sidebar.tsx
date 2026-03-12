import React from 'react';
import { 
  ArrowLeft,
  Users, 
  Settings, 
  LogOut 
} from 'lucide-react';

function getEnvUrl(key: string, fallback: string): string {
  const v = (import.meta as any)?.env?.[key];
  return typeof v === 'string' && v.trim() ? v.trim() : fallback;
}

export const Sidebar: React.FC = () => {
  // Only keeping the relevant module active
  const menuItems = [
    { icon: Users, label: '学情分析', active: true },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 h-screen fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-sm">AI</span>
          智学备课
        </h1>
        <p className="text-xs text-slate-500 mt-2 pl-10">学情分析系统 v1.0</p>
      </div>

      <div className="px-4">
        <button
          onClick={() => {
            const url = getEnvUrl('VITE_TEACHER_DASHBOARD_URL', 'http://localhost:3001/dashboard');
            window.location.href = url;
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-slate-800 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">返回工作台</span>
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => {
              // 当前模块仅保留一个入口，后续可扩展为路由导航
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              item.active 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
          <span>系统设置</span>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-red-400 hover:text-red-300">
          <LogOut className="w-5 h-5" />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );
};
