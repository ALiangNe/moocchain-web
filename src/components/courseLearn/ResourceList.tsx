import { Card, Tag, Pagination, Spin, Rate, Button } from 'antd';
import type { ResourceInfo } from '@/types/resourceType';
import { formatDate } from '@/utils/formatTime';

interface ResourceListProps {
  data: ResourceInfo[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  onItemClick?: (resource: ResourceInfo) => void;
  onPurchaseClick?: (resource: ResourceInfo) => void;
  resourceRatings?: Record<number, number>;
  purchasedResourceIds?: Set<number>;
}

export default function ResourceList({ data, loading, page, pageSize, total, onPageChange, onItemClick, onPurchaseClick, resourceRatings, purchasedResourceIds }: ResourceListProps) {
  const resourceTypeMap: Record<number, { text: string; color: string }> = {
    0: { text: '其他', color: 'default' },
    1: { text: '文档', color: 'blue' },
    2: { text: '音频', color: 'green' },
    3: { text: '视频', color: 'purple' },
  };

  const accessScopeMap: Record<number, string> = {
    0: '公开',
    1: '校内',
    2: '付费',
  };

  // 处理资源卡片点击事件
  const handleCardClick = (resource: ResourceInfo, e: React.MouseEvent) => {
    // 如果是付费资源且未购买，仍然调用onItemClick，让父组件处理提示
    if (onItemClick) {
      onItemClick(resource);
    }
  };

  // 处理购买按钮点击事件
  const handlePurchaseClick = (resource: ResourceInfo, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPurchaseClick) {
      onPurchaseClick(resource);
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
          const ratingValue =
            resource.resourceId !== undefined && resourceRatings
              ? resourceRatings[resource.resourceId] ?? null
              : null;
          const isPaid = resource.price && Number(resource.price) > 0;
          const isPurchased = resource.resourceId && purchasedResourceIds?.has(resource.resourceId);
          const showPurchaseButton = isPaid && !isPurchased;
          const showPurchasedLabel = isPaid && isPurchased;
          
          return (
            <Card key={resource.resourceId} hoverable={!showPurchaseButton} className={`border border-gray-200 transition-all hover:shadow-md ${showPurchaseButton ? 'cursor-not-allowed' : 'cursor-pointer'}`} onClick={(e) => handleCardClick(resource, e)}>
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-[#1d1d1f]">{resource.title}</h3>
                      <Tag color={typeConfig.color}>{typeConfig.text}</Tag>
                    </div>
                    {showPurchaseButton && (
                      <Button type="primary" onClick={(e) => handlePurchaseClick(resource, e)} className="rounded-lg">
                        购买
                      </Button>
                    )}
                    {showPurchasedLabel && (
                      <Button disabled className="rounded-lg">
                        已购买
                      </Button>
                    )}
                  </div>
                  {resource.description && <p className="text-[#6e6e73] mb-2">{resource.description}</p>}
                  <div className="flex justify-between items-center text-sm text-[#6e6e73]">
                    <div className="flex gap-4">
                      <span>上传时间：{resource.createdAt ? formatDate(resource.createdAt) : '-'}</span>
                    <span className="flex items-center gap-2">
                      <span>资源评分：</span>
                      {ratingValue !== null && ratingValue !== undefined ? (
                        <Rate allowHalf disabled value={Math.max(0, Math.min(5, ratingValue))} />
                      ) : (
                        '暂无评分'
                      )}
                    </span>
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
        <Pagination current={page} pageSize={pageSize} total={total} onChange={(p, s) => onPageChange(p, s)} showSizeChanger showTotal={(total) => `共 ${total} 条数据`} locale={{ items_per_page: '条/页' }} />
      </div>
    </>
  );
}
