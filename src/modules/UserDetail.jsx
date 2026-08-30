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
  Tabs,
  Descriptions,
  Table,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  SendOutlined,
  StopOutlined,
  PhoneOutlined,
  DollarOutlined,
  ShoppingOutlined,
  CreditCardOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
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
      const response = await api.get(`/users/${id}/details`);
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
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" tip="Foydalanuvchi ma'lumotlari yuklanmoqda..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Foydalanuvchi topilmadi</h3>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/users")}>
          Foydalanuvchilar ro'yxatiga qaytish
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
          <img src={firstImg} alt="" className="w-11 h-11 object-cover rounded-xl border border-slate-200" />
        ) : (
          <div className="w-11 h-11 bg-slate-100 flex items-center justify-center text-xs text-slate-400 font-bold rounded-xl">
            N/A
          </div>
        );
      },
    },
    {
      title: "E'lon nomi",
      dataIndex: "title",
      key: "title",
      render: (text) => <span className="font-bold text-slate-800 text-sm">{text}</span>,
    },
    {
      title: "Kategoriya",
      dataIndex: ["category", "name"],
      key: "category",
      render: (cat) => <Tag color="purple">{cat || "N/A"}</Tag>,
    },
    {
      title: "Narx",
      dataIndex: "price",
      key: "price",
      render: (price) => (
        <span className="font-extrabold text-slate-900">
          {Number(price || 0).toLocaleString("uz-UZ")} UZS
        </span>
      ),
    },
    {
      title: "Holati",
      dataIndex: "published",
      key: "published",
      render: (pub) =>
        pub ? <Tag color="success">Faol</Tag> : <Tag color="warning">Kutilmoqda</Tag>,
    },
  ];

  const transactionColumns = [
    {
      title: "Tranzaksiya ID",
      dataIndex: "paymeTransactionId",
      key: "paymeTransactionId",
      render: (text) => <span className="font-mono text-xs font-bold text-slate-600">#{text}</span>,
    },
    {
      title: "Summa",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => {
        const sum = Number(amount || 0) / 100;
        return <span className="font-extrabold text-emerald-600">{sum.toLocaleString("uz-UZ")} UZS</span>;
      },
    },
    {
      title: "Sana",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => dayjs(text).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Holati",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        if (status === "success") return <Tag color="success">MUVAFFAQIYATLI</Tag>;
        if (status === "pending") return <Tag color="warning">KUTILMOQDA</Tag>;
        return <Tag color="error">{status?.toUpperCase()}</Tag>;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/users")}
          className="!rounded-xl font-bold"
        >
          Foydalanuvchilar Ro'yxatiga Qaytish
        </Button>
        <div className="flex items-center gap-2">
          <Tag color="blue" className="!rounded-full px-3 py-1 font-bold">
            ID: #{user.id}
          </Tag>
          <Tag color={user.role === "ADMIN" ? "red" : "geekblue"} className="!rounded-full px-3 py-1 font-bold">
            {user.role}
          </Tag>
        </div>
      </div>

      <Row gutter={[20, 20]}>
        {/* Left Profile Card */}
        <Col xs={24} lg={8}>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5">
            <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
              <Avatar
                size={84}
                src={get(user, "profile.avatar")}
                icon={<UserOutlined />}
                className="bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-2xl shadow-md"
              >
                {(user.username || "U")[0]?.toUpperCase()}
              </Avatar>
              <h2 className="text-xl font-black text-slate-900 mt-3 m-0">
                {get(user, "profile.fullName") || user.username || "Ismsiz"}
              </h2>
              <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-1">
                <PhoneOutlined /> {user.phone || "Telefon yo'q"}
              </div>
              <div className="mt-3 flex gap-1.5 flex-wrap justify-center">
                {user.isBlocked ? (
                  <Tag color="error" className="!rounded-full font-bold">
                    🚫 Bloklangan
                  </Tag>
                ) : (
                  <Tag color="success" className="!rounded-full font-bold">
                    🟢 Faol Akkaunt
                  </Tag>
                )}
                {user.isSpam && (
                  <Tag color="warning" className="!rounded-full font-bold">
                    ⚠️ Spam Belgisi
                  </Tag>
                )}
              </div>
            </div>

            {/* User Meta Data */}
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Hamyon Balansi:</span>
                <span className="font-black text-emerald-600 text-sm">
                  {Number(user.balance || 0).toLocaleString("uz-UZ")} UZS
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Username:</span>
                <span className="font-semibold text-slate-700">@{user.username || "yo'q"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Hudud:</span>
                <span className="font-semibold text-slate-700">
                  {get(user, "profile.region.name", "N/A")} / {get(user, "profile.district.name", "N/A")}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-medium">Manzil:</span>
                <span className="font-semibold text-slate-700">{get(user, "profile.address") || "Kiritilmagan"}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => setMsgModalOpen(true)}
                className="!rounded-xl font-bold h-10"
              >
                Xabarnoma Yuborish
              </Button>
              <Button
                danger
                icon={<StopOutlined />}
                onClick={() => {
                  setModIsBlocked(Boolean(user.isBlocked));
                  setModBanReason(user.banReason || "");
                  setModIsSpam(Boolean(user.isSpam));
                  setModSpamReason(user.spamReason || "");
                  setModModalOpen(true);
                }}
                className="!rounded-xl font-bold h-10"
              >
                Intizomiy Boshqaruv (Ban / Spam)
              </Button>
            </div>
          </div>
        </Col>

        {/* Right Content Tabs */}
        <Col xs={24} lg={16}>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <Tabs
              defaultActiveKey="1"
              items={[
                {
                  key: "1",
                  label: (
                    <span className="font-bold flex items-center gap-1.5">
                      <ShoppingOutlined /> E'lonlar ({products.length})
                    </span>
                  ),
                  children: (
                    <Table
                      dataSource={products}
                      columns={productColumns}
                      rowKey="id"
                      pagination={{ pageSize: 5 }}
                    />
                  ),
                },
                {
                  key: "2",
                  label: (
                    <span className="font-bold flex items-center gap-1.5">
                      <CreditCardOutlined /> To'lovlar Tarixi ({transactions.length})
                    </span>
                  ),
                  children: (
                    <Table
                      dataSource={transactions}
                      columns={transactionColumns}
                      rowKey="id"
                      pagination={{ pageSize: 5 }}
                    />
                  ),
                },
              ]}
            />
          </div>
        </Col>
      </Row>

      {/* Message Modal */}
      <Modal
        title={`📩 Xabar: @${user.username || user.phone}`}
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
        cancelText="Bekor"
      >
        <div className="flex flex-col gap-3 mt-4">
          <Input value={directMsgTitle} onChange={(e) => setDirectMsgTitle(e.target.value)} placeholder="Sarlavha" />
          <Input.TextArea rows={4} value={directMsgBody} onChange={(e) => setDirectMsgBody(e.target.value)} placeholder="Xabar matni..." />
        </div>
      </Modal>

      {/* Moderation Modal */}
      <Modal
        title={`🛡️ Intizomiy Holat (@${user.username || user.phone})`}
        open={modModalOpen}
        onCancel={() => setModModalOpen(false)}
        onOk={() => {
          let blockedUntil = null;
          if (modIsBlocked) {
            if (modBlockDuration === "24h") blockedUntil = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
            else if (modBlockDuration === "3d") blockedUntil = new Date(Date.now() + 72 * 3600 * 1000).toISOString();
            else if (modBlockDuration === "7d") blockedUntil = new Date(Date.now() + 168 * 3600 * 1000).toISOString();
            else if (modBlockDuration === "30d") blockedUntil = new Date(Date.now() + 720 * 3600 * 1000).toISOString();
          }

          let spamUntil = null;
          if (modIsSpam) {
            if (modSpamDuration === "24h") spamUntil = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
            else if (modSpamDuration === "7d") spamUntil = new Date(Date.now() + 168 * 3600 * 1000).toISOString();
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
        cancelText="Bekor"
      >
        <div className="flex flex-col gap-4 mt-4">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-rose-700">🚫 Foydalanuvchini Bloklash</span>
              <Switch checked={modIsBlocked} onChange={setModIsBlocked} />
            </div>
            {modIsBlocked && (
              <div className="flex flex-col gap-3 mt-3">
                <Radio.Group value={modBlockDuration} onChange={(e) => setModBlockDuration(e.target.value)}>
                  <Radio.Button value="24h">24s</Radio.Button>
                  <Radio.Button value="3d">3 kun</Radio.Button>
                  <Radio.Button value="7d">7 kun</Radio.Button>
                  <Radio.Button value="30d">30 kun</Radio.Button>
                  <Radio.Button value="permanent">Doimiy</Radio.Button>
                </Radio.Group>
                <Input placeholder="Bloklash sababi..." value={modBanReason} onChange={(e) => setModBanReason(e.target.value)} />
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-amber-700">⚠️ Spam Belgisi</span>
              <Switch checked={modIsSpam} onChange={setModIsSpam} />
            </div>
            {modIsSpam && (
              <div className="flex flex-col gap-3 mt-3">
                <Radio.Group value={modSpamDuration} onChange={(e) => setModSpamDuration(e.target.value)}>
                  <Radio.Button value="24h">24s</Radio.Button>
                  <Radio.Button value="7d">7 kun</Radio.Button>
                  <Radio.Button value="permanent">Doimiy</Radio.Button>
                </Radio.Group>
                <Input placeholder="Spam sababi..." value={modSpamReason} onChange={(e) => setModSpamReason(e.target.value)} />
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserDetail;
