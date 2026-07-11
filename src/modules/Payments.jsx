import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "./../config/auth/api";
import { get } from "lodash";
import { message, Tag, Tooltip, Button } from "antd";
import Table from "./../components/Table";
import { ReloadOutlined } from "@ant-design/icons";

const Payments = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin_transactions"],
    queryFn: async () => {
      const response = await api.get("/users/transactions");
      if (response.status !== 200 || !response.data) {
        throw new Error("Failed to fetch transactions");
      }
      return response.data;
    },
    onError: (error) => {
      console.error("Error fetching transactions:", error);
      message.error("To'lovlar tarixini yuklashda xatolik yuz berdi.");
    },
  });

  const transactions = get(data, "transactions", []);

  const getStatusTag = (status) => {
    switch (status) {
      case "success":
        return <Tag color="green">MUVAFFAQIYATLI</Tag>;
      case "pending":
        return <Tag color="gold">KUTILMOQDA</Tag>;
      case "cancelled_with_revert":
        return <Tag color="volcano">BEKOR QILINGAN (REVERT)</Tag>;
      case "cancelled":
        return <Tag color="red">BEKOR QILINGAN</Tag>;
      case "failed":
        return <Tag color="error">XATOLIK</Tag>;
      default:
        return <Tag>{status?.toUpperCase()}</Tag>;
    }
  };

  const columns = [
    {
      title: "Tranzaksiya ID",
      dataIndex: "paymeTransactionId",
      key: "paymeTransactionId",
      render: (text) => <span style={{ fontFamily: "monospace", fontWeight: "bold" }}>{text}</span>,
    },
    {
      title: "Foydalanuvchi",
      key: "user",
      render: (_, record) => {
        const username = get(record, "user.username", "NOMA'LUM");
        const phone = get(record, "user.phone", "");
        return (
          <div>
            <div style={{ fontWeight: "bold" }}>{username}</div>
            <div style={{ fontSize: "11px", color: "#8c8c8c" }}>{phone}</div>
          </div>
        );
      },
    },
    {
      title: "Ism / Familiya",
      key: "fullName",
      render: (_, record) => {
        return <span>{get(record, "user.profile.fullName", "N/A")}</span>;
      },
    },
    {
      title: "Summa",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => {
        const sum = Number(amount || 0) / 100;
        return (
          <span style={{ fontWeight: "bold", color: "#10b981" }}>
            {sum.toLocaleString("uz-UZ")} UZS
          </span>
        );
      },
    },
    {
      title: "Sana",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => {
        if (!text) return "N/A";
        const date = new Date(text);
        return (
          <span>
            {date.toLocaleDateString("uz-UZ")} {date.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
          </span>
        );
      },
    },
    {
      title: "Holati",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
    },
  ];

  return (
    <div style={{ padding: "10px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>To'lovlar Monitoringi</h2>
          <p style={{ margin: 0, color: "#8c8c8c", fontSize: "12px" }}>
            Barcha foydalanuvchilar tomonidan amalga oshirilgan to'lovlar va ularning holati
          </p>
        </div>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={() => {
            refetch();
            message.success("To'lovlar ro'yxati yangilandi");
          }}
          style={{ background: "#A64AC9", borderColor: "#A64AC9", marginLeft: "auto" }}
        >
          Yangilash
        </Button>
      </div>

      <Table
        dataSource={transactions}
        columns={columns}
        loading={isLoading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
        }}
      />
    </div>
  );
};

export default Payments;
