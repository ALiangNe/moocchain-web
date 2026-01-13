import { Table, Button, Tag, Pagination, Avatar, Image } from 'antd';
import { EyeOutlined, UserOutlined } from '@ant-design/icons';
import type { AuditRecordInfo } from '@/types/auditRecordType';
import { formatDate } from '@/utils/formatTime';

interface AuditRecordTableProps {
  data: AuditRecordInfo[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  onViewDetail: (record: AuditRecordInfo) => void;
}

export default function AuditRecordTable({ data, loading, page, pageSize, total, onPageChange, onViewDetail }: AuditRecordTableProps) {
  // 获取用户头像地址
  const getAvatarUrl = (avatar?: string) => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http')) return avatar;
    const baseUrl = import.meta.env.VITE_API_BASE_URL.split('/api')[0];
    return `${baseUrl}${avatar}`;
  };

  const columns = [
    {
      title: '头像',
      key: 'avatar',
      width: 100,
      render: (_: unknown, record: AuditRecordInfo) => {
        const avatarUrl = getAvatarUrl(record.targetUser?.avatar);
        if (!avatarUrl) {
          return <Avatar icon={<UserOutlined />} size="large" />;
        }
        return (
          <Image src={avatarUrl} alt={record.targetUser?.realName || record.targetUser?.username || '头像'} width={40} height={40} preview={{ mask: '预览', }} style={{ borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23f0f0f0'/%3E%3Cpath d='M50 30c-8.3 0-15 6.7-15 15s6.7 15 15 15 15-6.7 15-15-6.7-15-15-15zm0 40c-11 0-20 5-20 11.1v7.9h40v-7.9c0-6.1-9-11.1-20-11.1z' fill='%23999'/%3E%3C/svg%3E" />
        );
      },
    },
    {
      title: '申请人',
      key: 'applicant',
      render: (_: unknown, record: AuditRecordInfo) => {
        const name = record.targetUser?.realName || record.targetUser?.username || '-';
        return name;
      },
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
      title: '申请日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: Date | string | null | undefined) => formatDate(time),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: AuditRecordInfo) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => onViewDetail(record)} className="focus:outline-none focus:shadow-none">
          查看详情
        </Button>
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
