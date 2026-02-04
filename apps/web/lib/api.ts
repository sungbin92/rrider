import { getAccessToken, updateAccessToken, clearTokens, getRefreshToken } from './auth/storage';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearTokens();
    throw new Error('Token refresh failed');
  }

  const data = await res.json();
  updateAccessToken(data.accessToken);
  return data.accessToken;
}

async function getValidAccessToken(): Promise<string | null> {
  const token = getAccessToken();
  return token;
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const { headers: customHeaders, ...restOptions } = options || {};

  const accessToken = await getValidAccessToken();
  const authHeaders: Record<string, string> = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {};

  const res = await fetch(`${BASE_URL}${path}`, {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...customHeaders,
    },
    cache: "no-store",
  });

  if (res.status === 401 && accessToken) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    try {
      const newToken = await refreshPromise;

      const retryRes = await fetch(`${BASE_URL}${path}`, {
        ...restOptions,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newToken}`,
          ...customHeaders,
        },
        cache: "no-store",
      });

      if (!retryRes.ok) {
        const errorText = await retryRes.text();
        console.error(`API Error ${retryRes.status}:`, errorText);
        throw new Error(`API Error: ${retryRes.status} - ${errorText}`);
      }

      return retryRes.json();
    } catch {
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      throw new Error('Session expired');
    }
  }

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`API Error ${res.status}:`, errorText);
    throw new Error(`API Error: ${res.status} - ${errorText}`);
  }

  return res.json();
}
