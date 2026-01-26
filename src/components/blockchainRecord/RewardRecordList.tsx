import { List, Empty, Spin, Pagination, Tag } from 'antd';
import { GiftOutlined } from '@ant-design/icons';
import type { TokenTransactionInfo } from '@/types/tokenTransactionType';
import { formatDateTime } from '@/utils/formatTime';

interface RewardRecordListProps {
  data: TokenTransactionInfo[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  title?: string;
  emptyDescription?: string;
}

export default function RewardRecordList({ data, loading, page, pageSize, total, onPageChange, title = '学习完成奖励', emptyDescription = '暂无领取资源完成奖励记录' }: RewardRecordListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Spin size="large" />
      </div>
    );
  }

  if (!data.length) {
    return <Empty description={emptyDescription} />;
  }

  return (
    <>
      <List
        itemLayout="horizontal"
        dataSource={data}
        renderItem={(record) => (
          <List.Item className="hover:bg-gray-50/80 transition-colors rounded-xl px-3">
            <List.Item.Meta
              avatar={
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gradient-to-br from-[#f5f5f7] to-white flex items-center justify-center self-stretch">
                  <GiftOutlined className="text-[#007aff] text-3xl" />
                </div>
              }
              title={
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-[#1d1d1f]">{title}</span>
                    <Tag color="green">+{record.amount || 0} 代币</Tag>
                  </div>
                  <span className="text-xs text-[#6e6e73]">{record.createdAt ? formatDateTime(record.createdAt) : '-'}</span>
                </div>
              }
              description={
                <div className="flex flex-col gap-1 text-xs text-[#6e6e73]">
                  {/* <span>资源ID: {record.relatedId || '-'}</span> */}
                  <span>余额变化: {record.balanceBefore || 0} → {record.balanceAfter || 0}</span>
                  <div className="flex justify-between items-center">
                    <span>交易哈希: {record.transactionHash || '-'}</span>
                    <span>领取者: {record.user?.realName || record.user?.username || '-'}</span>
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />
      <div className="mt-4 flex justify-end">
        <Pagination current={page} pageSize={pageSize} total={total} onChange={(p, s) => onPageChange(p, s)} showSizeChanger showTotal={(t) => `共 ${t} 条数据`} locale={{ items_per_page: '条/页' }} />
      </div>
    </>
  );
}
