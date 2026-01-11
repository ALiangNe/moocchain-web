import { Upload, Button, message } from 'antd';
import { UploadOutlined, FileTextOutlined, InboxOutlined } from '@ant-design/icons';
import type { UserInfo } from '../../types/userType';

const { Dragger } = Upload;

interface CertificateUploadProps {
  user: UserInfo | null;
  onUpload: (file: File) => Promise<void>;
  loading?: boolean;
  showReuploadButton?: boolean;
}

export default function CertificateUpload({ user, onUpload, loading, showReuploadButton = true }: CertificateUploadProps) {
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
        <Dragger {...uploadProps} className="border-2 border-dashed border-gray-300 hover:border-[#007aff] transition-colors rounded-lg">
          <p className="ant-upload-drag-icon text-[#007aff]">
            <InboxOutlined className="text-4xl" />
          </p>
          <p className="ant-upload-text text-base font-medium text-[#1d1d1f]">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint text-sm text-[#6e6e73]">支持 PDF 或图片文件，文件大小不超过 10MB</p>
        </Dragger>
      )}
    </div>
  );
}
