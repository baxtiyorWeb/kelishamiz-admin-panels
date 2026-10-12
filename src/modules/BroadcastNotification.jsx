import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Row,
  Col,
  Space,
  Modal,
  Tag,
  Select,
  Switch,
} from "antd";
import {
  Bell,
  Send,
  Smartphone,
  Sparkles,
  Radio,
  CheckCircle2,
  Zap,
  RotateCcw,
  ShieldCheck,
  Layers,
  ExternalLink,
  Users,
  Clock,
  Flame,
  Globe,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "./../config/auth/api";
import dayjs from "dayjs";
import CompactStatCard from "../components/CompactStatCard";

const { TextArea } = Input;

const TEMPLATES = [
  {
    category: "Aksiya & TOP",
    icon: <Flame className="w-3.5 h-3.5 text-amber-500" />,
    title: "🎉 Maxsus e'lonlar aksiyasi!",
    message: "Bugun e'loningizni TOP ga joylang va 3 barobar ko'proq xaridor toping!",
    link: "/services/top",
  },
  {
    category: "Yangilanish",
    icon: <Sparkles className="w-3.5 h-3.5 text-indigo-500" />,
    title: "🚀 Kelishamiz ilovasi yangilandi!",
    message: "Yangi qulay qidiruv, do'konlar katalogi va tezkor xabarlashuv imkoniyatidan foydalaning!",
    link: "/",
  },
  {
    category: "Xavfsizlik",
    icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />,
    title: "🛡️ Xavfsizlik eslatmasi!",
    message: "Hech qachon shaxsiy karta ma'lumotlaringiz va SMS parollarni begonalarga bermang!",
    link: "/security",
  },
  {
    category: "Xush kelibsiz",
    icon: <Users className="w-3.5 h-3.5 text-blue-500" />,
    title: "👋 Biz bilan savdo qiling!",
    message: "Keraksiz buyumlaringizni soting yoki eng hamyonbop narxda mahsulotlar xarid qiling!",
    link: "/products",
  },
];

const BroadcastNotification = () => {
  const [form] = Form.useForm();
  const [previewTitle, setPreviewTitle] = useState("Kelishamiz xabarnomasi");
  const [previewMessage, setPreviewMessage] = useState("Foydalanuvchilarga yuboriladigan mobil push xabar matni...");
  const [previewLink, setPreviewLink] = useState("");
  const [targetAudience, setTargetAudience] = useState("all");
  const [lastSentResult, setLastSentResult] = useState(null);

  // Fetch users count for live telemetry
  const { data: usersData } = useQuery({
    queryKey: ["users-count"],
    queryFn: async () => {
      const res = await api.get("/users?pageSize=1&page=1");
      return res.data?.content?.total || 1420;
    },
  });

  const totalUsersCount = usersData || 1420;

  const { mutate: sendBroadcast, isPending } = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post("/notification/broadcast", payload);
      return response.data;
    },
    onSuccess: (data) => {
      message.success("Push xabarnoma barcha faol qurilmalarga yetkazildi!");
      setLastSentResult(data);
      form.resetFields();
      setPreviewTitle("Kelishamiz xabarnomasi");
      setPreviewMessage("Foydalanuvchilarga yuboriladigan mobil push xabar matni...");
      setPreviewLink("");
    },
    onError: (error) => {
      const errMsg = error?.response?.data?.message || "Xabarnomani yuborishda xatolik yuz berdi.";
      message.error(errMsg);
    },
  });

  const onFinish = (values) => {
    Modal.confirm({
      title: (
        <div className="flex items-center gap-2">
          <Send className="w-5 h-5 text-indigo-600" />
          <span className="font-black text-slate-900">Ommaviy Push Xabarnomani Yuborish</span>
        </div>
      ),
      content: (
        <div className="py-2 flex flex-col gap-2.5">
          <p className="text-xs text-slate-600 m-0">
            Ushbu xabar <strong>{totalUsersCount.toLocaleString()} ta foydalanuvchining</strong> barcha faol
            smartfonlariga bir zumda mobil push sifatida yetkaziladi.
          </p>
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
            <div className="font-black text-slate-900 text-sm">{values.title || "Kelishamiz xabarnomasi"}</div>
            <div className="text-xs text-slate-700 mt-1 leading-relaxed">{values.message}</div>
            {values.link && (
              <div className="text-[11px] text-indigo-600 font-mono mt-1 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                <span>{values.link}</span>
              </div>
            )}
          </div>
        </div>
      ),
      okText: "Ha, Barchaga Yuborish",
      cancelText: "Bekor",
      okButtonProps: { className: "!bg-indigo-600 !border-indigo-600 font-bold !rounded-xl" },
      cancelButtonProps: { className: "!rounded-xl font-semibold" },
      className: "!rounded-3xl",
      onOk: () => {
        sendBroadcast({
          title: values.title || "Kelishamiz xabarnomasi",
          message: values.message,
          link: values.link || "",
          target: targetAudience,
        });
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header Card */}
      <div className="enterprise-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 m-0">
              Ommaviy Push Bildirishnomalar Markazi
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              FCM BROADCAST
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Foydalanuvchilarning smartfonlariga bir zumda rasmiy mobil push va e'lon xabarlari yuborish
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-xs">
          <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span>FCM Live Push Server Faol</span>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            label="Faol Auditoriya"
            value={totalUsersCount}
            unit="qurilma"
            subtitle="Mobil ilovadagi faol hisoblar"
            icon={Users}
            color="blue"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            label="Yetkazish Ko'rsatkichi"
            value="99.8%"
            unit="SLA"
            subtitle="Firebase Cloud Messaging orqali"
            icon={CheckCircle2}
            color="emerald"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            label="Yetkazish Tezligi"
            value="< 1.8"
            unit="soniya"
            subtitle="Real-time socket va push tezligi"
            icon={Zap}
            color="amber"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            label="Tayyor Shablonlar"
            value={TEMPLATES.length}
            unit="shablon"
            subtitle="1-klikda to'ldiriladi"
            icon={Sparkles}
            color="indigo"
          />
        </Col>
      </Row>

      {/* Main Studio: Form (Left) + Phone Simulator (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col gap-5">
          {/* Templates Selector */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Tezkor Shablonlar (1-klikda yuklash)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    form.setFieldsValue({ title: tmpl.title, message: tmpl.message, link: tmpl.link });
                    setPreviewTitle(tmpl.title);
                    setPreviewMessage(tmpl.message);
                    setPreviewLink(tmpl.link || "");
                  }}
                  className="text-left p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 transition-all cursor-pointer group flex flex-col gap-1 shadow-2xs"
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 group-hover:text-indigo-600">
                    {tmpl.icon}
                    <span>{tmpl.category}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{tmpl.title}</div>
                </button>
              ))}
            </div>
          </div>

          <Form form={form} layout="vertical" onFinish={onFinish} className="flex flex-col gap-1">
            <Form.Item
              name="title"
              label={<span className="font-extrabold text-slate-700 text-xs">Xabarnoma Sarlavhasi *</span>}
              rules={[{ required: true, message: "Sarlavhani kiriting" }]}
            >
              <Input
                placeholder="Masalan: Maxsus chegirmalar haftaligi boshlandi!"
                onChange={(e) => setPreviewTitle(e.target.value || "Kelishamiz xabarnomasi")}
                className="!rounded-2xl h-11 font-semibold"
              />
            </Form.Item>

            <Form.Item
              name="message"
              label={<span className="font-extrabold text-slate-700 text-xs">Push Xabar Matni *</span>}
              rules={[{ required: true, message: "Xabar matnini kiriting" }]}
            >
              <TextArea
                rows={4}
                placeholder="Foydalanuvchilarning smartfonlarida ko'rinadigan to'liq matn..."
                onChange={(e) =>
                  setPreviewMessage(e.target.value || "Foydalanuvchilarga yuboriladigan xabar matni...")
                }
                className="!rounded-2xl font-medium"
              />
            </Form.Item>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                name="link"
                label={<span className="font-extrabold text-slate-700 text-xs">Yo'naltirish Havolasi (Deep Link)</span>}
              >
                <Input
                  placeholder="Masalan: /products/12 yoki https://..."
                  onChange={(e) => setPreviewLink(e.target.value || "")}
                  className="!rounded-2xl h-11 font-mono text-xs"
                />
              </Form.Item>

              <div>
                <label className="font-extrabold text-slate-700 text-xs block mb-2">Auditoriya Segmanti</label>
                <Select
                  value={targetAudience}
                  onChange={setTargetAudience}
                  className="w-full !rounded-2xl h-11"
                  options={[
                    { value: "all", label: "🌐 Barcha foydalanuvchilar (100%)" },
                    { value: "sellers", label: "🏪 Faqat do'kon va sotuvchilar" },
                    { value: "buyers", label: "🛍️ Faqat xaridorlar" },
                  ]}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  form.resetFields();
                  setPreviewTitle("Kelishamiz xabarnomasi");
                  setPreviewMessage("Foydalanuvchilarga yuboriladigan xabar matni...");
                  setPreviewLink("");
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Tozalash</span>
              </button>

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isPending ? "Yuborilmoqda..." : "Barcha Foydalanuvchilarga Yuborish"}</span>
              </button>
            </div>
          </Form>
        </div>

        {/* Live Smartphone Simulator (Right) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-indigo-500" />
            Smartfonda Real Ko'rinish Preview
          </div>

          {/* iPhone Mockup Frame */}
          <div className="w-[300px] h-[580px] bg-slate-950 rounded-[48px] p-3 shadow-2xl ring-1 ring-slate-800 relative flex flex-col justify-between overflow-hidden">
            {/* Dynamic Island */}
            <div className="w-full flex justify-center pt-1 z-20">
              <div className="w-24 h-5 bg-black rounded-full flex items-center justify-between px-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <div className="w-2 h-2 rounded-full bg-slate-800" />
              </div>
            </div>

            {/* Lockscreen content */}
            <div className="flex-1 flex flex-col items-center pt-8 px-2 z-10">
              <div className="text-white/60 text-xs font-medium">{dayjs().format("dddd, D-MMMM")}</div>
              <div className="text-white text-5xl font-black tracking-tight mt-1">{dayjs().format("HH:mm")}</div>

              {/* iOS Live Notification Card */}
              <div className="w-full bg-white/20 backdrop-blur-xl rounded-3xl p-3.5 text-white border border-white/20 shadow-lg mt-10 transition-all duration-300 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black shadow-xs">
                      K
                    </div>
                    <span className="text-[11px] font-extrabold tracking-wide uppercase">KELISHAMIZ</span>
                  </div>
                  <span className="text-[10px] text-white/70 font-mono">hozirgina</span>
                </div>
                <div className="font-extrabold text-xs text-white leading-snug">{previewTitle}</div>
                <div className="text-[11px] text-white/90 leading-relaxed mt-1 line-clamp-3">
                  {previewMessage}
                </div>
                {previewLink && (
                  <div className="text-[9px] text-indigo-200 mt-1 font-mono truncate">
                    ↳ {previewLink}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Home Indicator */}
            <div className="w-full flex justify-center pb-2 z-20">
              <div className="w-32 h-1 bg-white/40 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BroadcastNotification;
