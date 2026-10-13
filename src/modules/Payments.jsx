import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "./../config/auth/api";
import { Tag, Button, Input, Row, Col, Tooltip, message, Tabs } from "antd";
import Table from "./../components/Table";
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  AlertTriangle,
  Info,
  XCircle,
  Undo2,
} from "lucide-react";
import { CompactStatCard } from "../components/CompactStatCard";
import UserReference from "../components/UserReference";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const getStatusTag = (status) => {
  switch (status) {
    case "success":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Muvaffaqiyatli
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          Kutilmoqda
        </span>
      );
    case "cancelled_with_revert":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
          <Undo2 className="w-3 h-3 text-orange-600" />
          Qaytarilgan (Revert)
        </span>
      );
    case "cancelled":
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" />
          Bekor qilingan
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
          {status?.toUpperCase()}
        </span>
      );
  }
};

const Payments = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin_transactions", page, pageSize, searchTerm, statusFilter],
    queryFn: async () => {
      try {
        const res = await api.get(
          `/admin/payments?page=${page}&limit=${pageSize}&search=${encodeURIComponent(
            searchTerm,
          )}&status=${statusFilter === "all" ? "" : statusFilter}`,
        );
        return res.data;
      } catch (err) {
        // Fallback to /users/transactions if needed
        const fallbackRes = await api.get("/users/transactions");
        const list = fallbackRes.data?.transactions || fallbackRes.data?.content?.transactions || [];
        return {
          transactions: list,
          total: list.length,
          stats: {
            totalVolume: list
              .filter((t) => t.status === "success")
              .reduce((acc, t) => acc + Number(t.amount || 0) / 100, 0),
            successCount: list.filter((t) => t.status === "success").length,
            pendingCount: list.filter((t) => t.status === "pending").length,
            failedCount: list.filter((t) => t.status !== "success" && t.status !== "pending").length,
          },
        };
      }
    },
    staleTime: 15000,
  });

  const transactions = data?.transactions || [];
  const total = data?.total || transactions.length;
  const stats = data?.stats || {};
  const totalVolume = stats.totalVolume || 0;
  const successCount = stats.successCount || 0;
  const pendingCount = stats.pendingCount || 0;
  const failedCount = stats.failedCount || 0;

  const columns = [
    {
      title: "Tranzaksiya ID",
      dataIndex: "paymeTransactionId",
      key: "paymeTransactionId",
      width: 170,
      render: (text, record) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 w-fit">
            #{text || record.id}
          </span>
          {record.reason && (
            <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
              {record.reason}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Mijoz / Foydalanuvchi",
      key: "user",
      width: 220,
      render: (_, record) => (
        <UserReference
          user={record.user}
          id={record.userId || record.user?.id}
          fallbackName={record.user?.profile?.fullName || record.user?.username || `Mijoz #${record.userId}`}
          size="sm"
        />
      ),
    },
    {
      title: "Summa",
      dataIndex: "amount",
      key: "amount",
      width: 160,
      render: (amount) => {
        const sum = Number(amount || 0) / 100;
        return (
          <span className="font-black text-emerald-700 text-sm tracking-tight">
            +{sum.toLocaleString("uz-UZ")} UZS
          </span>
        );
      },
    },
    {
      title: "Sana & Vaqt",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 165,
      render: (text) => (
        <span className="text-xs text-slate-600 font-mono">
          {text ? dayjs(text).format("YYYY-MM-DD HH:mm:ss") : "—"}
        </span>
      ),
    },
    {
      title: "Holati",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status) => getStatusTag(status),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="enterprise-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 m-0">To'lovlar & Tranzaksiyalar Markazi</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              PAYME V7.0
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Payme to'lov tizimi orqali amalga oshirilgan barcha tranzaksiyalar monitoringi, kaskadlari va auditi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tranzaksiya ID, ism, telefon..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 w-64"
            />
          </div>

          <Button
            type="primary"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />}
            onClick={() => {
              refetch();
              message.success("To'lovlar ro'yxati yangilandi");
            }}
            loading={isFetching}
            className="text-xs font-semibold"
          >
            Yangilash
          </Button>
        </div>
      </div>

      {/* Honest Integration Notice */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900/90 leading-relaxed">
          <strong>Payme Shlyuzi Holati:</strong> Backend qismida Payme JSON-RPC 2.0 protokoli (CheckPerformTransaction, PerformTransaction, CancelTransaction) to‘liq yozilgan va tranzaksiya kaskadlari ulangan. Hozirda test/ichki rejimda barcha tranzaksiyalar vaqt tamg‘alari bilan auditga yozilmoqda.
        </div>
      </div>

      {/* Compact KPI Cards */}
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={6}>
          <CompactStatCard
            label="Jami Muvaffaqiyatli Tushum"
            value={`${totalVolume.toLocaleString("uz-UZ")} UZS`}
            icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
            color="emerald"
            description="Tasdiqlangan to'lovlar hajmi"
          />
        </Col>

        <Col xs={12} sm={6}>
          <CompactStatCard
            label="Muvaffaqiyatli To'lovlar"
            value={successCount}
            unit="ta"
            icon={<CheckCircle2 className="w-4 h-4 text-blue-600" />}
            color="blue"
            description="Bajarilgan operatsiyalar"
          />
        </Col>

        <Col xs={12} sm={6}>
          <CompactStatCard
            label="Kutilayotgan Tranzaksiyalar"
            value={pendingCount}
            unit="ta"
            icon={<Clock className="w-4 h-4 text-amber-600" />}
            color={pendingCount > 0 ? "amber" : "slate"}
            description="Jarayondagi to'lovlar"
          />
        </Col>

        <Col xs={12} sm={6}>
          <CompactStatCard
            label="Bekor Qilingan / Qaytarilgan"
            value={failedCount}
            unit="ta"
            icon={<XCircle className="w-4 h-4 text-rose-600" />}
            color={failedCount > 0 ? "rose" : "slate"}
            description="Rad etilgan yoki qaytarilgan"
          />
        </Col>
      </Row>

      {/* Main Table Card with Tabs */}
      <div className="enterprise-card p-4 space-y-3">
        <Tabs
          activeKey={statusFilter}
          onChange={(key) => {
            setStatusFilter(key);
            setPage(1);
          }}
          size="small"
          items={[
            { key: "all", label: `Barchasi (${total})` },
            { key: "success", label: `Muvaffaqiyatli (${successCount})` },
            { key: "pending", label: `Kutilmoqda (${pendingCount})` },
            { key: "cancelled", label: `Bekor qilingan (${failedCount})` },
          ]}
        />

        <Table
          dataSource={transactions}
          columnDefs={columns}
          isLoading={isLoading}
          rowKey="id"
          size="small"
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
        />
      </div>
    </div>
  );
};

export default Payments;
