import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getLearningHistoryList } from '@/api/baseApi';
import type { ResourceInfo } from '@/types/resourceType';
import LearningHistoryList from '@/components/learningHistory/LearningHistoryList';
import LearningHistoryPieChart from '@/components/learningHistory/LearningHistoryPieChart';
import LearningHistoryBarChart from '@/components/learningHistory/LearningHistoryBarChart';

export default function LearningHistory() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<ResourceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadLearningHistory = useCallback(async () => {
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
      result = await getLearningHistoryList({ page, pageSize });
    } catch (error) {
      console.error('Load learning history error:', error);
      if (requestIdRef.current === currentRequestId) {
        setLoading(false);
        loadingRef.current = false;
      }
      return;
    }

    if (requestIdRef.current !== currentRequestId) return;

    setLoading(false);
    loadingRef.current = false;

    if (result.code !== 0 || !result.data) return;
    setCourses(result.data.records);
    setTotal(result.data.total);
  }, [page, pageSize]);

  useEffect(() => {
    const effectRequestId = requestIdRef.current;
    queueMicrotask(() => {
      loadLearningHistory();
    });
    return () => {
      requestIdRef.current = effectRequestId + 1;
    };
  }, [loadLearningHistory]);

  const handlePageChange = (p: number, s: number) => {
    setPage(p);
    setPageSize(s);
  };

  const handleCourseClick = (resource: ResourceInfo) => {
    if (resource.course?.courseId && resource.resourceId) navigate(`/courseLearn/${resource.course.courseId}/resource/${resource.resourceId}`);
  };

  return (
    <div className="py-12">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-sm rounded-2xl">
            <LearningHistoryBarChart data={courses} />
          </Card>
          <Card className="shadow-sm rounded-2xl">
            <LearningHistoryPieChart data={courses} />
          </Card>
        </div>
        <Card className="shadow-sm mb-8 rounded-2xl">
          <h1 className="text-lg font-semibold text-[#1d1d1f]">学习记录</h1>
        </Card>
        <Card className="shadow-sm rounded-2xl">
          <LearningHistoryList data={courses} loading={loading} page={page} pageSize={pageSize} total={total} onPageChange={handlePageChange} onItemClick={handleCourseClick} />
        </Card>
      </div>
    </div>
  );
}

