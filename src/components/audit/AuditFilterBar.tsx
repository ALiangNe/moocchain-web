import { Button, Select, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

export type AuditTypeOption = 'teacher' | 'resource' | 'course';
export type AuditStatusOption = 0 | 1 | 2; // 0:待审核 1:已通过 2:已拒绝

export interface AuditFilterBarProps {
  auditType: AuditTypeOption | undefined;
  onAuditTypeChange: (value: AuditTypeOption | undefined) => void;
  status: AuditStatusOption | undefined;
  onStatusChange: (value: AuditStatusOption | undefined) => void;
  onSearch: () => void;
}

export default function AuditFilterBar({
  auditType,
  onAuditTypeChange,
  status,
  onStatusChange,
  onSearch,
}: AuditFilterBarProps) {
  return (
    <Space size="middle" wrap>
      <div>
        <span className="text-sm text-[#6e6e73] mr-2">审核类型：</span>
        <Select placeholder="请选择审核类型" value={auditType} onChange={onAuditTypeChange} allowClear style={{ width: 200 }}>
          <Select.Option value="teacher">教师认证</Select.Option>
          <Select.Option value="resource">资源审核</Select.Option>
          <Select.Option value="course">课程审核</Select.Option>
        </Select>
      </div>
      <div>
        <span className="text-sm text-[#6e6e73] mr-2">状态类型：</span>
        <Select placeholder="请选择状态" value={status} onChange={onStatusChange} allowClear style={{ width: 200 }}>
          <Select.Option value={0}>待审核</Select.Option>
          <Select.Option value={1}>已通过</Select.Option>
          <Select.Option value={2}>已拒绝</Select.Option>
        </Select>
      </div>
      <Button icon={<SearchOutlined />} onClick={onSearch} className="rounded-lg" style={{ backgroundColor: '#fff' }}>查询</Button>
    </Space>
  );
}
