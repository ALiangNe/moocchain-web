import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Spin, message } from 'antd';
import { getCertificate } from '@/api/baseApi';
import type { CertificateInfo } from '@/types/certificateType';
import CertificateDetail from '@/components/courseCertificate/CertificateDetail';

export default function CourseCertificateId() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState<CertificateInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const hasLoadedRef = useRef(false);

  const loadCertificate = useCallback(async () => {
    if (!certificateId) return;

    setLoading(true);

    let result;
    try {
      result = await getCertificate(Number(certificateId));
    } catch (error) {
      console.error('Load certificate error:', error);
      setLoading(false);
      message.error('加载证书失败，请稍后重试');
      return;
    }

    setLoading(false);

    if (result.code !== 0 || !result.data) {
      message.error(result.message || '加载证书失败');
      setCertificate(null);
      return;
    }

    setCertificate(result.data);
  }, [certificateId]);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    queueMicrotask(() => {
      loadCertificate();
    });
  }, [loadCertificate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]"><Spin size="large" /></div>
    );
  }

  if (!certificate) {
    return (
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="shadow-sm"><p className="text-center text-[#6e6e73]">证书不存在</p></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <CertificateDetail certificate={certificate} onBack={() => navigate('/coursecertificate')} />
    </div>
  );
}

