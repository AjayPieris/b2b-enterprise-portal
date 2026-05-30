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
  accentColor = "purple",
}: StatsCardProps) {
  const changeColors = {
    up: "text-emerald-400",
    down: "text-red-400",
    neutral: "text-purple-400/60",
  };

  const changeIcons = {
    up: "↑",
    down: "↓",
    neutral: "→",
  };

  return (
    <div className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] transition-all duration-300 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5">
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 to-indigo-500/0 group-hover:from-purple-500/5 group-hover:to-indigo-500/5 transition-all duration-300" />
      
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-purple-300/60 text-xs font-semibold uppercase tracking-wider mb-2">
            {title}
          </p>
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
          {change && (
            <p className={`text-xs font-medium mt-2 ${changeColors[changeType]}`}>
              {changeIcons[changeType]} {change}
            </p>
          )}
        </div>
        <div className="w-11 h-11 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/25 transition-colors duration-300">
          {icon}
        </div>
      </div>
    </div>
  );
}
