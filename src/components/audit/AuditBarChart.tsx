import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { AuditRecordInfo } from '@/types/auditRecordType';

interface AuditBarChartProps {
  teacherRecords: AuditRecordInfo[]; // 教师认证审核记录
  resourceRecords: AuditRecordInfo[]; // 资源审核记录
  courseRecords: AuditRecordInfo[]; // 课程审核记录
}

export default function AuditBarChart({ teacherRecords, resourceRecords, courseRecords }: AuditBarChartProps) {
  const statistics = useMemo(() => {
    // 统计每种审核类型的三种状态数量
    // 0: 待审核，1: 已通过，2: 已拒绝

    // 教师认证审核统计
    const teacherPending = teacherRecords.filter((record) => record.auditStatus === 0).length;
    const teacherApproved = teacherRecords.filter((record) => record.auditStatus === 1).length;
    const teacherRejected = teacherRecords.filter((record) => record.auditStatus === 2).length;

    // 资源审核统计
    const resourcePending = resourceRecords.filter((record) => record.auditStatus === 0).length;
    const resourceApproved = resourceRecords.filter((record) => record.auditStatus === 1).length;
    const resourceRejected = resourceRecords.filter((record) => record.auditStatus === 2).length;

    // 课程审核统计
    const coursePending = courseRecords.filter((record) => record.auditStatus === 0).length;
    const courseApproved = courseRecords.filter((record) => record.auditStatus === 1).length;
    const courseRejected = courseRecords.filter((record) => record.auditStatus === 2).length;

    return {
      categories: ['教师认证', '资源审核', '课程审核'],
      pending: [teacherPending, resourcePending, coursePending],
      approved: [teacherApproved, resourceApproved, courseApproved],
      rejected: [teacherRejected, resourceRejected, courseRejected],
    };
  }, [teacherRecords, resourceRecords, courseRecords]);

  const option = useMemo(() => ({
    color: ['#FF9800', '#4CAF50', '#2196F3'], // 橙色（待审核）、绿色（已通过）、蓝色（已拒绝）
    title: {
      text: '审核状态统计',
      subtext: '审核记录',
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
      data: ['待审核', '已通过', '已拒绝'],
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
        name: '待审核',
        type: 'bar',
        data: statistics.pending,
        itemStyle: {
          color: '#FF9800', // 橙色
        },
      },
      {
        name: '已通过',
        type: 'bar',
        data: statistics.approved,
        itemStyle: {
          color: '#4CAF50', // 绿色
        },
      },
      {
        name: '已拒绝',
        type: 'bar',
        data: statistics.rejected,
        itemStyle: {
          color: '#2196F3', // 蓝色
        },
      },
    ],
  }), [statistics]);

  // 如果没有数据，显示空状态
  const totalCount = statistics.pending.reduce((a, b) => a + b, 0) + statistics.approved.reduce((a, b) => a + b, 0) + statistics.rejected.reduce((a, b) => a + b, 0);
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
