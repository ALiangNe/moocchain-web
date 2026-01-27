import { useState } from 'react';
import { Button, Form, Input, AutoComplete, Checkbox } from 'antd';
import { UserAddOutlined, UserOutlined, MailOutlined, LockOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';

// 常见邮箱后缀
const EMAIL_SUFFIXES = ['@gmail.com', '@qq.com', '@163.com', '@126.com', '@sina.com', '@outlook.com', '@tom.com', '@icloud.com'];

interface RegisterFormProps {
  onFinish: (values: { username: string; password: string; email: string }, agreedToTerms: boolean) => void;
  loading?: boolean;
}

export default function RegisterForm({ onFinish, loading = false }: RegisterFormProps) {
  const [emailOptions, setEmailOptions] = useState<{ value: string; label: string }[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // 处理邮箱输入搜索，生成补全选项
  const handleEmailSearch = (value: string) => {
    if (!value) {
      setEmailOptions([]);
      return;
    }

    if (!value.includes('@')) {
      // 如果没有 @ 符号，且有输入内容，显示所有常见后缀（假设用户输入的是前缀）
      const options = EMAIL_SUFFIXES.map((suffix) => ({
        value: value + suffix,
        label: value + suffix,
      }));
      setEmailOptions(options);
      return;
    }

    const [prefix, suffix] = value.split('@');
    if (!prefix) {
      // 如果只有 @ 符号，不显示选项
      setEmailOptions([]);
      return;
    }

    // 根据已输入的后缀进行过滤匹配
    const matchedSuffixes = EMAIL_SUFFIXES.filter((emailSuffix) => emailSuffix.toLowerCase().startsWith('@' + (suffix || '').toLowerCase()));

    const options = matchedSuffixes.map((emailSuffix) => ({
      value: prefix + emailSuffix,
      label: prefix + emailSuffix,
    }));
    setEmailOptions(options);
  };

  const handleFormFinish = (values: { username: string; password: string; email: string }) => {
    onFinish(values, agreedToTerms);
  };

  return (
    <Form name="register" onFinish={handleFormFinish} layout="vertical" autoComplete="off" className="flex flex-col gap-2">
      <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <UserOutlined className="w-4 h-4" />
            用户名
          </label>
          <Input placeholder="请输入用户名" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" />
        </div>
      </Form.Item>

      <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <MailOutlined className="w-4 h-4" />
            邮箱地址
          </label>
          <AutoComplete placeholder="请输入邮箱" options={emailOptions} onSearch={handleEmailSearch} className="w-full [&_.ant-input]:rounded-xl [&_.ant-input]:border-slate-200 [&_.ant-input]:bg-slate-50/50 [&_.ant-input]:px-4 [&_.ant-input]:py-3 [&_.ant-input]:text-sm [&_.ant-input]:placeholder:text-slate-400 [&_.ant-input]:focus:outline-none [&_.ant-input]:focus:ring-2 [&_.ant-input]:focus:ring-blue-500 [&_.ant-input]:focus:border-transparent [&_.ant-input]:transition-all [&_.ant-input]:duration-200">
            <Input />
          </AutoComplete>
        </div>
      </Form.Item>

      <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 8, message: '密码至少8个字符' }]}>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <LockOutlined className="w-4 h-4" />
            创建密码
          </label>
          <div className="relative">
            <Input type={showPassword ? 'text' : 'password'} placeholder="至少8个字符" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-12 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" />
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
        <label className="flex items-center gap-3 text-sm select-none cursor-pointer">
          <Checkbox checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} />
          <span className="text-slate-600 leading-relaxed">
            我同意 MOOC Chain{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">服务条款</a>
            {' '}和{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">隐私政策</a>
          </span>
        </label>
      </Form.Item>

      <Form.Item className="mb-0">
        <Button type="primary" htmlType="submit" loading={loading} block className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3.5 rounded-xl hover:shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)] hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center gap-2 border-none h-auto">
          <UserAddOutlined className="w-5 h-5" />
          创建账户
        </Button>
      </Form.Item>
    </Form>
  );
}
