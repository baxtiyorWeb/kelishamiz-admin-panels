import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../config/auth/api";
import {
  Table,
  Button,
  Tag,
  Space,
  Card,
  Modal,
  Input,
  Select,
  message,
  Tabs,
  Tooltip,
  Avatar,
  Descriptions,
  Switch,
  Divider,
  Radio,
  Row,
  Col,
  Alert,
} from "antd";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  User,
  Store,
  Tag as TagIcon,
  MessageSquare,
  Clock,
  ExternalLink,
  Send,
  Ban,
  ShieldAlert,
  Search,
  FileText,
  Sparkles,
  Layers,
  Check,
  RotateCcw,
} from "lucide-react";
import dayjs from "dayjs";
import { CompactStatCard } from "../components/CompactStatCard";
import { UserReference } from "../components/UserReference";
import { ProductReference } from "../components/ProductReference";
import { StatusBadge } from "../components/StatusBadge";

const { Option } = Select;
const { TextArea } = Input;

const STATUS_CONFIG = {
  PENDING: {
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />,
    label: "Kutilmoqda",
  },
  REVIEWING: {
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    icon: <RotateCcw className="w-3.5 h-3.5 text-blue-500 animate-spin" />,
    label: "Ko'rib chiqilmoqda",
  },
  RESOLVED: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
    label: "Hal qilingan",
  },
  REJECTED: {
    bg: "bg-rose-50 text-rose-700 border-rose-200",
    icon: <XCircle className="w-3.5 h-3.5 text-rose-500" />,
    label: "Rad etilgan",
  },
};

const PRIORITY_CONFIG = {
  CRITICAL: { bg: "bg-rose-600 text-white font-black", label: "CRITICAL" },
  HIGH: { bg: "bg-amber-500 text-white font-extrabold", label: "HIGH" },
  NORMAL: { bg: "bg-indigo-50 text-indigo-700 border-indigo-200 font-bold", label: "NORMAL" },
  LOW: { bg: "bg-slate-100 text-slate-600 font-medium", label: "LOW" },
};

const RESOLUTION_TEMPLATES = [
  "Chora ko‘rildi va qoidabuzarlik bartaraf etildi.",
  "Foydalanuvchi ogohlantirildi va qoidalar eslatildi.",
  "Qoidabuzar e‘lon yoki akkaunt bloklandi.",
  "Asossiz shikoyat sifatida rad etildi.",
  "Spam yoki takroriy shikoyat.",
];

const Reports = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("all");
  const [targetTypeFilter, setTargetTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [moderationModalVisible, setModerationModalVisible] = useState(false);

  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedUserForAction, setSelectedUserForAction] = useState(null);

  // Resolve form states
  const [targetStatus, setTargetStatus] = useState("RESOLVED");
  const [notes, setNotes] = useState("");
  const [notifyReporter, setNotifyReporter] = useState(true);
  const [reporterMessage, setReporterMessage] = useState("");
  const [notifyTarget, setNotifyTarget] = useState(false);
  const [targetMessage, setTargetMessage] = useState("");
  const [targetModerationAction, setTargetModerationAction] = useState("NONE");
  const [moderationDurationHours, setModerationDurationHours] = useState(24);
  const [moderationReason, setModerationReason] = useState("");

  // Direct Message Modal states
  const [directMessageUserId, setDirectMessageUserId] = useState(null);
  const [directMessageUserName, setDirectMessageUserName] = useState("");
  const [directMessageTitle, setDirectMessageTitle] = useState("Kelishamiz.uz Xabarnomasi");
  const [directMessageBody, setDirectMessageBody] = useState("");

  // Standalone Moderation Modal states
  const [modIsBlocked, setModIsBlocked] = useState(false);
  const [modBlockDuration, setModBlockDuration] = useState("24h");
  const [modBanReason, setModBanReason] = useState("");
  const [modIsSpam, setModIsSpam] = useState(false);
  const [modSpamDuration, setModSpamDuration] = useState("24h");
  const [modSpamReason, setModSpamReason] = useState("");
  const [modSendNotification, setModSendNotification] = useState(true);
  const [modNotificationMessage, setModNotificationMessage] = useState("");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["adminReports", page, pageSize, statusFilter],
    queryFn: async () => {
      const res = await api.get("/admin/reports", {
        params: {
          page,
          limit: pageSize,
          ...(statusFilter !== "all" ? { status: statusFilter } : {}),
        },
      });
      return res.data?.content || res.data;
    },
  });

  const rawReports = useMemo(() => {
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.content?.data)) return data.content.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  const totalReports = data?.total || data?.content?.total || rawReports.length;

  // Stats calculation
  const stats = useMemo(() => {
    const total = totalReports;
    const pending = rawReports.filter((r) => r.status === "PENDING" || !r.status).length;
    const resolved = rawReports.filter((r) => r.status === "RESOLVED").length;
    const critical = rawReports.filter((r) => r.priority === "CRITICAL" || r.priority === "HIGH").length;

    return {
      total,
      pending,
      resolved,
      critical,
    };
  }, [rawReports, totalReports]);

  const filteredReports = useMemo(() => {
    return rawReports.filter((report) => {
      if (targetTypeFilter !== "all" && report.targetType !== targetTypeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const reason = (report.reason || "").toLowerCase();
        const desc = (report.description || "").toLowerCase();
        const reporterName = (report.reporter?.username || "").toLowerCase();
        const reporterPhone = (report.reporter?.phone || "").toLowerCase();
        const targetId = String(report.targetId || "").toLowerCase();
        const notesText = (report.resolutionNotes || "").toLowerCase();

        return (
          reason.includes(q) ||
          desc.includes(q) ||
          reporterName.includes(q) ||
          reporterPhone.includes(q) ||
          targetId.includes(q) ||
          notesText.includes(q)
        );
      }
      return true;
    });
  }, [rawReports, targetTypeFilter, searchQuery]);

  // Mutation: Resolve Report
  const resolveMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post(`/admin/reports/${payload.id}/resolve`, payload);
      return res.data;
    },
    onSuccess: () => {
      message.success("Shikoyat ko‘rib chiqildi va chora ko'rildi!");
      setResolveModalVisible(false);
      setDetailModalVisible(false);
      setSelectedReport(null);
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      const errorMsg = err?.response?.data?.message || "Shikoyatni yangilashda xatolik yuz berdi";
      message.error(errorMsg);
    },
  });

  // Mutation: Send Direct Message
  const directMessageMutation = useMutation({
    mutationFn: async ({ userId, title, message: msgText }) => {
      const res = await api.post("/admin/reports/send-message", {
        userId,
        title,
        message: msgText,
      });
      return res.data;
    },
    onSuccess: () => {
      message.success("Foydalanuvchiga xabarnoma muvaffaqiyatli yuborildi!");
      setMessageModalVisible(false);
      setDirectMessageBody("");
    },
    onError: (err) => {
      const errorMsg = err?.response?.data?.message || "Xabarnomani yuborishda xatolik yuz berdi";
      message.error(errorMsg);
    },
  });

  // Mutation: User Moderation (Block/Spam)
  const userModerationMutation = useMutation({
    mutationFn: async ({ userId, payload }) => {
      const res = await api.patch(`/admin/users/${userId}/moderation`, payload);
      return res.data;
    },
    onSuccess: () => {
      message.success("Foydalanuvchi intizomiy holati yangilandi!");
      setModerationModalVisible(false);
      setSelectedUserForAction(null);
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      const errorMsg = err?.response?.data?.message || "Foydalanuvchi holatini yangilashda xatolik yuz berdi";
      message.error(errorMsg);
    },
  });

  const openResolveModal = (report, st) => {
    setSelectedReport(report);
    setTargetStatus(st);

    const defaultNotes =
      st === "RESOLVED"
        ? "Chora ko‘rildi va qoidabuzarlik bartaraf etildi."
        : st === "REJECTED"
        ? "Asossiz shikoyat sifatida rad etildi."
        : "Moderator ko‘rib chiqishni boshladi.";
    setNotes(report.resolutionNotes || defaultNotes);

    setNotifyReporter(true);
    setReporterMessage(
      st === "RESOLVED"
        ? `Sizning #${report.id}-raqamli shikoyatingiz ko‘rib chiqildi va zarur choralar ko‘rildi. Kelishamiz.uz xavfsizligini ta'minlashda yordamingiz uchun rahmat!`
        : `Sizning #${report.id}-raqamli shikoyatingiz ko‘rib chiqildi va asoslar yetarli bo'lmagani sababli rad etildi.`
    );

    const isUserTarget = report.targetType === "USER" || report.targetType === "CHAT_USER";
    setNotifyTarget(isUserTarget && st === "RESOLVED");
    setTargetMessage(
      "Sizning profilingiz yuzasidan foydalanuvchilar tomonidan shikoyat kelib tushdi. Iltimos, xizmat ko‘rsatish va xavfsizlik qoidalariga amal qiling."
    );

    setTargetModerationAction("NONE");
    setModerationDurationHours(24);
    setModerationReason(defaultNotes);

    setResolveModalVisible(true);
  };

  const openDetailModal = (report) => {
    setSelectedReport(report);
    setDetailModalVisible(true);
  };

  const handleResolveSubmit = () => {
    if (!selectedReport) return;

    let targetUserId = undefined;
    if (selectedReport.targetType === "USER" || selectedReport.targetType === "CHAT_USER") {
      const parsed = Number(selectedReport.targetId);
      if (!isNaN(parsed) && parsed > 0) {
        targetUserId = parsed;
      }
    }

    resolveMutation.mutate({
      id: selectedReport.id,
      status: targetStatus,
      resolutionNotes: notes,
      notifyReporter,
      reporterMessage,
      notifyTarget,
      targetUserId,
      targetMessage,
      targetModeration: {
        action: targetModerationAction,
        durationHours: moderationDurationHours,
        reason: moderationReason || notes,
      },
    });
  };

  const renderTargetTag = (targetType, targetId, targetDetails) => {
    const typeUpper = (targetType || "").toUpperCase();
    const isProduct = typeUpper === "PRODUCT" || typeUpper === "LISTING";
    const isUser = typeUpper === "USER" || typeUpper === "CHAT_USER";

    if (targetDetails?.isDeleted) {
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-bold bg-slate-100 text-slate-700 border-slate-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>{typeUpper}</span>
            </span>
            <span className="font-mono text-xs font-bold text-slate-500">#{targetId}</span>
          </div>
          <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 flex items-center gap-1">
            <span>Obyekt avval o‘chirilgan yoki topilmadi</span>
          </div>
        </div>
      );
    }

    if (isProduct) {
      return (
        <ProductReference
          product={targetDetails}
          id={targetId}
          size="small"
        />
      );
    }

    if (isUser) {
      return (
        <UserReference
          user={targetDetails}
          id={targetId}
          size="small"
        />
      );
    }

    // Fallback for shop, message, etc.
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-bold bg-amber-50 text-amber-700 border-amber-200">
          <Store className="w-3.5 h-3.5 text-amber-600" />
          <span>{typeUpper}</span>
        </span>
        <span className="font-mono text-xs font-bold text-slate-700">#{targetId}</span>
      </div>
    );
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 65,
      render: (id) => <span className="font-mono text-xs font-bold text-slate-400">#{id}</span>,
    },
    {
      title: "Nishon Ob'ekti (Target)",
      key: "target",
      width: 250,
      render: (_, record) => (
        <div className="flex flex-col gap-1">
          {renderTargetTag(record.targetType, record.targetId, record.targetDetails)}
          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 font-mono mt-0.5">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{dayjs(record.createdAt).format("YYYY-MM-DD HH:mm")}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Shikoyat Sababi & Tafsilot",
      key: "reason",
      render: (_, record) => {
        const priorityCfg = PRIORITY_CONFIG[record.priority] || PRIORITY_CONFIG.NORMAL;
        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${priorityCfg.bg}`}>
                {priorityCfg.label}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs">
                {record.reason}
              </span>
            </div>
            {record.description ? (
              <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-200/80 max-w-sm whitespace-pre-wrap leading-relaxed">
                {record.description}
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 italic">Tavsif kiritilmagan</span>
            )}
          </div>
        );
      },
    },
    {
      title: "Shikoyatchi (Mijoz)",
      key: "reporter",
      width: 190,
      render: (_, record) => {
        if (!record.reporter) {
          return <span className="text-xs text-slate-400 font-semibold">Anonim foydalanuvchi</span>;
        }
        return <UserReference user={record.reporter} size="small" />;
      },
    },
    {
      title: "Holat",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status) => <StatusBadge status={status} />,
    },
    {
      title: "Amallar",
      key: "actions",
      width: 130,
      fixed: "right",
      render: (_, record) => (
        <div className="flex items-center gap-1">
          <Tooltip title="Tafsilotlarni ko'rish">
            <button
              type="button"
              aria-label="Tafsilotlarni ko'rish"
              onClick={() => openDetailModal(record)}
              className="btn-action-neutral hover:!text-blue-700 hover:!bg-blue-50"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          {record.status !== "RESOLVED" && (
            <Tooltip title="Hal qilish & Chora ko'rish">
              <button
                type="button"
                aria-label="Hal qilish"
                onClick={() => openResolveModal(record, "RESOLVED")}
                className="btn-action-primary !bg-emerald-50 !text-emerald-700 !border-emerald-200 hover:!bg-emerald-600 hover:!text-white"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          )}

          {record.status !== "REJECTED" && (
            <Tooltip title="Asossiz deb rad etish">
              <button
                type="button"
                aria-label="Rad etish"
                onClick={() => openResolveModal(record, "REJECTED")}
                className="btn-action-danger"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Card */}
      <div className="enterprise-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 m-0">
              Shikoyatlar & Xavfsizlik Moderatsiya Markazi
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              INCIDENT RESOLUTION
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Foydalanuvchilar, e'lonlar va do'konlar ustidan kelib tushgan shikoyatlarni ko'rib chiqish va jazo choralarini qo'llash
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Yangilash</span>
          </button>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Shikoyat, sabab yoki ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 w-60"
            />
          </div>
        </div>
      </div>

      {/* 4 Main KPI Cards Bar */}
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            title="Jami Shikoyatlar"
            value={stats.total.toLocaleString()}
            unit="ariza"
            subtext="Kelib tushgan barcha arizalar"
            icon={AlertTriangle}
            color="blue"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            title="Kutilayotganlar"
            value={stats.pending.toLocaleString()}
            unit="ko'rish kerak"
            subtext="Moderatsiya navbatida"
            icon={Clock}
            color={stats.pending > 0 ? "amber" : "slate"}
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            title="Hal Qilinganlar"
            value={stats.resolved.toLocaleString()}
            unit="yopilgan"
            subtext="Chora ko'rilgan arizalar"
            icon={CheckCircle2}
            color="emerald"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            title="Yuqori Xavfli (Critical)"
            value={stats.critical.toLocaleString()}
            unit="shoshilinch"
            subtext="Yuqori ustuvorlikdagi tekshiruvlar"
            icon={ShieldAlert}
            color={stats.critical > 0 ? "rose" : "slate"}
          />
        </Col>
      </Row>

      {/* Main Table Card with Tabs */}
      <div className="enterprise-card p-4">
        {/* Status Tabs and Target Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2 mb-4">
          <Tabs
            activeKey={statusFilter}
            onChange={(k) => {
              setStatusFilter(k);
              setPage(1);
            }}
            className="!m-0"
            items={[
              { key: "all", label: <span className="font-bold">Barchasi ({totalReports})</span> },
              {
                key: "PENDING",
                label: (
                  <span className="font-bold text-amber-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Kutilmoqda ({stats.pending})
                  </span>
                ),
              },
              {
                key: "REVIEWING",
                label: (
                  <span className="font-bold text-blue-600 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                    Ko'rib chiqilmoqda
                  </span>
                ),
              },
              {
                key: "RESOLVED",
                label: (
                  <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Hal qilingan ({stats.resolved})
                  </span>
                ),
              },
              {
                key: "REJECTED",
                label: (
                  <span className="font-bold text-rose-600 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    Rad etilgan
                  </span>
                ),
              },
            ]}
          />

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Nishon:</span>
            <Select
              value={targetTypeFilter}
              onChange={(val) => setTargetTypeFilter(val)}
              className="w-40 !rounded-xl"
            >
              <Option value="all">Barcha Nishonlar</Option>
              <Option value="USER">Foydalanuvchilar (USER)</Option>
              <Option value="PRODUCT">E'lonlar (PRODUCT)</Option>
              <Option value="SHOP">Do'konlar (SHOP)</Option>
              <Option value="MESSAGE">Xabarlar (MESSAGE)</Option>
            </Select>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredReports}
          rowKey="id"
          loading={isLoading || isFetching}
          pagination={{
            current: page,
            pageSize,
            total: totalReports,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showSizeChanger: true,
            className: "px-4 py-2 !m-0",
          }}
        />
      </div>

      {/* Resolve / Dismiss Action Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            {targetStatus === "RESOLVED" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600" />
            )}
            <span className="font-black text-slate-900">
              Shikoyatni {targetStatus === "RESOLVED" ? "Hal Qilish & Chora Ko'rish" : "Rad Etish"} (ID #{selectedReport?.id})
            </span>
          </div>
        }
        open={resolveModalVisible}
        onCancel={() => setResolveModalVisible(false)}
        onOk={handleResolveSubmit}
        confirmLoading={resolveMutation.isPending}
        okText={targetStatus === "RESOLVED" ? "Tasdiqlash & Chora Ko'rish" : "Rad Etish"}
        cancelText="Bekor"
        okButtonProps={{
          className: targetStatus === "RESOLVED" ? "!bg-emerald-600 font-bold !rounded-xl" : "!bg-rose-600 font-bold !rounded-xl",
        }}
        cancelButtonProps={{ className: "!rounded-xl font-semibold" }}
        width={680}
        className="!rounded-3xl"
      >
        {selectedReport && (
          <div className="flex flex-col gap-4 mt-3">
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs flex justify-between items-center">
              <div>
                <span className="text-slate-400 block">Nishon:</span>
                <span className="font-extrabold text-slate-900">{selectedReport.targetType} #{selectedReport.targetId}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Sabab:</span>
                <span className="font-extrabold text-rose-600">{selectedReport.reason}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Shikoyatchi:</span>
                <span className="font-extrabold text-slate-900">{selectedReport.reporter?.username || "Anonim"}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Tayyor Shablonlar:</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {RESOLUTION_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNotes(tmpl)}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 text-xs font-semibold transition-all cursor-pointer"
                  >
                    {tmpl}
                  </button>
                ))}
              </div>
              <TextArea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Moderatsiya qarori va qilingan choralar..."
                className="!rounded-xl text-xs"
              />
            </div>

            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Shikoyatchiga Push Xabar Yuborish:</span>
                <Switch checked={notifyReporter} onChange={setNotifyReporter} />
              </div>
              {notifyReporter && (
                <TextArea
                  rows={2}
                  value={reporterMessage}
                  onChange={(e) => setReporterMessage(e.target.value)}
                  className="!rounded-xl text-xs bg-white"
                />
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Detail Lightbox Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-indigo-600" />
            <span className="font-black text-slate-900">
              Shikoyat Tafsilotlari (ID #{selectedReport?.id})
            </span>
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={720}
        className="!rounded-3xl"
      >
        {selectedReport && (
          <div className="flex flex-col gap-4 mt-3">
            <Descriptions bordered size="small" column={2} className="!rounded-2xl overflow-hidden">
              <Descriptions.Item label="ID">#{selectedReport.id}</Descriptions.Item>
              <Descriptions.Item label="Sana">
                {dayjs(selectedReport.createdAt).format("YYYY-MM-DD HH:mm:ss")}
              </Descriptions.Item>
              <Descriptions.Item label="Nishon">{selectedReport.targetType} #{selectedReport.targetId}</Descriptions.Item>
              <Descriptions.Item label="Holat">
                <Tag color={selectedReport.status === "RESOLVED" ? "green" : "orange"}>
                  {selectedReport.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Sabab" span={2}>
                <span className="font-bold text-rose-600">{selectedReport.reason}</span>
              </Descriptions.Item>
              <Descriptions.Item label="To'liq Tavsif" span={2}>
                <span className="text-slate-800 text-xs leading-relaxed">
                  {selectedReport.description || "Tavsif qoldirilmagan"}
                </span>
              </Descriptions.Item>
            </Descriptions>

            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setDetailModalVisible(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Yopish
              </button>
              {selectedReport.status !== "RESOLVED" && (
                <button
                  type="button"
                  onClick={() => openResolveModal(selectedReport, "RESOLVED")}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
                >
                  Hal Qilish
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Reports;
