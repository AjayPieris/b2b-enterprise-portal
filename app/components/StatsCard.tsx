interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  accentColor?: string;
}

export default function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
}: StatsCardProps) {
  const changeColors = {
    up: "#16a34a",
    down: "#dc2626",
    neutral: "#b8922e",
  };

  const changeIcons = {
    up: "↑",
    down: "↓",
    neutral: "→",
  };

  return (
    <div
      className="group relative rounded-2xl p-6 transition-all duration-300"
      style={{
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9e9e9e' }}>
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight" style={{ color: '#1a1a1a' }}>{value}</p>
          {change && (
            <p className="text-xs font-medium mt-2" style={{ color: changeColors[changeType] }}>
              {changeIcons[changeType]} {change}
            </p>
          )}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-300"
          style={{
            background: 'rgba(212, 168, 67, 0.1)',
            color: '#d4a843',
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
