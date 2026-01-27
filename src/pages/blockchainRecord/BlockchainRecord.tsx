import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from 'antd';
import { getCertificateList, getTokenTransactionList } from '@/api/baseApi';
import type { CertificateInfo } from '@/types/certificateType';
import type { TokenTransactionInfo } from '@/types/tokenTransactionType';
import RewardRecordList from '@/components/blockchainRecord/RewardRecordList';
import CertificateRecordList from '@/components/blockchainRecord/CertificateRecordList';
import PurchaseRecordList from '@/components/blockchainRecord/PurchaseRecordList';
import BlockchainRecordBarChart from '@/components/blockchainRecord/blockchainRecordBarChart';
import BlockchainRecordPieChart from '@/components/blockchainRecord/blockchainRecordPieChart';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/constants/role';

export default function BlockchainRecord() {
  const user = useAuthStore((state) => state.user);
  const isStudent = user?.role === UserRole.STUDENT;
  const isTeacher = user?.role === UserRole.TEACHER;
  const isAdmin = user?.role === UserRole.ADMIN;

  // 奖励记录（学生：学习完成奖励，教师：上传资源奖励）
  const [rewardRecords, setRewardRecords] = useState<TokenTransactionInfo[]>([]);
  const [rewardLoading, setRewardLoading] = useState(false);
  const [rewardPage, setRewardPage] = useState(1);
  const [rewardPageSize, setRewardPageSize] = useState(10);
  const [rewardTotal, setRewardTotal] = useState(0);
  const rewardLoadingRef = useRef(false);
  const rewardRequestIdRef = useRef(0);

  // 管理员：上传资源奖励记录
  const [uploadRewardRecords, setUploadRewardRecords] = useState<TokenTransactionInfo[]>([]);
  const [uploadRewardLoading, setUploadRewardLoading] = useState(false);
  const [uploadRewardPage, setUploadRewardPage] = useState(1);
  const [uploadRewardPageSize, setUploadRewardPageSize] = useState(10);
  const [uploadRewardTotal, setUploadRewardTotal] = useState(0);
  const uploadRewardLoadingRef = useRef(false);
  const uploadRewardRequestIdRef = useRef(0);

  // 管理员：学习完成奖励记录
  const [learningRewardRecords, setLearningRewardRecords] = useState<TokenTransactionInfo[]>([]);
  const [learningRewardLoading, setLearningRewardLoading] = useState(false);
  const [learningRewardPage, setLearningRewardPage] = useState(1);
  const [learningRewardPageSize, setLearningRewardPageSize] = useState(10);
  const [learningRewardTotal, setLearningRewardTotal] = useState(0);
  const learningRewardLoadingRef = useRef(false);
  const learningRewardRequestIdRef = useRef(0);

  const [certificateRecords, setCertificateRecords] = useState<CertificateInfo[]>([]);
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [certificatePage, setCertificatePage] = useState(1);
  const [certificatePageSize, setCertificatePageSize] = useState(10);
  const [certificateTotal, setCertificateTotal] = useState(0);
  const certificateLoadingRef = useRef(false);
  const certificateRequestIdRef = useRef(0);

  const [purchaseRecords, setPurchaseRecords] = useState<TokenTransactionInfo[]>([]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchasePage, setPurchasePage] = useState(1);
  const [purchasePageSize, setPurchasePageSize] = useState(10);
  const [purchaseTotal, setPurchaseTotal] = useState(0);
  const purchaseLoadingRef = useRef(false);
  const purchaseRequestIdRef = useRef(0);

  // 加载奖励记录（学生：学习完成奖励，教师：上传资源奖励）
  const loadRewardRecords = useCallback(async () => {
    if (rewardLoadingRef.current) return;

    const currentRequestId = ++rewardRequestIdRef.current;
    rewardLoadingRef.current = true;

    queueMicrotask(() => {
      if (rewardRequestIdRef.current !== currentRequestId) {
        rewardLoadingRef.current = false;
        return;
      }
      setRewardLoading(true);
    });

    let result;
    try {
      result = await getTokenTransactionList({
        transactionType: 0, // 奖励
        rewardType: isStudent ? 0 : 1, // 学生：学习完成(0)，教师：资源上传(1)
        page: rewardPage,
        pageSize: rewardPageSize,
      });
    } catch (error) {
      console.error('Load reward records error:', error);
      if (rewardRequestIdRef.current === currentRequestId) {
        setRewardLoading(false);
        rewardLoadingRef.current = false;
      }
      return;
    }

    if (rewardRequestIdRef.current !== currentRequestId) return;

    setRewardLoading(false);
    rewardLoadingRef.current = false;

    if (result.code !== 0 || !result.data) return;
    setRewardRecords(result.data.records);
    setRewardTotal(result.data.total);
  }, [rewardPage, rewardPageSize, isStudent]);

  // 管理员：加载上传资源奖励记录
  const loadUploadRewardRecords = useCallback(async () => {
    if (uploadRewardLoadingRef.current) return;

    const currentRequestId = ++uploadRewardRequestIdRef.current;
    uploadRewardLoadingRef.current = true;

    queueMicrotask(() => {
      if (uploadRewardRequestIdRef.current !== currentRequestId) {
        uploadRewardLoadingRef.current = false;
        return;
      }
      setUploadRewardLoading(true);
    });

    let result;
    try {
      result = await getTokenTransactionList({
        transactionType: 0, // 奖励
        rewardType: 1, // 上传资源奖励
        page: uploadRewardPage,
        pageSize: uploadRewardPageSize,
      });
    } catch (error) {
      console.error('Load upload reward records error:', error);
      if (uploadRewardRequestIdRef.current === currentRequestId) {
        setUploadRewardLoading(false);
        uploadRewardLoadingRef.current = false;
      }
      return;
    }

    if (uploadRewardRequestIdRef.current !== currentRequestId) return;

    setUploadRewardLoading(false);
    uploadRewardLoadingRef.current = false;

    if (result.code !== 0 || !result.data) return;
    setUploadRewardRecords(result.data.records);
    setUploadRewardTotal(result.data.total);
  }, [uploadRewardPage, uploadRewardPageSize]);

  // 管理员：加载学习完成奖励记录
  const loadLearningRewardRecords = useCallback(async () => {
    if (learningRewardLoadingRef.current) return;

    const currentRequestId = ++learningRewardRequestIdRef.current;
    learningRewardLoadingRef.current = true;

    queueMicrotask(() => {
      if (learningRewardRequestIdRef.current !== currentRequestId) {
        learningRewardLoadingRef.current = false;
        return;
      }
      setLearningRewardLoading(true);
    });

    let result;
    try {
      result = await getTokenTransactionList({
        transactionType: 0, // 奖励
        rewardType: 0, // 学习完成奖励
        page: learningRewardPage,
        pageSize: learningRewardPageSize,
      });
    } catch (error) {
      console.error('Load learning reward records error:', error);
      if (learningRewardRequestIdRef.current === currentRequestId) {
        setLearningRewardLoading(false);
        learningRewardLoadingRef.current = false;
      }
      return;
    }

    if (learningRewardRequestIdRef.current !== currentRequestId) return;

    setLearningRewardLoading(false);
    learningRewardLoadingRef.current = false;

    if (result.code !== 0 || !result.data) return;
    setLearningRewardRecords(result.data.records);
    setLearningRewardTotal(result.data.total);
  }, [learningRewardPage, learningRewardPageSize]);

  // 加载铸造证书记录
  const loadCertificateRecords = useCallback(async () => {
    if (certificateLoadingRef.current) return;

    const currentRequestId = ++certificateRequestIdRef.current;
    certificateLoadingRef.current = true;

    queueMicrotask(() => {
      if (certificateRequestIdRef.current !== currentRequestId) {
        certificateLoadingRef.current = false;
        return;
      }
      setCertificateLoading(true);
    });

    let result;
    try {
      result = await getCertificateList({
        page: certificatePage,
        pageSize: certificatePageSize,
      });
    } catch (error) {
      console.error('Load certificate records error:', error);
      if (certificateRequestIdRef.current === currentRequestId) {
        setCertificateLoading(false);
        certificateLoadingRef.current = false;
      }
      return;
    }

    if (certificateRequestIdRef.current !== currentRequestId) return;

    setCertificateLoading(false);
    certificateLoadingRef.current = false;

    if (result.code !== 0 || !result.data) return;
    setCertificateRecords(result.data.records);
    setCertificateTotal(result.data.total);
  }, [certificatePage, certificatePageSize]);

  // 加载购买资源消费记录
  const loadPurchaseRecords = useCallback(async () => {
    if (purchaseLoadingRef.current) return;

    const currentRequestId = ++purchaseRequestIdRef.current;
    purchaseLoadingRef.current = true;

    queueMicrotask(() => {
      if (purchaseRequestIdRef.current !== currentRequestId) {
        purchaseLoadingRef.current = false;
        return;
      }
      setPurchaseLoading(true);
    });

    let result;
    try {
      result = await getTokenTransactionList({
        transactionType: 1, // 消费
        consumeType: 0, // 购买资源
        page: purchasePage,
        pageSize: purchasePageSize,
      });
    } catch (error) {
      console.error('Load purchase records error:', error);
      if (purchaseRequestIdRef.current === currentRequestId) {
        setPurchaseLoading(false);
        purchaseLoadingRef.current = false;
      }
      return;
    }

    if (purchaseRequestIdRef.current !== currentRequestId) return;

    setPurchaseLoading(false);
    purchaseLoadingRef.current = false;

    if (result.code !== 0 || !result.data) return;
    setPurchaseRecords(result.data.records);
    setPurchaseTotal(result.data.total);
  }, [purchasePage, purchasePageSize]);

  useEffect(() => {
    if (!isAdmin && (isStudent || isTeacher)) {
      const effectRequestId = rewardRequestIdRef.current;
      queueMicrotask(() => {
        loadRewardRecords();
      });
      return () => {
        rewardRequestIdRef.current = effectRequestId + 1;
      };
    }
  }, [loadRewardRecords, isAdmin, isStudent, isTeacher]);

  useEffect(() => {
    if (isAdmin) {
      const effectRequestId = uploadRewardRequestIdRef.current;
      queueMicrotask(() => {
        loadUploadRewardRecords();
      });
      return () => {
        uploadRewardRequestIdRef.current = effectRequestId + 1;
      };
    }
  }, [loadUploadRewardRecords, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      const effectRequestId = learningRewardRequestIdRef.current;
      queueMicrotask(() => {
        loadLearningRewardRecords();
      });
      return () => {
        learningRewardRequestIdRef.current = effectRequestId + 1;
      };
    }
  }, [loadLearningRewardRecords, isAdmin]);

  useEffect(() => {
    const effectRequestId = certificateRequestIdRef.current;
    queueMicrotask(() => {
      loadCertificateRecords();
    });
    return () => {
      certificateRequestIdRef.current = effectRequestId + 1;
    };
  }, [loadCertificateRecords]);

  useEffect(() => {
    const effectRequestId = purchaseRequestIdRef.current;
    queueMicrotask(() => {
      loadPurchaseRecords();
    });
    return () => {
      purchaseRequestIdRef.current = effectRequestId + 1;
    };
  }, [loadPurchaseRecords]);

  const handleRewardPageChange = (p: number, s: number) => {
    setRewardPage(p);
    setRewardPageSize(s);
  };

  const handleUploadRewardPageChange = (p: number, s: number) => {
    setUploadRewardPage(p);
    setUploadRewardPageSize(s);
  };

  const handleLearningRewardPageChange = (p: number, s: number) => {
    setLearningRewardPage(p);
    setLearningRewardPageSize(s);
  };

  const handleCertificatePageChange = (p: number, s: number) => {
    setCertificatePage(p);
    setCertificatePageSize(s);
  };

  const handlePurchasePageChange = (p: number, s: number) => {
    setPurchasePage(p);
    setPurchasePageSize(s);
  };

  return (
    <div className="py-12">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-sm rounded-2xl">
            <BlockchainRecordBarChart userRole={user?.role} certificateRecords={certificateRecords} rewardRecords={rewardRecords} uploadRewardRecords={isAdmin ? uploadRewardRecords : undefined} learningRewardRecords={isAdmin ? learningRewardRecords : undefined} purchaseRecords={purchaseRecords} />
          </Card>
          <Card className="shadow-sm rounded-2xl">
            <BlockchainRecordPieChart userRole={user?.role} certificateRecords={certificateRecords} rewardRecords={rewardRecords} uploadRewardRecords={isAdmin ? uploadRewardRecords : undefined} learningRewardRecords={isAdmin ? learningRewardRecords : undefined} purchaseRecords={purchaseRecords} />
          </Card>
        </div>

        <Card className="shadow-sm mb-8 rounded-2xl">
          <h1 className="text-lg font-semibold text-[#1d1d1f]">上链记录</h1>
        </Card>

        {/* 铸造证书记录 */}
        <Card className="shadow-sm mb-8 rounded-2xl">
          <h2 className="text-base font-semibold text-[#1d1d1f] mb-4">铸造证书记录</h2>
          <CertificateRecordList data={certificateRecords} loading={certificateLoading} page={certificatePage} pageSize={certificatePageSize} total={certificateTotal} onPageChange={handleCertificatePageChange} />
        </Card>

        {/* 管理员：领取上传资源奖励记录 */}
        {isAdmin && (
          <Card className="shadow-sm mb-8 rounded-2xl">
            <h2 className="text-base font-semibold text-[#1d1d1f] mb-4">领取上传资源奖励</h2>
            <RewardRecordList data={uploadRewardRecords} loading={uploadRewardLoading} page={uploadRewardPage} pageSize={uploadRewardPageSize} total={uploadRewardTotal} onPageChange={handleUploadRewardPageChange} title="上传资源奖励" emptyDescription="暂无领取上传资源奖励记录" />
          </Card>
        )}

        {/* 管理员：领取资源完成奖励记录 */}
        {isAdmin && (
          <Card className="shadow-sm mb-8 rounded-2xl">
            <h2 className="text-base font-semibold text-[#1d1d1f] mb-4">领取资源完成奖励</h2>
            <RewardRecordList data={learningRewardRecords} loading={learningRewardLoading} page={learningRewardPage} pageSize={learningRewardPageSize} total={learningRewardTotal} onPageChange={handleLearningRewardPageChange} title="学习完成奖励" emptyDescription="暂无领取资源完成奖励记录" />
          </Card>
        )}

        {/* 教师：领取上传资源奖励记录 */}
        {isTeacher && (
          <Card className="shadow-sm mb-8 rounded-2xl">
            <h2 className="text-base font-semibold text-[#1d1d1f] mb-4">领取上传资源奖励</h2>
            <RewardRecordList data={rewardRecords} loading={rewardLoading} page={rewardPage} pageSize={rewardPageSize} total={rewardTotal} onPageChange={handleRewardPageChange} title="上传资源奖励" emptyDescription="暂无领取上传资源奖励记录" />
          </Card>
        )}

        {/* 学生：领取资源完成奖励记录 */}
        {isStudent && (
          <Card className="shadow-sm mb-8 rounded-2xl">
            <h2 className="text-base font-semibold text-[#1d1d1f] mb-4">领取资源完成奖励</h2>
            <RewardRecordList data={rewardRecords} loading={rewardLoading} page={rewardPage} pageSize={rewardPageSize} total={rewardTotal} onPageChange={handleRewardPageChange} />
          </Card>
        )}

        {/* 购买资源消费记录 */}
        <Card className="shadow-sm rounded-2xl">
          <h2 className="text-base font-semibold text-[#1d1d1f] mb-4">购买资源消费记录</h2>
          <PurchaseRecordList data={purchaseRecords} loading={purchaseLoading} page={purchasePage} pageSize={purchasePageSize} total={purchaseTotal} onPageChange={handlePurchasePageChange} />
        </Card>
      </div>
    </div>
  );
}
