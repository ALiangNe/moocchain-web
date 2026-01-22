import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getCourseList } from '@/api/baseApi';
import type { CourseInfo } from '@/types/courseType';
import CourseList from '@/components/courseLearn/CourseCard';

export default function CourseLearn() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [total, setTotal] = useState(0);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);

  // 加载已发布的课程列表
  const loadPublishedCourses = useCallback(async () => {
    if (loadingRef.current) return;

    const currentRequestId = ++requestIdRef.current;
    loadingRef.current = true;

    queueMicrotask(() => {
      if (requestIdRef.current !== currentRequestId) {
        loadingRef.current = false;
        return;
      }
      setLoading(true);
    });

    let result;
    try {
      // 只获取状态为2（已发布）的课程
      result = await getCourseList({ status: 2, page, pageSize });
    } catch (error) {
      console.error('Load courses error:', error);
      if (requestIdRef.current === currentRequestId) {
        setLoading(false);
        loadingRef.current = false;
        message.error('加载失败，请重试');
      }
      return;
    }

    if (requestIdRef.current !== currentRequestId) return;

    setLoading(false);
    loadingRef.current = false;

    if (result.code !== 0 || !result.data) {
      message.error(result.message || '加载失败');
      return;
    }

    setCourses(result.data.records);
    setTotal(result.data.total);
  }, [page, pageSize]);

  useEffect(() => {
    const effectRequestId = requestIdRef.current;
    queueMicrotask(() => {
      loadPublishedCourses();
    });
    return () => {
      requestIdRef.current = effectRequestId + 1;
    };
  }, [loadPublishedCourses]);

  // 处理课程点击，跳转到课程详情页
  const handleCourseClick = (course: CourseInfo) => {
    if (course.courseId) {
      navigate(`/courselearn/${course.courseId}`);
    }
  };

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-[#1d1d1f]">课程学习</h1>
        </div>

        <Card className="shadow-sm">
          <CourseList courses={courses} loading={loading} page={page} pageSize={pageSize} total={total} onPageChange={(p, s) => { setPage(p); setPageSize(s); }} onCourseClick={handleCourseClick} />
        </Card>
      </div>
    </div>
  );
}

