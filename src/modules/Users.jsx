import React, { useState, useMemo } from "react";
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
  Avatar,
  Row,
  Col,
  Tabs,
} from "antd";
import dayjs from "dayjs";
import {
  Users as UsersIcon,
  User,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Send,
  Ban,
  Trash2,
  Eye,
  Search,
  Phone,
  Calendar,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  Lock,
} from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [roleTab, setRoleTab] = useState("all");

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
      const response = await api.get(`/users?pageSize=${pageSize}&page=${page}`);
      if (response.status !== 200 || !response.data) {
        throw new Error("Failed to fetch users");
      }
      return response.data;
    },
    retry: 2,
  });

  const userItems = useMemo(() => get(data, "content.users", []), [data]);
  const totalUsers = get(data, "content.total", 0);
  const currentPage = get(data, "content.page", 1);

  // Stats calculation
  const stats = useMemo(() => {
    const total = totalUsers || userItems.length;
    const admins = userItems.filter((u) => u.role === "ADMIN").length;
    const blocked = userItems.filter((u) => u.isBlocked).length;
    const spam = userItems.filter((u) => u.isSpam).length;

    return {
      total,
      admins,
      blocked,
      spam,
      active: total - blocked,
    };
  }, [userItems, totalUsers]);

  const { mutate: updateUserRole } = useMutation({
    mutationFn: async ({ id, newRole }) => {
      const response = await api.patch(`/users/${id}/role`, { role: newRole });
      return response.data;
    },
    onSuccess: () => {
      message.success("Foydalanuvchi roli muvaffaqiyatli yangilandi");
      refetch();
    },
    onError: () => {
      message.error("Foydalanuvchi rolini yangilashda xatolik yuz berdi.");
    },
  });

  const { mutate: deleteUser } = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    },
    onSuccess: () => {
      message.success("Foydalanuvchi muvaffaqiyatli o'chirildi");
      refetch();
    },
    onError: () => {
      message.error("Foydalanuvchini o'chirishda xatolik yuz berdi.");
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
    setModIsBlocked(user.isBlocked || false);
    setModBlockDuration("24h");
    setModBanReason(user.banReason || "");
    setModIsSpam(user.isSpam || false);
    setModSpamDuration("24h");
    setModSpamReason(user.spamReason || "");
    setModSendNotification(true);
    setModNotificationMessage("Hisobingiz bo'yicha moderatsiya cheklovi o'rnatildi.");
    setModerationModalVisible(true);
  };

  const handleModerationSubmit = () => {
    if (!selectedUser) return;

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

  const filteredUsers = useMemo(() => {
    return userItems.filter((u) => {
      if (roleTab === "admin" && u.role !== "ADMIN") return false;
      if (roleTab === "user" && u.role !== "USER") return false;
      if (roleTab === "blocked" && !u.isBlocked) return false;
      if (roleTab === "spam" && !u.isSpam) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          u.username?.toLowerCase().includes(term) ||
          u.phone?.toLowerCase().includes(term) ||
          u.id?.toString().includes(term)
        );
      }
      return true;
    });
  }, [userItems, roleTab, searchTerm]);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 65,
      render: (id) => <span className="font-mono text-xs font-bold text-slate-400">#{id}</span>,
    },
    {
      title: "Foydalanuvchi",
      key: "user",
      width: 240,
      render: (_, record) => {
        const username = record.username || "Ismsiz";
        return (
          <div className="flex items-center gap-3 py-1">
            <Avatar
              size={40}
              className={`${
                record.role === "ADMIN"
                  ? "bg-gradient-to-tr from-purple-600 to-indigo-600 ring-2 ring-purple-200"
                  : "bg-indigo-100 text-indigo-700"
              } font-black text-sm flex-shrink-0 shadow-xs`}
            >
              {username[0]?.toUpperCase()}
            </Avatar>
            <div className="flex flex-col min-w-0">
              <div
                className="font-extrabold text-slate-900 text-sm hover:text-indigo-600 cursor-pointer truncate transition-colors flex items-center gap-1.5"
                onClick={() => navigate(`/users/${record.id}`)}
              >
                <span>{username}</span>
                {record.role === "ADMIN" && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 font-extrabold text-[9px]">
                    <Shield className="w-2.5 h-2.5" /> ADMIN
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{record.phone || "Telefon yo'q"}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Balans (Hisob)",
      dataIndex: "balance",
      key: "balance",
      width: 160,
      render: (balance) => (
        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-black text-xs">
          <Wallet className="w-3.5 h-3.5 text-emerald-600" />
          <span>{Number(balance || 0).toLocaleString("uz-UZ")} UZS</span>
        </div>
      ),
    },
    {
      title: "Tizimdagi Roli",
      dataIndex: "role",
      key: "role",
      width: 140,
      render: (role, record) => (
        <Select
          defaultValue={role || "USER"}
          onChange={(newRole) => updateUserRole({ id: record.id, newRole })}
          className="w-28 !rounded-xl"
        >
          <Option value={UserRole.USER}>
            <span className="font-bold text-xs text-slate-700">USER</span>
          </Option>
          <Option value={UserRole.ADMIN}>
            <span className="font-bold text-xs text-purple-700">ADMIN</span>
          </Option>
        </Select>
      ),
    },
    {
      title: "Holat & Xavfsizlik",
      key: "status",
      width: 170,
      render: (_, record) => {
        if (record.isBlocked) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <Ban className="w-3.5 h-3.5 text-rose-600" />
              <span>Bloklangan</span>
            </span>
          );
        }
        if (record.isSpam) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Spam Belgisi</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Faol (Active)</span>
          </span>
        );
      },
    },
    {
      title: "Ro'yxatdan O'tgan",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date) => (
        <div className="text-xs text-slate-500 font-mono flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{date ? dayjs(date).format("YYYY-MM-DD") : "—"}</span>
        </div>
      ),
    },
    {
      title: "Amallar",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <div className="flex items-center gap-1.5">
          <Tooltip title="Foydalanuvchiga to'g'ridan-to'g'ri xabar (Push) yuborish">
            <button
              type="button"
              onClick={() => openMessageModal(record)}
              className="w-8 h-8 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip title="Intizomiy chora (Bloklash / Spam)">
            <button
              type="button"
              onClick={() => openModerationModal(record)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                record.isBlocked || record.isSpam
                  ? "bg-rose-600 text-white"
                  : "bg-amber-50 hover:bg-amber-600 text-amber-600 hover:text-white"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip title="360° CRM Profilini ochish">
            <button
              type="button"
              onClick={() => navigate(`/users/${record.id}`)}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Popconfirm
            title="Foydalanuvchini o'chirishga ishonchingiz komilmi?"
            onConfirm={() => deleteUser(record.id)}
            okText="Ha, o'chirish"
            cancelText="Bekor"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="O'chirish">
              <button
                type="button"
                className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 m-0 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UsersIcon className="w-4 h-4" />
            </div>
            Foydalanuvchilar & CRM Boshqaruv Markazi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Barcha ro'yxatdan o'tgan mijozlar, hisob balansi, rollar va xavfsizlik moderatsiyasi.
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Ism, telefon yoki ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all w-72"
          />
        </div>
      </div>

      {/* KPI Cards Bar */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jami Mijozlar</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{stats.total} ta</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Ro'yxatdan o'tganlar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UsersIcon className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-purple-500 uppercase tracking-wider flex items-center gap-1">
                Admin & Xodimlar
              </div>
              <div className="text-2xl font-black text-purple-600 mt-1">{stats.admins} ta</div>
              <div className="text-[11px] text-purple-600/70 mt-0.5">Boshqaruv vakolati borlar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                Faol Foydalanuvchilar
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{stats.active} ta</div>
              <div className="text-[11px] text-emerald-600/70 mt-0.5">Cheklovsiz faoliyatda</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                Bloklangan / Spam
              </div>
              <div className="text-2xl font-black text-rose-600 mt-1">{stats.blocked + stats.spam} ta</div>
              <div className="text-[11px] text-rose-600/70 mt-0.5">Moderatsiya jazosi ostida</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Ban className="w-6 h-6" />
            </div>
          </div>
        </Col>
      </Row>

      {/* Main Table with Tabs */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 overflow-hidden flex flex-col gap-4">
        {/* Role Tabs */}
        <div className="border-b border-slate-100 pb-2">
          <Tabs
            activeKey={roleTab}
            onChange={(k) => setRoleTab(k)}
            className="!m-0"
            items={[
              { key: "all", label: <span className="font-bold">Barcha Foydalanuvchilar ({totalUsers})</span> },
              { key: "user", label: <span className="font-bold text-blue-600">👤 Oddiy Foydalanuvchilar</span> },
              { key: "admin", label: <span className="font-bold text-purple-600">🛡️ Adminlar ({stats.admins})</span> },
              { key: "blocked", label: <span className="font-bold text-rose-600">🚫 Bloklanganlar ({stats.blocked})</span> },
              { key: "spam", label: <span className="font-bold text-amber-600">⚠️ Spam Belgisi ({stats.spam})</span> },
            ]}
          />
        </div>

        <Table
          dataSource={filteredUsers}
          columnDefs={columns}
          isLoading={isLoading}
          page={currentPage}
          pageSize={pageSize}
          total={totalUsers}
          setPage={setPage}
          setPageSize={setPageSize}
        />
      </div>

      {/* Direct Message Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-indigo-600" />
            <span className="font-black text-slate-900">
              Foydalanuvchiga Push Xabar Yuborish ({selectedUser?.username})
            </span>
          </div>
        }
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
        okText="Xabarni Yuborish"
        cancelText="Bekor"
        okButtonProps={{ className: "!bg-indigo-600 !border-indigo-600 font-bold" }}
        className="!rounded-3xl"
      >
        <div className="flex flex-col gap-4 mt-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Xabar Sarlavhasi:</label>
            <Input
              value={msgTitle}
              onChange={(e) => setMsgTitle(e.target.value)}
              className="!rounded-xl h-11 font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Xabar Matni:</label>
            <TextArea
              rows={4}
              value={msgBody}
              onChange={(e) => setMsgBody(e.target.value)}
              placeholder="Foydalanuvchining smartfoniga yuboriladigan to'liq matn..."
              className="!rounded-xl"
            />
          </div>
        </div>
      </Modal>

      {/* User Moderation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span className="font-black text-slate-900">
              Intizomiy Moderatsiya Boshqaruvi ({selectedUser?.username})
            </span>
          </div>
        }
        open={moderationModalVisible}
        onCancel={() => setModerationModalVisible(false)}
        onOk={handleModerationSubmit}
        confirmLoading={userModerationMutation.isPending}
        okText="O'zgarishlarni Saqlash"
        cancelText="Bekor"
        okButtonProps={{ className: "!bg-rose-600 !border-rose-600 font-bold" }}
        className="!rounded-3xl"
        width={580}
      >
        <div className="flex flex-col gap-4 mt-4">
          {/* Block Section */}
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-xs text-rose-800 flex items-center gap-1.5">
                <Ban className="w-4 h-4 text-rose-600" />
                Foydalanuvchini Bloklash (Ban)
              </span>
              <Switch checked={modIsBlocked} onChange={setModIsBlocked} />
            </div>

            {modIsBlocked && (
              <div className="flex flex-col gap-3 mt-3 pt-2 border-t border-rose-200">
                <div>
                  <label className="text-[11px] font-bold text-rose-900 block mb-1">Bloklash Muddati:</label>
                  <Radio.Group value={modBlockDuration} onChange={(e) => setModBlockDuration(e.target.value)}>
                    <Radio.Button value="24h">24 soat</Radio.Button>
                    <Radio.Button value="3d">3 kun</Radio.Button>
                    <Radio.Button value="7d">7 kun</Radio.Button>
                    <Radio.Button value="30d">30 kun</Radio.Button>
                  </Radio.Group>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-rose-900 block mb-1">Bloklash Sababi:</label>
                  <Input
                    placeholder="Qoidabuzarlik sababini yozing..."
                    value={modBanReason}
                    onChange={(e) => setModBanReason(e.target.value)}
                    className="!rounded-xl bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Spam Section */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-xs text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Spam Belgisi (Cheklov)
              </span>
              <Switch checked={modIsSpam} onChange={setModIsSpam} />
            </div>

            {modIsSpam && (
              <div className="flex flex-col gap-3 mt-3 pt-2 border-t border-amber-200">
                <div>
                  <label className="text-[11px] font-bold text-amber-900 block mb-1">Spam Muddati:</label>
                  <Radio.Group value={modSpamDuration} onChange={(e) => setModSpamDuration(e.target.value)}>
                    <Radio.Button value="24h">24 soat</Radio.Button>
                    <Radio.Button value="7d">7 kun</Radio.Button>
                  </Radio.Group>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-amber-900 block mb-1">Spam Sababi:</label>
                  <Input
                    placeholder="Spam tarqatish sababi..."
                    value={modSpamReason}
                    onChange={(e) => setModSpamReason(e.target.value)}
                    className="!rounded-xl bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Send notification */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700">Foydalanuvchiga Push Bildirishnoma Yuborilsinmi?</span>
            <Switch checked={modSendNotification} onChange={setModSendNotification} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Users;
