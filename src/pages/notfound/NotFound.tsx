import { Button } from 'antd';
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 via-white to-sky-50 flex items-center justify-center py-12 px-4">
      {/* 背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-sky-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* 404 大数字 - 带渐变效果 */}
        <div className="mb-6">
          <h1 className="text-9xl md:text-[12rem] font-extrabold bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent leading-none tracking-tight">
            404
          </h1>
        </div>

        {/* 主标题 */}
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          页面未找到
        </h2>

        {/* 描述文字 */}
        <p className="text-lg text-slate-600 mb-2 max-w-md mx-auto">
          抱歉，您访问的页面不存在或已被移除
        </p>
        <p className="text-sm text-slate-500 mb-10">
          可能是链接错误，或者页面已被删除
        </p>

        {/* 操作按钮组 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button type="primary" size="large" icon={<HomeOutlined />} onClick={() => navigate('/')} className="rounded-full px-8 h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">返回首页</Button>
          <Button size="large" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} className="rounded-full px-8 h-12 text-base font-medium border-slate-300 text-slate-700 hover:border-sky-400 hover:text-sky-600 transition-all duration-300">返回上一页</Button>
        </div>

        {/* 底部装饰线 */}
        <div className="mt-16 flex items-center justify-center gap-2 text-slate-400">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-slate-300" />
          <span className="text-xs">MOOC Chain</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-slate-300" />
        </div>
      </div>
    </div>
  );
}
