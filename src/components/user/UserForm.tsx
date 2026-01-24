import { Form, Input, InputNumber, Button, Select } from 'antd';
import { useEffect, useMemo } from 'react';
import type { UserInfo } from '@/types/userType';
import { UserRole } from '@/constants/role';

interface UserForm {
  initialValues?: Partial<UserInfo>;
  onSubmit: (values: Partial<UserInfo>) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export default function UserForm({ initialValues, onSubmit, onCancel, loading }: UserForm) {
  const [form] = Form.useForm();

  const formInitialValues = useMemo(() => {
    if (!initialValues) return { role: UserRole.STUDENT };
    return { ...initialValues };
  }, [initialValues]);

  useEffect(() => {
    form.setFieldsValue(formInitialValues);
  }, [form, formInitialValues]);

  const handleSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch (error) {
      console.error('Validation failed:', error);
      return;
    }
    const submitData: Partial<UserInfo> = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined && v !== null && v !== '')) as Partial<UserInfo>;
    try {
      await onSubmit(submitData);
    } catch (error) {
      console.error('Submit failed:', error);
    }
  };

  return (
    <Form form={form} layout="vertical" initialValues={formInitialValues} className="space-y-4">
      <Form.Item name="realName" label="真实姓名"><Input placeholder="请输入真实姓名" className="rounded-lg" /></Form.Item>
      <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '邮箱格式不正确' }]}><Input placeholder="请输入邮箱" className="rounded-lg" /></Form.Item>
      <Form.Item name="phone" label="手机号" rules={[{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }]}><Input placeholder="请输入手机号" className="rounded-lg" /></Form.Item>
      <Form.Item name="schoolName" label="学校"><Input placeholder="请输入学校名称" className="rounded-lg" /></Form.Item>
      <Form.Item name="password" label="密码" rules={[{ min: 6, message: '密码至少6位' }]}><Input.Password placeholder="不修改请留空" className="rounded-lg" /></Form.Item>
      <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
        <Select placeholder="请选择角色" className="rounded-lg">
          <Select.Option value={UserRole.ADMIN}>管理员</Select.Option>
          <Select.Option value={UserRole.TEACHER}>教师</Select.Option>
          <Select.Option value={UserRole.STUDENT}>学生</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name="walletAddress" label="钱包地址"><Input disabled placeholder="钱包地址" className="rounded-lg" /></Form.Item>
      <Form.Item name="tokenBalance" label="代币余额"><InputNumber disabled min={0} step={0.01} className="w-full rounded-lg" placeholder="代币余额" /></Form.Item>
      <Form.Item>
        <div className="flex gap-3">
          {onCancel && <Button onClick={onCancel} className="rounded-lg flex-1">取消</Button>}
          <Button type="primary" loading={loading} onClick={handleSubmit} className="rounded-lg flex-1">提交</Button>
        </div>
      </Form.Item>
    </Form>
  );
}

