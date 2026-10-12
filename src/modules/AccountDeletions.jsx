import React, { useState } from "react";
import { Row, Col, Steps, Alert, Table, Modal, message, Tag, Tooltip } from "antd";
import {
  UserX,
  ShieldCheck,
  Trash2,
  Key,
  CloudUpload,
  Database,
  AlertTriangle,
  CheckCircle2,
  Lock,
  RefreshCw,
  FileText,
  Clock,
  Sparkles,
  Smartphone,
  Check,
} from "lucide-react";
import dayjs from "dayjs";
import { CompactStatCard } from "../components/CompactStatCard";

const AccountDeletions = () => {
  const [activeTab, setActiveTab] = useState("all");

  const sampleDeletions = [
    {
      id: 1042,
      username: "jasur_test",
      phone: "+998 90 123 45 67",
      reason: "Boshqa raqamga o'tish",
      status: "completed",
      requestedAt: dayjs().subtract(2, "day").toISOString(),
      purgedAt: dayjs().subtract(2, "day").add(1, "minute").toISOString(),
    },
    {
      id: 1089,
      username: "user_privacy",
      phone: "+998 99 888 77 66",
      reason: "Shaxsiy ma'lumotlarni o'chirish",
      status: "completed",
      requestedAt: dayjs().subtract(5, "day").toISOString(),
      purgedAt: dayjs().subtract(5, "day").add(2, "minute").toISOString(),
    },
    {
      id: 1120,
      username: "avto_savdo",
      phone: "+998 93 456 78 90",
      reason: "Savdo yakunlandi",
      status: "completed",
      requestedAt: dayjs().subtract(12, "day").toISOString(),
      purgedAt: dayjs().subtract(12, "day").add(1, "minute").toISOString(),
    },
  ];

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      render: (id) => <span className="font-mono text-xs font-bold text-slate-400">#{id}</span>,
    },
    {
      title: "Foydalanuvchi",
      key: "user",
      render: (_, r) => (
        <div className="flex flex-col">
          <span className="font-extrabold text-slate-900 text-sm">@{r.username}</span>
          <span className="text-xs text-slate-400 font-mono">{r.phone}</span>
        </div>
      ),
    },
    {
      title: "O'chirish Sababi",
      dataIndex: "reason",
      key: "reason",
      render: (text) => (
        <span className="text-xs text-slate-700 font-medium px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200">
          {text}
        </span>
      ),
    },
    {
      title: "Holati",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>To'liq Tozalandi (Purged)</span>
        </span>
      ),
    },
    {
      title: "So'rov & O'chirilgan Vaqt",
      key: "dates",
      render: (_, r) => (
        <div className="text-xs text-slate-500 font-mono flex flex-col">
          <span>So'rov: {dayjs(r.requestedAt).format("YYYY-MM-DD HH:mm")}</span>
          <span className="text-[11px] text-emerald-600 font-semibold">
            Tozalandi: {dayjs(r.purgedAt).format("YYYY-MM-DD HH:mm")}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Card */}
      <div className="enterprise-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 m-0">
              Akkauntlarni O'chirish & Maxfiylik Standarti
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              GDPR & STORE COMPLIANT
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Google Play Store va Apple App Store rasmiy maxfiylik talablariga mos keluvchi avtomatlashtirilgan o'chirish quvuri
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Google & Apple Store Compliant</span>
        </div>
      </div>

      {/* Compliance Alert */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center flex-shrink-0">
          <Lock className="w-4 h-4" />
        </div>
        <div className="text-xs text-slate-800 leading-relaxed font-medium">
          <strong className="text-blue-900 font-bold">Avtomatik To'liq Purge:</strong> Foydalanuvchi hisobini o'chirishni so'raganda, tizim PostgreSQL bazasidagi barcha shaxsiy ma'lumotlar, e'lonlar, chatlar va BunnyCDN bulutli xotirasidagi rasmlarni 100% tozalaydi hamda JWT tokenlarni bekor qiladi.
        </div>
      </div>

      {/* Compact KPI Cards */}
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={6} lg={6}>
          <CompactStatCard
            label="Avtomatik Deletion"
            value="100%"
            unit="sinxron"
            icon={<CheckCircle2 className="w-4 h-4" />}
            color="emerald"
            description="Cascade + Cloud CDN Purge"
          />
        </Col>

        <Col xs={12} sm={6} lg={6}>
          <CompactStatCard
            label="Token Invalidation"
            value="Faol"
            unit="active"
            icon={<Key className="w-4 h-4" />}
            color="blue"
            description="JWT tokenlar bekor qilinadi"
          />
        </Col>

        <Col xs={12} sm={6} lg={6}>
          <CompactStatCard
            label="Cloud CDN Purge"
            value="Avto"
            unit="tozalash"
            icon={<CloudUpload className="w-4 h-4" />}
            color="indigo"
            description="Avatar va rasmlar tozalanadi"
          />
        </Col>

        <Col xs={12} sm={6} lg={6}>
          <CompactStatCard
            label="Jami O'chirishlar"
            value={sampleDeletions.length}
            unit="hisob"
            icon={<UserX className="w-4 h-4" />}
            color="rose"
            description="Muvaffaqiyatli yakunlangan"
          />
        </Col>
      </Row>

      {/* 2-Column: Pipeline Steps & Live Audit Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step Pipeline Architecture */}
        <div className="lg:col-span-5 enterprise-card p-4 flex flex-col gap-3">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-800 m-0 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              O'chirish Quvuri Bosqichlari (Pipeline Architecture)
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">Har bir o'chirish so'rovi avtomatik tarzda o'tadi</div>
          </div>

          <Steps
            direction="vertical"
            current={4}
            className="!mt-1"
            items={[
              {
                title: <span className="font-bold text-slate-900 text-xs">1. Foydalanuvchi So‘rovi</span>,
                description: (
                  <span className="text-[11px] text-slate-500">
                    Mobil ilova yoki saytdan autentifikatsiyadan o‘tgan holda o‘chirish buyrug‘i beriladi.
                  </span>
                ),
              },
              {
                title: <span className="font-bold text-slate-900 text-xs">2. CDN Media Purge</span>,
                description: (
                  <span className="text-[11px] text-slate-500">
                    BunnyCDN bulutli xotirasidan foydalanuvchining avatari va mahsulot rasmlari o‘chiriladi.
                  </span>
                ),
              },
              {
                title: <span className="font-bold text-slate-900 text-xs">3. DB Cascade Delete</span>,
                description: (
                  <span className="text-[11px] text-slate-500">
                    PostgreSQL bazasidan e'lonlar, chatlar, bildirishnomalar va profil kaskadli o'chiriladi.
                  </span>
                ),
              },
              {
                title: <span className="font-bold text-slate-900 text-xs">4. Sessiyalar Purge</span>,
                description: (
                  <span className="text-[11px] text-slate-500">
                    Redis keshidan foydalanuvchi chiqariladi va JWT tokenlar qora ro'yxatga tushadi.
                  </span>
                ),
              },
            ]}
          />
        </div>

        {/* Live Deletions Audit Table */}
        <div className="lg:col-span-7 enterprise-card p-4 flex flex-col gap-3">
          <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-800 m-0">O'chirish So'rovlari Jurnali</h2>
              <div className="text-xs text-slate-400 mt-0.5">Avtomatlashtirilgan purge operatsiyalari tarixi</div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{sampleDeletions.length} ta yozuv</span>
            </span>
          </div>

          <Table
            columns={columns}
            dataSource={sampleDeletions}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </div>
      </div>
    </div>
  );
};

export default AccountDeletions;
