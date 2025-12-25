import React from 'react';
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

const Dashboard = () => {
  const navigate = useNavigate();

  // 定义四个核心模块的配置
  const modules = [
    {
      id: 1,
      title: "智能教案生成",
      description: "AI 驱动的教案设计引擎，支持一键生成与自定义修改。",
      icon: <BookOpen className="w-8 h-8 text-white" />,
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      path: "/lesson-plan", // 对应同学 A 的路由
      stats: "已创建 12 份"
    },
    {
      id: 2,
      title: "智能课件制作",
      description: "Vibe Coding 体验。所见即所得的 PPT 编辑与导出。",
      icon: <Presentation className="w-8 h-8 text-white" />,
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      path: "/ppt-editor", // 对应同学 B 的路由 (你的部分)
      stats: "草稿箱 3 份"
    },
    {
      id: 3,
      title: "教学资源库",
      description: "智能推荐分层资源，支持多格式素材的收藏与管理。",
      icon: <Library className="w-8 h-8 text-white" />,
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      path: "/resources", // 对应同学 C 的路由
      stats: "收藏 108 个"
    },
    {
      id: 4,
      title: "学情分析中心",
      description: "多维度数据可视化，精准定位学生薄弱点并生成反馈。",
      icon: <BarChart3 className="w-8 h-8 text-white" />,
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      path: "/analysis", // 对应同学 D 的路由
      stats: "覆盖 2 个班级"
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
          
          {/* 这里的链接也可以直接跳转到各模块 */}
          <button onClick={() => navigate('/lesson-plan')} className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <BookOpen className="w-5 h-5" /> 教案管理
          </button>
          <button onClick={() => navigate('/ppt-editor')} className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <Presentation className="w-5 h-5" /> 课件制作
          </button>
          <button onClick={() => navigate('/resources')} className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <Library className="w-5 h-5" /> 资源库
          </button>
          <button onClick={() => navigate('/analysis')} className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <BarChart3 className="w-5 h-5" /> 学情分析
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button className="flex items-center gap-3 text-gray-500 hover:text-red-600 transition-colors px-4 py-2 w-full">
            <LogOut className="w-5 h-5" />
            <span>退出登录</span>
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
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900">张老师</div>
                <div className="text-xs text-gray-500">高中物理组</div>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                <User className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </div>
        </header>

        {/* 核心功能入口区 */}
        <div className="p-8 overflow-y-auto">
          {/* 欢迎语 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">下午好，张老师 👋</h1>
            <p className="text-gray-500 mt-2">准备好开始新一堂课的备课工作了吗？</p>
          </div>

          {/* 四大模块卡片 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {modules.map((module) => (
              <div 
                key={module.id}
                onClick={() => navigate(module.path)}
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

          {/* 底部快捷数据区 (可选) */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 lg:col-span-2">
              <h3 className="font-bold text-gray-800 mb-4">最近备课记录</h3>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                   <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                         <span className="text-sm font-medium text-gray-700">《牛顿第二定律》教案设计</span>
                      </div>
                      <span className="text-xs text-gray-400">2小时前</span>
                   </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-xl text-white">
               <h3 className="font-bold mb-2">AI 助手小贴士</h3>
               <p className="text-sm text-blue-100 opacity-90 leading-relaxed">
                  "在制作课件时，尝试使用新的思维导图功能来梳理知识点，可以提高学生 30% 的理解效率哦！"
               </p>
               <button className="mt-4 bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-2 rounded-lg transition-colors">
                  查看更多建议
               </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;