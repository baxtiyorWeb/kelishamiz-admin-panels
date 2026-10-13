import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../config/auth/api";
import { Table, Tag, Input, Row, Col, Tabs, Modal, Avatar, Button, Tooltip, Select } from "antd";
import { CompactStatCard } from "../components/CompactStatCard";
import SafeJsonViewer from "../components/SafeJsonViewer";
import UserReference from "../components/UserReference";
import {
  History,
  ShieldAlert,
  User,
  Calendar,
  Search,
  Eye,
  ShieldCheck,
  Activity,
  Layers,
  Copy,
  Check,
} from "lucide-react";
import dayjs from "dayjs";

const AuditLogs = () => {
  const [search, setSearch] = useState("");
  const [targetTypeFilter, setTargetTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["adminAuditLogs", page, pageSize, search, targetTypeFilter],
    queryFn: async () => {
      const params = { page, limit: pageSize, search: search.trim() || undefined };
      if (targetTypeFilter !== "all") params.targetType = targetTypeFilter;
      const res = await api.get("/admin/audit-logs", { params });
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
    const securityBans = rawLogs.filter(
      (l) => l.action?.includes("BAN") || l.action?.includes("SPAM") || l.action?.includes("DELETE")
    ).length;
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
      if (activeTab === "auth" && !log.action?.includes("LOGIN") && !log.action?.includes("LOGOUT")) return false;
      if (activeTab === "lifecycle" && !log.action?.includes("DELETE") && !log.action?.includes("RESTORE") && !log.action?.includes("PURGE") && !log.action?.includes("SUSPEND")) return false;
      if (activeTab === "moderation" && !log.action?.includes("PRODUCT") && !log.action?.includes("SHOP")) return false;
      if (activeTab === "security" && !log.action?.includes("BAN") && !log.action?.includes("DELETE") && !log.action?.includes("ROLE") && !log.action?.includes("DENIED") && !log.action?.includes("FAILED")) return false;
      if (activeTab === "user" && !log.action?.includes("USER")) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          log.action?.toLowerCase().includes(q) ||
          log.targetType?.toLowerCase().includes(q) ||
          log.targetName?.toLowerCase().includes(q) ||
          log.targetSubtext?.toLowerCase().includes(q) ||
          log.admin?.username?.toLowerCase().includes(q) ||
          log.id?.toString().includes(q) ||
          log.targetId?.toString().includes(q)
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
      width: 70,
      render: (id) => <span className="font-mono text-xs text-slate-500 font-semibold">#{id}</span>,
    },
    {
      title: "Vaqt & Sana",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 165,
      render: (date) => (
        <span className="text-xs text-slate-600 font-mono">
          {date ? dayjs(date).format("YYYY-MM-DD HH:mm:ss") : "—"}
        </span>
      ),
    },
    {
      title: "Admin Mas'ul",
      key: "admin",
      width: 175,
      render: (_, record) => (
        <UserReference
          user={record.admin}
          id={record.adminId}
          fallbackName={`Admin #${record.adminId || 1}`}
          showPhone={false}
          size="sm"
        />
      ),
    },
    {
      title: "Amal (Action)",
      dataIndex: "action",
      key: "action",
      width: 190,
      render: (action) => (
        <span className="font-mono font-semibold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {action || "SYSTEM_EVENT"}
        </span>
      ),
    },
    {
      title: "Nishon Ob'ekti",
      key: "target",
      width: 230,
      render: (_, record) => {
        const typeUpper = (record.targetType || "SYSTEM").toUpperCase();
        const typeLabel =
          typeUpper === "PRODUCT"
            ? "E'lon"
            : typeUpper === "USER"
            ? "Foydalanuvchi"
            : typeUpper === "REPORT"
            ? "Shikoyat"
            : typeUpper === "BANNER"
            ? "Banner"
            : record.targetType || "Tizim";

        const typeBadgeColor =
          typeUpper === "PRODUCT"
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : typeUpper === "USER"
            ? "bg-purple-50 text-purple-700 border-purple-200"
            : typeUpper === "REPORT"
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : "bg-slate-100 text-slate-700 border-slate-200";

        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${typeBadgeColor}`}>
                {typeLabel}
              </span>
              <span className="font-mono text-[11px] text-slate-400 font-semibold">
                #{record.targetId || "0"}
              </span>
            </div>
            {record.targetName ? (
              <span
                className="text-xs font-semibold text-slate-800 truncate max-w-[210px]"
                title={record.targetName}
              >
                {record.targetName}
              </span>
            ) : null}
            {record.targetSubtext ? (
              <span className="text-[11px] text-slate-500 truncate max-w-[210px]">
                {record.targetSubtext}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "Metadata / Tafsilot",
      dataIndex: "details",
      key: "details",
      render: (details, record) =>
        details ? (
          <div
            onClick={() => {
              setSelectedLog(record);
              setIsDetailModalOpen(true);
            }}
            className="font-mono text-[11px] text-slate-600 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 max-w-xs truncate cursor-pointer transition-colors flex items-center justify-between gap-2"
          >
            <span className="truncate">{typeof details === "string" ? details : JSON.stringify(details)}</span>
            <Eye className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          </div>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        ),
    },
    {
      title: "Amallar",
      key: "actions",
      width: 70,
      fixed: "right",
      render: (_, record) => (
        <Tooltip title="Tafsilotlarni ko'rish">
          <button
            type="button"
            aria-label="Audit tafsilotini ko'rish"
            onClick={() => {
              setSelectedLog(record);
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
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog.details, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER */}
      <div className="enterprise-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 m-0">
              Audit Jurnali & Loglar Tarixi
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              TAMPER-PROOF AUDIT
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Barcha administratorlar va tizim tomonidan amalga oshirilgan o'zgartirishlar, moderatsiya va xavfsizlik operatsiyalari jurnali
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={targetTypeFilter}
            onChange={(val) => {
              setTargetTypeFilter(val);
              setPage(1);
            }}
            className="w-36 text-xs"
          >
            <Select.Option value="all">Barcha Targetlar</Select.Option>
            <Select.Option value="PRODUCT">E'lon (PRODUCT)</Select.Option>
            <Select.Option value="USER">Foydalanuvchi (USER)</Select.Option>
            <Select.Option value="SHOP">Do'kon (SHOP)</Select.Option>
            <Select.Option value="BANNER">Banner (BANNER)</Select.Option>
          </Select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Amal, target yoki admin..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 w-52"
            />
          </div>
        </div>
      </div>

      {/* 2. KPI METRICS */}
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={6} lg={6}>
          <CompactStatCard
            label="Jami Audit Loglar"
            value={stats.total}
            unit="yozuv"
            icon={<History className="w-4 h-4" />}
            color="blue"
            description="Barcha qayd etilgan operatsiyalar"
          />
        </Col>

        <Col xs={12} sm={6} lg={6}>
          <CompactStatCard
            label="Admin Amallari"
            value={stats.adminActions}
            unit="harakat"
            icon={<User className="w-4 h-4" />}
            color="indigo"
            description="Xodimlar tomonidan bajarilgan"
          />
        </Col>

        <Col xs={12} sm={6} lg={6}>
          <CompactStatCard
            label="Xavfsizlik & Jazolar"
            value={stats.securityBans}
            unit="chora"
            icon={<ShieldAlert className="w-4 h-4" />}
            color={stats.securityBans > 0 ? "rose" : "slate"}
            description="Blok, ban va o'chirishlar"
          />
        </Col>

        <Col xs={12} sm={6} lg={6}>
          <CompactStatCard
            label="Audit Butunligi"
            value="100%"
            unit="himoyalangan"
            icon={<ShieldCheck className="w-4 h-4" />}
            color="emerald"
            description="O'zgartirib bo'lmas immutable loglar"
          />
        </Col>
      </Row>

      {/* 3. MAIN TABLE WITH TABS */}
      <div className="enterprise-card p-4">
        <div className="border-b border-slate-100 pb-2 mb-3">
          <Tabs
            activeKey={activeTab}
            onChange={(k) => setActiveTab(k)}
            className="!m-0"
            items={[
              { key: "all", label: `Barchasi (${totalLogs})` },
              { key: "auth", label: "Kirish & Chiqish (Auth)" },
              { key: "lifecycle", label: "Hisob O'chirish & Tiklash" },
              { key: "moderation", label: "Moderatsiya" },
              { key: "security", label: "Xavfsizlik & Jazolar" },
              { key: "user", label: "Foydalanuvchilar" },
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
            className: "pt-4 !m-0",
          }}
          size="small"
        />
      </div>

      {/* 4. METADATA LIGHTBOX MODAL */}
      <Modal
        title={
          <span className="font-bold text-sm text-slate-900">
            Audit Hodisasi Tafsilotlari (ID #{selectedLog?.id})
          </span>
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
        {selectedLog && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div>
                <span className="text-slate-500 block">Amal:</span>
                <span className="font-semibold text-slate-900 font-mono">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Admin:</span>
                <span className="font-semibold text-slate-900">
                  {selectedLog.admin ? `@${selectedLog.admin.username}` : `Admin #${selectedLog.adminId}`}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Nishon Ob'ekti:</span>
                <span className="font-semibold text-slate-900">
                  {selectedLog.targetType} (#{selectedLog.targetId})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Sana:</span>
                <span className="font-mono text-slate-700">
                  {dayjs(selectedLog.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                </span>
              </div>
            </div>

            <div>
              <div className="mb-2">
                <span className="text-xs font-bold text-slate-700">
                  Metadata & Payload (JSON):
                </span>
              </div>
              <SafeJsonViewer data={selectedLog.details} maxHeight="300px" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogs;
