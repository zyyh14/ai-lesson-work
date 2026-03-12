import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearAdminToken } from '../../utils/adminAuth';
import { Shield, Users, Cpu, MessageSquareText, ScrollText, LogOut } from 'lucide-react';

const linkBase =
  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors';

const AdminLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-800">管理员后台</span>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">管理</div>

          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`
            }
          >
            <Users className="w-5 h-5" /> 用户与权限
          </NavLink>

          <NavLink
            to="/admin/models"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`
            }
          >
            <Cpu className="w-5 h-5" /> 模型与成本
          </NavLink>

          <NavLink
            to="/admin/feedback"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`
            }
          >
            <MessageSquareText className="w-5 h-5" /> 反馈与工单
          </NavLink>

          <NavLink
            to="/admin/audit"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`
            }
          >
            <ScrollText className="w-5 h-5" /> 日志记录
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => {
              try {
                fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
              } catch (e) {
              }
              clearAdminToken();
              navigate('/login', { replace: true });
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" /> 退出登录
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
