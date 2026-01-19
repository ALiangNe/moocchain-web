import { Card, Rate, Avatar, Spin, Empty, Pagination } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { LearningRecordInfo } from '@/types/learningRecordType';
import { formatDateTime } from '@/utils/formatTime';

interface ReviewListProps {
  reviews: LearningRecordInfo[];
  loading?: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
}

export default function ReviewList({ reviews, loading, total, page, pageSize, onPageChange }: ReviewListProps) {
  // 获取用户头像地址
  const getAvatarUrl = (avatar?: string) => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http')) return avatar;
    const baseUrl = import.meta.env.VITE_API_BASE_URL.split('/api')[0];
    return `${baseUrl}${avatar}`;
  };

  return (
    <Card className="shadow-sm">
      <h2 className="text-lg font-semibold text-[#1d1d1f] mb-6">评价列表</h2>
      {loading && reviews.length === 0 ? (
        <div className="flex justify-center items-center py-8">
          <Spin />
        </div>
      ) : reviews.length === 0 ? (
        <Empty description="暂无评价" />
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => {
            const student = review.student;
            const studentName = student?.realName || student?.username || '匿名用户';
            const studentAvatarUrl = getAvatarUrl(student?.avatar);

            return (
              <div key={review.recordId} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                <div className="flex items-start gap-4">
                  <Avatar src={studentAvatarUrl} icon={<UserOutlined />} size={40} className="flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#1d1d1f]">{studentName}</span>
                      <span className="text-xs text-[#6e6e73]">{review.updatedAt ? formatDateTime(review.updatedAt) : '-'}</span>
                    </div>
                    <div className="mb-2">
                      <Rate disabled value={review.rating || 0} />
                    </div>
                    <p className="text-sm text-[#6e6e73] leading-relaxed">{review.review}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Pagination current={page} pageSize={pageSize} total={total} onChange={(p, s) => onPageChange(p, s)} showSizeChanger showTotal={(t) => `共 ${t} 条`} hideOnSinglePage={false} />
      </div>
    </Card>
  );
}
