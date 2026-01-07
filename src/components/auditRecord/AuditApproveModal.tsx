import { Drawer, Input, Descriptions, Divider, Button, Space } from 'antd';
import { useState, useEffect } from 'react';
import type { AuditRecordInfo } from '../../types/auditRecordType';
import { formatDateTime } from '../../utils/timeUtils';

const { TextArea } = Input;

interface AuditApproveModalProps {
  visible: boolean;
  auditStatus: number | null;
  loading: boolean;
  record?: AuditRecordInfo | null;
  onConfirm: (comment: string) => void;
  onCancel: () => void;
}

export default function AuditApproveModal({ visible, auditStatus, loading, record, onConfirm, onCancel }: AuditApproveModalProps) {
  const [auditComment, setAuditComment] = useState('');

  useEffect(() => {
    if (!visible) {
      // 使用 queueMicrotask 延迟状态更新，避免在 effect 中同步调用 setState
      queueMicrotask(() => {
        setAuditComment('');
      });
    }
  }, [visible]);

  const handleOk = () => {
    onConfirm(auditComment);
  };

  const handleCancel = () => {
    setAuditComment('');
    onCancel();
  };

  return (
    <Drawer 
      title={auditStatus === 1 ? '审批通过' : '审批拒绝'} 
      open={visible} 
      onClose={handleCancel} 
      width={700} 
      placement="right"
      extra={
        <Space>
          <Button onClick={handleCancel}>取消</Button>
          <Button type="primary" loading={loading} onClick={handleOk}>确认</Button>
        </Space>
      }
    >
      <div className="space-y-6">
        {/* 申请人信息模块 */}
        {record?.targetUser && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-[#1d1d1f]">申请人信息</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <Descriptions column={2} size="small">
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
              <Descriptions.Item label="审批人">
                {record && record.auditStatus !== 0 && (record.auditor?.username || '-') || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="审批人ID">
                {record && record.auditStatus !== 0 && record.auditorId || '-'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        </div>

        <Divider />

        {/* 审核意见输入 */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-[#1d1d1f]">审核意见</h3>
          <TextArea rows={4} placeholder="请输入审核意见（选填）" value={auditComment} onChange={(e) => setAuditComment(e.target.value)} />
        </div>
      </div>
    </Drawer>
  );
}
