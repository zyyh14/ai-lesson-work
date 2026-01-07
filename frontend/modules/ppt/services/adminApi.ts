import { getAdminToken } from '../utils/adminAuth';

const API_BASE = '/api';

export type AdminLoginRequest = {
  username: string;
  password: string;
};

export type AdminLoginResponse = {
  id: number | string;
  username: string;
  role: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers ? (init.headers as Record<string, string>) : {})
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const resp = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include'
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(text || `HTTP ${resp.status}`);
  }

  if (resp.status === 204) {
    return undefined as unknown as T;
  }

  const text = await resp.text().catch(() => '');
  if (!text || !text.trim()) {
    return undefined as unknown as T;
  }

  return JSON.parse(text) as T;
}

export const adminApi = {
  login: (payload: AdminLoginRequest) =>
    request<AdminLoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getUsers: (params?: { page?: number; limit?: number; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.status) qs.set('status', params.status);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request<{ users: any[]; total: number }>(`/admin/users${suffix}`, { method: 'GET' });
  },

  updateUserActive: (id: string | number, active: boolean) =>
    request<{ id: any; username: string; active: boolean }>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active })
    }),

  resetUserPassword: (id: string | number) =>
    request<{ id: any; username: string; tempPassword: string }>(`/admin/users/${id}/reset-password`, {
      method: 'POST'
    }),

  getProviders: () => request<{ providers: any[]; activeProviderId?: string }>(`/admin/llm/providers`, { method: 'GET' }),

  createProvider: (payload: { name: string; baseUrl: string; model: string; apiKey?: string }) =>
    request<any>(`/admin/llm/providers`, { method: 'POST', body: JSON.stringify(payload) }),

  deleteProvider: (id: string | number) => request<void>(`/admin/llm/providers/${id}`, { method: 'DELETE' }),

  activateProvider: (id: string | number) =>
    request<any>(`/admin/llm/providers/${id}/activate`, { method: 'POST' }),

  getUsageSummary: (params?: { from?: string; to?: string }) => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request<any>(`/admin/llm/usage${suffix}`, { method: 'GET' });
  },

  getFeedback: (params?: { status?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request<{ tickets: any[]; total: number }>(`/admin/feedback${suffix}`, { method: 'GET' });
  },

  updateFeedbackStatus: (id: string | number, status: string) =>
    request<{ id: any; status: string }>(`/admin/feedback/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  replyFeedback: (id: string | number, reply: string) =>
    request<{ id: any; status: string }>(`/admin/feedback/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ reply })
    }),

  getAudit: (params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request<{ logs: any[]; total: number }>(`/admin/audit${suffix}`, { method: 'GET' });
  }
};
