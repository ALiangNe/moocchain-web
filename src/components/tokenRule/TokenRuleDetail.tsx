import { Drawer, Card, Descriptions, Tag } from 'antd';
import type { TokenRuleInfo } from '@/types/tokenRuleType';
import { formatDateTime } from '@/utils/formatTime';

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
    <Drawer title="查看代币规则" open={visible} onClose={onClose} width={700} placement="right">
      {rule && (
        <Card title="代币规则信息" className="shadow-sm">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="奖励类型">
              {getRewardTypeName(rule.rewardType)}
            </Descriptions.Item>
            <Descriptions.Item label="奖励数量">
              {rule.rewardAmount} {rule.tokenName}
            </Descriptions.Item>
            <Descriptions.Item label="代币名称">
              {rule.tokenName}
            </Descriptions.Item>
            <Descriptions.Item label="启用状态">
              <Tag color={rule.isEnabled === 1 ? 'success' : 'default'}>
                {rule.isEnabled === 1 ? '启用' : '禁用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="更新者">
              {rule.updater?.realName || rule.updater?.username || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {rule.createdAt ? formatDateTime(rule.createdAt) : '-'}
            </Descriptions.Item>
            {rule.updatedAt && (
              <Descriptions.Item label="更新时间" span={2}>
                {formatDateTime(rule.updatedAt)}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}
    </Drawer>
  );
}
