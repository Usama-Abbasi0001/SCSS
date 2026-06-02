interface AlertBadgeProps {
  type: 'emergency' | 'warning' | 'info';
  children: React.ReactNode;
}

const typeStyles = {
  emergency: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
  warning: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  info: 'bg-sky-500/15 text-sky-300 border-sky-500/25'
};

export default function AlertBadge({ type, children }: AlertBadgeProps) {
  return (
    <span className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold ${typeStyles[type]}`}>
      {children}
    </span>
  );
}
