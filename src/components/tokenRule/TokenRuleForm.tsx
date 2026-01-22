import { Form, Input, InputNumber, Button, Switch, Select } from 'antd';
import { useEffect, useMemo } from 'react';
import type { TokenRuleInfo } from '@/types/tokenRuleType';

interface TokenRuleFormProps {
  initialValues?: Partial<TokenRuleInfo>;
  onSubmit: (values: Partial<TokenRuleInfo>) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export default function TokenRuleForm({ initialValues, onSubmit, onCancel, loading }: TokenRuleFormProps) {
  const [form] = Form.useForm();

  // 处理表单提交
  const handleSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch (error) {
      console.error('Validation failed:', error);
      return;
    }

    // 转换 isEnabled 为数字（Switch 返回 boolean）
    const submitData = {
      ...values, 
      isEnabled: values.isEnabled ? 1 : 0,
    };

    try {
      await onSubmit(submitData);
    } catch (error) {
      console.error('Submit failed:', error);
    }
  };

  // 处理表单初始值
  const formInitialValues = useMemo(() => {
    if (!initialValues) {
      return { isEnabled: true };
    }

    return {
      ...initialValues,
      isEnabled: initialValues.isEnabled === undefined ? true : initialValues.isEnabled === 1,
    };
  }, [initialValues]);

  useEffect(() => {
    form.setFieldsValue(formInitialValues);
  }, [initialValues, form, formInitialValues]);

  return (
    <Form form={form} layout="vertical" initialValues={formInitialValues} className="space-y-4">
      {!initialValues && (
        <Form.Item name="rewardType" label="奖励类型" rules={[{ required: true, message: '请选择奖励类型' }]}>
          <Select placeholder="请选择奖励类型" className="rounded-lg">
            <Select.Option value={0}>学习完成</Select.Option>
            <Select.Option value={1}>资源上传</Select.Option>
            <Select.Option value={2}>评价参与</Select.Option>
          </Select>
        </Form.Item>
      )}
      {initialValues && (
        <Form.Item label="奖励类型">
          <Input value={initialValues.rewardType === 0 ? '学习完成' : initialValues.rewardType === 1 ? '资源上传' : '评价参与'} disabled className="rounded-lg" />
        </Form.Item>
      )}
      <Form.Item name="rewardAmount" label="奖励数量" rules={[{
        validator: (_, value) => {
          if (value === undefined || value === null || value === '') {
            return Promise.reject(new Error('请输入奖励数量'));
          }
          const numValue = Number(value);
          if (isNaN(numValue) || numValue <= 0) {
            return Promise.reject(new Error('奖励数量必须大于0'));
          }
          return Promise.resolve();
        }
      }]}>
        <InputNumber placeholder="请输入奖励数量" min={0.01} step={0.01} precision={2} className="w-full rounded-lg" />
      </Form.Item>
      <Form.Item name="tokenName" label="代币名称" rules={[{ required: true, message: '请输入代币名称' }]}>
        <Input placeholder="请输入代币名称" className="rounded-lg" />
      </Form.Item>
      <Form.Item name="isEnabled" label="启用状态" valuePropName="checked">
        <Switch checkedChildren="启用" unCheckedChildren="禁用" />
      </Form.Item>
      <Form.Item>
        <div className="flex gap-3">
          {onCancel && <Button onClick={onCancel} className="rounded-lg flex-1">取消</Button>}
          <Button type="primary" loading={loading} onClick={handleSubmit} className="rounded-lg flex-1">提交</Button>
        </div>
      </Form.Item>
    </Form>
  );
}
