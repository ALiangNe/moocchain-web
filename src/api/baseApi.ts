import type { UserInfo } from '../types/userType';
import type { ResponseType } from '../types/responseType';
import { fetchWithAuth } from './authApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// User API
export async function login(data: { username: string; password: string }): Promise<ResponseType<UserInfo>> {
  const response = await fetch(`${API_BASE_URL}/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include', // 允许发送和接收 Cookie（包括 HttpOnly Cookie）
  });
  return response.json();
}

export async function register(data: { username: string; password: string; email: string }): Promise<ResponseType<UserInfo>> {
  const response = await fetch(`${API_BASE_URL}/user/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateUser(data: Partial<UserInfo>): Promise<ResponseType<UserInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/user/updateUser`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function uploadAvatar(file: File): Promise<ResponseType<UserInfo>> {
  const formData = new FormData();
  formData.append('avatar', file);
  
  const response = await fetchWithAuth(`${API_BASE_URL}/user/uploadAvatar`, {
    method: 'POST',
    body: formData,
  });
  return response.json();
}

