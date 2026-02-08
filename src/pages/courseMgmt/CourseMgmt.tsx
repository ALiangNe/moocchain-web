import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Drawer, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Dayjs } from 'dayjs';
import { useAuthStore } from '@/stores/authStore';
import { createCourse, getCourseList } from '@/api/baseApi';
import type { CourseInfo } from '@/types/courseType';
import CourseForm from '@/components/courseMgmt/CourseForm';
import CourseListCard from '@/components/courseMgmt/CourseListCard';
import CourseMgmtFilterBar from '@/components/courseMgmt/CourseMgmtFilterBar';
import { UserRole } from '@/constants/role';

export default function CourseMgmt() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseDrawerVisible, setCourseDrawerVisible] = useState(false);
  const [coursePage, setCoursePage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [courseTotal, setCourseTotal] = useState(0);
  const [teacherName, setTeacherName] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [teacherNameInput, setTeacherNameInput] = useState<string>('');
  const [dateRangeInput, setDateRangeInput] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);

  // 加载课程列表数据
  const loadCourses = useCallback(async () => {
    if (!user?.userId || user.role === UserRole.STUDENT) return;
    if (loadingRef.current) return;

    const currentRequestId = ++requestIdRef.current;
    loadingRef.current = true;

    queueMicrotask(() => {
      if (requestIdRef.current !== currentRequestId) {
        loadingRef.current = false;
        return;
      }
      setCourseLoading(true);
    });

    // 管理员可以查看所有课程，教师只能查看自己的课程
    const baseParams = user.role === UserRole.ADMIN
      ? { page: coursePage, pageSize }
      : { teacherId: user.userId, page: coursePage, pageSize };

    const params: {
      teacherId?: number;
      page: number;
      pageSize: number;
      teacherName?: string;
      startDate?: string;
      endDate?: string;
    } = {
      ...baseParams,
    };

    if (teacherName.trim()) {
      params.teacherName = teacherName.trim();
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
        setCourseLoading(false);
        loadingRef.current = false;
        message.error('加载失败，请重试');
      }
      return;
    }

    if (requestIdRef.current !== currentRequestId) return;

    setCourseLoading(false);
    loadingRef.current = false;

    if (result.code !== 0 || !result.data) {
      message.error(result.message || '加载失败');
      return;
    }

    setCourses(result.data.records);
    setCourseTotal(result.data.total);
  }, [user, coursePage, pageSize, teacherName, dateRange]);


  useEffect(() => {
    const effectRequestId = requestIdRef.current;
    queueMicrotask(() => {
      loadCourses();
    });
    return () => {
      requestIdRef.current = effectRequestId + 1;
    };
  }, [loadCourses]);

  // 创建新课程
  const handleCreateCourse = async (values: Partial<CourseInfo>, coverImage?: File) => {
    let result;
    try {
      result = await createCourse(values, coverImage);
    } catch (error) {
      console.error('Create course error:', error);
      message.error('创建失败，请重试');
      return;
    }

      if (result.code !== 0) {
        message.error(result.message || '创建失败');
        return;
      }
      message.success('课程创建成功');
      setCourseDrawerVisible(false);
      loadCourses();
  };


  if (user?.role === UserRole.STUDENT) {
    return (
      <div className="py-12">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-sm mb-8 rounded-2xl">
            <h1 className="text-lg font-semibold text-[#1d1d1f]">资源管理</h1>
          </Card>
          <Card className="shadow-sm rounded-2xl">
            <p className="text-center text-[#6e6e73]">学生无法访问此页面</p>
          </Card>
        </div>
      </div>
    );
  }

  // 处理课程点击，跳转到课程详情页
  const handleCourseClick = (course: CourseInfo) => {
    navigate(`/courseMgmt/${course.courseId}`);
  };

  // 处理筛选输入变化（只更新临时状态，不触发查询）
  const handleTeacherNameInputChange = (value: string) => {
    setTeacherNameInput(value);
  };

  const handleDateRangeInputChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRangeInput(dates);
  };

  // 点击查询按钮，将临时状态同步到实际筛选条件并触发查询
  const handleSearch = () => {
    setTeacherName(teacherNameInput);
    setDateRange(dateRangeInput);
    setCoursePage(1); // 重置到第一页
  };

  return (
    <div className="py-12">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-sm mb-8 rounded-2xl">
          <div className="flex justify-between items-center">
            <CourseMgmtFilterBar teacherName={teacherNameInput} onTeacherNameChange={handleTeacherNameInputChange} dateRange={dateRangeInput} onDateRangeChange={handleDateRangeInputChange} onSearch={handleSearch} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCourseDrawerVisible(true)} className="rounded-lg">创建课程</Button>
        </div>
        </Card>

        <Card className="shadow-sm rounded-2xl">
          <CourseListCard courses={courses} loading={courseLoading} page={coursePage} pageSize={pageSize} total={courseTotal} onPageChange={(p: number, s: number) => { setCoursePage(p); setPageSize(s); }} onCourseClick={handleCourseClick} />
        </Card>

        <Drawer title="创建课程" open={courseDrawerVisible} onClose={() => setCourseDrawerVisible(false)} width={700} placement="right">
          <CourseForm onSubmit={handleCreateCourse} onCancel={() => setCourseDrawerVisible(false)} />
        </Drawer>
      </div>
    </div>
  );
}
