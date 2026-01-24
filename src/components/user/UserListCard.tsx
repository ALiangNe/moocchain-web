import { Card, Pagination, Tag, Button, Space, Avatar } from 'antd';
import { EditOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons';
import type { UserInfo } from '@/types/userType';
import { RoleName } from '@/constants/role';

interface UserListCard {
  users: UserInfo[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  onEdit?: (user: UserInfo) => void;
  onView?: (user: UserInfo) => void;
}

export default function UserListCard({ users, loading, page, pageSize, total, onPageChange, onEdit, onView }: UserListCard) {
  const getAvatarUrl = (avatar?: string) => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http')) return avatar;
    const baseUrl = import.meta.env.VITE_API_BASE_URL.split('/api')[0];
    return `${baseUrl}${avatar}`;
  };
  const getRoleTagColor = (role?: number) => role === 0 ? 'gold' : role === 4 ? 'blue' : role === 5 ? 'default' : 'default';
  const getRoleName = (role?: number) => role === 0 || role === 4 || role === 5 ? RoleName[role] : '未知';

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <Card key={user.userId} className="shadow-sm hover:shadow-md transition-shadow border border-gray-200">
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-start gap-4 flex-1">
              <Avatar src={getAvatarUrl(user.avatar)} size={48} icon={<UserOutlined />} />
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-[#1d1d1f]">{user.realName || user.username || '-'}</h3>
                  <Tag color={getRoleTagColor(user.role)}>{getRoleName(user.role)}</Tag>
                  <Tag color={user.walletAddress ? 'green' : 'default'}>{user.walletAddress ? '已绑定钱包' : '未绑定钱包'}</Tag>
                </div>
                <div className="text-sm text-[#6e6e73] mt-2 flex flex-wrap gap-x-6 gap-y-1">
                  <span>{user.email || '-'}</span>
                  <span>{user.schoolName || '-'}</span>
                </div>
              </div>
            </div>
            <Space>
              {onView && <Button type="link" icon={<EyeOutlined />} onClick={() => onView(user)} className="text-[#007aff] focus:outline-none focus:shadow-none">查看</Button>}
              {onEdit && <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(user)} className="text-[#007aff] focus:outline-none focus:shadow-none">编辑</Button>}
            </Space>
          </div>
        </Card>
      ))}
      {users.length === 0 && !loading && <div className="text-center text-[#6e6e73] py-12"><p>暂无用户数据</p></div>}
      <div className="flex justify-end mt-4">
        <Pagination current={page} pageSize={pageSize} total={total} onChange={onPageChange} showSizeChanger pageSizeOptions={['8', '16', '32', '64']} showTotal={(total) => `共 ${total} 条数据`} locale={{ items_per_page: '条/页' }} />
      </div>
    </div>
  );
}

