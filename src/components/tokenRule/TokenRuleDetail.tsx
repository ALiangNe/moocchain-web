import { Modal } from 'antd';
import type { TokenRuleInfo } from '@/types/tokenRuleType';

interface TokenRuleDetailProps {
  visible: boolean;
  rule: TokenRuleInfo | undefined;
  onClose: () => void;
}

export default function TokenRuleDetail({ visible, rule, onClose }: TokenRuleDetailProps) {
  const getRewardTypeName = (type?: number) => {
    const typeMap: Record<number, string> = {
      0: '学习完成',
      1: '资源上传',
      2: '评价参与',
    };
    return typeMap[type || 0] || '未知';
  };

  return (
    <Modal title="查看代币规则" open={visible} onCancel={onClose} footer={null} width={600}>
      {rule && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-[#1d1d1f] mb-2">奖励类型</h3>
            <p className="text-[#6e6e73]">{getRewardTypeName(rule.rewardType)}</p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1d1d1f] mb-2">奖励数量</h3>
            <p className="text-[#6e6e73]">{rule.rewardAmount} {rule.tokenName}</p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1d1d1f] mb-2">代币名称</h3>
            <p className="text-[#6e6e73]">{rule.tokenName}</p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1d1d1f] mb-2">启用状态</h3>
            <p className="text-[#6e6e73]">{rule.isEnabled === 1 ? '启用' : '禁用'}</p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1d1d1f] mb-2">更新者</h3>
            <p className="text-[#6e6e73]">{rule.updater?.realName || rule.updater?.username || '-'}</p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1d1d1f] mb-2">创建时间</h3>
            <p className="text-[#6e6e73]">{rule.createdAt ? new Date(rule.createdAt).toLocaleString('zh-CN') : '-'}</p>
          </div>
          {rule.updatedAt && (
            <div>
              <h3 className="text-base font-semibold text-[#1d1d1f] mb-2">更新时间</h3>
              <p className="text-[#6e6e73]">{new Date(rule.updatedAt).toLocaleString('zh-CN')}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
