import { Table, Button, Tag, Space, Pagination } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import type { AuditRecordInfo } from '../../types/auditRecordType';
import { formatDateTime } from '../../utils/timeUtils';

interface AuditRecordTableProps {
  data: AuditRecordInfo[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  onViewDetail: (record: AuditRecordInfo) => void;
  onApprove: (record: AuditRecordInfo, status: number) => void;
}

export default function AuditRecordTable({ data, loading, page, pageSize, total, onPageChange, onViewDetail, onApprove, }: AuditRecordTableProps) {
  const columns = [
    {
      title: '用户名',
      key: 'targetUsername',
      render: (_: unknown, record: AuditRecordInfo) => record.targetUser?.username || '-',
    },
    {
      title: '邮箱',
      key: 'targetEmail',
      render: (_: unknown, record: AuditRecordInfo) => record.targetUser?.email || '-',
    },
    {
      title: '学校',
      key: 'targetSchoolName',
      render: (_: unknown, record: AuditRecordInfo) => record.targetUser?.schoolName || '-',
    },
    {
      title: '审核状态',
      dataIndex: 'auditStatus',
      key: 'auditStatus',
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
      title: '审批人',
      key: 'auditorUsername',
      render: (_: unknown, record: AuditRecordInfo) => {
        // 只有审核完成后才显示审批人
        if (record.auditStatus !== 0 && record.auditor?.username) {
          return record.auditor.username;
        }
        return '-';
      },
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: Date) => formatDateTime(time),
    },
    {
      title: '审核时间',
      dataIndex: 'auditTime',
      key: 'auditTime',
      render: (time: Date) => formatDateTime(time),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: AuditRecordInfo) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => onViewDetail(record)} className="focus:outline-none focus:shadow-none">
            查看详情
          </Button>
          {record.auditStatus === 0 && (
            <>
              <Button type="link" danger icon={<CloseOutlined />} onClick={() => onApprove(record, 2)} className="focus:outline-none focus:shadow-none">
                拒绝
              </Button>
              <Button type="link" icon={<CheckOutlined />} onClick={() => onApprove(record, 1)} className="focus:outline-none focus:shadow-none">
                通过
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table columns={columns} dataSource={data} rowKey="auditId" loading={loading} pagination={false} />
      <div className="mt-4 flex justify-end">
        <Pagination current={page} pageSize={pageSize} total={total} onChange={onPageChange} showSizeChanger showTotal={(total) => `共 ${total} 条`} />
      </div>
    </>
  );
}
