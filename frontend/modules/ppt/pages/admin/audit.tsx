import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';

function formatTime(ts: any): string {
  const n = Number(ts);
  if (!n || Number.isNaN(n)) return '-';
  const d = new Date(n);
  const pad = (x: number) => (x < 10 ? `0${x}` : String(x));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function actionZh(action: string): string {
  const a = (action || '').trim();
  const map: Record<string, string> = {
    admin_login: '管理员登录',
    admin_login_failed: '管理员登录失败',
    teacher_user_create: '创建教师账号',
    teacher_user_update: '修改教师账号状态',
    teacher_user_reset_password: '重置教师密码',
    llm_provider_create: '新增模型 Provider',
    llm_provider_update: '编辑模型 Provider',
    llm_provider_activate: '切换当前模型 Provider',
    llm_provider_delete: '删除模型 Provider',
    feedback_update_status: '更新反馈状态',
    feedback_reply: '回复反馈'
  };
  return map[a] || a || '未知';
}

const AdminAudit = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await adminApi.getAudit({ page: 1, limit: 50 });
        if (!mounted) return;
        setLogs(Array.isArray(resp.logs) ? resp.logs : []);
      } catch (e: any) {
        if (!mounted) return;
        setError(String(e?.message || e || '加载失败'));
        setLogs([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">日志记录（操作/异常）</h1>
        <p className="text-sm text-gray-500 mt-1">仅记录管理员操作与关键 AI 调用失败（后端接入后可用）</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        {loading && <div className="text-sm text-gray-500">加载中...</div>}

        {error && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-3">时间</th>
                  <th className="py-2 pr-3">类型</th>
                  <th className="py-2 pr-3">内容</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td className="py-4 text-gray-500" colSpan={3}>
                      暂无数据（或后端接口未接入）
                    </td>
                  </tr>
                ) : (
                  logs.map((l, idx) => (
                    <tr key={l?.id ?? idx} className="border-b last:border-b-0">
                      <td className="py-2 pr-3">{formatTime(l?.createdAt)}</td>
                      <td className="py-2 pr-3">{actionZh(l?.action)}</td>
                      <td className="py-2 pr-3">
                        <div className="whitespace-pre-wrap break-words text-gray-800">
                          {`操作人：${l?.actor || '-'}\n${l?.detail || ''}`}
                          {l?.targetType || l?.targetId ? `\n对象：${l?.targetType || '-'} ${l?.targetId || ''}` : ''}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAudit;
