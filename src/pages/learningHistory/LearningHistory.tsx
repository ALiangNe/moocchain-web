import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getLearningHistoryList } from '@/api/baseApi';
import type { ResourceInfo } from '@/types/resourceType';
import LearningHistoryList from '@/components/learningHistory/LearningHistoryList';
import LearningHistoryPieChart from '@/components/learningHistory/LearningHistoryPieChart';
import LearningHistoryBarChart from '@/components/learningHistory/LearningHistoryBarChart';
import LearningHistoryFilterBar from '@/components/learningHistory/LearningHistoryFilterBar';

export default function LearningHistory() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<ResourceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [teacherName, setTeacherName] = useState<string>('');
  const [resourceType, setResourceType] = useState<number | undefined>(undefined);
  const [isCompleted, setIsCompleted] = useState<number | undefined>(undefined);
  const [teacherNameInput, setTeacherNameInput] = useState<string>('');
  const [resourceTypeInput, setResourceTypeInput] = useState<number | undefined>(undefined);
  const [isCompletedInput, setIsCompletedInput] = useState<number | undefined>(undefined);
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

    const params: {
      page: number;
      pageSize: number;
      teacherName?: string;
      resourceType?: number;
      isCompleted?: number;
    } = {
      page,
      pageSize,
    };

    if (teacherName.trim()) {
      params.teacherName = teacherName.trim();
    }

    if (resourceType !== undefined) {
      params.resourceType = resourceType;
    }

    if (isCompleted !== undefined) {
      params.isCompleted = isCompleted;
    }

    let result;
    try {
      result = await getLearningHistoryList(params);
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
  }, [page, pageSize, teacherName, resourceType, isCompleted]);

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

  // 处理筛选输入变化（只更新临时状态，不触发查询）
  const handleTeacherNameInputChange = (value: string) => {
    setTeacherNameInput(value);
  };

  const handleResourceTypeInputChange = (value: number | undefined) => {
    setResourceTypeInput(value);
  };

  const handleIsCompletedInputChange = (value: number | undefined) => {
    setIsCompletedInput(value);
  };

  // 点击查询按钮，将临时状态同步到实际筛选条件并触发查询
  const handleSearch = () => {
    setTeacherName(teacherNameInput);
    setResourceType(resourceTypeInput);
    setIsCompleted(isCompletedInput);
    setPage(1); // 重置到第一页
  };

  return (
    <div className="py-12">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-sm mb-8 rounded-2xl">
          <div className="flex justify-start items-center">
            <LearningHistoryFilterBar teacherName={teacherNameInput} onTeacherNameChange={handleTeacherNameInputChange} resourceType={resourceTypeInput} onResourceTypeChange={handleResourceTypeInputChange} isCompleted={isCompletedInput} onIsCompletedChange={handleIsCompletedInputChange} onSearch={handleSearch} />
          </div>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-sm rounded-2xl">
            <LearningHistoryBarChart data={courses} />
          </Card>
          <Card className="shadow-sm rounded-2xl">
            <LearningHistoryPieChart data={courses} />
          </Card>
        </div>
        <Card className="shadow-sm rounded-2xl">
          <LearningHistoryList data={courses} loading={loading} page={page} pageSize={pageSize} total={total} onPageChange={handlePageChange} onItemClick={handleCourseClick} />
        </Card>
      </div>
    </div>
  );
}

