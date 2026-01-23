import { Button } from 'antd';
import type { UserInfo } from '@/types/userType.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import AvatarUpload from './AvatarUpload.tsx';

interface ProfileCardProps {
  user?: UserInfo | null;
  walletAddress?: string | null;
  walletChecking?: boolean;
  onConnectWallet?: () => Promise<void> | void;
  tokenBalance?: string | null;
  tokenBalanceChecking?: boolean;
}

export default function ProfileCard({ user: userProp, walletAddress, walletChecking, onConnectWallet, tokenBalance, tokenBalanceChecking }: ProfileCardProps) {
  const storeUser = useAuthStore((state) => state.user);
  const user = userProp ?? storeUser;
  const addressToShow = walletAddress || user?.walletAddress || null;

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
            <p className="text-base text-[#1d1d1f] font-medium break-all">
              {walletChecking
                ? '正在检测钱包连接状态...' : addressToShow
                  ? addressToShow : onConnectWallet && (<Button type="link" size="small" onClick={() => onConnectWallet()} className="p-0 h-auto">未检测到钱包地址，点击连接 MetaMask...</Button>)}
            </p>
          </div>
          <div>
            <p className="text-sm text-[#6e6e73]">代币余额</p>
            <p className="text-base text-[#1d1d1f] font-medium">
              {walletChecking
                ? '正在检测钱包连接状态...'
                : !addressToShow
                  ? onConnectWallet && (<Button type="link" size="small" onClick={() => onConnectWallet()} className="p-0 h-auto">未检测到代币余额，点击连接 MetaMask...</Button>)
                  : tokenBalanceChecking
                    ? '正在获取代币余额...'
                    : tokenBalance !== null
                      ? tokenBalance
                      : user?.tokenBalance !== undefined
                        ? user.tokenBalance
                        : '0.00'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
