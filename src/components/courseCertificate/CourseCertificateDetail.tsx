import { Card, Image, Descriptions } from 'antd';
import type { CertificateInfo } from '@/types/certificateType';
import { formatDateTime } from '@/utils/formatTime';

interface CourseCertificateDetailProps {
  certificate: CertificateInfo;
}

export default function CertificateDetail({ certificate }: CourseCertificateDetailProps) {
  const imageUrl = certificate.ipfsHash ? `https://gateway.pinata.cloud/ipfs/${certificate.ipfsHash}` : undefined;

  return (
    <Card className="shadow-sm mb-6 rounded-2xl">
      <div className="flex gap-6 items-stretch">
        {imageUrl && (
          <div className="w-[30%] flex-shrink-0 flex justify-center items-center min-h-[260px]">
            <Image src={imageUrl} alt={certificate.course?.courseName || '证书图片'} className="max-w-full h-auto rounded-lg shadow-sm" />
          </div>
        )}
        <div className={`flex-1 ${imageUrl ? 'w-[70%]' : 'w-full'} relative`}>
          <Descriptions title="证书信息" bordered column={1} labelStyle={{ width: '25%' }} contentStyle={{ width: '75%' }}>
            <Descriptions.Item label="证书ID">{certificate.certificateId}</Descriptions.Item>
            {certificate.certificateNftId && (<Descriptions.Item label="NFT ID">{certificate.certificateNftId}</Descriptions.Item>)}
            <Descriptions.Item label="课程">{certificate.course?.courseName || '未知课程'}</Descriptions.Item>
            <Descriptions.Item label="学生">{certificate.student?.realName || certificate.student?.username || '未知'}</Descriptions.Item>
            <Descriptions.Item label="教师">{certificate.teacher?.realName || certificate.teacher?.username || '未知'}</Descriptions.Item>
            <Descriptions.Item label="教师学校">{certificate.teacher?.schoolName || '未知'}</Descriptions.Item>
            <Descriptions.Item label="颁发时间">{formatDateTime(certificate.createdAt)}</Descriptions.Item>
            {certificate.ipfsHash && (
              <Descriptions.Item label="IPFS 哈希">{certificate.ipfsHash}</Descriptions.Item>
            )}
            {certificate.transactionHash && (
              <Descriptions.Item label="交易哈希">{certificate.transactionHash}</Descriptions.Item>
            )}
          </Descriptions>
        </div>
      </div>
    </Card>
  );
}
