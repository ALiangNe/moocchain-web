import { useState, useEffect } from 'react';
import { Button, Rate, Input } from 'antd';
import type { LearningRecordInfo } from '@/types/learningRecordType';

const { TextArea } = Input;

interface CourseReviewFormProps {
  learningRecord: LearningRecordInfo | null;
  submitting?: boolean;
  onSubmitReview?: (review: string, rating: number) => void;
}

export default function CourseReviewForm({ learningRecord, submitting, onSubmitReview }: CourseReviewFormProps) {
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(0);

  // 当学习记录更新时，同步表单数据
  useEffect(() => {
    if (!learningRecord) return;
    queueMicrotask(() => {
      setReview(learningRecord.review || '');
      setRating(learningRecord.rating || 0);
    });
  }, [learningRecord]);

  // 处理评价提交
  const handleSubmitReview = () => {
    if (!onSubmitReview) return;
    onSubmitReview(review, rating);
  };

  if (!learningRecord) return null;

  return (
    <div className="space-y-6">
      <div>
        <span className="text-sm font-medium text-[#1d1d1f] mb-3 block">评分</span>
        <Rate value={rating} onChange={setRating} />
      </div>
      <div>
        <span className="text-sm font-medium text-[#1d1d1f] mb-3 block">评价内容</span>
        <TextArea rows={6} value={review} onChange={(e) => setReview(e.target.value)} placeholder="请输入您的评价..." className="rounded-lg" style={{ resize: 'none' }} />
      </div>
      <Button type="primary" loading={submitting} onClick={handleSubmitReview} className="rounded-lg w-full">提交评价</Button>
    </div>
  );
}
