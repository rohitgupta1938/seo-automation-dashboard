'use client';
// components/shared/AuditProgress.js

export default function AuditProgress({ progress = 0, status }) {
  const steps = [
    { pct: 5, label: 'Initializing' },
    { pct: 15, label: 'Crawling' },
    { pct: 25, label: 'PageSpeed' },
    { pct: 35, label: 'Search Console' },
    { pct: 45, label: 'Schema' },
    { pct: 55, label: 'On-Page' },
    { pct: 65, label: 'Technical' },
    { pct: 75, label: 'Keywords' },
    { pct: 85, label: 'Claude AI' },
    { pct: 90, label: 'Database' },
    { pct: 95, label: 'PDF' },
    { pct: 100, label: 'Notifications' },
  ];

  const currentStep = steps.filter(s => s.pct <= progress).pop();
  const isCompleted = status === 'COMPLETED';
  const isFailed = status === 'FAILED';

  const barColor = isFailed ? 'bg-red-500' : isCompleted ? 'bg-emerald-500' : 'bg-teal-500';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">
          {isFailed ? 'Audit Failed' : isCompleted ? 'Audit Complete' : currentStep?.label || 'Waiting...'}
        </span>
        <span className="font-bold text-slate-900">{progress}%</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex gap-1">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-colors ${
              step.pct <= progress
                ? isFailed ? 'bg-red-400' : 'bg-teal-400'
                : 'bg-slate-200'
            }`}
            title={step.label}
          />
        ))}
      </div>
    </div>
  );
}
