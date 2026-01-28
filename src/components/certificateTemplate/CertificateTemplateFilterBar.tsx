import { Button, DatePicker, Select, Space } from 'antd';
import type { Dayjs } from 'dayjs';
import { SearchOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

export type TemplateActiveFilter = 0 | 1 | undefined; // 0:禁用 1:启用

export interface CertificateTemplateFilterBarProps {
  isActive: TemplateActiveFilter;
  onIsActiveChange: (value: TemplateActiveFilter) => void;
  dateRange: [Dayjs | null, Dayjs | null] | null;
  onDateRangeChange: (value: [Dayjs | null, Dayjs | null] | null) => void;
  onSearch: () => void;
}

export default function CertificateTemplateFilterBar({
  isActive,
  onIsActiveChange,
  dateRange,
  onDateRangeChange,
  onSearch,
}: CertificateTemplateFilterBarProps) {
  return (
    <Space size="middle" wrap>
      <div>
        <span className="text-sm text-[#6e6e73] mr-2">启用状态：</span>
        <Select
          placeholder="请选择启用状态"
          value={isActive}
          onChange={(value) => onIsActiveChange(value as TemplateActiveFilter)}
          allowClear
          style={{ width: 200 }}
        >
          <Select.Option value={1}>启用</Select.Option>
          <Select.Option value={0}>禁用</Select.Option>
        </Select>
      </div>
      <div>
        <span className="text-sm text-[#6e6e73] mr-2">日期范围：</span>
        <RangePicker value={dateRange} onChange={onDateRangeChange} style={{ width: 260 }} />
      </div>
      <Button icon={<SearchOutlined />} onClick={onSearch} className="rounded-lg" style={{ backgroundColor: '#fff' }} >
        查询
      </Button>
    </Space>
  );
}
