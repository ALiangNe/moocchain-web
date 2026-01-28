import { Card, Button, Descriptions, Tag, Tooltip } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { ResourceInfo } from '@/types/resourceType';
import { formatDateTime } from '@/utils/formatTime';
import type { AuditRecordInfo } from '@/types/auditRecordType';

interface ResourceDetailProps {
  resource: ResourceInfo;
  onDownload?: () => void;
  latestAuditRecord?: AuditRecordInfo | null;
  auditLoading?: boolean;
}

export default function ResourceDetail({ resource, onDownload, latestAuditRecord = null, auditLoading = false }: ResourceDetailProps) {
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

  // 获取资源类型名称
  const getResourceTypeName = (type?: number) => {
    const typeMap: Record<number, string> = {
      0: '其他',
      1: '文档',
      2: '音频',
      3: '视频',
    };
    return typeMap[type || 0] || '其他';
  };

  // 获取资源类型标签颜色
  const getResourceTypeColor = (type?: number) => {
    const colorMap: Record<number, string> = {
      0: 'default',
      1: 'blue',
      2: 'green',
      3: 'purple',
    };
    return colorMap[type || 0] || 'default';
  };

  // 获取资源状态显示文本与颜色（与 CourseDetail 保持一致）
  const getStatusMeta = () => {
    if (resource.status === 0) {
      if (latestAuditRecord && latestAuditRecord.auditStatus === 2) {
        return { text: '审核未通过，请重新提交申请', color: 'red' as const };
      }
      return { text: '待审核', color: 'orange' as const };
    }
    if (resource.status === 1) return { text: '已审核', color: 'gold' as const };
    if (resource.status === 2) return { text: '已发布', color: 'green' as const };
    if (resource.status === 3) return { text: '已下架', color: 'default' as const };
    return { text: '-', color: 'default' as const };
  };

  // 获取访问范围名称
  const getAccessScopeName = (scope?: number) => {
    const scopeMap: Record<number, string> = {
      0: '公开',
      1: '校内',
      2: '付费',
    };
    return scopeMap[scope || 0] || '公开';
  };

  const fileUrl = getResourceFileUrl(resource.ipfsHash);
  const resourceType = resource.resourceType || 0;

  return (
    <>
      <Card className="shadow-sm mb-6 rounded-2xl">
        <Descriptions title="资源信息" bordered column={2} labelStyle={{ width: '12.5%' }} contentStyle={{ width: '37.5%' }}>
          <Descriptions.Item label="资源标题">{resource.title}</Descriptions.Item>
          <Descriptions.Item label="资源描述">
            {resource.description ? (
              <Tooltip title={resource.description}>
                <div className="line-clamp-1 cursor-pointer">{resource.description}</div>
              </Tooltip>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="访问范围">{getAccessScopeName(resource.accessScope)}</Descriptions.Item>
          <Descriptions.Item label="价格">{resource.price === 0 ? '免费' : `${resource.price} 代币`}</Descriptions.Item>
          <Descriptions.Item label="资源类型">
            <Tag color={getResourceTypeColor(resourceType)}>{getResourceTypeName(resourceType)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            {auditLoading ? '加载中...' : <Tag color={getStatusMeta().color}>{getStatusMeta().text}</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="上传时间">{resource.createdAt ? formatDateTime(resource.createdAt) : '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {resource.owner && (
        <Card className="shadow-sm mb-6 rounded-2xl">
          <Descriptions title="上传者信息" bordered column={2} labelStyle={{ width: '12.5%' }} contentStyle={{ width: '37.5%' }}>
            <Descriptions.Item label="姓名">{resource.owner.realName || resource.owner.username || '-'}</Descriptions.Item>
            <Descriptions.Item label="学校">{resource.owner.schoolName || '-'}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {fileUrl && (
        <div className="mb-6">
          <Card className="shadow-sm mb-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1d1d1f]">资源预览</h2>
            </div>
          </Card>
          <Card className="shadow-sm rounded-2xl">
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
                    <iframe src={fileUrl} className="w-full h-full rounded-lg" title={resource.title} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-[#6e6e73]">
                      <p className="mb-4">该文档类型不支持在线预览</p>
                      <Button type="primary" icon={<DownloadOutlined />} onClick={onDownload}>下载查看</Button>
                    </div>
                  )}
                </div>
              )}
              {resourceType === 0 && (
                <div className="text-center py-12 text-[#6e6e73]">
                  <p>该资源类型不支持预览</p>
                  <Button type="link" onClick={onDownload} className="mt-4">点击下载查看</Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
