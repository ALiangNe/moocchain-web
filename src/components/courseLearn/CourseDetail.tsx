import { Card, Descriptions, Popover, Rate, Progress, Alert } from 'antd';
import type { CourseInfo } from '@/types/courseType';
import { formatDateTime } from '@/utils/formatTime';

interface CourseDetailProps {
  course: CourseInfo;
  averageRating?: number | null;
  courseProgress?: number | null;
}

export default function CourseDetail({ course, averageRating, courseProgress }: CourseDetailProps) {
  // 获取课程封面图片地址
  const getCoverImageUrl = (coverImage?: string) => {
    if (!coverImage) return undefined;
    if (coverImage.startsWith('http')) return coverImage;
    const baseUrl = import.meta.env.VITE_API_BASE_URL.split('/api')[0];
    return `${baseUrl}${coverImage}`;
  };

  const hasProgress = courseProgress !== null && courseProgress !== undefined;
  const progressValue = hasProgress ? Math.round(courseProgress as number) : 0;
  const isCompleted = progressValue >= 100;

  return (
    <Card className="shadow-sm mb-6">
      <div className="flex gap-6 items-stretch">
        {course.coverImage && (
          <div className="w-1/2 flex-shrink-0">
            <img src={getCoverImageUrl(course.coverImage)} alt={course.courseName} className="w-full h-full object-cover rounded-lg" />
          </div>
        )}
        <div className={`flex-1 ${course.coverImage ? 'w-1/2' : 'w-full'} relative`}>
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
            <Descriptions.Item label="开课时间">{course.courseStartTime ? formatDateTime(course.courseStartTime) : '-'}</Descriptions.Item>
            <Descriptions.Item label="结课时间">{course.courseEndTime ? formatDateTime(course.courseEndTime) : '-'}</Descriptions.Item>
            <Descriptions.Item label="课程评分">
              {averageRating !== null && averageRating !== undefined ? <Rate allowHalf disabled value={Math.max(0, Math.min(5, averageRating))} /> : '暂无评分'}
            </Descriptions.Item>
            <Descriptions.Item label="课程学习进度">
              {!hasProgress ? (
                '未开始'
              ) : (
                <div className="space-y-2 w-full">
                  <Progress percent={progressValue} strokeColor={isCompleted ? '#52c41a' : '#007aff'} className="mb-1" />
                  <div className="flex justify-between text-xs text-[#6e6e73]">
                    <span>进度：{progressValue}%</span>
                    {isCompleted ? <span className="text-green-600">已完成</span> : <span>剩余 {Math.max(0, 100 - progressValue)}%</span>}
                  </div>
                  {!isCompleted && (
                    <Alert type="warning" showIcon message={`未完成学习，剩余 ${Math.max(0, 100 - progressValue)}%`} description="完成 100% 后可完成课程学习。" className="text-xs" />
                  )}
                  {isCompleted && (
                    <Alert type="success" showIcon message="已完成课程学习" description="恭喜你已完成本课程全部资源的学习！" className="text-xs" />
                  )}
                </div>
              )}
            </Descriptions.Item>
          </Descriptions>
        </div>
      </div>
    </Card>
  );
}
