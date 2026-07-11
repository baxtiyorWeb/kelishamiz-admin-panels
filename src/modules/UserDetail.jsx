import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "./../config/auth/api";
import { get } from "lodash";
import { message, Card, Row, Col, Avatar, Tag, Button, Spin } from "antd";
import Table from "./../components/Table";
import { ArrowLeftOutlined, UserOutlined } from "@ant-design/icons";

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["user_details", id],
    queryFn: async () => {
      const response = await api.get("/users/" + id + "/details");
      if (response.status !== 200 || !response.data) {
        throw new Error("Failed to fetch user details");
      }
      return response.data;
    },
    onError: (error) => {
      console.error("Error fetching user details:", error);
      message.error("Foydalanuvchi ma'lumotlarini yuklashda xatolik yuz berdi.");
    },
  });

  const user = get(data, "content.user", null);
  const products = get(data, "content.products", []);
  const transactions = get(data, "content.transactions", []);

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Spin size="large" tip="Foydalanuvchi ma'lumotlari yuklanmoqda..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h3>Foydalanuvchi topilmadi</h3>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/users")}>
          Ortga qaytish
        </Button>
      </div>
    );
  }

  const productColumns = [
    {
      title: "Rasm",
      dataIndex: "images",
      key: "images",
      render: (images) => {
        const firstImg = get(images, "[0]", null);
        return firstImg ? (
          <img src={firstImg} alt="product" style={{ width: "45px", height: "45px", objectFit: "cover", borderRadius: "8px" }} />
        ) : (
          <div style={{ width: "45px", height: "45px", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px" }}>N/A</div>
        );
      },
    },
    {
      title: "E'lon nomi",
      dataIndex: "title",
      key: "title",
      render: (text) => <span style={{ fontWeight: "bold" }}>{text}</span>,
    },
    {
      title: "Kategoriya",
      dataIndex: ["category", "name"],
      key: "category",
    },
    {
      title: "Narx",
      dataIndex: "price",
      key: "price",
      render: (price) => <span>{Number(price || 0).toLocaleString("uz-UZ")} UZS</span>,
    },
    {
      title: "Holati",
      dataIndex: "published",
      key: "published",
      render: (published) => (
        published ? <Tag color="green">FAOLLASHTIRILGAN</Tag> : <Tag color="gold">KUTILMOQDA</Tag>
      ),
    },
  ];

  const transactionColumns = [
    {
      title: "Tranzaksiya ID",
      dataIndex: "paymeTransactionId",
      key: "paymeTransactionId",
      render: (text) => <span style={{ fontFamily: "monospace" }}>{text}</span>,
    },
    {
      title: "Summa",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => {
        const sum = Number(amount || 0) / 100;
        return <span style={{ fontWeight: "bold", color: "#10b981" }}>{sum.toLocaleString("uz-UZ")} UZS</span>;
      },
    },
    {
      title: "Sana",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => {
        const date = new Date(text);
        return <span>{date.toLocaleDateString("uz-UZ")} {date.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}</span>;
      },
    },
    {
      title: "Holati",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        if (status === "success") return <Tag color="green">MUVAFFAQIYATLI</Tag>;
        if (status === "pending") return <Tag color="gold">KUTILMOQDA</Tag>;
        return <Tag color="red">{status?.toUpperCase()}</Tag>;
      },
    },
  ];

  return (
    <div style={{ padding: "10px 0" }}>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate(-1)} 
        style={{ marginBottom: "20px" }}
      >
        Ortga
      </Button>

      <Row gap={[16, 16]} gutter={16}>
        {/* Profile Details Card */}
        <Col xs={24} lg={8}>
          <Card 
            title="Foydalanuvchi Profili" 
            bordered={false} 
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)", borderRadius: "12px" }}
          >
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <Avatar size={80} src={get(user, "profile.avatar")} icon={<UserOutlined />} />
              <h3 style={{ marginTop: "12px", marginBottom: "2px", fontWeight: "bold", fontSize: "18px" }}>
                {get(user, "profile.fullName") || user.username}
              </h3>
              <Tag color={user.role === "ADMIN" ? "red" : "blue"}>{user.role}</Tag>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f5f5f5", paddingBottom: "8px" }}>
                <span style={{ color: "#8c8c8c" }}>Foydalanuvchi ID:</span>
                <span style={{ fontWeight: "bold" }}>#{user.id}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f5f5f5", paddingBottom: "8px" }}>
                <span style={{ color: "#8c8c8c" }}>Telefon:</span>
                <span style={{ fontWeight: "bold" }}>{user.phone || "Kiritilmagan"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f5f5f5", paddingBottom: "8px" }}>
                <span style={{ color: "#8c8c8c" }}>Username:</span>
                <span style={{ fontWeight: "bold" }}>{user.username}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f5f5f5", paddingBottom: "8px" }}>
                <span style={{ color: "#8c8c8c" }}>Balans:</span>
                <span style={{ fontWeight: "bold", color: "#10b981", fontSize: "15px" }}>
                  {Number(user.balance || 0).toLocaleString("uz-UZ")} UZS
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f5f5f5", paddingBottom: "8px" }}>
                <span style={{ color: "#8c8c8c" }}>Viloyat / Tuman:</span>
                <span style={{ fontWeight: "bold" }}>
                  {get(user, "profile.region.name", "N/A")} / {get(user, "profile.district.name", "N/A")}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px" }}>
                <span style={{ color: "#8c8c8c" }}>Manzil:</span>
                <span style={{ fontWeight: "bold" }}>{get(user, "profile.address") || "Kiritilmagan"}</span>
              </div>
            </div>
          </Card>
        </Col>

        {/* User Listings & Transactions */}
        <Col xs={24} lg={16}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Products Table */}
            <Card title={"Foydalanuvchi e'lonlari (" + products.length + ")"} bordered={false} style={{ borderRadius: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
              <Table 
                dataSource={products} 
                columns={productColumns} 
                rowKey="id" 
                pagination={{ pageSize: 5 }} 
              />
            </Card>

            {/* Transactions Table */}
            <Card title={"To'lovlar tarixi (" + transactions.length + ")"} bordered={false} style={{ borderRadius: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
              <Table 
                dataSource={transactions} 
                columns={transactionColumns} 
                rowKey="id" 
                pagination={{ pageSize: 5 }} 
              />
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default UserDetail;
