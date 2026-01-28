import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, message, Spin, Tooltip, Modal } from 'antd';
import { ArrowLeftOutlined, TrophyOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourse, getResourceList, getLearningRecordList, createCertificate, updateCertificateNft, getCertificateList, getResourceCertificateConfigList, getTokenTransactionList, buyResource } from '@/api/baseApi';
import type { CourseInfo } from '@/types/courseType';
import type { ResourceInfo } from '@/types/resourceType';
import type { LearningRecordInfo } from '@/types/learningRecordType';
import type { CertificateInfo } from '@/types/certificateType';
import { useAuthStore } from '@/stores/authStore';
import ResourceList from '@/components/courseLearn/ResourceList';
import CourseDetail from '@/components/courseLearn/CourseDetail';
import { ensureWalletConnected } from '@/utils/wallet';
import { mintCertificateNft } from '@/utils/certificateNft';
import { getPlatformWalletAddress, transferMOOCToken } from '@/utils/moocToken';
import { MOOC_TOKEN_ADDRESS } from '@/contracts/contractAddresses';

export default function CourseLearnId() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, accessToken, setAuth } = useAuthStore();
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [resources, setResources] = useState<ResourceInfo[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [resourceRatings, setResourceRatings] = useState<Record<number, number>>({});
  const [courseProgress, setCourseProgress] = useState<number | null>(null);
  const [courseLoading, setCourseLoading] = useState(false);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [claimingCertificate, setClaimingCertificate] = useState(false);
  const [hasClaimedCertificate, setHasClaimedCertificate] = useState(false);
  const [checkingCertificateStatus, setCheckingCertificateStatus] = useState(false);
  const [hasCertificateConfig, setHasCertificateConfig] = useState<boolean | null>(null);
  const [checkingCertificateConfig, setCheckingCertificateConfig] = useState(false);
  const [resourcePage, setResourcePage] = useState(1);
  const [resourceTotal, setResourceTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [purchasedResourceIds, setPurchasedResourceIds] = useState<Set<number>>(new Set());
  const courseLoadingRef = useRef(false);
  const resourceLoadingRef = useRef(false);
  const purchasedResourcesLoadingRef = useRef(false);
  const certificateConfigLoadingRef = useRef(false);
  const certificateStatusLoadingRef = useRef(false);
  const courseRequestIdRef = useRef(0);
  const resourceRequestIdRef = useRef(0);
  const purchasedResourcesRequestIdRef = useRef(0);
  const certificateConfigRequestIdRef = useRef(0);
  const certificateStatusRequestIdRef = useRef(0);
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

  // 查询课程证书配置（resourceCertificateConfig）：isEnabled=1 + courseId（并确保 templateId 存在）
  const checkCertificateConfig = useCallback(async () => {
    if (!courseId) return;
    if (certificateConfigLoadingRef.current) return;

    const currentRequestId = ++certificateConfigRequestIdRef.current;
    certificateConfigLoadingRef.current = true;

    queueMicrotask(() => setCheckingCertificateConfig(true));

    let result;
    try {
      result = await getResourceCertificateConfigList({ courseId: Number(courseId), isEnabled: 1, page: 1, pageSize: 1 });
    } catch (error) {
      console.error('Check course certificate config error:', error);
      if (certificateConfigRequestIdRef.current === currentRequestId) {
        certificateConfigLoadingRef.current = false;
        queueMicrotask(() => {
      setCheckingCertificateConfig(false);
      setHasCertificateConfig(null);
        });
      }
      return;
    }

    if (certificateConfigRequestIdRef.current !== currentRequestId) return;

    certificateConfigLoadingRef.current = false;
    queueMicrotask(() => setCheckingCertificateConfig(false));

    const config = result.code === 0 && result.data && result.data.records && result.data.records.length > 0 ? result.data.records[0] : null;
    queueMicrotask(() => setHasCertificateConfig(!!(config && config.templateId)));
  }, [courseId]);

  // 查询是否已领取课程证书（根据 studentId + teacherId + courseId）
  const checkCertificateStatus = useCallback(async () => {
    if (!courseId || !userId || !course) return;

    const teacherId = course.teacherId || course.teacher?.userId;
    if (!teacherId) return;
    if (certificateStatusLoadingRef.current) return;

    const currentRequestId = ++certificateStatusRequestIdRef.current;
    certificateStatusLoadingRef.current = true;

    queueMicrotask(() => setCheckingCertificateStatus(true));

    let result;
    try {
      result = await getCertificateList({
        studentId: userId,
        teacherId,
        courseId: Number(courseId),
        page: 1,
        pageSize: 1,
      });
    } catch (error) {
      console.error('Check course certificate status error:', error);
      if (certificateStatusRequestIdRef.current === currentRequestId) {
        certificateStatusLoadingRef.current = false;
        queueMicrotask(() => setCheckingCertificateStatus(false));
      }
      return;
    }

    if (certificateStatusRequestIdRef.current !== currentRequestId) return;

    certificateStatusLoadingRef.current = false;
    queueMicrotask(() => setCheckingCertificateStatus(false));

    if (result.code === 0 && result.data && result.data.records && result.data.records.length > 0) {
      queueMicrotask(() => setHasClaimedCertificate(true));
    } else {
      queueMicrotask(() => setHasClaimedCertificate(false));
    }
  }, [courseId, userId, course]);

  // 加载已购买的资源ID列表
  const loadPurchasedResources = useCallback(async () => {
    if (!userId) {
      queueMicrotask(() => setPurchasedResourceIds(new Set()));
      return;
    }
    if (purchasedResourcesLoadingRef.current) return;

    const currentRequestId = ++purchasedResourcesRequestIdRef.current;
    purchasedResourcesLoadingRef.current = true;

    let result;
    try {
      result = await getTokenTransactionList({
        transactionType: 1, // 消费
        consumeType: 0, // 购买资源
        page: 1,
        pageSize: 1000,
      });
    } catch (error) {
      console.error('Load purchased resources error:', error);
      if (purchasedResourcesRequestIdRef.current === currentRequestId) {
        purchasedResourcesLoadingRef.current = false;
        queueMicrotask(() => setPurchasedResourceIds(new Set()));
      }
      return;
    }

    if (purchasedResourcesRequestIdRef.current !== currentRequestId) return;

    purchasedResourcesLoadingRef.current = false;

    if (result.code !== 0 || !result.data) {
      queueMicrotask(() => setPurchasedResourceIds(new Set()));
      return;
    }

    const purchasedIds = new Set<number>();
    result.data.records.forEach((transaction) => {
      if (transaction.relatedId) {
        purchasedIds.add(transaction.relatedId);
      }
    });
    queueMicrotask(() => setPurchasedResourceIds(purchasedIds));
  }, [userId]);

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

  useEffect(() => {
    const effectRequestId = purchasedResourcesRequestIdRef.current;
    queueMicrotask(() => {
      loadPurchasedResources();
    });
    return () => {
      purchasedResourcesRequestIdRef.current = effectRequestId + 1;
    };
  }, [loadPurchasedResources]);

  // 课程详情加载完成后，检查教师是否已配置课程证书
  useEffect(() => {
    if (!course) return;
    const effectRequestId = certificateConfigRequestIdRef.current;
    queueMicrotask(() => {
      checkCertificateConfig();
    });
    return () => {
      certificateConfigRequestIdRef.current = effectRequestId + 1;
    };
  }, [course, checkCertificateConfig]);

  // 课程详情和用户信息就绪后，查询是否已领取课程证书
  useEffect(() => {
    if (!course || !userId) return;
    const effectRequestId = certificateStatusRequestIdRef.current;
    queueMicrotask(() => {
      checkCertificateStatus();
    });
    return () => {
      certificateStatusRequestIdRef.current = effectRequestId + 1;
    };
  }, [course, userId, checkCertificateStatus]);

  // 处理领取证书
  const handleClaimCertificate = async () => {
    if (!courseId) return;

    // 证书配置未启用/不存在：直接提示
    if (hasCertificateConfig === false) {
      message.warning('教师未配置课程证书，请稍后领取！');
      return;
    }

    setClaimingCertificate(true);

    // 第一步：调用后端创建证书，生成图片并上传 IPFS
    let createResp;
    try {
      createResp = await createCertificate({ courseId: Number(courseId) });
    } catch (error) {
      console.error('Claim certificate error:', error);
      message.error('证书领取失败，请稍后重试');
      setClaimingCertificate(false);
      return;
    }

    if (createResp.code !== 0 || !createResp.data) {
      message.error(createResp.message || '证书领取失败');
      setClaimingCertificate(false);
      return;
    }

    const certificate = createResp.data as CertificateInfo;

    if (!certificate.certificateId || !certificate.ipfsHash) {
      message.warning('证书已创建，但缺少链上铸造所需信息');
      setClaimingCertificate(false);
      loadCourse();
      setTimeout(() => navigate('/courseCertificate'), 2000);
      return;
    }

    // 第二步：连接钱包并铸造证书 NFT
    const wallet = await ensureWalletConnected();
    if (!wallet) {
      setClaimingCertificate(false);
      return;
    }

    const createdAt = Math.floor(Date.now() / 1000);

    let mintResult;
    try {
      mintResult = await mintCertificateNft({ signer: wallet.signer, ownerAddress: wallet.address, ipfsHash: certificate.ipfsHash, createdAt });
    } catch (error) {
      console.error('Mint certificate nft error:', error);
      setClaimingCertificate(false);
      message.error(error instanceof Error ? error.message : '证书NFT铸造失败，请稍后重试');
      return;
    }

    // 第三步：调用后端更新证书的链上信息
    let updateResp;
    try {
      updateResp = await updateCertificateNft(certificate.certificateId, {
        certificateNftId: mintResult.tokenId,
        transactionHash: mintResult.transactionHash,
      });
    } catch (error) {
      console.error('Update certificate nft info error:', error);
      setClaimingCertificate(false);
      message.error('证书NFT铸造成功，但写入链上信息失败，请稍后在证书页面重试');
      return;
    }

    if (updateResp.code !== 0) {
      message.error(updateResp.message || '证书NFT铸造成功，但写入链上信息失败');
      setClaimingCertificate(false);
      return;
    }

    setClaimingCertificate(false);
    message.success(`证书领取成功，NFT TokenId: ${mintResult.tokenId}`);
    setHasClaimedCertificate(true);
    loadCourse();
    setTimeout(() => navigate('/courseCertificate'), 2000);
    setTimeout(() => navigate('/courseCertificate'), 2000);
  };

  // 处理资源点击，跳转到资源详情页
  const handleResourceClick = (resource: ResourceInfo) => {
    const isPaid = resource.price && Number(resource.price) > 0;
    const isPurchased = resource.resourceId && purchasedResourceIds.has(resource.resourceId);
    
    if (isPaid && !isPurchased) {
      Modal.warning({
        title: '付费资源',
        content: '该资源为付费资源，请先购买后再学习',
      });
      return;
    }
    
    if (resource.resourceId && courseId) {
      navigate(`/courseLearn/${courseId}/resource/${resource.resourceId}`);
    }
  };

  // 处理购买资源
  const handlePurchaseResource = async (resource: ResourceInfo) => {
    if (!resource.resourceId || !resource.price) {
      message.error('资源信息不完整');
      return;
    }

    const price = Number(resource.price);
    if (price <= 0) {
      message.error('资源价格无效');
      return;
    }

    message.loading({ content: '正在购买资源...', key: 'purchase', duration: 0 });

    // 连接钱包
    const wallet = await ensureWalletConnected();
    if (!wallet) {
      message.destroy('purchase');
      return;
    }

    // 获取平台钱包地址
    let platformWalletAddress: string;
    try {
      platformWalletAddress = await getPlatformWalletAddress({
        provider: wallet.provider,
        contractAddress: MOOC_TOKEN_ADDRESS,
      });
    } catch (error) {
      console.error('Get platform wallet error:', error);
      message.destroy('purchase');
      message.error('获取平台钱包地址失败，请重试');
      return;
    }

    // 调用合约转账
    let transactionHash: string;
    try {
      transactionHash = await transferMOOCToken({
        signer: wallet.signer,
        contractAddress: MOOC_TOKEN_ADDRESS,
        to: platformWalletAddress,
        amount: String(price),
      });
    } catch (error) {
      console.error('Transfer token error:', error);
      message.destroy('purchase');
      message.error(error instanceof Error ? error.message : '转账失败，请重试');
      return;
    }

    // 调用后端记录交易
    let result;
    try {
      result = await buyResource({
        resourceId: resource.resourceId,
        transactionHash,
        walletAddress: wallet.address,
      });
    } catch (error) {
      console.error('Buy resource error:', error);
      message.destroy('purchase');
      message.error('记录交易失败，请重试');
      return;
    }

    message.destroy('purchase');

    if (result.code !== 0) {
      message.error(result.message || '购买失败');
      return;
    }

    // 如果后端返回了最新的用户信息，则更新全局用户状态，及时刷新 Header 中的代币余额
    if (result.data && result.data.user && accessToken) {
      setAuth(accessToken, result.data.user);
    }

    message.success(`成功购买资源，已支付 ${price} 代币`);
    // 更新已购买资源列表
    setPurchasedResourceIds((prev) => new Set([...prev, resource.resourceId!]));
    // 重新加载资源列表
    loadResources();
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
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-sm">
            <p className="text-center text-[#6e6e73]">课程不存在</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-sm mb-6 rounded-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button icon={<ArrowLeftOutlined />} type="text" shape="circle" onClick={() => navigate('/courseLearn')} aria-label="返回课程列表" />
            <h1 className="text-lg font-semibold text-[#1d1d1f]">课程详情</h1>
          </div>
          <div className="flex gap-3">
            {courseProgress && courseProgress >= 100 && (
                <Tooltip
                  title={
                    hasClaimedCertificate
                      ? '您已领取过课程证书！'
                      : hasCertificateConfig === false
                        ? '教师未配置课程证书，请稍后领取！'
                        : ''
                  }
                >
                  <span>
                    <Button type="primary" icon={<TrophyOutlined />} loading={claimingCertificate || checkingCertificateStatus || checkingCertificateConfig} onClick={handleClaimCertificate} className="rounded-lg" disabled={hasClaimedCertificate || hasCertificateConfig === false}  >
                领取课程证书
              </Button>
                  </span>
                </Tooltip>
            )}
            </div>
          </div>
        </Card>

        <CourseDetail course={course} averageRating={averageRating} courseProgress={courseProgress} />

        <Card className="shadow-sm mb-4 rounded-2xl">
          <h2 className="text-lg font-semibold text-[#1d1d1f]">资源列表</h2>
        </Card>
        <Card className="shadow-sm rounded-2xl">
          <ResourceList data={resources} loading={resourceLoading} page={resourcePage} pageSize={pageSize} total={resourceTotal} resourceRatings={resourceRatings} purchasedResourceIds={purchasedResourceIds} onPageChange={(p, s) => { setResourcePage(p); setPageSize(s); }} onItemClick={handleResourceClick} onPurchaseClick={handlePurchaseResource} />
        </Card>
      </div>
    </div>
  );
}
