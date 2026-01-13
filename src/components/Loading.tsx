import { useState, useEffect } from 'react';
import icon from '@/assets/images/moocchain-icon.png';

export default function Loading() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  if (!loading) {
    return null;
  }

  const text = 'MOOC Chain ...';
  const letters = text.split('');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <div className="flex items-center gap-3">
        <img src={icon} alt="MOOC Chain" className="h-8 w-8 wave-icon" />
        <div className="flex items-center text-2xl font-bold text-[#1d1d1f]">
          {letters.map((letter, index) => (
            <span key={index} className="wave-letter" style={{ animationDelay: `${(index + 1) * 0.04}s`, }}>
              {letter === ' ' ? '\u00A0' : letter}
            </span>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes wave {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-28px);
          }
        }
        .wave-icon {
          display: inline-block;
          animation: wave 0.7s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          animation-delay: 0s;
        }
        .wave-letter {
          display: inline-block;
          animation: wave 0.7s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
