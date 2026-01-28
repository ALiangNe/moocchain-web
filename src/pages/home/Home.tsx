import { useEffect, useRef, useState } from 'react';
import { Card, message } from 'antd';
import HomeBanner from '@/components/home/HomeBanner';
import { getCourseList } from '@/api/baseApi';
import type { CourseInfo } from '@/types/courseType';
import EliteCourses01 from '@/components/home/EliteCourses-01';
import EliteCourses02 from '@/components/home/EliteCourses-02';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [featuredCourses, setFeaturedCourses] = useState<CourseInfo[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);
  const [latestCourses, setLatestCourses] = useState<CourseInfo[]>([]);
  const [latestLoading, setLatestLoading] = useState(false);
  const latestLoadingRef = useRef(false);
  const latestRequestIdRef = useRef(0);

  useEffect(() => {
    const loadFeaturedCourses = async () => {
      if (loadingRef.current) return;

      const currentRequestId = ++requestIdRef.current;
      loadingRef.current = true;

      queueMicrotask(() => {
        if (requestIdRef.current !== currentRequestId) {
          loadingRef.current = false;
          return;
        }
        setFeaturedLoading(true);
      });

      const toTime = (value: unknown): number => {
        if (!value) return 0;
        if (value instanceof Date) return value.getTime();
        const t = new Date(String(value)).getTime();
        return Number.isFinite(t) ? t : 0;
      };

      let result;
      try {
        result = await getCourseList({
          status: 2,
          schoolNames: ['清华大学', '北京大学', '复旦大学'],
          page: 1,
          pageSize: 8,
        });
      } catch (error) {
        console.error('Load featured courses error:', error);
        if (requestIdRef.current !== currentRequestId) {
          loadingRef.current = false;
          return;
        }
        message.error('加载名师名课失败，请重试');
        setFeaturedCourses([]);
        setFeaturedLoading(false);
        loadingRef.current = false;
        return;
      }

      if (requestIdRef.current !== currentRequestId) {
        loadingRef.current = false;
        return;
      }

      if (result.code !== 0 || !result.data) {
        message.error(result.message || '加载名师名课失败');
        setFeaturedCourses([]);
        setFeaturedLoading(false);
        loadingRef.current = false;
        return;
      }

      const courses = (result.data.records || []).slice(0, 8);
      courses.sort((a, b) => {
        const at = toTime(a.updatedAt) || toTime(a.createdAt);
        const bt = toTime(b.updatedAt) || toTime(b.createdAt);
        return bt - at;
      });

      setFeaturedCourses(courses);
      setFeaturedLoading(false);
      loadingRef.current = false;
    };

    const effectRequestId = requestIdRef.current;
    queueMicrotask(() => {
      loadFeaturedCourses();
    });
    return () => {
      requestIdRef.current = effectRequestId + 1;
    };
  }, []);

  useEffect(() => {
    const loadLatestCourses = async () => {
      if (latestLoadingRef.current) return;

      const currentRequestId = ++latestRequestIdRef.current;
      latestLoadingRef.current = true;

      queueMicrotask(() => {
        if (latestRequestIdRef.current !== currentRequestId) {
          latestLoadingRef.current = false;
          return;
        }
        setLatestLoading(true);
      });

      const toTime = (value: unknown): number => {
        if (!value) return 0;
        if (value instanceof Date) return value.getTime();
        const t = new Date(String(value)).getTime();
        return Number.isFinite(t) ? t : 0;
      };

      let result;
      try {
        result = await getCourseList({
          status: 2,
          page: 1,
          pageSize: 8,
        });
      } catch (error) {
        console.error('Load latest courses error:', error);
        if (latestRequestIdRef.current !== currentRequestId) {
          latestLoadingRef.current = false;
          return;
        }
        message.error('加载最新课程失败，请重试');
        setLatestCourses([]);
        setLatestLoading(false);
        latestLoadingRef.current = false;
        return;
      }

      if (latestRequestIdRef.current !== currentRequestId) {
        latestLoadingRef.current = false;
        return;
      }

      if (result.code !== 0 || !result.data) {
        message.error(result.message || '加载最新课程失败');
        setLatestCourses([]);
        setLatestLoading(false);
        latestLoadingRef.current = false;
        return;
      }

      const courses = (result.data.records || []).slice(0, 8);
      courses.sort((a, b) => {
        const at = toTime(a.updatedAt) || toTime(a.createdAt);
        const bt = toTime(b.updatedAt) || toTime(b.createdAt);
        return bt - at;
      });

      setLatestCourses(courses);
      setLatestLoading(false);
      latestLoadingRef.current = false;
    };

    const effectRequestId = latestRequestIdRef.current;
    queueMicrotask(() => {
      loadLatestCourses();
    });
    return () => {
      latestRequestIdRef.current = effectRequestId + 1;
    };
  }, []);

  return (
    <div className="py-12">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <HomeBanner onBannerClick={() => navigate('/courseLearn')} />
        <Card className="shadow-sm mb-4 rounded-2xl">
          <h2 className="text-lg font-semibold text-[#1d1d1f]">名师指路，名校同行！</h2>
        </Card>
        <Card className="shadow-sm mb-8 rounded-2xl">
          <EliteCourses01 courses={featuredCourses} loading={featuredLoading} onCourseClick={(course) => { if (course.courseId) navigate(`/courseLearn/${course.courseId}`); }} />
        </Card>
        <Card className="shadow-sm mb-4 rounded-2xl">
          <h2 className="text-lg font-semibold text-[#1d1d1f]">新课集结，即刻开启！</h2>
        </Card>
        <Card className="shadow-sm mb-8 rounded-2xl">
          <EliteCourses02 courses={latestCourses} loading={latestLoading} onCourseClick={(course) => { if (course.courseId) navigate(`/courseLearn/${course.courseId}`); }} />
        </Card>
      </div>
    </div>
  );
}


