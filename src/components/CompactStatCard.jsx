import React from "react";

const COLOR_MAP = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-100",
    valueText: "text-slate-900",
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-100",
    valueText: "text-emerald-700",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-100",
    valueText: "text-amber-700",
  },
  rose: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-100",
    valueText: "text-rose-600",
  },
  indigo: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-100",
    valueText: "text-indigo-700",
  },
  slate: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    valueText: "text-slate-900",
  },
};

/**
 * Compact, information-dense metric card component
 * Follows enterprise SaaS guidelines: compact padding, clear labels, prominent numerical values.
 */
export const CompactStatCard = ({
  title,
  label,
  value,
  unit,
  subtext,
  description,
  icon: Icon,
  color = "blue",
  badge,
  onClick,
  className = "",
}) => {
  const scheme = COLOR_MAP[color] || COLOR_MAP.blue;
  const cardTitle = title || label;
  const cardSubtext = subtext || description;

  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) {
      return Icon;
    }
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between gap-3 h-full ${
        onClick ? "cursor-pointer hover:bg-slate-50/50" : ""
      } ${className}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
            {cardTitle}
          </span>
          {badge && <span className="text-[10px] font-semibold">{badge}</span>}
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className={`text-xl font-bold tracking-tight ${scheme.valueText}`}>
            {value}
          </span>
          {unit && <span className="text-xs font-medium text-slate-500">{unit}</span>}
        </div>
        {cardSubtext && (
          <div
            className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]"
            title={typeof cardSubtext === "string" ? cardSubtext : undefined}
          >
            {cardSubtext}
          </div>
        )}
      </div>

      {Icon && (
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${scheme.bg} ${scheme.text} ${scheme.border}`}
        >
          {renderIcon()}
        </div>
      )}
    </div>
  );
};

export default CompactStatCard;
