interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: { value: string; positive: boolean };
  accent?: "cyan" | "green" | "amber" | "red";
  icon?: React.ReactNode;
}

const ACCENT_MAP = {
  cyan: "#00D9FF",
  green: "#00E5A0",
  amber: "#F59E0B",
  red: "#EF4444",
};

export default function KpiCard({
  title,
  value,
  subtitle,
  trend,
  accent = "cyan",
  icon,
}: KpiCardProps) {
  const color = ACCENT_MAP[accent];

  return (
    <div
      className="rounded-2xl p-6 card-hover relative overflow-hidden"
      style={{ background: "#111C33", border: "1px solid #1A2744" }}>
      {/* Background glow */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none"
        style={{ background: color, transform: "translate(30%, -30%)" }}
      />

      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
          {title}
        </p>
        {icon && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}18`, color }}>
            {icon}
          </div>
        )}
      </div>

      <p
        className="text-2xl font-semibold font-mono tracking-tight"
        style={{ color: "#E8EDF5" }}>
        {value}
      </p>

      {subtitle && (
        <p className="text-xs text-text-secondary mt-1">{subtitle}</p>
      )}

      {trend && (
        <div className="flex items-center gap-1.5 mt-3">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              color: trend.positive ? "#00E5A0" : "#EF4444",
              background: trend.positive ? "#00E5A015" : "#EF444415",
            }}>
            {trend.positive ? "▲" : "▼"} {trend.value}
          </span>
          <span className="text-xs text-text-muted">vs mes anterior</span>
        </div>
      )}
    </div>
  );
}
