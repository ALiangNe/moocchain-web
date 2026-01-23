import { Card, Descriptions, Tag } from 'antd';
import type { CertificateTemplateInfo } from '@/types/certificateTemplateType';

interface CertificateTemplateDetailProps {
  template: CertificateTemplateInfo;
}

export default function CertificateTemplateDetail({ template }: CertificateTemplateDetailProps) {
  const renderTemplateContent = () => {
    if (!template.templateContent) return '-';

    try {
      const json =
        typeof template.templateContent === 'string'
          ? JSON.parse(template.templateContent)
          : template.templateContent;
      return JSON.stringify(json, null, 2);
    } catch {
      // 如果解析失败，直接原样展示，避免因为历史数据格式问题导致空白
      return typeof template.templateContent === 'string'
        ? template.templateContent
        : JSON.stringify(template.templateContent);
    }
  };

  return (
    <div className="space-y-4">
      <Card title="证书模板信息" className="shadow-sm">
        <Descriptions column={1} size="small">
          <Descriptions.Item label="模板名称">
            {template.templateName}
          </Descriptions.Item>
          <Descriptions.Item label="启用状态">
            <Tag color={template.isActive === 1 ? 'success' : 'default'}>
              {template.isActive === 1 ? '启用' : '禁用'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="模板配置（JSON）" className="shadow-sm">
        <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[500px] text-sm font-mono m-0">
          {renderTemplateContent()}
        </pre>
      </Card>
    </div>
  );
}

