import { Form, Input, Select, InputNumber, Button } from 'antd';
import type { ResourceInfo } from '@/types/resourceType';
import ResourceUpload from './ResourceUpload.tsx';
import { useState } from 'react';

const { TextArea } = Input;
const { Option } = Select;

interface ResourceFormProps {
  courseId: number;
  initialValues?: Partial<ResourceInfo>;
  onSubmit: (values: Partial<ResourceInfo> & { file?: File }) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export default function ResourceForm({ courseId, initialValues, onSubmit, onCancel, loading }: ResourceFormProps) {
  const [form] = Form.useForm();
  const [file, setFile] = useState<File | null>(null);

  // 处理资源表单提交
  const handleSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch (error) {
      console.error('Validation failed:', error);
      return;
    }

    // 如果是编辑模式（有 initialValues），文件是可选的
    if (!file && !initialValues) {
      form.setFields([{ name: 'file', errors: ['请选择要上传的文件'] }]);
      return;
    }

    // 编辑模式下，如果没有新文件，只传递表单数据
    try {
      await onSubmit({ ...values, courseId, ...(file ? { file } : {}) });
    } catch (error) {
      console.error('Submit failed:', error);
    }
  };

  // 处理表单初始值
  // 1. status=0/1(待审核/已审核) 时设为 undefined，避免下拉框显示数字，而是显示 placeholder
  const formInitialValues = initialValues
    ? {
        ...initialValues,
        status:
          initialValues.status === 0 || initialValues.status === 1
            ? undefined
            : initialValues.status,
      }
    : {};

  return (
    <Form form={form} layout="vertical" initialValues={formInitialValues} className="space-y-4">
      <Form.Item name="title" label="资源标题" rules={[{ required: true, message: '请输入资源标题' }]}>
        <Input placeholder="请输入资源标题" className="rounded-lg" />
      </Form.Item>
      <Form.Item name="description" label="资源描述">
        <TextArea rows={4} placeholder="请输入资源描述" className="rounded-lg" style={{ resize: 'none' }} />
      </Form.Item>
      {!initialValues && (
        <Form.Item name="file" label="上传文件" rules={[{ required: true, message: '请选择要上传的文件' }]}>
          <ResourceUpload value={file || undefined} onChange={setFile} />
        </Form.Item>
      )}
      <Form.Item name="resourceType" label="资源类型">
        <Select placeholder="请选择资源类型" className="rounded-lg">
          <Option value={1}>文档</Option>
          <Option value={2}>音频</Option>
          <Option value={3}>视频</Option>
          <Option value={0}>其他</Option>
        </Select>
      </Form.Item>
      <Form.Item name="price" label="价格（代币）" initialValue={0}>
        <InputNumber min={0} step={0.01} className="w-full rounded-lg" placeholder="0表示免费" />
      </Form.Item>
      <Form.Item name="accessScope" label="访问范围">
        <Select placeholder="请选择访问范围" className="rounded-lg">
          <Option value={0}>公开</Option>
          <Option value={1}>校内</Option>
          <Option value={2}>付费</Option>
        </Select>
      </Form.Item>
      {/* 资源状态：
          - 0(待审核)：只能查看，禁用下拉框，提示“暂未通过审核，请耐心等待”
          - 1(已审核)：可选择发布/下架，提示“已通过审核，立即发布资源”
          - 2/3(已发布/已下架)：显示当前值，可继续调整 */}
      {initialValues && initialValues.status !== undefined && (
        <Form.Item name="status" label="资源状态">
          <Select
            className="rounded-lg"
            placeholder={
              initialValues.status === 0
                ? '资源尚在审核中，请耐心等待'
                : '已通过审核，立即发布资源'
            }
            disabled={initialValues.status === 0}
          >
            <Option value={2}>发布资源</Option>
            <Option value={3}>下架资源</Option>
          </Select>
        </Form.Item>
      )}
      <Form.Item>
        <div className="flex gap-3">
          {onCancel && <Button onClick={onCancel} className="rounded-lg flex-1">取消</Button>}
          <Button type="primary" loading={loading} onClick={handleSubmit} className="rounded-lg flex-1">提交</Button>
        </div>
      </Form.Item>
    </Form>
  );
}
