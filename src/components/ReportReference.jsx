import React from "react";
import { Tag as AntTag, Tooltip } from "antd";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ExternalLink,
  User,
  Tag as TagIcon,
  Store,
  HelpCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const REPORT_STATUS_MAP = {
  PENDING: {
    label: "Kutilmoqda",
    color: "amber",
    tagColor: "warning",
    icon: <Clock className="w-3 h-3 text-amber-600" />,
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
  },
  REVIEWING: {
    label: "Ko'rib chiqilmoqda",
    color: "blue",
    tagColor: "processing",
    icon: <RotateCcw className="w-3 h-3 text-blue-600 animate-spin" />,
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
  },
  RESOLVED: {
    label: "Hal qilingan",
    color: "emerald",
    tagColor: "success",
    icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  REJECTED: {
    label: "Rad etilgan",
    color: "slate",
    tagColor: "default",
    icon: <XCircle className="w-3 h-3 text-slate-500" />,
    badgeBg: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

/**
 * Visually distinct, recognizable complaint presentation component
 * Emphasizes actual complaint reason and target entity, with secondary technical ID
 */
export const ReportReference = ({
  report,
  id,
  reason,
  targetType,
  targetId,
  targetDetails,
  status = "PENDING",
  createdAt,
  linkable = true,
  onClick,
  className = "",
}) => {
  const navigate = useNavigate();

  const reportId = report?.id || id;
  const reportReason = report?.reason || reason || "Qoidabuzarlik shikoyati";
  const reportStatus = (report?.status || status || "PENDING").toUpperCase();
  const reportTargetType = (report?.targetType || targetType || "PRODUCT").toUpperCase();
  const reportTargetId = report?.targetId || targetId;
  const details = report?.targetDetails || targetDetails;
  const createdDate = report?.createdAt || createdAt;

  const statusConfig = REPORT_STATUS_MAP[reportStatus] || REPORT_STATUS_MAP.PENDING;

  // Determine target human-readable label
  let targetSummary = "";
  let targetLink = null;
  let targetIcon = <AlertTriangle className="w-3 h-3 text-amber-600" />;

  const isProduct =
    reportTargetType === "PRODUCT" || reportTargetType === "LISTING";
  const isUser =
    reportTargetType === "USER" || reportTargetType === "CHAT_USER";
  const isShop = reportTargetType === "SHOP";

  if (isProduct) {
    targetIcon = <TagIcon className="w-3 h-3 text-blue-600" />;
    targetSummary = details?.title
      ? `“${details.title}” e’loni`
      : reportTargetId
      ? `E’lon #${reportTargetId}`
      : "E’lon";
    targetLink = `/products?search=${reportTargetId}`;
  } else if (isUser) {
    targetIcon = <User className="w-3 h-3 text-purple-600" />;
    const userName = details?.fullName || details?.username;
    targetSummary = userName
      ? `“${userName}” akkaunti`
      : reportTargetId
      ? `Foydalanuvchi #${reportTargetId}`
      : "Foydalanuvchi";
    targetLink = `/users/${reportTargetId}`;
  } else if (isShop) {
    targetIcon = <Store className="w-3 h-3 text-amber-600" />;
    targetSummary = details?.name
      ? `“${details.name}” do‘koni`
      : `Do‘kon #${reportTargetId}`;
    targetLink = "/shops";
  } else {
    targetSummary = `${reportTargetType} #${reportTargetId}`;
  }

  const isTargetMissing = details?.isDeleted;

  const handleOpenReport = (e) => {
    if (onClick) {
      e.stopPropagation();
      onClick(report);
      return;
    }
    if (linkable) {
      e.stopPropagation();
      navigate(`/reports?search=${reportId}`);
    }
  };

  return (
    <div
      onClick={handleOpenReport}
      className={`p-2.5 rounded-xl border border-amber-200/90 bg-gradient-to-r from-amber-50/40 via-white to-amber-50/20 hover:border-amber-300 transition-all ${
        linkable ? "cursor-pointer" : ""
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Left header: Reason & Target */}
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100/80 text-amber-900 border border-amber-200 flex-shrink-0">
            <AlertTriangle className="w-3 h-3 text-amber-700" />
            <span>Shikoyat</span>
          </span>

          <span className="font-bold text-xs text-slate-900 truncate">
            {targetSummary} bo‘yicha
          </span>

          {reportId && (
            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
              #{reportId}
            </span>
          )}
        </div>

        {/* Right: Status badge */}
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${statusConfig.badgeBg}`}
        >
          {statusConfig.icon}
          <span>{statusConfig.label}</span>
        </span>
      </div>

      {/* Complaint Reason Details */}
      <div className="mt-1 text-xs text-slate-700 flex items-center gap-1">
        <span className="font-semibold text-slate-500 text-[11px]">Sababi:</span>
        <span className="font-medium text-slate-800 line-clamp-1">{reportReason}</span>
      </div>

      {/* Target Preview or Missing notice */}
      {isTargetMissing ? (
        <div className="mt-1.5 px-2 py-1 bg-slate-100/80 border border-slate-200 rounded text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
          <HelpCircle className="w-3 h-3 text-slate-400" />
          <span>Obyekt avval o‘chirilgan yoki topilmadi (shikoyat jurnali saqlanmoqda)</span>
        </div>
      ) : details && (details.title || details.fullName || details.username) ? (
        <div className="mt-1.5 px-2 py-1 bg-white border border-slate-200/80 rounded-lg flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 truncate">
            {details.imageUrl && (
              <img
                src={details.imageUrl}
                alt=""
                className="w-5 h-5 rounded object-cover border border-slate-200 flex-shrink-0"
              />
            )}
            <span className="font-medium text-slate-700 truncate">
              {details.title || details.fullName || `@${details.username}`}
            </span>
          </div>

          {targetLink && linkable && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(targetLink);
              }}
              className="text-[10px] font-bold text-blue-700 hover:underline flex items-center gap-0.5 ml-2 cursor-pointer flex-shrink-0"
            >
              <span>Obyektni ochish</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      ) : null}

      {/* Footer Timestamp */}
      {createdDate && (
        <div className="mt-1 text-[10px] text-slate-400 font-mono flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          <span>{dayjs(createdDate).format("YYYY-MM-DD HH:mm")}</span>
        </div>
      )}
    </div>
  );
};

export default ReportReference;
