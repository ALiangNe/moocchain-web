import type { UserInfo } from '../types/userType';
import type { ResponseType } from '../types/responseType';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
  
  if (!headers.has('Content-Type')) {
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

  // 刷新 Token
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
 */
export async function refreshToken(): Promise<ResponseType<UserInfo> | null> {
  let response: Response;
  try {
    // 浏览器会自动发送 HttpOnly Cookie（refresh_token）
    response = await fetch(`${API_BASE_URL}/user/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // 允许发送和接收 Cookie（包括 HttpOnly Cookie）
      // 不再需要 body，refreshToken 在 Cookie 中
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return null;
  }

  const result: ResponseType<UserInfo> = await response.json();

  if (result.code !== 0 || !result.accessToken) {
    return result;
  }

  // 更新 accessToken 到 Zustand
  // refreshToken 已由后端自动更新到 HttpOnly Cookie 中，前端无需处理
  const currentState = useAuthStore.getState();
  currentState.setAuth(result.accessToken, currentState.user);

  return result;
}

/**
 * 退出登录
 * 清除后端 HttpOnly Cookie 和前端 accessToken
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/user/logout`, {
      method: 'POST',
      credentials: 'include', // 允许发送 Cookie
    });
  } catch (error) {
    console.error('Logout error:', error);
  }

  // 无论请求成功与否，都清除前端状态
  useAuthStore.getState().clearAuth();
}

