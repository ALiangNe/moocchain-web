import { Form, Input, DatePicker, Button, Upload, message } from 'antd';
import { InboxOutlined, DeleteOutlined } from '@ant-design/icons';
import type { CourseInfo } from '../../types/courseType';
import dayjs from 'dayjs';
import { useState } from 'react';

const { TextArea } = Input;
const { Dragger } = Upload;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface CourseFormProps {
  initialValues?: Partial<CourseInfo>;
  onSubmit: (values: Partial<CourseInfo>, coverImage?: File) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export default function CourseForm({ initialValues, onSubmit, onCancel, loading }: CourseFormProps) {
  const [form] = Form.useForm();
  const [coverImageFile, setCoverImageFile] = useState<File | undefined>();
  const [coverImagePreview, setCoverImagePreview] = useState<string | undefined>(
    initialValues?.coverImage
      ? initialValues.coverImage.startsWith('http')
        ? initialValues.coverImage
        : `${API_BASE_URL.split('/api')[0]}${initialValues.coverImage}`
      : undefined
  );

  const handleSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch (error) {
      console.error('Validation failed:', error);
      return;
    }

    const submitData = {
      ...values,
      courseStartTime: values.courseStartTime ? values.courseStartTime.toISOString() : undefined,
      courseEndTime: values.courseEndTime ? values.courseEndTime.toISOString() : undefined,
    };

    try {
      await onSubmit(submitData, coverImageFile);
    } catch (error) {
      console.error('Submit failed:', error);
    }
  };

  const handleCoverImageChange = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isImage) {
      message.error('只能上传图片文件！');
      return false;
    }
    if (!isLt5M) {
      message.error('图片大小不能超过 5MB！');
      return false;
    }
    setCoverImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setCoverImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleRemoveCoverImage = () => {
    setCoverImageFile(undefined);
    setCoverImagePreview(undefined);
    form.setFieldsValue({ coverImage: undefined });
  };

  return (
    <Form form={form} layout="vertical" initialValues={initialValues ? { ...initialValues, courseStartTime: initialValues.courseStartTime ? dayjs(initialValues.courseStartTime) : undefined, courseEndTime: initialValues.courseEndTime ? dayjs(initialValues.courseEndTime) : undefined } : {}} className="space-y-4">
      <Form.Item name="courseName" label="课程名称" rules={[{ required: true, message: '请输入课程名称' }]}>
        <Input placeholder="请输入课程名称" className="rounded-lg" />
      </Form.Item>
      <Form.Item name="description" label="课程描述">
        <TextArea rows={4} placeholder="请输入课程描述" className="rounded-lg" style={{ resize: 'none' }} />
      </Form.Item>
      <Form.Item label="课程封面">
        <div className="space-y-2">
          {coverImagePreview && (
            <div className="relative inline-block">
              <img src={coverImagePreview} alt="课程封面" className="w-full max-w-xs h-48 object-cover rounded-lg border border-gray-200" />
              <Button type="text" danger icon={<DeleteOutlined />} onClick={handleRemoveCoverImage} className="absolute top-2 right-2 bg-white/80 hover:bg-white">
                删除
              </Button>
            </div>
          )}
          {!coverImagePreview && (
            <Dragger accept="image/*" showUploadList={false} beforeUpload={handleCoverImageChange} className="border-2 border-dashed border-gray-300 hover:border-[#007aff] transition-colors rounded-lg">
              <p className="ant-upload-drag-icon text-[#007aff]">
                <InboxOutlined className="text-4xl" />
              </p>
              <p className="ant-upload-text text-base font-medium text-[#1d1d1f]">点击或拖拽图片到此区域上传</p>
              <p className="ant-upload-hint text-sm text-[#6e6e73]">支持 JPEG、PNG、GIF、WebP 格式，文件大小不超过 5MB</p>
            </Dragger>
          )}
        </div>
      </Form.Item>
      <Form.Item name="courseStartTime" label="开课时间" rules={[{ required: true, message: '请选择开课时间' }]}>
        <DatePicker showTime className="w-full rounded-lg" placeholder="请选择开课时间" />
      </Form.Item>
      <Form.Item name="courseEndTime" label="结课时间" rules={[{ required: true, message: '请选择结课时间' }]}>
        <DatePicker showTime className="w-full rounded-lg" placeholder="请选择结课时间" />
      </Form.Item>
      <Form.Item>
        <div className="flex gap-3">
          {onCancel && <Button onClick={onCancel} className="rounded-lg flex-1">取消</Button>}
          <Button type="primary" loading={loading} onClick={handleSubmit} className="rounded-lg flex-1">提交</Button>
        </div>
      </Form.Item>
    </Form>
  );
}
