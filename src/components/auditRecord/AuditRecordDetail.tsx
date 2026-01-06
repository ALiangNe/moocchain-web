import { Descriptions, Tag, Divider } from 'antd';
import type { AuditRecordInfo } from '../../types/auditRecordType';
import { formatDateTime } from '../../utils/timeUtils';

interface AuditRecordDetailProps {
  record: AuditRecordInfo;
}

export default function AuditRecordDetail({ record }: AuditRecordDetailProps) {
  const statusMap: Record<number, { text: string; color: string }> = {
    0: { text: '待审核', color: 'processing' },
    1: { text: '已通过', color: 'success' },
    2: { text: '已拒绝', color: 'error' },
  };

  const statusConfig = statusMap[record.auditStatus || 0] || statusMap[0];

  return (
    <div className="space-y-6">
      {/* 申请人信息模块 */}
      {record.targetUser && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-[#1d1d1f]">申请人信息</h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="申请人ID">{record.targetId || '-'}</Descriptions.Item>
              <Descriptions.Item label="用户名">{record.targetUser.username || '-'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{record.targetUser.email || '-'}</Descriptions.Item>
              {record.targetUser.realName && <Descriptions.Item label="真实姓名">{record.targetUser.realName}</Descriptions.Item>}
              {record.targetUser.phone && <Descriptions.Item label="手机号">{record.targetUser.phone}</Descriptions.Item>}
              {record.targetUser.schoolName && <Descriptions.Item label="学校名称" span={2}>{record.targetUser.schoolName}</Descriptions.Item>}
              {record.targetUser.certificateFile && <Descriptions.Item label="认证材料" span={2}>{record.targetUser.certificateFile}</Descriptions.Item>}
              {record.createdAt && <Descriptions.Item label="申请时间" span={2}>{formatDateTime(record.createdAt)}</Descriptions.Item>}
            </Descriptions>
          </div>
        </div>
      )}

      <Divider />

      {/* 审批人信息模块 - 始终显示，审批前显示 "-"，审批后显示真实数据 */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-[#1d1d1f]">审批人信息</h3>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="审批人ID">
              {record.auditStatus !== 0 && record.auditorId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="审批人">
              {record.auditStatus !== 0 && (record.auditor?.username || '-') || '-'}
            </Descriptions.Item>
          </Descriptions>
        </div>
      </div>

      <Divider />

      {/* 审核信息模块 */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-[#1d1d1f]">审核信息</h3>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="审核记录ID">{record.auditId || '-'}</Descriptions.Item>
            <Descriptions.Item label="审核状态"><Tag color={statusConfig.color}>{statusConfig.text}</Tag></Descriptions.Item>
            {record.auditTime && <Descriptions.Item label="审核时间" span={2}>{formatDateTime(record.auditTime)}</Descriptions.Item>}
            {record.auditComment && <Descriptions.Item label="审核意见" span={2}>{record.auditComment}</Descriptions.Item>}
          </Descriptions>
        </div>
      </div>
    </div>
  );
}
