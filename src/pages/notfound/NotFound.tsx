import { Button } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-[#1d1d1f] mb-4">404</h1>
          <h2 className="text-lg font-semibold mb-4 text-[#1d1d1f]">页面未找到</h2>
          <p className="text-[#6e6e73] mb-8">抱歉，您访问的页面不存在或已被移除。</p>
          <Button type="primary" icon={<HomeOutlined />} onClick={() => navigate('/')} className="rounded-lg">
            返回首页
          </Button>
        </div>
      </div>
    </div>
  );
}
