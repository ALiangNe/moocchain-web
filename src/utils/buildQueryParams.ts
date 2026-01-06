export function buildQueryParams(params: Record<string, string | number | boolean | undefined | null>): string {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    queryParams.append(key, String(value));
  });

  return queryParams.toString();
}

// 命名: build + API名字（getAuditRecordList） + Query = buildGetAuditRecordListQuery
export function buildGetAuditRecordListQuery(params: { targetId?: number; targetType?: number; auditType?: number; auditStatus?: number; auditorId?: number; page?: number; pageSize?: number }): string {
  return buildQueryParams({
    targetId: params.targetId,
    targetType: params.targetType,
    auditType: params.auditType,
    auditStatus: params.auditStatus,
    auditorId: params.auditorId,
    page: params.page,
    pageSize: params.pageSize,
  });
}

