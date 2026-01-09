import { Avatar, Upload, message } from 'antd';
import { UserOutlined, CameraOutlined } from '@ant-design/icons';
import type { UserInfo } from '../../types/userType';
import { uploadAvatar } from '../../api/baseApi';
import { useAuthStore } from '../../stores/authStore';

interface AvatarUploadProps {
  user: UserInfo | null;
  size?: number;
}

export default function AvatarUpload({ user, size = 120 }: AvatarUploadProps) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const accessToken = useAuthStore((state) => state.accessToken);

  const getAvatarUrl = () => {
    if (!user?.avatar) return undefined;
    if (user.avatar.startsWith('http')) return user.avatar;
    const baseUrl = import.meta.env.VITE_API_BASE_URL.split('/api')[0];
    return `${baseUrl}${user.avatar}`;
  };

  return (
    <div className="relative">
      <Avatar size={size} src={getAvatarUrl()} icon={<UserOutlined />} className="border-4 border-white shadow-lg" onError={() => true} />
      <Upload
        name="avatar"
        showUploadList={false}
        accept="image/*"
        beforeUpload={(file) => {
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
          return true;
        }}
        customRequest={({ file, onSuccess, onError }) => {
          uploadAvatar(file as File)
            .then((result) => {
              if (result.code === 0 && result.data) {
                setAuth(accessToken, result.data);
                message.success('头像上传成功');
                onSuccess?.(result);
              } else {
                message.error(result.message || '头像上传失败');
                onError?.(new Error(result.message || '上传失败'));
              }
            })
            .catch((error) => {
              message.error('头像上传失败，请重试');
              onError?.(error);
            });
        }}
      >
        <div className="absolute bottom-0 right-0 w-10 h-10 bg-white border border-[#d2d2d7] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#e3f2fd] hover:border-[#007aff] transition-all shadow-lg group">
          <CameraOutlined className="text-[#1d1d1f] text-lg group-hover:text-[#007aff] transition-colors" />
      </div>
      </Upload>
    </div>
  );
}
