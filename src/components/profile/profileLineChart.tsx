import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { TokenTransactionInfo } from '@/types/tokenTransactionType';

interface ProfileLineChartProps {
  transactions: TokenTransactionInfo[];
  loading?: boolean;
}

export default function ProfileLineChart({ transactions, loading = false }: ProfileLineChartProps) {
  const chartData = useMemo(() => {
    if (transactions.length === 0) {
      return { dates: [], balances: [], tooltipLabels: [] as string[] };
    }

    // 过滤有效数据并按时间排序（从早到晚）
    const validTransactions = transactions
      .filter((tx) => tx.createdAt && tx.balanceAfter !== undefined && tx.balanceAfter !== null)
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });

    if (validTransactions.length === 0) {
      return { dates: [], balances: [], tooltipLabels: [] as string[] };
    }

    // 判断时间跨度：检查是否都在同一天
    const firstDate = new Date(validTransactions[0].createdAt!);
    const lastDate = new Date(validTransactions[validTransactions.length - 1].createdAt!);
    const isSameDay = 
      firstDate.getFullYear() === lastDate.getFullYear() &&
      firstDate.getMonth() === lastDate.getMonth() &&
      firstDate.getDate() === lastDate.getDate();

    // 判断是否是今天
    const today = new Date();
    const isToday = isSameDay &&
      firstDate.getFullYear() === today.getFullYear() &&
      firstDate.getMonth() === today.getMonth() &&
      firstDate.getDate() === today.getDate();

    const dates: string[] = [];
    const balances: number[] = [];
    const tooltipLabels: string[] = [];

    validTransactions.forEach((tx) => {
      const date = new Date(tx.createdAt!);

      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      if (isSameDay && isToday) {
        // 同一天且是今天，x 轴显示时分：14:30
        dates.push(`${hours}:${minutes}`);
      } else {
        // 跨天或不是今天，x 轴显示日期：2月20日
        dates.push(`${month}月${day}日`);
      }

      // tooltip 始终显示完整“x月x日 13:30”格式
      tooltipLabels.push(`${month}月${day}日 ${hours}:${minutes}`);

      balances.push(tx.balanceAfter!);
    });

    return { dates, balances, tooltipLabels };
  }, [transactions]);

  const option = useMemo(() => ({
    color: ['#2196F3'], // 蓝色
    title: {
      text: '代币余额变化',
      subtext: '余额趋势',
      left: 'center',
      top: '5%',
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        if (Array.isArray(params) && params.length > 0) {
          const param = params[0] as { name: string; value: number; dataIndex: number };
          const index = param.dataIndex ?? 0;
          const label = chartData.tooltipLabels[index] ?? param.name;
          return `${label}<br/>余额: ${param.value}`;
        }
        return '';
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
      boundaryGap: false,
      data: chartData.dates,
      axisLabel: {
        rotate: 45, // 如果日期太长，旋转45度
      },
    },
    yAxis: {
      type: 'value',
      name: '余额',
    },
    series: [
      {
        name: '代币余额',
        type: 'line',
        smooth: true,
        data: chartData.balances,
        itemStyle: {
          color: '#2196F3',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(33, 150, 243, 0.3)' },
              { offset: 1, color: 'rgba(33, 150, 243, 0.1)' },
            ],
          },
        },
      },
    ],
  }), [chartData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#6e6e73]">加载中...</div>
      </div>
    );
  }

  if (chartData.dates.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-[#6e6e73]">
        暂无交易记录
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col" style={{ minHeight: '400px' }}>
      <ReactECharts 
        option={option} 
        style={{ height: '100%', width: '100%', flex: 1 }} 
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
}
