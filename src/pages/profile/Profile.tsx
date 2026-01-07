import { useState } from 'react';
import { Card, Spin, message } from 'antd';
import { useAuthStore } from '../../stores/authStore';
import UserCard from '../../components/user/UserCard';
import UserProfileForm from '../../components/user/UserProfileForm';
import { updateUser } from '../../api/baseApi';
import type { UserInfo } from '../../types/userType';

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (values: Partial<UserInfo>) => {
    setLoading(true);
    
    let result;
    try {
      result = await updateUser(values);
    } catch (error) {
      console.error('Update profile error:', error);
      message.error('更新失败，请重试');
      setLoading(false);
      return;
    }
    
    setLoading(false);
      
      if (result.code !== 0) {
        message.error(result.message || '更新失败');
        return;
      }
      
      if (!result.data) {
        message.error('更新失败，未返回数据');
        return;
      }
      
      setAuth(accessToken, result.data);
      message.success('个人信息更新成功');
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-[#1d1d1f]">个人资料</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="shadow-sm">
              <UserCard user={user} />
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <h2 className="text-xl font-semibold mb-6 text-[#1d1d1f]">编辑资料</h2>
              <UserProfileForm user={user} onSubmit={handleUpdateProfile} loading={loading} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
