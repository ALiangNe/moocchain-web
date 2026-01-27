import { Table, Button, Tag, Pagination, Image } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { AuditRecordInfo } from '@/types/auditRecordType';
import { formatDate } from '@/utils/formatTime';

interface ResourceAuditTableProps {
  data: AuditRecordInfo[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  onViewDetail: (record: AuditRecordInfo) => void;
}

export default function ResourceAuditTable({ data, loading, page, pageSize, total, onPageChange, onViewDetail }: ResourceAuditTableProps) {
  const resourceTypeMap: Record<number, { text: string; color: string }> = {
    0: { text: '其他', color: 'default' },
    1: { text: '文档', color: 'blue' },
    2: { text: '音频', color: 'green' },
    3: { text: '视频', color: 'purple' },
  };

  // 获取课程封面图片地址
  const getCoverImageUrl = (coverImage?: string) => {
    if (!coverImage) return undefined;
    if (coverImage.startsWith('http')) return coverImage;
    const baseUrl = import.meta.env.VITE_API_BASE_URL.split('/api')[0];
    return `${baseUrl}${coverImage}`;
  };

  const columns = [
    {
      title: '课程封面',
      key: 'courseCoverImage',
      width: 100,
      render: (_: unknown, record: AuditRecordInfo) => {
        const coverImageUrl = getCoverImageUrl(record.targetResource?.course?.coverImage);
        if (!coverImageUrl) return '-';
        return (
          <Image src={coverImageUrl} alt={record.targetResource?.course?.courseName || '课程封面'} width={40} height={40}
            preview={{
              mask: '预览',
            }}
            style={{ borderRadius: '4px', objectFit: 'cover', cursor: 'pointer' }}
          />
        );
      },
    },
    {
      title: '课程标题',
      key: 'courseTitle',
      width: 120,
      render: (_: unknown, record: AuditRecordInfo) => record.targetResource?.course?.courseName || '-',
    },
    {
      title: '资源标题',
      key: 'resourceTitle',
      width: 200,
      render: (_: unknown, record: AuditRecordInfo) => record.targetResource?.title || '-',
    },
    {
      title: '资源类型',
      key: 'resourceType',
      width: 150,
      render: (_: unknown, record: AuditRecordInfo) => {
        const type = record.targetResource?.resourceType;
        if (type === undefined) return '-';
        const config = resourceTypeMap[type] || resourceTypeMap[0];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '审核状态',
      dataIndex: 'auditStatus',
      key: 'auditStatus',
      width: 120,
      render: (status: number) => {
        const statusMap: Record<number, { text: string; color: string }> = {
          0: { text: '待审核', color: 'processing' },
          1: { text: '已通过', color: 'success' },
          2: { text: '已拒绝', color: 'error' },
        };
        const config = statusMap[status] || statusMap[0];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '上传时间',
      key: 'uploadDate',
      width: 180,
      render: (_: unknown, record: AuditRecordInfo) => formatDate(record.targetResource?.createdAt),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: AuditRecordInfo) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => onViewDetail(record)} className="focus:outline-none focus:shadow-none">查看详情</Button>
      ),
    },
  ];

  return (
    <>
      <Table columns={columns} dataSource={data} rowKey="auditId" loading={loading} pagination={false} />
      <div className="mt-4 flex justify-end">
        <Pagination current={page} pageSize={pageSize} total={total} onChange={onPageChange} showSizeChanger showTotal={(total) => `共 ${total} 条数据`} locale={{ items_per_page: '条/页' }} />
      </div>
    </>
  );
}
