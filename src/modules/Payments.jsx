import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "./../config/auth/api";
import { get } from "lodash";
import { message, Tag, Button, Input, Space, Row, Col, Avatar } from "antd";
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
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 m-0">To'lovlar & Tranzaksiyalar Markazi</h1>
          <p className="text-xs text-slate-500 mt-1">
            Payme to'lov tizimi orqali kiritilgan barcha tranzaksiyalar monitoringi.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Tranzaksiya ID, telefon yoki username..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-72 !rounded-xl"
            allowClear
          />
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => {
              refetch();
              message.success("To'lovlar ro'yxati yangilandi");
            }}
            className="!rounded-xl font-bold"
          >
            Yangilash
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Jami Tushum (Muvaffaqiyatli)</span>
              <DollarOutlined className="text-emerald-500 text-base" />
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-2">
              {totalVolume.toLocaleString("uz-UZ")} UZS
            </div>
            <div className="text-xs text-slate-400 mt-1">Barcha muvaffaqiyatli to'lovlar</div>
          </div>
        </Col>

        <Col xs={24} sm={8}>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Muvaffaqiyatli To'lovlar</span>
              <CheckCircleOutlined className="text-indigo-500 text-base" />
            </div>
            <div className="text-2xl font-black text-slate-800 mt-2">
              {successCount} ta
            </div>
            <div className="text-xs text-slate-400 mt-1">Yakunlangan to'lov amallari</div>
          </div>
        </Col>

        <Col xs={24} sm={8}>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Kutilayotgan Tranzaksiyalar</span>
              <ClockCircleOutlined className="text-amber-500 text-base" />
            </div>
            <div className="text-2xl font-black text-amber-600 mt-2">
              {pendingCount} ta
            </div>
            <div className="text-xs text-slate-400 mt-1">Jarayonda bo'lgan to'lovlar</div>
          </div>
        </Col>
      </Row>

      {/* Main Table */}
      <Table
        dataSource={filteredTransactions}
        columnDefs={columns}
        isLoading={isLoading}
        rowKey="id"
      />
    </div>
  );
};

export default Payments;
