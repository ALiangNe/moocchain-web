import { Form, Input, Select, Button } from 'antd';
import { useState, useEffect } from 'react';
import type { UserInfo } from '../../types/userType';

interface UserProfileFormProps {
  user: UserInfo | null;
  onSubmit: (values: Partial<UserInfo>) => Promise<void>;
  loading?: boolean;
}

export default function UserProfileForm({ user, onSubmit, loading }: UserProfileFormProps) {
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!user) return;
    // 恢复为原始值，而不是清空
    form.setFieldsValue({ email: user.email, realName: user.realName, phone: user.phone, idCard: user.idCard, gender: user.gender, schoolName: user.schoolName, });
  }, [user, form]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSubmit = async (values: Partial<UserInfo>) => {
    await onSubmit(values);
    setIsEditing(false);
  };

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

        <Form.Item label="学校名称" name="schoolName">
          <Input placeholder="请输入学校名称" size="large" disabled={!isEditing} />
        </Form.Item>

        <Form.Item>
          {!isEditing ? (
            <Button type="default" size="large" onClick={handleEdit} className="profile-edit-btn w-full bg-white border border-[#d2d2d7] text-[#1d1d1f] hover:bg-[#e3f2fd] hover:border-[#007aff] hover:text-[#007aff] transition-all">
              编辑
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button type="default" size="large" onClick={handleCancel} className="profile-edit-btn flex-1 bg-white border border-[#d2d2d7] text-[#1d1d1f] hover:bg-[#e3f2fd] hover:border-[#007aff] hover:text-[#007aff] transition-all">
                取消
              </Button>
              <Button type="primary" htmlType="submit" size="large" loading={loading} className="profile-save-btn flex-1 bg-[#1d1d1f] border-[#1d1d1f] hover:bg-[#424245] hover:border-white hover:shadow-[0_0_0_2px_white] transition-all">
                保存
              </Button>
            </div>
          )}
        </Form.Item>
      </Form>
      {/* 样式 */}
      <style>{`
        .profile-edit-btn:focus,
        .profile-edit-btn:active,
        .profile-edit-btn.ant-btn:focus,
        .profile-edit-btn.ant-btn:active {
          background-color: #e3f2fd !important;
          border-color: #007aff !important;
          color: #007aff !important;
          outline: none !important;
          box-shadow: none !important;
        }
        .profile-edit-btn:focus-visible {
          outline: none !important;
        }
        .profile-save-btn:focus,
        .profile-save-btn:active,
        .profile-save-btn.ant-btn:focus,
        .profile-save-btn.ant-btn:active {
          background-color: #424245 !important;
          border-color: white !important;
          box-shadow: 0 0 0 2px white !important;
          outline: none !important;
        }
        .profile-save-btn:focus-visible {
          outline: none !important;
        }
      `}</style>
    </>
  );
}
