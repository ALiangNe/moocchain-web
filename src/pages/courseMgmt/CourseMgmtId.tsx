import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Drawer, message, Spin, Tooltip } from 'antd';
import { PlusOutlined, ArrowLeftOutlined, EditOutlined, ReloadOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getCourse, getResourceList, createResource, updateResource, updateCourse, reapplyCourseAudit, getAuditRecordList, getLearningRecordList, getCertificateTemplateList, getResourceCertificateConfigList, createResourceCertificateConfig, updateResourceCertificateConfig } from '@/api/baseApi';
import type { CourseInfo } from '@/types/courseType';
import type { ResourceInfo } from '@/types/resourceType';
import type { AuditRecordInfo } from '@/types/auditRecordType';
import type { LearningRecordInfo } from '@/types/learningRecordType';
import type { CertificateTemplateInfo } from '@/types/certificateTemplateType';
import type { ResourceCertificateConfigInfo } from '@/types/resourceCertificateConfigType';
import ResourceForm from '@/components/courseMgmt/ResourceForm';
import ResourceList from '@/components/courseMgmt/ResourceList';
import CourseDetailCard from '@/components/courseMgmt/CourseDetail';
import CourseForm from '@/components/courseMgmt/CourseForm';
import CourseCertificateConfigForm from '@/components/courseMgmt/CourseCertificateConfigForm';
import { UserRole } from '@/constants/role';
import { buildCreateResourceFormData } from '@/utils/buildApiParams';
import { ensureWalletConnected } from '@/utils/wallet';
import { mintResourceNft } from '@/utils/resourceNft';

export default function CourseMgmtId() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [resources, setResources] = useState<ResourceInfo[]>([]);
  const [rejectedResourceIds, setRejectedResourceIds] = useState<Set<number>>(new Set());
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [resourceRatings, setResourceRatings] = useState<Record<number, number>>({});
  const [latestAuditRecord, setLatestAuditRecord] = useState<AuditRecordInfo | null>(null);
  const [courseLoading, setCourseLoading] = useState(false);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [resourceModalVisible, setResourceModalVisible] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceInfo | null>(null);
  const [resourcePage, setResourcePage] = useState(1);
  const [resourceTotal, setResourceTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [courseEditVisible, setCourseEditVisible] = useState(false);
  const [courseEditLoading, setCourseEditLoading] = useState(false);
  const [reapplyingAudit, setReapplyingAudit] = useState(false);
  const [hasReappliedCourseAudit, setHasReappliedCourseAudit] = useState(false);
  const [certificateDrawerVisible, setCertificateDrawerVisible] = useState(false);
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [templates, setTemplates] = useState<CertificateTemplateInfo[]>([]);
  const [courseCertificateConfig, setCourseCertificateConfig] = useState<ResourceCertificateConfigInfo | null>(null);
  const courseLoadingRef = useRef(false);
  const resourceLoadingRef = useRef(false);
  const courseRequestIdRef = useRef(0);
  const resourceRequestIdRef = useRef(0);
  const ratingRequestIdRef = useRef(0);

  // 加载资源审核记录（用于资源列表 status 标签显示“审核未通过，请重新提交申请”）
  const loadResourceRejectedStatus = useCallback(async (resourceIds: number[]) => {
    if (!resourceIds.length) {
      setRejectedResourceIds(new Set());
      return;
    }

    const toTime = (value: unknown): number => {
      if (!value) return 0;
      if (value instanceof Date) return value.getTime();
      const t = new Date(String(value)).getTime();
      return Number.isFinite(t) ? t : 0;
    };

    let result;
    try {
      result = await getAuditRecordList({ targetType: 1, auditType: 1, page: 1, pageSize: 1000 });
    } catch (error) {
      console.error('Load resource audit records error:', error);
      setRejectedResourceIds(new Set());
      return;
    }

    if (result.code !== 0 || !result.data || !result.data.records) {
      setRejectedResourceIds(new Set());
      return;
    }

    const auditRecords = result.data.records.filter((r) => r.targetId !== undefined && resourceIds.includes(Number(r.targetId)));
    const latestByResourceId = new Map<number, AuditRecordInfo>();
    auditRecords.forEach((r) => {
      const rid = Number(r.targetId);
      const prev = latestByResourceId.get(rid);
      if (!prev) {
        latestByResourceId.set(rid, r);
        return;
      }
      const prevTime = toTime(prev.createdAt);
      const curTime = toTime(r.createdAt);
      if (curTime >= prevTime) latestByResourceId.set(rid, r);
    });

    const rejected = new Set<number>();
    latestByResourceId.forEach((r, rid) => {
      if (r.auditStatus === 2) rejected.add(rid);
    });
    setRejectedResourceIds(rejected);
  }, []);

  // 加载审核记录
  const loadAuditRecord = useCallback(async (courseId: number) => {
    setAuditLoading(true);

    let result;
    try {
      result = await getAuditRecordList({
        targetId: courseId,
        targetType: 2, // 课程
        auditType: 2, // 课程内容审核
        page: 1,
        pageSize: 1,
      });
    } catch (error) {
      console.error('Load audit record error:', error);
      setAuditLoading(false);
      setLatestAuditRecord(null);
      return;
    }

    setAuditLoading(false);

    if (result.code !== 0) {
      setLatestAuditRecord(null);
      return;
    }

    if (!result.data) {
      setLatestAuditRecord(null);
      return;
    }

    if (result.data.records.length === 0) {
      setLatestAuditRecord(null);
      return;
    }

    setLatestAuditRecord(result.data.records[0]);
  }, []);

  // 加载课程详情数据
  const loadCourse = useCallback(async () => {
    if (!courseId) return;
    if (courseLoadingRef.current) return;

    const currentRequestId = ++courseRequestIdRef.current;
    courseLoadingRef.current = true;

    queueMicrotask(() => {
      if (courseRequestIdRef.current !== currentRequestId) {
        courseLoadingRef.current = false;
        return;
      }
      setCourseLoading(true);
    });

    let result;
    try {
      result = await getCourse(Number(courseId));
    } catch (error) {
      console.error('Load course error:', error);
      if (courseRequestIdRef.current === currentRequestId) {
        setCourseLoading(false);
        courseLoadingRef.current = false;
        message.error('加载失败，请重试');
      }
      return;
    }

    if (courseRequestIdRef.current !== currentRequestId) return;

    setCourseLoading(false);
    courseLoadingRef.current = false;

    if (result.code !== 0 || !result.data) {
      message.error(result.message || '加载失败');
      return;
    }

    setCourse(result.data);

    // 如果课程状态为待审核（0），加载审核记录
    if (result.data.status === 0 && result.data.courseId) {
      loadAuditRecord(result.data.courseId);
    } else {
      setLatestAuditRecord(null);
    }
  }, [courseId, loadAuditRecord]);

  const loadCertificateTemplates = useCallback(async () => {
    let result;
    try {
      result = await getCertificateTemplateList({ isActive: 1, page: 1, pageSize: 100 });
    } catch (error) {
      console.error('Load certificate templates error:', error);
      setTemplates([]);
      return;
    }
    if (result.code !== 0 || !result.data) {
      setTemplates([]);
      return;
    }
    setTemplates(result.data.records || []);
  }, []);

  const loadCourseCertificateConfig = useCallback(async () => {
    if (!courseId) return;
    let result;
    try {
      result = await getResourceCertificateConfigList({ courseId: Number(courseId), page: 1, pageSize: 1 });
    } catch (error) {
      console.error('Load course certificate config error:', error);
      setCourseCertificateConfig(null);
      return;
    }
    if (result.code !== 0 || !result.data || !result.data.records || result.data.records.length === 0) {
      setCourseCertificateConfig(null);
      return;
    }
    setCourseCertificateConfig(result.data.records[0]);
  }, [courseId]);

  const handleOpenCertificateDrawer = async () => {
    setCertificateDrawerVisible(true);
    await Promise.all([loadCertificateTemplates(), loadCourseCertificateConfig()]);
  };

  const handleSubmitCourseCertificateConfig = async (values: Partial<ResourceCertificateConfigInfo>) => {
    if (!courseId) return;
    setCertificateLoading(true);

    const params: Partial<ResourceCertificateConfigInfo> = {
      courseId: Number(courseId),
      templateId: values.templateId,
      completionRequirement: values.completionRequirement,
      minLearningTime: values.minLearningTime,
      isEnabled: values.isEnabled,
      overrideFields: values.overrideFields,
    };

    let result;
    try {
      if (courseCertificateConfig?.configId) {
        result = await updateResourceCertificateConfig(courseCertificateConfig.configId, params);
      } else {
        result = await createResourceCertificateConfig(params);
      }
    } catch (error) {
      console.error('Save course certificate config error:', error);
      setCertificateLoading(false);
      message.error('保存失败，请重试');
      return;
    }

    setCertificateLoading(false);
    if (result.code !== 0 || !result.data) {
      message.error(result.message || '保存失败');
      return;
    }

    message.success('课程证书配置已保存');
    setCourseCertificateConfig(result.data);
    setCertificateDrawerVisible(false);
  };

  // 加载课程资源列表数据
  const loadResources = useCallback(async () => {
    if (!courseId) return;
    if (resourceLoadingRef.current) return;

    const currentRequestId = ++resourceRequestIdRef.current;
    resourceLoadingRef.current = true;

    queueMicrotask(() => {
      if (resourceRequestIdRef.current !== currentRequestId) {
        resourceLoadingRef.current = false;
        return;
      }
      setResourceLoading(true);
    });

    let result;
    try {
      result = await getResourceList({ courseId: Number(courseId), page: resourcePage, pageSize });
    } catch (error) {
      console.error('Load resources error:', error);
      if (resourceRequestIdRef.current === currentRequestId) {
        setResourceLoading(false);
        resourceLoadingRef.current = false;
        message.error('加载失败，请重试');
      }
      return;
    }

    if (resourceRequestIdRef.current !== currentRequestId) return;

    setResourceLoading(false);
    resourceLoadingRef.current = false;

    if (result.code !== 0 || !result.data) {
      message.error(result.message || '加载失败');
      return;
    }

    setResources(result.data.records);
    setResourceTotal(result.data.total);

    const ids = (result.data.records || []).map((item) => item.resourceId).filter(Boolean) as number[];
    await loadResourceRejectedStatus(ids);
  }, [courseId, resourcePage, pageSize, loadResourceRejectedStatus]);

  // 计算资源平均评分
  const calculateResourceRatings = useCallback(async (resourceIds: number[]) => {
    const currentRequestId = ++ratingRequestIdRef.current;
    const commitResourceRatings = (value: Record<number, number>) => {
      if (ratingRequestIdRef.current === currentRequestId) {
        queueMicrotask(() => setResourceRatings(value));
      }
    };

    if (!resourceIds.length) {
      commitResourceRatings({});
      return { ratedRecords: [] as LearningRecordInfo[], requestId: currentRequestId };
    }

    let result;
    try {
      result = await getLearningRecordList({ page: 1, pageSize: 1000 });
    } catch (error) {
      console.error('Load ratings error:', error);
      commitResourceRatings({});
      return { ratedRecords: [] as LearningRecordInfo[], requestId: currentRequestId };
    }

    if (ratingRequestIdRef.current !== currentRequestId) {
      return { ratedRecords: [] as LearningRecordInfo[], requestId: currentRequestId };
    }

    if (result.code !== 0 || !result.data) {
      commitResourceRatings({});
      return { ratedRecords: [] as LearningRecordInfo[], requestId: currentRequestId };
    }

    const ratedRecords = (result.data.records || []).filter(
      (record: LearningRecordInfo) =>
        record.resourceId &&
        resourceIds.includes(Number(record.resourceId)) &&
        record.rating !== undefined &&
        record.rating !== null
    );

    if (!ratedRecords.length) {
      commitResourceRatings({});
      return { ratedRecords, requestId: currentRequestId };
    }

    const ratingBuckets: Record<number, { sum: number; count: number }> = {};
    ratedRecords.forEach((record: LearningRecordInfo) => {
      const rid = Number(record.resourceId);
      if (!ratingBuckets[rid]) ratingBuckets[rid] = { sum: 0, count: 0 };
      ratingBuckets[rid].sum += Number(record.rating);
      ratingBuckets[rid].count += 1;
    });

    const resourceRatingMap: Record<number, number> = {};
    Object.entries(ratingBuckets).forEach(([rid, { sum, count }]) => {
      resourceRatingMap[Number(rid)] = sum / count;
    });

    commitResourceRatings(resourceRatingMap);
    return { ratedRecords, requestId: currentRequestId };
  }, []);

  // 计算课程平均评分（基于资源评分结果）
  const calculateCourseRatings = useCallback(async (resourceIds: number[]) => {
    const { ratedRecords, requestId } = await calculateResourceRatings(resourceIds);
    const commitAverage = (value: number | null) => {
      if (ratingRequestIdRef.current === requestId) {
        queueMicrotask(() => setAverageRating(value));
      }
    };

    if (!ratedRecords.length) {
      commitAverage(null);
      return;
    }

    if (ratingRequestIdRef.current !== requestId) return;

    const totalRating = ratedRecords.reduce((sum, record) => sum + Number(record.rating), 0);
    commitAverage(totalRating / ratedRecords.length);
  },
    [calculateResourceRatings]
  );

  useEffect(() => {
    const effectRequestId = courseRequestIdRef.current;
    queueMicrotask(() => {
      loadCourse();
    });
    return () => {
      courseRequestIdRef.current = effectRequestId + 1;
    };
  }, [loadCourse]);

  useEffect(() => {
    const effectRequestId = resourceRequestIdRef.current;
    queueMicrotask(() => {
      loadResources();
    });
    return () => {
      resourceRequestIdRef.current = effectRequestId + 1;
    };
  }, [loadResources]);

  // 资源变化时计算课程平均评分
  useEffect(() => {
    const ids = resources.map((item) => item.resourceId).filter(Boolean) as number[];
    calculateCourseRatings(ids);
  }, [resources, calculateCourseRatings]);

  // 创建新资源
  const handleCreateResource = async (values: Partial<ResourceInfo> & { file?: File }) => {
    const resourceCourseId = values.courseId || courseId;
    if (!resourceCourseId) {
      message.error('课程ID不存在');
      return;
    }

    if (!values.file) {
      message.error('请选择要上传的文件');
      return;
    }

    const wallet = await ensureWalletConnected();
    if (!wallet) return;

    const formData = buildCreateResourceFormData({
      courseId: Number(resourceCourseId),
      title: values.title || '',
      description: values.description,
      resourceType: values.resourceType,
      price: values.price,
      accessScope: values.accessScope,
      file: values.file,
    });

    let result;
    try {
      result = await createResource(formData);
    } catch (error) {
      console.error('Create resource error:', error);
      message.error('创建失败，请重试');
      return;
    }

    if (result.code !== 0) {
      message.error(result.message || '创建失败');
      return;
    }

    const resourceId = result.data?.resourceId;
    const ipfsHash = result.data?.ipfsHash;
    if (!resourceId || !ipfsHash) {
      message.error('资源创建成功，但返回数据不完整');
      return;
    }

    message.loading({ content: '正在铸造 NFT...', key: 'mint', duration: 0 });

    const createdAt = Math.floor(Date.now() / 1000);

    let tokenId: string;
    try {
      tokenId = await mintResourceNft({ signer: wallet.signer, ownerAddress: wallet.address, ipfsHash, createdAt });
    } catch (error) {
      console.error('Mint NFT error:', error);
      message.destroy('mint');
      message.error(error instanceof Error ? error.message : '铸造失败，请重试');
      return;
    }

    message.destroy('mint');

    let updateResult;
    try {
      updateResult = await updateResource(resourceId, { resourceNftId: tokenId });
    } catch (error) {
      console.error('Update resource nftId error:', error);
      message.error('铸造成功，但写入数据库失败，请重试');
      return;
    }

    if (updateResult.code !== 0) {
      message.error(updateResult.message || '铸造成功，但写入数据库失败');
      return;
    }

    message.success(`资源创建成功，NFT TokenId: ${tokenId}`);
    setResourceModalVisible(false);
    loadResources();
  };

  // 编辑资源信息
  const handleEditResource = async (values: Partial<ResourceInfo>) => {
    if (!editingResource || !editingResource.resourceId) {
      message.error('资源信息不存在');
      return;
    }

    const payload: Partial<ResourceInfo> = {
      title: values.title,
      description: values.description,
      resourceType: values.resourceType,
      price: values.price,
      accessScope: values.accessScope,
    };

    // 如果在表单中选择了资源状态（发布/下架），一并提交
    if (values.status !== undefined) {
      payload.status = values.status;
    }

    let result;
    try {
      result = await updateResource(editingResource.resourceId, payload);
    } catch (error) {
      console.error('Update resource error:', error);
      message.error('更新失败，请重试');
      return;
    }

    if (result.code !== 0) {
      message.error(result.message || '更新失败');
      return;
    }

    message.success('资源更新成功');
    setEditingResource(null);
    loadResources();
  };

  // 处理编辑资源点击事件
  const handleEditClick = (resource: ResourceInfo) => {
    setEditingResource(resource);
  };

  // 处理资源点击，跳转到资源详情页
  const handleResourceClick = (resource: ResourceInfo) => {
    if (resource.resourceId && courseId) {
      navigate(`/coursemgmt/${courseId}/resource/${resource.resourceId}`);
    }
  };

  // 编辑课程信息
  const handleUpdateCourse = async (values: Partial<CourseInfo>, coverImage?: File) => {
    if (!course || !course.courseId) {
      message.error('课程信息不存在');
      return;
    }

    setCourseEditLoading(true);
    let updateResult;
    try {
      // try 内只放 API 请求
      updateResult = await updateCourse(course.courseId, values, coverImage);
    } catch (error) {
      console.error('Update course error:', error);
      setCourseEditLoading(false);
      message.error('更新失败，请重试');
      return;
    }

    if (updateResult.code !== 0) {
      setCourseEditLoading(false);
      message.error(updateResult.message || '更新失败');
      return;
    }

    // updateCourse 返回的 course 不包含 teacher（join 信息），立刻拉一次详情以保持 UI 稳定
    let refreshed;
    try {
      // try 内只放 API 请求
      refreshed = await getCourse(course.courseId);
    } catch (error) {
      console.error('Refresh course error:', error);
      setCourseEditLoading(false);
      message.success('课程更新成功');
      // 保底：至少保留原 teacher 信息，避免 UI 闪烁
      setCourse((prev) => (prev ? { ...prev, ...updateResult.data } : prev));
      setCourseEditVisible(false);
      return;
    }

    setCourseEditLoading(false);

    if (refreshed.code !== 0 || !refreshed.data) {
      message.success('课程更新成功');
      // 保底：至少保留原 teacher 信息，避免 UI 闪烁
      setCourse((prev) => (prev ? { ...prev, ...updateResult.data } : prev));
      setCourseEditVisible(false);
      return;
    }

    message.success('课程更新成功');
    setCourse(refreshed.data);
    setCourseEditVisible(false);
  };

  // 重新提交课程审核（仅限被拒绝后的待审核课程）
  const handleReapplyCourseAudit = async () => {
    if (!course || !course.courseId) {
      message.error('课程信息不存在');
      return;
    }

    // 只有待审核状态的课程才允许重新提交审核
    if (course.status !== 0) {
      message.warning('只有待审核状态的课程可以重新提交审核');
      return;
    }

    setReapplyingAudit(true);

    let result;
    try {
      result = await reapplyCourseAudit({ courseId: course.courseId });
    } catch (error) {
      console.error('Reapply course audit error:', error);
      setReapplyingAudit(false);
      message.error('重新提交审核失败，请重试');
      return;
    }

    setReapplyingAudit(false);

    if (!result || result.code !== 0) {
      message.error(result?.message || '重新提交审核失败');
      return;
    }

    message.success('已重新提交审核，请等待管理员审核');
    setHasReappliedCourseAudit(true);
    // 重新加载课程，会自动加载审核记录（如果状态为待审核）
    loadCourse();
  };

  if (courseLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-12">
        <div className="w-full max-w-[1600px] mx-auto">
          <Card className="shadow-sm">
            <p className="text-center text-[#6e6e73]">课程不存在</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="w-full max-w-[1600px] mx-auto">
        <Card className="shadow-sm mb-6 rounded-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button icon={<ArrowLeftOutlined />} type="text" shape="circle" onClick={() => navigate('/coursemgmt')} aria-label="返回课程列表" />
              <h1 className="text-lg font-semibold text-[#1d1d1f]">课程详情</h1>
            </div>
            {user?.role !== UserRole.STUDENT && (
              <div className="flex gap-3">
                {course.status === 0 && latestAuditRecord && (latestAuditRecord.auditStatus === 2 || hasReappliedCourseAudit) && (
                  <Tooltip title={hasReappliedCourseAudit ? '您已重新提交审核，请耐心等待！' : ''}>
                    <Button icon={<ReloadOutlined />} loading={reapplyingAudit} onClick={handleReapplyCourseAudit} className="rounded-lg" disabled={hasReappliedCourseAudit || latestAuditRecord.auditStatus !== 2}>
                      重新提交审核
                    </Button>
                  </Tooltip>
                )}
                <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={handleOpenCertificateDrawer} className="rounded-lg">
                  设置课程证书
                </Button>
                <Button type="primary" icon={<EditOutlined />} onClick={() => setCourseEditVisible(true)} className="rounded-lg">
                  编辑课程
                </Button>
              </div>
            )}
          </div>
        </Card>

        <CourseDetailCard course={course} latestAuditRecord={latestAuditRecord} auditLoading={auditLoading} averageRating={averageRating} />

        <Card className="shadow-sm mb-4 rounded-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-[#1d1d1f]">资源列表</h2>
            {user?.role !== UserRole.STUDENT && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setResourceModalVisible(true)} className="rounded-lg">上传资源</Button>
            )}
          </div>
        </Card>
        <Card className="shadow-sm rounded-2xl">
          <ResourceList data={resources} loading={resourceLoading} page={resourcePage} pageSize={pageSize} total={resourceTotal} resourceRatings={resourceRatings} rejectedResourceIds={rejectedResourceIds} onPageChange={(p, s) => { setResourcePage(p); setPageSize(s); }} onEdit={user?.role !== UserRole.STUDENT ? handleEditClick : undefined} onItemClick={handleResourceClick} />
        </Card>

        <Drawer title="上传资源" open={resourceModalVisible} onClose={() => setResourceModalVisible(false)} width={700} placement="right">
          {courseId && <ResourceForm courseId={Number(courseId)} onSubmit={handleCreateResource} onCancel={() => setResourceModalVisible(false)} />}
        </Drawer>

        <Drawer title="编辑资源" open={!!editingResource} onClose={() => setEditingResource(null)} width={700} placement="right">
          {editingResource && courseId && (
            <ResourceForm courseId={Number(courseId)} initialValues={editingResource} onSubmit={async (values) => { await handleEditResource(values); }} onCancel={() => setEditingResource(null)} />
          )}
        </Drawer>

        <Drawer title="编辑课程" open={courseEditVisible} onClose={() => setCourseEditVisible(false)} width={700} placement="right">
          {course && (
            <CourseForm initialValues={course} onSubmit={handleUpdateCourse} onCancel={() => setCourseEditVisible(false)} loading={courseEditLoading} />
          )}
        </Drawer>

        <Drawer title="设置课程证书" open={certificateDrawerVisible} onClose={() => setCertificateDrawerVisible(false)} width={700} placement="right">
          <CourseCertificateConfigForm templates={templates} initialValues={courseCertificateConfig} defaultCourseName={course.courseName} defaultIssuerName={user?.realName || user?.username || ''} defaultTeacherSchool={course.teacher?.schoolName || ''} loading={certificateLoading} onSubmit={handleSubmitCourseCertificateConfig} onCancel={() => setCertificateDrawerVisible(false)} />
        </Drawer>
      </div>
    </div>
  );
}
