import { Card, Pagination } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import type { CourseInfo } from '@/types/courseType';
import { formatDate } from '@/utils/formatTime';

interface CourseListCardProps {
  courses: CourseInfo[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  onCourseClick?: (course: CourseInfo) => void;
}

export default function CourseListCard({ courses, loading, page, pageSize, total, onPageChange, onCourseClick }: CourseListCardProps) {
  // 获取课程封面图片地址
  const getCoverImageUrl = (coverImage?: string) => {
    if (!coverImage) return undefined;
    if (coverImage.startsWith('http')) return coverImage;
    const baseUrl = import.meta.env.VITE_API_BASE_URL.split('/api')[0];
    return `${baseUrl}${coverImage}`;
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      {courses.map((course) => (
        <Card key={course.courseId} hoverable className="cursor-pointer border border-gray-200 transition-all hover:shadow-md overflow-hidden" onClick={() => onCourseClick?.(course)} bodyStyle={{ padding: 0 }}>
          <div className="flex flex-col">
            {course.coverImage && (
              <img src={getCoverImageUrl(course.coverImage)} alt={course.courseName} className="w-full h-40 object-cover" style={{ margin: '-1px -1px 0 -1px', width: 'calc(100% + 2px)' }} />
            )}
            <div className="flex-1 p-4">
              <h3 className="text-lg font-semibold text-[#1d1d1f] mb-2 line-clamp-2">{course.courseName}</h3>
              <p className="text-[#6e6e73] mb-1 text-sm line-clamp-1">{course.description || '暂无课程描述'}</p>
              <p className="text-xs text-[#6e6e73] mb-1 flex justify-between">
                <span>{course.teacher?.schoolName || '-'}</span>
                <span>{course.teacher?.realName || course.teacher?.username || '-'}</span>
              </p>
              <div className="text-xs text-[#6e6e73] flex items-center gap-1">
                <ClockCircleOutlined />
                <span>{course.courseStartTime ? `${formatDate(course.courseStartTime)} 开课` : '-'}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
      {courses.length === 0 && !loading && (
        <p className="col-span-4 text-center text-[#6e6e73] py-8">暂无课程</p>
      )}
      <div className="col-span-4 mt-4 flex justify-end">
        <Pagination current={page} pageSize={pageSize} total={total} onChange={onPageChange} showSizeChanger pageSizeOptions={['8', '16', '32', '64']} showTotal={(total) => `共 ${total} 条`} />
      </div>
    </div>
  );
}
