import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Empty, message, Pagination, Card } from 'antd';
import { getCertificateList } from '@/api/baseApi';
import { useAuthStore } from '@/stores/authStore';
import CertificateListCard from '@/components/courseCertificate/CertificateListCard';
import type { CertificateInfo } from '@/types/certificateType';

export default function CourseCertificate() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [records, setRecords] = useState<CertificateInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);

  // 加载证书列表
  const loadCertificates = useCallback(async () => {
    if (!user?.userId) return;
    if (loadingRef.current) return;

    const currentRequestId = ++requestIdRef.current;
    loadingRef.current = true;

    queueMicrotask(() => {
      if (requestIdRef.current !== currentRequestId) {
        loadingRef.current = false;
        return;
      }
      setLoading(true);
    });

    const params = {
      studentId: user.userId,
      page,
      pageSize,
    };

    let response;
    try {
      response = await getCertificateList(params);
    } catch (error) {
      console.error('Load certificates error:', error);
      if (requestIdRef.current === currentRequestId) {
        setLoading(false);
        loadingRef.current = false;
        message.error('加载失败，请重试');
      }
      return;
    }

    if (requestIdRef.current !== currentRequestId) return;

    setLoading(false);
    loadingRef.current = false;

    if (response.code === 0 && response.data && Array.isArray(response.data.records)) {
      const newRecords = response.data.records as CertificateInfo[];
      setRecords(newRecords);
      setTotal(response.data.total || 0);
      return;
    }

    message.error(response.message || '获取证书列表失败');
  }, [user, page, pageSize]);

  const handleCertificateClick = (certificate: CertificateInfo) => {
    if (!certificate.certificateId) return;
    navigate(`/coursecertificate/${certificate.certificateId}`);
  };

  // 处理分页变化
  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  };

  useEffect(() => {
    const effectRequestId = requestIdRef.current;
    queueMicrotask(() => {
      loadCertificates();
    });
    return () => {
      requestIdRef.current = effectRequestId + 1;
    };
  }, [loadCertificates]);

  if (loading && records.length === 0) {
    return (
      <div className="py-12">
        <div className="w-full max-w-[1600px] mx-auto">
          <div className="flex justify-center items-center min-h-[200px]"><Spin size="large" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="w-full max-w-[1600px] mx-auto">
        <Card className="shadow-sm mb-8 rounded-2xl">
          <h1 className="text-lg font-semibold text-[#1d1d1f]">我的证书</h1>
        </Card>

        <Card className="shadow-sm rounded-2xl" bodyStyle={{ padding: 0 }}>
          {records.length === 0 && !loading ? (
            <div className="p-6">
              <Empty description="暂无证书" />
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-4 gap-4">
                {records.map((certificate) => (
                  <CertificateListCard key={certificate.certificateId} certificate={certificate} onClick={() => handleCertificateClick(certificate)} />
                ))}
              </div>

              {records.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <Pagination current={page} pageSize={pageSize} total={total} onChange={handlePageChange} showSizeChanger pageSizeOptions={['8', '16', '32', '64']} showTotal={(total) => `共 ${total} 条数据`} locale={{ items_per_page: '条/页' }} />
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}