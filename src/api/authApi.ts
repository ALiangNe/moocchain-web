import type { UserInfo } from '../types/userType';
import type { ResponseType } from '../types/responseType';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 防重复刷新 Token 的锁
let isRefreshing = false;
let refreshPromise: Promise<ResponseType<UserInfo> | null> | null = null;

/**
 * 创建带认证头的 fetch 请求
 * 自动添加 Authorization header（如果存在 accessToken）
 * 如果返回 401，会自动刷新 Token 并重试
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const accessToken = useAuthStore.getState().accessToken;
  const headers = new Headers(options.headers);
  
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  
  // 如果是 FormData，不设置 Content-Type，让浏览器自动设置（包括 boundary）
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // 第一次请求（自动发送 Cookie）
  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // 允许发送和接收 Cookie（包括 HttpOnly Cookie）
  });

  // 如果返回 401，尝试刷新 Token
  if (response.status !== 401) {
    return response;
  }

  console.log('Access Token 过期，尝试刷新...');

  // 刷新 Token（使用防重复机制）
  const refreshResult = await refreshToken();

  // 刷新成功，使用新的 Access Token 重试请求
  if (refreshResult && refreshResult.code === 0 && refreshResult.accessToken) {
    const newAccessToken = refreshResult.accessToken;
    headers.set('Authorization', `Bearer ${newAccessToken}`);

    console.log('Token 刷新成功，重试请求...');
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // 允许发送和接收 Cookie
    });
    return response;
  }

  // 刷新失败，清除认证信息
  console.log('Refresh Token 也过期，需要重新登录');

  // 调用 logout 接口清除 HttpOnly Cookie
  try {
    await logout();
  } catch (error) {
    console.error('Logout error:', error);
    // 即使 logout 失败，也清除前端状态
    useAuthStore.getState().clearAuth();
  }

  // 触发登录跳转
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }

  return response;
}

/**
 * 刷新 Access Token
 * refreshToken 存储在 HttpOnly Cookie 中，浏览器会自动发送
 * 前端无法读取 HttpOnly Cookie，不需要手动获取
 * 使用防重复机制，确保同时只有一个刷新请求
 */
export async function refreshToken(): Promise<ResponseType<UserInfo> | null> {
  // 如果正在刷新，返回同一个 Promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
  let response: Response;
  try {
    // 浏览器会自动发送 HttpOnly Cookie（refresh_token）
      response = await fetch(`${API_BASE_URL}/refreshToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // 允许发送和接收 Cookie（包括 HttpOnly Cookie）
      // 不再需要 body，refreshToken 在 Cookie 中
    });
  } catch (error) {
    console.error('Refresh token error:', error);
      isRefreshing = false;
      refreshPromise = null;
    return null;
  }

  const result: ResponseType<UserInfo> = await response.json();

  if (result.code !== 0 || !result.accessToken) {
      isRefreshing = false;
      refreshPromise = null;
    return result;
  }

  // 更新 accessToken 到 Zustand
  // refreshToken 已由后端自动更新到 HttpOnly Cookie 中，前端无需处理
  const currentState = useAuthStore.getState();
  currentState.setAuth(result.accessToken, currentState.user);

    // 调用 getUser API 获取完整的用户信息（不使用 fetchWithAuth，避免循环）
    let userResponse: Response;
    try {
      userResponse = await fetch(`${API_BASE_URL}/getCurrentUser`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${result.accessToken}`,
        },
        credentials: 'include',
      });
    } catch (error) {
      console.error('获取用户信息失败:', error);
      // 即使获取用户信息失败，也返回刷新成功的结果（至少 accessToken 已更新）
      isRefreshing = false;
      refreshPromise = null;
      return result;
    }

    if (userResponse.ok) {
      const userResult: ResponseType<UserInfo> = await userResponse.json();
    if (userResult.code === 0 && userResult.data) {
      // 更新完整的用户信息到 Zustand
      currentState.setAuth(result.accessToken, userResult.data);
    }
  }

    isRefreshing = false;
    refreshPromise = null;
  return result;
  })();

  return refreshPromise;
}

/**
 * 获取当前用户信息
 * 需要认证，使用 fetchAuth 自动处理 token
 */
export async function getCurrentUser(): Promise<ResponseType<UserInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/getCurrentUser`, {
    method: 'GET',
  });
  return response.json();
}

/**
 * 退出登录
 * 清除后端 HttpOnly Cookie 和前端 accessToken
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      credentials: 'include', // 允许发送 Cookie
    });
  } catch (error) {
    console.error('Logout error:', error);
  }

  // 无论请求成功与否，都清除前端状态
  useAuthStore.getState().clearAuth();
}

