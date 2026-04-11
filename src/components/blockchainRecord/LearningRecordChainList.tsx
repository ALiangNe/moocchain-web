import { List, Empty, Spin, Pagination, Tag } from 'antd';
import { ReadOutlined } from '@ant-design/icons';
import type { LearningRecordInfo } from '@/types/learningRecordType';
import { formatDateTime } from '@/utils/formatTime';

interface LearningRecordChainListProps {
  data: LearningRecordInfo[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
}

export default function LearningRecordChainList({ data, loading, page, pageSize, total, onPageChange }: LearningRecordChainListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Spin size="large" />
      </div>
    );
  }

  if (!data.length) {
    return <Empty description="暂无学习记录上链数据" />;
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
                  <ReadOutlined className="text-[#13c2c2] text-3xl" />
                </div>
              }
              title={
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-[#1d1d1f]">{record.resource?.title || '学习记录上链'}</span>
                    <Tag color="cyan">学习进度 {record.progress ?? 0}%</Tag>
                  </div>
                  <span className="text-xs text-[#6e6e73]">{record.completedAt ? formatDateTime(record.completedAt) : '-'}</span>
                </div>
              }
              description={
                <div className="flex flex-col gap-1 text-xs text-[#6e6e73]">
                  <span>学习时长: {record.learningTime ?? 0} 秒</span>
                  <div className="flex justify-between items-center">
                    <span>交易哈希: {record.transactionHash || '-'}</span>
                    <span>学习者: {record.student?.realName || record.student?.username || '-'}</span>
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
