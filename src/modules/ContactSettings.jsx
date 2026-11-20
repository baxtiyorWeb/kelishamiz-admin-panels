import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  Form,
  Input,
  Switch,
  Button,
  Modal,
  Tag,
  Space,
  Popconfirm,
  Row,
  Col,
  Alert,
  Spin,
  Tabs,
  message,
  Tooltip,
} from "antd";
import {
  MessageSquare,
  Phone,
  Mail,
  Send,
  Clock,
  MapPin,
  Plus,
  Edit3,
  Trash2,
  Save,
  ShieldCheck,
  Smartphone,
  Globe,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import api from "../config/auth/api";
import useAuthStore from "../store";
import { CompactStatCard } from "../components/CompactStatCard";
import AppTable from "../components/Table";
import dayjs from "dayjs";

const DEFAULT_CONTACT_INFO = {
  phone: "+998 90 123 45 67",
  email: "info@kelishamiz.uz",
  telegram_url: "https://t.me/kelishamiz_support",
  telegram_username: "@kelishamiz_support",
  working_hours: "Har kuni 09:00 - 22:00",
  address: "O'zbekiston, Surxondaryo viloyati",
};

const DEFAULT_TOPICS = [
  { id: "SUGGESTION", label: "Taklif va fikr-mulohaza", labelRu: "Предложение и отзыв" },
  { id: "TECHNICAL", label: "Texnik muammo / Xatolik", labelRu: "Техническая проблема" },
  { id: "PARTNERSHIP", label: "Hamkorlik va reklama", labelRu: "Сотрудничество и реклама" },
  { id: "COMPLAINT", label: "Shikoyat / Murojaat", labelRu: "Жалоба / Обращение" },
  { id: "OTHER", label: "Boshqa masala", labelRu: "Другой вопрос" },
];

export default function ContactSettings() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = !user?.role || user?.role === "SUPER_ADMIN";

  const [contactForm] = Form.useForm();
  const [topicForm] = Form.useForm();
  const [feedbackEnabled, setFeedbackEnabled] = useState(true);
  const [topics, setTopics] = useState(DEFAULT_TOPICS);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [liveContactPreview, setLiveContactPreview] = useState(DEFAULT_CONTACT_INFO);

  // 1. Fetch settings
  const {
    data: rawSettings = {},
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await api.get("/settings");
      return res.data?.content || res.data || {};
    },
  });

  const settings = rawSettings?.content || rawSettings || {};

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      const info = {
        ...DEFAULT_CONTACT_INFO,
        ...(settings.contact_info || {}),
      };
      contactForm.setFieldsValue(info);
      setLiveContactPreview(info);
      setFeedbackEnabled(
        settings.feedback_enabled !== undefined ? Boolean(settings.feedback_enabled) : true
      );
      if (Array.isArray(settings.contact_topics) && settings.contact_topics.length > 0) {
        setTopics(settings.contact_topics);
      }
    }
  }, [settings, contactForm]);

  // 2. Fetch incoming FEEDBACK messages from /admin/reports
  const { data: reportsData, isLoading: isReportsLoading } = useQuery({
    queryKey: ["adminReports", "feedback-preview"],
    queryFn: async () => {
      const res = await api.get("/admin/reports", { params: { page: 1, limit: 50 } });
      return res.data?.content || res.data;
    },
  });

  const feedbackMessages = useMemo(() => {
    const list = Array.isArray(reportsData?.data)
      ? reportsData.data
      : Array.isArray(reportsData)
      ? reportsData
      : [];
    return list.filter((r) => (r.targetType || "").toUpperCase() === "FEEDBACK");
  }, [reportsData]);

  // 3. Save Contact Settings mutation (Super Admin endpoint)
  const saveContactMutation = useMutation({
    mutationFn: async (payload) => {
      try {
        const res = await api.put("/settings/contact", payload);
        return res.data;
      } catch (err) {
        // Fallback to general /settings endpoint if needed
        const res = await api.put("/settings", {
          settings: {
            feedback_enabled: payload.feedback_enabled,
            contact_info: payload.contact_info,
            contact_topics: payload.contact_topics,
          },
          reason: payload.reason || "Super Admin 'Biz bilan aloqa' sozlamalarini yangiladi",
        });
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      message.success("'Biz bilan aloqa' sozlamalari muvaffaqiyatli saqlandi!");
    },
    onError: (err) => {
      message.error(
        err?.response?.data?.message ||
          "Sozlamalarni saqlashda xatolik (Faqat Super Admin huquqi talab etiladi)"
      );
    },
  });

  const handleSaveAll = async () => {
    try {
      const values = await contactForm.validateFields();
      const cleanInfo = {
        phone: (values.phone || "").trim(),
        email: (values.email || "").trim(),
        telegram_url: (values.telegram_url || "").trim(),
        telegram_username: (values.telegram_username || "").trim(),
        working_hours: (values.working_hours || "").trim(),
        address: (values.address || "").trim(),
      };
      setLiveContactPreview(cleanInfo);
      saveContactMutation.mutate({
        feedback_enabled: feedbackEnabled,
        contact_info: cleanInfo,
        contact_topics: topics,
        reason: "Super Admin 'Biz bilan aloqa' ma'lumotlari va mavzularini yangiladi",
      });
    } catch {
      message.warning("Iltimos, barcha maydonlarni to'g'ri to'ldiring");
    }
  };

  const handleOpenAddTopic = () => {
    setEditingTopic(null);
    topicForm.resetFields();
    setIsTopicModalOpen(true);
  };

  const handleOpenEditTopic = (record) => {
    setEditingTopic(record);
    topicForm.setFieldsValue({
      id: record.id,
      label: record.label,
      labelRu: record.labelRu || "",
    });
    setIsTopicModalOpen(true);
  };

  const handleDeleteTopic = (record) => {
    const nextTopics = topics.filter((t) => t.id !== record.id);
    setTopics(nextTopics);
    saveContactMutation.mutate({
      feedback_enabled: feedbackEnabled,
      contact_info: liveContactPreview,
      contact_topics: nextTopics,
      reason: `Murojaat mavzusi '${record.label}' o'chirildi`,
    });
  };

  const handleSaveTopicModal = async () => {
    try {
      const vals = await topicForm.validateFields();
      const rawId = editingTopic
        ? editingTopic.id
        : (vals.id || vals.label)
            .toUpperCase()
            .replace(/[^A-Z0-9_]/g, "_")
            .slice(0, 24);

      const newItem = {
        id: rawId || `TOPIC_${Date.now()}`,
        label: vals.label.trim(),
        labelRu: (vals.labelRu || vals.label).trim(),
      };

      const nextTopics = editingTopic
        ? topics.map((t) => (t.id === editingTopic.id ? newItem : t))
        : [...topics, newItem];

      setTopics(nextTopics);
      setIsTopicModalOpen(false);
      topicForm.resetFields();

      saveContactMutation.mutate({
        feedback_enabled: feedbackEnabled,
        contact_info: liveContactPreview,
        contact_topics: nextTopics,
        reason: editingTopic
          ? `Murojaat mavzusi '${newItem.label}' tahrirlandi`
          : `Yangi murojaat mavzusi '${newItem.label}' qo'shildi`,
      });
    } catch {
      // validation error
    }
  };

  const topicColumns = [
    {
      title: "Kod (ID)",
      dataIndex: "id",
      key: "id",
      width: 140,
      render: (id) => (
        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
          {id}
        </span>
      ),
    },
    {
      title: "Mavzu nomi (O'zbekcha)",
      dataIndex: "label",
      key: "label",
      render: (label) => <span className="font-bold text-slate-900 text-xs">{label}</span>,
    },
    {
      title: "Mavzu nomi (Ruscha)",
      dataIndex: "labelRu",
      key: "labelRu",
      render: (labelRu) => <span className="text-slate-500 text-xs">{labelRu || "—"}</span>,
    },
    {
      title: "Amallar",
      key: "actions",
      width: 110,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Tahrirlash">
            <button
              type="button"
              disabled={!isSuperAdmin}
              onClick={() => handleOpenEditTopic(record)}
              className="btn-action-neutral"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
          <Popconfirm
            title="Mavzuni o'chirish"
            description={`"${record.label}" mavzusini o'chirasizmi?`}
            onConfirm={() => handleDeleteTopic(record)}
            okText="O'chirish"
            cancelText="Bekor"
            disabled={!isSuperAdmin || topics.length <= 1}
          >
            <button
              type="button"
              disabled={!isSuperAdmin || topics.length <= 1}
              className="btn-action-danger"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-14">
      {/* Header */}
      <div className="enterprise-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 m-0">
              &ldquo;Biz bilan aloqa&rdquo; Dinamik Boshqaruv Markazi
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 uppercase">
              SUPER ADMIN ONLY
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mobil ilova va Web-saytdagi &ldquo;Biz bilan aloqa&rdquo; sahifasi ma&apos;lumotlari, aloqa kanallari va murojaat mavzularini kod o&apos;zgartirmasdan dinamik boshqarish
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => refetch()}
            className="!rounded-xl text-xs font-semibold"
          >
            Yangilash
          </Button>
          <Button
            type="primary"
            icon={<Save className="w-3.5 h-3.5" />}
            loading={saveContactMutation.isPending}
            disabled={!isSuperAdmin}
            onClick={handleSaveAll}
            className="!bg-indigo-600 hover:!bg-indigo-700 !rounded-xl text-xs font-bold shadow-sm"
          >
            O&apos;zgarishlarni Saqlash
          </Button>
        </div>
      </div>

      {!isSuperAdmin && (
        <Alert
          type="warning"
          showIcon
          message="Faqat Super Admin o'zgartira oladi"
          description="Ushbu sahifadagi aloqa ma'lumotlarini faqat SUPER_ADMIN roliga ega foydalanuvchi tahrirlashi va saqlashi mumkin."
          className="!rounded-2xl"
        />
      )}

      {/* KPI Cards */}
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            title="Qayta Aloqa Holati"
            value={feedbackEnabled ? "FAOL (YOQILGAN)" : "TO'XTATILGAN"}
            unit="status"
            subtext="Web va Mobile murojaat formasi"
            icon={feedbackEnabled ? CheckCircle2 : XCircle}
            color={feedbackEnabled ? "emerald" : "rose"}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            title="Call-Markaz Raqami"
            value={liveContactPreview.phone || "Kiritilmagan"}
            unit="tel"
            subtext={liveContactPreview.working_hours || "24/7"}
            icon={Phone}
            color="blue"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            title="Murojaat Mavzulari"
            value={topics.length}
            unit="mavzu"
            subtext="Dinamik tanlov variantlari"
            icon={Sparkles}
            color="indigo"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            title="Kelib Tushgan Murojaatlar"
            value={feedbackMessages.length}
            unit="xabar"
            subtext="Foydalanuvchi taklif va savollari"
            icon={MessageSquare}
            color="amber"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Left Column: Dynamic Contact Info Form & Topics */}
        <Col xs={24} lg={15}>
          <div className="flex flex-col gap-5">
            {/* 1. Contact Channels Form */}
            <div className="enterprise-card p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 m-0 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-indigo-600" />
                    Aloqa Kanallari & Revizitlar
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bu yerda kiritilgan ma&apos;lumotlar darhol Web va Mobile ilovada yangilanadi
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Murojaat formasi:</span>
                  <Switch
                    checked={feedbackEnabled}
                    disabled={!isSuperAdmin}
                    onChange={(val) => setFeedbackEnabled(val)}
                  />
                </div>
              </div>

              <Form
                form={contactForm}
                layout="vertical"
                disabled={!isSuperAdmin}
                onValuesChange={(_, allValues) =>
                  setLiveContactPreview((prev) => ({ ...prev, ...allValues }))
                }
              >
                <Row gutter={[14, 4]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="phone"
                      label={<span className="text-xs font-bold text-slate-700">Telefon raqam (Call-markaz)</span>}
                      rules={[{ required: true, message: "Telefon raqamni kiriting" }]}
                    >
                      <Input
                        prefix={<Phone className="w-3.5 h-3.5 text-slate-400 mr-1" />}
                        placeholder="+998 90 123 45 67"
                        className="!rounded-xl h-10 text-xs"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="email"
                      label={<span className="text-xs font-bold text-slate-700">Rasmiy Email manzili</span>}
                      rules={[{ required: true, message: "Email manzilni kiriting" }]}
                    >
                      <Input
                        prefix={<Mail className="w-3.5 h-3.5 text-slate-400 mr-1" />}
                        placeholder="info@kelishamiz.uz"
                        className="!rounded-xl h-10 text-xs"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="telegram_username"
                      label={<span className="text-xs font-bold text-slate-700">Telegram Username</span>}
                      rules={[{ required: true, message: "Telegram usernameni kiriting" }]}
                    >
                      <Input
                        prefix={<Send className="w-3.5 h-3.5 text-sky-500 mr-1" />}
                        placeholder="@kelishamiz_support"
                        className="!rounded-xl h-10 text-xs"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="telegram_url"
                      label={<span className="text-xs font-bold text-slate-700">Telegram To&apos;g&apos;ridan-to&apos;g&apos;ri Havola (URL)</span>}
                      rules={[{ required: true, message: "Telegram URL kiriting" }]}
                    >
                      <Input
                        prefix={<ExternalLink className="w-3.5 h-3.5 text-slate-400 mr-1" />}
                        placeholder="https://t.me/kelishamiz_support"
                        className="!rounded-xl h-10 text-xs"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="working_hours"
                      label={<span className="text-xs font-bold text-slate-700">Ish vaqti</span>}
                    >
                      <Input
                        prefix={<Clock className="w-3.5 h-3.5 text-amber-500 mr-1" />}
                        placeholder="Har kuni 09:00 - 22:00"
                        className="!rounded-xl h-10 text-xs"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="address"
                      label={<span className="text-xs font-bold text-slate-700">Ofis / Xizmat ko&apos;rsatish manzili</span>}
                    >
                      <Input
                        prefix={<MapPin className="w-3.5 h-3.5 text-emerald-500 mr-1" />}
                        placeholder="O'zbekiston, Surxondaryo viloyati"
                        className="!rounded-xl h-10 text-xs"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <div className="flex justify-end pt-2">
                  <Button
                    type="primary"
                    icon={<Save className="w-3.5 h-3.5" />}
                    loading={saveContactMutation.isPending}
                    onClick={handleSaveAll}
                    className="!bg-indigo-600 hover:!bg-indigo-700 !rounded-xl text-xs font-bold"
                  >
                    Aloqa ma&apos;lumotlarini saqlash
                  </Button>
                </div>
              </Form>
            </div>

            {/* 2. Dynamic Topics List */}
            <div className="enterprise-card p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 m-0 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Murojaat Mavzulari (`contact_topics`)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Foydalanuvchi murojaat yuborayotganda tanlaydigan mavzular ro&apos;yxati
                  </p>
                </div>

                <Button
                  type="primary"
                  size="small"
                  disabled={!isSuperAdmin}
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={handleOpenAddTopic}
                  className="!bg-purple-600 hover:!bg-purple-700 !rounded-xl text-xs font-bold"
                >
                  Mavzu qo&apos;shish
                </Button>
              </div>

              <AppTable
                dataSource={topics}
                columnDefs={topicColumns}
                isLoading={false}
                pagination={false}
              />
            </div>
          </div>
        </Col>

        {/* Right Column: Live Mobile & Web Preview */}
        <Col xs={24} lg={9}>
          <div className="enterprise-card p-5 sticky top-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-extrabold text-slate-900">
                  Jonli Ko&apos;rinish (Mobile & Web Preview)
                </span>
              </div>
              <Tag color="purple" className="!m-0 font-bold text-[10px] rounded-md">
                REAL-TIME
              </Tag>
            </div>

            {/* Mock Mobile Card */}
            <div className="rounded-3xl border-2 border-slate-200 bg-slate-50 p-4 space-y-3 shadow-inner">
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 flex items-center gap-3 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900">
                    Biz bilan aloqa
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Savol, taklif yoki shikoyatingiz bo&apos;lsa yozib qoldiring
                  </div>
                </div>
              </div>

              {/* Channels */}
              <div className="grid grid-cols-1 gap-2">
                <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400">Call-markaz</div>
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {liveContactPreview.phone || "+998 ..."}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <Send className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400">Telegram orqali yozish</div>
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {liveContactPreview.telegram_username || "@kelishamiz_support"}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400">Elektron pochta</div>
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {liveContactPreview.email || "info@kelishamiz.uz"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Topics Pills Preview */}
              <div className="bg-white rounded-2xl p-3 border border-slate-200/80 space-y-2">
                <div className="text-[11px] font-bold text-slate-700">
                  Murojaat mavzulari ({topics.length} ta):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {topics.map((t, i) => (
                    <span
                      key={t.id}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                        i === 0
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      {t.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                <span>🕒 {liveContactPreview.working_hours}</span>
                <span className="truncate max-w-[150px]">📍 {liveContactPreview.address}</span>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Topic Add/Edit Modal */}
      <Modal
        title={
          <span className="font-extrabold text-slate-900">
            {editingTopic ? "Mavzuni tahrirlash" : "Yangi murojaat mavzusi qo'shish"}
          </span>
        }
        open={isTopicModalOpen}
        onCancel={() => setIsTopicModalOpen(false)}
        onOk={handleSaveTopicModal}
        okText="Saqlash"
        cancelText="Bekor qilish"
        className="!rounded-2xl"
      >
        <Form form={topicForm} layout="vertical" className="mt-3">
          <Form.Item
            name="label"
            label="Mavzu nomi (O'zbek tilida)"
            rules={[{ required: true, message: "Mavzu nomini kiriting" }]}
          >
            <Input placeholder="Masalan: Hamkorlik va reklama" className="!rounded-xl h-10" />
          </Form.Item>
          <Form.Item name="labelRu" label="Mavzu nomi (Rus tilida)">
            <Input placeholder="Masalan: Сотрудничество и реклама" className="!rounded-xl h-10" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
