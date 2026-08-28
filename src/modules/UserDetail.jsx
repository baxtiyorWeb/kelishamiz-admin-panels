import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./../config/auth/api";
import { get } from "lodash";
import {
  message,
  Card,
  Row,
  Col,
  Avatar,
  Tag,
  Button,
  Spin,
  Modal,
  Input,
  Radio,
  Switch,
  Space,
} from "antd";
import Table from "./../components/Table";
import {
  ArrowLeftOutlined,
  UserOutlined,
  SendOutlined,
  StopOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Message modal state
  const [msgModalOpen, setMsgModalOpen] = useState(false);
  const [directMsgTitle, setDirectMsgTitle] = useState("Kelishamiz.uz Xabarnomasi");
  const [directMsgBody, setDirectMsgBody] = useState("");

  // Moderation modal state
  const [modModalOpen, setModModalOpen] = useState(false);
  const [modIsBlocked, setModIsBlocked] = useState(false);
  const [modBlockDuration, setModBlockDuration] = useState("24h");
  const [modBanReason, setModBanReason] = useState("");
  const [modIsSpam, setModIsSpam] = useState(false);
  const [modSpamDuration, setModSpamDuration] = useState("24h");
  const [modSpamReason, setModSpamReason] = useState("");
  const [modSendNotif, setModSendNotif] = useState(true);
  const [modNotifText, setModNotifText] = useState("Hisobingiz bo‘yicha moderatsiya cheklovi o‘rnatildi.");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["user_details", id],
    queryFn: async () => {
      const response = await api.get("/users/" + id + "/details");
      if (response.status !== 200 || !response.data) {
        throw new Error("Failed to fetch user details");
      }
      return response.data;
    },
  });

  const sendMsgMutation = useMutation({
    mutationFn: async ({ userId, title, message: text }) => {
      const res = await api.post(`/admin/users/${userId}/notify`, {
        title,
        message: text,
      });
      return res.data;
    },
    onSuccess: () => {
      message.success("Xabarnoma muvaffaqiyatli yuborildi!");
      setMsgModalOpen(false);
      setDirectMsgBody("");
    },
    onError: () => {
      message.error("Xabarnomani yuborishda xatolik yuz berdi");
    },
  });

  const moderationMutation = useMutation({
    mutationFn: async ({ userId, payload }) => {
      const res = await api.patch(`/admin/users/${userId}/moderation`, payload);
      return res.data;
    },
    onSuccess: () => {
      message.success("Foydalanuvchi moderatsiya holati yangilandi!");
      setModModalOpen(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => {
      message.error("Foydalanuvchi holatini yangilashda xatolik yuz berdi");
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
              <Space style={{ marginTop: 6 }} wrap>
                <Tag color={user.role === "ADMIN" ? "red" : "blue"}>{user.role}</Tag>
                {user.isBlocked ? (
                  <Tag color="error">
                    Bloklangan {user.blockedUntil ? `(${dayjs(user.blockedUntil).format('MM-DD HH:mm')})` : '(Doimiy)'}
                  </Tag>
                ) : (
                  <Tag color="success">Faol</Tag>
                )}
                {user.isSpam && (
                  <Tag color="volcano">
                    Spam {user.spamUntil ? `(${dayjs(user.spamUntil).format('MM-DD HH:mm')})` : ''}
                  </Tag>
                )}
              </Space>
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
              {user.banReason && (
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f5f5f5", paddingBottom: "8px" }}>
                  <span style={{ color: "#cf1322" }}>Blok sababi:</span>
                  <span style={{ fontWeight: 600, color: "#cf1322" }}>{user.banReason}</span>
                </div>
              )}
              {user.spamReason && (
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f5f5f5", paddingBottom: "8px" }}>
                  <span style={{ color: "#ad6800" }}>Spam sababi:</span>
                  <span style={{ fontWeight: 600, color: "#ad6800" }}>{user.spamReason}</span>
                </div>
              )}
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

            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <Button
                type="primary"
                icon={<SendOutlined />}
                style={{ background: "#6345ED", borderColor: "#6345ED", borderRadius: 8 }}
                onClick={() => setMsgModalOpen(true)}
              >
                Foydalanuvchiga Xabar Yuborish
              </Button>
              <Button
                danger
                icon={<StopOutlined />}
                style={{ borderRadius: 8 }}
                onClick={() => {
                  setModIsBlocked(Boolean(user.isBlocked));
                  setModBanReason(user.banReason || "");
                  setModIsSpam(Boolean(user.isSpam));
                  setModSpamReason(user.spamReason || "");
                  setModModalOpen(true);
                }}
              >
                Bloklash / Spam Boshqaruvi
              </Button>
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

      {/* Direct Message Modal */}
      <Modal
        title={`Xabar yuborish: @${user.username || user.phone}`}
        open={msgModalOpen}
        onCancel={() => setMsgModalOpen(false)}
        onOk={() => {
          if (!directMsgBody.trim()) {
            message.warning("Xabar matnini kiriting!");
            return;
          }
          sendMsgMutation.mutate({
            userId: user.id,
            title: directMsgTitle,
            message: directMsgBody,
          });
        }}
        confirmLoading={sendMsgMutation.isPending}
        okText="Yuborish"
        cancelText="Bekor qilish"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>Sarlavha:</label>
            <Input value={directMsgTitle} onChange={(e) => setDirectMsgTitle(e.target.value)} />
          </div>
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>Xabar matni:</label>
            <Input.TextArea rows={4} value={directMsgBody} onChange={(e) => setDirectMsgBody(e.target.value)} />
          </div>
        </div>
      </Modal>

      {/* User Moderation Modal */}
      <Modal
        title={`Foydalanuvchi intizomiy holati (@${user.username || user.phone})`}
        open={modModalOpen}
        onCancel={() => setModModalOpen(false)}
        onOk={() => {
          let blockedUntil = null;
          if (modIsBlocked) {
            if (modBlockDuration === "24h") blockedUntil = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
            else if (modBlockDuration === "3d") blockedUntil = new Date(Date.now() + 72 * 3600 * 1000).toISOString();
            else if (modBlockDuration === "7d") blockedUntil = new Date(Date.now() + 168 * 3600 * 1000).toISOString();
            else if (modBlockDuration === "30d") blockedUntil = new Date(Date.now() + 720 * 3600 * 1000).toISOString();
            else if (modBlockDuration === "permanent") blockedUntil = null;
          }

          let spamUntil = null;
          if (modIsSpam) {
            if (modSpamDuration === "24h") spamUntil = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
            else if (modSpamDuration === "7d") spamUntil = new Date(Date.now() + 168 * 3600 * 1000).toISOString();
            else if (modSpamDuration === "permanent") spamUntil = null;
          }

          moderationMutation.mutate({
            userId: user.id,
            payload: {
              isBlocked: modIsBlocked,
              blockedUntil,
              banReason: modBanReason || (modIsBlocked ? "Qoidabuzarlik sababli" : null),
              isSpam: modIsSpam,
              spamUntil,
              spamReason: modSpamReason || (modIsSpam ? "Spam tarqatish" : null),
              sendNotification: modSendNotif,
              notificationMessage: modNotifText,
            },
          });
        }}
        confirmLoading={moderationMutation.isPending}
        okText="Saqlash"
        cancelText="Bekor qilish"
        width={560}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
          <div style={{ background: "#fff1f0", padding: 12, borderRadius: 8, border: "1px solid #ffa39e" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: "bold", color: "#cf1322" }}>🚫 Foydalanuvchini Bloklash</span>
              <Switch checked={modIsBlocked} onChange={setModIsBlocked} />
            </div>
            {modIsBlocked && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                <Radio.Group value={modBlockDuration} onChange={(e) => setModBlockDuration(e.target.value)}>
                  <Radio.Button value="24h">24 soat</Radio.Button>
                  <Radio.Button value="3d">3 kun</Radio.Button>
                  <Radio.Button value="7d">7 kun</Radio.Button>
                  <Radio.Button value="30d">30 kun</Radio.Button>
                  <Radio.Button value="permanent">Doimiy</Radio.Button>
                </Radio.Group>
                <Input placeholder="Bloklash sababi..." value={modBanReason} onChange={(e) => setModBanReason(e.target.value)} />
              </div>
            )}
          </div>

          <div style={{ background: "#fffbe6", padding: 12, borderRadius: 8, border: "1px solid #ffe58f" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: "bold", color: "#ad6800" }}>⚠️ Spam Belgisi (Cheklov)</span>
              <Switch checked={modIsSpam} onChange={setModIsSpam} />
            </div>
            {modIsSpam && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                <Radio.Group value={modSpamDuration} onChange={(e) => setModSpamDuration(e.target.value)}>
                  <Radio.Button value="24h">24 soat</Radio.Button>
                  <Radio.Button value="7d">7 kun</Radio.Button>
                  <Radio.Button value="permanent">Doimiy</Radio.Button>
                </Radio.Group>
                <Input placeholder="Spam sababi..." value={modSpamReason} onChange={(e) => setModSpamReason(e.target.value)} />
              </div>
            )}
          </div>

          <div style={{ background: "#f6ffed", padding: 12, borderRadius: 8, border: "1px solid #b7eb8f" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: "bold", color: "#237804" }}>🔔 Bildirishnoma Jo‘natish</span>
              <Switch checked={modSendNotif} onChange={setModSendNotif} />
            </div>
            {modSendNotif && (
              <Input.TextArea rows={2} value={modNotifText} onChange={(e) => setModNotifText(e.target.value)} placeholder="Foydalanuvchiga yuboriladigan izoh..." />
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserDetail;
