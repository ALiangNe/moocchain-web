import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Drawer, message } from 'antd';
import type { Dayjs } from 'dayjs';
import { PlusOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { createTokenRule, updateTokenRule, getTokenRuleList } from '@/api/baseApi';
import type { TokenRuleInfo } from '@/types/tokenRuleType';
import TokenRuleForm from '@/components/tokenRule/TokenRuleForm';
import TokenRuleListCard from '@/components/tokenRule/TokenRuleListCard';
import TokenRuleDetail from '@/components/tokenRule/TokenRuleDetail';
import TokenRuleFilterBar, { type TokenRuleEnabledFilter } from '@/components/tokenRule/TokenRuleFilterBar';
import { UserRole } from '@/constants/role';

export default function TokenRule() {
  const user = useAuthStore((state) => state.user);
  const [rules, setRules] = useState<TokenRuleInfo[]>([]);
  const [ruleLoading, setRuleLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentRule, setCurrentRule] = useState<TokenRuleInfo | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [total, setTotal] = useState(0);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);

  // 筛选条件（真正用于请求的）
  const [isEnabledFilter, setIsEnabledFilter] = useState<TokenRuleEnabledFilter>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  // 临时输入状态，点击查询按钮后才同步到筛选条件
  const [isEnabledInput, setIsEnabledInput] = useState<TokenRuleEnabledFilter>(undefined);
  const [dateRangeInput, setDateRangeInput] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  // 加载规则列表数据
  const loadRules = useCallback(async () => {
    if (!user?.userId || user.role !== UserRole.ADMIN) return;
    if (loadingRef.current) return;

    const currentRequestId = ++requestIdRef.current;
    loadingRef.current = true;

    queueMicrotask(() => {
      if (requestIdRef.current !== currentRequestId) {
        loadingRef.current = false;
        return;
      }
      setRuleLoading(true);
    });

    let result;
    try {
      const params: {
        page: number;
        pageSize: number;
        isEnabled?: number;
        startDate?: string;
        endDate?: string;
      } = { page, pageSize };

      if (isEnabledFilter !== undefined) params.isEnabled = isEnabledFilter;
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].startOf('day').format('YYYY-MM-DD HH:mm:ss');
        params.endDate = dateRange[1].endOf('day').format('YYYY-MM-DD HH:mm:ss');
      }

      result = await getTokenRuleList(params);
    } catch (error) {
      console.error('Load rules error:', error);
      if (requestIdRef.current === currentRequestId) {
        setRuleLoading(false);
        loadingRef.current = false;
        message.error('加载失败，请重试');
      }
      return;
    }

    if (requestIdRef.current !== currentRequestId) return;

    setRuleLoading(false);
    loadingRef.current = false;

    if (result.code !== 0 || !result.data) {
      message.error(result.message || '加载失败');
      return;
    }

    setRules(result.data.records);
    setTotal(result.data.total);
  }, [user, page, pageSize, isEnabledFilter, dateRange]);

  useEffect(() => {
    const effectRequestId = requestIdRef.current;
    queueMicrotask(() => {
      loadRules();
    });
    return () => {
      requestIdRef.current = effectRequestId + 1;
    };
  }, [loadRules]);

  // 创建新规则
  const handleCreateRule = async (values: Partial<TokenRuleInfo>) => {
    let result;
    try {
      result = await createTokenRule(values);
    } catch (error) {
      console.error('Create rule error:', error);
      message.error('创建失败，请重试');
      return;
    }

    if (result.code !== 0) {
      message.error(result.message || '创建失败');
      return;
    }

    message.success('代币规则创建成功');
    setDrawerVisible(false);
    loadRules();
  };

  // 更新规则
  const handleUpdateRule = async (values: Partial<TokenRuleInfo>) => {
    if (!currentRule?.ruleId) return;

    let result;
    try {
      result = await updateTokenRule(currentRule.ruleId, values);
    } catch (error) {
      console.error('Update rule error:', error);
      message.error('更新失败，请重试');
      return;
    }

    if (result.code !== 0) {
      message.error(result.message || '更新失败');
      return;
    }

    message.success('代币规则更新成功');
    setDrawerVisible(false);
    setCurrentRule(undefined);
    loadRules();
  };

  // 编辑规则：直接使用列表数据回显
  const handleEdit = (rule: TokenRuleInfo) => {
    setCurrentRule(rule);
    setDrawerVisible(true);
  };

  // 查看规则：直接使用列表数据回显
  const handleView = (rule: TokenRuleInfo) => {
    setCurrentRule(rule);
    setViewModalVisible(true);
  };

  // 打开创建抽屉
  const handleOpenCreate = () => {
    setCurrentRule(undefined);
    setDrawerVisible(true);
  };

  // 关闭抽屉
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setCurrentRule(undefined);
  };

  // 关闭查看弹窗
  const handleCloseViewModal = () => {
    setViewModalVisible(false);
    setCurrentRule(undefined);
  };

  // 处理筛选输入变化（只更新临时状态，不触发查询）
  const handleIsEnabledInputChange = (value: TokenRuleEnabledFilter) => {
    setIsEnabledInput(value);
  };

  const handleDateRangeInputChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRangeInput(dates);
  };

  // 点击查询按钮，将临时状态同步到实际筛选条件并触发查询
  const handleSearch = () => {
    setIsEnabledFilter(isEnabledInput);
    setDateRange(dateRangeInput);
    setPage(1);
  };

  if (user?.role !== UserRole.ADMIN) {
    return (
      <div className="py-12">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-sm mb-6 rounded-2xl">
            <h1 className="text-lg font-semibold text-[#1d1d1f]">代币规则管理</h1>
          </Card>
          <Card className="shadow-sm rounded-2xl">
            <p className="text-center text-[#6e6e73]">只有管理员可以访问此页面</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-sm mb-8 rounded-2xl">
          <div className="flex justify-between items-center">
            <TokenRuleFilterBar isEnabled={isEnabledInput} onIsEnabledChange={handleIsEnabledInputChange} dateRange={dateRangeInput} onDateRangeChange={handleDateRangeInputChange} onSearch={handleSearch} />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate} className="rounded-lg">创建规则</Button>
          </div>
        </Card>

        <Card className="shadow-sm rounded-2xl">
          <TokenRuleListCard rules={rules} loading={ruleLoading} page={page} pageSize={pageSize} total={total} onPageChange={(p, s) => { setPage(p); setPageSize(s); }} onEdit={handleEdit} onView={handleView} />
        </Card>

        <Drawer title={currentRule ? '编辑代币规则' : '创建代币规则'} open={drawerVisible} onClose={handleCloseDrawer} width={700} placement="right">
          <TokenRuleForm initialValues={currentRule} onSubmit={currentRule ? handleUpdateRule : handleCreateRule} onCancel={handleCloseDrawer} />
        </Drawer>

        <TokenRuleDetail visible={viewModalVisible} rule={currentRule} onClose={handleCloseViewModal} />
      </div>
    </div>
  );
}
