/**
 * 构建 POST/PUT 请求的 FormData 请求参数
 * 用于文件上传和表单数据提交，支持同时传递文本数据和文件
 * @param data 文本数据对象
 * @param fileField 文件字段名和文件对象的映射，例如 { coverImage: file }
 * @param excludeFields 需要排除的字段名数组（通常用于排除文件字段，避免重复添加）
 * @returns FormData 对象，可直接作为请求的 body
 * @example
 * const formData = buildFormData(
 *   { courseName: 'Java', description: '...' },
 *   { coverImage: file },
 *   ['coverImage']
 * );
 * fetch('/api/createCourse', { method: 'POST', body: formData })
 */
export function buildFormData(
  data: Record<string, string | number | boolean | Date | undefined | null>,
  fileField?: Record<string, File>,
  excludeFields: string[] = []
): FormData {
  const formData = new FormData();

  // 添加文本字段
  Object.entries(data).forEach(([key, value]) => {
    // 跳过排除的字段和文件字段
    if (excludeFields.includes(key) || (fileField && key in fileField)) return;
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, String(value));
    }
  });

  // 添加文件字段
  if (fileField) {
    Object.entries(fileField).forEach(([key, file]) => {
      if (file) {
        formData.append(key, file);
      }
    });
  }

  return formData;
}

/**
 * 构建创建资源的 POST 请求 FormData 参数
 */
export function buildCreateResourceFormData(params: { courseId: number; title: string; description?: string; resourceType?: number; price?: number; accessScope?: number; file: File }): FormData {
  return buildFormData(
    {
      courseId: params.courseId,
      title: params.title,
      description: params.description,
      resourceType: params.resourceType,
      price: params.price,
      accessScope: params.accessScope,
    },
    { file: params.file }
  );
}

/**
 * 构建 GET 请求的 URL 查询参数
 * 将参数对象转换为查询字符串，例如: { page: 1, pageSize: 10 } => "page=1&pageSize=10"
 * 命名规则: build + API名字（getAuditRecordList） + Query = buildGetAuditRecordListQuery
 * @param params 参数对象
 * @returns 查询参数字符串，可直接拼接到 URL 后面
 * @example
 * const query = buildQueryParams({ page: 1, pageSize: 10 });
 * // 结果: "page=1&pageSize=10"
 * fetch(`/api/getList?${query}`)
 */
export function buildQueryParams(params: Record<string, string | number | boolean | undefined | null>): string {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    queryParams.append(key, String(value));
  });

  return queryParams.toString();
}

/**
 * 构建获取审核记录列表的 GET 请求查询参数
 */
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

/**
 * 构建获取课程列表的 GET 请求查询参数
 */
export function buildGetCourseListQuery(params: { teacherId?: number; status?: number; page?: number; pageSize?: number }): string {
  return buildQueryParams({
    teacherId: params.teacherId,
    status: params.status,
    page: params.page,
    pageSize: params.pageSize,
  });
}

/**
 * 构建获取资源列表的 GET 请求查询参数
 */
export function buildGetResourceListQuery(params: { courseId?: number; ownerId?: number; resourceType?: number; status?: number; page?: number; pageSize?: number }): string {
  return buildQueryParams({
    courseId: params.courseId,
    ownerId: params.ownerId,
    resourceType: params.resourceType,
    status: params.status,
    page: params.page,
    pageSize: params.pageSize,
  });
}

/**
 * 构建获取学习记录列表的 GET 请求查询参数
 */
export function buildGetLearningRecordListQuery(params: { studentId?: number; resourceId?: number; page?: number; pageSize?: number }): string {
  return buildQueryParams({
    studentId: params.studentId,
    resourceId: params.resourceId,
    page: params.page,
    pageSize: params.pageSize,
  });
}

/**
 * 构建获取学习历史课程列表的 GET 请求查询参数
 */
export function buildGetLearningHistoryListQuery(params: { page?: number; pageSize?: number }): string {
  return buildQueryParams({
    page: params.page,
    pageSize: params.pageSize,
  });
}
