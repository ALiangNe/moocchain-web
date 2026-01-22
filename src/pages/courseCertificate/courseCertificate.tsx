import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Empty, message } from 'antd';
import { getCertificateList } from '@/api/baseApi';
import { useAuthStore } from '@/stores/authStore';
import CertificateCard from '@/components/courseCertificate/CertificateCard';
import type { CertificateInfo } from '@/types/certificateType';

export default function CourseCertificate() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [records, setRecords] = useState<CertificateInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [loading, setLoading] = useState(false);
  const prevUserIdRef = useRef<number | null>(null);

  // 加载证书列表
  const loadCertificates = useCallback(async (pageNum: number = 1, pageSizeNum: number = 12) => {
    if (!user?.userId) return;

    const params = {
      studentId: user.userId,
      page: pageNum,
      pageSize: pageSizeNum,
    };

    setLoading(true);

    let response;
    try {
      response = await getCertificateList(params);
    } catch (error) {
      console.error('Claim certificate error:', error);
      message.error('证书领取失败，请稍后重试');
      setLoading(false);
      return;
    }

    setLoading(false);

    if (response.code === 0 && response.data && Array.isArray(response.data.records)) {
      const newRecords = response.data.records as CertificateInfo[];
      setRecords(pageNum === 1 ? newRecords : [...records, ...newRecords]);
      setTotal(response.data.total || 0);
      setPage(pageNum);
      setPageSize(pageSizeNum);
      return;
    }

    message.error(response.message || '获取证书列表失败');
  }, [user, records]);

  // 加载更多证书
  const loadMoreCertificates = () => {
    if (records.length < total && !loading) {
      loadCertificates(page + 1, pageSize);
    }
  };

  const handleCertificateClick = (certificate: CertificateInfo) => {
    if (!certificate.certificateId) return;
    navigate(`/coursecertificate/${certificate.certificateId}`);
  };

  useEffect(() => {
    if (user?.userId === prevUserIdRef.current) return;

    prevUserIdRef.current = user?.userId || null;

    if (!user?.userId) return;

    queueMicrotask(() => {
      loadCertificates(1, 12);
    });
  }, [user?.userId, loadCertificates]);

  if (loading && records.length === 0) {
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center min-h-[200px]"><Spin size="large" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-[#1d1d1f]">我的证书</h1>
        </div>

        <div className="shadow-sm bg-white rounded-lg p-6">
          {records.length === 0 ? (
            <Empty description="暂无证书" />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {records.map((certificate) => (
                  <CertificateCard key={certificate.certificateId} certificate={certificate} onClick={() => handleCertificateClick(certificate)} />
                ))}
              </div>

              {records.length < total && (
                <div className="text-center pt-6">
                  <button onClick={loadMoreCertificates} disabled={loading} className="px-6 py-3 bg-[#007aff] text-white rounded-lg hover:bg-[#0056cc] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? '加载中...' : '加载更多'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}