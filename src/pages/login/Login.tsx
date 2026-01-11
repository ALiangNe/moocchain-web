import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Form, Input, message } from 'antd';
import { useAuthStore } from '../../stores/authStore';
import type { UserInfo } from '../../types/userType';
import type { ResponseType } from '../../types/responseType';
import { login } from '../../api/baseApi';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  // 处理登录表单提交
  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    let response: ResponseType<UserInfo>;
    try {
      response = await login(values);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '请求失败');
      setLoading(false);
      return;
    }
    setLoading(false);

    if (response.code !== 0) {
      message.error(response.message || '登录失败');
      return;
    }

    // 存储 accessToken 到 Zustand（内存）
    // refreshToken 已由后端设置在 HttpOnly Cookie 中，前端无需处理
    setAuth(response.accessToken || null, response.data || null);

    message.success('登录成功');
    navigate('/home', { replace: true });
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] py-12">
      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-lg font-semibold text-center mb-8 text-[#1d1d1f]">登录</h1>

          <Form name="login" onFinish={onFinish} layout="vertical" size="large" autoComplete="off">
            <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input placeholder="请输入用户名" />
            </Form.Item>

            <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password placeholder="请输入密码" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block style={{ background: '#007aff', border: 'none', height: '40px', outline: 'none', boxShadow: 'none' }} className="focus:outline-none focus:shadow-none">
                登录
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center mt-6">
            <Link to="/register" className="text-[#007aff] hover:text-[#0051d5] no-underline">还没有账号？立即注册</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

