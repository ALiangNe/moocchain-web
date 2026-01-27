import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Spin, message, Drawer, Tooltip } from 'antd';
import { ArrowLeftOutlined, EditOutlined, ReloadOutlined, GiftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { getResource, updateResource, reapplyResourceAudit, claimResourceUploadReward, getTokenRuleList, getTokenTransactionList, getAuditRecordList } from '@/api/baseApi';
import type { ResourceInfo } from '@/types/resourceType';
import type { AuditRecordInfo } from '@/types/auditRecordType';
import ResourceDetail from '@/components/courseMgmt/ResourceDetail';
import ResourceForm from '@/components/courseMgmt/ResourceForm';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/constants/role';
import { ensureWalletConnected } from '@/utils/wallet';

export default function CourseMgmtResourceId() {
  const { resourceId } = useParams<{ resourceId: string }>();
  const navigate = useNavigate();
  const [resource, setResource] = useState<ResourceInfo | null>(null);
  const [latestAuditRecord, setLatestAuditRecord] = useState<AuditRecordInfo | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [reapplyingAudit, setReapplyingAudit] = useState(false);
  const [hasReappliedResourceAudit, setHasReappliedResourceAudit] = useState(false);
  const [claimingReward, setClaimingReward] = useState(false);
  const [hasClaimedUploadReward, setHasClaimedUploadReward] = useState(false);
  const [checkingRewardStatus, setCheckingRewardStatus] = useState(false);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);
  const user = useAuthStore((state) => state.user);

  // 加载资源审核记录（用于 status 显示“审核未通过，请重新提交申请”）
  const loadAuditRecord = useCallback(async (rid: number) => {
    setAuditLoading(true);
    let result;
    try {
      result = await getAuditRecordList({
        targetId: rid,
        targetType: 1, // 资源
        auditType: 1, // 资源内容审核
        page: 1,
        pageSize: 1,
      });
    } catch (error) {
      console.error('Load audit record error:', error);
      setAuditLoading(false);
      setLatestAuditRecord(null);
      return;
    }
    setAuditLoading(false);
    if (result.code !== 0 || !result.data || !result.data.records || result.data.records.length === 0) {
      setLatestAuditRecord(null);
      return;
    }
    setLatestAuditRecord(result.data.records[0]);
  }, []);

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

    setResource(result.data);

    if (result.data.status === 0 && result.data.resourceId) {
      loadAuditRecord(result.data.resourceId);
    } else {
      setLatestAuditRecord(null);
    }
  }, [resourceId, loadAuditRecord]);

  useEffect(() => {
    const effectRequestId = requestIdRef.current;
    queueMicrotask(() => {
      loadResource();
    });
    return () => {
      requestIdRef.current = effectRequestId + 1;
    };
  }, [loadResource]);

  // 查询是否已领取上传奖励
  const checkUploadRewardStatus = useCallback(async () => {
    if (!resourceId || !user?.userId) return;

    setCheckingRewardStatus(true);
    let result;
    try {
      // 查询该资源的上传奖励记录（transactionType=0 表示奖励，rewardType=1 表示资源上传，relatedId=resourceId）
      result = await getTokenTransactionList({
        transactionType: 0,
        rewardType: 1,
        relatedId: Number(resourceId),
        page: 1,
        pageSize: 1,
      });
    } catch (error) {
      console.error('Check upload reward status error:', error);
      setCheckingRewardStatus(false);
      return;
    }

    setCheckingRewardStatus(false);

    // 后端已经按 userId 过滤，所以如果查询到记录，说明当前用户已经领取过
    if (result.code === 0 && result.data && result.data.records.length > 0) {
      const transaction = result.data.records[0];
      // 额外检查：确保 rewardType 是 1（资源上传），且 userId 匹配
      if (transaction.rewardType === 1 && transaction.userId === user.userId) {
        setHasClaimedUploadReward(true);
      }
    }
  }, [resourceId, user]);

  useEffect(() => {
    if (!resource || !user) return;
    queueMicrotask(() => {
      checkUploadRewardStatus();
    });
  }, [resource, user, checkUploadRewardStatus]);

  // 获取资源文件下载地址
  const getResourceFileUrl = (ipfsHash?: string) => {
    if (!ipfsHash) return undefined;
    // 如果是完整的 URL，直接返回
    if (ipfsHash.startsWith('http')) return ipfsHash;
    // 如果是 IPFS Hash (CID)，使用 Pinata Gateway
    // IPFS Hash 通常以 Qm 开头（CIDv0）或 b 开头（CIDv1），且不包含路径分隔符
    if (!ipfsHash.startsWith('/') && (ipfsHash.startsWith('Qm') || ipfsHash.startsWith('b') || ipfsHash.length > 30)) {
      const gatewayUrl = import.meta.env.VITE_IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';
      return `${gatewayUrl}${ipfsHash}`;
    }
    // 否则认为是本地路径
    const baseUrl = import.meta.env.VITE_API_BASE_URL.split('/api')[0];
    return `${baseUrl}${ipfsHash}`;
  };

  // 处理资源文件下载
  const handleDownload = () => {
    const fileUrl = getResourceFileUrl(resource?.ipfsHash);
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  // 处理资源编辑提交
  const handleEditSubmit = async (values: Partial<ResourceInfo>) => {
    if (!resourceId || !resource) return;

    const payload: Partial<ResourceInfo> = {
      title: values.title,
      description: values.description,
      resourceType: values.resourceType,
      price: values.price,
      accessScope: values.accessScope,
    };

    // 如果在表单中选择了资源状态（发布/下架），一并提交
    if (values.status !== undefined) {
      payload.status = values.status;
    }

    let result;
    try {
      result = await updateResource(Number(resourceId), payload);
    } catch (error) {
      console.error('Update resource error:', error);
      message.error('更新失败，请重试');
      return;
    }

    if (result.code !== 0) {
      message.error(result.message || '更新失败');
      return;
    }

    message.success('资源更新成功');
    setEditVisible(false);
    loadResource();
  };

  // 重新提交资源审核（仅限被拒绝后的待审核资源）
  const handleReapplyResourceAudit = async () => {
    if (!resource || !resource.resourceId) {
      message.error('资源信息不存在');
      return;
    }

    // 只有待审核状态的资源才允许重新提交审核
    if (resource.status !== 0) {
      message.warning('只有待审核状态的资源可以重新提交审核');
      return;
    }

    setReapplyingAudit(true);

    let result;
    try {
      result = await reapplyResourceAudit({ resourceId: resource.resourceId });
    } catch (error) {
      console.error('Reapply resource audit error:', error);
      setReapplyingAudit(false);
      message.error('重新提交审核失败，请重试');
      return;
    }

    setReapplyingAudit(false);

    if (!result || result.code !== 0) {
      message.error(result?.message || '重新提交审核失败');
      return;
    }

    message.success('已重新提交审核，请等待管理员审核');
    setHasReappliedResourceAudit(true);
    loadResource();
  };

  // 领取上传资源奖励
  const handleClaimResourceUploadReward = async () => {
    if (!resource || !resource.resourceId) {
      message.error('资源信息不存在');
      return;
    }

    // 获取代币规则
    let ruleResult;
    try {
      ruleResult = await getTokenRuleList({ rewardType: 1, isEnabled: 1, page: 1, pageSize: 1 });
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

    // 连接钱包
    const wallet = await ensureWalletConnected();
    if (!wallet) return;

    setClaimingReward(true);
    message.loading({ content: '正在领取奖励...', key: 'claim', duration: 0 });

    // 调用后端 API，后端会使用管理员私钥代为 mint
    let result;
    try {
      result = await claimResourceUploadReward({
        resourceId: resource.resourceId,
        walletAddress: wallet.address,
      });
    } catch (error) {
      console.error('Claim reward error:', error);
      message.destroy('claim');
      setClaimingReward(false);
      message.error('记录交易失败，请重试');
      return;
    }

    message.destroy('claim');
    setClaimingReward(false);

    if (result.code !== 0) {
      message.error(result.message || '领取奖励失败');
      return;
    }

    message.success(`成功领取 ${rewardAmount} ${rule.tokenName} 代币奖励`);
    setHasClaimedUploadReward(true);
    loadResource();
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

  return (
    <div className="py-12">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-sm mb-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button icon={<ArrowLeftOutlined />} type="text" shape="circle" onClick={() => navigate(-1)} aria-label="返回资源列表" />
              <h1 className="text-lg font-semibold text-[#1d1d1f]">资源详情</h1>
            </div>
            {user?.role !== UserRole.STUDENT && (
              <div className="flex gap-3">
                {resource.status === 0 && latestAuditRecord && (latestAuditRecord.auditStatus === 2 || hasReappliedResourceAudit) && (
                  <Tooltip title={hasReappliedResourceAudit ? '您已重新提交审核，请耐心等待！' : ''}>
                    <Button type="primary" icon={<ReloadOutlined />} loading={reapplyingAudit} onClick={handleReapplyResourceAudit} className="rounded-lg" disabled={hasReappliedResourceAudit || latestAuditRecord.auditStatus !== 2}>
                      重新提交审核
                    </Button>
                  </Tooltip>
                )}
                <Tooltip title={hasClaimedUploadReward ? '您已领取过代币奖励！' : ''}>
                  <Button type="primary" icon={<GiftOutlined />} loading={claimingReward || checkingRewardStatus} onClick={handleClaimResourceUploadReward} className="rounded-lg" disabled={hasClaimedUploadReward}>
                    领取上传奖励
                  </Button>
                </Tooltip>
                <Button type="primary" icon={<EditOutlined />} onClick={() => setEditVisible(true)} className="rounded-lg">编辑资源</Button>
              </div>
            )}
          </div>
        </Card>

        <ResourceDetail resource={resource} onDownload={handleDownload} latestAuditRecord={latestAuditRecord} auditLoading={auditLoading} />

        <Drawer title="编辑资源" open={editVisible} onClose={() => setEditVisible(false)} width={700} placement="right">
          {resource && (
            <ResourceForm courseId={resource.courseId || 0} initialValues={resource} onSubmit={handleEditSubmit} onCancel={() => setEditVisible(false)} />
          )}
        </Drawer>
      </div>
    </div>
  );
}
