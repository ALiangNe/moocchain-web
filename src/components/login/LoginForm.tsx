import { useState } from 'react';
import { Button, Form, Input } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeOutlined, LoginOutlined } from '@ant-design/icons';

interface LoginFormProps {
  onFinish: (values: { username: string; password: string }) => void;
  loading?: boolean;
}

export default function LoginForm({ onFinish, loading = false }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Form name="login" onFinish={onFinish} layout="vertical" autoComplete="off" className="flex flex-col gap-2">
      <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <UserOutlined className="w-4 h-4" />
            用户名
          </label>
          <Input placeholder="请输入用户名" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" />
        </div>
      </Form.Item>

      <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <LockOutlined className="w-4 h-4" />
            密码
          </label>
          <div className="relative">
            <Input type={showPassword ? 'text' : 'password'} placeholder="请输入密码" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-12 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              {showPassword ? (
                <EyeOutlined className="w-5 h-5" />
              ) : (
                <EyeInvisibleOutlined className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </Form.Item>

      <Form.Item className="mb-0">
        <Button type="primary" htmlType="submit" loading={loading} block className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3.5 rounded-xl hover:shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)] hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center gap-2 border-none h-auto">
          <LoginOutlined className="w-5 h-5" />
          登录
        </Button>
      </Form.Item>
    </Form>
  );
}
