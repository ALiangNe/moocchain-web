import { Descriptions, Tag, Button, Card, Image } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { AuditRecordInfo } from '@/types/auditRecordType';
import { formatDateTime } from '@/utils/formatTime';

interface CourseAuditDetailProps {
  record: AuditRecordInfo;
  onApprove?: (status: number) => void;
}

export default function CourseAuditDetail({ record, onApprove }: CourseAuditDetailProps) {
  const statusMap: Record<number, { text: string; color: string }> = {
    0: { text: '待审核', color: 'processing' },
    1: { text: '已通过', color: 'success' },
    2: { text: '已拒绝', color: 'error' },
  };

  const statusConfig = statusMap[record.auditStatus || 0] || statusMap[0];

  // 获取课程封面图片地址
  const getCoverImageUrl = (coverImage?: string) => {
    if (!coverImage) return undefined;
    if (coverImage.startsWith('http')) return coverImage;
    const baseUrl = import.meta.env.VITE_API_BASE_URL.split('/api')[0];
    return `${baseUrl}${coverImage}`;
  };

  const coverImageUrl = getCoverImageUrl(record.targetCourse?.coverImage);
  const isImageFile = coverImageUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(coverImageUrl);

  return (
    <div className="space-y-6">
      {/* 卡片一：课程信息 */}
      <Card title="课程发布信息" className="shadow-sm">
        {record.targetCourse ? (
          <Descriptions column={2} size="small">
            <Descriptions.Item label="教师">
              {record.targetCourse.teacher?.realName || record.targetCourse.teacher?.username || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="学校">
              {record.targetCourse.teacher?.schoolName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="课程名称">
              {record.targetCourse.courseName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="课程描述" span={2}>
              {record.targetCourse.description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="开课时间">
              {record.targetCourse.courseStartTime ? formatDateTime(record.targetCourse.courseStartTime) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="结课时间">
              {record.targetCourse.courseEndTime ? formatDateTime(record.targetCourse.courseEndTime) : '-'}
            </Descriptions.Item>
            {record.createdAt && (
              <Descriptions.Item label="申请时间" span={2}>
                {formatDateTime(record.createdAt)}
              </Descriptions.Item>
            )}
          </Descriptions>
        ) : (
          <span className="text-[#6e6e73]">暂无课程信息</span>
        )}
      </Card>

      {/* 卡片二：审核信息 */}
      <Card title="审核信息" className="shadow-sm">
        <Descriptions column={2} size="small">
          <Descriptions.Item label="审批人">
            {record.auditStatus !== 0 && (record.auditor?.realName || record.auditor?.username) || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="邮箱">
            {record.auditStatus !== 0 && record.auditor?.email || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="审核状态">
            <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="审核时间" span={2}>
            {record.auditTime ? formatDateTime(record.auditTime) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="审核意见" span={2}>
            {record.auditComment || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 卡片三：课程封面预览 */}
      {coverImageUrl && isImageFile && (
        <Card title="课程封面预览" className="shadow-sm">
          <div className="w-1/3 aspect-video mr-auto">
            <Image
              src={coverImageUrl}
              alt={record.targetCourse?.courseName || '课程封面'}
              preview={{ mask: '预览' }}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        </Card>
      )}

      {/* 底部操作按钮 */}
      {record.auditStatus === 0 && onApprove && (
        <div className="flex gap-3">
          <Button danger icon={<CloseOutlined />} onClick={() => onApprove(2)} className="rounded-lg flex-1">
            拒绝
          </Button>
          <Button type="primary" icon={<CheckOutlined />} onClick={() => onApprove(1)} className="rounded-lg flex-1">
            通过
          </Button>
        </div>
      )}
    </div>
  );
}
