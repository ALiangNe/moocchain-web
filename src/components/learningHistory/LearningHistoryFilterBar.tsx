import { Button, Input, Select, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

export interface LearningHistoryFilterBarProps {
  teacherName: string;
  onTeacherNameChange: (value: string) => void;
  resourceType: number | undefined;
  onResourceTypeChange: (value: number | undefined) => void;
  isCompleted: number | undefined;
  onIsCompletedChange: (value: number | undefined) => void;
  onSearch: () => void;
}

export default function LearningHistoryFilterBar({
  teacherName,
  onTeacherNameChange,
  resourceType,
  onResourceTypeChange,
  isCompleted,
  onIsCompletedChange,
  onSearch,
}: LearningHistoryFilterBarProps) {
  return (
    <Space size="middle" wrap>
      <div>
        <span className="text-sm text-[#6e6e73] mr-2">老师姓名：</span>
        <Input placeholder="请输入老师姓名" value={teacherName} onChange={(e) => onTeacherNameChange(e.target.value)} onPressEnter={onSearch} allowClear style={{ width: 200 }} />
      </div>
      <div>
        <span className="text-sm text-[#6e6e73] mr-2">资源类型：</span>
        <Select placeholder="请选择资源类型" value={resourceType} onChange={onResourceTypeChange} allowClear style={{ width: 200 }}>
          <Select.Option value={0}>其他</Select.Option>
          <Select.Option value={1}>文档</Select.Option>
          <Select.Option value={2}>音频</Select.Option>
          <Select.Option value={3}>视频</Select.Option>
        </Select>
      </div>
      <div>
        <span className="text-sm text-[#6e6e73] mr-2">是否完成：</span>
        <Select placeholder="请选择是否完成" value={isCompleted} onChange={onIsCompletedChange} allowClear style={{ width: 200 }}>
          <Select.Option value={0}>未完成</Select.Option>
          <Select.Option value={1}>已完成</Select.Option>
        </Select>
      </div>
      <Button icon={<SearchOutlined />} onClick={onSearch} className="rounded-lg" style={{ backgroundColor: '#fff' }}>查询</Button>
    </Space>
  );
}
