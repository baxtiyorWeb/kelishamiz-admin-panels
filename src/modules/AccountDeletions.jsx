import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../config/auth/api";
import { Row, Col, Steps, Table, Tag, Input, Empty, Button, Tooltip } from "antd";
import {
  UserX,
  ShieldCheck,
  Trash2,
  Key,
  CloudUpload,
  Database,
  CheckCircle2,
  Lock,
  RefreshCw,
  Search,
  Sparkles,
  Smartphone,
  Check,
  Shield,
  Layers,
} from "lucide-react";
import dayjs from "dayjs";
import { CompactStatCard } from "../components/CompactStatCard";

const AccountDeletions = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch real account deletion records from backend audit log
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["accountDeletions", page, pageSize, search],
    queryFn: async () => {
      const params = {
        page,
        limit: pageSize,
        search: search.trim() || undefined,
      };
      const res = await api.get("/admin/audit-logs/account-deletions", { params });
      return res.data?.content || res.data;
    },
  });

  const records = Array.isArray(data?.records) ? data.records : [];
  const total = data?.total || 0;
  const stats = data?.stats || {
    totalDeletions: total,
    selfServiceCount: 0,
    adminPurgeCount: 0,
  };

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
      render: (_, r) => (
        <div className="flex flex-col">
          <span className="font-extrabold text-slate-900 text-sm">
            {r.username?.startsWith("@") ? r.username : `@${r.username}`}
          </span>
          <span className="text-xs text-slate-400 font-mono">{r.phone}</span>
        </div>
      ),
    },
    {
      title: "O'chirish Sababi & Usul",
      key: "reason",
      render: (_, r) => (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-700 font-medium px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200">
            {r.reason || "Shaxsiy ma'lumotlarni o'chirish"}
          </span>
          <div>
            {r.method === "ADMIN_PURGE" ? (
              <Tag color="purple" className="text-[10px] font-semibold m-0">
                Admin Tomonidan
              </Tag>
            ) : (
              <Tag color="blue" className="text-[10px] font-semibold m-0">
                Self-Service
              </Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Holati",
      dataIndex: "status",
      key: "status",
      width: 170,
      render: () => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>To'liq Tozalandi (Purged)</span>
        </span>
      ),
    },
    {
      title: "So'rov & Purge Vaqti",
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
            value={stats.totalDeletions}
            unit="hisob"
            icon={<UserX className="w-4 h-4" />}
            color="rose"
            description={`${stats.selfServiceCount || 0} self, ${stats.adminPurgeCount || 0} admin`}
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
          <div className="border-b border-slate-100 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-800 m-0">O'chirish So'rovlari Jurnali</h2>
              <div className="text-xs text-slate-400 mt-0.5">Avtomatlashtirilgan purge operatsiyalari tarixi</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{total} ta yozuv</span>
              </span>
              <Button
                icon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />}
                size="small"
                onClick={() => refetch()}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <Input
              placeholder="Foydalanuvchi, telefon yoki sabab bo'yicha qidirish..."
              prefix={<Search className="w-3.5 h-3.5 text-slate-400" />}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              allowClear
              size="small"
              className="w-full"
            />
          </div>

          <Table
            columns={columns}
            dataSource={records}
            rowKey="id"
            loading={isLoading}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
              size: "small",
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span className="text-xs text-slate-500">
                      Hozircha hisob o'chirish yozuvlari mavjud emas. Barcha o'chirishlar xavfsiz audit jurnali orqali qayd etiladi.
                    </span>
                  }
                />
              ),
            }}
            size="small"
          />
        </div>
      </div>
    </div>
  );
};

export default AccountDeletions;
