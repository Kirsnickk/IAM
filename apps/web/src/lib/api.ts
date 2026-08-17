const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  return { data: await res.json(), status: res.status, statusText: res.statusText };
}

export const api = {
  get: (path: string, opts?: { params?: Record<string, string> }) => {
    const query = opts?.params ? '?' + new URLSearchParams(opts.params).toString() : '';
    return request(path + query, { method: 'GET' });
  },
  post: (path: string, body?: unknown) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path: string, body?: unknown) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path: string) => request(path, { method: 'DELETE' }),
};
