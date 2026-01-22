import { Card } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { formatDateTime } from '@/utils/formatTime';
import type { CertificateInfo } from '@/types/certificateType';

interface CertificateCardProps {
  certificate: CertificateInfo;
  onClick?: () => void;
}

export default function CertificateCard({ certificate, onClick }: CertificateCardProps) {
  return (
    <Card hoverable className="border border-gray-200 transition-all hover:shadow-md overflow-hidden" onClick={onClick} bodyStyle={{ padding: 0 }}>
      <div className="flex flex-col">
        {certificate.ipfsHash && (
          <img src={`https://gateway.pinata.cloud/ipfs/${certificate.ipfsHash}`} alt={certificate.course?.courseName || '证书封面'} className="w-full h-40 object-cover" style={{ margin: '-1px -1px 0 -1px', width: 'calc(100% + 2px)' }} />
        )}

        <div className="flex-1 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#1d1d1f] truncate">{certificate.course?.courseName || '未知课程'}</h3>
            <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircleOutlined /> 已颁发</span>
          </div>

          <div className="text-xs text-[#6e6e73] space-y-1">
            <div>证书ID: {certificate.certificateId}</div>
            {certificate.certificateNftId && <div>NFT ID: {certificate.certificateNftId}</div>}
            <div>学生: {certificate.student?.realName || certificate.student?.username || '未知'}</div>
            <div>教师: {certificate.teacher?.realName || certificate.teacher?.username || '未知'}</div>
            <div>教师学校: {certificate.teacher?.schoolName || '未知'}</div>
            <div>颁发时间: {formatDateTime(certificate.createdAt)}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}