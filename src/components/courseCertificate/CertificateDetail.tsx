import { Card, Button, Image, Modal, Descriptions, message } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import type { CertificateInfo } from '@/types/certificateType';
import { formatDateTime } from '@/utils/formatTime';

interface CertificateDetailProps {
  certificate: CertificateInfo;
  onBack: () => void;
}

export default function CertificateDetail({ certificate, onBack }: CertificateDetailProps) {
  const imageUrl = certificate.ipfsHash ? `https://gateway.pinata.cloud/ipfs/${certificate.ipfsHash}` : undefined;

  const handlePreview = () => {
    if (!certificate.ipfsHash) {
      message.warning('证书图片不存在');
      return;
    }

    const previewUrl = `https://gateway.pinata.cloud/ipfs/${certificate.ipfsHash}`;

    Modal.info({
      title: '证书预览',
      width: 800,
      content: (
        <div className="text-center">
          <Image src={previewUrl} alt="证书图片" className="max-w-full h-auto rounded-lg shadow-sm" style={{ maxHeight: '500px' }} />
        </div>
      ),
      okText: '关闭',
    });
  };

  const handleDownload = () => {
    if (!certificate.ipfsHash) {
      message.warning('证书文件不存在');
      return;
    }

    const downloadUrl = `https://gateway.pinata.cloud/ipfs/${certificate.ipfsHash}`;
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack} className="mb-4">返回证书列表</Button>
          <h1 className="text-lg font-semibold text-[#1d1d1f]">证书详情</h1>
        </div>
        <div className="flex gap-3">
          <Button icon={<EyeOutlined />} onClick={handlePreview} className="rounded-lg">预览证书</Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload} className="rounded-lg">下载证书</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card className="shadow-sm flex justify-center items-center min-h-[260px]">
          {imageUrl ? (
            <Image src={imageUrl} alt={certificate.course?.courseName || '证书图片'} className="max-w-full h-auto rounded-lg shadow-sm" />
          ) : (
            <p className="text-center text-[#6e6e73]">暂无证书图片</p>
          )}
        </Card>

        <Card className="shadow-sm">
          <Descriptions column={1} labelStyle={{ width: 120, color: '#6e6e73' }} contentStyle={{ color: '#1d1d1f' }}>
            <Descriptions.Item label="证书ID">{certificate.certificateId}</Descriptions.Item>
            {certificate.certificateNftId && (<Descriptions.Item label="NFT ID">{certificate.certificateNftId}</Descriptions.Item>)}
            <Descriptions.Item label="课程">{certificate.course?.courseName || '未知课程'}</Descriptions.Item>
            <Descriptions.Item label="学生">{certificate.student?.realName || certificate.student?.username || '未知'}</Descriptions.Item>
            <Descriptions.Item label="教师">{certificate.teacher?.realName || certificate.teacher?.username || '未知'}</Descriptions.Item>
            <Descriptions.Item label="教师学校">{certificate.teacher?.schoolName || '未知'}</Descriptions.Item>
            <Descriptions.Item label="颁发时间">{formatDateTime(certificate.createdAt)}</Descriptions.Item>
            {certificate.ipfsHash && (
              <Descriptions.Item label="IPFS 哈希">
                <span className="break-all text-xs text-[#6e6e73]">{certificate.ipfsHash}</span>
              </Descriptions.Item>
            )}
            {certificate.transactionHash && (
              <Descriptions.Item label="交易哈希">
                <span className="break-all text-xs text-[#6e6e73]">{certificate.transactionHash}</span>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      </div>
    </div>
  );
}
