import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getCourseList } from '@/api/baseApi';
import type { CourseInfo } from '@/types/courseType';
import CourseListCard from '@/components/courseLearn/CourseListCard';
import CourseLearnFilterBar from '@/components/courseLearn/CourseLearnFilterBar';
import type { Dayjs } from 'dayjs';

export default function CourseLearn() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [total, setTotal] = useState(0);
  const [schoolOptions, setSchoolOptions] = useState<string[]>([]);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);

  // 筛选条件（真正用于请求的）
  const [teacherName, setTeacherName] = useState('');
  const [schoolName, setSchoolName] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  // 临时输入状态，点击查询按钮后才同步到筛选条件
  const [teacherNameInput, setTeacherNameInput] = useState('');
  const [schoolNameInput, setSchoolNameInput] = useState<string | undefined>(undefined);
  const [dateRangeInput, setDateRangeInput] = useState<[Dayjs | null, Dayjs | null] | null>(null);

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

    const params: {
      status: number;
      page: number;
      pageSize: number;
      teacherName?: string;
      schoolName?: string;
      startDate?: string;
      endDate?: string;
    } = { status: 2, page, pageSize };

    if (teacherName.trim()) {
      params.teacherName = teacherName.trim();
    }
    if (schoolName) {
      params.schoolName = schoolName;
    }
    if (dateRange && dateRange[0] && dateRange[1]) {
      params.startDate = dateRange[0].startOf('day').format('YYYY-MM-DD HH:mm:ss');
      params.endDate = dateRange[1].endOf('day').format('YYYY-MM-DD HH:mm:ss');
    }

    let result;
    try {
      result = await getCourseList(params);
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
    const nextSchools = Array.from(new Set(result.data.records.map((c) => c.teacher?.schoolName).filter(Boolean))) as string[];
    if (nextSchools.length > 0) {
      setSchoolOptions((prev) => Array.from(new Set([...prev, ...nextSchools])));
    }
  }, [page, pageSize, teacherName, schoolName, dateRange]);

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
      navigate(`/courseLearn/${course.courseId}`);
    }
  };

  // 处理筛选输入变化（只更新临时状态，不触发查询）
  const handleTeacherNameInputChange = (value: string) => {
    setTeacherNameInput(value);
  };

  const handleSchoolNameInputChange = (value: string | undefined) => {
    setSchoolNameInput(value);
  };

  const handleDateRangeInputChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRangeInput(dates);
  };

  // 点击查询按钮，将临时状态同步到实际筛选条件并触发查询
  const handleSearch = () => {
    setTeacherName(teacherNameInput);
    setSchoolName(schoolNameInput);
    setDateRange(dateRangeInput);
    setPage(1);
  };

  return (
    <div className="py-12">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-sm mb-8 rounded-2xl">
          <div className="flex justify-start items-center">
            <CourseLearnFilterBar teacherName={teacherNameInput} onTeacherNameChange={handleTeacherNameInputChange} schoolName={schoolNameInput} onSchoolNameChange={handleSchoolNameInputChange} schoolOptions={schoolOptions} dateRange={dateRangeInput} onDateRangeChange={handleDateRangeInputChange} onSearch={handleSearch} />
          </div>
        </Card>

        <Card className="shadow-sm rounded-2xl">
          <CourseListCard courses={courses} loading={loading} page={page} pageSize={pageSize} total={total} onPageChange={(p: number, s: number) => { setPage(p); setPageSize(s); }} onCourseClick={handleCourseClick} />
        </Card>
      </div>
    </div>
  );
}

