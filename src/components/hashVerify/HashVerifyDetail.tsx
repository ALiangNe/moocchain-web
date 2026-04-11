import { Card, Descriptions } from 'antd';
import type { LearningRecordInfo } from '@/types/learningRecordType';
import type { ResourceInfo } from '@/types/resourceType';
import type { CertificateInfo } from '@/types/certificateType';
import type { LearningRecordAnchorData } from '@/utils/learningRecord';
import type { ResourceChainData } from '@/utils/resourceNft';
import type { CertificateChainData } from '@/utils/certificateNft';
import { formatDateTime } from '@/utils/formatTime';
import { useAuthStore } from '@/stores/authStore';

type RecordType = 'learningRecord' | 'resource' | 'certificate';

interface HashVerifyDetailProps {
  recordType: RecordType;
  hash: string;
  learningRecord?: LearningRecordInfo;
  resource?: ResourceInfo;
  certificate?: CertificateInfo;
  chainLoading?: boolean;
  chainError?: string;
  learningRecordAnchor?: LearningRecordAnchorData | null;
  resourceChainData?: ResourceChainData | null;
  certificateChainData?: CertificateChainData | null;
}

export default function HashVerifyDetail({
  recordType,
  hash,
  learningRecord,
  resource,
  certificate,
  chainLoading = false,
  chainError,
  learningRecordAnchor,
  resourceChainData,
  certificateChainData,
}: HashVerifyDetailProps) {
  const displayHash = hash;
  const currentUser = useAuthStore((state) => state.user);
  const quarterCellStyle = { width: '25%' };
  const toUnixSec = (value: string | Date | undefined) => {
    if (!value) return '-';
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? '-' : String(Math.floor(ms / 1000));
  };
  const ownerWallet = currentUser?.walletAddress || '-';
  const dbTitle = recordType === 'learningRecord'
    ? '学习记录详情数据' : recordType === 'resource'
      ? '资源详情数据' : '证书详情数据';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 展示数据库中的数据 */}
      <Card className="shadow-sm rounded-2xl">
        <Descriptions title={dbTitle} bordered column={recordType === 'learningRecord' ? 2 : 1}>
          {recordType === 'learningRecord' && learningRecord && (
            <>
              <Descriptions.Item label="记录ID" labelStyle={quarterCellStyle} contentStyle={quarterCellStyle}>{learningRecord.recordId ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="课程ID" labelStyle={quarterCellStyle} contentStyle={quarterCellStyle}>{learningRecord.resource?.courseId ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="资源ID" labelStyle={quarterCellStyle} contentStyle={quarterCellStyle}>{learningRecord.resourceId ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="学生ID" labelStyle={quarterCellStyle} contentStyle={quarterCellStyle}>{learningRecord.studentId ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="进度" labelStyle={quarterCellStyle} contentStyle={quarterCellStyle}>{learningRecord.progress ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="学习时长(秒)" labelStyle={quarterCellStyle} contentStyle={quarterCellStyle}>{learningRecord.learningTime ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="学习完成时间" span={2}>
                {learningRecord.completedAt
                  ? `日期 ${formatDateTime(learningRecord.completedAt)}，时间戳 ${toUnixSec(learningRecord.completedAt)}`
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="用户钱包地址" span={2}>{ownerWallet}</Descriptions.Item>
            </>
          )}
          {recordType === 'resource' && resource && (
            <>
              <Descriptions.Item label="标题">{resource.title ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="资源描述">{resource.description ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="数据生成时间">
                {resource.completedAt
                  ? `日期 ${formatDateTime(resource.completedAt)}，时间戳 ${toUnixSec(resource.completedAt)}`
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="用户钱包地址">{ownerWallet}</Descriptions.Item>
              <Descriptions.Item label="文件CID">{resource.ipfsHash ?? '-'}</Descriptions.Item>
            </>
          )}
          {recordType === 'certificate' && certificate && (
            <>
              <Descriptions.Item label="课程名称">{certificate.course?.courseName ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="教师姓名">{certificate.teacher?.realName ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="数据生成时间">
                {certificate.completedAt
                  ? `日期 ${formatDateTime(certificate.completedAt)}，时间戳 ${toUnixSec(certificate.completedAt)}`
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="用户钱包地址">{ownerWallet}</Descriptions.Item>
              <Descriptions.Item label="文件CID">{certificate.ipfsHash ?? '-'}</Descriptions.Item>
            </>
          )}
          {(!learningRecord && !resource && !certificate) && (
            <Descriptions.Item label="提示">未查询到数据库记录</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* 展示链上数据 */}
      <Card className="shadow-sm rounded-2xl">
        {recordType === 'learningRecord' ? (
          <Descriptions title="链上数据" bordered column={1}>
            {chainLoading ? (
              <Descriptions.Item label="状态">读取中...</Descriptions.Item>
            ) : chainError ? (
              <Descriptions.Item label="错误">{chainError}</Descriptions.Item>
            ) : learningRecordAnchor ? (
              <>
                <Descriptions.Item label="Anchor ID">{learningRecord?.recordId ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="上链者钱包地址">{learningRecordAnchor.owner || '-'}</Descriptions.Item>
                <Descriptions.Item label="交易哈希">{displayHash || '-'}</Descriptions.Item>
                <Descriptions.Item label="内容哈希">{learningRecordAnchor.contentHash || '-'}</Descriptions.Item>
              </>
            ) : (
              <Descriptions.Item label="提示">未查询到链上学习记录数据</Descriptions.Item>
            )}
          </Descriptions>
        ) : recordType === 'resource' ? (
          <Descriptions title="链上数据" bordered column={1}>
            {chainLoading ? (
              <Descriptions.Item label="状态">读取中...</Descriptions.Item>
            ) : chainError ? (
              <Descriptions.Item label="错误">{chainError}</Descriptions.Item>
            ) : resourceChainData ? (
              <>
                <Descriptions.Item label="NFT ID">{resourceChainData.tokenId ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="上链者钱包地址">{resourceChainData.owner || '-'}</Descriptions.Item>
                <Descriptions.Item label="文件CID">{resourceChainData.ipfsHash || '-'}</Descriptions.Item>
                <Descriptions.Item label="上链时间戳">{resourceChainData.createdAt ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="交易哈希">{displayHash || '-'}</Descriptions.Item>
                <Descriptions.Item label="内容哈希">{resourceChainData.contentHash || '-'}</Descriptions.Item>
              </>
            ) : (
              <Descriptions.Item label="提示">未查询到链上资源数据</Descriptions.Item>
            )}
          </Descriptions>
        ) : recordType === 'certificate' ? (
          <Descriptions title="链上数据" bordered column={1}>
            {chainLoading ? (
              <Descriptions.Item label="状态">读取中...</Descriptions.Item>
            ) : chainError ? (
              <Descriptions.Item label="错误">{chainError}</Descriptions.Item>
            ) : certificateChainData ? (
              <>
                <Descriptions.Item label="NFT ID">{certificateChainData.tokenId ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="上链者钱包地址">{certificateChainData.owner || '-'}</Descriptions.Item>
                <Descriptions.Item label="文件CID">{certificateChainData.ipfsHash || '-'}</Descriptions.Item>
                <Descriptions.Item label="交易哈希">{displayHash || '-'}</Descriptions.Item>
                <Descriptions.Item label="内容哈希">{certificateChainData.contentHash || '-'}</Descriptions.Item>
              </>
            ) : (
              <Descriptions.Item label="提示">未查询到链上证书数据</Descriptions.Item>
            )}
          </Descriptions>
        ) : (
          <Descriptions title="链上数据" bordered column={1}>
            <Descriptions.Item label="说明">暂无可展示的链上数据</Descriptions.Item>
          </Descriptions>
        )}
      </Card>
    </div>
  );
}

