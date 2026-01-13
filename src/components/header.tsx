import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Button, Dropdown, message } from 'antd';
import type { MenuProps } from 'antd';
import { DownOutlined, LogoutOutlined, UserOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { UserRole, RoleName, type UserRoleType } from '@/constants/role';
import { useAuthStore } from '@/stores/authStore';
import { logout } from '@/api/authApi';
import icon from '@/assets/images/moocchain-icon.png';

const { Header: AntHeader } = Layout;

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // 根据角色获取菜单项
  const getMenuItems = (role?: number) => {
    const baseItems = [
      { path: '/home', label: '首页' },
      { path: '/courselearn', label: '课程学习' },
    ];

    if (role === UserRole.TEACHER || role === UserRole.ADMIN) {
      baseItems.push({ path: '/coursemgmt', label: '课程管理' });
    }

    if (role === UserRole.ADMIN) {
      baseItems.push({ path: '/user', label: '用户管理' });
      baseItems.push({ path: '/audit', label: '审核管理' });
    }

    return baseItems;
  };

  const menuItems = getMenuItems(user?.role);

  // 退出登录
  const handleLogout = async () => {
    await logout(); // 调用后端接口清除 HttpOnly Cookie
    message.success('已退出登录');
    navigate('/');
  };

  // 用户下拉菜单
  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', label: '个人资料', icon: <UserOutlined />, onClick: () => navigate('/profile'), className: location.pathname === '/profile' ? 'ant-menu-item-selected' : '', },
    ...(user && (user.role === UserRole.STUDENT || user.role === UserRole.TEACHER) ? [{ key: 'teacherApply', label: '教师认证', icon: <SafetyCertificateOutlined />, onClick: () => navigate('/teacherApply'), className: location.pathname === '/teacherApply' ? 'ant-menu-item-selected' : '', }] : []),
    { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: handleLogout },
  ];

  // 获取当前选中的菜单项
  const selectedKeys = [];
  if (location.pathname === '/profile') {
    selectedKeys.push('profile');
  } else if (location.pathname === '/teacherApply') {
    selectedKeys.push('teacherApply');
  }

  return (
    <AntHeader className="bg-white shadow-sm px-0 sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-full justify-between">
        {/* 左侧 Logo 和标题 */}
        <Link to={user ? '/home' : '/'} className="flex items-center space-x-2 text-xl font-bold text-[#1d1d1f] hover:text-[#007aff] transition-colors duration-200 no-underline flex-shrink-0">
          <img src={icon} alt="MOOC Chain" className="h-8 w-8" />
          <span>MOOC Chain</span>
        </Link>

        {/* 中间导航菜单 - 居中 */}
        {user && (
          <div className="flex-1 flex justify-center">
            <nav className="flex items-center gap-8">
              {menuItems.map((item) => (
                <Link key={item.path} to={item.path} className={`text-base font-medium no-underline transition-colors duration-200 ${location.pathname === item.path ? 'text-[#007aff] border-b-2 border-[#007aff] pb-1 hover:text-[#007aff]' : 'text-[#1d1d1f] hover:text-[#007aff]'}`}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* 右侧用户信息或登录/注册按钮 */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {user ? (
            <Dropdown menu={{ items: userMenuItems, selectedKeys }} placement="bottomRight">
              <Button type="text" className="text-[#1d1d1f] hover:text-[#007aff] focus:outline-none focus:shadow-none flex items-center gap-2">
                <span>{user.username}</span>
                <span className="text-[#6e6e73] text-sm">({user.role != null && user.role in RoleName ? RoleName[user.role as UserRoleType] : '未知角色'})</span>
                <DownOutlined className="text-xs" />
              </Button>
            </Dropdown>
          ) : (
            <>
              <Link to="/login" className="no-underline">
                <Button type="text" className="text-[#1d1d1f] hover:text-[#007aff] focus:outline-none focus:shadow-none">
                  登录
                </Button>
              </Link>
              <Link to="/register" className="no-underline">
                <Button type="primary" className="focus:outline-none focus:shadow-none">
                  注册
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </AntHeader>
  );
}

