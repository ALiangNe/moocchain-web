import { Button, Select, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { UserRole } from '@/constants/role';

export type UserRoleFilter = number | undefined;

export interface UserFilterBarProps {
  role: UserRoleFilter;
  onRoleChange: (value: UserRoleFilter) => void;
  schoolName: string | undefined;
  onSchoolChange: (value: string | undefined) => void;
  schoolOptions: string[];
  onSearch: () => void;
}

export default function UserFilterBar({
  role,
  onRoleChange,
  schoolName,
  onSchoolChange,
  schoolOptions,
  onSearch,
}: UserFilterBarProps) {
  return (
    <Space size="middle" wrap>
      <div>
        <span className="text-sm text-[#6e6e73] mr-2">角色类型：</span>
        <Select placeholder="请选择角色类型" value={role} onChange={(value) => onRoleChange(value as UserRoleFilter)} allowClear style={{ width: 200 }}  >
          <Select.Option value={UserRole.ADMIN}>管理员</Select.Option>
          <Select.Option value={UserRole.TEACHER}>教师</Select.Option>
          <Select.Option value={UserRole.STUDENT}>学生</Select.Option>
        </Select>
      </div>
      <div>
        <span className="text-sm text-[#6e6e73] mr-2">学校：</span>
        <Select placeholder="请选择学校" value={schoolName} onChange={(value) => onSchoolChange(value as string)} allowClear style={{ width: 200 }}  >
          {schoolOptions.map((school) => (
            <Select.Option key={school} value={school}>
              {school}
            </Select.Option>
          ))}
        </Select>
      </div>
      <Button icon={<SearchOutlined />} onClick={onSearch} className="rounded-lg" style={{ backgroundColor: '#fff' }}  >查询</Button>
    </Space>
  );
}
