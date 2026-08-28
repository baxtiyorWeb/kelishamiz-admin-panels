import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Table from "./../components/Table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "./../config/auth/api";
import { get, isArray } from "lodash";
import {
  message,
  Popconfirm,
  Tooltip,
  Select,
  Tag,
  Button,
  Modal,
  Input,
  Radio,
  Switch,
  Space,
  Alert,
} from "antd";
import {
  SendOutlined,
  StopOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

const UserRole = {
  USER: "USER",
  ADMIN: "ADMIN",
};

const Users = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [moderationModalVisible, setModerationModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Direct Message states
  const [msgTitle, setMsgTitle] = useState("Kelishamiz.uz Xabarnomasi");
  const [msgBody, setMsgBody] = useState("");

  // Moderation states
  const [modIsBlocked, setModIsBlocked] = useState(false);
  const [modBlockDuration, setModBlockDuration] = useState("24h");
  const [modBanReason, setModBanReason] = useState("");
  const [modIsSpam, setModIsSpam] = useState(false);
  const [modSpamDuration, setModSpamDuration] = useState("24h");
  const [modSpamReason, setModSpamReason] = useState("");
  const [modSendNotification, setModSendNotification] = useState(true);
  const [modNotificationMessage, setModNotificationMessage] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["users", page, pageSize],
    queryFn: async () => {
      const response = await api.get(
        `/users?pageSize=${pageSize}&page=${page}`
      );
      if (response.status !== 200 || !response.data) {
        throw new Error("Failed to fetch users");
      }
      return response.data;
    },
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const userItems = get(data, "content.users", []);
  const totalUsers = get(data, "content.total", 0);
  const currentPage = get(data, "content.page", 1);

  const { mutate: updateUserRole } = useMutation({
    mutationFn: async ({ id, newRole }) => {
      const response = await api.patch(`/users/${id}/role`, {
        role: newRole,
      });
      if (response.status !== 200 || !response.data) {
        throw new Error("Failed to update user role");
      }
      return response.data;
    },
    onError: () => {
      message.error("Foydalanuvchi rolini yangilashda xatolik yuz berdi.");
    },
    onSuccess: () => {
      message.success("Foydalanuvchi roli muvaffaqiyatli yangilandi");
      refetch();
    },
  });

  const { mutate: deleteUser } = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/users/${id}`);
      if (response.status !== 200 && response.status !== 204) {
        throw new Error("Failed to delete user");
      }
      return response.data;
    },
    onError: () => {
      message.error("Foydalanuvchini o'chirishda xatolik yuz berdi.");
    },
    onSuccess: () => {
      message.success("Foydalanuvchi muvaffaqiyatli o'chirildi");
      refetch();
    },
  });

  const directMessageMutation = useMutation({
    mutationFn: async ({ userId, title, message: msgText }) => {
      const res = await api.post(`/admin/users/${userId}/notify`, {
        title,
        message: msgText,
      });
      return res.data;
    },
    onSuccess: () => {
      message.success("Xabarnoma muvaffaqiyatli yuborildi!");
      setMessageModalVisible(false);
      setMsgBody("");
    },
    onError: () => {
      message.error("Xabarnomani yuborishda xatolik yuz berdi");
    },
  });

  const userModerationMutation = useMutation({
    mutationFn: async ({ userId, payload }) => {
      const res = await api.patch(`/admin/users/${userId}/moderation`, payload);
      return res.data;
    },
    onSuccess: () => {
      message.success("Foydalanuvchi moderatsiya holati yangilandi!");
      setModerationModalVisible(false);
      setSelectedUser(null);
      refetch();
    },
    onError: () => {
      message.error("Foydalanuvchi holatini yangilashda xatolik yuz berdi");
    },
  });

  const openMessageModal = (user) => {
    setSelectedUser(user);
    setMsgTitle("Kelishamiz.uz Xabarnomasi");
    setMsgBody("");
    setMessageModalVisible(true);
  };

  const openModerationModal = (user) => {
    setSelectedUser(user);
    setModIsBlocked(Boolean(user.isBlocked));
    setModBlockDuration("24h");
    setModBanReason(user.banReason || "");
    setModIsSpam(Boolean(user.isSpam));
    setModSpamDuration("24h");
    setModSpamReason(user.spamReason || "");
    setModSendNotification(true);
    setModNotificationMessage("Hisobingiz bo‘yicha moderatsiya cheklovi o‘rnatildi.");
    setModerationModalVisible(true);
  };

  const handleModerationSubmit = () => {
    if (!selectedUser?.id) return;

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

    userModerationMutation.mutate({
      userId: selectedUser.id,
      payload: {
        isBlocked: modIsBlocked,
        blockedUntil,
        banReason: modBanReason || (modIsBlocked ? "Qoidabuzarlik sababli" : null),
        isSpam: modIsSpam,
        spamUntil,
        spamReason: modSpamReason || (modIsSpam ? "Spam tarqatish" : null),
        sendNotification: modSendNotification,
        notificationMessage: modNotificationMessage,
      },
    });
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      render: (text) => (
        <a style={{ fontWeight: "bold", color: "#A64AC9" }} onClick={() => navigate('/users/' + text)}>
          #{text}
        </a>
      ),
    },
    {
      title: "Telefon",
      dataIndex: "phone",
      key: "phone",
      render: (text) => (
        <Tooltip title={text}>
          <div className="truncate max-w-[120px] font-semibold">{text}</div>
        </Tooltip>
      ),
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      render: (text) => (
        <Tooltip title={text}>
          <div className="truncate max-w-[120px]">{text}</div>
        </Tooltip>
      ),
    },
    {
      title: "Full Name",
      dataIndex: ["profile", "fullName"],
      key: "fullName",
      render: (text, record) => (
        <Tooltip title={text || record.username}>
          <div className="truncate max-w-[150px]">
            {text || record.username || "N/A"}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Holat (Status)",
      key: "status",
      render: (_, record) => {
        if (record.isBlocked) {
          return (
            <Tag color="error">
              Bloklangan {record.blockedUntil ? `(${dayjs(record.blockedUntil).format('MM-DD HH:mm')}gacha)` : '(Doimiy)'}
            </Tag>
          );
        }
        if (record.isSpam) {
          return (
            <Tag color="volcano">
              Spam {record.spamUntil ? `(${dayjs(record.spamUntil).format('MM-DD HH:mm')}gacha)` : ''}
            </Tag>
          );
        }
        return <Tag color="success">Faol</Tag>;
      },
    },
    {
      title: "Rol",
      dataIndex: "role",
      key: "role",
      render: (role, record) => (
        <Select
          defaultValue={role}
          style={{ width: 110 }}
          onChange={(newRole) => updateUserRole({ id: record.id, newRole })}
        >
          {Object.values(UserRole).map((r) => (
            <Option key={r} value={r}>
              {r === UserRole.ADMIN ? (
                <Tag color="red">ADMIN</Tag>
              ) : (
                <Tag color="blue">USER</Tag>
              )}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Amallar",
      key: "actions",
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="Foydalanuvchiga to‘g‘ridan-to‘g‘ri xabar yuborish">
            <Button
              size="small"
              icon={<SendOutlined style={{ color: "#722ed1" }} />}
              onClick={() => openMessageModal(record)}
            />
          </Tooltip>

          <Tooltip title="Bloklash yoki Spam holatini boshqarish">
            <Button
              size="small"
              danger
              icon={<StopOutlined />}
              onClick={() => openModerationModal(record)}
            />
          </Tooltip>

          <Popconfirm
            title={`Siz ID: ${record.id} bo'lgan foydalanuvchini o'chirishga ishonchingiz komilmi?`}
            onConfirm={() => deleteUser(record.id)}
            okText="Ha"
            cancelText="Yo'q"
          >
            <Button size="small" type="text" danger>
              O'chirish
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (isError) {
    return <div>Foydalanuvchilarni yuklashda xatolik yuz berdi.</div>;
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
          👥 Foydalanuvchilar Boshqaruvi
        </h2>
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => navigate("/notifications")}
          style={{
            background: "#6345ED",
            borderColor: "#6345ED",
            borderRadius: 8,
            height: 38,
            fontWeight: 500,
          }}
        >
          Barchaga ommaviy xabar
        </Button>
      </div>

      <Table
        dataSource={userItems}
        columnDefs={columns}
        isLoading={isLoading}
        page={currentPage}
        pageSize={pageSize}
        total={totalUsers}
        setPage={setPage}
        setPageSize={setPageSize}
      />

      {/* Direct Message Modal */}
      <Modal
        title={`Xabar yuborish: @${selectedUser?.username || selectedUser?.phone}`}
        open={messageModalVisible}
        onCancel={() => setMessageModalVisible(false)}
        onOk={() => {
          if (!msgBody.trim()) {
            message.warning("Xabar matnini kiriting!");
            return;
          }
          directMessageMutation.mutate({
            userId: selectedUser.id,
            title: msgTitle,
            message: msgBody,
          });
        }}
        confirmLoading={directMessageMutation.isPending}
        okText="Yuborish"
        cancelText="Bekor qilish"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>
              Sarlavha:
            </label>
            <Input
              value={msgTitle}
              onChange={(e) => setMsgTitle(e.target.value)}
              placeholder="Xabar sarlavhasi..."
            />
          </div>
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>
              Xabar Matni:
            </label>
            <TextArea
              rows={4}
              value={msgBody}
              onChange={(e) => setMsgBody(e.target.value)}
              placeholder="Foydalanuvchiga yuboriladigan xabar matni..."
            />
          </div>
        </div>
      </Modal>

      {/* User Moderation Modal */}
      <Modal
        title={`Foydalanuvchi intizomiy holati (@${selectedUser?.username || selectedUser?.phone})`}
        open={moderationModalVisible}
        onCancel={() => setModerationModalVisible(false)}
        onOk={handleModerationSubmit}
        confirmLoading={userModerationMutation.isPending}
        okText="Saqlash"
        cancelText="Bekor qilish"
        width={580}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
          {/* Block Section */}
          <div style={{ background: "#fff1f0", padding: 12, borderRadius: 8, border: "1px solid #ffa39e" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: "bold", color: "#cf1322" }}>
                🚫 Foydalanuvchini Bloklash (Ban)
              </span>
              <Switch checked={modIsBlocked} onChange={setModIsBlocked} />
            </div>

            {modIsBlocked && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#595959", display: "block", marginBottom: 4 }}>
                    Bloklash Muddati:
                  </label>
                  <Radio.Group value={modBlockDuration} onChange={(e) => setModBlockDuration(e.target.value)}>
                    <Radio.Button value="24h">24 soat</Radio.Button>
                    <Radio.Button value="3d">3 kun</Radio.Button>
                    <Radio.Button value="7d">7 kun</Radio.Button>
                    <Radio.Button value="30d">30 kun</Radio.Button>
                    <Radio.Button value="permanent">Doimiy</Radio.Button>
                  </Radio.Group>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#595959", display: "block", marginBottom: 4 }}>
                    Bloklash Sababi:
                  </label>
                  <Input
                    placeholder="Qoidabuzarlik sababi..."
                    value={modBanReason}
                    onChange={(e) => setModBanReason(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Spam Section */}
          <div style={{ background: "#fffbe6", padding: 12, borderRadius: 8, border: "1px solid #ffe58f" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: "bold", color: "#ad6800" }}>
                ⚠️ Spam Belgisi (Cheklov)
              </span>
              <Switch checked={modIsSpam} onChange={setModIsSpam} />
            </div>

            {modIsSpam && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#595959", display: "block", marginBottom: 4 }}>
                    Spam Muddati:
                  </label>
                  <Radio.Group value={modSpamDuration} onChange={(e) => setModSpamDuration(e.target.value)}>
                    <Radio.Button value="24h">24 soat</Radio.Button>
                    <Radio.Button value="7d">7 kun</Radio.Button>
                    <Radio.Button value="permanent">Doimiy</Radio.Button>
                  </Radio.Group>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#595959", display: "block", marginBottom: 4 }}>
                    Spam Sababi:
                  </label>
                  <Input
                    placeholder="Spam sababi..."
                    value={modSpamReason}
                    onChange={(e) => setModSpamReason(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Send Notification */}
          <div style={{ background: "#f6ffed", padding: 12, borderRadius: 8, border: "1px solid #b7eb8f" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: "bold", color: "#237804" }}>
                🔔 Bildirishnoma Jo‘natish
              </span>
              <Switch checked={modSendNotification} onChange={setModSendNotification} />
            </div>
            {modSendNotification && (
              <TextArea
                rows={2}
                value={modNotificationMessage}
                onChange={(e) => setModNotificationMessage(e.target.value)}
                placeholder="Foydalanuvchiga yuboriladigan tushuntirish..."
              />
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Users;
