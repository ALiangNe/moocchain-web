import { Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd';

const { Dragger } = Upload;

interface ResourceUploadProps {
  value?: File;
  onChange?: (file: File | null) => void;
  accept?: string;
}

export default function ResourceUpload({ value, onChange, accept }: ResourceUploadProps) {
  const props: UploadProps = {
    name: 'file',
    multiple: false,
    accept: accept || '.pdf,.doc,.docx,.xls,.xlsx,.mp3,.wav,.mp4,.mov,.avi,.webm,.mkv',
    beforeUpload: (file) => {
      onChange?.(file);
      return false;
    },
    onRemove: () => {
      onChange?.(null);
    },
    fileList: value ? [{
      uid: '-1',
      name: value.name,
      status: 'done',
      originFileObj: value,
    } as UploadFile] : [],
  };

  return (
    <Dragger {...props} className="border-2 border-dashed border-gray-300 hover:border-[#007aff] transition-colors rounded-lg">
      <p className="ant-upload-drag-icon text-[#007aff]">
        <InboxOutlined className="text-4xl" />
      </p>
      <p className="ant-upload-text text-base font-medium text-[#1d1d1f]">点击或拖拽文件到此区域上传</p>
      <p className="ant-upload-hint text-sm text-[#6e6e73]">支持文档（PDF、Word、Excel）、音频、视频文件</p>
    </Dragger>
  );
}
