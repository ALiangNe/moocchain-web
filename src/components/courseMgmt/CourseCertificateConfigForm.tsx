import { useEffect } from 'react';
import { Form, Input, InputNumber, Select, Switch, Button } from 'antd';
import type { CertificateTemplateInfo } from '@/types/certificateTemplateType';
import type { ResourceCertificateConfigInfo } from '@/types/resourceCertificateConfigType';

export interface CourseCertificateConfigFormProps {
  templates: CertificateTemplateInfo[];
  initialValues?: ResourceCertificateConfigInfo | null;
  defaultCourseName?: string;
  defaultIssuerName?: string;
  loading?: boolean;
  onSubmit: (values: Partial<ResourceCertificateConfigInfo>) => void;
  onCancel: () => void;
}

export default function CourseCertificateConfigForm({ templates, initialValues, defaultCourseName, defaultIssuerName, loading, onSubmit, onCancel }: CourseCertificateConfigFormProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    const override = initialValues?.overrideFields ? (() => { try { return JSON.parse(initialValues.overrideFields as unknown as string); } catch { return {}; } })() : {};
    form.setFieldsValue({
      templateId: initialValues?.templateId,
      completionRequirement: initialValues?.completionRequirement ?? 100,
      minLearningTime: initialValues?.minLearningTime ?? 0,
      isEnabled: initialValues?.isEnabled ?? 1,
      courseName: override?.courseName ?? defaultCourseName,
      issuerName: override?.issuerName ?? defaultIssuerName,
    });
  }, [defaultCourseName, defaultIssuerName, form, initialValues]);

  return (
    <div className="space-y-6">
      <div className="bg-[#f5f5f7] rounded-xl p-4">
        <div className="text-sm text-[#6e6e73]">说明：这里只保存“课程级”覆盖字段，最终证书图片会在学生领取时由后端一次性渲染生成。</div>
      </div>

      <Form form={form} layout="vertical" onFinish={(v) => onSubmit({ templateId: v.templateId, completionRequirement: v.completionRequirement, minLearningTime: v.minLearningTime, isEnabled: v.isEnabled ? 1 : 0, overrideFields: JSON.stringify({ courseName: v.courseName, issuerName: v.issuerName }) })}>
        <Form.Item name="templateId" label="选择证书模板" rules={[{ required: true, message: '请选择证书模板' }]}>
          <Select placeholder="请选择证书模板" options={templates.map((t) => ({ label: `${t.templateName || '未命名'}（#${t.templateId}）`, value: t.templateId }))} />
        </Form.Item>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item name="completionRequirement" label="完成进度标准（0-100）" rules={[{ required: true, message: '请输入完成进度标准' }]}>
            <InputNumber min={0} max={100} precision={0} className="w-full" />
          </Form.Item>
          <Form.Item name="minLearningTime" label="最低学习时长（秒）">
            <InputNumber min={0} precision={0} className="w-full" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item name="courseName" label="课程名称（覆盖模板字段 courseName）">
            <Input placeholder="例如：区块链基础（2025春）" />
          </Form.Item>
          <Form.Item name="issuerName" label="签发者名称（覆盖模板字段 issuerName）">
            <Input placeholder="例如：MOOCChain 教育平台 / 张老师" />
          </Form.Item>
        </div>

        <Form.Item name="isEnabled" label="是否启用" valuePropName="checked">
          <Switch checkedChildren="启用" unCheckedChildren="禁用" />
        </Form.Item>

        <div className="flex gap-3 mt-4">
          <Button onClick={onCancel} className="rounded-lg w-1/2">取消</Button>
          <Button type="primary" htmlType="submit" loading={loading} className="rounded-lg w-1/2">保存配置</Button>
        </div>
      </Form>
    </div>
  );
}

