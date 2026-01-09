import { Card, Descriptions, Popover } from 'antd';
import type { CourseInfo } from '../../types/courseType';
import { formatDateTime } from '../../utils/formatTime';

interface CourseDetailProps {
  course: CourseInfo;
}

export default function CourseDetail({ course }: CourseDetailProps) {
  const getCoverImageUrl = (coverImage?: string) => {
    if (!coverImage) return undefined;
    if (coverImage.startsWith('http')) return coverImage;
    const baseUrl = import.meta.env.VITE_API_BASE_URL.split('/api')[0];
    return `${baseUrl}${coverImage}`;
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
            <Descriptions.Item label="状态">{course.status === 0 ? '未发布' : course.status === 1 ? '已发布' : '已结束'}</Descriptions.Item>
            <Descriptions.Item label="课程评分">TODO：待实现</Descriptions.Item>
            <Descriptions.Item label="开课时间">{course.courseStartTime ? formatDateTime(course.courseStartTime) : '-'}</Descriptions.Item>
            <Descriptions.Item label="结课时间">{course.courseEndTime ? formatDateTime(course.courseEndTime) : '-'}</Descriptions.Item>
          </Descriptions>
        </div>
      </div>
    </Card>
  );
}
