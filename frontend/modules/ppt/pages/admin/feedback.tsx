import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';

const AdminFeedback = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await adminApi.getFeedback({ page: 1, limit: 20 });
      setTickets(Array.isArray(resp.tickets) ? resp.tickets : []);
    } catch (e: any) {
      setError(String(e?.message || e || '加载失败'));
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await adminApi.getFeedback({ page: 1, limit: 20 });
        if (!mounted) return;
        setTickets(Array.isArray(resp.tickets) ? resp.tickets : []);
      } catch (e: any) {
        if (!mounted) return;
        setError(String(e?.message || e || '加载失败'));
        setTickets([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  const markStatus = async (id: any, status: string) => {
    try {
      await adminApi.updateFeedbackStatus(id, status);
      await load();
    } catch (e: any) {
      setError(String(e?.message || e || '操作失败'));
    }
  };

  const reply = async (id: any) => {
    const text = window.prompt('请输入回复内容');
    if (!text || !text.trim()) return;
    try {
      await adminApi.replyFeedback(id, text.trim());
      await load();
    } catch (e: any) {
      setError(String(e?.message || e || '操作失败'));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">反馈与工单处理</h1>
        <p className="text-sm text-gray-500 mt-1">查看教师提交的反馈，标记状态并回复（后端接入后可用）</p>
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
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">用户</th>
                  <th className="py-2 pr-3">反馈内容</th>
                  <th className="py-2 pr-3">状态</th>
                  <th className="py-2 pr-3">管理员回复</th>
                  <th className="py-2 pr-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td className="py-4 text-gray-500" colSpan={6}>
                      暂无数据（或后端接口未接入）
                    </td>
                  </tr>
                ) : (
                  tickets.map((t, idx) => (
                    <tr key={t?.id ?? idx} className="border-b last:border-b-0">
                      <td className="py-2 pr-3">{t?.id ?? '-'}</td>
                      <td className="py-2 pr-3">{t?.name ? `${t?.name} (${t?.username ?? '-'})` : (t?.username ?? '-')}</td>
                      <td className="py-2 pr-3">
                        <div className="max-w-[420px] whitespace-pre-wrap break-words text-gray-800">{t?.content ?? '-'}</div>
                      </td>
                      <td className="py-2 pr-3">{t?.status ?? 'open'}</td>
                      <td className="py-2 pr-3">
                        <div className="max-w-[320px] whitespace-pre-wrap break-words text-gray-700">{t?.adminReply ?? '-'}</div>
                      </td>
                      <td className="py-2 pr-3 space-x-2">
                        <button
                          className="px-2 py-1 text-xs border border-gray-200 rounded"
                          onClick={() => markStatus(t?.id, 'processing')}
                        >
                          处理中
                        </button>
                        <button
                          className="px-2 py-1 text-xs border border-gray-200 rounded"
                          onClick={() => markStatus(t?.id, 'resolved')}
                        >
                          已解决
                        </button>
                        <button
                          className="px-2 py-1 text-xs border border-gray-200 rounded"
                          onClick={() => reply(t?.id)}
                        >
                          回复
                        </button>
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

export default AdminFeedback;
