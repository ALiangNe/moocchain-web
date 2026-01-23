import { Card } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { formatDate } from '@/utils/formatTime';
import type { CertificateInfo } from '@/types/certificateType';

interface CertificateListCardProps {
  certificate: CertificateInfo;
  onClick?: () => void;
}

export default function CertificateListCard({ certificate, onClick }: CertificateListCardProps) {
  return (
    <Card hoverable className="cursor-pointer border border-gray-200 transition-all hover:shadow-md overflow-hidden" onClick={onClick} bodyStyle={{ padding: 0 }}>
      <div className="flex flex-col">
        {certificate.ipfsHash && (
          <img src={`https://gateway.pinata.cloud/ipfs/${certificate.ipfsHash}`} alt={certificate.course?.courseName || '证书封面'} className="w-full h-56 object-cover" style={{ margin: '-1px -1px 0 -1px', width: 'calc(100% + 2px)' }} />
        )}

        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-[#1d1d1f] line-clamp-2">{certificate.course?.courseName || '未知课程'}</h3>
            <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircleOutlined /> 已颁发</span>
          </div>

          <div className="text-xs text-[#6e6e73]">
            <div className="flex justify-between items-center mb-1">
              {certificate.certificateNftId && <span>NFT ID 编号  {certificate.certificateNftId}</span>}
              <span>{certificate.student?.realName || certificate.student?.username || '未知'}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span>{certificate.teacher?.schoolName || '未知'}</span>
              <span>{certificate.teacher?.realName || certificate.teacher?.username || '未知'}</span>
            </div>
            <div className="flex items-center gap-1">
              <ClockCircleOutlined />
              <span>{formatDate(certificate.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}