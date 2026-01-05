import { useEffect, useRef } from 'react';
import { Layout as AntLayout } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from './header.tsx';
import Message from './message.tsx';
import { refreshToken } from '../api/authApi.ts';
import { useAuthStore } from '../stores/authStore.ts';

const { Content } = AntLayout;

export default function Layout() {
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      refreshToken().catch((error) => {
        console.error('初始化认证状态失败:', error);
      });
    }
  }, []);

  return (
    <AntLayout className="min-h-screen bg-gray-50">
      <Message />
      <Header />
      <Content className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <Outlet />
        </div>
      </Content>
    </AntLayout>
  );
}
