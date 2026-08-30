import React, { useEffect, useState, useRef } from "react";
import { Button, Progress, Tag, Modal, Alert, Row, Col, Tooltip } from "antd";
import {
  CloudUpload,
  HardDrive,
  Terminal,
  Trash2,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Server,
  Activity,
  Layers,
  Copy,
  Check,
  Radio,
  FileCheck,
} from "lucide-react";
import api from "../config/auth/api";

export default function MediaMigration() {
  const [status, setStatus] = useState({
    isRunning: false,
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    progressPercent: 0,
    currentSection: "IDLE",
    logs: [],
  });

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const logsEndRef = useRef(null);

  const fetchStatus = async () => {
    try {
      const response = await api.get("/file/migration-status");
      const data = response.data?.content || response.data || {};
      setStatus({
        isRunning: data.isRunning ?? false,
        total: data.total ?? 0,
        processed: data.processed ?? 0,
        success: data.success ?? 0,
        failed: data.failed ?? 0,
        progressPercent: data.progressPercent ?? 0,
        currentSection: data.currentSection || "IDLE",
        logs: data.logs || [],
      });
    } catch (err) {
      console.error("Status error:", err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [status.logs]);

  const handleStartMigration = () => {
    Modal.confirm({
      title: (
        <div className="flex items-center gap-2">
          <CloudUpload className="w-5 h-5 text-indigo-600" />
          <span className="font-black text-slate-900">Bunny CDN ga Rasmlarni Ko'chirish</span>
        </div>
      ),
      content: (
        <div className="py-2 text-xs text-slate-600 leading-relaxed">
          Barcha mahsulotlar, bannerlar, kategoriyalar va profillardagi tashqi/mahalliy rasmlar <strong>Bunny CDN</strong> ga xavfsiz o'tkaziladi hamda ma'lumotlar bazasidagi URL lar avtomatik almashtiriladi.
        </div>
      ),
      okText: "Ha, Boshlash",
      cancelText: "Bekor",
      okButtonProps: { className: "!bg-indigo-600 !border-indigo-600 font-bold !rounded-xl" },
      cancelButtonProps: { className: "!rounded-xl font-semibold" },
      className: "!rounded-3xl",
      onOk: async () => {
        setLoading(true);
        try {
          await api.post("/file/migrate-to-bunny");
          await fetchStatus();
        } catch (err) {
          console.error("Start error:", err);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleCleanOrphans = () => {
    Modal.confirm({
      title: (
        <div className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-rose-600" />
          <span className="font-black text-slate-900">Keraksiz (Orphan) Rasmlarni Tozalash</span>
        </div>
      ),
      content: (
        <div className="py-2 text-xs text-slate-600 leading-relaxed">
          Bunny Storage da saqlangan, lekin bazada (mahsulot, banner, kategoriya yoki profilda) hech qayerda ishlatilmayotgan eskirgan va ortiqcha fayllar xavfsiz tozalanadi.
        </div>
      ),
      okText: "Ha, Tozalash",
      cancelText: "Bekor",
      okButtonProps: { danger: true, className: "!rounded-xl font-bold" },
      cancelButtonProps: { className: "!rounded-xl font-semibold" },
      className: "!rounded-3xl",
      onOk: async () => {
        setLoading(true);
        try {
          const res = await api.post("/file/clean-orphans");
          const msg = res.data?.message || "Orphan rasmlar tozalandi!";
          Modal.success({ title: "Tozalash Natijasi", content: msg, className: "!rounded-3xl" });
          await fetchStatus();
        } catch (err) {
          console.error("Clean error:", err);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleCopyLogs = () => {
    const text = status.logs.join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 m-0 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CloudUpload className="w-4 h-4" />
            </div>
            Bunny CDN Media Migratsiya Markazi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Barcha tashqi va mahalliy media fayllarni Bunny.net bulutli xotirasiga o'tkazish hamda Sharp WebP konversiyasi.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            disabled={loading || status.isRunning}
            onClick={handleCleanOrphans}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-all cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Ortiqcha Fayllarni Tozalash</span>
          </button>

          <button
            type="button"
            disabled={loading || status.isRunning}
            onClick={handleStartMigration}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <CloudUpload className="w-4 h-4" />
            <span>{status.isRunning ? "Migratsiya Bajarilmoqda..." : "Migratsiyani Boshlash"}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aniqlangan Fayllar</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{status.total} ta</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Baza bo'yicha media resurslar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HardDrive className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                Ko'chirildi (WebP)
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{status.success} ta</div>
              <div className="text-[11px] text-emerald-600/70 mt-0.5">Bunny CDN da joylandi</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                Xatoliklar
              </div>
              <div className="text-2xl font-black text-rose-600 mt-1">{status.failed} ta</div>
              <div className="text-[11px] text-rose-600/70 mt-0.5">Qayta urinish talab etiladi</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-purple-500 uppercase tracking-wider flex items-center gap-1">
                Joriy Bosqich
              </div>
              <div className="text-lg font-black text-purple-600 mt-1 uppercase truncate max-w-[150px]">
                {status.currentSection}
              </div>
              <div className="text-[11px] text-purple-600/70 mt-0.5">
                {status.isRunning ? "Faol yuklanmoqda" : "Kutish holati"}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </Col>
      </Row>

      {/* Progress Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 m-0 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Migratsiya Jarayoni Holati
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">
              {status.processed} / {status.total} ta fayl qayta ishlandi ({status.progressPercent}%)
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              status.isRunning
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${status.isRunning ? "text-amber-500 animate-pulse" : "text-slate-400"}`} />
            <span>{status.isRunning ? "Jarayon Bajarilmoqda" : "IDLE — Kutish"}</span>
          </span>
        </div>

        <Progress
          percent={status.progressPercent}
          strokeColor={{
            "0%": "#6345ED",
            "100%": "#10B981",
          }}
          size={["100%", 12]}
          className="!m-0"
        />

        {/* Steps Breadcrumb */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
              1
            </div>
            <div className="text-xs font-bold text-slate-700">Fayllarni aniqlash</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
              2
            </div>
            <div className="text-xs font-bold text-slate-700">Sharp WebP Siqish</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
              3
            </div>
            <div className="text-xs font-bold text-slate-700">BunnyCDN Joylash</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
              4
            </div>
            <div className="text-xs font-bold text-slate-700">DB URL Yangilash</div>
          </div>
        </div>
      </div>

      {/* Cyberpunk Live Terminal Console */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl p-5 flex flex-col gap-3 overflow-hidden text-slate-300">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="font-mono text-xs text-slate-400 font-bold ml-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              migration-stream.log
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLogs}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Nusxalandi" : "Nusxalash"}</span>
            </button>
          </div>
        </div>

        {/* Stream output */}
        <div className="font-mono text-xs space-y-1.5 overflow-y-auto max-h-[320px] pr-2 scrollbar-thin scrollbar-thumb-slate-800">
          {status.logs.length === 0 ? (
            <div className="text-slate-600 italic py-6 text-center">
              Terminal kutish holatida. "Migratsiyani Boshlash" tugmasini bosing.
            </div>
          ) : (
            status.logs.map((log, index) => {
              const isSuccess = log.includes("✅") || log.includes("Success");
              const isError = log.includes("❌") || log.includes("Error") || log.includes("Failed");
              return (
                <div
                  key={index}
                  className={`leading-relaxed ${
                    isSuccess ? "text-emerald-400" : isError ? "text-rose-400 font-bold" : "text-slate-300"
                  }`}
                >
                  <span className="text-slate-600 mr-2">[{index + 1}]</span>
                  {log}
                </div>
              );
            })
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
