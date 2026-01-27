import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Button, Dropdown, message, Avatar } from 'antd';
import type { MenuProps } from 'antd';
import { DownOutlined, LogoutOutlined, UserOutlined, SafetyCertificateOutlined, AppstoreOutlined } from '@ant-design/icons';
import { UserRole, RoleName, type UserRoleType } from '@/constants/role';
import { useAuthStore } from '@/stores/authStore';
import { logout } from '@/api/authApi';
import icon from '@/assets/images/moocchain-icon.png';

const { Header: AntHeader } = Layout;

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // 获取用户头像地址
  const getAvatarUrl = (avatar?: string) => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http')) return avatar;
    const baseUrl = import.meta.env.VITE_API_BASE_URL.split('/api')[0];
    return `${baseUrl}${avatar}`;
  };

  // 平台管理菜单项（仅管理员）
  const platformManagementItems: MenuProps['items'] = [
    { key: '/audit', label: <span style={{ display: 'block', textAlign: 'center' }}>审核管理</span>, onClick: () => navigate('/audit') },
    { key: '/user', label: <span style={{ display: 'block', textAlign: 'center' }}>用户管理</span>, onClick: () => navigate('/user') },
    { key: '/certificateTemplate', label: <span style={{ display: 'block', textAlign: 'center' }}>证书模板</span>, onClick: () => navigate('/certificateTemplate') },
    { key: '/tokenRule', label: <span style={{ display: 'block', textAlign: 'center' }}>代币规则</span>, onClick: () => navigate('/tokenRule') },
  ];

  // 根据角色获取菜单项
  const getMenuItems = (role?: number) => {
    const baseItems = [
      { path: '/home', label: '首页' },
      { path: '/courseLearn', label: '课程学习' },
      { path: '/learningHistory', label: '学习记录' },
      { path: '/courseCertificate', label: '课程证书' },
      { path: '/blockchainRecord', label: '上链记录' },
    ];

    if (role === UserRole.TEACHER || role === UserRole.ADMIN) {
      baseItems.push({ path: '/courseMgmt', label: '课程管理' });
    }

    return baseItems;
  };

  const menuItems = getMenuItems(user?.role);

  // 检查路径是否匹配菜单项
  const isMenuItemActive = (itemPath: string) => {
    if (location.pathname === itemPath) return true; // 完全匹配    
    if (itemPath === '/courseLearn' && location.pathname.startsWith('/courseLearn/')) return true; // 对于课程学习，支持子路由匹配    
    if (itemPath === '/courseMgmt' && location.pathname.startsWith('/courseMgmt/')) return true; // 对于课程管理，支持子路由匹配    
    if (itemPath === '/courseCertificate' && location.pathname.startsWith('/courseCertificate/')) return true; // 对于课程证书，支持子路由匹配
    return false;
  };

  // 检查当前路径是否在平台管理菜单中
  const isPlatformManagementActive = user?.role === UserRole.ADMIN && ['/audit', '/user', '/certificateTemplate', '/tokenRule'].includes(location.pathname);

  // 退出登录
  const handleLogout = async () => {
    await logout(); // 调用后端接口清除 HttpOnly Cookie
    message.success('已退出登录');
    navigate('/');
  };

  // 用户下拉菜单
  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', label: <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><UserOutlined /><span>个人资料</span></span>, onClick: () => navigate('/profile'), className: location.pathname === '/profile' ? 'ant-menu-item-selected' : '' },
    ...(user && (user.role === UserRole.STUDENT || user.role === UserRole.TEACHER) ? [{ key: 'teacherApply', label: <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><SafetyCertificateOutlined /><span>教师认证</span></span>, onClick: () => navigate('/teacherApply'), className: location.pathname === '/teacherApply' ? 'ant-menu-item-selected' : '' }] : []),
    { key: 'logout', label: <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><LogoutOutlined /><span>退出登录</span></span>, onClick: handleLogout },
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
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-full justify-between">
        {/* 左侧 Logo 和标题 */}
        <Link to={user ? '/home' : '/'} className="flex items-center space-x-2 text-2xl font-bold text-[#1d1d1f] hover:text-[#007aff] transition-colors duration-200 no-underline flex-shrink-0">
          <img src={icon} alt="MOOC Chain" className="h-10 w-10" />
          <span>MOOC Chain</span>
        </Link>

        {/* 中间导航菜单 - 居左 */}
        {user && (
          <div className="flex-1 flex justify-start">
            <nav className="flex items-center gap-8 ml-12">
              {menuItems.map((item) => (
                <Link key={item.path} to={item.path} className={`text-lg font-medium no-underline transition-colors duration-200 ${isMenuItemActive(item.path) ? 'text-[#007aff] border-b-2 border-[#007aff] pb-1 hover:text-[#007aff]' : 'text-[#1d1d1f] hover:text-[#007aff]'}`}>
                  {item.label}
                </Link>
              ))}
              {user.role === UserRole.ADMIN && (
                <Dropdown menu={{ items: platformManagementItems, selectedKeys: isPlatformManagementActive ? [location.pathname] : [] }} placement="bottomLeft" overlayStyle={{ width: 140 }}>
                  <span className={`text-lg font-medium cursor-pointer transition-colors duration-200 ${isPlatformManagementActive ? 'text-[#007aff] border-b-2 border-[#007aff] pb-1 hover:text-[#007aff]' : 'text-[#1d1d1f] hover:text-[#007aff]'}`}>
                    平台管理 <AppstoreOutlined className="ml-1" />
                  </span>
                </Dropdown>
              )}
            </nav>
          </div>
        )}

        {/* 右侧用户信息或登录/注册按钮 */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {user ? (
            <Dropdown menu={{ items: userMenuItems, selectedKeys }} placement="bottomRight" overlayStyle={{ width: 140 }}>
              <Button type="text" className="text-[#1d1d1f] hover:text-[#007aff] focus:outline-none focus:shadow-none flex items-center gap-2">
                <span className="text-base">{user.username}</span>
                <span className="text-[#6e6e73] text-base">({user.role != null && user.role in RoleName ? RoleName[user.role as UserRoleType] : '未知角色'})</span>
                <Avatar src={getAvatarUrl(user.avatar)} icon={<UserOutlined />} size={40} className="flex-shrink-0" />
                <DownOutlined className="text-sm" />
              </Button>
            </Dropdown>
          ) : (
            <>
              <Link to="/login" className="no-underline">
                <Button type="text" className="text-[#1d1d1f] hover:text-[#007aff] focus:outline-none focus:shadow-none text-lg">
                  登录
                </Button>
              </Link>
              <Link to="/register" className="no-underline">
                <Button type="primary" className="focus:outline-none focus:shadow-none text-lg">
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

