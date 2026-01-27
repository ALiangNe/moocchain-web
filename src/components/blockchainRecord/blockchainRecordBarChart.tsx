import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { CertificateInfo } from '@/types/certificateType';
import type { TokenTransactionInfo } from '@/types/tokenTransactionType';
import { UserRole } from '@/constants/role';

interface BlockchainRecordBarChartProps {
  userRole?: number;
  certificateRecords: CertificateInfo[];
  rewardRecords: TokenTransactionInfo[]; // 学生：学习完成奖励，教师：上传资源奖励
  uploadRewardRecords?: TokenTransactionInfo[]; // 管理员：上传资源奖励
  learningRewardRecords?: TokenTransactionInfo[]; // 管理员：学习完成奖励
  purchaseRecords: TokenTransactionInfo[];
}

export default function BlockchainRecordBarChart({
  userRole,
  certificateRecords,
  rewardRecords,
  uploadRewardRecords,
  learningRewardRecords,
  purchaseRecords,
}: BlockchainRecordBarChartProps) {
  const statistics = useMemo(() => {
    const isStudent = userRole === UserRole.STUDENT;
    const isTeacher = userRole === UserRole.TEACHER;
    const isAdmin = userRole === UserRole.ADMIN;

    let categories: string[] = [];
    let data: number[] = [];

    if (isStudent) {
      // 学生：铸造证书记录、领取资源学习奖励、购买资源消费记录
      categories = ['铸造证书', '学习完成奖励', '购买资源'];
      data = [
        certificateRecords.length,
        rewardRecords.length,
        purchaseRecords.length,
      ];
    } else if (isTeacher) {
      // 教师：铸造证书记录、领取资源上传奖励、购买资源消费记录
      categories = ['铸造证书', '上传资源奖励', '购买资源'];
      data = [
        certificateRecords.length,
        rewardRecords.length,
        purchaseRecords.length,
      ];
    } else if (isAdmin) {
      // 管理员：铸造证书记录、领取资源学习奖励、领取资源上传奖励、购买资源消费记录
      categories = ['铸造证书', '学习完成奖励', '上传资源奖励', '购买资源'];
      data = [
        certificateRecords.length,
        learningRewardRecords?.length || 0,
        uploadRewardRecords?.length || 0,
        purchaseRecords.length,
      ];
    }

    return { categories, data };
  }, [userRole, certificateRecords, rewardRecords, uploadRewardRecords, learningRewardRecords, purchaseRecords]);

  const option = useMemo(() => ({
    color: ['#2196F3'], // 蓝色
    title: {
      text: '上链记录统计',
      subtext: '区块链记录',
      left: 'center',
      top: '5%',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '20%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: statistics.categories,
      axisTick: {
        alignWithLabel: true,
      },
    },
    yAxis: {
      type: 'value',
      name: '数量',
    },
    series: [
      {
        name: '记录数量',
        type: 'bar',
        data: statistics.data,
        itemStyle: {
          color: '#2196F3',
        },
      },
    ],
  }), [statistics]);

  // 如果没有数据，显示空状态
  const totalCount = statistics.data.reduce((a, b) => a + b, 0);
  if (totalCount === 0) {
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
