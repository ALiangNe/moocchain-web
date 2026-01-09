import { Card, Tag, Button, Pagination, Spin } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { ResourceInfo } from '../../types/resourceType';
import { formatDate } from '../../utils/formatTime';

interface ResourceListProps {
  data: ResourceInfo[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  onEdit?: (resource: ResourceInfo) => void;
  onItemClick?: (resource: ResourceInfo) => void;
}

export default function ResourceList({ data, loading, page, pageSize, total, onPageChange, onEdit, onItemClick }: ResourceListProps) {
  const resourceTypeMap: Record<number, { text: string; color: string }> = {
    0: { text: '其他', color: 'default' },
    1: { text: '文档', color: 'blue' },
    2: { text: '音频', color: 'green' },
    3: { text: '视频', color: 'purple' },
  };

  const statusMap: Record<number, { text: string; color: string }> = {
    0: { text: '待审核', color: 'processing' },
    1: { text: '已审核', color: 'success' },
    2: { text: '已发布', color: 'default' },
    3: { text: '已下架', color: 'error' },
  };

  const accessScopeMap: Record<number, string> = {
    0: '公开',
    1: '校内',
    2: '付费',
  };

  const handleCardClick = (resource: ResourceInfo, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    if (onItemClick) {
      onItemClick(resource);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {data.map((resource) => {
          const typeConfig = resourceTypeMap[resource.resourceType || 0] || resourceTypeMap[0];
          const statusConfig = statusMap[resource.status || 0] || statusMap[0];
          return (
            <Card key={resource.resourceId} hoverable className="border border-gray-200 transition-all hover:shadow-md cursor-pointer" onClick={(e) => handleCardClick(resource, e)}>
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-[#1d1d1f]">{resource.title}</h3>
                      <Tag color={typeConfig.color}>{typeConfig.text}</Tag>
                      <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
                    </div>
                    {onEdit && (
                      <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(resource)} className="flex-shrink-0 focus:outline-none focus:shadow-none">
                        编辑
                      </Button>
                    )}
                  </div>
                  {resource.description && <p className="text-[#6e6e73] mb-2">{resource.description}</p>}
                  <div className="flex justify-between items-center text-sm text-[#6e6e73]">
                    <div className="flex gap-4">
                      <span>上传时间：{resource.createdAt ? formatDate(resource.createdAt) : '-'}</span>
                      <span>资源评分：TODO:待完成</span>
                    </div>
                    <div className="flex gap-4">
                      {resource.price && Number(resource.price) !== 0 && <span>价格：{resource.price} 代币</span>}
                      <span>访问范围：{accessScopeMap[resource.accessScope || 0] || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        {data.length === 0 && !loading && <p className="text-center text-[#6e6e73] py-8">暂无资源</p>}
      </div>
      <div className="mt-4 flex justify-end">
        <Pagination current={page} pageSize={pageSize} total={total} onChange={(p, s) => onPageChange(p, s)} showSizeChanger showTotal={(total) => `共 ${total} 条`} />
      </div>
    </>
  );
}
