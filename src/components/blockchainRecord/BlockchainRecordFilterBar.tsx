import { Button, DatePicker, Select, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

export type BlockchainRecordType = 'certificate' | 'uploadReward' | 'learningReward' | 'purchase';

export interface BlockchainRecordFilterBarProps {
  recordType: BlockchainRecordType | undefined;
  onRecordTypeChange: (value: BlockchainRecordType | undefined) => void;
  recordTypeOptions: { value: BlockchainRecordType; label: string }[];
  dateRange: [Dayjs | null, Dayjs | null] | null;
  onDateRangeChange: (dates: [Dayjs | null, Dayjs | null] | null) => void;
  onSearch: () => void;
}

export default function BlockchainRecordFilterBar({
  recordType,
  onRecordTypeChange,
  recordTypeOptions,
  dateRange,
  onDateRangeChange,
  onSearch,
}: BlockchainRecordFilterBarProps) {
  return (
    <Space size="middle" wrap>
      <div>
        <span className="text-sm text-[#6e6e73] mr-2">上链类型：</span>
        <Select placeholder="请选择上链类型" value={recordType} onChange={onRecordTypeChange} allowClear style={{ width: 200 }}>
          {recordTypeOptions.map((opt) => (
            <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
          ))}
        </Select>
      </div>
      <div>
        <span className="text-sm text-[#6e6e73] mr-2">日期范围：</span>
        <RangePicker value={dateRange} onChange={onDateRangeChange} format="YYYY-MM-DD" allowClear />
      </div>
      <Button icon={<SearchOutlined />} onClick={onSearch} className="rounded-lg" style={{ backgroundColor: '#fff' }}>查询</Button>
    </Space>
  );
}
