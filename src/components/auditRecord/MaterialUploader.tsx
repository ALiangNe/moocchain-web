import { Upload, Button, message } from 'antd';
import { UploadOutlined, FileTextOutlined } from '@ant-design/icons';
import type { UserInfo } from '../../types/userType';

interface MaterialUploaderProps {
  user: UserInfo | null;
  onUpload: (file: File) => Promise<void>;
  loading?: boolean;
  showReuploadButton?: boolean;
}

export default function MaterialUploader({ user, onUpload, loading, showReuploadButton = true }: MaterialUploaderProps) {
  const handleUpload = async (file: File) => {
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    if (!isPdf && !isImage) {
      message.error('只能上传 PDF 或图片文件');
      return false;
    }
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('文件大小不能超过 10MB');
      return false;
    }
    await onUpload(file);
    return false;
  };

  const uploadProps = {
    beforeUpload: handleUpload,
    showUploadList: false,
    maxCount: 1,
  };

  return (
    <div className="w-full">
      {user?.certificateFile ? (
        <div className="p-6 border-2 border-dashed border-green-300 rounded-lg bg-green-50">
          <div className="flex items-center gap-4">
            <FileTextOutlined className="text-4xl text-green-600" />
            <div className="flex-1">
              <p className="text-lg font-semibold text-green-800 mb-1">已上传材料</p>
              <p className="text-gray-600">{user.certificateFile}</p>
            </div>
            {showReuploadButton && (
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />} loading={loading}>重新上传</Button>
              </Upload>
            )}
          </div>
        </div>
      ) : (
        <Upload {...uploadProps} style={{ display: 'block', width: '100%' }}>
          <div className="w-full p-12 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-[#007aff] transition-colors cursor-pointer bg-gray-50 hover:bg-blue-50">
            <UploadOutlined className="text-5xl text-gray-400 mb-4" />
            <p className="text-lg font-semibold text-gray-700 mb-2">点击或拖拽文件到此区域上传</p>
            <p className="text-sm text-gray-500">支持 PDF 或图片文件，文件大小不超过 10MB</p>
          </div>
        </Upload>
      )}
    </div>
  );
}

