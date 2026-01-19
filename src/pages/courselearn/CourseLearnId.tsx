import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, message, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourse, getResourceList, getLearningRecordList } from '@/api/baseApi';
import type { CourseInfo } from '@/types/courseType';
import type { ResourceInfo } from '@/types/resourceType';
import type { LearningRecordInfo } from '@/types/learningRecordType';
import { useAuthStore } from '@/stores/authStore';
import ResourceList from '@/components/courseLearn/ResourceList';
import CourseDetail from '@/components/courseLearn/CourseDetail';

export default function CourseLearnId() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [resources, setResources] = useState<ResourceInfo[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [resourceRatings, setResourceRatings] = useState<Record<number, number>>({});
  const [courseProgress, setCourseProgress] = useState<number | null>(null);
  const [courseLoading, setCourseLoading] = useState(false);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourcePage, setResourcePage] = useState(1);
  const [resourceTotal, setResourceTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const courseLoadingRef = useRef(false);
  const resourceLoadingRef = useRef(false);
  const courseRequestIdRef = useRef(0);
  const resourceRequestIdRef = useRef(0);
  const ratingRequestIdRef = useRef(0);
  const progressRequestIdRef = useRef(0);
  const userId = user?.userId;

  // 加载课程详情数据
  const loadCourse = useCallback(async () => {
    if (!courseId) return;
    if (courseLoadingRef.current) return;

    const currentRequestId = ++courseRequestIdRef.current;
    courseLoadingRef.current = true;

    queueMicrotask(() => {
      if (courseRequestIdRef.current !== currentRequestId) {
        courseLoadingRef.current = false;
        return;
      }
      setCourseLoading(true);
    });

    let result;
    try {
      result = await getCourse(Number(courseId));
    } catch (error) {
      console.error('Load course error:', error);
      if (courseRequestIdRef.current === currentRequestId) {
        setCourseLoading(false);
        courseLoadingRef.current = false;
        message.error('加载失败，请重试');
      }
      return;
    }

    if (courseRequestIdRef.current !== currentRequestId) return;

    setCourseLoading(false);
    courseLoadingRef.current = false;

    if (result.code !== 0 || !result.data) {
      message.error(result.message || '加载失败');
      return;
    }

    setCourse(result.data);
  }, [courseId]);

  // 计算资源平均评分
  const calculateResourceRatings = useCallback(async (resourceIds: number[]) => {
    const currentRequestId = ++ratingRequestIdRef.current;
    const commitResourceRatings = (value: Record<number, number>) => {
      if (ratingRequestIdRef.current === currentRequestId) {
        queueMicrotask(() => setResourceRatings(value));
      }
    };

    if (!resourceIds.length) {
      commitResourceRatings({});
      return { ratedRecords: [] as LearningRecordInfo[], requestId: currentRequestId };
    }

    let result;
    try {
      result = await getLearningRecordList({ page: 1, pageSize: 1000 });
    } catch (error) {
      console.error('Load ratings error:', error);
      commitResourceRatings({});
      return { ratedRecords: [] as LearningRecordInfo[], requestId: currentRequestId };
    }

    if (ratingRequestIdRef.current !== currentRequestId) {
      return { ratedRecords: [] as LearningRecordInfo[], requestId: currentRequestId };
    }

    if (result.code !== 0 || !result.data) {
      commitResourceRatings({});
      return { ratedRecords: [] as LearningRecordInfo[], requestId: currentRequestId };
    }

    const ratedRecords = (result.data.records || []).filter(
      (record: LearningRecordInfo) =>
        record.resourceId &&
        resourceIds.includes(Number(record.resourceId)) &&
        record.rating !== undefined &&
        record.rating !== null
    );

    if (!ratedRecords.length) {
      commitResourceRatings({});
      return { ratedRecords, requestId: currentRequestId };
    }

    // 按资源计算平均分
    const ratingBuckets: Record<number, { sum: number; count: number }> = {};
    ratedRecords.forEach((record: LearningRecordInfo) => {
      const rid = Number(record.resourceId);
      if (!ratingBuckets[rid]) ratingBuckets[rid] = { sum: 0, count: 0 };
      ratingBuckets[rid].sum += Number(record.rating);
      ratingBuckets[rid].count += 1;
    });

    const resourceRatingMap: Record<number, number> = {};
    Object.entries(ratingBuckets).forEach(([rid, { sum, count }]) => {
      resourceRatingMap[Number(rid)] = sum / count;
    });

    commitResourceRatings(resourceRatingMap);
    return { ratedRecords, requestId: currentRequestId };
  }, []);

  // 计算课程平均评分（基于资源评分结果）
  const calculateCourseRatings = useCallback(async (resourceIds: number[]) => {
    const { ratedRecords, requestId } = await calculateResourceRatings(resourceIds);
    const commitAverage = (value: number | null) => {
      if (ratingRequestIdRef.current === requestId) {
        queueMicrotask(() => setAverageRating(value));
      }
    };

    if (!ratedRecords.length) {
      commitAverage(null);
      return;
    }

    if (ratingRequestIdRef.current !== requestId) return;

    const totalRating = ratedRecords.reduce((sum, record) => sum + Number(record.rating), 0);
    commitAverage(totalRating / ratedRecords.length);
  },
    [calculateResourceRatings]
  );

  // 计算课程学习进度（仅当前用户）
  const calculateCourseProgress = useCallback(async (resourceIds: number[]) => {
    const currentRequestId = ++progressRequestIdRef.current;
    const commitProgress = (value: number | null) => {
      if (progressRequestIdRef.current === currentRequestId) {
        queueMicrotask(() => setCourseProgress(value));
      }
    };

    if (!userId || !resourceIds.length) {
      commitProgress(null);
      return;
    }

    let result;
    try {
      result = await getLearningRecordList({ studentId: userId, page: 1, pageSize: 1000 });
    } catch (error) {
      console.error('Load learning records error:', error);
      commitProgress(null);
      return;
    }

    if (progressRequestIdRef.current !== currentRequestId) return;

    if (result.code !== 0 || !result.data) {
      commitProgress(null);
      return;
    }

    const myRecords = (result.data.records || []).filter(
      (record: LearningRecordInfo) =>
        record.resourceId &&
        resourceIds.includes(Number(record.resourceId)) &&
        record.progress !== undefined &&
        record.progress !== null
    );

    if (!myRecords.length) {
      commitProgress(null);
      return;
    }

    const totalProgress = myRecords.reduce((sum, record) => sum + Number(record.progress || 0), 0);
    commitProgress(totalProgress / myRecords.length);
  },
    [userId]
  );

  // 加载课程资源列表数据
  const loadResources = useCallback(async () => {
    if (!courseId) return;
    if (resourceLoadingRef.current) return;

    const currentRequestId = ++resourceRequestIdRef.current;
    resourceLoadingRef.current = true;

    queueMicrotask(() => {
      if (resourceRequestIdRef.current !== currentRequestId) {
        resourceLoadingRef.current = false;
        return;
      }
      setResourceLoading(true);
    });

    let result;
    try {
      // 只获取状态为2（已发布）的资源
      result = await getResourceList({ courseId: Number(courseId), status: 2, page: resourcePage, pageSize });
    } catch (error) {
      console.error('Load resources error:', error);
      if (resourceRequestIdRef.current === currentRequestId) {
        setResourceLoading(false);
        resourceLoadingRef.current = false;
        message.error('加载失败，请重试');
      }
      return;
    }

    if (resourceRequestIdRef.current !== currentRequestId) return;

    setResourceLoading(false);
    resourceLoadingRef.current = false;

    if (result.code !== 0 || !result.data) {
      message.error(result.message || '加载失败');
      return;
    }

    setResources(result.data.records);
    setResourceTotal(result.data.total);
  }, [courseId, resourcePage, pageSize]);

  // 资源变化时计算课程评分
  useEffect(() => {
    const ids = resources.map((item) => item.resourceId).filter(Boolean) as number[];
    calculateCourseRatings(ids);
    calculateCourseProgress(ids);
  }, [resources, calculateCourseRatings, calculateCourseProgress]);

  useEffect(() => {
    const effectRequestId = courseRequestIdRef.current;
    queueMicrotask(() => {
      loadCourse();
    });
    return () => {
      courseRequestIdRef.current = effectRequestId + 1;
    };
  }, [loadCourse]);

  useEffect(() => {
    const effectRequestId = resourceRequestIdRef.current;
    queueMicrotask(() => {
      loadResources();
    });
    return () => {
      resourceRequestIdRef.current = effectRequestId + 1;
    };
  }, [loadResources]);

  // 处理资源点击，跳转到资源详情页
  const handleResourceClick = (resource: ResourceInfo) => {
    if (resource.resourceId && courseId) {
      navigate(`/courselearn/${courseId}/resource/${resource.resourceId}`);
    }
  };

  if (courseLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="shadow-sm">
            <p className="text-center text-[#6e6e73]">课程不存在</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/courselearn')} className="mb-4">返回课程列表</Button>
          <h1 className="text-lg font-semibold text-[#1d1d1f]">课程详情</h1>
        </div>

        <CourseDetail course={course} averageRating={averageRating} courseProgress={courseProgress} />

        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-[#1d1d1f]">资源列表</h2>
        </div>
        <Card className="shadow-sm">
          <ResourceList data={resources} loading={resourceLoading} page={resourcePage} pageSize={pageSize} total={resourceTotal} resourceRatings={resourceRatings} onPageChange={(p, s) => { setResourcePage(p); setPageSize(s); }} onItemClick={handleResourceClick} />
        </Card>
      </div>
    </div>
  );
}
