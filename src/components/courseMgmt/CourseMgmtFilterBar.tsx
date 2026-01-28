import { Button, DatePicker, Input, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

export interface CourseMgmtFilterBarProps {
  teacherName: string;
  onTeacherNameChange: (value: string) => void;
  dateRange: [Dayjs | null, Dayjs | null] | null;
  onDateRangeChange: (dates: [Dayjs | null, Dayjs | null] | null) => void;
  onSearch: () => void;
}

export default function CourseMgmtFilterBar({
  teacherName,
  onTeacherNameChange,
  dateRange,
  onDateRangeChange,
  onSearch,
}: CourseMgmtFilterBarProps) {
  return (
    <Space size="middle" wrap>
      <div>
        <span className="text-sm text-[#6e6e73] mr-2">老师姓名：</span>
        <Input placeholder="请输入老师姓名" value={teacherName} onChange={(e) => onTeacherNameChange(e.target.value)} onPressEnter={onSearch} allowClear style={{ width: 200 }} />
      </div>
      <div>
        <span className="text-sm text-[#6e6e73] mr-2">开课时间：</span>
        <RangePicker value={dateRange} onChange={onDateRangeChange} format="YYYY-MM-DD" allowClear />
      </div>
      <Button icon={<SearchOutlined />} onClick={onSearch} className="rounded-lg" style={{ backgroundColor: '#fff' }}>查询</Button>
    </Space>
  );
}
