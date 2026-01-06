import type { UserInfo } from './userType';

export interface AuditRecordInfo {
  auditId?: number;
  auditType?: number;
  targetId?: number;
  targetType?: number;
  auditorId?: number;
  auditStatus?: number;
  auditComment?: string;
  auditTime?: Date;
  createdAt?: Date;
  // 完整的用户信息对象
  targetUser?: UserInfo | null;
  auditor?: UserInfo | null;
}

