import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Presentation, 
  Library, 
  BarChart3, 
  Sparkles, 
  User, 
  Bell, 
  LogOut 
} from 'lucide-react';

const AUTH_KEY = 'ppt_auth';
const PROFILE_KEY = 'ppt_profile';

type TeacherProfile = {
  name?: string;
  department?: string;
  email?: string;
  phone?: string;
};

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function getTeacherProfile(): TeacherProfile {
  return safeJsonParse<TeacherProfile>(localStorage.getItem(PROFILE_KEY)) || {};
}

function getGreetingText(now: Date): string {
  const h = now.getHours();
  if (h < 6) return '凌晨好';
  if (h < 12) return '上午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

function getEnvUrl(key: string, fallback: string): string {
  const v = (import.meta as any)?.env?.[key];
  return typeof v === 'string' && v.trim() ? v.trim() : fallback;
}

const Dashboard = () => {
  const navigate = useNavigate();

  const [authed, setAuthed] = useState(() => localStorage.getItem(AUTH_KEY) === '1');
  const [profile, setProfile] = useState<TeacherProfile>(() => getTeacherProfile());

  useEffect(() => {
    const sync = () => setAuthed(localStorage.getItem(AUTH_KEY) === '1');
    window.addEventListener('focus', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    const syncProfile = () => setProfile(getTeacherProfile());
    window.addEventListener('focus', syncProfile);
    window.addEventListener('storage', syncProfile);
    return () => {
      window.removeEventListener('focus', syncProfile);
      window.removeEventListener('storage', syncProfile);
    };
  }, []);

  // 处理模块点击
  const handleModuleClick = (module: any) => {
    if (module.external && module.externalUrl) {
      // 打开新窗口到外部URL
      window.open(module.externalUrl, '_blank', 'noopener,noreferrer');
    } else {
      // 内部路由跳转
      navigate(module.path);
    }
  };

  // 定义四个核心模块的配置
  const lessonPlanUrl = getEnvUrl('VITE_LESSONPLAN_URL', 'http://localhost:3000');
  const resourceUrl = getEnvUrl('VITE_RESOURCE_URL', 'http://localhost:3002');
  const analysisUrl = getEnvUrl('VITE_ANALYSIS_URL', 'http://localhost:3003');

  const modules = [
    {
      id: 1,
      title: "智能教案生成",
      description: "AI 驱动的教案设计引擎，支持一键生成与自定义修改。",
      icon: <BookOpen className="w-8 h-8 text-white" />,
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      path: "/lesson-plan",
      stats: "进入模块",
      external: true,
      externalUrl: lessonPlanUrl // 教案模块
    },
    {
      id: 2,
      title: "智能课件制作",
      description: "Vibe Coding 体验。所见即所得的 PPT 编辑与导出。",
      icon: <Presentation className="w-8 h-8 text-white" />,
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      path: "/ppt-editor",
      stats: "草稿箱 3 份",
      external: false // 当前模块，使用内部路由
    },
    {
      id: 3,
      title: "教学资源库",
      description: "智能推荐分层资源，支持多格式素材的收藏与管理。",
      icon: <Library className="w-8 h-8 text-white" />,
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      path: "/resources",
      stats: "进入模块",
      external: true,
      externalUrl: resourceUrl // 资源管理模块
    },
    {
      id: 4,
      title: "学情分析中心",
      description: "多维度数据可视化，精准定位学生薄弱点并生成反馈。",
      icon: <BarChart3 className="w-8 h-8 text-white" />,
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      path: "/analysis",
      stats: "进入模块",
      external: true,
      externalUrl: analysisUrl // 学情分析模块
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* --- 左侧侧边栏 (全局导航) --- */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-800">AI 备课系统</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">主菜单</div>
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium">
            <div className="grid grid-cols-2 gap-0.5 w-5">
               <div className="w-2 h-2 bg-blue-600 rounded-sm"></div>
               <div className="w-2 h-2 bg-blue-400 rounded-sm"></div>
               <div className="w-2 h-2 bg-blue-400 rounded-sm"></div>
               <div className="w-2 h-2 bg-blue-300 rounded-sm"></div>
            </div>
            工作台
          </button>
          
          {/* 侧边栏导航链接 */}
          <button onClick={() => window.open('http://localhost:3000', '_blank', 'noopener,noreferrer')} className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <BookOpen className="w-5 h-5" /> 教案管理
          </button>
          <button onClick={() => navigate('/ppt-editor')} className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <Presentation className="w-5 h-5" /> 课件制作
          </button>
          <button onClick={() => window.open('http://localhost:3002', '_blank', 'noopener,noreferrer')} className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <Library className="w-5 h-5" /> 资源库
          </button>
          <button onClick={() => window.open('http://localhost:3003', '_blank', 'noopener,noreferrer')} className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <BarChart3 className="w-5 h-5" /> 学情分析
          </button>
          <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <User className="w-5 h-5" /> 个人中心
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={() => {
              if (authed) {
                localStorage.removeItem(AUTH_KEY);
                setAuthed(false);
                navigate('/login');
              } else {
                navigate('/login?redirect=/profile');
              }
            }} 
            className="flex items-center gap-3 text-gray-500 hover:text-red-600 transition-colors px-4 py-2 w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>{authed ? '退出登录' : '登录'}</span>
          </button>
        </div>
      </aside>

      {/* --- 右侧主内容区 --- */}
      <main className="flex-1 flex flex-col">
        {/* 顶部 Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-700">教师工作台</h2>
          <div className="flex items-center gap-6">
            <button className="relative text-gray-500 hover:text-blue-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button
              onClick={() => {
                if (authed) {
                  localStorage.removeItem(AUTH_KEY);
                  setAuthed(false);
                  navigate('/login');
                } else {
                  navigate('/login?redirect=/profile');
                }
              }}
              className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              {authed ? '退出登录' : '登录'}
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900">{(profile.name || '教师').trim()}</div>
                <div className="text-xs text-gray-500">{(profile.department || '').trim() || '未设置教研组'}</div>
              </div>
              <div
                onClick={() => navigate('/profile')}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                title="个人中心"
              >
                <User className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </div>
        </header>

        {/* 核心功能入口区 */}
        <div className="p-8 overflow-y-auto">
          {/* 欢迎语 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{getGreetingText(new Date())}，{(profile.name || '老师').trim()} 👋</h1>
            <p className="text-gray-500 mt-2">准备好开始新一堂课的备课工作了吗？</p>
          </div>

          {/* 四大模块卡片 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {modules.map((module) => (
              <div 
                key={module.id}
                onClick={() => handleModuleClick(module)}
                className="group bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:shadow-lg hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-lg shadow-md ${module.color}`}>
                    {module.icon}
                  </div>
                  <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                    {module.stats}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                  {module.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {module.description}
                </p>
                <div className="mt-6 flex items-center text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                  进入模块 &rarr;
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;