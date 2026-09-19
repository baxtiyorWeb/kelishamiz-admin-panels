import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Switch,
  Button,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Row,
  Col,
  Typography,
  Alert,
  Tooltip,
  Popconfirm,
  Badge,
  Divider,
  message,
} from "antd";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Users,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  RefreshCw,
  Plus,
  Trash2,
  History,
  Store,
  KeyRound,
  Info,
  Calendar,
} from "lucide-react";
import api from "../config/auth/api";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function OtpPolicyManagement() {
  const [loading, setLoading] = useState(false);
  const [policyData, setPolicyData] = useState(null);
  const [testers, setTesters] = useState([]);
  const [testersLoading, setTestersLoading] = useState(false);

  // Modals state
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [targetToggleState, setTargetToggleState] = useState(false);
  const [toggleReason, setToggleReason] = useState("");
  const [toggleSubmitting, setToggleSubmitting] = useState(false);

  const [addTesterModalVisible, setAddTesterModalVisible] = useState(false);
  const [addTesterSubmitting, setAddTesterSubmitting] = useState(false);
  const [testerForm] = Form.useForm();

  // 1. Fetch current OTP policy
  const fetchPolicy = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/security/otp-policy");
      setPolicyData(res.data);
    } catch (err) {
      message.error("OTP siyosatini yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch testers allowlist
  const fetchTesters = async () => {
    setTestersLoading(true);
    try {
      const res = await api.get("/admin/security/otp-testers");
      setTesters(res.data || []);
    } catch (err) {
      message.error("Testerlar ro'yxatini yuklashda xatolik");
    } finally {
      setTestersLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
    fetchTesters();
  }, []);

  // Handle toggle switch click -> Open explicit confirmation modal
  const handleToggleClick = (checked) => {
    setTargetToggleState(checked);
    setToggleReason(
      checked
        ? "Google Play Store yangilanishi va sinovchilari uchun yoqildi"
        : "Sinov jarayoni yakunlandi"
    );
    setConfirmModalVisible(true);
  };

  // Submit policy toggle to backend (No optimistic update - correctness first!)
  const handleConfirmToggle = async () => {
    setToggleSubmitting(true);
    try {
      const res = await api.patch("/admin/security/otp-policy", {
        enabled: targetToggleState,
        reason: toggleReason,
      });
      message.success(res.data?.message || "Siyosat muvaffaqiyatli yangilandi");
      setPolicyData((prev) => ({
        ...prev,
        fakeForTesters: targetToggleState,
        lastUpdatedAt: res.data?.lastUpdatedAt || new Date().toISOString(),
        lastUpdatedBy: res.data?.lastUpdatedBy || "Siz",
      }));
      setConfirmModalVisible(false);
      fetchPolicy();
    } catch (err) {
      const errMessage = err?.response?.data?.message || "Siyosatni o'zgartirishda xatolik";
      message.error(errMessage);
    } finally {
      setToggleSubmitting(false);
    }
  };

  // Add tester
  const handleAddTester = async (values) => {
    setAddTesterSubmitting(true);
    try {
      await api.post("/admin/security/otp-testers", {
        phone: values.phone,
        userId: values.userId ? Number(values.userId) : undefined,
        notes: values.notes,
        expiresAt: values.expiresAt ? values.expiresAt.toISOString() : undefined,
      });
      message.success("Tester muvaffaqiyatli qo'shildi!");
      testerForm.resetFields();
      setAddTesterModalVisible(false);
      fetchTesters();
      fetchPolicy();
    } catch (err) {
      const errMessage = err?.response?.data?.message || "Tester qo'shishda xatolik";
      message.error(errMessage);
    } finally {
      setAddTesterSubmitting(false);
    }
  };

  // Change tester status
  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/admin/security/otp-testers/${id}`, { status });
      message.success("Tester statusi yangilandi");
      fetchTesters();
    } catch (err) {
      message.error("Statusni o'zgartirishda xatolik");
    }
  };

  // Delete tester
  const handleDeleteTester = async (id) => {
    try {
      await api.delete(`/admin/security/otp-testers/${id}`);
      message.success("Tester o'chirildi");
      fetchTesters();
      fetchPolicy();
    } catch (err) {
      message.error("O'chirishda xatolik");
    }
  };

  const isFakeOn = Boolean(policyData?.fakeForTesters);

  // Table columns for testers
  const testerColumns = [
    {
      title: "Telefon Raqam",
      dataIndex: "phoneNormalized",
      key: "phoneNormalized",
      render: (phone) => (
        <span className="font-mono font-bold text-slate-800 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-indigo-500" />
          {phone}
        </span>
      ),
    },
    {
      title: "Bog'langan Hisob",
      key: "user",
      render: (_, record) => {
        if (record.user) {
          return (
            <div>
              <div className="font-semibold text-xs text-slate-900">
                {record.user.username || "Foydalanuvchi"}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                ID: #{record.user.id}
              </div>
            </div>
          );
        }
        return (
          <Tag color="default" className="text-[11px]">
            Hali bog'lanmagan
          </Tag>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => {
        let color = "blue";
        if (status === "ACTIVE") color = "success";
        if (status === "DISABLED") color = "warning";
        if (status === "EXPIRED") color = "error";

        return (
          <Select
            size="small"
            value={status}
            onChange={(newStatus) => handleStatusChange(record.id, newStatus)}
            className="w-28"
          >
            <Option value="ACTIVE">
              <span className="text-emerald-600 font-bold">Faol</span>
            </Option>
            <Option value="DISABLED">
              <span className="text-amber-600 font-bold">O'chiq</span>
            </Option>
            <Option value="EXPIRED">
              <span className="text-rose-600 font-bold">Eskirgan</span>
            </Option>
          </Select>
        );
      },
    },
    {
      title: "Izoh",
      dataIndex: "notes",
      key: "notes",
      render: (notes) => (
        <span className="text-xs text-slate-600">{notes || "—"}</span>
      ),
    },
    {
      title: "Muddati (Expires)",
      dataIndex: "expiresAt",
      key: "expiresAt",
      render: (expiresAt) => {
        if (!expiresAt) {
          return <span className="text-xs text-slate-400">Doimiy</span>;
        }
        const isPast = dayjs(expiresAt).isBefore(dayjs());
        return (
          <span className={`text-xs ${isPast ? "text-rose-500 font-bold" : "text-slate-600"}`}>
            {dayjs(expiresAt).format("DD.MM.YYYY HH:mm")}
          </span>
        );
      },
    },
    {
      title: "Yaratilgan",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => (
        <span className="text-xs text-slate-400">
          {dayjs(date).format("DD.MM.YYYY")}
        </span>
      ),
    },
    {
      title: "Amallar",
      key: "actions",
      render: (_, record) => (
        <Popconfirm
          title="Testerni o'chirish"
          description="Haqiqatan ham bu testerni ro'yxatdan o'chirmoqchimisiz?"
          onConfirm={() => handleDeleteTester(record.id)}
          okText="Ha, o'chirish"
          cancelText="Bekor qilish"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="text"
            danger
            size="small"
            icon={<Trash2 className="w-3.5 h-3.5" />}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            <Title level={3} className="!mb-0">
              Xavfsizlik & OTP Siyosati
            </Title>
          </div>
          <Text type="secondary" className="text-sm">
            Google Play Market testerlari va real foydalanuvchilar uchun markaziy autentifikatsiya boshqaruvi
          </Text>
        </div>

        <Space>
          <Button
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => {
              fetchPolicy();
              fetchTesters();
            }}
            loading={loading || testersLoading}
          >
            Yangilash
          </Button>
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setAddTesterModalVisible(true)}
            className="bg-indigo-600 hover:bg-indigo-500"
          >
            Yangi Tester Qo'shish
          </Button>
        </Space>
      </div>

      {/* Main Single Source of Truth Control Card */}
      <Card
        className={`border-2 shadow-sm transition-all duration-300 ${
          isFakeOn ? "border-amber-400 bg-amber-50/20" : "border-slate-200 bg-white"
        }`}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} lg={16}>
            <div className="flex items-start gap-4">
              <div
                className={`p-3.5 rounded-2xl ${
                  isFakeOn
                    ? "bg-amber-100 text-amber-700 shadow-amber-200"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <KeyRound className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-black text-slate-900">
                    Fake OTP for Play Testers
                  </h3>
                  <Tag
                    color={isFakeOn ? "warning" : "default"}
                    className="font-bold uppercase tracking-wider text-xs px-2.5 py-0.5 rounded-full"
                  >
                    {isFakeOn ? "FAOL (ON)" : "O'CHIRILGAN (OFF)"}
                  </Tag>
                </div>
                <Paragraph className="text-slate-600 text-sm !mb-2 leading-relaxed">
                  Ushbu tugma Google Play Market ko'rikchilari (reviewers) uchun avtomatik fake OTP rejimini
                  boshqaradi. <strong>Faqat backend allowlistidagi test hisoblariga</strong> ta'sir qiladi.
                </Paragraph>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-500 font-medium">
                  <span>
                    Oxirgi o'zgarish:{" "}
                    <strong>{policyData?.lastUpdatedBy || "—"}</strong>
                  </span>
                  <span>
                    Vaqti:{" "}
                    <strong>
                      {policyData?.lastUpdatedAt
                        ? dayjs(policyData.lastUpdatedAt).format("DD.MM.YYYY HH:mm:ss")
                        : "—"}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </Col>

          <Col xs={24} lg={8} className="flex justify-start lg:justify-end items-center">
            <div className="flex items-center gap-4 bg-white/80 p-3 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-500">Holat</div>
                <div className={`font-black text-sm ${isFakeOn ? "text-amber-600" : "text-slate-700"}`}>
                  {isFakeOn ? "Fake OTP Yoqilgan" : "Real SMS Rejimi"}
                </div>
              </div>
              <Switch
                checked={isFakeOn}
                onChange={handleToggleClick}
                loading={loading || toggleSubmitting}
                className={isFakeOn ? "bg-amber-500" : ""}
                size="default"
              />
            </div>
          </Col>
        </Row>

        <Divider className="my-5" />

        {/* Security Matrix Overview Grid */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                Qo'llanish doirasi (Scope)
              </div>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-500" />
                Faqat Authorized Testerlar
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {testers.filter((t) => t.status === "ACTIVE").length} ta faol test hisobi
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
              <div className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider mb-1">
                Real Foydalanuvchilar
              </div>
              <div className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Har doim haqiqiy SMS OTP
              </div>
              <div className="text-[11px] text-emerald-700 mt-1">
                Fake OTP real userlarga hech qachon berilmaydi
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                Ta'sir etuvchi oqimlar
              </div>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Store className="w-4 h-4 text-purple-500" />
                Auth & Store Creation
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Login, Ro'yxatdan o'tish, Do'kon ochish
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-100">
              <div className="text-[11px] font-extrabold text-rose-600 uppercase tracking-wider mb-1">
                Phone Migration
              </div>
              <div className="font-bold text-rose-900 text-sm flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-rose-600" />
                HECH QACHON FAKE EMAS
              </div>
              <div className="text-[11px] text-rose-700 mt-1">
                Raqam yangilash faqat Real SMS bilan
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Authorized Testers Allowlist Table */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span className="font-black text-base text-slate-900">
              Authorized Testers Allowlist
            </span>
            <Badge
              count={testers.length}
              className="ml-2"
              style={{ backgroundColor: "#4f46e5" }}
            />
          </div>
        }
        extra={
          <Button
            size="small"
            type="dashed"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setAddTesterModalVisible(true)}
          >
            Tester qo'shish
          </Button>
        }
        className="border border-slate-200 shadow-xs"
      >
        <Table
          dataSource={testers}
          columns={testerColumns}
          rowKey="id"
          loading={testersLoading}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: "Hozircha testerlar mavjud emas" }}
        />
      </Card>

      {/* Confirmation Modal for Switch ON/OFF */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={`w-6 h-6 ${targetToggleState ? "text-amber-500" : "text-indigo-500"}`}
            />
            <span className="font-black text-base">
              {targetToggleState
                ? "Play Market testerlar uchun Fake OTP yoqilsinmi?"
                : "Fake OTP o'chiriladi"}
            </span>
          </div>
        }
        open={confirmModalVisible}
        onOk={handleConfirmToggle}
        onCancel={() => setConfirmModalVisible(false)}
        confirmLoading={toggleSubmitting}
        okText={targetToggleState ? "Ha, yoqilsin" : "Ha, o'chirilsin"}
        cancelText="Bekor qilish"
        okButtonProps={{
          className: targetToggleState
            ? "bg-amber-500 hover:bg-amber-400"
            : "bg-indigo-600 hover:bg-indigo-500",
        }}
      >
        <div className="space-y-4 py-2">
          {targetToggleState ? (
            <Alert
              type="warning"
              showIcon
              message="Xavfsizlik Ogohlantirishi"
              description="Bu rejim faqat authorized testerlarga ta'sir qiladi. Real foydalanuvchilar haqiqiy SMS OTP olishda davom etadi."
              className="rounded-xl border-amber-200 bg-amber-50"
            />
          ) : (
            <Alert
              type="info"
              showIcon
              message="Standart Rejim"
              description="Fake OTP o'chiriladi va testerlar ham real SMS OTP oladi."
              className="rounded-xl border-indigo-200 bg-indigo-50"
            />
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              O'zgartirish sababi (Audit log uchun):
            </label>
            <Input
              value={toggleReason}
              onChange={(e) => setToggleReason(e.target.value)}
              placeholder="Sababni kiriting..."
            />
          </div>
        </div>
      </Modal>

      {/* Add Tester Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" />
            <span className="font-black text-base">Yangi Authorized Tester Qo'shish</span>
          </div>
        }
        open={addTesterModalVisible}
        onCancel={() => setAddTesterModalVisible(false)}
        footer={null}
      >
        <Form
          form={testerForm}
          layout="vertical"
          onFinish={handleAddTester}
          className="pt-2"
        >
          <Form.Item
            label="Telefon Raqami (Kanonik format)"
            name="phone"
            rules={[
              { required: true, message: "Telefon raqami kiritilishi shart" },
              {
                pattern: /^\+?998\d{9}$/,
                message: "Format: +998901234567 bo'lishi kerak",
              },
            ]}
          >
            <Input placeholder="+99870315565" />
          </Form.Item>

          <Form.Item
            label="Bog'lanuvchi Foydalanuvchi ID (User ID - ixtiyoriy)"
            name="userId"
            help="Agar ushbu tester allaqachon ro'yxatdan o'tgan bo'lsa, uning User ID raqamini kiriting."
          >
            <Input type="number" placeholder="Masalan: 42" />
          </Form.Item>

          <Form.Item label="Izoh (Notes)" name="notes">
            <Input placeholder="Google Play Store automated reviewer" />
          </Form.Item>

          <Form.Item
            label="Amal qilish muddati (Expires At - ixtiyoriy)"
            name="expiresAt"
            help="Bo'sh qoldirilsa doimiy faol bo'ladi."
          >
            <DatePicker showTime className="w-full" format="YYYY-MM-DD HH:mm:ss" />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setAddTesterModalVisible(false)}>
              Bekor qilish
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={addTesterSubmitting}
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              Qo'shish
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
