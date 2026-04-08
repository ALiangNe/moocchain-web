import exploreBg from '@/assets/images/explore-bg-04.jpg';

export default function Explore() {
  return (
    <div
      className="relative min-h-[calc(100vh-64px)] overflow-hidden"
      style={{ backgroundImage: `url(${exploreBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
    >
      {/* 遮罩颜色与顶部导航（白底）一致，提升文字可读性 */}
      <div className="absolute inset-0 bg-white/65" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl text-center">
          {/* 顶部小标签 */}
          <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/50 px-5 py-2 text-xs font-medium text-slate-700 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            专注可信学习、可验证认证体系
          </div>

          {/* 两行大标题（第二行强调色） */}
          <h1 className="text-balance text-[44px] font-semibold leading-[1.14] tracking-tight text-slate-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.75)] sm:text-7xl sm:leading-[1.12]">
            MOOC Chain 在线学习平台
          </h1>
          <div className="mt-5 text-balance text-[44px] font-semibold leading-[1.14] tracking-tight sm:text-7xl sm:leading-[1.12]">
            <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(255,255,255,0.75)]">
              成果可验证，过程可追溯
            </span>
          </div>

          {/* 说明文字 */}
          <p className="mx-auto mt-10 max-w-3xl text-pretty text-base leading-9 text-slate-600 sm:text-lg sm:leading-10">
            我们为高校 MOOC 提供学习记录上链、证书确权与资源发布，并引入代币激励机制
            <br className="hidden sm:block" />
            把关键成果写进链上，让每一次学习都能被证明
          </p>

          {/* 底部分隔线（接近参考图） */}
          <div className="mx-auto mt-14 h-px w-full max-w-4xl bg-gradient-to-r from-transparent via-slate-200/90 to-transparent" />

          {/* Trusted by 样式的“能力模块”占位 */}
          <div className="mt-12">
            <div className="text-[11px] font-semibold tracking-[0.26em] text-slate-500">平台核心模块</div>
            <div className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-x-10 gap-y-10 text-sm text-slate-500 sm:grid-cols-4 sm:gap-y-0">
              {[
                {
                  label: '学习记录上链',
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                      <path d="M7 7h10M7 12h10M7 17h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path
                        d="M6.5 3.5h11A2 2 0 0 1 19.5 5.5v13a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z"
                        stroke="currentColor"
                        strokeWidth="1.2"
                      />
                    </svg>
                  ),
                },
                {
                  label: '证书确权可验',
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                      <path
                        d="M12 3.5 19.5 7.8v8.4L12 20.5 4.5 16.2V7.8L12 3.5Z"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinejoin="round"
                      />
                      <path d="M9.2 12.1l1.8 1.9 3.8-4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                },
                {
                  label: '资源确权发布',
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                      <path
                        d="M12 4.2 20 8.6v6.8l-8 4.4-8-4.4V8.6l8-4.4Z"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinejoin="round"
                      />
                      <path d="M12 8.3v8.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      <path d="M8.8 11.3 12 8.3l3.2 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                },
                {
                  label: '代币激励机制',
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                      <path d="M12 4.5v15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      <path
                        d="M15.5 7.4c0-1.3-1.6-2.4-3.5-2.4S8.5 6.1 8.5 7.4 10 9.8 12 10c2 .2 3.5 1.3 3.5 2.6S13.9 15 12 15s-3.5-1.1-3.5-2.4"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                      <path d="M7 18.5h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  ),
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-center gap-3 py-1 opacity-70">
                  <span className="text-slate-400">{item.icon}</span>
                  <span className="font-medium tracking-wide">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

