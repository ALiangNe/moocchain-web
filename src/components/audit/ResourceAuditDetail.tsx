import { Descriptions, Tag, Button, Card, message } from 'antd';
import { CheckOutlined, CloseOutlined, DownloadOutlined } from '@ant-design/icons';
import type { AuditRecordInfo } from '@/types/auditRecordType';
import { formatDateTime } from '@/utils/formatTime';
import { useState } from 'react';
import { downloadFile } from '@/utils/download';

interface ResourceAuditDetailProps {
  record: AuditRecordInfo;
  onApprove?: (status: number) => void;
}

export default function ResourceAuditDetail({ record, onApprove }: ResourceAuditDetailProps) {
  const [downloading, setDownloading] = useState(false);
  const statusMap: Record<number, { text: string; color: string }> = {
    0: { text: '待审核', color: 'processing' },
    1: { text: '已通过', color: 'success' },
    2: { text: '已拒绝', color: 'error' },
  };

  const statusConfig = statusMap[record.auditStatus || 0] || statusMap[0];

  // 获取资源文件下载地址
  const getResourceFileUrl = (ipfsHash?: string) => {
    if (!ipfsHash) return undefined;
    // 如果是完整的 URL，直接返回
    if (ipfsHash.startsWith('http')) return ipfsHash;
    // 如果是 IPFS Hash (CID)，使用 Pinata Gateway
    // IPFS Hash 通常以 Qm 开头（CIDv0）或 b 开头（CIDv1），且不包含路径分隔符
    if (!ipfsHash.startsWith('/') && (ipfsHash.startsWith('Qm') || ipfsHash.startsWith('b') || ipfsHash.length > 30)) {
      const gatewayUrl = import.meta.env.VITE_IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';
      return `${gatewayUrl}${ipfsHash}`;
    }
    // 否则认为是本地路径
    const baseUrl = import.meta.env.VITE_API_BASE_URL.split('/api')[0];
    return `${baseUrl}${ipfsHash}`;
  };

  const fileUrl = getResourceFileUrl(record.targetResource?.ipfsHash);
  const resourceType = record.targetResource?.resourceType || 0;

  // 处理资源文件下载
  const handleDownload = async () => {
    if (!fileUrl || downloading) return;

    const downloadMsgKey = 'audit-resource-download';
    message.loading({ content: '准备下载...', key: downloadMsgKey, duration: 0 });

    const filename = record.targetResource?.title || `resource-${record.targetResource?.resourceId ?? 'unknown'}`;
    let result: Awaited<ReturnType<typeof downloadFile>> | undefined;
    setDownloading(true);
    try {
      result = await downloadFile(fileUrl, { filename });
    } catch (error) {
      console.error('Download resource error:', error);
      message.error('下载失败，请稍后重试');
      message.destroy(downloadMsgKey);
    } finally {
      setDownloading(false);
    }
    if (!result) return;
    if (result.method === 'browser') {
      message.info({
        content: '已尝试使用浏览器直接下载（若仍打开预览页，说明网关未开启附件下载）',
        key: downloadMsgKey,
      });
    } else {
      message.success({ content: '开始下载', key: downloadMsgKey });
    }
  };

  return (
    <div className="space-y-6">
      {/* 卡片一：资源材料信息 */}
      <Card title="资源材料信息" className="shadow-sm">
        {record.targetResource ? (
          <Descriptions column={2} size="small">
            <Descriptions.Item label="申请人">
              {record.targetResource.owner?.realName || record.targetResource.owner?.username || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="学校">
              {record.targetResource.owner?.schoolName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="课程名字">
              {record.targetResource.course?.courseName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="资源名字">
              {record.targetResource.title || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="资源描述">
              {record.targetResource.description || '-'}
            </Descriptions.Item>
            {record.createdAt && (
              <Descriptions.Item label="申请时间" span={2}>
                {formatDateTime(record.createdAt)}
              </Descriptions.Item>
            )}
          </Descriptions>
        ) : (
          <span className="text-[#6e6e73]">暂无资源信息</span>
        )}
      </Card>      

      {/* 卡片二：审核信息（包含审批人信息 + 审核结果） */}
      <Card title="审核信息" className="shadow-sm">
        <Descriptions column={2} size="small">
          <Descriptions.Item label="审批人">
            {record.auditStatus !== 0 && (record.auditor?.realName || record.auditor?.username) || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="邮箱">
            {record.auditStatus !== 0 && record.auditor?.email || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="审核状态">
            <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="审核时间" span={2}>
            {record.auditTime ? formatDateTime(record.auditTime) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="审核意见" span={2}>
            {record.auditComment || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 卡片三：资源预览 */}
      {fileUrl && (
        <Card title="资源预览" className="shadow-sm">
          <div className="w-full">
            {resourceType === 3 && (
              <video controls className="w-full rounded-lg" src={fileUrl}>
                您的浏览器不支持视频播放
              </video>
            )}
            {resourceType === 2 && (
              <audio controls className="w-full" src={fileUrl}>
                您的浏览器不支持音频播放
              </audio>
            )}
            {resourceType === 1 && (
              <div className="w-full h-[200px] border border-gray-200 rounded-lg">
                {fileUrl.endsWith('.pdf') ? (
                  <iframe src={fileUrl} className="w-full h-full rounded-lg" title={record.targetResource?.title} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-[#6e6e73]">
                    <p className="mb-4">该文档类型不支持在线预览</p>
                    <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
                      下载查看
                    </Button>
                  </div>
                )}
              </div>
            )}
            {resourceType === 0 && (
              <div className="text-center py-12 text-[#6e6e73]">
                <p>该资源类型不支持预览</p>
                <Button type="link" onClick={handleDownload} className="mt-4">
                  点击下载查看
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 底部操作按钮（卡片外） */}
      {record.auditStatus === 0 && onApprove && (
        <div className="flex gap-3">
          <Button danger icon={<CloseOutlined />} onClick={() => onApprove(2)} className="rounded-lg flex-1">
            拒绝
          </Button>
          <Button type="primary" icon={<CheckOutlined />} onClick={() => onApprove(1)} className="rounded-lg flex-1">
            通过
          </Button>
        </div>
      )}
    </div>
  );
}
