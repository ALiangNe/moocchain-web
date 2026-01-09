import { Steps, type StepsProps } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { AuditRecordInfo } from '../../types/auditRecordType';

interface ApplyStatusCardProps {
  auditRecord: AuditRecordInfo | null;
}

export default function ApplyStatusCard({ auditRecord }: ApplyStatusCardProps) {
  if (!auditRecord) {
    return (
      <div>
        <p className="text-gray-600 mb-4">您尚未提交教师认证申请</p>
        <Steps items={[{ title: '提交申请', status: 'wait', icon: <ClockCircleOutlined /> }, { title: '等待审核', status: 'wait', icon: <ClockCircleOutlined /> }, { title: '审核完成', status: 'wait', icon: <ClockCircleOutlined /> }]} />
      </div>
    );
  }

  const status = auditRecord.auditStatus;

  const getSteps = (): StepsProps['items'] => {
    if (status === 0) {
      return [
        { title: '提交申请', status: 'finish', icon: <CheckCircleOutlined /> },
        { title: '等待审核', status: 'process', icon: <ClockCircleOutlined /> },
        { title: '审核完成', status: 'wait', icon: <ClockCircleOutlined /> },
      ];
    }
    
    if (status === 1) {
      return [
        { title: '提交申请', status: 'finish', icon: <CheckCircleOutlined /> },
        { title: '等待审核', status: 'finish', icon: <CheckCircleOutlined /> },
        { title: '审核完成', status: 'finish', icon: <CheckCircleOutlined /> },
      ];
    }
    
    if (status === 2) {
      return [
        { title: '提交申请', status: 'finish', icon: <CheckCircleOutlined /> },
        { title: '等待审核', status: 'finish', icon: <CheckCircleOutlined /> },
        { title: '审核完成', status: 'error', icon: <CloseCircleOutlined /> },
      ];
    }
    
    return [
      { title: '提交申请', status: 'wait', icon: <ClockCircleOutlined /> },
      { title: '等待审核', status: 'wait', icon: <ClockCircleOutlined /> },
      { title: '审核完成', status: 'wait', icon: <ClockCircleOutlined /> },
    ];
  };

  return <Steps items={getSteps()} />;
}
