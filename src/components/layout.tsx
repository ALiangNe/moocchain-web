import { Layout as AntLayout } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.tsx';
import Message from './Message.tsx';
import Loading from './Loading.tsx';
import Button from './Button.tsx';

const { Content } = AntLayout;

export default function Layout() {
  const location = useLocation();

  return (
    <AntLayout className="min-h-screen bg-gray-50">
      <Loading />
      <Message />
      <Button />
      <Header />
      <Content className="flex-1 w-full">
        {/* 当 key 变化时，React 会销毁旧元素并创建新元素，触发 fadeIn 动画 */}
        <div key={location.pathname} className="page-content">
          <Outlet />
        </div>
      </Content>
    </AntLayout>
  );
}
