import { Card, Descriptions, Popover, Rate, Tag } from 'antd';
import type { CourseInfo } from '@/types/courseType';
import { formatDateTime } from '@/utils/formatTime';
import type { AuditRecordInfo } from '@/types/auditRecordType';

interface CourseDetailProps {
  course: CourseInfo;
  averageRating?: number | null;
  latestAuditRecord?: AuditRecordInfo | null;
  auditLoading?: boolean;
}

export default function CourseDetail({ course, averageRating, latestAuditRecord = null, auditLoading = false }: CourseDetailProps) {

  // 获取课程封面图片地址
  const getCoverImageUrl = (coverImage?: string) => {
    if (!coverImage) return undefined;
    if (coverImage.startsWith('http')) return coverImage;
    const baseUrl = import.meta.env.VITE_API_BASE_URL.split('/api')[0];
    return `${baseUrl}${coverImage}`;
  };

  // 获取状态显示文本与颜色
  const getStatusMeta = () => {
    if (course.status === 0) {
      if (latestAuditRecord && latestAuditRecord.auditStatus === 2) {
        return { text: '审核未通过，请重新提交申请', color: 'red' as const };
      }
      return { text: '待审核', color: 'orange' as const };
    }
    if (course.status === 1) return { text: '已审核', color: 'gold' as const };
    if (course.status === 2) return { text: '已发布', color: 'green' as const };
    if (course.status === 3) return { text: '已下架', color: 'default' as const };
    return { text: '-', color: 'default' as const };
  };

  return (
    <Card className="shadow-sm mb-6">
      <div className="flex gap-6 items-stretch">
        {course.coverImage && (
          <div className="w-1/2 flex-shrink-0">
            <img src={getCoverImageUrl(course.coverImage)} alt={course.courseName} className="w-full h-full object-cover rounded-lg" />
          </div>
        )}
        <div className={`flex-1 ${course.coverImage ? 'w-1/2' : 'w-full'}`}>
          {course.teacher && (
            <Descriptions title="授课人信息" bordered column={1} className="mb-4" labelStyle={{ width: '25%' }} contentStyle={{ width: '75%' }}>
              <Descriptions.Item label="授课人">
                {course.teacher.realName || course.teacher.username || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="所在学校">
                {course.teacher.schoolName || '-'}
              </Descriptions.Item>
            </Descriptions>
          )}
          <Descriptions title="课程信息" bordered column={1} labelStyle={{ width: '25%' }} contentStyle={{ width: '75%' }}>
            <Descriptions.Item label="课程名称">{course.courseName}</Descriptions.Item>
            <Descriptions.Item label="课程描述">
              {course.description ? (
                <Popover content={course.description} trigger="hover">
                  <div className="line-clamp-1 cursor-pointer">{course.description}</div>
                </Popover>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {auditLoading ? (
                '加载中...'
              ) : (
                <Tag color={getStatusMeta().color}>{getStatusMeta().text}</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="课程评分">
              {averageRating !== null && averageRating !== undefined ? <Rate allowHalf disabled value={Math.max(0, Math.min(5, averageRating))} /> : '暂无评分'}
            </Descriptions.Item>
            <Descriptions.Item label="开课时间">{course.courseStartTime ? formatDateTime(course.courseStartTime) : '-'}</Descriptions.Item>
            <Descriptions.Item label="结课时间">{course.courseEndTime ? formatDateTime(course.courseEndTime) : '-'}</Descriptions.Item>
          </Descriptions>
        </div>
      </div>
    </Card>
  );
}
