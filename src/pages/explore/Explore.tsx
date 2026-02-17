import exploreBg from '@/assets/images/explore-bg-04.jpg';

export default function Explore() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] py-12 text-center relative" style={{ backgroundImage: `url(${exploreBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="max-w-5xl w-full px-4 relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-800 whitespace-nowrap drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]">
          MOOC Chain 在线学习平台
        </h1>

        <p className="text-lg md:text-xl text-slate-700 mb-10 leading-relaxed drop-shadow-[0_2px_6px_rgba(255,255,255,0.6)]">
          基于区块链的高校 MOOC 平台设计与实现
        </p>
      </div>
    </div>
  );
}

