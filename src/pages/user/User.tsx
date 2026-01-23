import { Card } from 'antd';

export default function User() {
  return (
    <div className="py-12">
      <div className="w-full max-w-[1600px] mx-auto">
        <Card className="shadow-sm mb-6 rounded-2xl">
          <h1 className="text-lg font-semibold text-[#1d1d1f]">用户管理</h1>
        </Card>
        <Card className="shadow-sm rounded-2xl">
          <p className="text-lg text-[#6e6e73]">用户管理页面正在开发中...</p>
        </Card>
      </div>
    </div>
  );
}

