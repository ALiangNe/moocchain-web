import { useMemo, useState } from 'react';
import { Segmented } from 'antd';
import ReactECharts from 'echarts-for-react';
import type { AuditRecordInfo } from '@/types/auditRecordType';

type AuditStatusValue = 0 | 1 | 2;

interface AuditLineChartProps {
  teacherRecords: AuditRecordInfo[];
  resourceRecords: AuditRecordInfo[];
  courseRecords: AuditRecordInfo[];
}

const STATUS_TEXT: Record<AuditStatusValue, string> = {
  0: '待审核',
  1: '已通过',
  2: '已拒绝',
};

// 与 AuditBarChart 保持一致：待审核橙、已通过绿、已拒绝蓝
const STATUS_OPTIONS: { label: string; value: AuditStatusValue }[] = [
  { label: '待审核', value: 0 },
  { label: '已通过', value: 1 },
  { label: '已拒绝', value: 2 },
];

const SERIES_COLORS = ['#2196F3', '#4CAF50', '#FF9800']; // 教师、资源、课程

const formatAxisLabel = (dateKey: string) => dateKey.slice(5); // 显示 MM-DD

const toDateKey = (dateString?: string | null | Date) => {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
};

export default function AuditLineChart({ teacherRecords, resourceRecords, courseRecords }: AuditLineChartProps) {
  const [currentStatus, setCurrentStatus] = useState<AuditStatusValue>(0);

  const chartData = useMemo(() => {
    const allRecords = [...teacherRecords, ...resourceRecords, ...courseRecords];
    const dateSet = new Set<string>();

    allRecords.forEach((record) => {
      const key = toDateKey(record.createdAt);
      if (key) dateSet.add(key);
    });

    const dates = Array.from(dateSet).sort();
    if (dates.length === 0) {
      return {
        dates: [],
        teacher: [] as number[],
        resource: [] as number[],
        course: [] as number[],
      };
    }

    const countByDate = (records: AuditRecordInfo[], status: AuditStatusValue) => {
      const map: Record<string, number> = {};
      records.forEach((record) => {
        if (record.auditStatus !== status) return;
        const key = toDateKey(record.createdAt);
        if (!key) return;
        map[key] = (map[key] || 0) + 1;
      });
      return map;
    };

    const teacherMap = countByDate(teacherRecords, currentStatus);
    const resourceMap = countByDate(resourceRecords, currentStatus);
    const courseMap = countByDate(courseRecords, currentStatus);

    const teacher = dates.map((d) => teacherMap[d] || 0);
    const resource = dates.map((d) => resourceMap[d] || 0);
    const course = dates.map((d) => courseMap[d] || 0);

    return { dates, teacher, resource, course };
  }, [teacherRecords, resourceRecords, courseRecords, currentStatus]);

  const totalCount = chartData.teacher.reduce((a, b) => a + b, 0)
    + chartData.resource.reduce((a, b) => a + b, 0)
    + chartData.course.reduce((a, b) => a + b, 0);

  if (chartData.dates.length === 0 || totalCount === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-[#6e6e73]" style={{ minHeight: '500px' }}>
        暂无数据
      </div>
    );
  }

  const option = {
    color: SERIES_COLORS,
    title: {
      text: '审核状态趋势',
      subtext: STATUS_TEXT[currentStatus] || '',
      left: 'center',
      top: '5%',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
    },
    legend: {
      data: ['教师认证', '资源审核', '课程审核'],
      top: '5%',
      right: '5%',
      orient: 'vertical',
    },
    grid: {
      left: '5%',
      // 给右侧纵向 legend 留出空间，避免遮挡图表
      right: '22%',
      bottom: '8%',
      top: '20%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: chartData.dates,
      axisLabel: {
        formatter: (value: string) => formatAxisLabel(value),
        rotate: 45,
      },
    },
    yAxis: {
      type: 'value',
      name: '数量',
    },
    series: [
      {
        name: '教师认证',
        type: 'line',
        data: chartData.teacher,
        smooth: true,
      },
      {
        name: '资源审核',
        type: 'line',
        data: chartData.resource,
        smooth: true,
      },
      {
        name: '课程审核',
        type: 'line',
        data: chartData.course,
        smooth: true,
      },
    ],
  };

  return (
    <div className="relative w-full" style={{ minHeight: '500px' }}>
      <div className="absolute left-4 top-4 z-10">
        <Segmented
          options={STATUS_OPTIONS}
          value={currentStatus}
          onChange={(val) => setCurrentStatus(val as AuditStatusValue)}
          size="middle"
        />
      </div>
      <ReactECharts option={option} style={{ height: '500px', width: '100%' }} opts={{ renderer: 'canvas' }} />
    </div>
  );
}
