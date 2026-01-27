import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Drawer, message } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { getUserList, adminUpdateUser } from '@/api/baseApi';
import type { UserInfo } from '@/types/userType';
import { UserRole } from '@/constants/role';
import UserListCard from '@/components/user/UserListCard';
import UserForm from '@/components/user/UserForm';
import UserDetail from '@/components/user/UserDetail';

export default function User() {
  const user = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [viewVisible, setViewVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserInfo | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [total, setTotal] = useState(0);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);

  // 获取用户列表
  const loadUsers = useCallback(async () => {
    if (!user?.userId || user.role !== UserRole.ADMIN) return;
    if (loadingRef.current) return;

    const currentRequestId = ++requestIdRef.current;
    loadingRef.current = true;

    queueMicrotask(() => {
      if (requestIdRef.current !== currentRequestId) {
        loadingRef.current = false;
        return;
      }
      setUserLoading(true);
    });

    let result;
    try {
      result = await getUserList({ page, pageSize });
    } catch (error) {
      console.error('Load users error:', error);
      if (requestIdRef.current === currentRequestId) {
        setUserLoading(false);
        loadingRef.current = false;
        message.error('加载失败，请重试');
      }
      return;
    }

    if (requestIdRef.current !== currentRequestId) return;
    setUserLoading(false);
    loadingRef.current = false;

    if (result.code !== 0 || !result.data) {
      message.error(result.message || '加载失败');
      return;
    }

    setUsers(result.data.records || []);
    setTotal(result.data.total || 0);
  }, [user, page, pageSize]);

  useEffect(() => {
    const effectRequestId = requestIdRef.current;
    queueMicrotask(() => {
      loadUsers();
    });
    return () => {
      requestIdRef.current = effectRequestId + 1;
    };
  }, [loadUsers]);

  // 处理编辑用户
  const handleEdit = (u: UserInfo) => {
    setCurrentUser(u);
    setDrawerVisible(true);
  };

  // 处理查看用户详情
  const handleView = (u: UserInfo) => {
    setCurrentUser(u);
    setViewVisible(true);
  };

  // 关闭编辑抽屉
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setCurrentUser(undefined);
  };

  // 关闭查看抽屉
  const handleCloseView = () => {
    setViewVisible(false);
    setCurrentUser(undefined);
  };

  // 更新用户信息
  const handleUpdateUser = async (values: Partial<UserInfo>) => {
    if (!currentUser?.userId) return;
    let result;
    try {
      result = await adminUpdateUser(currentUser.userId, values);
    } catch (error) {
      console.error('Update user error:', error);
      message.error('更新失败，请重试');
      return;
    }

    if (result.code !== 0) {
      message.error(result.message || '更新失败');
      return;
    }

    message.success('用户更新成功');
    setDrawerVisible(false);
    setCurrentUser(undefined);
    loadUsers();
  };

  if (user?.role !== UserRole.ADMIN) {
    return (
      <div className="py-12">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-sm mb-6 rounded-2xl">
            <h1 className="text-lg font-semibold text-[#1d1d1f]">用户管理</h1>
          </Card>
          <Card className="shadow-sm rounded-2xl">
            <p className="text-center text-[#6e6e73]">只有管理员可以访问此页面</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-sm mb-6 rounded-2xl">
          <h1 className="text-lg font-semibold text-[#1d1d1f]">用户管理</h1>
        </Card>
        <Card className="shadow-sm rounded-2xl">
          <UserListCard users={users} loading={userLoading} page={page} pageSize={pageSize} total={total} onPageChange={(p, s) => { setPage(p); setPageSize(s); }} onEdit={handleEdit} onView={handleView} />
        </Card>
        <Drawer title="编辑用户" open={drawerVisible} onClose={handleCloseDrawer} width={720} placement="right">
          <UserForm initialValues={currentUser} onSubmit={handleUpdateUser} onCancel={handleCloseDrawer} />
        </Drawer>
        <UserDetail visible={viewVisible} user={currentUser} onClose={handleCloseView} />
      </div>
    </div>
  );
}

