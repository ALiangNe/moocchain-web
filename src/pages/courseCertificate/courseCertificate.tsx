import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Empty, message, Pagination, Card } from 'antd';
import type { Dayjs } from 'dayjs';
import { getCertificateList } from '@/api/baseApi';
import { useAuthStore } from '@/stores/authStore';
import CertificateListCard from '@/components/courseCertificate/CourseCertificateListCard';
import CourseCertificateFilterBar from '@/components/courseCertificate/CourseCertificateFilterBar';
import type { CertificateInfo } from '@/types/certificateType';

export default function CourseCertificate() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [records, setRecords] = useState<CertificateInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [loading, setLoading] = useState(false);
  const [teacherName, setTeacherName] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [teacherNameInput, setTeacherNameInput] = useState<string>('');
  const [dateRangeInput, setDateRangeInput] = useState<[Dayjs | null, Dayjs | null] | null>(null);
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

    const params: {
      studentId: number;
      page: number;
      pageSize: number;
      teacherName?: string;
      startDate?: string;
      endDate?: string;
    } = {
      studentId: user.userId,
      page,
      pageSize,
    };

    if (teacherName.trim()) {
      params.teacherName = teacherName.trim();
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      params.startDate = dateRange[0].startOf('day').format('YYYY-MM-DD HH:mm:ss');
      params.endDate = dateRange[1].endOf('day').format('YYYY-MM-DD HH:mm:ss');
    }

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
  }, [user, page, pageSize, teacherName, dateRange]);

  const handleCertificateClick = (certificate: CertificateInfo) => {
    if (!certificate.certificateId) return;
    navigate(`/courseCertificate/${certificate.certificateId}`);
  };

  // 处理分页变化
  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  };

  // 处理筛选输入变化（只更新临时状态，不触发查询）
  const handleTeacherNameInputChange = (value: string) => {
    setTeacherNameInput(value);
  };

  const handleDateRangeInputChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRangeInput(dates);
  };

  // 点击查询按钮，将临时状态同步到实际筛选条件并触发查询
  const handleSearch = () => {
    setTeacherName(teacherNameInput);
    setDateRange(dateRangeInput);
    setPage(1); // 重置到第一页
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
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center min-h-[200px]"><Spin size="large" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-sm mb-8 rounded-2xl">
          <div className="flex justify-start items-center">
            <CourseCertificateFilterBar teacherName={teacherNameInput} onTeacherNameChange={handleTeacherNameInputChange} dateRange={dateRangeInput} onDateRangeChange={handleDateRangeInputChange} onSearch={handleSearch} />
          </div>
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