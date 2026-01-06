import type { UserInfo } from '../types/userType';
import type { ResponseType } from '../types/responseType';
import type { AuditRecordInfo } from '../types/auditRecordType';
import { fetchWithAuth } from './authApi';
import { buildGetAuditRecordListQuery } from '../utils/buildQueryParams';

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

// AuditRecord API
export async function createTeacherApplication(params: { auditComment?: string }): Promise<ResponseType<AuditRecordInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/user/createTeacherApplication`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return response.json();
}

export async function approveTeacherApplication(params: { auditId: number; auditStatus: number; auditComment?: string }): Promise<ResponseType<{ auditRecord: AuditRecordInfo; user?: UserInfo }>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/user/approveTeacherApplication`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return response.json();
}

export async function getAuditRecordList(params: { targetId?: number; targetType?: number; auditType?: number; auditStatus?: number; auditorId?: number; page?: number; pageSize?: number }): Promise<ResponseType<{ records: AuditRecordInfo[]; total: number }>> {
  const queryString = buildGetAuditRecordListQuery(params);

  const response = await fetchWithAuth(`${API_BASE_URL}/user/getAuditRecordList?${queryString}`, {
    method: 'GET',
  });
  return response.json();
}

export async function uploadCertificate(file: File): Promise<ResponseType<UserInfo>> {
  const formData = new FormData();
  formData.append('certificate', file);

  const response = await fetchWithAuth(`${API_BASE_URL}/user/uploadCertificate`, {
    method: 'POST',
    body: formData,
  });
  return response.json();
}

