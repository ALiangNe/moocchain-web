import { Layout, Button } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import icon from '../assets/images/moocchain-icon.png';

const { Header: AntHeader } = Layout;

export default function Header() {
  const location = useLocation();

  // 菜单项配置
  const menuItems = [
    { path: '/', label: '首页' },
    { path: '/courses', label: '课程' },
  ];

  return (
    <AntHeader className="bg-white shadow-sm px-0 sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-full">
        {/* 左侧 Logo 和标题 */}
        <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-[#1d1d1f] hover:text-[#007aff] transition-colors duration-200 no-underline flex-shrink-0">
          <img src={icon} alt="MOOC Chain" className="h-8 w-8" />
          <span>MOOC Chain</span>
        </Link>

        {/* 中间导航菜单 - 居中 */}
        <div className="flex-1 flex justify-center">
          <nav className="flex items-center gap-8">
            {menuItems.map((item) => (
              <Link key={item.path} to={item.path} className={`text-base font-medium no-underline transition-colors duration-200 ${location.pathname === item.path ? 'text-[#007aff] border-b-2 border-[#007aff] pb-1' : 'text-[#1d1d1f] hover:text-[#007aff]'}`}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* 右侧登录/注册按钮 */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link to="/login" className="no-underline">
            <Button type="text" className="text-[#1d1d1f] hover:text-[#007aff] focus:outline-none focus:shadow-none">
              登录
            </Button>
          </Link>
          <Link to="/register" className="no-underline">
            <Button type="primary" style={{ background: '#007aff', border: 'none', outline: 'none', boxShadow: 'none' }} className="focus:outline-none focus:shadow-none">
              注册
            </Button>
          </Link>
        </div>
      </div>
    </AntHeader>
  );
}

