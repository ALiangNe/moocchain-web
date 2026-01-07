import { Layout as AntLayout } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from './Header.tsx';
import Message from './Message.tsx';
import Loading from './Loading.tsx';

const { Content } = AntLayout;

export default function Layout() {
  return (
    <AntLayout className="min-h-screen bg-gray-50">
      <Loading />
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
