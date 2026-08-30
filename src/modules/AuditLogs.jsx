import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../config/auth/api";
import { Table, Tag, Input, Space, Card, Row, Col, Tabs, Tooltip, Modal, Avatar } from "antd";
import {
  History,
  ShieldAlert,
  User,
  Calendar,
  Terminal,
  Search,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Lock,
  Sparkles,
  ShieldCheck,
  Activity,
  Code,
} from "lucide-react";
import dayjs from "dayjs";

const ACTION_COLORS = {
  USER_BAN: "rose",
  USER_ROLE_CHANGE: "purple",
  PRODUCT_APPROVE: "emerald",
  PRODUCT_REJECT: "rose",
  CATEGORY_CREATE: "blue",
  BANNER_CREATE: "indigo",
  NOTIFICATION_BROADCAST: "amber",
  SYSTEM_CONFIG: "slate",
};

const AuditLogs = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["adminAuditLogs", page, pageSize, search],
    queryFn: async () => {
      const res = await api.get("/admin/audit-logs", {
        params: { page, limit: pageSize, search },
      });
      return res.data?.content || res.data;
    },
  });

  const rawLogs = useMemo(() => {
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  const totalLogs = data?.total || rawLogs.length;

  // Stats calculation
  const stats = useMemo(() => {
    const total = totalLogs;
    const adminActions = rawLogs.filter((l) => l.adminId || l.admin).length;
    const securityBans = rawLogs.filter((l) => l.action?.includes("BAN") || l.action?.includes("SPAM") || l.action?.includes("DELETE")).length;
    const uniqueTargets = new Set(rawLogs.map((l) => l.targetType).filter(Boolean)).size;

    return {
      total,
      adminActions,
      securityBans,
      uniqueTargets,
    };
  }, [rawLogs, totalLogs]);

  const filteredLogs = useMemo(() => {
    return rawLogs.filter((log) => {
      if (activeTab === "moderation" && !log.action?.includes("PRODUCT") && !log.action?.includes("SHOP")) return false;
      if (activeTab === "security" && !log.action?.includes("BAN") && !log.action?.includes("DELETE") && !log.action?.includes("ROLE")) return false;
      if (activeTab === "user" && !log.action?.includes("USER")) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          log.action?.toLowerCase().includes(q) ||
          log.targetType?.toLowerCase().includes(q) ||
          log.admin?.username?.toLowerCase().includes(q) ||
          log.id?.toString().includes(q)
        );
      }
      return true;
    });
  }, [rawLogs, activeTab, search]);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 65,
      render: (id) => <span className="font-mono text-xs font-bold text-slate-400">#{id}</span>,
    },
    {
      title: "Vaqt & Sana",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (date) => (
        <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{dayjs(date).format("YYYY-MM-DD HH:mm:ss")}</span>
        </div>
      ),
    },
    {
      title: "Admin Mas'ul",
      key: "admin",
      width: 180,
      render: (_, record) => {
        const name = record.admin?.username || `Admin #${record.adminId || 1}`;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="bg-purple-100 text-purple-700 font-extrabold text-xs" size={26}>
              {name[0]?.toUpperCase()}
            </Avatar>
            <span className="font-extrabold text-slate-900 text-xs truncate max-w-[120px]">
              @{name}
            </span>
          </div>
        );
      },
    },
    {
      title: "Amal (Action)",
      dataIndex: "action",
      key: "action",
      width: 220,
      render: (action) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-extrabold text-xs">
          <Activity className="w-3 h-3 text-indigo-500" />
          <span>{action || "SYSTEM_EVENT"}</span>
        </span>
      ),
    },
    {
      title: "Nishon Ob'ekti",
      key: "target",
      width: 180,
      render: (_, record) => (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200">
            <Layers className="w-3 h-3 text-slate-500" />
            <span>{record.targetType || "SYSTEM"}</span>
          </span>
          <span className="font-mono text-xs text-slate-500 font-semibold">#{record.targetId || "0"}</span>
        </div>
      ),
    },
    {
      title: "Tafsilot & Metadata",
      dataIndex: "details",
      key: "details",
      render: (details, record) =>
        details ? (
          <div
            onClick={() => {
              setSelectedLog(record);
              setIsDetailModalOpen(true);
            }}
            className="font-mono text-[11px] text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 px-2.5 rounded-xl border border-slate-200/80 max-w-xs truncate cursor-pointer transition-colors flex items-center justify-between gap-2"
          >
            <span className="truncate">{typeof details === "string" ? details : JSON.stringify(details)}</span>
            <Eye className="w-3 h-3 text-slate-400 flex-shrink-0" />
          </div>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 m-0 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            Tizim Xavfsizlik & Audit Tarixi (Audit Logs)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Barcha adminlar va tizim tomonidan amalga oshirilgan o'zgartirishlar, moderatsiya va operatsiyalar jurnali.
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Amal, target yoki admin..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 pr-4 py-2 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all w-72"
          />
        </div>
      </div>

      {/* KPI Cards Bar */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jami Audit Loglar</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{stats.total} ta</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Qayd etilgan operatsiyalar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <History className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-purple-500 uppercase tracking-wider flex items-center gap-1">
                Admin Amallari
              </div>
              <div className="text-2xl font-black text-purple-600 mt-1">{stats.adminActions} ta</div>
              <div className="text-[11px] text-purple-600/70 mt-0.5">Xodimlar harakatlari</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                Xavfsizlik & Jazolar
              </div>
              <div className="text-2xl font-black text-rose-600 mt-1">{stats.securityBans} ta</div>
              <div className="text-[11px] text-rose-600/70 mt-0.5">Ban, rad va o'chirishlar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                Audit Butunligi
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1">100% Himoyalangan</div>
              <div className="text-[11px] text-emerald-600/70 mt-0.5">O'zgartirib bo'lmas loglar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </Col>
      </Row>

      {/* Main Table with Tabs */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 overflow-hidden flex flex-col gap-4">
        {/* Filter Tabs */}
        <div className="border-b border-slate-100 pb-2">
          <Tabs
            activeKey={activeTab}
            onChange={(k) => setActiveTab(k)}
            className="!m-0"
            items={[
              { key: "all", label: <span className="font-bold">Barcha Audit Loglar ({totalLogs})</span> },
              { key: "moderation", label: <span className="font-bold text-purple-600">🛡️ Moderatsiya</span> },
              { key: "security", label: <span className="font-bold text-rose-600">⚡ Xavfsizlik & Jazolar</span> },
              { key: "user", label: <span className="font-bold text-blue-600">👤 Foydalanuvchilar</span> },
            ]}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredLogs}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize,
            total: totalLogs,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showSizeChanger: true,
            className: "px-4 py-2 !m-0",
          }}
        />
      </div>

      {/* JSON Metadata Lightbox Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-600" />
            <span className="font-black text-slate-900">
              Audit Hodisasi Tafsilotlari (ID #{selectedLog?.id})
            </span>
          </div>
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={680}
        className="!rounded-3xl"
      >
        {selectedLog && (
          <div className="flex flex-col gap-4 mt-3">
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 block">Amal:</span>
                <span className="font-extrabold text-slate-900 font-mono">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Admin:</span>
                <span className="font-extrabold text-slate-900">
                  {selectedLog.admin ? `@${selectedLog.admin.username}` : `Admin #${selectedLog.adminId}`}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Nishon Ob'ekti:</span>
                <span className="font-extrabold text-slate-900">
                  {selectedLog.targetType} (#{selectedLog.targetId})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Sana:</span>
                <span className="font-mono text-slate-700">
                  {dayjs(selectedLog.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Payload / Metadata JSON
              </span>
              <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-80 leading-relaxed shadow-inner">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogs;
