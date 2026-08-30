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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 m-0 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
            Akkauntlarni O'chirish & Maxfiylik Standarti (Account Deletions)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Google Play Store va Apple App Store rasmiy maxfiylik talablariga mos keluvchi avtomatlashtirilgan o'chirish quvuri.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Google & Apple Store Compliant</span>
        </div>
      </div>

      {/* Compliance Alert */}
      <div className="p-4 rounded-3xl bg-indigo-50/80 border border-indigo-100 flex items-center gap-3.5 shadow-2xs">
        <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <Lock className="w-5 h-5" />
        </div>
        <div className="text-xs text-indigo-950 leading-relaxed font-medium">
          <strong>Avtomatik To'liq Purge:</strong> Foydalanuvchi hisobini o'chirishni so'raganda, tizim PostgreSQL bazasidagi barcha shaxsiy ma'lumotlar, e'lonlar, chatlar va BunnyCDN bulutli xotirasidagi rasmlarni 100% tozalaydi hamda JWT tokenlarni bekor qiladi.
        </div>
      </div>

      {/* KPI Cards Bar */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avtomatik Deletion</div>
              <div className="text-2xl font-black text-emerald-600 mt-1 flex items-center gap-1.5">
                100% Sinxron
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Cascade + Cloud CDN Purge</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1">
                Token Invalidation
              </div>
              <div className="text-2xl font-black text-indigo-600 mt-1">Faol (Active)</div>
              <div className="text-[11px] text-indigo-600/70 mt-0.5">JWT tokenlar darhol bekor qilinadi</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Key className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-purple-500 uppercase tracking-wider flex items-center gap-1">
                Cloud CDN Purge
              </div>
              <div className="text-2xl font-black text-purple-600 mt-1">Avtomatik</div>
              <div className="text-[11px] text-purple-600/70 mt-0.5">Avatar va mahsulot rasmlari tozalanadi</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CloudUpload className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                Jami O'chirishlar
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">3 ta</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Muvaffaqiyatli yakunlangan</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <UserX className="w-6 h-6" />
            </div>
          </div>
        </Col>
      </Row>

      {/* 2-Column: Pipeline Steps & Live Audit Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step Pipeline Architecture */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-800 m-0 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              O'chirish Quvuri Bosqichlari (Pipeline Architecture)
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">Har bir o'chirish so'rovi avtomatik tarzda o'tadi</div>
          </div>

          <Steps
            direction="vertical"
            current={4}
            className="!mt-2"
            items={[
              {
                title: <span className="font-extrabold text-slate-900 text-xs">1. Foydalanuvchi So‘rovi</span>,
                description: (
                  <span className="text-[11px] text-slate-500">
                    Mobil ilova yoki saytdan autentifikatsiyadan o‘tgan holda o‘chirish buyrug‘i beriladi.
                  </span>
                ),
              },
              {
                title: <span className="font-extrabold text-slate-900 text-xs">2. CDN Media Purge</span>,
                description: (
                  <span className="text-[11px] text-slate-500">
                    BunnyCDN bulutli xotirasidan foydalanuvchining avatari va mahsulot rasmlari o‘chiriladi.
                  </span>
                ),
              },
              {
                title: <span className="font-extrabold text-slate-900 text-xs">3. DB Cascade Delete</span>,
                description: (
                  <span className="text-[11px] text-slate-500">
                    PostgreSQL bazasidan e'lonlar, chatlar, bildirishnomalar va profil kaskadli o'chiriladi.
                  </span>
                ),
              },
              {
                title: <span className="font-extrabold text-slate-900 text-xs">4. Sessiyalar Purge</span>,
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
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 m-0">O'chirish So'rovlari Jurnali</h2>
              <div className="text-xs text-slate-400 mt-0.5">Avtomatlashtirilgan purge operatsiyalari tarixi</div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>3 ta yozuv</span>
            </span>
          </div>

          <Table
            columns={columns}
            dataSource={sampleDeletions}
            rowKey="id"
            pagination={false}
            size="middle"
          />
        </div>
      </div>
    </div>
  );
};

export default AccountDeletions;
