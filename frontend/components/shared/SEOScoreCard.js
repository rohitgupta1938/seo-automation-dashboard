'use client';
// components/shared/SEOScoreCard.js
import { getScoreColor, getScoreBg } from '../../lib/utils';

export default function SEOScoreCard({ score, label, size = 'md' }) {
  const isLarge = size === 'lg';
  const scoreNum = Math.round(score || 0);

  const circumference = 2 * Math.PI * (isLarge ? 54 : 40);
  const offset = circumference - (scoreNum / 100) * circumference;

  const strokeColor = scoreNum >= 80 ? '#10b981' : scoreNum >= 60 ? '#f59e0b' : '#ef4444';
  const r = isLarge ? 54 : 40;
  const cx = isLarge ? 64 : 48;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width={cx * 2} height={cx * 2}>
          <circle
            cx={cx} cy={cx} r={r}
            fill="none" stroke="#e2e8f0" strokeWidth={isLarge ? 8 : 6}
          />
          <circle
            cx={cx} cy={cx} r={r}
            fill="none" stroke={strokeColor} strokeWidth={isLarge ? 8 : 6}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cx})`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${isLarge ? 'text-3xl' : 'text-xl'} font-bold`} style={{ color: strokeColor }}>
            {scoreNum}
          </span>
        </div>
      </div>
      {label && <p className="text-xs text-slate-500 font-medium text-center">{label}</p>}
    </div>
  );
}
