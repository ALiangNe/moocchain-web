import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { CertificateInfo } from '@/types/certificateType';
import type { TokenTransactionInfo } from '@/types/tokenTransactionType';
import { UserRole } from '@/constants/role';

interface BlockchainRecordPieChartProps {
  userRole?: number;
  certificateRecords: CertificateInfo[];
  rewardRecords: TokenTransactionInfo[]; // 学生：学习完成奖励，教师：上传资源奖励
  uploadRewardRecords?: TokenTransactionInfo[]; // 管理员：上传资源奖励
  learningRewardRecords?: TokenTransactionInfo[]; // 管理员：学习完成奖励
  purchaseRecords: TokenTransactionInfo[];
}

export default function BlockchainRecordPieChart({
  userRole,
  certificateRecords,
  rewardRecords,
  uploadRewardRecords,
  learningRewardRecords,
  purchaseRecords,
}: BlockchainRecordPieChartProps) {
  const statistics = useMemo(() => {
    const isStudent = userRole === UserRole.STUDENT;
    const isTeacher = userRole === UserRole.TEACHER;
    const isAdmin = userRole === UserRole.ADMIN;

    let data: { name: string; value: number }[] = [];

    if (isStudent) {
      // 学生：铸造证书记录、领取资源学习奖励、购买资源消费记录
      data = [
        { name: '铸造证书', value: certificateRecords.length },
        { name: '学习完成奖励', value: rewardRecords.length },
        { name: '购买资源', value: purchaseRecords.length },
      ];
    } else if (isTeacher) {
      // 教师：铸造证书记录、领取资源上传奖励、购买资源消费记录
      data = [
        { name: '铸造证书', value: certificateRecords.length },
        { name: '上传资源奖励', value: rewardRecords.length },
        { name: '购买资源', value: purchaseRecords.length },
      ];
    } else if (isAdmin) {
      // 管理员：铸造证书记录、领取资源学习奖励、领取资源上传奖励、购买资源消费记录
      data = [
        { name: '铸造证书', value: certificateRecords.length },
        { name: '学习完成奖励', value: learningRewardRecords?.length || 0 },
        { name: '上传资源奖励', value: uploadRewardRecords?.length || 0 },
        { name: '购买资源', value: purchaseRecords.length },
      ];
    }

    // 只显示有数据的类型
    return data.filter((item) => item.value > 0);
  }, [userRole, certificateRecords, rewardRecords, uploadRewardRecords, learningRewardRecords, purchaseRecords]);

  const option = useMemo(() => ({
    color: ['#FF9800', '#4CAF50', '#2196F3', '#9C27B0'], // 橙色、绿色、蓝色、紫色
    title: {
      text: '上链记录占比',
      subtext: '区块链记录',
      left: 'center',
      top: '5%',
    },
    tooltip: {
      trigger: 'item',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: '5%',
    },
    series: [
      {
        name: '记录类型',
        type: 'pie',
        radius: '75%',
        center: ['50%', '60%'],
        data: statistics,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  }), [statistics]);

  // 如果没有数据，显示空状态
  if (statistics.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-[#6e6e73]">
        暂无数据
      </div>
    );
  }

  return (
    <div className="w-full" style={{ minHeight: '500px' }}>
      <ReactECharts option={option} style={{ height: '500px', width: '100%' }} opts={{ renderer: 'canvas' }} />
    </div>
  );
}
