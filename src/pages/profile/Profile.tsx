import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, Spin, message } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import ProfileCard from '@/components/profile/ProfileCard';
import ProfileForm from '@/components/profile/ProfileForm';
import { updateUser } from '@/api/baseApi';
import type { UserInfo } from '@/types/userType';
import { ensureWalletConnected, restoreWallet } from '@/utils/wallet';
import { getMOOCTokenBalance } from '@/utils/moocToken';
import { MOOC_TOKEN_ADDRESS } from '@/contracts/contractAddresses';

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(user?.walletAddress ?? null);
  const [walletChecking, setWalletChecking] = useState(true);
  const [tokenBalance, setTokenBalance] = useState<string | null>(null);
  const [tokenBalanceChecking, setTokenBalanceChecking] = useState(true);
  const hasUpdatedRef = useRef(false);

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // 更新用户个人信息
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

  const handleConnectWallet = useCallback(async () => {
    const result = await ensureWalletConnected();
    if (!result) return;
    setWalletAddress(result.address);

    setTokenBalanceChecking(true);
    let balance: string | null = null;
    try {
      balance = await getMOOCTokenBalance({ provider: result.provider, contractAddress: MOOC_TOKEN_ADDRESS, walletAddress: result.address });
    } catch (error) {
      console.error('获取代币余额失败:', error);
    }

    await wait(2000);
    setTokenBalance(balance);
    setTokenBalanceChecking(false);

    // 更新钱包地址和代币余额到数据库
    if (!result.address || balance === null) return;

    const updateData: Partial<UserInfo> = {
      walletAddress: result.address,
      tokenBalance: parseFloat(balance),
    };

    let updateResult;
    try {
      updateResult = await updateUser(updateData);
    } catch (error) {
      console.error('更新钱包地址和代币余额失败:', error);
      return;
    }

    if (updateResult.code !== 0 || !updateResult.data) return;

    setAuth(accessToken, updateResult.data);
  }, [accessToken, setAuth]);

  useEffect(() => {
    void (async () => {
      // 防止重复调用
      if (hasUpdatedRef.current) return;
      hasUpdatedRef.current = true;
      
      const restored = await restoreWallet();
      setTokenBalanceChecking(true);

      if (restored) setWalletAddress(restored.address);

      let balance: string | null = null;
      if (restored) {
        try {
          balance = await getMOOCTokenBalance({ provider: restored.provider, contractAddress: MOOC_TOKEN_ADDRESS, walletAddress: restored.address });
        } catch (error) {
          console.error('获取代币余额失败:', error);
        }
      }

      await wait(2000);
      setTokenBalance(balance);
      setTokenBalanceChecking(false);
      setWalletChecking(false);

      // 更新钱包地址和代币余额到数据库
      if (!restored?.address || balance === null) return;

      // 检查是否需要更新（如果数据库中的值已经和当前值一致，则不需要更新）
      const currentBalance = parseFloat(balance);
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.walletAddress === restored.address && currentUser?.tokenBalance === currentBalance) {
        return;
      }

      const updateData: Partial<UserInfo> = {
        walletAddress: restored.address,
        tokenBalance: currentBalance,
      };

      let updateResult;
      try {
        updateResult = await updateUser(updateData);
      } catch (error) {
        console.error('更新钱包地址和代币余额失败:', error);
        return;
      }

      if (updateResult.code !== 0 || !updateResult.data) return;

      const currentAccessToken = useAuthStore.getState().accessToken;
      const currentSetAuth = useAuthStore.getState().setAuth;
      currentSetAuth(currentAccessToken, updateResult.data);
    })();
  }, []);

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
        <h1 className="text-lg font-semibold mb-8 text-[#1d1d1f]">个人资料</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="shadow-sm">
              <ProfileCard user={user} walletAddress={walletAddress} walletChecking={walletChecking} onConnectWallet={handleConnectWallet} tokenBalance={tokenBalance} tokenBalanceChecking={tokenBalanceChecking} />
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <h2 className="text-lg font-semibold mb-6 text-[#1d1d1f]">编辑资料</h2>
              <ProfileForm user={user} onSubmit={handleUpdateProfile} loading={loading} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
