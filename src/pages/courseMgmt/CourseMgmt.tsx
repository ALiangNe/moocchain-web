import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Drawer, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { createCourse, getCourseList } from '../../api/baseApi';
import type { CourseInfo } from '../../types/courseType';
import CourseForm from '../../components/courseMgmt/CourseForm';
import CourseList from '../../components/courseMgmt/CourseList';
import { UserRole } from '../../constants/role';

export default function Resources() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseDrawerVisible, setCourseDrawerVisible] = useState(false);
  const [coursePage, setCoursePage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [courseTotal, setCourseTotal] = useState(0);
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

    let result;
    try {
      // 管理员可以查看所有课程，教师只能查看自己的课程
      const params = user.role === UserRole.ADMIN
        ? { page: coursePage, pageSize }
        : { teacherId: user.userId, page: coursePage, pageSize };
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
  }, [user, coursePage, pageSize]);


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
    try {
      const result = await createCourse(values, coverImage);
      if (result.code !== 0) {
        message.error(result.message || '创建失败');
        return;
      }
      message.success('课程创建成功');
      setCourseDrawerVisible(false);
      loadCourses();
    } catch (error) {
      console.error('Create course error:', error);
      message.error('创建失败，请重试');
    }
  };


  if (user?.role === UserRole.STUDENT) {
    return (
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-lg font-semibold mb-6 text-[#1d1d1f]">资源管理</h1>
          <Card className="shadow-sm">
            <p className="text-center text-[#6e6e73]">学生无法访问此页面</p>
          </Card>
        </div>
      </div>
    );
  }

  // 处理课程点击，跳转到课程详情页
  const handleCourseClick = (course: CourseInfo) => {
    navigate(`/coursemgmt/${course.courseId}`);
  };

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-[#1d1d1f]">资源管理</h1>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCourseDrawerVisible(true)} className="rounded-lg">创建课程</Button>
        </div>

        <Card className="shadow-sm">
          <CourseList courses={courses} loading={courseLoading} page={coursePage} pageSize={pageSize} total={courseTotal} onPageChange={(p, s) => { setCoursePage(p); setPageSize(s); }} onCourseClick={handleCourseClick} />
        </Card>

        <Drawer title="创建课程" open={courseDrawerVisible} onClose={() => setCourseDrawerVisible(false)} width={700} placement="right">
          <CourseForm onSubmit={handleCreateCourse} onCancel={() => setCourseDrawerVisible(false)} />
        </Drawer>
      </div>
    </div>
  );
}
