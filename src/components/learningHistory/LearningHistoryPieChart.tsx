import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { ResourceInfo } from '@/types/resourceType';

interface LearningHistoryEchartsProps {
  data: ResourceInfo[];
}

export default function LearningHistoryEcharts({ data }: LearningHistoryEchartsProps) {
  // 统计资源类型
  const typeStatistics = useMemo(() => {
    const typeMap: Record<number, number> = {
      0: 0, // 其他
      1: 0, // 文档
      2: 0, // 音频
      3: 0, // 视频
    };

    data.forEach((resource) => {
      const type = resource.resourceType ?? 0;
      typeMap[type] = (typeMap[type] || 0) + 1;
    });

    return [
      { name: '其他', value: typeMap[0] },
      { name: '文档', value: typeMap[1] },
      { name: '音频', value: typeMap[2] },
      { name: '视频', value: typeMap[3] },
    ].filter((item) => item.value > 0); // 只显示有数据的类型
  }, [data]);

  const option = useMemo(() => ({
    color: ['#FF9800', '#4CAF50', '#2196F3'], // 橙色、绿色、蓝色
    title: {
      text: '课程类型统计',
      subtext: '学习记录',
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
        name: '课程类型',
        type: 'pie',
        radius: '75%',
        center: ['50%', '60%'],
        data: typeStatistics,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  }), [typeStatistics]);

  // 如果没有数据，显示空状态
  if (typeStatistics.length === 0) {
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
