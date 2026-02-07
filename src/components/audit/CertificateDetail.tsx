import { Descriptions, Tag, Button, Image, Card, message } from 'antd';
import { CheckOutlined, CloseOutlined, DownloadOutlined } from '@ant-design/icons';
import type { AuditRecordInfo } from '@/types/auditRecordType';
import { formatDateTime } from '@/utils/formatTime';
import { useState } from 'react';
import { downloadFile } from '@/utils/download';

interface CertificateDetailProps {
  record: AuditRecordInfo;
  onApprove?: (status: number) => void;
}

export default function CertificateDetail({ record, onApprove }: CertificateDetailProps) {
  const [downloading, setDownloading] = useState(false);
  const statusMap: Record<number, { text: string; color: string }> = {
    0: { text: '待审核', color: 'processing' },
    1: { text: '已通过', color: 'success' },
    2: { text: '已拒绝', color: 'error' },
  };

  const statusConfig = statusMap[record.auditStatus || 0] || statusMap[0];

  // 获取认证材料文件地址
  const getCertificateFileUrl = (certificateFile?: string) => {
    if (!certificateFile) return undefined;
    if (certificateFile.startsWith('http')) return certificateFile;
    const baseUrl = import.meta.env.VITE_API_BASE_URL.split('/api')[0];
    return `${baseUrl}${certificateFile}`;
  };

  const certificateFileUrl = getCertificateFileUrl(record.targetUser?.certificateFile);
  const isImageFile = certificateFileUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(certificateFileUrl);

  // 处理认证材料下载
  const handleDownload = async () => {
    if (!certificateFileUrl || downloading) return;

    const downloadMsgKey = 'audit-certificate-download';
    message.loading({ content: '准备下载...', key: downloadMsgKey, duration: 0 });

    // 从URL中提取文件名，如果没有则使用默认名称
    const urlParts = certificateFileUrl.split('/');
    const originalFilename = urlParts[urlParts.length - 1].split('?')[0];
    const filename = originalFilename || `certificate-${record.targetUser?.realName || record.targetUser?.username || 'unknown'}-${record.auditId || 'unknown'}`;
    
    let result: Awaited<ReturnType<typeof downloadFile>> | undefined;
    setDownloading(true);
    try {
      result = await downloadFile(certificateFileUrl, { filename });
    } catch (error) {
      console.error('Download certificate error:', error);
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
      {/* 卡片一：材料信息 */}
      <Card title="认证材料信息" className="shadow-sm">
        {record.targetUser ? (
          <Descriptions column={2} size="small">
            <Descriptions.Item label="申请人">
              {record.targetUser.realName || record.targetUser.username || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="邮箱">
              {record.targetUser.email || '-'}
            </Descriptions.Item>
            {record.createdAt && (
              <>
                <Descriptions.Item label="学校">
                  {record.targetUser.schoolName || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="申请时间">
                  {formatDateTime(record.createdAt)}
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        ) : (
          <span className="text-[#6e6e73]">暂无材料信息</span>
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
          {record.auditTime && (
            <Descriptions.Item label="审核时间" span={2}>
              {formatDateTime(record.auditTime)}
            </Descriptions.Item>
          )}
          {record.auditComment && (
            <Descriptions.Item label="审核意见" span={2}>
              {record.auditComment}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* 卡片三：认证材料预览 */}
      <Card title="认证材料" className="shadow-sm">
        {certificateFileUrl ? (
          <>
            {isImageFile ? (
              <div className="w-1/3 aspect-square mr-auto">
                <Image src={certificateFileUrl} alt="认证材料" preview={{ mask: '预览' }} className="w-full h-full object-cover rounded-lg" />
              </div>
            ) : (
              <div className="text-center py-12 text-[#6e6e73]">
                <p className="mb-4">该文件类型不支持在线预览</p>
                <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload} loading={downloading}>
                  下载查看
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-[#6e6e73]">
            申请人尚未上传认证材料
          </div>
        )}
      </Card>

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
