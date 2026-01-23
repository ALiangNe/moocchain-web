import { useState } from 'react';
import { Card, Progress, Spin, Button, Drawer, Rate, Alert } from 'antd';
import { CheckCircleOutlined, EditOutlined } from '@ant-design/icons';
import type { LearningRecordInfo } from '@/types/learningRecordType';
import ReviewForm from './ReviewForm';

interface LearningProgressProps {
  learningRecord: LearningRecordInfo | null;
  loading?: boolean;
  submitting?: boolean;
  onSubmitReview?: (review: string, rating: number) => void;
}

export default function LearningProgress({ learningRecord, loading, submitting, onSubmitReview }: LearningProgressProps) {
  const [drawerVisible, setDrawerVisible] = useState(false);
  // 格式化学习时长
  const formatLearningTime = (seconds?: number) => {
    if (!seconds) return '0分钟';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  };

  if (loading) {
    return (
      <Card className="shadow-sm rounded-2xl">
        <div className="flex justify-center items-center py-8">
          <Spin />
        </div>
      </Card>
    );
  }

  if (!learningRecord) {
    return (
      <Card className="shadow-sm rounded-2xl">
        <div className="text-center py-8 text-[#6e6e73]">
          <p>开始学习后，学习进度将显示在这里</p>
        </div>
      </Card>
    );
  }

  const progress = learningRecord.progress || 0;
  const isCompleted = learningRecord.isCompleted === 1;
  const hasReview = !!learningRecord.review;

  const handleSubmitReview = (review: string, rating: number) => {
    if (onSubmitReview) {
      onSubmitReview(review, rating);
      setDrawerVisible(false);
    }
  };

  return (
    <>
      <Card className="shadow-sm rounded-2xl">
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#1d1d1f]">学习进度</span>
              {isCompleted && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircleOutlined /> 已完成
                </span>
              )}
            </div>
            <Progress percent={progress} strokeColor={isCompleted ? '#52c41a' : '#007aff'} className="mb-2" />
            <div className="flex justify-between text-xs text-[#6e6e73]">
              <span>已学习：{formatLearningTime(learningRecord.learningTime)}</span>
              <span>{progress}%</span>
            </div>
          </div>

          {!isCompleted && (
            <Alert type="warning" message={`未完成学习，剩余 ${Math.max(0, 100 - progress)}%`} description="继续学习直至 100% 后可对本资源打分并提交评价！" className="text-xs" />
          )}

          {isCompleted && !hasReview && (
            <div className="border-t border-gray-200 pt-6">
              <Alert type="success" message="已完成学习，进度 100%" description="点击下方「提交评价」按钮，给本资源打个分并写几句评价吧！" className="mb-3 text-xs" />
              <Button type="primary" icon={<EditOutlined />} onClick={() => setDrawerVisible(true)} className="rounded-lg w-full">提交评价</Button>
            </div>
          )}

          {hasReview && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-[#1d1d1f]">我的评价</h3>
                <Button type="link" icon={<EditOutlined />} onClick={() => setDrawerVisible(true)} className="p-0">修改</Button>
              </div>
              <div className="space-y-2">
                <div><Rate disabled value={learningRecord.rating || 0} /></div>
                <p className="text-[#6e6e73]">{learningRecord.review}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Drawer title="提交评价" placement="right" onClose={() => setDrawerVisible(false)} open={drawerVisible} width={700}>
        <ReviewForm learningRecord={learningRecord} submitting={submitting} onSubmitReview={handleSubmitReview} />
      </Drawer>
    </>
  );
}
