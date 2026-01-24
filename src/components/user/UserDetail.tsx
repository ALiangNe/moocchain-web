import { Drawer, Card, Descriptions, Tag, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { UserInfo } from '@/types/userType';
import { RoleName } from '@/constants/role';
import { formatDateTime } from '@/utils/formatTime';

interface UserDetail {
  visible: boolean;
  user: UserInfo | undefined;
  onClose: () => void;
}

export default function UserDetail({ visible, user, onClose }: UserDetail) {
  const getAvatarUrl = (avatar?: string) => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http')) return avatar;
    const baseUrl = import.meta.env.VITE_API_BASE_URL.split('/api')[0];
    return `${baseUrl}${avatar}`;
  };
  const getRoleName = (role?: number) => role === 0 || role === 4 || role === 5 ? RoleName[role] : '未知';
  const getRoleTagColor = (role?: number) => role === 0 ? 'gold' : role === 4 ? 'blue' : role === 5 ? 'default' : 'default';

  return (
    <Drawer title="查看用户" open={visible} onClose={onClose} width={720} placement="right">
      {user && (
        <div className="space-y-6">
          {/* 卡片一：基础信息 */}
          <Card title="基础信息" className="shadow-sm">
            <div className="flex items-start gap-6 mb-6">
              <Avatar src={getAvatarUrl(user.avatar)} size={80} icon={<UserOutlined />} />
              <div className="flex-1">
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="用户名">{user.username || '-'}</Descriptions.Item>
                  <Descriptions.Item label="真实姓名">{user.realName || '-'}</Descriptions.Item>
                  <Descriptions.Item label="角色">
                    <Tag color={getRoleTagColor(user.role)}>{getRoleName(user.role)}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="手机号">{user.phone || '-'}</Descriptions.Item>
                  <Descriptions.Item label="学校">{user.schoolName || '-'}</Descriptions.Item>
                  <Descriptions.Item label="邮箱">{user.email || '-'}</Descriptions.Item>
                </Descriptions>
              </div>
            </div>
          </Card>

          {/* 卡片二：额外信息 */}
          <Card title="额外信息" className="shadow-sm">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="钱包绑定">{user.walletAddress ? <Tag color="green">已绑定钱包</Tag> : <Tag>未绑定钱包</Tag>}</Descriptions.Item>
              <Descriptions.Item label="代币余额">{user.tokenBalance ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatDateTime(user.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="修改时间">{formatDateTime(user.updatedAt)}</Descriptions.Item>
              <Descriptions.Item label="钱包地址" span={2}>{user.walletAddress || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      )}
    </Drawer>
  );
}

