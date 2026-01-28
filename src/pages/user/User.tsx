import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Drawer, message } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { getUserList, adminUpdateUser } from '@/api/baseApi';
import type { UserInfo } from '@/types/userType';
import { UserRole } from '@/constants/role';
import UserListCard from '@/components/user/UserListCard';
import UserForm from '@/components/user/UserForm';
import UserDetail from '@/components/user/UserDetail';
import UserFilterBar, { type UserRoleFilter } from '@/components/user/UserFilterBar';

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

  // 筛选条件（真正用于请求的）
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>(undefined);
  const [schoolFilter, setSchoolFilter] = useState<string | undefined>(undefined);
  // 临时输入状态，点击查询按钮后才同步到筛选条件
  const [roleInput, setRoleInput] = useState<UserRoleFilter>(undefined);
  const [schoolInput, setSchoolInput] = useState<string | undefined>(undefined);

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
      const params: {
        page: number;
        pageSize: number;
        role?: number;
        schoolName?: string;
      } = {
        page,
        pageSize,
      };

      if (roleFilter !== undefined) {
        params.role = roleFilter;
      }
      if (schoolFilter) {
        params.schoolName = schoolFilter;
      }

      result = await getUserList(params);
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
  }, [user, page, pageSize, roleFilter, schoolFilter]);

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

  // 处理筛选输入变化（只更新临时状态，不触发查询）
  const handleRoleInputChange = (value: UserRoleFilter) => {
    setRoleInput(value);
  };

  const handleSchoolInputChange = (value: string | undefined) => {
    setSchoolInput(value);
  };

  // 点击查询按钮，将临时状态同步到实际筛选条件并触发查询
  const handleSearch = () => {
    setRoleFilter(roleInput);
    setSchoolFilter(schoolInput);
    setPage(1);
  };

  // 学校下拉选项：从当前用户列表中收集去重后的 schoolName
  const schoolOptions = Array.from(
    new Set(
      users
        .map((u) => u.schoolName)
        .filter((name): name is string => !!name && name.trim().length > 0),
    ),
  );

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
          <div className="flex justify-start items-center mb-2">
            <UserFilterBar role={roleInput} onRoleChange={handleRoleInputChange} schoolName={schoolInput} onSchoolChange={handleSchoolInputChange} schoolOptions={schoolOptions} onSearch={handleSearch} />
          </div>
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

