import { List, Empty, Spin, Pagination, Progress, Tag } from 'antd';
import { PlayCircleFilled, FileTextOutlined, CustomerServiceOutlined, FileOutlined } from '@ant-design/icons';
import type { ResourceInfo } from '@/types/resourceType';
import { formatDateTime } from '@/utils/formatTime';

interface LearningHistoryCourseListProps {
  data: (ResourceInfo & { learningProgress?: number })[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  onItemClick?: (course: ResourceInfo) => void;
}

export default function LearningHistoryCourseList({ data, loading, page, pageSize, total, onPageChange, onItemClick }: LearningHistoryCourseListProps) {
  const resourceTypeMap: Record<number, { text: string; color: string }> = {
    0: { text: '其他', color: 'default' },
    1: { text: '文档', color: 'blue' },
    2: { text: '音频', color: 'green' },
    3: { text: '视频', color: 'purple' },
  };

  const getResourceFileUrl = (ipfsHash?: string) => {
    if (!ipfsHash) return undefined;
    if (ipfsHash.startsWith('http')) return ipfsHash;
    if (!ipfsHash.startsWith('/') && (ipfsHash.startsWith('Qm') || ipfsHash.startsWith('b') || ipfsHash.length > 30)) {
      const gatewayUrl = import.meta.env.VITE_IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';
      return `${gatewayUrl}${ipfsHash}`;
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL.split('/api')[0];
    return `${baseUrl}${ipfsHash}`;
  };

  const renderPreview = (resource: ResourceInfo) => {
    const fileUrl = getResourceFileUrl(resource.ipfsHash);
    const t = resource.resourceType ?? 0;
    if (t === 3 && fileUrl) {
      return (
        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-black/5 self-stretch">
          <video className="w-full h-full object-cover" src={fileUrl} muted playsInline preload="metadata" />
          <div className="absolute inset-0 flex items-center justify-center">
            <PlayCircleFilled className="text-white/90 text-2xl drop-shadow" />
          </div>
        </div>
      );
    }
    if (t === 2) {
      return (
        <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gradient-to-br from-[#f5f5f7] to-white flex items-center justify-center self-stretch">
          <CustomerServiceOutlined className="text-[#007aff] text-3xl" />
        </div>
      );
    }
    if (t === 1) {
      return (
        <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gradient-to-br from-[#f5f5f7] to-white flex items-center justify-center self-stretch">
          <FileTextOutlined className="text-[#007aff] text-3xl" />
        </div>
      );
    }
    if (fileUrl) {
      return (
        <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-black/5 self-stretch">
          <img src={fileUrl} alt={resource.title || '资源封面'} className="w-full h-full object-cover" />
        </div>
      );
    }
    return (
      <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gradient-to-br from-[#f5f5f7] to-white flex items-center justify-center self-stretch">
        <FileOutlined className="text-[#6e6e73] text-3xl" />
      </div>
    );
  };

  const renderProgress = (progress?: number) => {
    if (progress === undefined || progress === null) {
      return <span className="text-xs text-[#6e6e73]">未开始</span>;
    }
    const progressValue = Math.round(progress);
    const isCompleted = progressValue >= 100;
    const color = isCompleted ? '#52c41a' : '#007aff';
    return (
      <div className="flex items-center gap-2">
        <Progress percent={progressValue} strokeColor={color} size="small" showInfo={false} className="w-16" />
        <span className="text-xs font-medium" style={{ color }}>{progressValue}%</span>
        <Tag color={color}>{isCompleted ? '已完成' : '未完成'}</Tag>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Spin size="large" />
      </div>
    );
  }

  if (!data.length) {
    return <Empty description="还没有学习记录，去探索课程开始学习吧～" />;
  }

  return (
    <>
        <List
          itemLayout="horizontal"
          dataSource={data}
          renderItem={(resource) => {
            const course = resource.course;
            const teacher = course?.teacher;
            return (
              <List.Item className="hover:bg-gray-50/80 transition-colors cursor-pointer rounded-xl px-3" onClick={() => onItemClick && onItemClick(resource)}>
                <List.Item.Meta
                  avatar={renderPreview(resource)}
                  title={
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-[#1d1d1f]">{course?.courseName || '未知课程'} {resource.title}</span>
                        {(() => {
                          const typeConfig = resourceTypeMap[resource.resourceType || 0] || resourceTypeMap[0];
                          return <Tag color={typeConfig.color}>{typeConfig.text}</Tag>;
                        })()}
                        {renderProgress((resource as ResourceInfo & { learningProgress?: number }).learningProgress)}
                      </div>
                      <span className="text-xs text-[#6e6e73]">{course?.courseStartTime ? `开课：${formatDateTime(course.courseStartTime)}` : ''}</span>
                    </div>
                  }
                  description={
                    <div className="flex flex-col gap-1 text-xs text-[#6e6e73]">
                      <span className="line-clamp-1">{resource.description || '暂无资源描述'}</span>
                      <span>{teacher?.realName || teacher?.username || '未知教师'} · {teacher?.schoolName || '未知学校'}</span>
                    </div>
                  }
                />
              </List.Item>
            )
          }}
        />
      <div className="mt-4 flex justify-end">
        <Pagination current={page} pageSize={pageSize} total={total} onChange={(p, s) => onPageChange(p, s)} showSizeChanger showTotal={(t) => `共 ${t} 条数据`} locale={{ items_per_page: '条/页' }} />
      </div>
    </>
  );
}
