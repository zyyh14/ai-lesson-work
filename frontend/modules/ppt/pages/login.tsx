import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { setAdminToken } from '../utils/adminAuth';

const AUTH_KEY = 'ppt_auth';
const PROFILE_KEY = 'ppt_profile';
const CURRENT_USER_KEY = 'ppt_current_user';

async function postAuth(path: string, payload: any) {
  const resp = await fetch(`/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  const text = await resp.text().catch(() => '');
  if (!resp.ok) {
    throw new Error(text || `HTTP ${resp.status}`);
  }
  if (!text || !text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getRedirectPath(search: string): string {
  const params = new URLSearchParams(search);
  const redirect = params.get('redirect');
  if (!redirect) return '/';
  if (!redirect.startsWith('/')) return '/';
  return redirect;
}

function getDefaultRole(search: string): 'teacher' | 'admin' {
  const params = new URLSearchParams(search);
  const as = (params.get('as') || '').toLowerCase();
  return as === 'admin' ? 'admin' : 'teacher';
}

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // backend session auth, no local mock users
  }, []);

  const redirectPath = useMemo(() => getRedirectPath(location.search), [location.search]);
  const defaultRole = useMemo(() => getDefaultRole(location.search), [location.search]);

  const [role, setRole] = useState<'teacher' | 'admin'>(defaultRole);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }

    try {
      const effectiveMode = role === 'admin' ? 'login' : mode;
      if (effectiveMode === 'login') {
        await postAuth('login', { username: username.trim(), password });
      } else {
        if (password.length < 6) {
          setError('密码至少 6 位');
          return;
        }
        if (password !== confirmPassword) {
          setError('两次输入的密码不一致');
          return;
        }
        await postAuth('register', { username: username.trim(), password });
      }

      const me = await fetch('/api/auth/me', { credentials: 'include' })
        .then(async (r) => {
          const t = await r.text().catch(() => '');
          if (!r.ok) throw new Error(t || `HTTP ${r.status}`);
          return t ? JSON.parse(t) : null;
        })
        .catch(() => null);

      if (role === 'admin') {
        if ((me?.role || '').toLowerCase() !== 'admin') {
          setError('不是管理员账号');
          return;
        }
        setAdminToken('session');
        navigate('/admin', { replace: true });
        return;
      }

      // Keep existing localStorage keys for compatibility with current teacher-side features
      localStorage.setItem(AUTH_KEY, '1');
      localStorage.setItem(CURRENT_USER_KEY, username.trim());
      localStorage.setItem(
        PROFILE_KEY,
        JSON.stringify({
          name: (displayName || username.trim()).trim(),
          department: department.trim(),
          email: '',
          phone: ''
        })
      );

      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      const msg = String(err?.message || err || '登录失败');
      setError(msg.includes('HTTP') ? '登录/注册失败，请检查后端 /api/auth/login 与 /api/auth/register 是否可用' : msg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">登录</h1>
        
          <p className="text-sm text-gray-500 mt-2">测试账号：teacher1 / 123456，teacher2 / 123456</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-5">
          <button
            type="button"
            onClick={() => {
              setRole('teacher');
              try {
                const params = new URLSearchParams(location.search);
                const as = (params.get('as') || '').toLowerCase();
                const redirect = params.get('redirect') || '';
                if (as === 'admin' || redirect === '/admin') {
                  navigate('/login', { replace: true });
                }
              } catch (e) {
              }
            }}
            className={`px-3 py-2 text-sm rounded-lg border ${role === 'teacher' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-200'}`}
          >
            教师
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('admin');
              setMode('login');
            }}
            className={`px-3 py-2 text-sm rounded-lg border ${role === 'admin' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-200'}`}
          >
            管理员
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入密码"
              type="password"
              autoComplete="current-password"
            />
          </div>

          {mode === 'register' && role !== 'admin' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">确认密码</label>
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请再次输入密码"
                  type="password"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：张老师"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">部门/教研组</label>
                <input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：高中物理组"
                />
              </div>
            </>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {role === 'admin' ? '登录管理员后台' : mode === 'login' ? '登录' : '注册并登录'}
          </button>

          {role !== 'admin' && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode((m) => (m === 'login' ? 'register' : 'login'));
              }}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-lg border border-gray-200 transition-colors"
            >
              {mode === 'login' ? '没有账号？去注册' : '已有账号？去登录'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
