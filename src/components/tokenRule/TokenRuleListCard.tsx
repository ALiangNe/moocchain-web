import { Card, Pagination, Tag, Button, Space } from 'antd';
import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import type { TokenRuleInfo } from '@/types/tokenRuleType';
import { formatDate } from '@/utils/formatTime';

interface TokenRuleListCardProps {
  rules: TokenRuleInfo[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  onEdit?: (rule: TokenRuleInfo) => void;
  onView?: (rule: TokenRuleInfo) => void;
}

export default function TokenRuleListCard({ rules, loading, page, pageSize, total, onPageChange, onEdit, onView }: TokenRuleListCardProps) {
  const getRewardTypeName = (type?: number) => {
    const typeMap: Record<number, string> = {
      0: '学习完成',
      1: '资源上传',
      2: '评价参与',
    };
    return typeMap[type || 0] || '未知';
  };

  return (
    <div className="space-y-4">
      {rules.map((rule) => (
        <Card key={rule.ruleId} className="shadow-sm hover:shadow-md transition-shadow border border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-[#1d1d1f]">{getRewardTypeName(rule.rewardType)}</h3>
                <Tag color={rule.isEnabled === 1 ? 'green' : 'default'}>{rule.isEnabled === 1 ? '启用' : '禁用'}</Tag>
              </div>
              <div className="text-sm text-[#6e6e73] space-y-1">
                <p>奖励代币：{rule.rewardAmount} {rule.tokenName}</p>
                <p>创建者：{rule.updater?.realName || rule.updater?.username || '-'}</p>
                <p>创建时间：{rule.createdAt ? formatDate(rule.createdAt) : '-'}</p>
              </div>
            </div>
            <Space>
              {onView && (
                <Button type="link" icon={<EyeOutlined />} onClick={() => onView(rule)} className="text-[#007aff] focus:outline-none focus:shadow-none">查看</Button>
              )}
              {onEdit && (
                <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(rule)} className="text-[#007aff] focus:outline-none focus:shadow-none">编辑</Button>
              )}
            </Space>
          </div>
        </Card>
      ))}
      {rules.length === 0 && !loading && (
        <div className="text-center text-[#6e6e73] py-12">
          <p>暂无代币规则，请先创建规则</p>
        </div>
      )}
      <div className="flex justify-end mt-4">
        <Pagination current={page} pageSize={pageSize} total={total} onChange={onPageChange} showSizeChanger pageSizeOptions={['8', '16', '32', '64']} showTotal={(total) => `共 ${total} 条数据`} locale={{ items_per_page: '条/页' }} />
      </div>
    </div>
  );
}
