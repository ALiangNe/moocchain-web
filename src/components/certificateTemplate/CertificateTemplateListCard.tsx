import { Card, Pagination, Tag, Button, Space } from 'antd';
import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import type { CertificateTemplateInfo } from '@/types/certificateTemplateType';
import { formatDate } from '@/utils/formatTime';

interface CertificateTemplateListCardProps {
  templates: CertificateTemplateInfo[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  onEdit?: (template: CertificateTemplateInfo) => void;
  onView?: (template: CertificateTemplateInfo) => void;
}

export default function CertificateTemplateListCard({ templates, loading, page, pageSize, total, onPageChange, onEdit, onView }: CertificateTemplateListCardProps) {

  return (
    <div className="space-y-4">
      {templates.map((template) => (
        <Card key={template.templateId} className="shadow-sm hover:shadow-md transition-shadow border border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-[#1d1d1f]">{template.templateName}</h3>
                <Tag color={template.isActive === 1 ? 'green' : 'default'}>{template.isActive === 1 ? '启用' : '禁用'}</Tag>
              </div>
              <div className="text-sm text-[#6e6e73] space-y-1">
                <p>创建者：{template.creator?.realName || template.creator?.username || '-'}</p>
                <p>创建时间：{template.createdAt ? formatDate(template.createdAt) : '-'}</p>
                {template.updatedAt && <p>更新时间：{formatDate(template.updatedAt)}</p>}
              </div>
            </div>
            <Space>
              {onView && (
                <Button type="link" icon={<EyeOutlined />} onClick={() => onView(template)} className="text-[#007aff] focus:outline-none focus:shadow-none">
                  查看
                </Button>
              )}
              {onEdit && (
                <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(template)} className="text-[#007aff] focus:outline-none focus:shadow-none">
                  编辑
                </Button>
              )}
            </Space>
          </div>
        </Card>
      ))}
      {templates.length === 0 && !loading && (
        <div className="text-center text-[#6e6e73] py-12">
          <p>暂无证书模板，请先创建模板</p>
        </div>
      )}
      <div className="flex justify-end mt-4">
        <Pagination current={page} pageSize={pageSize} total={total} onChange={onPageChange} showSizeChanger pageSizeOptions={['8', '16', '32', '64']} showTotal={(total) => `共 ${total} 条`} />
      </div>
    </div>
  );
}
