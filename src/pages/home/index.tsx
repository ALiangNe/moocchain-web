import { useAuthStore } from '../../stores/authStore';

export default function Home() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-[#1d1d1f]">欢迎回来</h1>
        <p className="text-lg text-[#6e6e73] mb-8">这是您的个人主页，只有登录后才能访问。</p>
        {user && (
          <div className="bg-[#f5f5f7] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-[#1d1d1f]">用户信息</h2>
            <div className="space-y-2 text-[#1d1d1f]">
              {user.username && <p><span className="font-medium">用户名：</span>{user.username}</p>}
              {user.email && <p><span className="font-medium">邮箱：</span>{user.email}</p>}
              {user.userId && <p><span className="font-medium">用户ID：</span>{user.userId}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


