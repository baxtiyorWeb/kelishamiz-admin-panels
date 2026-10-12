import React, { useState, useMemo } from "react";
import { Tooltip, message } from "antd";
import { Copy, Check, ChevronDown, ChevronRight, AlertCircle, FileCode } from "lucide-react";

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "accesstoken",
  "refreshtoken",
  "secret",
  "apikey",
  "key",
  "authorization",
  "auth",
  "cardnumber",
  "cvv",
]);

/**
 * Redacts sensitive fields recursively
 */
export function sanitizeData(data) {
  if (data === null || data === undefined) return data;
  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase().replace(/[^a-z]/g, "");
    if (SENSITIVE_KEYS.has(lowerKey)) {
      cleaned[key] = "•••••••• [REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      cleaned[key] = sanitizeData(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Enterprise Safe JSON Viewer Component
 */
export const SafeJsonViewer = ({
  data,
  maxHeight = "360px",
  redactSecrets = true,
  initialExpanded = true,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const { parsedData, parseError } = useMemo(() => {
    if (data === null || data === undefined) {
      return { parsedData: null, parseError: null };
    }
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return { parsedData: parsed, parseError: null };
      } catch (err) {
        return { parsedData: data, parseError: "Malformed or raw string data" };
      }
    }
    return { parsedData: data, parseError: null };
  }, [data]);

  const sanitized = useMemo(() => {
    if (!redactSecrets || parsedData === null || typeof parsedData !== "object") {
      return parsedData;
    }
    return sanitizeData(parsedData);
  }, [parsedData, redactSecrets]);

  const formattedJson = useMemo(() => {
    if (sanitized === null || sanitized === undefined) return "null";
    if (typeof sanitized === "string") return sanitized;
    try {
      return JSON.stringify(sanitized, null, 2);
    } catch {
      return String(sanitized);
    }
  }, [sanitized]);

  const handleCopy = () => {
    if (!formattedJson) return;
    navigator.clipboard.writeText(formattedJson).then(() => {
      setCopied(true);
      message.success("JSON muvaffaqiyatli nusxalandi");
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      message.error("Nusxa olishda xatolik yuz berdi");
    });
  };

  if (data === null || data === undefined || (typeof data === "object" && Object.keys(data).length === 0)) {
    return (
      <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 text-xs font-mono">
        <FileCode className="w-3.5 h-3.5 text-slate-400" />
        <span>Tafsilotlar mavjud emas (bo'sh obyekt)</span>
      </div>
    );
  }

  return (
    <div className={`border border-slate-200 rounded-xl overflow-hidden bg-slate-900 text-slate-100 shadow-sm ${className}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-800/80 border-b border-slate-700/60 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white font-mono font-medium transition-colors cursor-pointer"
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            <span className="text-[11px] uppercase tracking-wider text-slate-400">Payload / Metadata</span>
          </button>
          {parseError && (
            <Tooltip title={parseError}>
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800">
                <AlertCircle className="w-3 h-3" />
                Raw Text
              </span>
            </Tooltip>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Tooltip title={copied ? "Nusxalandi!" : "Xavfsiz JSON nusxasini olish"}>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-700/60 hover:bg-slate-700 text-slate-200 hover:text-white font-mono text-[11px] transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-300" />}
              <span>{copied ? "Nusxalandi" : "Nusxa"}</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Code Body */}
      {isExpanded && (
        <pre
          style={{ maxHeight }}
          className="p-3.5 m-0 font-mono text-xs text-slate-200 overflow-auto whitespace-pre leading-relaxed selection:bg-indigo-700 selection:text-white"
        >
          {formattedJson}
        </pre>
      )}
    </div>
  );
};

export default SafeJsonViewer;
