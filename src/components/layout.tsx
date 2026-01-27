import { Layout as AntLayout, ConfigProvider } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';
import Header from './Header.tsx';
import Message from './Message.tsx';
import Loading from './Loading.tsx';
import Button from './Button.tsx';
import DatePicker from './DatePicker.tsx';
import Switch from './Switch.tsx';

const { Content } = AntLayout;

export default function Layout() {
  const location = useLocation();

  return (
    <ConfigProvider locale={zhCN}>
      <AntLayout className="min-h-screen bg-gray-50">
        <Loading />
        <Message />
        <Button />
        <DatePicker />
        <Switch />
        <Header />
        <Content className="flex-1 w-full">
          {/* 当 key 变化时，React 会销毁旧元素并创建新元素，触发 fadeIn 动画 */}
          <div key={location.pathname} className="page-content">
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </ConfigProvider>
  );
}
