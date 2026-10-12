import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "./../config/auth/api";
import { get } from "lodash";
import { message, Tag, Button, Input, Space, Row, Col, Avatar, Tooltip } from "antd";
import Table from "./../components/Table";
import {
  ReloadOutlined,
  SearchOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Eye, DollarSign, CheckCircle2, Clock } from "lucide-react";
import { CompactStatCard } from "../components/CompactStatCard";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const Payments = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin_transactions"],
    queryFn: async () => {
      const response = await api.get("/users/transactions");
      if (response.status !== 200 || !response.data) {
        throw new Error("Failed to fetch transactions");
      }
      return response.data;
    },
    onError: () => {
      message.error("To'lovlar tarixini yuklashda xatolik yuz berdi.");
    },
  });

  const transactions = get(data, "content.transactions", []);

  // Summary Metrics
  const totalVolume = transactions
    .filter((t) => t.status === "success")
    .reduce((acc, t) => acc + Number(t.amount || 0) / 100, 0);

  const successCount = transactions.filter((t) => t.status === "success").length;
  const pendingCount = transactions.filter((t) => t.status === "pending").length;

  const getStatusTag = (status) => {
    switch (status) {
      case "success":
        return (
          <Tag color="success" className="!rounded-full font-bold">
            🟢 MUVAFFAQIYATLI
          </Tag>
        );
      case "pending":
        return (
          <Tag color="warning" className="!rounded-full font-bold">
            🟡 KUTILMOQDA
          </Tag>
        );
      case "cancelled_with_revert":
        return (
          <Tag color="volcano" className="!rounded-full font-bold">
            ↩️ QAYTARILGAN (REVERT)
          </Tag>
        );
      case "cancelled":
      case "failed":
        return (
          <Tag color="error" className="!rounded-full font-bold">
            🔴 BEKOR QILINGAN
          </Tag>
        );
      default:
        return <Tag className="!rounded-full font-bold">{status?.toUpperCase()}</Tag>;
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.paymeTransactionId?.toLowerCase().includes(term) ||
      t.user?.username?.toLowerCase().includes(term) ||
      t.user?.phone?.toLowerCase().includes(term) ||
      t.user?.profile?.fullName?.toLowerCase().includes(term)
    );
  });

  const columns = [
    {
      title: "Tranzaksiya ID",
      dataIndex: "paymeTransactionId",
      key: "paymeTransactionId",
      render: (text) => (
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
          #{text}
        </span>
      ),
    },
    {
      title: "Foydalanuvchi",
      key: "user",
      render: (_, record) => {
        const username = get(record, "user.username", "NOMA'LUM");
        const phone = get(record, "user.phone", "");
        return (
          <div
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate(`/users/${record.userId || record.user?.id}`)}
          >
            <Avatar className="bg-indigo-100 text-indigo-700 font-bold" size={34}>
              {username[0]?.toUpperCase()}
            </Avatar>
            <div>
              <div className="font-bold text-indigo-600 text-sm">{username}</div>
              <div className="text-xs text-slate-400 font-mono">{phone}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Ism / Familiya",
      key: "fullName",
      render: (_, record) => (
        <span className="text-sm text-slate-700 font-medium">
          {get(record, "user.profile.fullName", "N/A")}
        </span>
      ),
    },
    {
      title: "Summa",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => {
        const sum = Number(amount || 0) / 100;
        return (
          <span className="font-black text-emerald-600 text-base">
            +{sum.toLocaleString("uz-UZ")} UZS
          </span>
        );
      },
    },
    {
      title: "Sana & Vaqt",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => (
        <span className="text-xs text-slate-500 font-medium">
          {dayjs(text).format("YYYY-MM-DD HH:mm:ss")}
        </span>
      ),
    },
    {
      title: "Holati",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Amallar",
      key: "actions",
      width: 70,
      fixed: "right",
      render: (_, record) => (
        <Tooltip title="Mijoz CRM profilini ochish">
          <button
            type="button"
            aria-label="Profilni ochish"
            onClick={() => navigate(`/users/${record.userId || record.user?.id}`)}
            className="btn-action-primary"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      ),
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
              PAYME INTEGRATION
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Payme to'lov tizimi orqali kiritilgan barcha tranzaksiyalar monitoringi va auditi
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Input
            placeholder="Tranzaksiya ID, telefon yoki username..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 text-xs"
            allowClear
          />
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => {
              refetch();
              message.success("To'lovlar ro'yxati yangilandi");
            }}
          >
            Yangilash
          </Button>
        </div>
      </div>

      {/* Compact KPI Cards */}
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={8}>
          <CompactStatCard
            label="Jami Tushum"
            value={`${totalVolume.toLocaleString("uz-UZ")} UZS`}
            icon={<DollarSign className="w-4 h-4" />}
            color="emerald"
            description="Muvaffaqiyatli to'lovlar hajmi"
          />
        </Col>

        <Col xs={12} sm={8}>
          <CompactStatCard
            label="Muvaffaqiyatli To'lovlar"
            value={successCount}
            unit="ta"
            icon={<CheckCircle2 className="w-4 h-4" />}
            color="blue"
            description="Yakunlangan to'lov amallari"
          />
        </Col>

        <Col xs={24} sm={8}>
          <CompactStatCard
            label="Kutilayotgan Tranzaksiyalar"
            value={pendingCount}
            unit="ta"
            icon={<Clock className="w-4 h-4" />}
            color={pendingCount > 0 ? "amber" : "slate"}
            description="Jarayonda bo'lgan to'lovlar"
          />
        </Col>
      </Row>

      {/* Main Table */}
      <div className="enterprise-card p-4">
        <Table
          dataSource={filteredTransactions}
          columnDefs={columns}
          isLoading={isLoading}
          rowKey="id"
          size="small"
        />
      </div>
    </div>
  );
};

export default Payments;
