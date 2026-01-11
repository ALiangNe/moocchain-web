import { Drawer, Input, Descriptions, Button } from 'antd';
import { useState, useEffect } from 'react';
import type { AuditRecordInfo } from '../../types/auditRecordType';
import { formatDateTime } from '../../utils/formatTime';

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
    // 关闭抽屉：清空审核意见
    if (!visible) {
      queueMicrotask(() => setAuditComment(''));
      return;
    }

    // 打开抽屉：根据审核状态自动填充审核意见
    queueMicrotask(() => {
      if (auditStatus === 1) {
        setAuditComment('合规');
      } else if (auditStatus === 2) {
        setAuditComment('不合规');
      } else {
        setAuditComment('');
      }
    });
  }, [visible, auditStatus]);

  // 确认审批操作
  const handleOk = () => {
    onConfirm(auditComment);
  };

  // 取消审批操作
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
    >
      <div className="space-y-6">
        {/* 申请人信息模块 - 仅教师认证审核显示 */}
        {record?.targetUser && record.targetType === 1 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-[#1d1d1f]">申请人信息</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="申请人">
                  {record.targetUser.realName || record.targetUser.username || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="邮箱">{record.targetUser.email || '-'}</Descriptions.Item>
                <Descriptions.Item label="学校">{record.targetUser.schoolName || '-'}</Descriptions.Item>
                {record.createdAt && <Descriptions.Item label="申请时间">{formatDateTime(record.createdAt)}</Descriptions.Item>}
              </Descriptions>
            </div>
          </div>
        )}

        {/* 资源信息模块 - 仅资源审核显示 */}
        {record?.targetResource && record.targetType === 2 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-[#1d1d1f]">资源信息</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="申请人">
                  {record.targetResource.owner?.realName || record.targetResource.owner?.username || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="学校">{record.targetResource.owner?.schoolName || '-'}</Descriptions.Item>
                <Descriptions.Item label="课程名字">{record.targetResource.course?.courseName || '-'}</Descriptions.Item>
                <Descriptions.Item label="资源名字">{record.targetResource.title || '-'}</Descriptions.Item>
                {record.targetResource.description && (
                  <Descriptions.Item label="资源描述" span={2}>{record.targetResource.description}</Descriptions.Item>
                )}
                {record.createdAt && <Descriptions.Item label="申请时间" span={2}>{formatDateTime(record.createdAt)}</Descriptions.Item>}
              </Descriptions>
            </div>
          </div>
        )}

        {/* 审核意见输入 */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-[#1d1d1f]">审核意见</h3>
          <TextArea
            rows={4}
            placeholder="请输入审核意见（选填）"
            value={auditComment}
            onChange={(e) => setAuditComment(e.target.value)}
            style={{ resize: 'none' }}
          />
        </div>

        {/* 按钮区域 - 平铺左右各占50% */}
        <div className="flex gap-3">
          <Button onClick={handleCancel} className="rounded-lg flex-1">取消</Button>
          <Button type="primary" loading={loading} onClick={handleOk} className="rounded-lg flex-1">确认</Button>
        </div>
      </div>
    </Drawer>
  );
}
