import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';

const AdminUsers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await adminApi.getUsers({ page: 1, limit: 50 });
      setUsers(Array.isArray(resp.users) ? resp.users : []);
    } catch (e: any) {
      setError(String(e?.message || e || '加载失败'));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        await load();
      } catch (e: any) {
        if (mounted) setError(String(e?.message || e || '加载失败'));
      } finally {
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleActive = async (u: any) => {
    if (!u?.id) return;
    const next = !Boolean(u?.active);
    const ok = window.confirm(next ? `确定启用用户：${u?.username ?? u?.id} ?` : `确定禁用用户：${u?.username ?? u?.id} ?`);
    if (!ok) return;
    try {
      await adminApi.updateUserActive(u.id, next);
      await load();
    } catch (e: any) {
      setError(String(e?.message || e || '操作失败'));
    }
  };

  const resetPassword = async (u: any) => {
    if (!u?.id) return;
    const ok = window.confirm(`确定重置密码：${u?.username ?? u?.id} ?`);
    if (!ok) return;
    try {
      const resp = await adminApi.resetUserPassword(u.id);
      alert(`临时密码：${resp?.tempPassword || '123456'}`);
      await load();
    } catch (e: any) {
      setError(String(e?.message || e || '重置失败'));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">用户与权限管理</h1>
        <p className="text-sm text-gray-500 mt-1">查看教师列表、启用/禁用、重置密码（后端接入后可用）</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-gray-700">教师列表</div>
          <button
            className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            onClick={() => alert('新增账号：请使用教师端注册功能（本期不提供后台直接新增）')}
          >
            新增账号
          </button>
        </div>

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
                  <th className="py-2 pr-3">用户名</th>
                  <th className="py-2 pr-3">状态</th>
                  <th className="py-2 pr-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td className="py-4 text-gray-500" colSpan={4}>
                      暂无数据（或后端接口未接入）
                    </td>
                  </tr>
                ) : (
                  users.map((u, idx) => (
                    <tr key={u?.id ?? idx} className="border-b last:border-b-0">
                      <td className="py-2 pr-3">{u?.id ?? '-'}</td>
                      <td className="py-2 pr-3">{u?.username ?? u?.email ?? '-'}</td>
                      <td className="py-2 pr-3">{u?.active === false ? 'disabled' : 'active'}</td>
                      <td className="py-2 pr-3 space-x-2">
                        <button
                          className="px-2 py-1 text-xs border border-gray-200 rounded"
                          onClick={() => toggleActive(u)}
                        >
                          {u?.active === false ? '启用' : '禁用'}
                        </button>
                        <button
                          className="px-2 py-1 text-xs border border-gray-200 rounded"
                          onClick={() => resetPassword(u)}
                        >
                          重置密码
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

export default AdminUsers;
