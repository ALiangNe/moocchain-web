import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Drawer, message } from 'antd';
import { getAuditRecordList, approveTeacherApplication, approveResourceApplication, approveCourseApplication } from '@/api/baseApi';
import type { AuditRecordInfo } from '@/types/auditRecordType';
import AuditRecordDetail from '@/components/audit/CertificateDetail';
import AuditRecordTable from '@/components/audit/CertificateTable';
import ResourceAuditTable from '@/components/audit/ResourceAuditTable';
import ResourceAuditDetail from '@/components/audit/ResourceAuditDetail';
import CourseAuditTable from '@/components/audit/CourseAuditTable';
import CourseAuditDetail from '@/components/audit/CourseAuditDetail';
import AuditApproveModal from '@/components/audit/AuditApplyModal';
import AuditBarChart from '@/components/audit/AuditBarChart';
import AuditLineChart from '@/components/audit/AuditLineChart';

export default function Audit() {
  const [loading, setLoading] = useState(false);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [courseLoading, setCourseLoading] = useState(false);
  const [data, setData] = useState<{ records: AuditRecordInfo[]; total: number }>({ records: [], total: 0 });
  const [resourceData, setResourceData] = useState<{ records: AuditRecordInfo[]; total: number }>({ records: [], total: 0 });
  const [courseData, setCourseData] = useState<{ records: AuditRecordInfo[]; total: number }>({ records: [], total: 0 });
  const [page, setPage] = useState(1);
  const [resourcePage, setResourcePage] = useState(1);
  const [coursePage, setCoursePage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRecord, setSelectedRecord] = useState<AuditRecordInfo | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [approveVisible, setApproveVisible] = useState(false);
  const [approving, setApproving] = useState(false);
  const [currentAuditId, setCurrentAuditId] = useState<number | null>(null);
  const [auditStatus, setAuditStatus] = useState<number | null>(null);
  const [approveRecord, setApproveRecord] = useState<AuditRecordInfo | null>(null);
  const [approveType, setApproveType] = useState<'teacher' | 'resource' | 'course'>('teacher');
  const loadingRef = useRef(false);
  const resourceLoadingRef = useRef(false);
  const courseLoadingRef = useRef(false);
  const requestIdRef = useRef(0);
  const resourceRequestIdRef = useRef(0);
  const courseRequestIdRef = useRef(0);

  // 加载教师认证审核数据列表
  const loadData = useCallback(async () => {
    if (loadingRef.current) {
      return;
    }

    const currentPage = page;
    const currentPageSize = pageSize;
    const currentRequestId = ++requestIdRef.current;
    loadingRef.current = true;

    queueMicrotask(() => {
      if (requestIdRef.current !== currentRequestId) {
        loadingRef.current = false;
        return;
      }
      setLoading(true);
    });

    let result;
    try {
      // 教师认证审核：auditType=0(用户身份) + targetType=0(用户)
      result = await getAuditRecordList({ auditType: 0, targetType: 0, page: currentPage, pageSize: currentPageSize });
    } catch (error) {
      console.error('Load audit records error:', error);
      if (requestIdRef.current === currentRequestId) {
        setLoading(false);
        loadingRef.current = false;
        message.error('加载失败，请重试');
      }
      return;
    }

    if (requestIdRef.current !== currentRequestId) {
      return;
    }

    setLoading(false);
    loadingRef.current = false;

    if (result.code !== 0 || !result.data) {
      message.error(result.message || '加载失败');
      return;
    }

    setData(result.data);
  }, [page, pageSize]);

  // 加载资源合规审核数据列表
  const loadResourceData = useCallback(async () => {
    if (resourceLoadingRef.current) return;

    const currentPage = resourcePage;
    const currentPageSize = pageSize;
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
      // 资源合规审核：auditType=1(资源内容) + targetType=1(资源)
      result = await getAuditRecordList({ auditType: 1, targetType: 1, page: currentPage, pageSize: currentPageSize });
    } catch (error) {
      console.error('Load resource audit records error:', error);
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

    setResourceData(result.data);
  }, [resourcePage, pageSize]);

  // 加载课程审核数据列表
  const loadCourseData = useCallback(async () => {
    if (courseLoadingRef.current) return;

    const currentPage = coursePage;
    const currentPageSize = pageSize;
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
      // 课程审核：auditType=2(课程内容) + targetType=2(课程)
      result = await getAuditRecordList({ auditType: 2, targetType: 2, page: currentPage, pageSize: currentPageSize });
    } catch (error) {
      console.error('Load course audit records error:', error);
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

    setCourseData(result.data);
  }, [coursePage, pageSize]);

  // 查看教师认证审核详情
  const handleViewDetail = (record: AuditRecordInfo) => {
    // 直接使用列表返回的数据，无需再次请求详情接口
    setSelectedRecord(record);
    setDetailVisible(true);
  };

  // 查看资源合规审核详情
  const handleViewResourceDetail = (record: AuditRecordInfo) => {
    setSelectedRecord(record);
    setDetailVisible(true);
  };

  // 查看课程审核详情
  const handleViewCourseDetail = (record: AuditRecordInfo) => {
    setSelectedRecord(record);
    setDetailVisible(true);
  };

  // 处理教师认证审批操作
  const handleApprove = (status: number) => {
    if (!selectedRecord || !selectedRecord.auditId) return;
    if (selectedRecord.auditStatus !== 0) {
      message.warning('该申请已处理，无法重复操作');
      return;
    }
    setCurrentAuditId(selectedRecord.auditId);
    setAuditStatus(status);
    setApproveRecord(selectedRecord);
    setApproveType('teacher');
    setApproveVisible(true);
  };

  // 处理资源合规审批操作
  const handleApproveResource = (status: number) => {
    if (!selectedRecord || !selectedRecord.auditId) return;
    if (selectedRecord.auditStatus !== 0) {
      message.warning('该申请已处理，无法重复操作');
      return;
    }
    setCurrentAuditId(selectedRecord.auditId);
    setAuditStatus(status);
    setApproveRecord(selectedRecord);
    setApproveType('resource');
    setApproveVisible(true);
  };

  // 处理课程审核审批操作
  const handleApproveCourse = (status: number) => {
    if (!selectedRecord || !selectedRecord.auditId) return;
    if (selectedRecord.auditStatus !== 0) {
      message.warning('该申请已处理，无法重复操作');
      return;
    }
    setCurrentAuditId(selectedRecord.auditId);
    setAuditStatus(status);
    setApproveRecord(selectedRecord);
    setApproveType('course');
    setApproveVisible(true);
  };

  // 确认审批操作，提交审批结果
  const handleConfirmApprove = async (comment: string) => {
    if (!currentAuditId || auditStatus === null) return;

    setApproving(true);

    let result;
    try {
      if (approveType === 'teacher') {
        result = await approveTeacherApplication({
          auditId: currentAuditId,
          auditStatus: auditStatus,
          auditComment: comment || undefined,
        });
      } else if (approveType === 'resource') {
        result = await approveResourceApplication({
          auditId: currentAuditId,
          auditStatus: auditStatus,
          auditComment: comment || undefined,
        });
      } else if (approveType === 'course') {
        result = await approveCourseApplication({
          auditId: currentAuditId,
          auditStatus: auditStatus,
          auditComment: comment || undefined,
        });
      } else {
        message.error('未知的审批类型');
        setApproving(false);
        return;
      }
    } catch (error) {
      console.error('Approve error:', error);
      message.error('审批失败，请重试');
      setApproving(false);
      return;
    }

    setApproving(false);

    if (!result || result.code !== 0) {
      message.error(result?.message || '审批失败');
      return;
    }

    message.success(auditStatus === 1 ? '审批通过' : '审批拒绝');
    setApproveVisible(false);
    setDetailVisible(false);
    setCurrentAuditId(null);
    setAuditStatus(null);
    setApproveRecord(null);
    setSelectedRecord(null);
    loadData();
    loadResourceData();
    loadCourseData();
  };


  useEffect(() => {
    // 如果正在加载中，则不重复加载
    if (loadingRef.current) {
      return;
    }

    // 保存当前的 requestId，用于 cleanup
    const effectRequestId = requestIdRef.current;

    // 使用 queueMicrotask 延迟调用，避免在 effect 中同步调用 setState
    queueMicrotask(() => {
      loadData();
    });

    // 清理函数：组件卸载或依赖变化时取消请求
    return () => {
      // 标记当前请求为过期（通过增加 requestId）
      // 注意：这里我们增加 requestId，使 loadData 中的请求失效
      requestIdRef.current = effectRequestId + 1;
    };
  }, [loadData]);

  useEffect(() => {
    const effectRequestId = courseRequestIdRef.current;
    queueMicrotask(() => {
      loadCourseData();
    });
    return () => {
      courseRequestIdRef.current = effectRequestId + 1;
    };
  }, [loadCourseData]);

  useEffect(() => {
    const effectRequestId = resourceRequestIdRef.current;
    queueMicrotask(() => {
      loadResourceData();
    });
    return () => {
      resourceRequestIdRef.current = effectRequestId + 1;
    };
  }, [loadResourceData]);

  return (
    <div className="py-12">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-sm mb-8 rounded-2xl">
          <h1 className="text-lg font-semibold text-[#1d1d1f]">审核管理</h1>
        </Card>

        {/* 审核状态统计图表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-sm rounded-2xl">
            <AuditBarChart teacherRecords={data.records} resourceRecords={resourceData.records} courseRecords={courseData.records} />
          </Card>
          <Card className="shadow-sm rounded-2xl">
            <AuditLineChart teacherRecords={data.records} resourceRecords={resourceData.records} courseRecords={courseData.records} />
          </Card>
        </div>

        {/* 教师认证审核 */}
        <Card className="shadow-sm mb-8 rounded-2xl">
          <h2 className="text-base font-semibold text-[#1d1d1f] mb-4">教师认证审核</h2>
              <AuditRecordTable data={data.records} loading={loading} page={page} pageSize={pageSize} total={data.total} onPageChange={(p, s) => { setPage(p); setPageSize(s); }} onViewDetail={handleViewDetail} />
            </Card>

        {/* 资源合规审核 */}
        <Card className="shadow-sm mb-8 rounded-2xl">
          <h2 className="text-base font-semibold text-[#1d1d1f] mb-4">资源合规审核</h2>
              <ResourceAuditTable data={resourceData.records} loading={resourceLoading} page={resourcePage} pageSize={pageSize} total={resourceData.total} onPageChange={(p, s) => { setResourcePage(p); setPageSize(s); }} onViewDetail={handleViewResourceDetail} />
            </Card>

        {/* 课程合规审核 */}
            <Card className="shadow-sm rounded-2xl">
          <h2 className="text-base font-semibold text-[#1d1d1f] mb-4">课程合规审核</h2>
              <CourseAuditTable data={courseData.records} loading={courseLoading} page={coursePage} pageSize={pageSize} total={courseData.total} onPageChange={(p, s) => { setCoursePage(p); setPageSize(s); }} onViewDetail={handleViewCourseDetail} />
            </Card>

        <Drawer title="审核详情" open={detailVisible} onClose={() => setDetailVisible(false)} width={800} placement="right">
          {selectedRecord && (
            selectedRecord.targetType === 1 ? (
              <ResourceAuditDetail record={selectedRecord} onApprove={handleApproveResource} />
            ) : selectedRecord.targetType === 2 ? (
              <CourseAuditDetail record={selectedRecord} onApprove={handleApproveCourse} />
            ) : (
              <AuditRecordDetail record={selectedRecord} onApprove={handleApprove} />
            )
          )}
        </Drawer>

        <AuditApproveModal visible={approveVisible} auditStatus={auditStatus} loading={approving} record={approveRecord} onConfirm={handleConfirmApprove} onCancel={() => { setApproveVisible(false); setCurrentAuditId(null); setAuditStatus(null); setApproveRecord(null); }} />
      </div>
    </div>
  );
}

