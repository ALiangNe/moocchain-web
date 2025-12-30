import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Form, Input, message } from 'antd';
import { register } from '../../api';
import type { ResponseType } from '../../types/responseType';
import type { UserInfo } from '../../types/userType';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { username: string; password: string; email: string }) => {
    setLoading(true);
    let response: ResponseType<UserInfo>;
    try {
      response = await register(values);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '请求失败');
      setLoading(false);
      return;
    }
    setLoading(false);

    if (response.code !== 0) {
      message.error(response.message || '注册失败');
      return;
    }

    message.success('注册成功，请登录');
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] py-12">
      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-[#1d1d1f]">注册</h1>

          <Form name="register" onFinish={onFinish} layout="vertical" size="large" autoComplete="off">
            <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input placeholder="请输入用户名" />
            </Form.Item>

            <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password placeholder="请输入密码" />
            </Form.Item>

            <Form.Item label="邮箱" name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}>
              <Input placeholder="请输入邮箱" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block style={{ background: '#007aff', border: 'none', height: '40px', outline: 'none', boxShadow: 'none' }} className="focus:outline-none focus:shadow-none">
                注册
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center mt-6">
            <Link to="/login" className="text-[#007aff] hover:text-[#0051d5] no-underline">已有账号？立即登录</Link>
              </div>
          </div>
      </div>
    </div>
  );
}

