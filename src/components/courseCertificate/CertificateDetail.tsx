import { Card, Image, Descriptions } from 'antd';
import type { CertificateInfo } from '@/types/certificateType';
import { formatDateTime } from '@/utils/formatTime';

interface CertificateDetailProps {
  certificate: CertificateInfo;
}

export default function CertificateDetail({ certificate }: CertificateDetailProps) {
  const imageUrl = certificate.ipfsHash ? `https://gateway.pinata.cloud/ipfs/${certificate.ipfsHash}` : undefined;

  return (
    <div className="flex gap-6 items-stretch">
        <Card className="shadow-sm flex justify-center items-center min-h-[260px] w-2/5 flex-shrink-0 rounded-2xl">
          {imageUrl ? (
            <Image src={imageUrl} alt={certificate.course?.courseName || '证书图片'} className="max-w-full h-auto rounded-lg shadow-sm" />
          ) : (
            <p className="text-center text-[#6e6e73]">暂无证书图片</p>
          )}
        </Card>

        <Card className="shadow-sm flex-1 w-3/5 rounded-2xl">
          <Descriptions column={1} labelStyle={{ width: 120, color: '#6e6e73' }} contentStyle={{ color: '#1d1d1f' }}>
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
        </Card>
    </div>
  );
}
