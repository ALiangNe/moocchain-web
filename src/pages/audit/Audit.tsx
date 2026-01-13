import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Drawer, Tabs, message } from 'antd';
import { getAuditRecordList, approveTeacherApplication, approveResourceApplication } from '@/api/baseApi';
import type { AuditRecordInfo } from '@/types/auditRecordType';
import AuditRecordDetail from '@/components/audit/CertificateDetail';
import AuditRecordTable from '@/components/audit/CertificateTable';
import ResourceAuditTable from '@/components/audit/ResourceAuditTable';
import ResourceAuditDetail from '@/components/audit/ResourceAuditDetail';
import AuditApproveModal from '@/components/audit/AuditApplyModal';

const { TabPane } = Tabs;

export default function Audit() {
  const [loading, setLoading] = useState(false);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [data, setData] = useState<{ records: AuditRecordInfo[]; total: number }>({ records: [], total: 0 });
  const [resourceData, setResourceData] = useState<{ records: AuditRecordInfo[]; total: number }>({ records: [], total: 0 });
  const [page, setPage] = useState(1);
  const [resourcePage, setResourcePage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRecord, setSelectedRecord] = useState<AuditRecordInfo | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [approveVisible, setApproveVisible] = useState(false);
  const [approving, setApproving] = useState(false);
  const [currentAuditId, setCurrentAuditId] = useState<number | null>(null);
  const [auditStatus, setAuditStatus] = useState<number | null>(null);
  const [approveRecord, setApproveRecord] = useState<AuditRecordInfo | null>(null);
  const [approveType, setApproveType] = useState<'teacher' | 'resource'>('teacher');
  const loadingRef = useRef(false);
  const resourceLoadingRef = useRef(false);
  const requestIdRef = useRef(0);
  const resourceRequestIdRef = useRef(0);

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
      result = await getAuditRecordList({ targetType: 1, page: currentPage, pageSize: currentPageSize });
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

  // 查看教师认证审核详情
  const handleViewDetail = (record: AuditRecordInfo) => {
    // 直接使用列表返回的数据，无需再次请求详情接口
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
      result = await getAuditRecordList({ targetType: 2, page: currentPage, pageSize: currentPageSize });
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

  useEffect(() => {
    const effectRequestId = resourceRequestIdRef.current;
    queueMicrotask(() => {
      loadResourceData();
    });
    return () => {
      resourceRequestIdRef.current = effectRequestId + 1;
    };
  }, [loadResourceData]);

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

  // 确认审批操作，提交审批结果
  const handleConfirmApprove = async (comment: string) => {
    if (!currentAuditId || auditStatus === null) return;

    setApproving(true);

    let result;
    if (approveType === 'teacher') {
      try {
        result = await approveTeacherApplication({
          auditId: currentAuditId,
          auditStatus: auditStatus,
          auditComment: comment || undefined,
        });
      } catch (error) {
        console.error('Approve teacher error:', error);
        message.error('审批失败，请重试');
        setApproving(false);
        return;
      }
    } else {
      try {
        result = await approveResourceApplication({
          auditId: currentAuditId,
          auditStatus: auditStatus,
          auditComment: comment || undefined,
        });
      } catch (error) {
        console.error('Approve resource error:', error);
        message.error('审批失败，请重试');
        setApproving(false);
        return;
      }
    }

    setApproving(false);

    if (result.code !== 0) {
      message.error(result.message || '审批失败');
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
  };

  // 查看资源合规审核详情
  const handleViewResourceDetail = (record: AuditRecordInfo) => {
    setSelectedRecord(record);
    setDetailVisible(true);
  };

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-lg font-semibold mb-8 text-[#1d1d1f]">审核管理</h1>

        <Tabs
          defaultActiveKey="teacher"
          className="bg-white rounded-lg shadow-sm px-4 [&_.ant-tabs-nav::before]:hidden"
        >
          <TabPane tab="教师认证审核" key="teacher">
            <Card className="shadow-sm">
              <AuditRecordTable data={data.records} loading={loading} page={page} pageSize={pageSize} total={data.total} onPageChange={(p, s) => { setPage(p); setPageSize(s); }} onViewDetail={handleViewDetail} />
            </Card>
          </TabPane>
          <TabPane tab="资源合规审核" key="resource">
            <Card className="shadow-sm">
              <ResourceAuditTable data={resourceData.records} loading={resourceLoading} page={resourcePage} pageSize={pageSize} total={resourceData.total} onPageChange={(p, s) => { setResourcePage(p); setPageSize(s); }} onViewDetail={handleViewResourceDetail} />
            </Card>
          </TabPane>
        </Tabs>

        <Drawer title="审核详情" open={detailVisible} onClose={() => setDetailVisible(false)} width={800} placement="right">
          {selectedRecord && (
            selectedRecord.targetType === 2 ? (
              <ResourceAuditDetail record={selectedRecord} onApprove={handleApproveResource} />
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

