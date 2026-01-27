import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Spin, message, Button, Image } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { getCertificate } from '@/api/baseApi';
import type { CertificateInfo } from '@/types/certificateType';
import CertificateDetail from '@/components/courseCertificate/CertificateDetail';

export default function CourseCertificateId() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState<CertificateInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
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

  const handlePreview = () => {
    if (!certificate?.ipfsHash) {
      message.warning('证书图片不存在');
      return;
    }
    setPreviewVisible(true);
  };

  const handleDownload = () => {
    if (!certificate?.ipfsHash) {
      message.warning('证书文件不存在');
      return;
    }

    const downloadUrl = `https://gateway.pinata.cloud/ipfs/${certificate.ipfsHash}`;
    window.open(downloadUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]"><Spin size="large" /></div>
    );
  }

  if (!certificate) {
    return (
      <div className="py-12">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-sm"><p className="text-center text-[#6e6e73]">证书不存在</p></Card>
        </div>
      </div>
    );
  }

  const previewUrl = certificate?.ipfsHash ? `https://gateway.pinata.cloud/ipfs/${certificate.ipfsHash}` : undefined;

  return (
    <div className="py-12">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-sm mb-6 rounded-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button icon={<ArrowLeftOutlined />} type="text" shape="circle" onClick={() => navigate('/courseCertificate')} aria-label="返回证书列表" />
              <h1 className="text-lg font-semibold text-[#1d1d1f]">证书详情</h1>
            </div>
            <div className="flex gap-3">
              <Button icon={<EyeOutlined />} onClick={handlePreview} className="rounded-lg">预览证书</Button>
              <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload} className="rounded-lg">下载证书</Button>
            </div>
          </div>
        </Card>
        <CertificateDetail certificate={certificate} />
        {previewUrl && (
          <Image src={previewUrl} alt="证书图片" style={{ display: 'none' }} preview={{ visible: previewVisible, onVisibleChange: (visible) => setPreviewVisible(visible), }} />
        )}
      </div>
    </div>
  );
}

