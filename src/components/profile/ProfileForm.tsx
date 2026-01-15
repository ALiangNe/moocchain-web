import { Form, Input, Select, Button } from 'antd';
import { useState, useEffect, useMemo } from 'react';
import type { UserInfo } from '@/types/userType';
import universities from '@/constants/universities.json';

interface ProfileFormProps {
  user: UserInfo | null;
  onSubmit: (values: Partial<UserInfo>) => Promise<void>;
  loading?: boolean;
}

export default function ProfileForm({ user, onSubmit, loading }: ProfileFormProps) {
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const universityOptions = useMemo(() => {
    const result: { label: string; value: string }[] = [];
    if (!universities || typeof universities !== 'object') return result;

    const data = universities as Record<string, Record<string, unknown>>;
    Object.keys(data).forEach((cityKey) => {
      const schools = data[cityKey];
      if (!schools || typeof schools !== 'object') return;
      Object.keys(schools).forEach((schoolName) => {
        result.push({ label: schoolName, value: schoolName });
      });
    });

    return result;
  }, []);

  useEffect(() => {
    if (!user) return;
    // 恢复为原始值，而不是清空
    form.setFieldsValue({ email: user.email, realName: user.realName, phone: user.phone, idCard: user.idCard, gender: user.gender, schoolName: user.schoolName, });
  }, [user, form]);

  // 进入编辑模式
  const handleEdit = () => {
    setIsEditing(true);
  };

  // 提交个人信息表单
  const handleSubmit = async (values: Partial<UserInfo>) => {
    await onSubmit(values);
    setIsEditing(false);
  };

  // 取消编辑，恢复原始值
  const handleCancel = () => {
    // 恢复为原始值，而不是清空
    if (user) {
      form.setFieldsValue({ email: user.email, realName: user.realName, phone: user.phone, idCard: user.idCard, gender: user.gender, schoolName: user.schoolName, });
    }
    setIsEditing(false);
  };

  return (
    <>
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="max-w-2xl">
        <Form.Item label="邮箱" name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}>
          <Input placeholder="请输入邮箱" size="large" disabled={!isEditing} />
        </Form.Item>

        <Form.Item label="学校名称" name="schoolName">
          <Select showSearch allowClear placeholder="请选择学校名称" size="large" disabled={!isEditing} options={universityOptions} filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())} />
        </Form.Item>

        <Form.Item label="真实姓名" name="realName">
          <Input placeholder="请输入真实姓名" size="large" disabled={!isEditing} />
        </Form.Item>

        <Form.Item label="手机号" name="phone" rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }]}>
          <Input placeholder="请输入手机号" size="large" disabled={!isEditing} />
        </Form.Item>

        <Form.Item label="身份证号" name="idCard" rules={[{ pattern: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/, message: '请输入有效的身份证号' }]}>
          <Input placeholder="请输入身份证号" size="large" disabled={!isEditing} />
        </Form.Item>

        <Form.Item label="性别" name="gender">
          <Select placeholder="请选择性别" size="large" disabled={!isEditing}>
            <Select.Option value={0}>未知</Select.Option>
            <Select.Option value={1}>男</Select.Option>
            <Select.Option value={2}>女</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item>
          {!isEditing ? (
            <Button type="default" size="large" onClick={handleEdit} block>
              编辑
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button type="default" size="large" onClick={handleCancel} className="flex-1">
                取消
              </Button>
              <Button type="primary" htmlType="submit" size="large" loading={loading} className="flex-1">
                保存
              </Button>
            </div>
          )}
        </Form.Item>
      </Form>
    </>
  );
}
