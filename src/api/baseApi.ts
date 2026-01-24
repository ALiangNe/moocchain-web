import type { ResponseType } from '@/types/responseType';
import type { UserInfo } from '@/types/userType';
import type { AuditRecordInfo } from '@/types/auditRecordType';
import type { CourseInfo } from '@/types/courseType';
import type { ResourceInfo } from '@/types/resourceType';
import type { LearningRecordInfo } from '@/types/learningRecordType';
import type { CertificateTemplateInfo } from '@/types/certificateTemplateType';
import type { ResourceCertificateConfigInfo } from '@/types/resourceCertificateConfigType';
import type { CertificateInfo } from '@/types/certificateType';
import type { TokenRuleInfo } from '@/types/tokenRuleType';
import type { TokenTransactionInfo } from '@/types/tokenTransactionType';
import { fetchWithAuth } from '@/api/authApi';
import { buildGetAuditRecordListQuery, buildGetCourseListQuery, buildGetResourceListQuery, buildGetLearningRecordListQuery, buildGetLearningHistoryListQuery, buildGetCertificateTemplateListQuery, buildGetResourceCertificateConfigListQuery, buildGetCertificateListQuery, buildGetTokenRuleListQuery, buildGetTokenTransactionListQuery, buildGetUserListQuery, buildFormData } from '@/utils/buildApiParams';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// User API
export async function login(data: { username: string; password: string }): Promise<ResponseType<UserInfo>> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include', // 允许发送和接收 Cookie（包括 HttpOnly Cookie）
  }); return response.json();
}
export async function register(data: { username: string; password: string; email: string }): Promise<ResponseType<UserInfo>> {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }); return response.json();
}
export async function updateUser(data: Partial<UserInfo>): Promise<ResponseType<UserInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/updateUser`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }); return response.json();
}
export async function uploadAvatar(file: File): Promise<ResponseType<UserInfo>> {
  const formData = new FormData();
  formData.append('avatar', file);
  const response = await fetchWithAuth(`${API_BASE_URL}/uploadAvatar`, {
    method: 'POST',
    body: formData,
  }); return response.json();
}
export async function getUserList(params: { userId?: number; username?: string; email?: string; realName?: string; role?: number; walletBound?: number; schoolName?: string; page?: number; pageSize?: number }): Promise<ResponseType<{ records: UserInfo[]; total: number }>> {
  const queryString = buildGetUserListQuery(params);
  const response = await fetchWithAuth(`${API_BASE_URL}/getUserList?${queryString}`, { method: 'GET' });
  return response.json();
}
export async function adminUpdateUser(userId: number, data: Partial<UserInfo>): Promise<ResponseType<UserInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/adminUpdateUser/${userId}`, { method: 'PUT', body: JSON.stringify(data) });
  return response.json();
}

// AuditRecord API
export async function createTeacherApplication(params: { auditComment?: string }): Promise<ResponseType<AuditRecordInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/createTeacherApplication`, {
    method: 'POST',
    body: JSON.stringify(params),
  }); return response.json();
}
export async function approveTeacherApplication(params: { auditId: number; auditStatus: number; auditComment?: string }): Promise<ResponseType<{ auditRecord: AuditRecordInfo; user?: UserInfo }>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/approveTeacherApplication`, {
    method: 'POST',
    body: JSON.stringify(params),
  }); return response.json();
}
export async function approveResourceApplication(params: { auditId: number; auditStatus: number; auditComment?: string }): Promise<ResponseType<{ auditRecord: AuditRecordInfo; resource?: ResourceInfo }>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/approveResourceApplication`, {
    method: 'POST',
    body: JSON.stringify(params),
  }); return response.json();
}
export async function approveCourseApplication(params: { auditId: number; auditStatus: number; auditComment?: string }): Promise<ResponseType<{ auditRecord: AuditRecordInfo; course?: CourseInfo }>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/approveCourseApplication`, {
    method: 'POST',
    body: JSON.stringify(params),
  }); return response.json();
}
export async function reapplyCourseAudit(params: { courseId: number }): Promise<ResponseType<AuditRecordInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/reapplyCourseAudit`, {
    method: 'POST',
    body: JSON.stringify(params),
  }); return response.json();
}
export async function reapplyResourceAudit(params: { resourceId: number }): Promise<ResponseType<AuditRecordInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/reapplyResourceAudit`, {
    method: 'POST',
    body: JSON.stringify(params),
  }); return response.json();
}
export async function getAuditRecordList(params: { targetId?: number; targetType?: number; auditType?: number; auditStatus?: number; auditorId?: number; page?: number; pageSize?: number }): Promise<ResponseType<{ records: AuditRecordInfo[]; total: number }>> {
  const queryString = buildGetAuditRecordListQuery(params);
  const response = await fetchWithAuth(`${API_BASE_URL}/getAuditRecordList?${queryString}`, {
    method: 'GET',
  }); return response.json();
}
export async function uploadCertificate(file: File): Promise<ResponseType<UserInfo>> {
  const formData = new FormData();
  formData.append('certificate', file);
  const response = await fetchWithAuth(`${API_BASE_URL}/uploadCertificate`, {
    method: 'POST',
    body: formData,
  }); return response.json();
}

// Course API
export async function createCourse(data: Partial<CourseInfo>, coverImage?: File): Promise<ResponseType<CourseInfo>> {
  const formData = buildFormData(data, coverImage ? { coverImage } : undefined, ['coverImage']);
  const response = await fetchWithAuth(`${API_BASE_URL}/createCourse`, {
    method: 'POST',
    body: formData,
  }); return response.json();
}
export async function updateCourse(courseId: number, data: Partial<CourseInfo>, coverImage?: File): Promise<ResponseType<CourseInfo>> {
  const formData = buildFormData(data, coverImage ? { coverImage } : undefined, ['coverImage']);
  const response = await fetchWithAuth(`${API_BASE_URL}/updateCourse/${courseId}`, {
    method: 'PUT',
    body: formData,
  }); return response.json();
}
export async function getCourseList(params: { teacherId?: number; status?: number; page?: number; pageSize?: number }): Promise<ResponseType<{ records: CourseInfo[]; total: number }>> {
  const queryString = buildGetCourseListQuery(params);
  const response = await fetchWithAuth(`${API_BASE_URL}/getCourseList?${queryString}`, {
    method: 'GET',
  }); return response.json();
}
export async function getCourse(courseId: number): Promise<ResponseType<CourseInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/getCourse/${courseId}`, {
    method: 'GET',
  });
  return response.json();
}

// Resource API
export async function createResource(formData: FormData): Promise<ResponseType<ResourceInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/createResource`, {
    method: 'POST',
    body: formData,
  }); return response.json();
}
export async function updateResource(resourceId: number, data: Partial<ResourceInfo>): Promise<ResponseType<ResourceInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/updateResource/${resourceId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }); return response.json();
}
export async function getResourceList(params: { courseId?: number; ownerId?: number; resourceType?: number; status?: number; page?: number; pageSize?: number }): Promise<ResponseType<{ records: ResourceInfo[]; total: number }>> {
  const queryString = buildGetResourceListQuery(params);
  const response = await fetchWithAuth(`${API_BASE_URL}/getResourceList?${queryString}`, {
    method: 'GET',
  }); return response.json();
}
export async function getResource(resourceId: number): Promise<ResponseType<ResourceInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/getResource/${resourceId}`, {
    method: 'GET',
  }); return response.json();
}
export async function claimResourceUploadReward(data: { resourceId: number; walletAddress: string }): Promise<ResponseType<TokenTransactionInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/claimResourceUploadReward`, {
    method: 'POST',
    body: JSON.stringify(data),
  }); return response.json();
}


// LearningRecord API
export async function completeLearningRecord(resourceId: number): Promise<ResponseType<LearningRecordInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/completeLearningRecord`, {
    method: 'POST',
    body: JSON.stringify({ resourceId }),
  }); return response.json();
}
export async function reportLearningTime(resourceId: number, timeIncrement: number): Promise<ResponseType<LearningRecordInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/reportLearningTime`, {
    method: 'POST',
    body: JSON.stringify({ resourceId, timeIncrement }),
  }); return response.json();
}
export async function updateLearningProgress(resourceId: number, progress: number): Promise<ResponseType<LearningRecordInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/updateLearningProgress/${resourceId}`, {
    method: 'PUT',
    body: JSON.stringify({ progress }),
  }); return response.json();
}
export async function submitReview(resourceId: number, review: string, rating: number): Promise<ResponseType<LearningRecordInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/submitReview`, {
    method: 'POST',
    body: JSON.stringify({ resourceId, review, rating }),
  }); return response.json();
}
export async function getLearningRecordList(params: { studentId?: number; resourceId?: number; page?: number; pageSize?: number }): Promise<ResponseType<{ records: LearningRecordInfo[]; total: number }>> {
  const queryString = buildGetLearningRecordListQuery(params);
  const response = await fetchWithAuth(`${API_BASE_URL}/getLearningRecordList?${queryString}`, {
    method: 'GET',
  }); return response.json();
}
export async function getLearningRecord(recordId: number): Promise<ResponseType<LearningRecordInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/getLearningRecord/${recordId}`, {
    method: 'GET',
  }); return response.json();
}
export async function getLearningHistoryList(params: { page?: number; pageSize?: number }): Promise<ResponseType<{ records: ResourceInfo[]; total: number }>> {
  const queryString = buildGetLearningHistoryListQuery(params);
  const response = await fetchWithAuth(`${API_BASE_URL}/getLearningHistoryList?${queryString}`, {
    method: 'GET'
  }); return response.json();
}
export async function claimLearningReward(data: { resourceId: number; rewardType: number; walletAddress: string }): Promise<ResponseType<TokenTransactionInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/claimLearningReward`, {
    method: 'POST',
    body: JSON.stringify(data),
  }); return response.json();
}

// CertificateTemplate API
export async function createCertificateTemplate(data: Partial<CertificateTemplateInfo>): Promise<ResponseType<CertificateTemplateInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/createCertificateTemplate`, {
    method: 'POST',
    body: JSON.stringify(data),
  }); return response.json();
}
export async function updateCertificateTemplate(templateId: number, data: Partial<CertificateTemplateInfo>): Promise<ResponseType<CertificateTemplateInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/updateCertificateTemplate/${templateId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }); return response.json();
}
export async function getCertificateTemplateList(params: { createdBy?: number; isActive?: number; page?: number; pageSize?: number }): Promise<ResponseType<{ records: CertificateTemplateInfo[]; total: number }>> {
  const queryString = buildGetCertificateTemplateListQuery(params);
  const response = await fetchWithAuth(`${API_BASE_URL}/getCertificateTemplateList?${queryString}`, {
    method: 'GET',
  }); return response.json();
}
export async function getCertificateTemplate(templateId: number): Promise<ResponseType<CertificateTemplateInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/getCertificateTemplate/${templateId}`, {
    method: 'GET',
  }); return response.json();
}

// ResourceCertificateConfig API
export async function createResourceCertificateConfig(data: Partial<ResourceCertificateConfigInfo>): Promise<ResponseType<ResourceCertificateConfigInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/createResourceCertificateConfig`, {
    method: 'POST',
    body: JSON.stringify(data),
  }); return response.json();
}
export async function updateResourceCertificateConfig(configId: number, data: Partial<ResourceCertificateConfigInfo>): Promise<ResponseType<ResourceCertificateConfigInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/updateResourceCertificateConfig/${configId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }); return response.json();
}
export async function getResourceCertificateConfigList(params: { courseId?: number; templateId?: number; isEnabled?: number; page?: number; pageSize?: number }): Promise<ResponseType<{ records: ResourceCertificateConfigInfo[]; total: number }>> {
  const queryString = buildGetResourceCertificateConfigListQuery(params);
  const response = await fetchWithAuth(`${API_BASE_URL}/getResourceCertificateConfigList?${queryString}`, {
    method: 'GET',
  }); return response.json();
}
export async function getResourceCertificateConfig(configId: number): Promise<ResponseType<ResourceCertificateConfigInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/getResourceCertificateConfig/${configId}`, {
    method: 'GET',
  }); return response.json();
}

// Certificate API
export async function createCertificate(data: { courseId: number }): Promise<ResponseType<CertificateInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/createCertificate`, {
    method: 'POST',
    body: JSON.stringify(data),
  }); return response.json();
}
export async function getCertificateList(params: { studentId?: number; teacherId?: number; courseId?: number; page?: number; pageSize?: number }): Promise<ResponseType<{ records: CertificateInfo[]; total: number }>> {
  const queryString = buildGetCertificateListQuery(params);
  const response = await fetchWithAuth(`${API_BASE_URL}/getCertificateList?${queryString}`, {
    method: 'GET',
  }); return response.json();
}
export async function getCertificate(certificateId: number): Promise<ResponseType<CertificateInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/getCertificate/${certificateId}`, {
    method: 'GET',
  }); return response.json();
}

export async function updateCertificateNft(certificateId: number, data: { certificateNftId?: string; transactionHash?: string }): Promise<ResponseType<CertificateInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/updateCertificateNft/${certificateId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }); return response.json();
}

// TokenRule API
export async function createTokenRule(data: Partial<TokenRuleInfo>): Promise<ResponseType<TokenRuleInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/createTokenRule`, {
    method: 'POST',
    body: JSON.stringify(data),
  }); return response.json();
}
export async function updateTokenRule(ruleId: number, data: Partial<TokenRuleInfo>): Promise<ResponseType<TokenRuleInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/updateTokenRule/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }); return response.json();
}
export async function getTokenRuleList(params: { rewardType?: number; isEnabled?: number; page?: number; pageSize?: number }): Promise<ResponseType<{ records: TokenRuleInfo[]; total: number }>> {
  const queryString = buildGetTokenRuleListQuery(params);
  const response = await fetchWithAuth(`${API_BASE_URL}/getTokenRuleList?${queryString}`, {
    method: 'GET',
  }); return response.json();
}
export async function getTokenRule(ruleId: number): Promise<ResponseType<TokenRuleInfo>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/getTokenRule/${ruleId}`, {
    method: 'GET',
  }); return response.json();
}

// TokenTransaction API
export async function getTokenTransactionList(params: { transactionType?: number; rewardType?: number; consumeType?: number; relatedId?: number; page?: number; pageSize?: number }): Promise<ResponseType<{ records: TokenTransactionInfo[]; total: number }>> {
  const queryString = buildGetTokenTransactionListQuery(params);
  const response = await fetchWithAuth(`${API_BASE_URL}/getTokenTransactionList?${queryString}`, {
    method: 'GET',
  }); return response.json();
}
