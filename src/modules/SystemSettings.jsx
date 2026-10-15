import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../config/auth/api";
import {
  Card,
  Tabs,
  Switch,
  InputNumber,
  Input,
  Select,
  Button,
  Tag,
  Badge,
  Modal,
  Tooltip,
  Divider,
  Row,
  Col,
  Table,
  Space,
  Typography,
  Alert,
  Spin,
} from "antd";
import {
  Sliders,
  Shield,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Search,
  RefreshCw,
  RotateCcw,
  History,
  FileText,
  Sparkles,
  Layers,
  Lock,
  UserX,
  Activity,
  HardDrive,
  Cloud,
  MessageSquare,
  Store,
  Tag as TagIcon,
  UploadCloud,
  Image as ImageIcon,
  Video,
  File,
  Globe,
  Smartphone,
  Server,
  Info,
  Save,
  Bell,
  Users,
  MapPin,
  SlidersHorizontal,
  XCircle,
  HelpCircle,
  AlertOctagon,
  Trash2,
  Share2,
  Heart,
  FileCheck,
  Cpu,
  Send,
  Star,
} from "lucide-react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import CompactStatCard from "../components/CompactStatCard";

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

// Xavfli (Dangerous) hisoblangan sozlamalar ro'yxati
const DANGEROUS_KEYS = [
  "maintenance_mode",
  "registration_enabled",
  "ad_posting_enabled",
  "chat_enabled",
  "media_upload_enabled",
  "storage_upload_enabled",
  "account_deletion_enabled",
  "platform_enabled",
  "permanent_deletion_enabled",
];

export default function SystemSettings() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("general");

  // Local draft changes for batched settings (like textareas/limits before save)
  const [draftSettings, setDraftSettings] = useState({});

  // Dangerous confirmation modal state
  const [dangerousModal, setDangerousModal] = useState({
    isOpen: false,
    key: null,
    newValue: null,
    label: "",
    reason: "",
  });

  // Reset confirmation modal state
  const [resetModal, setResetModal] = useState({
    isOpen: false,
    key: null,
    label: "",
  });

  // 1. Fetch all settings from backend
  const {
    data: rawSettings = {},
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await api.get("/settings");
      return res.data?.content || res.data || {};
    },
  });

  const settings = rawSettings?.content || rawSettings || {};

  // 2. Fetch config audit logs
  const { data: rawAuditLogs = [], isLoading: isAuditLoading, refetch: refetchAudit } = useQuery({
    queryKey: ["admin-settings-audit"],
    queryFn: async () => {
      const res = await api.get("/settings/audit");
      return res.data?.content || res.data || [];
    },
  });

  const auditLogs = Array.isArray(rawAuditLogs?.content)
    ? rawAuditLogs.content
    : Array.isArray(rawAuditLogs)
    ? rawAuditLogs
    : [];

  // 3. Mutation for updating settings
  const updateMutation = useMutation({
    mutationFn: async ({ payload, reason }) => {
      const res = await api.put("/settings", {
        settings: payload,
        reason: reason || "Admin sozlamalarni yangiladi",
      });
      return res.data;
    },
    onSuccess: (data) => {
      const actualSettings = data?.content || data;
      queryClient.setQueryData(["admin-settings"], actualSettings);
      queryClient.invalidateQueries({ queryKey: ["admin-settings-audit"] });
      toast.success("Sozlamalar muvaffaqiyatli saqlandi!");
      setDraftSettings({});
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Sozlamalarni saqlashda xatolik yuz berdi");
    },
  });

  // 4. Mutation for resetting setting to default
  const resetMutation = useMutation({
    mutationFn: async ({ key }) => {
      const res = await api.post(`/settings/reset/${key}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-settings-audit"] });
      toast.info("Sozlama zavod standart holatiga qaytarildi");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Standart holatga qaytarib bo'lmadi");
    },
  });

  // Current effective value helper (draft overrides server)
  const getValue = (key, fallback) => {
    if (draftSettings[key] !== undefined) return draftSettings[key];
    if (settings[key] !== undefined) return settings[key];
    return fallback;
  };

  // Immediate toggle for regular boolean settings
  const handleToggle = (key, currentVal, label = "") => {
    const newVal = !currentVal;

    // Check if dangerous setting
    if (DANGEROUS_KEYS.includes(key)) {
      setDangerousModal({
        isOpen: true,
        key,
        newValue: newVal,
        label: label || key,
        reason: "",
      });
      return;
    }

    // Direct update
    updateMutation.mutate({
      payload: { [key]: newVal },
      reason: `${label || key} holati ${newVal ? "YOQILDI" : "O'CHIRILDI"}`,
    });
  };

  // Confirm dangerous change with reason
  const confirmDangerousChange = () => {
    if (!dangerousModal.reason.trim()) {
      toast.warning("Iltimos, o'zgarish sababini yozing!");
      return;
    }

    updateMutation.mutate({
      payload: { [dangerousModal.key]: dangerousModal.newValue },
      reason: dangerousModal.reason,
    });

    setDangerousModal({ isOpen: false, key: null, newValue: null, label: "", reason: "" });
  };

  // Draft change for inputs/numbers
  const handleDraftChange = (key, val) => {
    setDraftSettings((prev) => ({ ...prev, [key]: val }));
  };

  // Save specific draft or section
  const handleSaveDraft = (keysArray, sectionName = "") => {
    const payload = {};
    keysArray.forEach((k) => {
      if (draftSettings[k] !== undefined) {
        payload[k] = draftSettings[k];
      }
    });

    if (Object.keys(payload).length === 0) {
      toast.info("O'zgartirilgan parametrlar mavjud emas");
      return;
    }

    updateMutation.mutate({
      payload,
      reason: `${sectionName || "Sozlamalar"} bo'limi limitlari yangilandi`,
    });
  };

  // Confirm reset
  const handleConfirmReset = () => {
    if (!resetModal.key) return;
    resetMutation.mutate({ key: resetModal.key });
    setResetModal({ isOpen: false, key: null, label: "" });
  };

  // Global status indicators
  const isMaintenance = Boolean(settings.maintenance_mode);
  const configVersion = settings.config_version || 1;
  const lastUpdatedBy = settings.last_updated_by || "Tizim";
  const lastUpdatedAt = settings.last_updated_at
    ? dayjs(settings.last_updated_at).format("DD.MM.YYYY, HH:mm")
    : "Boshlang'ich";

  // Dependency checks
  const isMediaUploadActive = getValue("media_upload_enabled", true);
  const isChatActive = getValue("chat_enabled", true);
  const isBannerActive = getValue("banner_system_enabled", true);
  const isLocationActive = getValue("location_enabled", true);
  const isDeletionActive = getValue("account_deletion_enabled", true);

  // Settings Card Renderer Helper
  const renderSettingRow = ({
    icon: Icon,
    name,
    keyName,
    desc,
    control,
    isDanger = false,
    disabled = false,
    disabledTooltip = "",
  }) => (
    <div
      key={keyName}
      className={`p-3 px-3.5 rounded-xl border transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        disabled
          ? "bg-slate-50/70 border-slate-200 opacity-60"
          : isDanger
          ? "bg-rose-50/20 border-rose-200/80 hover:border-rose-300"
          : "bg-white border-slate-200/80 hover:border-blue-300 hover:shadow-2xs"
      }`}
    >
      <div className="flex items-start gap-3 max-w-xl">
        <div
          className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${
            disabled
              ? "bg-slate-200 text-slate-400"
              : isDanger
              ? "bg-rose-50 text-rose-600 border border-rose-100"
              : "bg-blue-50 text-blue-700 border border-blue-100"
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-900 text-xs">{name}</span>
            <code className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
              {keyName}
            </code>
            {isDanger && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                Kritik
              </span>
            )}
          </div>
          <p className="text-[11.5px] text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
          {disabled && disabledTooltip && (
            <p className="text-[10.5px] text-amber-600 font-medium mt-0.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {disabledTooltip}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
        {control}
        <Tooltip title="Zavod standart holatiga qaytarish">
          <button
            type="button"
            className="btn-action-neutral"
            aria-label="Standart holatga qaytarish"
            onClick={() => setResetModal({ isOpen: true, key: keyName, label: name })}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 pb-16">
      {/* 1. TOP HEADER */}
      <div className="enterprise-card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <h1 className="text-base font-bold text-slate-900 m-0 tracking-tight">
              Tizim Boshqaruvi & Central Control Plane
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              v{configVersion}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Platformaning barcha 15 ta funksional moduli, upload limitlari va operatsion qoidalarini real vaqt rejimida boshqarish
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`px-2.5 py-1 rounded-md border text-xs font-semibold flex items-center gap-1.5 ${
              isMaintenance
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                isMaintenance ? "bg-rose-500" : "bg-emerald-500"
              }`}
            />
            <span>{isMaintenance ? "Texnik Profilaktika Rejimi" : "100% Tizim Faol"}</span>
          </div>

          <Button
            size="small"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />}
            onClick={() => {
              refetch();
              refetchAudit();
              toast.info("Konfiguratsiya yangilandi");
            }}
            className="!rounded-md text-xs font-semibold"
          >
            Yangilash
          </Button>
        </div>
      </div>

      {/* 2. COMPACT STATS CARDS */}
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            label="Tizim Operatsion Holati"
            value={isMaintenance ? "TEXNIK REJIM" : "100% OPERATIONAL"}
            unit="SLA"
            subtitle={isMaintenance ? "Foydalanuvchilar to'xtatilgan" : "Barcha xizmatlar barqaror"}
            icon={Activity}
            color={isMaintenance ? "rose" : "emerald"}
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            label="Konfiguratsiya Versiyasi"
            value={`v${configVersion}`}
            unit="build"
            subtitle={`${lastUpdatedBy} (${lastUpdatedAt})`}
            icon={Sliders}
            color="blue"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            label="Boshqaruv Domenlari"
            value="15"
            unit="bo'lim"
            subtitle="Upload, Auth, CDN, AI, Chat, Xavfsizlik"
            icon={Layers}
            color="indigo"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            label="Audit Tarixi"
            value={auditLogs.length}
            unit="qayd"
            subtitle="Admin o'zgarishlar jurnali"
            icon={History}
            color="amber"
          />
        </Col>
      </Row>

      {/* 3. SEARCH & QUICK TELEMETRY BAR */}
      <div className="enterprise-card p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        <Input
          prefix={<Search className="w-3.5 h-3.5 text-slate-400 mr-1" />}
          placeholder="Barcha 15 ta bo'lim bo'yicha tezkor qidirish (rasm, limit, chat, cdn, do'kon)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:max-w-md !rounded-lg text-xs h-9"
          allowClear
        />

        <div className="flex items-center gap-1.5 text-xs text-slate-500 w-full md:w-auto justify-end overflow-x-auto pb-0.5">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mr-1">
            Status:
          </span>
          <Tag
            color={getValue("platform_enabled", true) ? "success" : "default"}
            className="!rounded px-2 py-0.5 text-[10px] font-mono m-0"
          >
            Platform: {getValue("platform_enabled", true) ? "ON" : "OFF"}
          </Tag>
          <Tag
            color={getValue("ad_posting_enabled", true) ? "success" : "default"}
            className="!rounded px-2 py-0.5 text-[10px] font-mono m-0"
          >
            E'lonlar: {getValue("ad_posting_enabled", true) ? "ON" : "OFF"}
          </Tag>
          <Tag
            color={getValue("chat_enabled", true) ? "success" : "default"}
            className="!rounded px-2 py-0.5 text-[10px] font-mono m-0"
          >
            Chat: {getValue("chat_enabled", true) ? "ON" : "OFF"}
          </Tag>
          <Tag
            color={getValue("media_upload_enabled", true) ? "success" : "default"}
            className="!rounded px-2 py-0.5 text-[10px] font-mono m-0"
          >
            Upload: {getValue("media_upload_enabled", true) ? "ON" : "OFF"}
          </Tag>
          <Tag
            color={getValue("shop_creation_enabled", true) ? "success" : "default"}
            className="!rounded px-2 py-0.5 text-[10px] font-mono m-0"
          >
            Do'konlar: {getValue("shop_creation_enabled", true) ? "ON" : "OFF"}
          </Tag>
          <Tag
            color={getValue("shop_phone_verification_required", true) ? "processing" : "default"}
            className="!rounded px-2 py-0.5 text-[10px] font-mono m-0"
          >
            SMS Do'kon: {getValue("shop_phone_verification_required", true) ? "Yoniq" : "O'chiq"}
          </Tag>
        </div>
      </div>

      {/* 4. TABS & SECTIONS NAVIGATION (ALL 15 CATEGORIES) */}
      <Card className="enterprise-card !border-slate-200" bodyStyle={{ padding: "12px 16px" }}>
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Spin size="large" />
            <span className="text-slate-500 text-sm">Konfiguratsiya ma'lumotlari yuklanmoqda...</span>
          </div>
        ) : (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            tabPosition="top"
            className="settings-custom-tabs"
            items={[
              // 1. Umumiy sozlamalar
              {
                key: "general",
                label: (
                  <span className="flex items-center gap-2 font-medium">
                    <Activity className="w-4 h-4 text-purple-600" />
                    1. Umumiy & Tizim
                  </span>
                ),
                children: (
                  <div className="space-y-4 pt-2">
                    <Alert
                      message="Umumiy Tizim Kalitlari"
                      description="Ushbu kalitlar sayt va mobil ilovaning global ish faoliyatini, texnik rejimini va foydalanuvchilar kirish huquqlarini boshqaradi."
                      type="info"
                      showIcon
                      className="rounded-xl"
                    />

                    <div className="grid grid-cols-1 gap-3">
                      {renderSettingRow({
                        icon: Globe,
                        name: "Platforma Global Holati",
                        keyName: "platform_enabled",
                        desc: "Agar o'chirilsa, butun tizim API va mijoz so'rovlari vaqtincha to'xtatiladi.",
                        isDanger: true,
                        control: (
                          <Switch
                            checked={getValue("platform_enabled", true)}
                            onChange={() =>
                              handleToggle("platform_enabled", getValue("platform_enabled", true), "Platforma")
                            }
                          />
                        ),
                      })}

                      {renderSettingRow({
                        icon: Server,
                        name: "Veb-sayt Ish Faoliyati (Web App)",
                        keyName: "web_enabled",
                        desc: "Kelishamiz.uz veb-sayti orqali kirishni yoqish yoki to'xtatish.",
                        control: (
                          <Switch
                            checked={getValue("web_enabled", true)}
                            onChange={() =>
                              handleToggle("web_enabled", getValue("web_enabled", true), "Veb-sayt")
                            }
                          />
                        ),
                      })}

                      {renderSettingRow({
                        icon: Smartphone,
                        name: "Mobil Ilova Ish Faoliyati (Mobile App)",
                        keyName: "mobile_enabled",
                        desc: "Android va iOS mobil ilovalar orqali ulanishni yoqish yoki to'xtatish.",
                        control: (
                          <Switch
                            checked={getValue("mobile_enabled", true)}
                            onChange={() =>
                              handleToggle("mobile_enabled", getValue("mobile_enabled", true), "Mobil Ilova")
                            }
                          />
                        ),
                      })}

                      {renderSettingRow({
                        icon: Users,
                        name: "Yangi Ro'yxatdan O'tish",
                        keyName: "registration_enabled",
                        desc: "Yangi akkaunt yaratish va OTP SMS tasdiqlash jarayonini yoqish/o'chirish.",
                        isDanger: true,
                        control: (
                          <Switch
                            checked={getValue("registration_enabled", true)}
                            onChange={() =>
                              handleToggle(
                                "registration_enabled",
                                getValue("registration_enabled", true),
                                "Ro'yxatdan O'tish"
                              )
                            }
                          />
                        ),
                      })}

                      {renderSettingRow({
                        icon: Lock,
                        name: "Foydalanuvchilar Kirishi (Login)",
                        keyName: "login_enabled",
                        desc: "Mavjud foydalanuvchilarning tizimga kirishiga ruxsat berish.",
                        isDanger: true,
                        control: (
                          <Switch
                            checked={getValue("login_enabled", true)}
                            onChange={() =>
                              handleToggle("login_enabled", getValue("login_enabled", true), "Login Tizimi")
                            }
                          />
                        ),
                      })}
                    </div>
                  </div>
                ),
              },

              // 2. Feature Flags
              {
                key: "feature_flags",
                label: (
                  <span className="flex items-center gap-2 font-medium">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    2. Feature Flags
                  </span>
                ),
                children: (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <Title level={5} style={{ margin: 0 }} className="text-slate-800">
                        Funksiyalarni Yoqish va O'chirish (Feature Flags)
                      </Title>
                      <Tag color="purple" className="rounded-full px-3 py-0.5 text-xs font-semibold">
                        Jami 20+ Flaglar
                      </Tag>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {renderSettingRow({
                        icon: TagIcon,
                        name: "Yangi E'lon Berish",
                        keyName: "ad_posting_enabled",
                        desc: "Foydalanuvchilar tomonidan yangi e'lon qo'shish imkoniyati.",
                        isDanger: true,
                        control: (
                          <Switch
                            checked={getValue("ad_posting_enabled", true)}
                            onChange={() =>
                              handleToggle(
                                "ad_posting_enabled",
                                getValue("ad_posting_enabled", true),
                                "E'lon Berish"
                              )
                            }
                          />
                        ),
                      })}

                      {renderSettingRow({
                        icon: MessageSquare,
                        name: "Ichki Chat Tizimi",
                        keyName: "chat_enabled",
                        desc: "Foydalanuvchilar o'rtasida shaxsiy yozishmalar tizimi.",
                        isDanger: true,
                        control: (
                          <Switch
                            checked={getValue("chat_enabled", true)}
                            onChange={() =>
                              handleToggle("chat_enabled", getValue("chat_enabled", true), "Chat Tizimi")
                            }
                          />
                        ),
                      })}

                      {renderSettingRow({
                        icon: Store,
                        name: "Yangi Do'kon Ochish",
                        keyName: "shop_creation_enabled",
                        desc: "Tadbirkorlar tomonidan yangi do'kon va profil yaratish.",
                        control: (
                          <Switch
                            checked={getValue("shop_creation_enabled", true)}
                            onChange={() =>
                              handleToggle(
                                "shop_creation_enabled",
                                getValue("shop_creation_enabled", true),
                                "Do'kon Ochish"
                              )
                            }
                          />
                        ),
                      })}

                      {renderSettingRow({
                        icon: Sparkles,
                        name: "Banner & Promo Tizimi",
                        keyName: "banner_system_enabled",
                        desc: "Sayt va mobil ilovadagi reklama va aksiyalar banerlarini ko'rsatish.",
                        control: (
                          <Switch
                            checked={getValue("banner_system_enabled", true)}
                            onChange={() =>
                              handleToggle(
                                "banner_system_enabled",
                                getValue("banner_system_enabled", true),
                                "Banner Tizimi"
                              )
                            }
                          />
                        ),
                      })}

                      {renderSettingRow({
                        icon: Bell,
                        name: "Push Bildirishnomalar",
                        keyName: "push_notifications_enabled",
                        desc: "Mobil qurilmalarga push xabarnomalar yuborish.",
                        control: (
                          <Switch
                            checked={getValue("push_notifications_enabled", true)}
                            onChange={() =>
                              handleToggle(
                                "push_notifications_enabled",
                                getValue("push_notifications_enabled", true),
                                "Push Bildirishnomalar"
                              )
                            }
                          />
                        ),
                      })}

                      {renderSettingRow({
                        icon: MapPin,
                        name: "Xarita & Lokatsiya Tanlagich",
                        keyName: "location_picker_enabled",
                        desc: "E'lon berishda interaktiv xaritadan aniq nuqtani tanlash.",
                        control: (
                          <Switch
                            checked={getValue("location_picker_enabled", true)}
                            onChange={() =>
                              handleToggle(
                                "location_picker_enabled",
                                getValue("location_picker_enabled", true),
                                "Xarita Tanlagich"
                              )
                            }
                          />
                        ),
                      })}

                      {renderSettingRow({
                        icon: Search,
                        name: "Kengaytirilgan Qidiruv (Advanced Search)",
                        keyName: "advanced_search_enabled",
                        desc: "Filtrlar, narx oraliqlari va hududlar bo'yicha murakkab qidiruv tizimi.",
                        control: (
                          <Switch
                            checked={getValue("advanced_search_enabled", true)}
                            onChange={() =>
                              handleToggle(
                                "advanced_search_enabled",
                                getValue("advanced_search_enabled", true),
                                "Kengaytirilgan Qidiruv"
                              )
                            }
                          />
                        ),
                      })}
                    </div>
                  </div>
                ),
              },

              // 3. Upload & Media Limits
              {
                key: "media_limits",
                label: (
                  <span className="flex items-center gap-2 font-medium">
                    <UploadCloud className="w-4 h-4 text-emerald-600" />
                    3. Upload Limits ⭐
                  </span>
                ),
                children: (
                  <div className="space-y-6 pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Title level={5} style={{ margin: 0 }} className="text-slate-900">
                          Fayl, Rasm va Video Limitlari (Backend Enforced)
                        </Title>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Ushbu limitlar backend tomonidan qat'iy tekshiriladi va ruxsat etilmagan fayllar avtomatik rad etiladi.
                        </p>
                      </div>
                      <Button
                        type="primary"
                        icon={<Save className="w-3.5 h-3.5" />}
                        className="!bg-blue-700 hover:!bg-blue-800 text-white font-semibold !rounded-lg text-xs shadow-xs"
                        loading={updateMutation.isPending}
                        onClick={() =>
                          handleSaveDraft(
                            [
                              "max_image_size_mb",
                              "max_images_per_ad",
                              "max_video_size_mb",
                              "max_video_duration_seconds",
                              "max_file_size_mb",
                              "chat_max_image_size_mb",
                            ],
                            "Upload Limitlari"
                          )
                        }
                      >
                        Limitlarni Saqlash
                      </Button>
                    </div>

                    {renderSettingRow({
                      icon: UploadCloud,
                      name: "Barcha Media Yuklash (Master Switch)",
                      keyName: "media_upload_enabled",
                      desc: "Agar o'chirilsa, sayt va ilovadagi barcha rasm, video va fayl yuklashlar to'xtatiladi.",
                      isDanger: true,
                      control: (
                        <Switch
                          checked={getValue("media_upload_enabled", true)}
                          onChange={() =>
                            handleToggle(
                              "media_upload_enabled",
                              getValue("media_upload_enabled", true),
                              "Barcha Media Yuklash"
                            )
                          }
                        />
                      ),
                    })}

                    {/* Image Settings */}
                    <div className="enterprise-card p-4 space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm">Rasm Yuklash Limitlari</span>
                            <p className="text-xs text-slate-500">Maksimal hajm, formatlar va e'longa biriktirish soni</p>
                          </div>
                        </div>
                        <Switch
                          checked={getValue("image_upload_enabled", true)}
                          disabled={!isMediaUploadActive}
                          onChange={() =>
                            handleToggle(
                              "image_upload_enabled",
                              getValue("image_upload_enabled", true),
                              "Rasm Yuklash"
                            )
                          }
                        />
                      </div>

                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={8}>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Maksimal Rasm Hajmi (MB):</label>
                            <InputNumber
                              min={1}
                              max={50}
                              addonAfter="MB"
                              className="w-full"
                              value={getValue("max_image_size_mb", 10)}
                              onChange={(val) => handleDraftChange("max_image_size_mb", val)}
                              disabled={!isMediaUploadActive}
                            />
                          </div>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Bitta E'longa Rasm Soni:</label>
                            <InputNumber
                              min={1}
                              max={30}
                              addonAfter="ta"
                              className="w-full"
                              value={getValue("max_images_per_ad", 10)}
                              onChange={(val) => handleDraftChange("max_images_per_ad", val)}
                              disabled={!isMediaUploadActive}
                            />
                          </div>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Profil Avatari Maksimal Hajmi:</label>
                            <InputNumber
                              min={1}
                              max={20}
                              addonAfter="MB"
                              className="w-full"
                              value={getValue("max_avatar_size_mb", 5)}
                              onChange={(val) => handleDraftChange("max_avatar_size_mb", val)}
                              disabled={!isMediaUploadActive}
                            />
                          </div>
                        </Col>
                      </Row>

                      <div className="pt-3 border-t border-slate-100">
                        <span className="text-xs font-semibold text-slate-700 block mb-2">
                          Ruxsat etilgan rasm formatlari:
                        </span>
                        <div className="flex flex-wrap items-center gap-3">
                          {["jpg", "jpeg", "png", "webp", "gif", "svg"].map((fmt) => {
                            const formats = getValue("allowed_image_formats", {
                              jpg: true,
                              png: true,
                              webp: true,
                            });
                            const isAllowed = Boolean(formats[fmt]);
                            return (
                              <div
                                key={fmt}
                                className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 ${
                                  isAllowed
                                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-700"
                                    : "bg-slate-50 border-slate-200 text-slate-400"
                                }`}
                              >
                                <span className="font-mono font-bold uppercase">{fmt}</span>
                                <Switch
                                  size="small"
                                  checked={isAllowed}
                                  disabled={!isMediaUploadActive}
                                  onChange={(checked) => {
                                    const nextFormats = { ...formats, [fmt]: checked };
                                    updateMutation.mutate({
                                      payload: { allowed_image_formats: nextFormats },
                                      reason: `.${fmt.toUpperCase()} formati ${
                                        checked ? "ruxsat etildi" : "o'chirildi"
                                      }`,
                                    });
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Video Settings */}
                    <div className="enterprise-card p-4 space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
                            <Video className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm">Video Yuklash Limitlari</span>
                            <p className="text-xs text-slate-500">Maksimal davomiyligi va fayl hajmi</p>
                          </div>
                        </div>
                        <Switch
                          checked={getValue("video_upload_enabled", true)}
                          disabled={!isMediaUploadActive}
                          onChange={() =>
                            handleToggle(
                              "video_upload_enabled",
                              getValue("video_upload_enabled", true),
                              "Video Yuklash"
                            )
                          }
                        />
                      </div>

                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Maksimal Video Hajmi:</label>
                            <InputNumber
                              min={5}
                              max={500}
                              addonAfter="MB"
                              className="w-full"
                              value={getValue("max_video_size_mb", 100)}
                              onChange={(val) => handleDraftChange("max_video_size_mb", val)}
                              disabled={!isMediaUploadActive}
                            />
                          </div>
                        </Col>

                        <Col xs={24} sm={12}>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Maksimal Davomiylik (Soniya):</label>
                            <InputNumber
                              min={10}
                              max={300}
                              addonAfter="sekund"
                              className="w-full"
                              value={getValue("max_video_duration_seconds", 60)}
                              onChange={(val) => handleDraftChange("max_video_duration_seconds", val)}
                              disabled={!isMediaUploadActive}
                            />
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </div>
                ),
              },

              // 4. E'lonlar & Moderatsiya
              {
                key: "ads_moderation",
                label: (
                  <span className="flex items-center gap-2 font-medium">
                    <Shield className="w-4 h-4 text-amber-600" />
                    4. E'lonlar & Moderatsiya
                  </span>
                ),
                children: (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <Title level={5} style={{ margin: 0 }} className="text-slate-900">
                        E'lonlar va Moderatsiya Siyosati
                      </Title>
                      <Button
                        type="primary"
                        icon={<Save className="w-4 h-4" />}
                        className="!bg-blue-700 hover:!bg-blue-800 text-white font-semibold !rounded-lg text-xs shadow-xs"
                        loading={updateMutation.isPending}
                        onClick={() =>
                          handleSaveDraft(
                            ["max_title_length", "max_description_length", "report_threshold"],
                            "E'lonlar Limitlari"
                          )
                        }
                      >
                        Matn Limitlarini Saqlash
                      </Button>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                        <div>
                          <span className="font-semibold text-slate-900 text-sm">Moderatsiya Rejimi</span>
                          <p className="text-xs text-slate-500">Yangi qo'shilgan e'lonlarni tasdiqlash strategiyasi</p>
                        </div>
                        <Select
                          value={getValue("moderation_mode", "hybrid")}
                          onChange={(val) => {
                            updateMutation.mutate({
                              payload: {
                                moderation_mode: val,
                                auto_moderation_enabled: val === "auto",
                              },
                              reason: `Moderatsiya rejimi '${val}' ga o'zgartirildi`,
                            });
                          }}
                          className="w-48"
                          options={[
                            { value: "manual", label: "To'liq Qo'lda (Manual)" },
                            { value: "auto", label: "To'liq Avtomat (Auto)" },
                            { value: "hybrid", label: "Gibrid (Tavsiya etiladi)" },
                          ]}
                        />
                      </div>

                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Sarlavha Maksimal Uzunligi (Belgilar):
                          </label>
                          <InputNumber
                            min={10}
                            max={250}
                            addonAfter="belgi"
                            className="w-full"
                            value={getValue("max_title_length", 120)}
                            onChange={(val) => handleDraftChange("max_title_length", val)}
                          />
                        </Col>

                        <Col xs={24} sm={12}>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Tavsif Maksimal Uzunligi (Belgilar):
                          </label>
                          <InputNumber
                            min={50}
                            max={10000}
                            addonAfter="belgi"
                            className="w-full"
                            value={getValue("max_description_length", 5000)}
                            onChange={(val) => handleDraftChange("max_description_length", val)}
                          />
                        </Col>
                      </Row>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {renderSettingRow({
                        icon: ShieldAlert,
                        name: "Shikoyat Qilingan E'lonni Avto Yashirish",
                        keyName: "reported_ad_auto_hide",
                        desc: "Agar e'lon ustidan belgilangan sondan ortiq shikoyat tushsa, admin tekshirgunicha avtomatik yashiriladi.",
                        control: (
                          <Switch
                            checked={getValue("reported_ad_auto_hide", true)}
                            onChange={() =>
                              handleToggle(
                                "reported_ad_auto_hide",
                                getValue("reported_ad_auto_hide", true),
                                "Avto Yashirish"
                              )
                            }
                          />
                        ),
                      })}

                      {renderSettingRow({
                        icon: CheckCircle2,
                        name: "Spam va Nojo'ya So'zlar Filtrini Ishlatish",
                        keyName: "blocked_words_enabled",
                        desc: "Taqiqlangan so'zlar yoki firibgarlik belgilari bo'lgan e'lonlarni avtomatik aniqlash.",
                        control: (
                          <Switch
                            checked={getValue("blocked_words_enabled", true)}
                            onChange={() =>
                              handleToggle(
                                "blocked_words_enabled",
                                getValue("blocked_words_enabled", true),
                                "Spam Filtri"
                              )
                            }
                          />
                        ),
                      })}
                    </div>
                  </div>
                ),
              },

              // 5. Do'konlar (Shops)
              {
                key: "shops",
                label: (
                  <span className="flex items-center gap-2 font-medium">
                    <Store className="w-4 h-4 text-cyan-600" />
                    5. Do'konlar
                  </span>
                ),
                children: (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <Title level={5} style={{ margin: 0 }} className="text-slate-900">
                        Do'konlar va Biznes Akkauntlar Siyosati
                      </Title>
                      <Button
                        type="primary"
                        icon={<Save className="w-4 h-4" />}
                        className="!bg-blue-700 hover:!bg-blue-800 text-white font-semibold !rounded-lg text-xs shadow-xs"
                        loading={updateMutation.isPending}
                        onClick={() =>
                          handleSaveDraft(["max_shop_images", "max_shop_description_length"], "Do'kon Limitlari")
                        }
                      >
                        Limitlarni Saqlash
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {renderSettingRow({
                        icon: Store,
                        name: "Yangi Do'kon Ochish Imkoniyati",
                        keyName: "shop_creation_enabled",
                        desc: "Tadbirkorlar tomonidan yangi rasmiy do'kon ochish.",
                        control: (
                          <Switch
                            checkedChildren="Yoniq"
                            unCheckedChildren="O'chiq"
                            checked={getValue("shop_creation_enabled", true)}
                            onChange={() =>
                              handleToggle(
                                "shop_creation_enabled",
                                getValue("shop_creation_enabled", true),
                                "Do'kon Ochish"
                              )
                            }
                          />
                        ),
                      })}

                      {renderSettingRow({
                        icon: Smartphone,
                        name: "Do'kon Ochishda Raqamni Tasdiqlash",
                        keyName: "shop_phone_verification_required",
                        desc: "Do'kon ochishda telefon raqamini SMS kod orqali tasdiqlash talabi.",
                        control: (
                          <Switch
                            checkedChildren="Yoniq"
                            unCheckedChildren="O'chiq"
                            checked={getValue("shop_phone_verification_required", true)}
                            onChange={() =>
                              handleToggle(
                                "shop_phone_verification_required",
                                getValue("shop_phone_verification_required", true),
                                "Do'kon raqamini tasdiqlash"
                              )
                            }
                          />
                        ),
                      })}

                      {renderSettingRow({
                        icon: FileCheck,
                        name: "Do'kon Ochishda Admin Tasdig'i Majburiy",
                        keyName: "shop_requires_moderation",
                        desc: "Yangi ochilgan do'konlar faqat admin tekshiruvidan keyin faollashadi.",
                        control: (
                          <Switch
                            checked={getValue("shop_requires_moderation", true)}
                            onChange={() =>
                              handleToggle(
                                "shop_requires_moderation",
                                getValue("shop_requires_moderation", true),
                                "Do'kon Moderatsiyasi"
                              )
                            }
                          />
                        ),
                      })}

                      {renderSettingRow({
                        icon: CheckCircle2,
                        name: "Tasdiqlangan Do'kon Nishoni (Verified Badge)",
                        keyName: "verified_shop_badge_enabled",
                        desc: "Do'kon nomining yonida ko'k tasdiq belgisini ko'rsatish.",
                        control: (
                          <Switch
                            checked={getValue("verified_shop_badge_enabled", true)}
                            onChange={() =>
                              handleToggle(
                                "verified_shop_badge_enabled",
                                getValue("verified_shop_badge_enabled", true),
                                "Verified Badge"
                              )
                            }
                          />
                        ),
                      })}
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white">
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Do'kon Profiliga Rasm Soni:
                          </label>
                          <InputNumber
                            min={1}
                            max={50}
                            addonAfter="ta"
                            className="w-full"
                            value={getValue("max_shop_images", 20)}
                            onChange={(val) => handleDraftChange("max_shop_images", val)}
                          />
                        </Col>

                        <Col xs={24} sm={12}>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Do'kon Tavsifi Maksimal Uzunligi:
                          </label>
                          <InputNumber
                            min={100}
                            max={5000}
                            addonAfter="belgi"
                            className="w-full"
                            value={getValue("max_shop_description_length", 3000)}
                            onChange={(val) => handleDraftChange("max_shop_description_length", val)}
                          />
                        </Col>
                      </Row>
                    </div>
                  </div>
                ),
              },

              // 6. Chat & Aloqa
              {
                key: "chat",
                label: (
                  <span className="flex items-center gap-2 font-medium">
                    <MessageSquare className="w-4 h-4 text-sky-600" />
                    6. Chat & Aloqa
                  </span>
                ),
                children: (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <Title level={5} style={{ margin: 0 }} className="text-slate-900">
                        Chat va Aloqa Sozlamalari
                      </Title>
                      <Button
                        type="primary"
                        icon={<Save className="w-4 h-4" />}
                        className="!bg-blue-700 hover:!bg-blue-800 text-white font-semibold !rounded-lg text-xs shadow-xs"
                        loading={updateMutation.isPending}
                        onClick={() =>
                          handleSaveDraft(["max_message_length", "message_rate_limit"], "Chat Limitlari")
                        }
                      >
                        Limitlarni Saqlash
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {renderSettingRow({
                        icon: MessageSquare,
                        name: "Chat Tizimini Global Yoqish",
                        keyName: "chat_enabled",
                        desc: "Foydalanuvchilar o'rtasida shaxsiy xabar almashishni butunlay to'xtatish yoki yoqish.",
                        isDanger: true,
                        control: (
                          <Switch
                            checked={getValue("chat_enabled", true)}
                            onChange={() =>
                              handleToggle("chat_enabled", getValue("chat_enabled", true), "Chat Tizimi")
                            }
                          />
                        ),
                      })}

                      {renderSettingRow({
                        icon: ImageIcon,
                        name: "Chatda Rasm Yuborish",
                        keyName: "chat_image_upload_enabled",
                        desc: "Xabarlar orqali rasm ilova qilish imkoniyati.",
                        disabled: !isChatActive,
                        disabledTooltip: "Asosiy Chat o'chirilgani sababli nofaol",
                        control: (
                          <Switch
                            checked={getValue("chat_image_upload_enabled", true)}
                            disabled={!isChatActive}
                            onChange={() =>
                              handleToggle(
                                "chat_image_upload_enabled",
                                getValue("chat_image_upload_enabled", true),
                                "Chatda Rasm"
                              )
                            }
                          />
                        ),
                      })}

                      {renderSettingRow({
                        icon: Video,
                        name: "Chatda Video Yuborish",
                        keyName: "chat_video_upload_enabled",
                        desc: "Server yuklamasini kamaytirish maqsadida standart holatda o'chiq.",
                        disabled: !isChatActive,
                        disabledTooltip: "Asosiy Chat o'chirilgani sababli nofaol",
                        control: (
                          <Switch
                            checked={getValue("chat_video_upload_enabled", false)}
                            disabled={!isChatActive}
                            onChange={() =>
                              handleToggle(
                                "chat_video_upload_enabled",
                                getValue("chat_video_upload_enabled", false),
                                "Chatda Video"
                              )
                            }
                          />
                        ),
                      })}
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white">
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Maksimal Xabar Uzunligi:
                          </label>
                          <InputNumber
                            min={50}
                            max={5000}
                            addonAfter="belgi"
                            className="w-full"
                            value={getValue("max_message_length", 2000)}
                            onChange={(val) => handleDraftChange("max_message_length", val)}
                            disabled={!isChatActive}
                          />
                        </Col>

                        <Col xs={24} sm={12}>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Anti-Spam Limit (Minutiga xabarlar soni):
                          </label>
                          <InputNumber
                            min={5}
                            max={120}
                            addonAfter="xabar/min"
                            className="w-full"
                            value={getValue("message_rate_limit", 30)}
                            onChange={(val) => handleDraftChange("message_rate_limit", val)}
                            disabled={!isChatActive}
                          />
                        </Col>
                      </Row>
                    </div>
                  </div>
                ),
              },

              // 7. Notifications
              {
                key: "notifications",
                label: (
                  <span className="flex items-center gap-2 font-medium">
                    <Bell className="w-4 h-4 text-violet-600" />
                    7. Bildirishnomalar
                  </span>
                ),
                children: (
                  <div className="space-y-4 pt-2">
                    <Title level={5} style={{ margin: 0 }} className="text-slate-900">
                      Bildirishnomalar va Xabarnoma Kanallari
                    </Title>

                    <div className="grid grid-cols-1 gap-3">
                      {renderSettingRow({
                        icon: Bell,
                        name: "Push Bildirishnomalar (Firebase FCM)",
                        keyName: "push_notifications_enabled",
                        desc: "Mobil ilovalarga fonda xabarnoma yuborish.",
                        control: (
                          <Switch
                            checked={getValue("push_notifications_enabled", true)}
                            onChange={() =>
                              handleToggle(
                                "push_notifications_enabled",
                                getValue("push_notifications_enabled", true),
                                "Push Bildirishnomalar"
                              )
                            }
                          />
                        ),
                      })}

                      {renderSettingRow({
                        icon: Send,
                        name: "Telegram Bot Xabarnomalari",
                        keyName: "telegram_notifications_enabled",
                        desc: "Yangi e'lonlar, moderatsiya natijalari va buyurtmalarni Telegram bot orqali yuborish.",
                        control: (
                          <Switch
                            checked={getValue("telegram_notifications_enabled", true)}
                            onChange={() =>
                              handleToggle(
                                "telegram_notifications_enabled",
                                getValue("telegram_notifications_enabled", true),
                                "Telegram Bildirishnomalar"
                              )
                            }
                          />
                        ),
                      })}

                      {renderSettingRow({
                        icon: MessageSquare,
                        name: "Ilova Ichki Bildirishnomalari (In-App)",
                        keyName: "in_app_notifications_enabled",
                        desc: "Qo'ng'iroqcha belgisida ko'rsatiladigan tizim bildirishnomalari.",
                        control: (
                          <Switch
                            checked={getValue("in_app_notifications_enabled", true)}
                            onChange={() =>
                              handleToggle(
                                "in_app_notifications_enabled",
                                getValue("in_app_notifications_enabled", true),
                                "In-App Bildirishnomalar"
                              )
                            }
                          />
                        ),
                      })}
                    </div>
                  </div>
                ),
              },

              // 8. Banners & Promo
              {
                key: "banners",
                label: (
                  <span className="flex items-center gap-2 font-medium">
                    <Sparkles className="w-4 h-4 text-pink-600" />
                    8. Bannerlar & Promo
                  </span>
                ),
                children: (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <Title level={5} style={{ margin: 0 }} className="text-slate-900">
                        Bannerlar va Reklama Konfiguratsiyasi
                      </Title>
                      <Button
                        type="primary"
                        icon={<Save className="w-4 h-4" />}
                        className="!bg-blue-700 hover:!bg-blue-800 text-white font-semibold !rounded-lg text-xs shadow-xs"
                        loading={updateMutation.isPending}
                        onClick={() =>
                          handleSaveDraft(["max_banner_image_size_mb", "max_banner_duration_seconds"], "Banner Limitlari")
                        }
                      >
                        Limitlarni Saqlash
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {renderSettingRow({
                        icon: Sparkles,
                        name: "Banner Tizimini Global Yoqish",
                        keyName: "banner_system_enabled",
                        desc: "Agar o'chirilsa, sayt va ilovadagi barcha promo bannerlar vaqtinchalik ko'rsatilmaydi.",
                        control: (
                          <Switch
                            checked={getValue("banner_system_enabled", true)}
                            onChange={() =>
                              handleToggle(
                                "banner_system_enabled",
                                getValue("banner_system_enabled", true),
                                "Banner Tizimi"
                              )
                            }
                          />
                        ),
                      })}

                      {renderSettingRow({
                        icon: Star,
                        name: "VIP va Top E'lonlar Reklamasi (Featured Ads)",
                        keyName: "featured_ads_enabled",
                        desc: "Bosh sahifa va qidiruv tepasida alohida ajratilgan VIP e'lonlar bloki.",
                        disabled: !isBannerActive,
                        control: (
                          <Switch
                            checked={getValue("featured_ads_enabled", true)}
                            disabled={!isBannerActive}
                            onChange={() =>
                              handleToggle(
                                "featured_ads_enabled",
                                getValue("featured_ads_enabled", true),
                                "VIP E'lonlar"
                              )
                            }
                          />
                        ),
                      })}
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white">
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Banner Maksimal Hajmi (MB):
                          </label>
                          <InputNumber
                            min={1}
                            max={20}
                            addonAfter="MB"
                            className="w-full"
                            value={getValue("max_banner_image_size_mb", 5)}
                            onChange={(val) => handleDraftChange("max_banner_image_size_mb", val)}
                            disabled={!isBannerActive}
                          />
                        </Col>

                        <Col xs={24} sm={12}>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Video Banner Maksimal Davomiyligi:
                          </label>
                          <InputNumber
                            min={5}
                            max={60}
                            addonAfter="sekund"
                            className="w-full"
                            value={getValue("max_banner_duration_seconds", 15)}
                            onChange={(val) => handleDraftChange("max_banner_duration_seconds", val)}
                            disabled={!isBannerActive}
                          />
                        </Col>
                      </Row>
                    </div>
                  </div>
                ),
              },

              // 9. Users & Profiles
              {
                key: "users_profiles",
                label: (
                  <span className="flex items-center gap-2 font-medium">
                    <Users className="w-4 h-4 text-blue-600" />
                    9. Foydalanuvchi & Profil
                  </span>
                ),
                children: (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <Title level={5} style={{ margin: 0 }} className="text-slate-900">
                        Foydalanuvchi Profili Sozlamalari
                      </Title>
                      <Button
                        type="primary"
                        icon={<Save className="w-4 h-4" />}
                        className="!bg-blue-700 hover:!bg-blue-800 text-white font-semibold !rounded-lg text-xs shadow-xs"
                        loading={updateMutation.isPending}
                        onClick={() =>
                          handleSaveDraft(["username_min_length", "username_max_length", "bio_max_length"], "Profil Limitlari")
                        }
                      >
                        Limitlarni Saqlash
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {renderSettingRow({
                        icon: Users,
                        name: "Profil Tahrirlash Imkoniyati",
                        keyName: "profile_edit_enabled",
                        desc: "Foydalanuvchilar o'z ma'lumotlarini o'zgartirishiga ruxsat berish.",
                        control: (
                          <Switch
                            checked={getValue("profile_edit_enabled", true)}
                            onChange={() =>
                              handleToggle("profile_edit_enabled", getValue("profile_edit_enabled", true), "Profil Tahrirlash")
                            }
                          />
                        ),
                      })}

                      {renderSettingRow({
                        icon: Lock,
                        name: "Foydalanuvchi Nomini (Username) O'zgartirish",
                        keyName: "user_username_change_enabled",
                        desc: "Hisob yaratilgandan so'ng username ni qayta o'zgartirish imkoni.",
                        control: (
                          <Switch
                            checked={getValue("user_username_change_enabled", true)}
                            onChange={() =>
                              handleToggle(
                                "user_username_change_enabled",
                                getValue("user_username_change_enabled", true),
                                "Username O'zgartirish"
                              )
                            }
                          />
                        ),
                      })}
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white">
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Username Minimal Uzunligi:
                          </label>
                          <InputNumber
                            min={2}
                            max={10}
                            addonAfter="belgi"
                            className="w-full"
                            value={getValue("username_min_length", 3)}
                            onChange={(val) => handleDraftChange("username_min_length", val)}
                          />
                        </Col>

                        <Col xs={24} sm={12}>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Username Maksimal Uzunligi:
                          </label>
                          <InputNumber
                            min={10}
                            max={50}
                            addonAfter="belgi"
                            className="w-full"
                            value={getValue("username_max_length", 30)}
                            onChange={(val) => handleDraftChange("username_max_length", val)}
                          />
                        </Col>
                      </Row>
                    </div>
                  </div>
                ),
              },

              // 10. Location & Manzillar
              {
                key: "locations",
                label: (
                  <span className="flex items-center gap-2 font-medium">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    10. Hududlar & Manzillar
                  </span>
                ),
                children: (
                  <div className="space-y-4 pt-2">
                    <Title level={5} style={{ margin: 0 }} className="text-slate-900">
                      Geolokatsiya va Hududlar Siyosati
                    </Title>

                    <div className="grid grid-cols-1 gap-3">
                      {renderSettingRow({
                        icon: MapPin,
                        name: "Lokatsiya Tizimi (Master)",
                        keyName: "location_enabled",
                        desc: "Shahar, tuman va manzil tanlash tizimini faollashtirish.",
                        control: (
                          <Switch
                            checked={getValue("location_enabled", true)}
                            onChange={() =>
                              handleToggle("location_enabled", getValue("location_enabled", true), "Lokatsiya Tizimi")
                            }
                          />
                        ),
                      })}

                      {renderSettingRow({
                        icon: Globe,
                        name: "E'londa Aniq Manzil Ko'rsatish Majburiy",
                        keyName: "ad_location_required",
                        desc: "Viloyat va tuman kiritilmagan e'lonlar chop etilmaydi.",
                        disabled: !isLocationActive,
                        control: (
                          <Switch
                            checked={getValue("ad_location_required", true)}
                            disabled={!isLocationActive}
                            onChange={() =>
                              handleToggle(
                                "ad_location_required",
                                getValue("ad_location_required", true),
                                "Manzil Majburiyligi"
                              )
                            }
                          />
                        ),
                      })}
                    </div>
                  </div>
                ),
              },

              // 11. CDN & Storage
              {
                key: "cdn_storage",
                label: (
                  <span className="flex items-center gap-2 font-medium">
                    <Cloud className="w-4 h-4 text-blue-500" />
                    11. CDN & Xotira
                  </span>
                ),
                children: (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <Title level={5} style={{ margin: 0 }} className="text-slate-900">
                        Bunny.net CDN va Xotira Boshqaruvi
                      </Title>
                      <Button
                        type="primary"
                        icon={<Save className="w-4 h-4" />}
                        className="!bg-blue-700 hover:!bg-blue-800 text-white font-semibold !rounded-lg text-xs shadow-xs"
                        loading={updateMutation.isPending}
                        onClick={() =>
                          handleSaveDraft(["max_user_storage_mb", "max_shop_storage_mb"], "Xotira Limitlari")
                        }
                      >
                        Limitlarni Saqlash
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {renderSettingRow({
                        icon: Cloud,
                        name: "Bunny CDN Global Tarqatish",
                        keyName: "cdn_enabled",
                        desc: "Media fayllarni Bunny.net edge serverlari orqali keshlab yetkazib berish.",
                        control: (
                          <Switch
                            checked={getValue("cdn_enabled", true)}
                            onChange={() =>
                              handleToggle("cdn_enabled", getValue("cdn_enabled", true), "Bunny CDN")
                            }
                          />
                        ),
                      })}

                      {renderSettingRow({
                        icon: Cpu,
                        name: "Rasmlarni Avtomatik WebP ga O'tkazish",
                        keyName: "webp_conversion_enabled",
                        desc: "Yuklangan rasmlarni hajmini kamaytirish uchun avtomatik WebP formatga siqish.",
                        control: (
                          <Switch
                            checked={getValue("webp_conversion_enabled", true)}
                            onChange={() =>
                              handleToggle(
                                "webp_conversion_enabled",
                                getValue("webp_conversion_enabled", true),
                                "WebP Konvertatsiya"
                              )
                            }
                          />
                        ),
                      })}
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white">
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Foydalanuvchi Maksimal Disk Kvotasi (MB):
                          </label>
                          <InputNumber
                            min={100}
                            max={5000}
                            addonAfter="MB"
                            className="w-full"
                            value={getValue("max_user_storage_mb", 500)}
                            onChange={(val) => handleDraftChange("max_user_storage_mb", val)}
                          />
                        </Col>

                        <Col xs={24} sm={12}>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Do'kon Maksimal Disk Kvotasi (MB):
                          </label>
                          <InputNumber
                            min={500}
                            max={20000}
                            addonAfter="MB"
                            className="w-full"
                            value={getValue("max_shop_storage_mb", 2000)}
                            onChange={(val) => handleDraftChange("max_shop_storage_mb", val)}
                          />
                        </Col>
                      </Row>
                    </div>
                  </div>
                ),
              },

              // 12. Security & Rate Limits
              {
                key: "security",
                label: (
                  <span className="flex items-center gap-2 font-medium">
                    <Lock className="w-4 h-4 text-rose-600" />
                    12. Xavfsizlik & Rate Limits
                  </span>
                ),
                children: (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <Title level={5} style={{ margin: 0 }} className="text-slate-900">
                        Xavfsizlik va So'rovlar Miqdori (Rate Limits)
                      </Title>
                      <Button
                        type="primary"
                        icon={<Save className="w-4 h-4" />}
                        className="!bg-blue-700 hover:!bg-blue-800 text-white font-semibold !rounded-lg text-xs shadow-xs"
                        loading={updateMutation.isPending}
                        onClick={() =>
                          handleSaveDraft(
                            [
                              "max_requests_per_minute",
                              "max_login_attempts",
                              "account_lockout_duration_minutes",
                              "upload_rate_limit",
                            ],
                            "Xavfsizlik Limitlari"
                          )
                        }
                      >
                        Limitlarni Saqlash
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {renderSettingRow({
                        icon: Shield,
                        name: "API Rate Limiting Tizimi",
                        keyName: "api_rate_limit_enabled",
                        desc: "DDoS va ortiqcha avtomatlashtirilgan bot so'rovlariga qarshi cheklov.",
                        control: (
                          <Switch
                            checked={getValue("api_rate_limit_enabled", true)}
                            onChange={() =>
                              handleToggle(
                                "api_rate_limit_enabled",
                                getValue("api_rate_limit_enabled", true),
                                "API Rate Limiting"
                              )
                            }
                          />
                        ),
                      })}
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white">
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Umumiy API Cheklovi (Minutiga):
                          </label>
                          <InputNumber
                            min={30}
                            max={1000}
                            addonAfter="so'rov/min"
                            className="w-full"
                            value={getValue("max_requests_per_minute", 120)}
                            onChange={(val) => handleDraftChange("max_requests_per_minute", val)}
                          />
                        </Col>

                        <Col xs={24} sm={12}>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Noto'g'ri Kirish Urinishlari Cheklovi:
                          </label>
                          <InputNumber
                            min={3}
                            max={20}
                            addonAfter="marta"
                            className="w-full"
                            value={getValue("max_login_attempts", 5)}
                            onChange={(val) => handleDraftChange("max_login_attempts", val)}
                          />
                        </Col>

                        <Col xs={24} sm={12}>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Bloklash Davomiyligi (Account Lockout):
                          </label>
                          <InputNumber
                            min={1}
                            max={120}
                            addonAfter="daqiqa"
                            className="w-full"
                            value={getValue("account_lockout_duration_minutes", 15)}
                            onChange={(val) =>
                              handleDraftChange("account_lockout_duration_minutes", val)
                            }
                          />
                        </Col>

                        <Col xs={24} sm={12}>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Yuklash So'rovlari Cheklovi (Uploads/min):
                          </label>
                          <InputNumber
                            min={5}
                            max={100}
                            addonAfter="fayl/min"
                            className="w-full"
                            value={getValue("upload_rate_limit", 20)}
                            onChange={(val) => handleDraftChange("upload_rate_limit", val)}
                          />
                        </Col>
                      </Row>
                    </div>
                  </div>
                ),
              },

              // 13. Account Deletion
              {
                key: "account_deletion",
                label: (
                  <span className="flex items-center gap-2 font-medium">
                    <UserX className="w-4 h-4 text-orange-600" />
                    13. Account Deletion
                  </span>
                ),
                children: (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <Title level={5} style={{ margin: 0 }} className="text-slate-900">
                        Hisoblarni O'chirish Jarayoni (Account Deletion Policy)
                      </Title>
                      <Button
                        type="primary"
                        icon={<Save className="w-4 h-4" />}
                        className="!bg-blue-700 hover:!bg-blue-800 text-white font-semibold !rounded-lg text-xs shadow-xs"
                        loading={updateMutation.isPending}
                        onClick={() =>
                          handleSaveDraft(["deletion_grace_period_days"], "O'chirish Limitlari")
                        }
                      >
                        Kafolat Muddatini Saqlash
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {renderSettingRow({
                        icon: UserX,
                        name: "Akkauntni O'chirish Tizimi (Master Switch)",
                        keyName: "account_deletion_enabled",
                        desc: "Foydalanuvchilar yoki admin tomonidan hisobni o'chirish imkoniyati.",
                        isDanger: true,
                        control: (
                          <Switch
                            checked={getValue("account_deletion_enabled", true)}
                            onChange={() =>
                              handleToggle(
                                "account_deletion_enabled",
                                getValue("account_deletion_enabled", true),
                                "Hisobni O'chirish"
                              )
                            }
                          />
                        ),
                      })}

                      {renderSettingRow({
                        icon: Trash2,
                        name: "O'z-o'zini O'chirish (Self-service Deletion)",
                        keyName: "self_service_deletion_enabled",
                        desc: "Mobil ilova yoki sayt sozlamalaridan foydalanuvchi o'z akkauntini o'chirishga ariza bera olishi.",
                        disabled: !isDeletionActive,
                        control: (
                          <Switch
                            checked={getValue("self_service_deletion_enabled", true)}
                            disabled={!isDeletionActive}
                            onChange={() =>
                              handleToggle(
                                "self_service_deletion_enabled",
                                getValue("self_service_deletion_enabled", true),
                                "O'zini O'chirish"
                              )
                            }
                          />
                        ),
                      })}
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white">
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Tiklash Kafolat Muddati (Grace Period Days):
                      </label>
                      <InputNumber
                        min={0}
                        max={60}
                        addonAfter="kun"
                        className="w-full md:max-w-xs"
                        value={getValue("deletion_grace_period_days", 14)}
                        onChange={(val) => handleDraftChange("deletion_grace_period_days", val)}
                        disabled={!isDeletionActive}
                      />
                      <span className="text-[11px] text-slate-400 block mt-1">
                        Foydalanuvchi o'chirish arizasini topshirgach, qancha kun davomida hisob qayta tiklanishi mumkin (Standart: 14 kun).
                      </span>
                    </div>
                  </div>
                ),
              },

              // 14. Maintenance & Notice
              {
                key: "maintenance",
                label: (
                  <span className="flex items-center gap-2 font-medium">
                    <AlertOctagon className="w-4 h-4 text-red-600" />
                    14. Maintenance & Xabar
                  </span>
                ),
                children: (
                  <div className="space-y-6 pt-2">
                    {/* Maintenance Mode Card */}
                    <div className="enterprise-card p-4 border border-rose-200 bg-rose-50/20 space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b border-red-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-red-100 text-red-700">
                            <AlertOctagon className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm">
                              Texnik Ishlar Rejimi (Maintenance Mode)
                            </span>
                            <p className="text-xs text-slate-500">
                              Yoqilganda oddiy foydalanuvchilarga to'xtash ekrani chiqadi, adminlar esa bemalol
                              kira oladi.
                            </p>
                          </div>
                        </div>

                        <Switch
                          checked={isMaintenance}
                          onChange={() =>
                            handleToggle("maintenance_mode", isMaintenance, "Texnik Ishlar Rejimi")
                          }
                        />
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            To'xtash Ekrani Sarlavhasi:
                          </label>
                          <Input
                            value={getValue(
                              "maintenance_title",
                              "Texnik profilaktika ishlari olib borilmoqda"
                            )}
                            onChange={(e) => handleDraftChange("maintenance_title", e.target.value)}
                            className="rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Foydalanuvchilarga Ko'rsatiladigan Xabar:
                          </label>
                          <TextArea
                            rows={3}
                            value={getValue("maintenance_message", "")}
                            onChange={(e) => handleDraftChange("maintenance_message", e.target.value)}
                            className="rounded-lg"
                          />
                        </div>

                        <div className="flex justify-end pt-2">
                          <Button
                            type="primary"
                            danger
                            icon={<Save className="w-4 h-4" />}
                            loading={updateMutation.isPending}
                            onClick={() =>
                              handleSaveDraft(
                                ["maintenance_title", "maintenance_message"],
                                "Texnik Rejim Matnlari"
                              )
                            }
                          >
                            Xabarni Yangilash
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Site Notice Card */}
                    <div className="enterprise-card p-4 space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                            <Info className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm">
                              Umumiy Sayt Baner Ogohlantirishi (Site Notice)
                            </span>
                            <p className="text-xs text-slate-500">
                              Sayt va ilova tepasida chiqib turuvchi e'lon satri
                            </p>
                          </div>
                        </div>

                        <Switch
                          checked={Boolean(getValue("site_notice", {})?.enabled)}
                          onChange={(checked) => {
                            const current = getValue("site_notice", {});
                            updateMutation.mutate({
                              payload: { site_notice: { ...current, enabled: checked } },
                              reason: `Sayt ogohlantirish baneri ${checked ? "YOQILDI" : "O'CHIRILDI"}`,
                            });
                          }}
                        />
                      </div>

                      <div className="space-y-3">
                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={12}>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">
                              Xabarnoma Turi:
                            </label>
                            <Select
                              value={getValue("site_notice", {})?.type || "info"}
                              onChange={(val) => {
                                const current = getValue("site_notice", {});
                                updateMutation.mutate({
                                  payload: { site_notice: { ...current, type: val } },
                                  reason: `Sayt baneri turi '${val}' qilindi`,
                                });
                              }}
                              className="w-full"
                              options={[
                                { value: "info", label: "Ma'lumot (Moviy/Info)" },
                                { value: "warning", label: "Ogohlantirish (Sariq/Warning)" },
                                { value: "critical", label: "Muhim/Xavf (Qizil/Critical)" },
                                { value: "success", label: "Muvaffaqiyat (Yashil/Success)" },
                              ]}
                            />
                          </Col>

                          <Col xs={24} sm={12}>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">
                              Target Platforma:
                            </label>
                            <Select
                              value={getValue("site_notice", {})?.target || "all"}
                              onChange={(val) => {
                                const current = getValue("site_notice", {});
                                updateMutation.mutate({
                                  payload: { site_notice: { ...current, target: val } },
                                  reason: `Sayt baneri targeti '${val}' qilindi`,
                                });
                              }}
                              className="w-full"
                              options={[
                                { value: "all", label: "Barchasi (Web + Mobile)" },
                                { value: "web", label: "Faqat Veb-sayt" },
                                { value: "mobile", label: "Faqat Mobil Ilova" },
                              ]}
                            />
                          </Col>
                        </Row>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Xabar Matni:
                          </label>
                          <Input
                            value={getValue("site_notice", {})?.text || ""}
                            onChange={(e) => {
                              const current = getValue("site_notice", {});
                              handleDraftChange("site_notice", { ...current, text: e.target.value });
                            }}
                            className="rounded-lg"
                            placeholder="Masalan: Ertaga soat 02:00 dan 04:00 gacha serverda rejaviy profilaktika bo'ladi..."
                          />
                        </div>

                        <div className="flex justify-end pt-2">
                          <Button
                            type="primary"
                            className="!bg-blue-700 hover:!bg-blue-800 text-white font-semibold !rounded-lg text-xs shadow-xs"
                            icon={<Save className="w-4 h-4" />}
                            loading={updateMutation.isPending}
                            onClick={() => {
                              const current = getValue("site_notice", {});
                              updateMutation.mutate({
                                payload: { site_notice: current },
                                reason: "Sayt ogohlantirish matni saqlandi",
                              });
                            }}
                          >
                            Banerni Saqlash
                          </Button>
      

                    {/* App Version & In-App Update Control Card */}
                    <div className="enterprise-card p-4 space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                            <Smartphone className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm">
                              Mobil Ilova Yangilanish Boshqaruvi (Android & iOS)
                            </span>
                            <p className="text-xs text-slate-500">
                              Play Market / App Store yangilanishi va foydalanuvchilar ekranida chiqadigan xabarnoma
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-600 font-medium">Majburiy yangilash:</span>
                          <Switch
                            checked={Boolean(getValue("app_version", {})?.android?.force_update)}
                            onChange={(checked) => {
                              const current = getValue("app_version", {
                                android: {
                                  latest_version_code: 22,
                                  latest_version: "1.0.21",
                                  min_version_code: 20,
                                  force_update: false,
                                  message: "Kelishamiz mobil ilovasida tezlik oshirildi, xatoliklar tuzatildi va yangi imkoniyatlar qo'shildi. Eng so'nggi versiyaga yangilang!",
                                  store_url: "https://play.google.com/store/apps/details?id=uz.kelishamizgroup.kelishamiz",
                                },
                              });
                              updateMutation.mutate({
                                payload: {
                                  app_version: {
                                    ...current,
                                    android: {
                                      ...(current?.android || {}),
                                      force_update: checked,
                                    },
                                  },
                                },
                                reason: `Mobil ilovani majburiy yangilash ${checked ? "YOQILDI" : "O'CHIRILDI"}`,
                              });
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={8}>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">
                              Eng So'nggi Version Code:
                            </label>
                            <InputNumber
                              min={1}
                              className="w-full"
                              value={getValue("app_version", {})?.android?.latest_version_code ?? 22}
                              onChange={(val) => {
                                const current = getValue("app_version", {});
                                handleDraftChange("app_version", {
                                  ...current,
                                  android: {
                                    ...(current?.android || {}),
                                    latest_version_code: Number(val) || 1,
                                  },
                                });
                              }}
                            />
                            <span className="text-[11px] text-slate-400 block mt-1">
                              Play Store'dagi eng so'nggi versionCode (masalan: 22)
                            </span>
                          </Col>

                          <Col xs={24} sm={8}>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">
                              Eng So'nggi Versiya Nomi:
                            </label>
                            <Input
                              value={getValue("app_version", {})?.android?.latest_version || "1.0.21"}
                              onChange={(e) => {
                                const current = getValue("app_version", {});
                                handleDraftChange("app_version", {
                                  ...current,
                                  android: {
                                    ...(current?.android || {}),
                                    latest_version: e.target.value,
                                  },
                                });
                              }}
                              className="rounded-lg"
                              placeholder="1.0.21"
                            />
                            <span className="text-[11px] text-slate-400 block mt-1">
                              Foydalanuvchiga ko'rinadigan versiya nomi
                            </span>
                          </Col>

                          <Col xs={24} sm={8}>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">
                              Minimal Ruxsat Versiya Code:
                            </label>
                            <InputNumber
                              min={1}
                              className="w-full"
                              value={getValue("app_version", {})?.android?.min_version_code ?? 20}
                              onChange={(val) => {
                                const current = getValue("app_version", {});
                                handleDraftChange("app_version", {
                                  ...current,
                                  android: {
                                    ...(current?.android || {}),
                                    min_version_code: Number(val) || 1,
                                  },
                                });
                              }}
                            />
                            <span className="text-[11px] text-slate-400 block mt-1">
                              Bundan eski versiyalar majburiy yangilanadi
                            </span>
                          </Col>
                        </Row>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Yangilanish Xabari (Foydalanuvchi ko'radigan matn):
                          </label>
                          <TextArea
                            rows={2}
                            value={
                              getValue("app_version", {})?.android?.message ||
                              "Kelishamiz mobil ilovasida tezlik oshirildi, xatoliklar tuzatildi va yangi imkoniyatlar qo'shildi. Eng so'nggi versiyaga yangilang!"
                            }
                            onChange={(e) => {
                              const current = getValue("app_version", {});
                              handleDraftChange("app_version", {
                                ...current,
                                android: {
                                  ...(current?.android || {}),
                                  message: e.target.value,
                                },
                              });
                            }}
                            className="rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Google Play Store Havolasi:
                          </label>
                          <Input
                            value={
                              getValue("app_version", {})?.android?.store_url ||
                              "https://play.google.com/store/apps/details?id=uz.kelishamizgroup.kelishamiz"
                            }
                            onChange={(e) => {
                              const current = getValue("app_version", {});
                              handleDraftChange("app_version", {
                                ...current,
                                android: {
                                  ...(current?.android || {}),
                                  store_url: e.target.value,
                                },
                              });
                            }}
                            className="rounded-lg"
                          />
                        </div>

                        <div className="flex justify-end pt-2">
                          <Button
                            type="primary"
                            className="!bg-blue-700 hover:!bg-blue-800 text-white font-semibold !rounded-lg text-xs shadow-xs"
                            icon={<Save className="w-4 h-4" />}
                            loading={updateMutation.isPending}
                            onClick={() => {
                              const current = getValue("app_version", {
                                android: {
                                  latest_version_code: 22,
                                  latest_version: "1.0.21",
                                  min_version_code: 20,
                                  force_update: false,
                                  message: "Kelishamiz mobil ilovasida tezlik oshirildi, xatoliklar tuzatildi va yangi imkoniyatlar qo'shildi. Eng so'nggi versiyaga yangilang!",
                                  store_url: "https://play.google.com/store/apps/details?id=uz.kelishamizgroup.kelishamiz",
                                },
                              });
                              updateMutation.mutate({
                                payload: { app_version: current },
                                reason: "Mobil ilova yangilanish sozlamalari yangilandi",
                              });
                            }}
                          >
                            Ilova Yangilanishini Saqlash
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                      </div>
                    </div>
                  </div>
                ),
              },

              // 15. Configuration Audit Logs
              {
                key: "audit",
                label: (
                  <span className="flex items-center gap-2 font-medium">
                    <History className="w-4 h-4 text-slate-600" />
                    15. Audit Tarixi
                  </span>
                ),
                children: (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Title level={5} style={{ margin: 0 }} className="text-slate-900">
                          Sozlamalar O'zgarishlari Tarixi (Audit Log)
                        </Title>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Kim, qachon, qaysi parametrni o'zgartirganligi va kiritilgan sababi
                        </p>
                      </div>
                      <Button
                        icon={<RefreshCw className={`w-3.5 h-3.5 ${isAuditLoading ? "animate-spin" : ""}`} />}
                        onClick={() => refetchAudit()}
                        size="small"
                      >
                        Tarixni Yangilash
                      </Button>
                    </div>

                    <Table
                      size="small"
                      dataSource={auditLogs}
                      rowKey="id"
                      loading={isAuditLoading}
                      scroll={{ x: 800 }}
                      pagination={{
                        pageSize: 10,
                        size: "small",
                        showTotal: (total) => `Jami: ${total} ta audit qaydi`,
                      }}
                      className="border border-slate-200 rounded-xl overflow-hidden"
                      columns={[
                        {
                          title: "Versiya / ID",
                          dataIndex: "targetId",
                          key: "targetId",
                          width: 100,
                          render: (text) => (
                            <Tag color="purple" className="font-mono font-semibold">
                              {text || "#"}
                            </Tag>
                          ),
                        },
                        {
                          title: "Admin",
                          key: "admin",
                          render: (_, row) => (
                            <div>
                              <span className="font-semibold text-slate-800 text-xs block">
                                {row.admin?.email || row.details?.adminEmail || "Admin"}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                IP: {row.ipAddress || "Internal"}
                              </span>
                            </div>
                          ),
                        },
                        {
                          title: "O'zgarish Sababi (Reason)",
                          key: "reason",
                          render: (_, row) => (
                            <span className="text-xs text-slate-700 font-medium">
                              {row.details?.reason || row.action}
                            </span>
                          ),
                        },
                        {
                          title: "O'zgargan Parametrlar",
                          key: "changes",
                          render: (_, row) => {
                            const changes = row.details?.changes || {};
                            const keys = Object.keys(changes);
                            if (keys.length === 0) return <span className="text-slate-400">-</span>;
                            return (
                              <div className="flex flex-wrap gap-1">
                                {keys.map((k) => (
                                  <Tag key={k} className="text-[10px] font-mono">
                                    {k}: {String(changes[k]?.old)} ➔ {String(changes[k]?.new)}
                                  </Tag>
                                ))}
                              </div>
                            );
                          },
                        },
                        {
                          title: "Vaqt",
                          dataIndex: "createdAt",
                          key: "createdAt",
                          width: 150,
                          render: (date) => (
                            <span className="text-xs text-slate-500 font-mono">
                              {dayjs(date).format("DD.MM.YYYY, HH:mm")}
                            </span>
                          ),
                        },
                      ]}
                    />
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>

      {/* 3. DANGEROUS CONFIRMATION MODAL */}
      <Modal
        title={
          <div className="flex items-center gap-2.5 text-red-600">
            <AlertOctagon className="w-5 h-5" />
            <span className="font-bold">Diqqat: Ushbu o'zgarish foydalanuvchilarga bevosita ta'sir qiladi!</span>
          </div>
        }
        open={dangerousModal.isOpen}
        onCancel={() =>
          setDangerousModal({ isOpen: false, key: null, newValue: null, label: "", reason: "" })
        }
        footer={[
          <Button
            key="cancel"
            onClick={() =>
              setDangerousModal({ isOpen: false, key: null, newValue: null, label: "", reason: "" })
            }
          >
            Bekor Qilish
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            loading={updateMutation.isPending}
            onClick={confirmDangerousChange}
          >
            O'zgarishni Tasdiqlash
          </Button>,
        ]}
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-600">
            Siz <strong>{dangerousModal.label}</strong> sozlamasini{" "}
            <Tag color={dangerousModal.newValue ? "success" : "error"}>
              {dangerousModal.newValue ? "YOQISH" : "O'CHIRISH"}
            </Tag>{" "}
            holatiga o'tkazmoqchisiz. Bu tizim mijozlariga real vaqt rejimida ta'sir qiladi.
          </p>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              O'zgartirish sababi (Audit Log uchun majburiy):
            </label>
            <TextArea
              rows={3}
              placeholder="Masalan: Server profilaktikasi, spam xurujini to'xtatish yoki rejaviy ishlar..."
              value={dangerousModal.reason}
              onChange={(e) =>
                setDangerousModal((prev) => ({ ...prev, reason: e.target.value }))
              }
              className="rounded-xl"
            />
          </div>
        </div>
      </Modal>

      {/* 4. RESET CONFIRMATION MODAL */}
      <Modal
        title="Standart Holatga Qaytarish"
        open={resetModal.isOpen}
        onCancel={() => setResetModal({ isOpen: false, key: null, label: "" })}
        onOk={handleConfirmReset}
        okText="Ha, Qaytarilsin"
        cancelText="Yo'q"
        confirmLoading={resetMutation.isPending}
      >
        <p className="text-sm text-slate-600 py-2">
          Haqiqatan ham <strong>{resetModal.label}</strong> sozlamasini zavod standart (default)
          qiymatiga qaytarmoqchimisiz?
        </p>
      </Modal>
    </div>
  );
}
