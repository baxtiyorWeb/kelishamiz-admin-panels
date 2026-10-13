import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../config/auth/api";
import { Row, Col, Tag, Button, Tooltip, message } from "antd";
import { CompactStatCard } from "../components/CompactStatCard";
import {
  Activity,
  Database,
  Server,
  Cloud,
  CreditCard,
  Bell,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Clock,
  Layers,
  Cpu,
} from "lucide-react";
import dayjs from "dayjs";

const getStatusBadge = (status) => {
  switch (status) {
    case "HEALTHY":
    case "OPERATIONAL":
    case "NORMAL":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Faol / Barqaror
        </span>
      );
    case "CONFIGURED":
    case "CONFIGURED_TEST":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          Uланган (Test/Ready)
        </span>
      );
    case "IN_MEMORY_ACTIVE":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
          <Layers className="w-3.5 h-3.5 text-purple-600" />
          In-Memory Kesh Faol
        </span>
      );
    case "DEGRADED":
    case "ATTENTION":
    case "TEST_MODE_PENDING":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          E'tibor talab / Testda
        </span>
      );
    case "UNAVAILABLE":
    case "CRITICAL":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Ishlamayapti / Xato
        </span>
      );
    case "NOT_CONFIGURED":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          Sozlanmagan
        </span>
      );
  }
};

const PlatformHealth = () => {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["platform-health-status"],
    queryFn: async () => {
      const res = await api.get("/admin/dashboard/platform-health");
      return res.data;
    },
    refetchInterval: 15000,
  });

  const services = data?.services || {};
  const overall = data?.overallStatus || "NORMAL";
  const checkedAt = data?.checkedAt;

  const apiService = services.api || {};
  const dbService = services.database || {};
  const cacheService = services.cache || {};
  const mediaService = services.mediaStorage || {};
  const paymentsService = services.payments || {};
  const notifService = services.notifications || {};
  const telegramService = services.telegram || {};

  const formatUptime = (seconds) => {
    if (!seconds) return "—";
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d} kun ${h} soat`;
    if (h > 0) return `${h} soat ${m} daqiqa`;
    return `${m} daqiqa`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="enterprise-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold text-slate-900 m-0">Platforma Salomatligi & Telemetriya</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              V2.2 HEALTH OPS
            </span>
            {getStatusBadge(overall)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Infratuzilma xizmatlari, ma'lumotlar bazasi, kesh va tashqi integratsiyalarning real vaqtdagi ish holati
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 font-mono">
            {checkedAt ? `Tekshirildi: ${dayjs(checkedAt).format("HH:mm:ss")}` : "Tekshirilmoqda..."}
          </span>
          <Button
            type="primary"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />}
            onClick={() => {
              refetch();
              message.success("Tizim salomatligi yangilandi");
            }}
            loading={isFetching}
            className="text-xs font-semibold"
          >
            Qayta tekshirish
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={6}>
          <CompactStatCard
            label="Ma'lumotlar Bazasi Ping"
            value={dbService.latencyMs ? `${dbService.latencyMs} ms` : "0 ms"}
            icon={<Database className="w-4 h-4 text-emerald-600" />}
            color={dbService.status === "HEALTHY" ? "emerald" : "amber"}
            description={dbService.dialect || "PostgreSQL TypeORM"}
          />
        </Col>

        <Col xs={12} sm={6}>
          <CompactStatCard
            label="API Uptime"
            value={formatUptime(apiService.uptimeSeconds)}
            icon={<Clock className="w-4 h-4 text-blue-600" />}
            color="blue"
            description={`Node ${apiService.nodeVersion || process.version}`}
          />
        </Col>

        <Col xs={12} sm={6}>
          <CompactStatCard
            label="Xotira (RAM RSS)"
            value={apiService.memoryRssMb ? `${apiService.memoryRssMb} MB` : "—"}
            icon={<Cpu className="w-4 h-4 text-purple-600" />}
            color="purple"
            description={`Heap: ${apiService.memoryHeapUsedMb || 0} MB`}
          />
        </Col>

        <Col xs={12} sm={6}>
          <CompactStatCard
            label="Tizim Muhiti"
            value={apiService.environment?.toUpperCase() || "PRODUCTION"}
            icon={<Server className="w-4 h-4 text-slate-600" />}
            color="slate"
            description="Rejim & xavfsizlik"
          />
        </Col>
      </Row>

      {/* Honest Infrastructure Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PostgreSQL Database */}
        <div className="enterprise-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">PostgreSQL Relational DB</div>
                <div className="text-[11px] text-slate-500">Asosiy ma'lumotlar bazasi va tranzaksiyalar ombori</div>
              </div>
            </div>
            {getStatusBadge(dbService.status)}
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>So'rov kechikishi (Latency):</span>
              <span className="font-mono font-bold text-slate-800">{dbService.latencyMs || 0} ms</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Ulanish turi:</span>
              <span className="font-semibold text-slate-800">{dbService.dialect || "PostgreSQL Connection Pool"}</span>
            </div>
          </div>
        </div>

        {/* Redis / In-Memory Cache */}
        <div className="enterprise-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">Kesh Qatlami (Cache Layer)</div>
                <div className="text-[11px] text-slate-500">Tezkor so'rovlar va API kesh mexanizmi</div>
              </div>
            </div>
            {getStatusBadge(cacheService.status)}
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Provayder:</span>
              <span className="font-semibold text-slate-800">{cacheService.provider || "In-Memory"}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Holat:</span>
              <span className="text-slate-500">
                {cacheService.status === "HEALTHY"
                  ? "Tashqi Redis serveriga ulangan"
                  : "Ichki in-memory kesh bilan xavfsiz ishlamoqda"}
              </span>
            </div>
          </div>
        </div>

        {/* Bunny CDN Media Storage */}
        <div className="enterprise-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">Bunny CDN Media Storage</div>
                <div className="text-[11px] text-slate-500">E'lon rasmlari va foydalanuvchi hujjatlari ombori</div>
              </div>
            </div>
            {getStatusBadge(mediaService.status)}
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Integratsiya:</span>
              <span className="font-semibold text-slate-800">{mediaService.provider || "Bunny Storage"}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Konfiguratsiya:</span>
              <span className="text-slate-500">
                {mediaService.status === "CONFIGURED" ? "API kalitlari ulangan" : "Fayllar local/standart saqlanmoqda"}
              </span>
            </div>
          </div>
        </div>

        {/* Payme Payment Gateway */}
        <div className="enterprise-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-200">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">Payme UZS To‘lov Tizimi</div>
                <div className="text-[11px] text-slate-500">To‘lovlar qabuli va tranzaksiyalar qaydi</div>
              </div>
            </div>
            {getStatusBadge(paymentsService.status)}
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Backend Tayyorgarligi:</span>
              <span className="font-semibold text-emerald-700">100% (JSON-RPC 2.0 to‘liq yozilgan)</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shlyuz holati:</span>
              <span className="text-slate-500">
                {paymentsService.status === "CONFIGURED_TEST"
                  ? "Test/Sandbox rejimida faol"
                  : "Mavjud tranzaksiyalar auditda aks ettiriladi"}
              </span>
            </div>
          </div>
        </div>

        {/* Firebase Cloud Messaging */}
        <div className="enterprise-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">Firebase Push Xabarnomalar</div>
                <div className="text-[11px] text-slate-500">Mobil ilovaga tezkor push bildirishnomalar</div>
              </div>
            </div>
            {getStatusBadge(notifService.status)}
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Provayder:</span>
              <span className="font-semibold text-slate-800">{notifService.provider || "FCM"}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Holat:</span>
              <span className="text-slate-500">
                {notifService.status === "CONFIGURED" ? "Kalitlar mavjud" : "Server sozlamalarida kutilmoqda"}
              </span>
            </div>
          </div>
        </div>

        {/* Telegram Bot Notifications */}
        <div className="enterprise-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-200">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">Telegram Bot Bildirishnomalari</div>
                <div className="text-[11px] text-slate-500">Moderatorlarga xabarlar va shoshilinch signallar</div>
              </div>
            </div>
            {getStatusBadge(telegramService.status)}
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Provayder:</span>
              <span className="font-semibold text-slate-800">{telegramService.provider || "Telegram API"}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Holat:</span>
              <span className="text-slate-500">
                {telegramService.status === "CONFIGURED" ? "Bot faol" : "Telegram token sozlanmagan"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformHealth;
