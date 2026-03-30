interface ProgressBarProps {
  current: number;
  total: number;
  message?: string;
}

export function ProgressBar({ current, total, message }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div
        className="flex justify-between text-xs"
        style={{ color: "var(--viewer-text-muted, #9ca3af)" }}
      >
        <span>{message ?? "Processing..."}</span>
        <span>{pct}%</span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: "var(--viewer-border, #374151)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-150"
          style={{ width: `${pct}%`, background: "var(--action, #3b82f6)" }}
        />
      </div>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span>{label ?? "Processing..."}</span>
    </div>
  );
}
