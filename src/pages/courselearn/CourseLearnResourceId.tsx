import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, Button, Spin, message, Tooltip } from 'antd';
import { ArrowLeftOutlined, GiftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { getResource, completeLearningRecord, reportLearningTime, updateLearningProgress, submitReview, getLearningRecordList, claimLearningReward, claimLearningRewardSign, getTokenRuleList, getTokenTransactionList } from '@/api/baseApi';
import type { ResourceInfo } from '@/types/resourceType';
import type { LearningRecordInfo } from '@/types/learningRecordType';
import ResourceDetail from '@/components/courseLearn/ResourceDetail';
import ResourcePlayer from '@/components/courseLearn/ResourcePlayer';
import LearningProgress from '@/components/courseLearn/LearningProgressCard';
import ReviewList from '@/components/courseLearn/ReviewList';
import { useAuthStore } from '@/stores/authStore';
import { ensureWalletConnected } from '@/utils/wallet';
import { downloadFile } from '@/utils/download';
import type { TypedDataDomain, TypedDataField } from 'ethers';

export default function CourseLearnResourceId() {
  const { resourceId, courseId } = useParams<{ resourceId: string; courseId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [resource, setResource] = useState<ResourceInfo | null>(null);
  const [learningRecord, setLearningRecord] = useState<LearningRecordInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [learningRecordLoading, setLearningRecordLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewListRefreshKey, setReviewListRefreshKey] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsPageSize, setReviewsPageSize] = useState(10);
  const [allReviews, setAllReviews] = useState<LearningRecordInfo[]>([]);
  const [claimingLearningReward, setClaimingLearningReward] = useState(false);
  const [hasClaimedLearningReward, setHasClaimedLearningReward] = useState(false);
  const [checkingRewardStatus, setCheckingRewardStatus] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);
  const reportTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastReportedTimeRef = useRef<number>(0);
  const watchedUntilRef = useRef<number>(0);
  const mediaDurationRef = useRef<number>(0);
  const currentMediaTimeRef = useRef<number>(0);

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

    if (result.code !== 0 || !result.data) {
      return;
    }

    const allRecords = result.data.records;

    // 分离数据：①当前用户的学习记录
    if (!user?.userId) {
      setLearningRecord(null);
    } else {
      const userRecord = allRecords.find((record) => record.studentId === user.userId) || null;
      setLearningRecord(userRecord);

      const hasLearningTime = userRecord && typeof userRecord.learningTime === 'number';
      if (hasLearningTime) {
        const safeLearningTime = Math.max(0, userRecord.learningTime || 0);
        watchedUntilRef.current = safeLearningTime;
        lastReportedTimeRef.current = safeLearningTime;
      }
    }

    // 分离数据：②所有人的评价列表（过滤出有评价且可见的记录）
    const filteredReviews = allRecords.filter((record) => record.review && record.isVisible === 1);
    setAllReviews(filteredReviews);
    setReviewsTotal(filteredReviews.length);

    // 重置到第一页（当前页数据由 useMemo 派生，不在 effect 内 setState）
    setReviewsPage(1);
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

  // 查询是否已领取学习奖励
  const checkLearningRewardStatus = useCallback(async () => {
    if (!resourceId || !user?.userId) return;

    setCheckingRewardStatus(true);
    let result;
    try {
      // 查询该资源的学习奖励记录（transactionType=0 表示奖励，relatedId=resourceId）
      // 不要求 rewardType，因为历史数据可能为 NULL
      result = await getTokenTransactionList({
        transactionType: 0,
        relatedId: Number(resourceId),
        page: 1,
        pageSize: 1,
      });
    } catch (error) {
      console.error('Check learning reward status error:', error);
      setCheckingRewardStatus(false);
      return;
    }

    setCheckingRewardStatus(false);

    // 后端已经按 userId 过滤，所以如果查询到记录，说明当前用户已经领取过
    if (result.code === 0 && result.data && result.data.records.length > 0) {
      const transaction = result.data.records[0];
      // 额外检查：确保 userId 匹配（虽然后端已过滤，但这里再确认一下）
      if (transaction.userId === user.userId) {
        setHasClaimedLearningReward(true);
      }
    }
  }, [resourceId, user]);

  useEffect(() => {
    if (!resource || !user) return;
    queueMicrotask(() => {
      checkLearningRewardStatus();
    });
  }, [resource, user, checkLearningRewardStatus]);

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
    if (downloading) return;

    const resourceType = resource.resourceType || 0;
    // 非文档（1）或其他（0）类型，直接跳过「完成学习」逻辑
    if (resourceType !== 0 && resourceType !== 1) {
      // 继续执行后续下载逻辑
    } else {
      let result;
      try {
        result = await completeLearningRecord(Number(resourceId));
      } catch (error) {
        console.error('Complete learning record error:', error);
        message.error('更新学习记录失败，请重试');
        return;
      }

      if (result.code !== 0 || !result.data) {
        message.error(result.message || '更新学习记录失败');
        return;
      }

      setLearningRecord(result.data);
      message.success('学习记录已更新');
    }

    // 直接下载文件（避免跳转到 IPFS 预览页）
    const fileUrl = getResourceFileUrl(resource.ipfsHash);
    if (!fileUrl) return;

    // 顶部提示：正在下载
    const downloadMsgKey = 'resource-download';
    message.loading({ content: '准备下载...', key: downloadMsgKey, duration: 0 });

    setDownloading(true);
    const filename = resource.title || `resource-${resourceId}`;
    let result: Awaited<ReturnType<typeof downloadFile>> | undefined;
    try {
      result = await downloadFile(fileUrl, { filename });
    } catch (error) {
      console.error('Download resource error:', error);
      message.error('下载失败，请稍后重试');
      message.destroy(downloadMsgKey);
    } finally {
      setDownloading(false);
    }
    if (!result) return;
    if (result.method === 'browser') {
      message.info({
        content: '已尝试使用浏览器直接下载（若仍打开预览页，说明网关未开启附件下载）',
        key: downloadMsgKey,
      });
    } else {
      message.success({ content: '开始下载', key: downloadMsgKey });
    }
  };

  // 处理视频/音频播放时间更新
  const handleTimeUpdate = useCallback((currentTime: number, duration: number) => {
    mediaDurationRef.current = duration;
    currentMediaTimeRef.current = currentTime;
  }, []);

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

  // 定期上报学习时间并同步学习进度（10-15秒周期）
  useEffect(() => {
    if (!resource || !resourceId) return;
    // 学习记录还在加载时，不启动定时器，避免在不知道历史学习时长的情况下就开始累计
    if (learningRecordLoading) return;

    const resourceType = resource.resourceType || 0;
    // 只有视频（3）和音频（2）需要上报时间
    if (resourceType !== 2 && resourceType !== 3) return;

    // 每12秒检查一次，如果播放时间有增加，则上报，并根据当前播放进度更新进度字段
    reportTimeIntervalRef.current = setInterval(() => {
      const currentTime = currentMediaTimeRef.current;
      const watchedUntil = watchedUntilRef.current;

      // 如果当前播放位置还在「已经累计过的时间」以内，说明是在回看，不累计学习时长
      if (currentTime <= watchedUntil + 0.1) {
        lastReportedTimeRef.current = currentTime;
        return;
      }

      // 只对「超过 watchedUntil 之后」的新区域计时
      const baseTime = Math.max(lastReportedTimeRef.current, watchedUntil);
      const timeIncrement = currentTime - baseTime;

      // 如果 timeIncrement <= 0，说明处于暂停或刚拖动到更早的位置，重置基准时间后跳过本次
      if (timeIncrement <= 0) {
        lastReportedTimeRef.current = currentTime;
        return;
      }

      // 如果 timeIncrement 过大（>20），通常是用户拖动进度条到更后面的位置
      // 这部分不计入连续学习时长，但需要重置基准时间，避免之后一直无法上报
      if (timeIncrement > 20) {
        lastReportedTimeRef.current = currentTime;
        return;
      }

      // 上报有效的学习时间增量（5-20秒范围内）
      if (timeIncrement >= 5 && timeIncrement <= 20) {
        // 1）先上报学习时长
        reportTimeIncrement(timeIncrement);
      }
    }, 12000);

    return () => {
      if (reportTimeIntervalRef.current) {
        clearInterval(reportTimeIntervalRef.current);
      }
    };
  }, [resource, resourceId, reportTimeIncrement, learningRecordLoading]);

  // 根据累计学习时长同步学习进度（防止快进导致进度突然跳到 80%）
  useEffect(() => {
    if (!resource || !resourceId) return;
    const resourceType = resource.resourceType || 0;
    // 只有视频（3）和音频（2）需要进度同步
    if (resourceType !== 2 && resourceType !== 3) return;

    if (!learningRecord || !learningRecord.learningTime) return;

    const duration = mediaDurationRef.current;
    if (!duration || duration <= 0) return;

    // 根据数据库里已有的累计学习时长，初始化「已经有效观看到的最远时间」
    const watchedUntil = Math.min(learningRecord.learningTime, duration);
    watchedUntilRef.current = watchedUntil;
    // 同时把上次上报基准时间对齐到该位置，避免重新从 0 开始累计
    if (lastReportedTimeRef.current < watchedUntil) {
      lastReportedTimeRef.current = watchedUntil;
    }

    // 使用「累计有效学习时长 / 总时长」计算进度，避免拖动进度条直接跳到 80%
    const targetProgress = Math.min(
      100,
      Math.round((learningRecord.learningTime / duration) * 100)
    );

    const currentProgress = learningRecord.progress ?? 0;
    // 差异太小时不更新，避免频繁请求
    if (Math.abs(targetProgress - currentProgress) < 1) {
      return;
    }

    (async () => {
      let result;
      try {
        result = await updateLearningProgress(Number(resourceId), targetProgress);
      } catch (error) {
        console.error('Update learning progress error:', error);
        return;
      }

      if (result.code === 0 && result.data) {
        setLearningRecord(result.data);
      }
    })();
  }, [resource, resourceId, learningRecord, learningRecord?.learningTime]);

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
      navigate(`/courseLearn/${courseId}`);
    } else {
      navigate(-1);
    }
  };

  // 领取学习完成奖励
  const handleClaimLearningReward = async () => {
    if (!resourceId || !resource) {
      message.error('资源信息不存在');
      return;
    }

    // 检查是否已完成学习
    if (!learningRecord || learningRecord.isCompleted !== 1) {
      message.warning('请先完成学习才能领取奖励');
      return;
    }

    // 获取代币规则
    let ruleResult;
    try {
      ruleResult = await getTokenRuleList({ rewardType: 0, isEnabled: 1, page: 1, pageSize: 1 });
    } catch (error) {
      console.error('Get token rule error:', error);
      message.error('获取奖励规则失败，请重试');
      return;
    }

    if (ruleResult.code !== 0 || !ruleResult.data || ruleResult.data.records.length === 0) {
      message.warning('未找到可用的奖励规则');
      return;
    }

    const rule = ruleResult.data.records[0];
    const rewardAmount = String(rule.rewardAmount || 0);

    if (Number(rewardAmount) <= 0) {
      message.warning('奖励数量为0，无法领取');
      return;
    }

    // 连接钱包（用于签名弹窗）
    const wallet = await ensureWalletConnected();
    if (!wallet) return;

    setClaimingLearningReward(true);
    message.loading({ content: '正在领取奖励...', key: 'claim', duration: 0 });

    // 1) 获取当前网络信息
    let network;
    try {
      network = await wallet.provider.getNetwork();
    } catch (error) {
      console.error('Get network error:', error);
      message.destroy('claim');
      setClaimingLearningReward(false);
      message.error('获取网络信息失败，请重试');
      return;
    }

    // 2) 向后端获取 EIP-712 sign（domain/types/message）
    let signResult;
    try {
      signResult = await claimLearningRewardSign({
        resourceId: Number(resourceId),
        rewardType: 0,
        walletAddress: wallet.address,
        chainId: Number(network.chainId),
      });
    } catch (error) {
      console.error('Get claim challenge error:', error);
      message.destroy('claim');
      setClaimingLearningReward(false);
      message.error('获取签名挑战失败，请重试');
      return;
    }

    if (signResult.code !== 0 || !signResult.data) {
      message.destroy('claim');
      setClaimingLearningReward(false);
      message.error(signResult.message || '获取签名挑战失败');
      return;
    }

    // 3) 弹出 MetaMask 进行 EIP-712 签名（用户确认）
    const { domain, types, message: typedMessage } = signResult.data as {
      domain: TypedDataDomain;
      types: Record<string, TypedDataField[]>;
      message: { userId: number; walletAddress: string; resourceId: number; rewardType: number; amount: string; nonce: string; deadline: number };
    };
    let signature: string;
    try {
      signature = await wallet.signer.signTypedData(domain, types, typedMessage);
    } catch (error) {
      console.error('Sign typed data error:', error);
      message.destroy('claim');
      setClaimingLearningReward(false);
      message.error('签名失败或已取消');
      return;
    }

    // 4) 提交签名给后端，后端验签通过后再使用管理员私钥代为 mint
    let result;
    try {
      result = await claimLearningReward({
        resourceId: Number(resourceId),
        rewardType: 0, // 学习完成
        walletAddress: wallet.address,
        signature,
      });
    } catch (error) {
      console.error('Claim reward error:', error);
      message.destroy('claim');
      setClaimingLearningReward(false);
      message.error('记录交易失败，请重试');
      return;
    }

    message.destroy('claim');
    setClaimingLearningReward(false);

    if (result.code !== 0) {
      message.error(result.message || '领取奖励失败');
      return;
    }

    // 如果后端返回了最新的用户信息，则更新全局用户状态，及时刷新 Header 中的代币余额
    if (result.data && result.data.user) {
      setAuth(accessToken, result.data.user);
    }

    message.success(`成功领取 ${rewardAmount} ${rule.tokenName} 代币奖励`);
    setHasClaimedLearningReward(true);
    loadLearningData();
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
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
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
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-sm mb-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button icon={<ArrowLeftOutlined />} type="text" shape="circle" onClick={handleBack} aria-label="返回资源列表" />
              <h1 className="text-lg font-semibold text-[#1d1d1f]">资源学习</h1>
            </div>
            {user && (
              <div className="flex gap-3">
                <Tooltip title={hasClaimedLearningReward ? '您已领取过代币奖励！' : (!learningRecord || learningRecord.isCompleted !== 1 ? '请先完成该资源学习！' : '')}>
                  <span>
                    <Button type="primary" icon={<GiftOutlined />} loading={claimingLearningReward || checkingRewardStatus} onClick={handleClaimLearningReward} className="rounded-lg" disabled={!learningRecord || learningRecord.isCompleted !== 1 || hasClaimedLearningReward}>
                      领取学习奖励
                    </Button>
                  </span>
                </Tooltip>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <ResourceDetail resource={resource} onDownload={!isMediaType ? handleDownload : undefined} hidePreview={resourceType === 1} />
              {/* 文档类型的预览下移到全宽区域 */}
            </div>

            <div className="lg:col-span-1">
              <LearningProgress learningRecord={learningRecord} loading={learningRecordLoading} submitting={submittingReview} onSubmitReview={handleSubmitReview} />
            </div>
          </div>

          {/* 统一的资源播放/预览区域：文档 / 音频 / 视频 */}
          {fileUrl && (resourceType === 1 || isMediaType) && (
            <ResourcePlayer resource={resource} fileUrl={fileUrl} onDownload={!isMediaType ? handleDownload : undefined} onTimeUpdate={isMediaType ? handleTimeUpdate : undefined} onComplete={isMediaType ? handleMediaComplete : undefined} />
          )}

          {resourceId && (
            <ReviewList reviews={pagedReviews} loading={reviewsLoading} total={reviewsTotal} page={reviewsPage} pageSize={reviewsPageSize} onPageChange={handleReviewsPageChange} />
          )}
        </div>
      </div>
    </div>
  );
}
