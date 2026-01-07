import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

const AUTH_KEY = 'ppt_auth';
const PROFILE_KEY = 'ppt_profile';
const CURRENT_USER_KEY = 'ppt_current_user';
const FEEDBACKS_KEY = 'ppt_feedbacks';

type ProfileData = {
  name: string;
  department: string;
  email: string;
  phone: string;
};

type FeedbackItem = {
  id: string;
  username: string;
  name: string;
  content: string;
  createdAt: string;
};

function isLoggedIn(): boolean {
  return localStorage.getItem(AUTH_KEY) === '1';
}

function readProfile(): ProfileData {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) {
    return {
      name: '未命名用户',
      department: '',
      email: '',
      phone: ''
    };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<ProfileData>;
    return {
      name: parsed.name ?? '未命名用户',
      department: parsed.department ?? '',
      email: parsed.email ?? '',
      phone: parsed.phone ?? ''
    };
  } catch {
    return {
      name: '未命名用户',
      department: '',
      email: '',
      phone: ''
    };
  }
}

const Profile = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<ProfileData>(() => readProfile());
  const [saved, setSaved] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const loggedIn = useMemo(() => isLoggedIn(), []);

  useEffect(() => {
    if (!loggedIn) {
      navigate('/login?redirect=/profile', { replace: true });
    }
  }, [loggedIn, navigate]);

  const update = (key: keyof ProfileData, value: string) => {
    setSaved(false);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(form));
    setSaved(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    navigate('/login', { replace: true });
  };

  const handleSubmitFeedback = async () => {
    const content = feedback.trim();
    if (!content) return;

    const username = localStorage.getItem(CURRENT_USER_KEY) || 'unknown';
    const item: FeedbackItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      username,
      name: form.name,
      content,
      createdAt: new Date().toISOString()
    };

    const raw = localStorage.getItem(FEEDBACKS_KEY);
    let list: FeedbackItem[] = [];
    try {
      list = raw ? (JSON.parse(raw) as FeedbackItem[]) : [];
      if (!Array.isArray(list)) list = [];
    } catch {
      list = [];
    }

    try {
      const resp = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: item.username, name: item.name, content: item.content })
      });
      if (!resp.ok) {
        throw new Error(await resp.text().catch(() => ''));
      }
    } catch {
      localStorage.setItem(FEEDBACKS_KEY, JSON.stringify([item, ...list]));
    }

    setFeedback('');
    setFeedbackSent(true);
    window.setTimeout(() => setFeedbackSent(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="返回"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">个人中心</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Save className="w-4 h-4" /> 保存
          </button>
          <button
            onClick={handleLogout}
            className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200"
          >
            退出登录
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900">基础信息</h2>
            <p className="text-sm text-gray-500 mt-1">当前页面为本地数据示例，后续可对接数据库与管理员权限</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入姓名"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">部门/教研组</label>
              <input
                value={form.department}
                onChange={(e) => update('department', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如：高中物理组"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
              <input
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">手机号</label>
              <input
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入手机号"
              />
            </div>
          </div>

          {saved && (
            <div className="mt-5 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
              已保存到本地
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mt-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">个人反馈</h2>
            <p className="text-sm text-gray-500 mt-1">提交后会暂存到本地，后续可投递到管理员端</p>
          </div>

          <textarea
            value={feedback}
            onChange={(e) => {
              setFeedbackSent(false);
              setFeedback(e.target.value);
            }}
            className="w-full min-h-[120px] px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例如：某功能的使用建议 / 发现的问题 / 希望新增的模块..."
          />

          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="text-xs text-gray-500">将保存到 localStorage：{FEEDBACKS_KEY}</div>
            <button
              onClick={handleSubmitFeedback}
              disabled={!feedback.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              提交反馈
            </button>
          </div>

          {feedbackSent && (
            <div className="mt-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
              已提交反馈（已保存到本地）
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
