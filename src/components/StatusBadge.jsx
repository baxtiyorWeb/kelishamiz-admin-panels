import React from "react";
import { Clock, CheckCircle2, XCircle, ShieldAlert, ShieldCheck, RotateCcw } from "lucide-react";

const STATUS_DICTIONARY = {
  // Product statuses
  pending: {
    label: "Ko‘rib chiqish kutilmoqda",
    badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
    icon: <Clock className="w-3 h-3 text-amber-600" />,
  },
  active: {
    label: "Faol sotuvda",
    badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
  },
  completed: {
    label: "Yakunlangan",
    badgeBg: "bg-blue-50 text-blue-800 border-blue-200",
    icon: <ShieldCheck className="w-3 h-3 text-blue-600" />,
  },
  rejected: {
    label: "Rad etilgan",
    badgeBg: "bg-rose-50 text-rose-800 border-rose-200",
    icon: <XCircle className="w-3 h-3 text-rose-600" />,
  },

  // Report statuses
  PENDING: {
    label: "Ko‘rib chiqilmoqda",
    badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
    icon: <Clock className="w-3 h-3 text-amber-600 animate-pulse" />,
  },
  REVIEWING: {
    label: "Jarayonda",
    badgeBg: "bg-blue-50 text-blue-800 border-blue-200",
    icon: <RotateCcw className="w-3 h-3 text-blue-600 animate-spin" />,
  },
  RESOLVED: {
    label: "Hal qilingan",
    badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
  },
  REJECTED: {
    label: "Asossiz (Rad)",
    badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
    icon: <XCircle className="w-3 h-3 text-slate-500" />,
  },

  // User moderation statuses
  blocked: {
    label: "Bloklangan hisob",
    badgeBg: "bg-rose-50 text-rose-800 border-rose-200",
    icon: <ShieldAlert className="w-3 h-3 text-rose-600" />,
  },
  spam: {
    label: "Spam cheklovi",
    badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
    icon: <ShieldAlert className="w-3 h-3 text-amber-600" />,
  },
  user_active: {
    label: "Faol hisob",
    badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
  },
};

export const StatusBadge = ({ status, type, customLabel, size = "default", className = "" }) => {
  const key = type ? `${type}_${status}` : status;
  const config = STATUS_DICTIONARY[key] || STATUS_DICTIONARY[status] || {
    label: customLabel || String(status || "Noma‘lum"),
    badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
    icon: null,
  };

  const isSmall = size === "small";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold border ${
        isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      } ${config.badgeBg} ${className}`}
    >
      {config.icon}
      <span>{customLabel || config.label}</span>
    </span>
  );
};

export default StatusBadge;
