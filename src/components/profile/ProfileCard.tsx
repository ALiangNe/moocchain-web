import type { UserInfo } from '@/types/userType.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import AvatarUpload from './AvatarUpload.tsx';

interface ProfileCardProps {
  user?: UserInfo | null;
}

export default function ProfileCard({ user: userProp }: ProfileCardProps) {
  const storeUser = useAuthStore((state) => state.user);
  const user = userProp ?? storeUser;

  return (
    <div className="flex flex-col items-center">
      <AvatarUpload user={user} />
      <div className="mt-4 text-center">
        <h2 className="text-2xl font-bold text-[#1d1d1f]">{user?.username || '未知用户'}</h2>
        <p className="text-[#6e6e73] mt-1">{user?.email || '未设置邮箱'}</p>
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-200 w-full">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-[#6e6e73]">用户ID</p>
            <p className="text-base text-[#1d1d1f] font-medium">{user?.userId || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6e6e73]">用户名</p>
            <p className="text-base text-[#1d1d1f] font-medium">{user?.username || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6e6e73]">钱包地址</p>
            <p className="text-base text-[#1d1d1f] font-medium break-all">{user?.walletAddress || '未绑定'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6e6e73]">代币余额</p>
            <p className="text-base text-[#1d1d1f] font-medium">{user?.tokenBalance !== undefined ? user.tokenBalance : '0.00'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
