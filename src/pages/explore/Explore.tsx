import exploreBg from '@/assets/images/explore-bg-02.jpg';

export default function Explore() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] py-12 text-center relative" style={{ backgroundImage: `url(${exploreBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="max-w-5xl w-full px-4 relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          欢迎来到 MOOC Chain 在线学习平台
        </h1>

        <p className="text-lg md:text-xl text-white mb-10 leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          基于区块链的大学生 MOOC 视频学习系统
        </p>
      </div>
    </div>
  );
}

