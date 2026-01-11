import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Form, Input, AutoComplete, message } from 'antd';
import { register } from '../../api/baseApi';
import type { ResponseType } from '../../types/responseType';
import type { UserInfo } from '../../types/userType';

// 常见邮箱后缀
const EMAIL_SUFFIXES = ['@gmail.com', '@qq.com', '@163.com', '@126.com', '@sina.com', '@outlook.com', '@tom.com', '@icloud.com'];

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [emailOptions, setEmailOptions] = useState<{ value: string; label: string }[]>([]);

  // 处理注册表单提交
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

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] py-12">
      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-lg font-semibold text-center mb-8 text-[#1d1d1f]">注册</h1>

          <Form name="register" onFinish={onFinish} layout="vertical" size="large" autoComplete="off">
            <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input placeholder="请输入用户名" />
            </Form.Item>

            <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password placeholder="请输入密码" />
            </Form.Item>

            <Form.Item label="邮箱" name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}>
              <AutoComplete placeholder="请输入邮箱" options={emailOptions} onSearch={handleEmailSearch} />
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

