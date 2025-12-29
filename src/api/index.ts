import type { UserInfo } from '../types/userType';
import type { ResponseType } from '../types/responseType';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// User API
export async function login(data: { username: string; password: string }): Promise<ResponseType<UserInfo>> {
  const response = await fetch(`${API_BASE_URL}/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
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

