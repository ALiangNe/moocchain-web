import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Spin, message, Button, Image } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { getCertificate } from '@/api/baseApi';
import type { CertificateInfo } from '@/types/certificateType';
import CertificateDetail from '@/components/courseCertificate/CourseCertificateDetail';
import { downloadFile } from '@/utils/download';

export default function CourseCertificateId() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState<CertificateInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);
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

  const handleDownload = async () => {
    if (!certificate?.ipfsHash) {
      message.warning('证书文件不存在');
      return;
    }

    if (downloading) return;

    const downloadMsgKey = 'certificate-download';
    // 顶部提示：准备下载
    message.loading({ content: '准备下载...', key: downloadMsgKey, duration: 0 });

    const downloadUrl = `https://gateway.pinata.cloud/ipfs/${certificate.ipfsHash}`;
    const filename = `certificate-${certificateId ?? 'unknown'}.jpg`;
    setDownloading(true);
    let result: Awaited<ReturnType<typeof downloadFile>> | undefined;
    try {
      result = await downloadFile(downloadUrl, { filename });
    } catch (error) {
      console.error('Download certificate error:', error);
      message.error('下载失败，请稍后重试');
      message.destroy(downloadMsgKey);
    } finally {
      setDownloading(false);
    }
    if (result?.method === 'browser') {
      message.info({
        content: '已尝试使用浏览器直接下载（若仍打开预览页，说明网关未开启附件下载）',
        key: downloadMsgKey,
      });
    } else if (result) {
      message.success({ content: '开始下载', key: downloadMsgKey });
    }
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
              <Button type="primary" icon={<EyeOutlined />} onClick={handlePreview} className="rounded-lg">预览证书</Button>
              <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload} className="rounded-lg">下载证书</Button>
            </div>
          </div>
        </Card>
        <CertificateDetail certificate={certificate} />
        {previewUrl && (
          <Image src={previewUrl} alt="证书图片" style={{ display: 'none' }} preview={{ visible: previewVisible, onVisibleChange: (visible) => setPreviewVisible(visible) }} />
        )}
      </div>
    </div>
  );
}

