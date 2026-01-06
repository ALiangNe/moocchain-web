import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Modal, message } from 'antd';
import { getAuditRecordList, approveTeacherApplication } from '../../api/baseApi';
import type { AuditRecordInfo } from '../../types/auditRecordType';
import AuditRecordDetail from '../../components/auditRecord/AuditRecordDetail';
import AuditRecordTable from '../../components/auditRecord/AuditRecordTable';
import AuditApproveModal from '../../components/auditRecord/AuditApproveModal';

export default function Audit() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ records: AuditRecordInfo[]; total: number }>({ records: [], total: 0 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRecord, setSelectedRecord] = useState<AuditRecordInfo | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [approveVisible, setApproveVisible] = useState(false);
  const [approving, setApproving] = useState(false);
  const [currentAuditId, setCurrentAuditId] = useState<number | null>(null);
  const [auditStatus, setAuditStatus] = useState<number | null>(null);
  const [approveRecord, setApproveRecord] = useState<AuditRecordInfo | null>(null);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);

  // 加载数据的函数，供外部调用
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
      result = await getAuditRecordList({ page: currentPage, pageSize: currentPageSize });
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

  const handleViewDetail = (record: AuditRecordInfo) => {
    // 直接使用列表返回的数据，无需再次请求详情接口
    setSelectedRecord(record);
    setDetailVisible(true);
  };

  const handleApprove = (record: AuditRecordInfo, status: number) => {
    if (!record.auditId) return;
    if (record.auditStatus !== 0) {
      message.warning('该申请已处理，无法重复操作');
      return;
    }
    
    // 直接使用列表返回的数据，无需再次请求详情接口
    setCurrentAuditId(record.auditId);
    setAuditStatus(status);
    setApproveRecord(record);
    setApproveVisible(true);
  };

  const handleConfirmApprove = async (comment: string) => {
    if (!currentAuditId || auditStatus === null) return;
    
    setApproving(true);
    
    let result;
    try {
      result = await approveTeacherApplication({
        auditId: currentAuditId,
        auditStatus: auditStatus,
        auditComment: comment || undefined,
      });
    } catch (error) {
      console.error('Approve error:', error);
      message.error('审批失败，请重试');
      setApproving(false);
      return;
    }
    
    setApproving(false);
    
    if (result.code !== 0) {
      message.error(result.message || '审批失败');
      return;
    }
    
    message.success(auditStatus === 1 ? '审批通过' : '审批拒绝');
    setApproveVisible(false);
    setCurrentAuditId(null);
    setAuditStatus(null);
    setApproveRecord(null);
    loadData();
  };

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-[#1d1d1f]">审核管理</h1>

        <Card className="shadow-sm">
          <AuditRecordTable data={data.records} loading={loading} page={page} pageSize={pageSize} total={data.total} onPageChange={(p, s) => { setPage(p); setPageSize(s); }} onViewDetail={handleViewDetail} onApprove={handleApprove} />
        </Card>

        <Modal title="审核详情" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={800}>
          {selectedRecord && <AuditRecordDetail record={selectedRecord} />}
        </Modal>

        <AuditApproveModal visible={approveVisible} auditStatus={auditStatus} loading={approving} record={approveRecord} onConfirm={handleConfirmApprove} onCancel={() => { setApproveVisible(false); setCurrentAuditId(null); setAuditStatus(null); setApproveRecord(null); }} />
      </div>
    </div>
  );
}

