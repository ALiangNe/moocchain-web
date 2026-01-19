import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, Button, Spin, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { getResource, completeLearningRecord, reportLearningTime, updateLearningProgress, submitReview, getLearningRecordList } from '@/api/baseApi';
import type { ResourceInfo } from '@/types/resourceType';
import type { LearningRecordInfo } from '@/types/learningRecordType';
import ResourceDetail from '@/components/courseLearn/ResourceDetail';
import ResourcePlayer from '@/components/courseLearn/ResourcePlayer';
import LearningProgress from '@/components/courseLearn/LearningProgressCard';
import ReviewList from '@/components/courseLearn/ReviewList';
import { useAuthStore } from '@/stores/authStore';

export default function CourseLearnResourceId() {
  const { resourceId, courseId } = useParams<{ resourceId: string; courseId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [resource, setResource] = useState<ResourceInfo | null>(null);
  const [learningRecord, setLearningRecord] = useState<LearningRecordInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [learningRecordLoading, setLearningRecordLoading] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewListRefreshKey, setReviewListRefreshKey] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsPageSize, setReviewsPageSize] = useState(10);
  const [allReviews, setAllReviews] = useState<LearningRecordInfo[]>([]); // 存储所有评价，用于分页
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);
  const reportTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastReportedTimeRef = useRef<number>(0);
  const mediaDurationRef = useRef<number>(0);
  const currentMediaTimeRef = useRef<number>(0);
  const progressUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 加载学习记录和评价列表（合并为一次 API 调用）
  const loadLearningData = useCallback(async () => {
    if (!resourceId) return;

    setLearningRecordLoading(true);
    setReviewsLoading(true);

    let result;
    try {
      // 一次调用获取该资源的所有学习记录（包括当前用户和其他用户的）
      // 不传 studentId 参数即可获取所有记录
      result = await getLearningRecordList({ resourceId: Number(resourceId), page: 1, pageSize: 1000 });
    } catch (error) {
      console.error('Load learning data error:', error);
      setLearningRecordLoading(false);
      setReviewsLoading(false);
      return;
    }

    setLearningRecordLoading(false);
    setReviewsLoading(false);

    if (result.code === 0 && result.data) {
      const allRecords = result.data.records;

      // 分离数据：①当前用户的学习记录
      if (user?.userId) {
        const userRecord = allRecords.find((record) => record.studentId === user.userId);
        setLearningRecord(userRecord || null);
      } else {
        setLearningRecord(null);
      }

      // 分离数据：②所有人的评价列表（过滤出有评价且可见的记录）
      const filteredReviews = allRecords.filter((record) => record.review && record.isVisible === 1);
      setAllReviews(filteredReviews);
      setReviewsTotal(filteredReviews.length);

      // 重置到第一页（当前页数据由 useMemo 派生，不在 effect 内 setState）
      setReviewsPage(1);
    }
  }, [resourceId, user]);

  const pagedReviews = useMemo(() => {
    if (allReviews.length === 0) return [];
    const startIndex = (reviewsPage - 1) * reviewsPageSize;
    const endIndex = startIndex + reviewsPageSize;
    return allReviews.slice(startIndex, endIndex);
  }, [allReviews, reviewsPage, reviewsPageSize]);

  // 加载资源详情数据
  const loadResource = useCallback(async () => {
    if (!resourceId) return;
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
      result = await getResource(Number(resourceId));
    } catch (error) {
      console.error('Load resource error:', error);
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

    // 检查资源状态，只有已发布（status=2）的资源才能被学生访问
    if (result.data.status !== 2) {
      message.error('该资源尚未发布，无法访问');
      navigate(-1);
      return;
    }

    setResource(result.data);
  }, [resourceId, navigate]);


  useEffect(() => {
    const effectRequestId = requestIdRef.current;
    queueMicrotask(() => {
      loadResource();
    });
    return () => {
      requestIdRef.current = effectRequestId + 1;
    };
  }, [loadResource]);

  useEffect(() => {
    if (!resource) return;
    queueMicrotask(() => {
      loadLearningData();
    });
  }, [resource, loadLearningData]);

  // 评价提交后刷新数据
  useEffect(() => {
    if (reviewListRefreshKey === 0) return; // 初始加载时不触发
    queueMicrotask(() => {
      loadLearningData();
    });
  }, [reviewListRefreshKey, loadLearningData]);

  const handleReviewsPageChange = (page: number, pageSize: number) => {
    setReviewsPage(page);
    if (pageSize !== reviewsPageSize) {
      setReviewsPageSize(pageSize);
    }
  };

  // 获取资源文件下载地址
  const getResourceFileUrl = (ipfsHash?: string) => {
    if (!ipfsHash) return undefined;
    if (ipfsHash.startsWith('http')) return ipfsHash;
    if (!ipfsHash.startsWith('/') && (ipfsHash.startsWith('Qm') || ipfsHash.startsWith('b') || ipfsHash.length > 30)) {
      const gatewayUrl = import.meta.env.VITE_IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';
      return `${gatewayUrl}${ipfsHash}`;
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL.split('/api')[0];
    return `${baseUrl}${ipfsHash}`;
  };

  // 处理文档/图片下载（直接完成学习）
  const handleDownload = async () => {
    if (!resource || !resourceId) return;

    const resourceType = resource.resourceType || 0;
    // 文档（1）或其他（0）类型，下载时完成学习
    if (resourceType === 0 || resourceType === 1) {
      let result;
      try {
        result = await completeLearningRecord(Number(resourceId));
      } catch (error) {
        console.error('Complete learning record error:', error);
        message.error('更新学习记录失败，请重试');
        return;
      }

      if (result.code === 0 && result.data) {
        setLearningRecord(result.data);
        message.success('学习记录已更新');
      } else {
        message.error(result.message || '更新学习记录失败');
      }
    }

    // 打开文件
    const fileUrl = getResourceFileUrl(resource.ipfsHash);
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  // 更新学习进度（视频/音频）- 使用防抖，避免频繁更新
  const handleProgressUpdate = useCallback((currentTime: number, duration: number) => {
    if (!resourceId || duration === 0) return;

    // 清除之前的定时器
    if (progressUpdateTimerRef.current) {
      clearTimeout(progressUpdateTimerRef.current);
    }

    // 防抖：3秒后更新进度
    progressUpdateTimerRef.current = setTimeout(async () => {
      const progress = Math.min(100, Math.round((currentTime / duration) * 100));

      // 只有当进度有显著变化时才更新（避免频繁请求）
      if (learningRecord && Math.abs((learningRecord.progress || 0) - progress) < 5) {
        return;
      }

      let result;
      try {
        result = await updateLearningProgress(Number(resourceId), progress);
      } catch (error) {
        console.error('Update learning progress error:', error);
        return;
      }

      if (result.code === 0 && result.data) {
        setLearningRecord(result.data);
      }
    }, 3000);
  }, [resourceId, learningRecord]);

  // 处理视频/音频播放时间更新
  const handleTimeUpdate = useCallback((currentTime: number, duration: number) => {
    mediaDurationRef.current = duration;
    currentMediaTimeRef.current = currentTime;
    // 同时更新进度
    handleProgressUpdate(currentTime, duration);
  }, [handleProgressUpdate]);

  // 上报学习时间增量（视频/音频）
  const reportTimeIncrement = useCallback(async (timeIncrement: number) => {
    if (!resourceId || timeIncrement < 5 || timeIncrement > 20) return;

    let result;
    try {
      result = await reportLearningTime(Number(resourceId), timeIncrement);
    } catch (error) {
      console.error('Report learning time error:', error);
      return;
    }

    if (result.code === 0 && result.data) {
      setLearningRecord(result.data);
      lastReportedTimeRef.current = currentMediaTimeRef.current;
    }
  }, [resourceId]);

  // 定期上报学习时间（10-15秒周期）
  useEffect(() => {
    if (!resource || !resourceId) return;
    const resourceType = resource.resourceType || 0;
    // 只有视频（3）和音频（2）需要上报时间
    if (resourceType !== 2 && resourceType !== 3) return;

    // 初始化上次上报时间
    if (learningRecord?.learningTime) {
      lastReportedTimeRef.current = learningRecord.learningTime;
    }

    // 每12秒检查一次，如果播放时间有增加，则上报
    reportTimeIntervalRef.current = setInterval(() => {
      const currentTime = currentMediaTimeRef.current;
      const timeIncrement = currentTime - lastReportedTimeRef.current;

      // 上报有效的学习时间增量（5-20秒范围内）
      if (timeIncrement >= 5 && timeIncrement <= 20) {
        reportTimeIncrement(timeIncrement);
      }
    }, 12000);

    return () => {
      if (reportTimeIntervalRef.current) {
        clearInterval(reportTimeIntervalRef.current);
      }
    };
  }, [resource, resourceId, learningRecord, reportTimeIncrement]);

  // 处理视频/音频播放完成
  const handleMediaComplete = useCallback(async () => {
    if (!resourceId || !mediaDurationRef.current) return;

    let result;
    try {
      result = await updateLearningProgress(Number(resourceId), 100);
    } catch (error) {
      console.error('Complete learning error:', error);
      return;
    }

    if (result.code === 0 && result.data) {
      setLearningRecord(result.data);
      message.success('恭喜！您已完成学习');
    }
  }, [resourceId]);

  // 处理评价提交
  const handleSubmitReview = async (review: string, rating: number) => {
    if (!resourceId) return;

    if (!review.trim()) {
      message.warning('请输入评价内容');
      return;
    }
    if (rating === 0) {
      message.warning('请选择评分');
      return;
    }

    setSubmittingReview(true);
    let result;
    try {
      result = await submitReview(Number(resourceId), review, rating);
    } catch (error) {
      console.error('Submit review error:', error);
      message.error('评价提交失败，请重试');
      setSubmittingReview(false);
      return;
    }

    setSubmittingReview(false);

    if (result.code === 0 && result.data) {
      setLearningRecord(result.data);
      setReviewListRefreshKey((prev) => prev + 1);
      message.success('评价提交成功');
    } else {
      message.error(result.message || '提交评价失败');
    }
  };

  // 处理返回按钮点击
  const handleBack = () => {
    if (courseId) {
      navigate(`/courselearn/${courseId}`);
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="shadow-sm">
            <p className="text-center text-[#6e6e73]">资源不存在</p>
          </Card>
        </div>
      </div>
    );
  }

  const fileUrl = getResourceFileUrl(resource.ipfsHash);
  const resourceType = resource.resourceType || 0;
  const isMediaType = resourceType === 2 || resourceType === 3; // 音频或视频

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack} className="mb-4">返回资源列表</Button>
          <h1 className="text-lg font-semibold text-[#1d1d1f]">资源学习</h1>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <ResourceDetail resource={resource} onDownload={!isMediaType ? handleDownload : undefined} />
            </div>

            <div className="lg:col-span-1">
              <LearningProgress learningRecord={learningRecord} loading={learningRecordLoading} submitting={submittingReview} onSubmitReview={handleSubmitReview} />
            </div>
          </div>

          {fileUrl && isMediaType && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#1d1d1f]">资源播放</h2>
              </div>
              <ResourcePlayer resource={resource} fileUrl={fileUrl} onTimeUpdate={handleTimeUpdate} onComplete={handleMediaComplete} />
            </div>
          )}

          {resourceId && (
            <ReviewList reviews={pagedReviews} loading={reviewsLoading} total={reviewsTotal} page={reviewsPage} pageSize={reviewsPageSize} onPageChange={handleReviewsPageChange} />
          )}
        </div>
      </div>
    </div>
  );
}
