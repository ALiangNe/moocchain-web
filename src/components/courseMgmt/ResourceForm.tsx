import { Form, Input, Select, InputNumber, Button } from 'antd';
import type { ResourceInfo } from '../../types/resourceType';
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

  return (
    <Form form={form} layout="vertical" initialValues={initialValues} className="space-y-4">
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
      <Form.Item>
        <div className="flex gap-3">
          {onCancel && <Button onClick={onCancel} className="rounded-lg flex-1">取消</Button>}
          <Button type="primary" loading={loading} onClick={handleSubmit} className="rounded-lg flex-1">提交</Button>
        </div>
      </Form.Item>
    </Form>
  );
}
