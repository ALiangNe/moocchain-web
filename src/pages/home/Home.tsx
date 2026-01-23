import { Card } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import HomeBanner from '@/components/home/HomeBanner';

export default function Home() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="py-12">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <HomeBanner />
        <Card className="shadow-sm mb-8 rounded-2xl">
          <h1 className="text-lg font-semibold text-[#1d1d1f]">欢迎回来</h1>
        </Card>
        {user && (
          <Card className="shadow-sm rounded-2xl">
            <h2 className="text-lg font-semibold mb-4 text-[#1d1d1f]">用户信息</h2>
            <div className="space-y-2 text-[#1d1d1f]">
              {user.username && <p><span className="font-medium">用户名：</span>{user.username}</p>}
              {user.email && <p><span className="font-medium">邮箱：</span>{user.email}</p>}
              {user.userId && <p><span className="font-medium">用户ID：</span>{user.userId}</p>}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}


