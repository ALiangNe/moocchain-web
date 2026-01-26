import { List, Empty, Spin, Pagination, Tag } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import type { CertificateInfo } from '@/types/certificateType';
import { formatDateTime } from '@/utils/formatTime';

interface CertificateRecordListProps {
  data: CertificateInfo[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
}

export default function CertificateRecordList({ data, loading, page, pageSize, total, onPageChange }: CertificateRecordListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Spin size="large" />
      </div>
    );
  }

  if (!data.length) {
    return <Empty description="暂无铸造证书记录" />;
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
                  <TrophyOutlined className="text-[#ffc107] text-3xl" />
                </div>
              }
              title={
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-[#1d1d1f]">{record.course?.courseName || '未知课程'} 证书</span>
                    {record.certificateNftId && <Tag color="blue">NFT #{record.certificateNftId}</Tag>}
                  </div>
                  <span className="text-xs text-[#6e6e73]">{record.createdAt ? formatDateTime(record.createdAt) : '-'}</span>
                </div>
              }
              description={
                <div className="flex flex-col gap-1 text-xs text-[#6e6e73]">
                  {/* <span>课程ID: {record.courseId || '-'}</span> */}
                  <span>IPFS哈希: {record.ipfsHash || '-'}</span>
                  <div className="flex justify-between items-center">
                    <span>交易哈希: {record.transactionHash || '-'}</span>
                    <span>铸造者: {record.student?.realName || record.student?.username || '-'}</span>
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
