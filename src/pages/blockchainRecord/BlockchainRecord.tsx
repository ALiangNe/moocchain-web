import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from 'antd';
import type { Dayjs } from 'dayjs';
import { getCertificateList, getTokenTransactionList } from '@/api/baseApi';
import type { CertificateInfo } from '@/types/certificateType';
import type { TokenTransactionInfo } from '@/types/tokenTransactionType';
import RewardRecordList from '@/components/blockchainRecord/RewardRecordList';
import CertificateRecordList from '@/components/blockchainRecord/CertificateRecordList';
import PurchaseRecordList from '@/components/blockchainRecord/PurchaseRecordList';
import BlockchainRecordBarChart from '@/components/blockchainRecord/BlockchainRecordBarChart';
import BlockchainRecordPieChart from '@/components/blockchainRecord/BlockchainRecordPieChart';
import BlockchainRecordFilterBar, { type BlockchainRecordType } from '@/components/blockchainRecord/BlockchainRecordFilterBar';
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

  // 筛选条件
  const [recordType, setRecordType] = useState<BlockchainRecordType | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  // 临时输入状态，用于存储下拉框和日期选择器的值，点击查询按钮后才同步到实际筛选条件
  const [recordTypeInput, setRecordTypeInput] = useState<BlockchainRecordType | undefined>(undefined);
  const [dateRangeInput, setDateRangeInput] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const recordTypeOptions: { value: BlockchainRecordType; label: string }[] = isAdmin ? [
    { value: 'certificate', label: '铸造证书' },
    { value: 'uploadReward', label: '上传奖励' },
    { value: 'learningReward', label: '学习奖励' },
    { value: 'purchase', label: '资源消费' },
  ] : isTeacher ? [
    { value: 'certificate', label: '铸造证书' },
    { value: 'uploadReward', label: '上传奖励' },
    { value: 'purchase', label: '资源消费' },
  ] : [
    { value: 'certificate', label: '铸造证书' },
    { value: 'learningReward', label: '学习奖励' },
    { value: 'purchase', label: '资源消费' },
  ];

  // 加载奖励记录（学生：学习完成奖励，教师：上传资源奖励）
  const loadRewardRecords = useCallback(async () => {
    // 管理员不使用该列表（管理员有单独的 uploadRewardRecords / learningRewardRecords）
    if (isAdmin) return;

    // 如果筛选了上链类型，且不是当前角色对应的奖励类型，则不加载
    const allowedType: BlockchainRecordType = isTeacher ? 'uploadReward' : 'learningReward';
    if (recordType !== undefined && recordType !== allowedType) {
      setRewardRecords([]);
      setRewardTotal(0);
      setRewardLoading(false);
      rewardLoadingRef.current = false;
      return;
    }

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

    const params: {
      transactionType: number;
      rewardType: number;
      page: number;
      pageSize: number;
      startDate?: string;
      endDate?: string;
    } = {
      transactionType: 0, // 奖励
      rewardType: isStudent ? 0 : 1, // 学生：学习完成(0)，教师：资源上传(1)
      page: rewardPage,
      pageSize: rewardPageSize,
    };

    if (dateRange && dateRange[0] && dateRange[1]) {
      params.startDate = dateRange[0].startOf('day').format('YYYY-MM-DD HH:mm:ss');
      params.endDate = dateRange[1].endOf('day').format('YYYY-MM-DD HH:mm:ss');
    }

    let result;
    try {
      result = await getTokenTransactionList(params);
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
  }, [rewardPage, rewardPageSize, isStudent, isTeacher, isAdmin, dateRange, recordType]);

  // 管理员：加载上传资源奖励记录
  const loadUploadRewardRecords = useCallback(async () => {
    if (!isAdmin) return;

    if (recordType !== undefined && recordType !== 'uploadReward') {
      setUploadRewardRecords([]);
      setUploadRewardTotal(0);
      setUploadRewardLoading(false);
      uploadRewardLoadingRef.current = false;
      return;
    }

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

    const params: {
      transactionType: number;
      rewardType: number;
      page: number;
      pageSize: number;
      startDate?: string;
      endDate?: string;
    } = {
      transactionType: 0, // 奖励
      rewardType: 1, // 上传资源奖励
      page: uploadRewardPage,
      pageSize: uploadRewardPageSize,
    };

    if (dateRange && dateRange[0] && dateRange[1]) {
      params.startDate = dateRange[0].startOf('day').format('YYYY-MM-DD HH:mm:ss');
      params.endDate = dateRange[1].endOf('day').format('YYYY-MM-DD HH:mm:ss');
    }

    let result;
    try {
      result = await getTokenTransactionList(params);
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
  }, [uploadRewardPage, uploadRewardPageSize, isAdmin, dateRange, recordType]);

  // 管理员：加载学习完成奖励记录
  const loadLearningRewardRecords = useCallback(async () => {
    if (!isAdmin) return;

    if (recordType !== undefined && recordType !== 'learningReward') {
      setLearningRewardRecords([]);
      setLearningRewardTotal(0);
      setLearningRewardLoading(false);
      learningRewardLoadingRef.current = false;
      return;
    }

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

    const params: {
      transactionType: number;
      rewardType: number;
      page: number;
      pageSize: number;
      startDate?: string;
      endDate?: string;
    } = {
      transactionType: 0, // 奖励
      rewardType: 0, // 学习完成奖励
      page: learningRewardPage,
      pageSize: learningRewardPageSize,
    };

    if (dateRange && dateRange[0] && dateRange[1]) {
      params.startDate = dateRange[0].startOf('day').format('YYYY-MM-DD HH:mm:ss');
      params.endDate = dateRange[1].endOf('day').format('YYYY-MM-DD HH:mm:ss');
    }

    let result;
    try {
      result = await getTokenTransactionList(params);
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
  }, [learningRewardPage, learningRewardPageSize, isAdmin, dateRange, recordType]);

  // 加载铸造证书记录
  const loadCertificateRecords = useCallback(async () => {
    if (recordType !== undefined && recordType !== 'certificate') {
      setCertificateRecords([]);
      setCertificateTotal(0);
      setCertificateLoading(false);
      certificateLoadingRef.current = false;
      return;
    }

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

    const params: {
      page: number;
      pageSize: number;
      startDate?: string;
      endDate?: string;
    } = {
      page: certificatePage,
      pageSize: certificatePageSize,
    };

    if (dateRange && dateRange[0] && dateRange[1]) {
      params.startDate = dateRange[0].startOf('day').format('YYYY-MM-DD HH:mm:ss');
      params.endDate = dateRange[1].endOf('day').format('YYYY-MM-DD HH:mm:ss');
    }

    let result;
    try {
      result = await getCertificateList(params);
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
  }, [certificatePage, certificatePageSize, dateRange, recordType]);

  // 加载购买资源消费记录
  const loadPurchaseRecords = useCallback(async () => {
    if (recordType !== undefined && recordType !== 'purchase') {
      setPurchaseRecords([]);
      setPurchaseTotal(0);
      setPurchaseLoading(false);
      purchaseLoadingRef.current = false;
      return;
    }

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

    const params: {
      transactionType: number;
      consumeType: number;
      page: number;
      pageSize: number;
      startDate?: string;
      endDate?: string;
    } = {
      transactionType: 1, // 消费
      consumeType: 0, // 购买资源
      page: purchasePage,
      pageSize: purchasePageSize,
    };

    if (dateRange && dateRange[0] && dateRange[1]) {
      params.startDate = dateRange[0].startOf('day').format('YYYY-MM-DD HH:mm:ss');
      params.endDate = dateRange[1].endOf('day').format('YYYY-MM-DD HH:mm:ss');
    }

    let result;
    try {
      result = await getTokenTransactionList(params);
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
  }, [purchasePage, purchasePageSize, dateRange, recordType]);

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

  // 处理筛选输入变化（只更新临时状态，不触发查询）
  const handleRecordTypeInputChange = (value: BlockchainRecordType | undefined) => {
    setRecordTypeInput(value);
  };

  const handleDateRangeInputChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRangeInput(dates);
  };

  // 点击查询按钮，将临时状态同步到实际筛选条件并触发查询
  const handleSearch = () => {
    setRecordType(recordTypeInput);
    setDateRange(dateRangeInput);
    // 重置所有分页到第一页
    setRewardPage(1);
    setUploadRewardPage(1);
    setLearningRewardPage(1);
    setCertificatePage(1);
    setPurchasePage(1);
  };

  const showCertificates = recordType === undefined || recordType === 'certificate';
  const showPurchase = recordType === undefined || recordType === 'purchase';
  const showTeacherOrStudentReward = !isAdmin && (recordType === undefined || recordType === (isTeacher ? 'uploadReward' : 'learningReward'));
  const showAdminUploadReward = isAdmin && (recordType === undefined || recordType === 'uploadReward');
  const showAdminLearningReward = isAdmin && (recordType === undefined || recordType === 'learningReward');

  return (
    <div className="py-12">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-sm mb-8 rounded-2xl">
          <div className="flex justify-start items-center">
            <BlockchainRecordFilterBar recordType={recordTypeInput} onRecordTypeChange={handleRecordTypeInputChange} recordTypeOptions={recordTypeOptions} dateRange={dateRangeInput} onDateRangeChange={handleDateRangeInputChange} onSearch={handleSearch} />
          </div>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-sm rounded-2xl">
            <BlockchainRecordBarChart userRole={user?.role} certificateRecords={certificateRecords} rewardRecords={rewardRecords} uploadRewardRecords={isAdmin ? uploadRewardRecords : undefined} learningRewardRecords={isAdmin ? learningRewardRecords : undefined} purchaseRecords={purchaseRecords} />
          </Card>
          <Card className="shadow-sm rounded-2xl">
            <BlockchainRecordPieChart userRole={user?.role} certificateRecords={certificateRecords} rewardRecords={rewardRecords} uploadRewardRecords={isAdmin ? uploadRewardRecords : undefined} learningRewardRecords={isAdmin ? learningRewardRecords : undefined} purchaseRecords={purchaseRecords} />
          </Card>
        </div>


        {/* 铸造证书记录 */}
        {showCertificates && (
          <Card className="shadow-sm mb-8 rounded-2xl">
            <h2 className="text-base font-semibold text-[#1d1d1f] mb-4">铸造证书记录</h2>
            <CertificateRecordList data={certificateRecords} loading={certificateLoading} page={certificatePage} pageSize={certificatePageSize} total={certificateTotal} onPageChange={handleCertificatePageChange} />
          </Card>
        )}

        {/* 管理员：领取上传资源奖励记录 */}
        {showAdminUploadReward && (
          <Card className="shadow-sm mb-8 rounded-2xl">
            <h2 className="text-base font-semibold text-[#1d1d1f] mb-4">领取上传资源奖励</h2>
            <RewardRecordList data={uploadRewardRecords} loading={uploadRewardLoading} page={uploadRewardPage} pageSize={uploadRewardPageSize} total={uploadRewardTotal} onPageChange={handleUploadRewardPageChange} title="上传资源奖励" emptyDescription="暂无领取上传资源奖励记录" />
          </Card>
        )}

        {/* 管理员：领取资源完成奖励记录 */}
        {showAdminLearningReward && (
          <Card className="shadow-sm mb-8 rounded-2xl">
            <h2 className="text-base font-semibold text-[#1d1d1f] mb-4">领取资源完成奖励</h2>
            <RewardRecordList data={learningRewardRecords} loading={learningRewardLoading} page={learningRewardPage} pageSize={learningRewardPageSize} total={learningRewardTotal} onPageChange={handleLearningRewardPageChange} title="学习完成奖励" emptyDescription="暂无领取资源完成奖励记录" />
          </Card>
        )}

        {/* 教师：领取上传资源奖励记录 */}
        {isTeacher && showTeacherOrStudentReward && (
          <Card className="shadow-sm mb-8 rounded-2xl">
            <h2 className="text-base font-semibold text-[#1d1d1f] mb-4">领取上传资源奖励</h2>
            <RewardRecordList data={rewardRecords} loading={rewardLoading} page={rewardPage} pageSize={rewardPageSize} total={rewardTotal} onPageChange={handleRewardPageChange} title="上传资源奖励" emptyDescription="暂无领取上传资源奖励记录" />
          </Card>
        )}

        {/* 学生：领取资源完成奖励记录 */}
        {isStudent && showTeacherOrStudentReward && (
          <Card className="shadow-sm mb-8 rounded-2xl">
            <h2 className="text-base font-semibold text-[#1d1d1f] mb-4">领取资源完成奖励</h2>
            <RewardRecordList data={rewardRecords} loading={rewardLoading} page={rewardPage} pageSize={rewardPageSize} total={rewardTotal} onPageChange={handleRewardPageChange} />
          </Card>
        )}

        {/* 购买资源消费记录 */}
        {showPurchase && (
          <Card className="shadow-sm rounded-2xl">
            <h2 className="text-base font-semibold text-[#1d1d1f] mb-4">购买资源消费记录</h2>
            <PurchaseRecordList data={purchaseRecords} loading={purchaseLoading} page={purchasePage} pageSize={purchasePageSize} total={purchaseTotal} onPageChange={handlePurchasePageChange} />
          </Card>
        )}
      </div>
    </div>
  );
}
