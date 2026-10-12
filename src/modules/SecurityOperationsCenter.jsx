import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../config/auth/api";
import {
  Table,
  Tag,
  Input,
  Space,
  Row,
  Col,
  Modal,
  Button,
  Descriptions,
  Tooltip,
} from "antd";
import { CompactStatCard } from "../components/CompactStatCard";
import {
  ShieldAlert,
  ShieldCheck,
  Server,
  Activity,
  AlertTriangle,
  Lock,
  Users,
  Search,
  Eye,
  RefreshCw,
  Database,
  Cpu,
  Clock,
  Key,
  Radio,
  Sliders,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Copy,
  Check,
} from "lucide-react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const SecurityOperationsCenter = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [copied, setCopied] = useState(false);

  // Fetch real SOC overview & live telemetry
  const {
    data: socData,
    isLoading: isSocLoading,
    refetch: refetchSoc,
    isFetching,
  } = useQuery({
    queryKey: ["socOverview"],
    queryFn: async () => {
      const res = await api.get("/admin/dashboard/soc-overview");
      return res.data?.content || res.data;
    },
    refetchInterval: 15000, // Live polling every 15s
  });

  // Fetch system settings to monitor emergency kill switches
  const { data: settingsData } = useQuery({
    queryKey: ["soc-system-settings"],
    queryFn: async () => {
      const res = await api.get("/settings");
      return res.data?.content || res.data || {};
    },
  });

  const threatMetrics = socData?.threatMetrics || {};
  const systemHealth = socData?.systemHealth || {};
  const recentEvents = socData?.recentEvents || [];

  // Filter events based on search input & category tab
  const filteredEvents = useMemo(() => {
    return recentEvents.filter((ev) => {
      const action = ev.action?.toUpperCase() || "";

      if (categoryFilter === "bans" && !action.includes("BAN") && !action.includes("BLOCK") && !action.includes("SPAM")) {
        return false;
      }
      if (categoryFilter === "auth" && !action.includes("LOGIN") && !action.includes("AUTH") && !action.includes("OTP")) {
        return false;
      }
      if (categoryFilter === "admin" && !action.includes("ROLE") && !action.includes("POLICY") && !action.includes("SETTING") && !action.includes("CONFIG")) {
        return false;
      }

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        action.toLowerCase().includes(q) ||
        ev.targetType?.toLowerCase().includes(q) ||
        ev.targetId?.toString().toLowerCase().includes(q) ||
        ev.admin?.username?.toLowerCase().includes(q) ||
        ev.admin?.phone?.toLowerCase().includes(q) ||
        ev.ipAddress?.toLowerCase().includes(q)
      );
    });
  }, [recentEvents, search, categoryFilter]);

  const getActionSeverity = (action) => {
    if (!action) return { label: "INFO", color: "blue", bg: "bg-blue-50 text-blue-700 border-blue-200" };
    const a = action.toUpperCase();
    if (a.includes("BAN") || a.includes("BLOCK") || a.includes("DELETE") || a.includes("MAINTENANCE")) {
      return { label: "HIGH", color: "error", bg: "bg-rose-50 text-rose-700 border-rose-200" };
    }
    if (a.includes("ROLE") || a.includes("POLICY") || a.includes("CONFIG") || a.includes("SETTING")) {
      return { label: "MEDIUM", color: "warning", bg: "bg-amber-50 text-amber-800 border-amber-200" };
    }
    return { label: "INFO", color: "blue", bg: "bg-blue-50 text-blue-700 border-blue-200" };
  };

  const columns = [
    {
      title: "Vaqt (Toshkent)",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (val) => (
        <span className="font-mono text-xs text-slate-600">
          {val ? dayjs(val).format("YYYY-MM-DD HH:mm:ss") : "—"}
        </span>
      ),
    },
    {
      title: "Hodisa & Daraja",
      dataIndex: "action",
      key: "action",
      render: (action) => {
        const severity = getActionSeverity(action);
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${severity.bg}`}>
              {severity.label}
            </span>
            <span className="font-mono text-xs font-semibold text-slate-800">
              {action}
            </span>
          </div>
        );
      },
    },
    {
      title: "Maqsad Obyekti",
      key: "target",
      render: (_, record) => (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            {record.targetType || "TIZIM"}
          </span>
          {record.targetId && (
            <span className="font-mono text-xs text-slate-500">#{record.targetId}</span>
          )}
        </div>
      ),
    },
    {
      title: "Operator / Admin",
      key: "admin",
      render: (_, record) => {
        if (!record.admin) return <span className="text-slate-400 text-xs">Tizim (Avtomatik)</span>;
        return (
          <div>
            <div className="text-xs font-semibold text-slate-800">
              {record.admin.username || `User #${record.admin.id}`}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {record.admin.role}
            </div>
          </div>
        );
      },
    },
    {
      title: "IP Manzil",
      dataIndex: "ipAddress",
      key: "ipAddress",
      width: 130,
      render: (ip) => (
        <span className="font-mono text-xs text-slate-500">
          {ip || "—"}
        </span>
      ),
    },
    {
      title: "Amal",
      key: "actionBtn",
      width: 70,
      fixed: "right",
      render: (_, record) => (
        <Tooltip title="Audit tafsilotlari">
          <button
            type="button"
            aria-label="Hodisa auditini ko'rish"
            onClick={() => {
              setSelectedEvent(record);
              setIsDetailModalOpen(true);
            }}
            className="btn-action-primary"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      ),
    },
  ];

  const handleCopyJson = () => {
    if (!selectedEvent) return;
    navigator.clipboard.writeText(JSON.stringify(selectedEvent.details || {}, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDbHealthy = systemHealth.databaseStatus === "HEALTHY";

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER */}
      <div className="enterprise-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 m-0">
              Security Operations Center (SOC)
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              L1/L2 INCIDENT RESPONSE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Xavfsizlik hodisalari monitoringi, autentifikatsiya tekshiruvi va favqulodda himoya markazi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetchSoc()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-blue-600" : "text-slate-400"}`} />
            <span>Yangilash</span>
          </button>

          <Button
            type="primary"
            onClick={() => navigate("/settings")}
            className="inline-flex items-center gap-1.5 font-semibold text-xs rounded-lg"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Xavfsizlik Sozlamalari</span>
          </Button>
        </div>
      </div>

      {/* 2. REAL-TIME SECURITY TELEMETRY CARDS */}
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={6} lg={6}>
          <CompactStatCard
            label="Ma'lumotlar Bazasi"
            value={isDbHealthy ? "HEALTHY" : systemHealth.databaseStatus || "NORMAL"}
            unit={`${systemHealth.databaseLatencyMs ?? 0}ms`}
            icon={<Database className="w-4 h-4" />}
            color="emerald"
            description={`Ping kechikishi: ${systemHealth.databaseLatencyMs ?? 0} ms`}
          />
        </Col>

        <Col xs={12} sm={6} lg={6}>
          <CompactStatCard
            label="Server Xotirasi"
            value={systemHealth.memoryRssMb ?? 0}
            unit="MB RSS"
            icon={<Cpu className="w-4 h-4" />}
            color="blue"
            description={`Heap: ${systemHealth.memoryHeapUsedMb ?? 0} MB | ${Math.round((systemHealth.uptimeSeconds || 0) / 3600)}h uptime`}
          />
        </Col>

        <Col xs={12} sm={6} lg={6}>
          <CompactStatCard
            label="Bloklangan / Spam"
            value={threatMetrics.blockedUsers ?? 0}
            unit={`/ ${threatMetrics.spamUsers ?? 0} spam`}
            icon={<Lock className="w-4 h-4" />}
            color={threatMetrics.blockedUsers > 0 ? "rose" : "slate"}
            description={`Jami ${threatMetrics.totalUsers ?? 0} mijozdan`}
            onClick={() => navigate("/users")}
          />
        </Col>

        <Col xs={12} sm={6} lg={6}>
          <CompactStatCard
            label="Ma'muriy Xodimlar"
            value={threatMetrics.activeStaff ?? 0}
            unit="staff"
            icon={<Users className="w-4 h-4" />}
            color="indigo"
            description={`SuperAdmin: ${threatMetrics.superAdmins ?? 0} | Admin: ${threatMetrics.admins ?? 0}`}
            onClick={() => navigate("/users")}
          />
        </Col>
      </Row>

      {/* 3. EMERGENCY KILL-SWITCHES & DEFENSES STATUS STRIP */}
      <div className="enterprise-card p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Faol Xavfsizlik Qalqonlari & Favqulodda Kalitlar (Live Status)
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate("/settings")}
            className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            Boshqarish <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-800">Profilaktika (Maintenance)</div>
              <div className="text-[11px] text-slate-500">Ommaviy kirishni to'xtatish</div>
            </div>
            <Tag color={settingsData?.maintenance_mode?.enabled ? "error" : "success"}>
              {settingsData?.maintenance_mode?.enabled ? "FAOL (YOPILGAN)" : "O'CHIQ"}
            </Tag>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-800">Ro'yxatdan O'tish Ingressi</div>
              <div className="text-[11px] text-slate-500">Yangi akkauntlar ochish</div>
            </div>
            <Tag color={settingsData?.registration_enabled?.enabled === false ? "error" : "success"}>
              {settingsData?.registration_enabled?.enabled === false ? "TO'XTATILGAN" : "FAOL"}
            </Tag>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-800">Media Fayllar Qalqoni</div>
              <div className="text-[11px] text-slate-500">Rasm va video yuklash</div>
            </div>
            <Tag color={settingsData?.media_upload_enabled?.enabled === false ? "warning" : "success"}>
              {settingsData?.media_upload_enabled?.enabled === false ? "TO'XTATILGAN" : "FAOL"}
            </Tag>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-800">OTP Testerlar Siyosati</div>
              <div className="text-[11px] text-slate-500">Qat'iy allowlist rejimi</div>
            </div>
            <Tag color="blue">ALLOWLIST FAOL</Tag>
          </div>
        </div>
      </div>

      {/* 4. SECURITY EVENT TIMELINE & AUDIT LOG TABLE */}
      <div className="enterprise-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
          <div>
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-700" />
              Xavfsizlik & Moderatsiya Hodisalari Oqimi (SOC Feed)
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              So'nggi ma'muriy harakatlar, foydalanuvchi bloklari va ruxsat o'zgarishlari
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category tabs */}
            <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={`px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  categoryFilter === "all" ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Barchasi
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("bans")}
                className={`px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  categoryFilter === "bans" ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Bloklar
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("admin")}
                className={`px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  categoryFilter === "admin" ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Admin & Siyosat
              </button>
            </div>

            <Input
              placeholder="Qidiruv (amal, ID, admin, IP)..."
              prefix={<Search className="w-3.5 h-3.5 text-slate-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 text-xs"
              allowClear
            />
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredEvents}
          rowKey="id"
          loading={isSocLoading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          size="small"
        />
      </div>

      {/* 5. EVENT DETAILS INSPECTOR MODAL */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-700" />
            <span className="font-bold text-sm text-slate-900">
              Xavfsizlik Hodisasi Audit Tafsilotlari
            </span>
          </div>
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            Yopish
          </Button>,
        ]}
        width={640}
        centered
      >
        {selectedEvent && (
          <div className="space-y-4 pt-2">
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Hodisa IDsi">
                <span className="font-mono text-xs font-semibold">#{selectedEvent.id}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Amal (Action)">
                <Tag color="blue" className="font-mono font-bold">
                  {selectedEvent.action}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Obyekt">
                <span className="font-semibold text-slate-800">
                  {selectedEvent.targetType} #{selectedEvent.targetId || "—"}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Operator / Mas'ul">
                <span className="font-medium text-slate-800">
                  {selectedEvent.admin?.username || `ID: ${selectedEvent.adminId || "Tizim"}`}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="IP Manzil">
                <span className="font-mono text-xs">{selectedEvent.ipAddress || "Aniqlanmadi"}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Vaqt">
                {dayjs(selectedEvent.createdAt).format("YYYY-MM-DD HH:mm:ss")}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700">
                  Metadata & Payload (JSON):
                </span>
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="text-xs text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Nusxalandi" : "Nusxa olish"}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-auto max-h-56">
                {JSON.stringify(selectedEvent.details || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SecurityOperationsCenter;
