import { Form, Input, Button, message, Switch } from 'antd';
import { useState, useEffect, useMemo } from 'react';
import type { CertificateTemplateInfo } from '@/types/certificateTemplateType';

const { TextArea } = Input;

interface CertificateTemplateFormProps {
  initialValues?: Partial<CertificateTemplateInfo>;
  onSubmit: (values: Partial<CertificateTemplateInfo>) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export default function CertificateTemplateForm({ initialValues, onSubmit, onCancel, loading }: CertificateTemplateFormProps) {
  const [form] = Form.useForm();
  const [jsonError, setJsonError] = useState<string>('');

  // 验证JSON格式
  const validateJSON = (value: string) => {
    if (!value) {
      setJsonError('');
      return;
    }
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed !== 'object' || parsed === null) {
        setJsonError('JSON必须是一个对象');
        return;
      }
      if (!parsed.canvas) {
        setJsonError('JSON必须包含canvas配置');
        return;
      }
      if (!Array.isArray(parsed.fields)) {
        setJsonError('JSON必须包含fields数组');
        return;
      }
      setJsonError('');
    } catch {
      setJsonError('JSON格式无效，请检查语法');
    }
  };

  // 处理表单提交
  const handleSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch (error) {
      console.error('Validation failed:', error);
      return;
    }

    // 验证JSON格式
    if (values.templateContent) {
      try {
        JSON.parse(values.templateContent);
      } catch {
        message.error('JSON格式无效，请检查语法');
        return;
      }
    }

    // 转换 isActive 为数字（Switch 返回 boolean）
    const submitData = {
      ...values,
      isActive: values.isActive ? 1 : 0,
    };

    try {
      await onSubmit(submitData);
    } catch (error) {
      console.error('Submit failed:', error);
    }
  };

  // 格式化JSON
  const formatJSON = () => {
    const content = form.getFieldValue('templateContent');
    if (!content) {
      message.warning('请先输入JSON内容');
      return;
    }
    try {
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      form.setFieldsValue({ templateContent: formatted });
      setJsonError('');
      message.success('JSON格式化成功');
    } catch {
      message.error('JSON格式无效，无法格式化');
    }
  };

  // 处理表单初始值
  const formInitialValues = useMemo(() => {
    if (!initialValues) {
      return { isActive: true };
    }

    // 处理 templateContent：如果是对象，转换为字符串
    const templateContent = initialValues.templateContent
      ? typeof initialValues.templateContent === 'string'
        ? initialValues.templateContent
        : JSON.stringify(initialValues.templateContent, null, 2)
      : undefined;

    return {
      ...initialValues,
      templateContent,
      isActive: initialValues.isActive === undefined ? true : initialValues.isActive === 1,
    };
  }, [initialValues]);

  useEffect(() => {
    form.setFieldsValue(formInitialValues);

    if (initialValues?.templateContent) {
      // 使用 setTimeout 避免在 effect 中同步调用 setState
      setTimeout(() => {
        const content = typeof initialValues.templateContent === 'string'
          ? initialValues.templateContent
          : JSON.stringify(initialValues.templateContent);
        validateJSON(content);
      }, 0);
    }
  }, [initialValues, form, formInitialValues]);

  return (
    <Form form={form} layout="vertical" initialValues={formInitialValues} className="space-y-4">
      <Form.Item name="templateName" label="模板名称" rules={[{ required: true, message: '请输入模板名称' }]}>
        <Input placeholder="请输入模板名称" className="rounded-lg" />
      </Form.Item>
      <Form.Item name="templateContent" label="模板配置（JSON）" rules={[{ required: true, message: '请输入模板配置JSON' }, {
        validator: (_, value) => {
          if (!value) return Promise.resolve();
          try {
            JSON.parse(value);
            return Promise.resolve();
          } catch {
            return Promise.reject(new Error('JSON格式无效'));
          }
        }
      }]}>
        <div className="space-y-2">
          <div className="flex justify-end mb-2">
            <Button type="link" size="small" onClick={formatJSON} className="text-[#007aff]">格式化JSON</Button>
          </div>
          <TextArea rows={20} placeholder='请输入JSON配置，例如：\n{\n  "canvas": {\n    "width": 1600,\n    "height": 1200,\n    "background": {\n      "type": "image",\n      "src": "https://cdn.xxx.com/cert/bg-default.png"\n    }\n  },\n  "fields": [...]\n}' className="rounded-lg font-mono text-sm" style={{ resize: 'none' }} onChange={(e) => validateJSON(e.target.value)} />
          {jsonError && <div className="text-red-500 text-sm mt-1">{jsonError}</div>}
        </div>
      </Form.Item>
      <Form.Item name="isActive" label="启用状态" valuePropName="checked">
        <Switch />
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
