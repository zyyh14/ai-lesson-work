import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';

function formatDay(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const AdminModels = () => {
  const [providers, setProviders] = useState<any[]>([]);
  const [usage, setUsage] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', baseUrl: '', model: '', apiKey: '' });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, u] = await Promise.all([
        adminApi.getProviders(),
        adminApi.getUsageSummary()
      ]);
      setProviders(Array.isArray(p.providers) ? p.providers : []);
      setUsage(u);
    } catch (e: any) {
      setError(String(e?.message || e || '加载失败'));
      setProviders([]);
      setUsage(null);
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
        const [p, u] = await Promise.all([
          adminApi.getProviders(),
          adminApi.getUsageSummary()
        ]);
        if (!mounted) return;
        setProviders(Array.isArray(p.providers) ? p.providers : []);
        setUsage(u);
      } catch (e: any) {
        if (!mounted) return;
        setError(String(e?.message || e || '加载失败'));
        setProviders([]);
        setUsage(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  const openCreate = () => {
    setError(null);
    setForm({ name: '', baseUrl: '', model: '', apiKey: '' });
    setShowCreate(true);
  };

  const submitCreate = async () => {
    if (!form.name.trim() || !form.baseUrl.trim() || !form.model.trim()) return;
    try {
      await adminApi.createProvider({
        name: form.name.trim(),
        baseUrl: form.baseUrl.trim(),
        model: form.model.trim(),
        apiKey: form.apiKey.trim() ? form.apiKey.trim() : undefined
      });
      setShowCreate(false);
      await load();
    } catch (e: any) {
      setError(String(e?.message || e || '新增失败'));
    }
  };

  const removeProvider = async (p: any) => {
    if (!p?.id) return;
    if (p?.builtIn) return;
    const ok = window.confirm(`确定删除 Provider：${p?.name ?? p?.id} ?`);
    if (!ok) return;
    try {
      await adminApi.deleteProvider(p.id);
      await load();
    } catch (e: any) {
      setError(String(e?.message || e || '删除失败'));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">AI 模型与成本管理</h1>
        <p className="text-sm text-gray-500 mt-1">按模块固定使用最佳模型；这里仅用于查看/补充 Provider 与成本监控</p>
      </div>

      {loading && <div className="text-sm text-gray-500">加载中...</div>}

      {error && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-700">模型配置</div>
            <button
              className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              onClick={openCreate}
            >
              新增 Provider
            </button>
          </div>

          <div className="text-sm text-gray-500 mb-3">各模块使用的模型由后端配置固定（例如：默认/思考/视觉），不需要手动切换“当前模型”。</div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-3">名称</th>
                  <th className="py-2 pr-3">model</th>
                  <th className="py-2 pr-3">base_url</th>
                  <th className="py-2 pr-3">删除</th>
                </tr>
              </thead>
              <tbody>
                {providers.length === 0 ? (
                  <tr>
                    <td className="py-4 text-gray-500" colSpan={4}>
                      暂无数据（或后端接口未接入）
                    </td>
                  </tr>
                ) : (
                  providers.map((p, idx) => (
                    <tr key={p?.id ?? idx} className="border-b last:border-b-0">
                      <td className="py-2 pr-3">{p?.name ?? '-'}</td>
                      <td className="py-2 pr-3">{p?.model ?? '-'}</td>
                      <td className="py-2 pr-3">{p?.base_url ?? '-'}</td>
                      <td className="py-2 pr-3">
                        {p?.builtIn ? (
                          <span className="text-xs text-gray-400">内置</span>
                        ) : (
                          <button
                            className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
                            onClick={() => removeProvider(p)}
                          >
                            删除
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-sm font-medium text-gray-700 mb-3">成本监控</div>
          <div className="text-sm text-gray-500">展示：总 token、今日使用、本月使用（按近 30 天趋势汇总）。</div>

          {(() => {
            const totalTokens = Number(usage?.totalTokens || 0);
            const daily = Array.isArray(usage?.daily) ? usage.daily : [];
            const moduleBreakdown = Array.isArray(usage?.moduleBreakdown) ? usage.moduleBreakdown : [];

            const todayKey = formatDay(Date.now());
            let todayTokens = 0;
            let monthTokens = 0;
            const now = new Date();
            const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-`;

            for (const it of daily) {
              const day = String(it?.day || '');
              const t = Number(it?.tokens || 0);
              if (day === todayKey) todayTokens += t;
              if (day.startsWith(monthPrefix)) monthTokens += t;
            }

            return (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-xs text-gray-500">总 Token</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">{totalTokens}</div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-xs text-gray-500">今日使用</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">{todayTokens}</div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-xs text-gray-500">本月使用</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">{monthTokens}</div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-2 px-3">模块</th>
                        <th className="py-2 px-3">总 Token</th>
                        <th className="py-2 px-3">今日 Token</th>
                      </tr>
                    </thead>
                    <tbody>
                      {moduleBreakdown.length === 0 ? (
                        <tr>
                          <td className="py-3 px-3 text-gray-500" colSpan={3}>暂无模块用量数据</td>
                        </tr>
                      ) : (
                        moduleBreakdown.map((it: any, idx: number) => (
                          <tr key={it?.module ?? idx} className="border-b last:border-b-0">
                            <td className="py-2 px-3">{String(it?.module ?? '-')}</td>
                            <td className="py-2 px-3">{Number(it?.totalTokens ?? 0)}</td>
                            <td className="py-2 px-3">{Number(it?.todayTokens ?? 0)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-gray-200 w-full max-w-lg p-5">
            <div className="text-base font-semibold text-gray-900">新增 Provider</div>
            <div className="text-sm text-gray-500 mt-1">填写 OpenAI 兼容接口的基础信息</div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="text-sm text-gray-700 mb-1">名称</div>
                <input
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  placeholder="例如：自定义 Provider"
                />
              </div>
              <div>
                <div className="text-sm text-gray-700 mb-1">baseUrl</div>
                <input
                  value={form.baseUrl}
                  onChange={(e) => setForm((s) => ({ ...s, baseUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  placeholder="例如：https://ark.cn-beijing.volces.com/api/v3"
                />
              </div>
              <div>
                <div className="text-sm text-gray-700 mb-1">model</div>
                <input
                  value={form.model}
                  onChange={(e) => setForm((s) => ({ ...s, model: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  placeholder="例如：deepseek-v3-250324"
                />
              </div>
              <div>
                <div className="text-sm text-gray-700 mb-1">apiKey（可选）</div>
                <input
                  value={form.apiKey}
                  onChange={(e) => setForm((s) => ({ ...s, apiKey: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  placeholder="不填则为空"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                onClick={() => setShowCreate(false)}
              >
                取消
              </button>
              <button
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                disabled={!form.name.trim() || !form.baseUrl.trim() || !form.model.trim()}
                onClick={submitCreate}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminModels;
