import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { ResourceInfo } from '@/types/resourceType';

interface LearningHistoryBarChartProps {
  data: ResourceInfo[];
}

export default function LearningHistoryBarChart({ data }: LearningHistoryBarChartProps) {
  // 统计每个资源类型的完成和未完成数量
  const statistics = useMemo(() => {
    const typeMap: Record<number, { completed: number; uncompleted: number }> = {
      1: { completed: 0, uncompleted: 0 }, // 文档
      2: { completed: 0, uncompleted: 0 }, // 音频
      3: { completed: 0, uncompleted: 0 }, // 视频
    };

    data.forEach((resource) => {
      const type = resource.resourceType ?? 0;
      // 只统计文档(1)、音频(2)、视频(3)，跳过其他(0)
      if (type === 0) return;

      const progress = (resource as ResourceInfo & { learningProgress?: number }).learningProgress ?? 0;
      const isCompleted = progress >= 100;

      if (isCompleted) {
        typeMap[type].completed += 1;
      } else {
        typeMap[type].uncompleted += 1;
      }
    });

    return {
      categories: ['文档', '音频', '视频'],
      completed: [
        typeMap[1].completed,
        typeMap[2].completed,
        typeMap[3].completed,
      ],
      uncompleted: [
        typeMap[1].uncompleted,
        typeMap[2].uncompleted,
        typeMap[3].uncompleted,
      ],
    };
  }, [data]);

  const option = useMemo(() => ({
    color: ['#2196F3', '#FF9800'], // 蓝色（完成）、橙色（未完成）
    title: {
      text: '学习完成情况统计',
      subtext: '学习记录',
      left: 'center',
      top: '5%',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      data: ['完成', '未完成'],
      orient: 'vertical',
      top: '5%',
      right: '5%',
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
        name: '完成',
        type: 'bar',
        data: statistics.completed,
        itemStyle: {
          color: '#2196F3',
        },
      },
      {
        name: '未完成',
        type: 'bar',
        data: statistics.uncompleted,
        itemStyle: {
          color: '#FF9800',
        },
      },
    ],
  }), [statistics]);

  // 如果没有数据，显示空状态
  const totalCount = statistics.completed.reduce((a, b) => a + b, 0) + statistics.uncompleted.reduce((a, b) => a + b, 0);
  if (totalCount === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-[#6e6e73]">
        暂无数据
      </div>
    );
  }

  return (
    <div className="w-full" style={{ minHeight: '500px' }}>
      <ReactECharts 
        option={option} 
        style={{ height: '500px', width: '100%' }} 
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
}
