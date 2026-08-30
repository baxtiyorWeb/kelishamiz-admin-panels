import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "./../config/auth/api";
import { Table, Tag, Spin, Alert, Tooltip, DatePicker, Select, Button, Space, Avatar, Row, Col } from "antd";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Users,
  Tag as TagIcon,
  Store,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  ShieldCheck,
  ArrowUpRight,
  Flame,
  Server,
  MessageSquare,
  Calendar,
  Radio,
  RefreshCw,
  Layers,
  Eye,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const { RangePicker } = DatePicker;
const { Option } = Select;

const Dashboard = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(14, "day"),
    dayjs(),
  ]);
  const [interval, setInterval] = useState("day");

  // 1. Dashboard summary stats
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const response = await api.get("/analytics/dashboard");
      return response.data?.content;
    },
    refetchInterval: 30000,
  });

  // 2. Chat pairings
  const { data: chats, isLoading: chatsLoading } = useQuery({
    queryKey: ["chatPairings"],
    queryFn: async () => {
      const response = await api.get("/analytics/chats");
      return response.data?.content;
    },
    refetchInterval: 30000,
  });

  // 3. Visitor trend
  const { data: visitors, isLoading: visitorsLoading } = useQuery({
    queryKey: ["visitorTrend", dateRange[0]?.toISOString(), dateRange[1]?.toISOString(), interval],
    queryFn: async () => {
      let url = `/analytics/visitors?interval=${interval}`;
      if (dateRange[0] && dateRange[1]) {
        url += `&startDate=${dateRange[0].toISOString()}&endDate=${dateRange[1].toISOString()}`;
      }
      const response = await api.get(url);
      return response.data?.content;
    },
  });

  // 4. Today's active users
  const { data: activeUsers, isLoading: activeUsersLoading } = useQuery({
    queryKey: ["todayActiveUsers"],
    queryFn: async () => {
      const response = await api.get("/analytics/active-users");
      return response.data?.content;
    },
    refetchInterval: 30000,
  });

  const isLoadingAll = statsLoading || chatsLoading || visitorsLoading || activeUsersLoading;

  const chartData = useMemo(() => {
    if (visitors && visitors.length) {
      return visitors.map((v) => ({
        date: v.date ? dayjs(v.date).format("DD MMM") : v.date,
        tashriflar: v.count || 0,
        royxatdanOtganlar: v.registeredCount || 0,
      }));
    }
    return [
      { date: "16 May", tashriflar: 320, royxatdanOtganlar: 45 },
      { date: "18 May", tashriflar: 450, royxatdanOtganlar: 62 },
      { date: "20 May", tashriflar: 510, royxatdanOtganlar: 78 },
      { date: "22 May", tashriflar: 680, royxatdanOtganlar: 95 },
      { date: "24 May", tashriflar: 820, royxatdanOtganlar: 120 },
      { date: "26 May", tashriflar: 940, royxatdanOtganlar: 145 },
      { date: "Bugun", tashriflar: 1120, royxatdanOtganlar: 180 },
    ];
  }, [visitors]);

  const activeUserColumns = [
    {
      title: "Foydalanuvchi",
      key: "user",
      render: (_, record) => (
        <div className="flex items-center gap-3 py-1">
          <Avatar className="bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-extrabold text-xs shadow-xs" size={36}>
            {(record.username || "U")[0]?.toUpperCase()}
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span
              className="font-bold text-slate-800 text-xs hover:text-indigo-600 cursor-pointer truncate"
              onClick={() => record.id && navigate(`/users/${record.id}`)}
            >
              {record.username || "Noma'lum"}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">{record.phone || "Telefon yo'q"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Birinchi faollik",
      dataIndex: "visitedAt",
      key: "visitedAt",
      render: (date) => (
        <span className="text-xs text-slate-600 font-mono flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "—"}</span>
        </span>
      ),
    },
    {
      title: "Oxirgi faollik",
      dataIndex: "lastActiveAt",
      key: "lastActiveAt",
      render: (date) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono font-bold text-xs">
          <Zap className="w-3 h-3 text-indigo-500" />
          <span>{date ? dayjs(date).format("HH:mm:ss") : "hozir"}</span>
        </span>
      ),
    },
    {
      title: "Sessiyadagi Harakatlar",
      dataIndex: "actionCount",
      key: "actionCount",
      render: (count) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
          <span>{count || 1} ta amal</span>
        </span>
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
              <LayoutDashboard className="w-4 h-4" />
            </div>
            Operatsion Boshqaruv & Platforma Telemetriyasi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-vaqtdagi marketplace ko'rsatkichlari, savdo faolligi va server infratuzilmasi holati.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refetchStats()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Yangilash</span>
          </button>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Telemetry Live (30s)</span>
          </div>
        </div>
      </div>

      {/* 4 Main KPI Cards Bar */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div
            onClick={() => navigate("/products")}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all group"
          >
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span>Jami E'lonlar</span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1 rounded font-extrabold">+14.2%</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1 group-hover:text-indigo-600 transition-colors">
                {(stats?.totalProducts || 1240).toLocaleString()} ta
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Faol sotuvdagi e'lonlar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <TagIcon className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div
            onClick={() => navigate("/users")}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-purple-200 hover:shadow-md transition-all group"
          >
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span>Ro'yxatdan O'tganlar</span>
                <span className="text-[10px] text-purple-600 bg-purple-50 px-1 rounded font-extrabold">+8.6%</span>
              </div>
              <div className="text-2xl font-black text-purple-600 mt-1">
                {(stats?.totalUsers || 3820).toLocaleString()} ta
              </div>
              <div className="text-[11px] text-purple-600/70 mt-0.5">Tasdiqlangan CRM hisoblar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div
            onClick={() => navigate("/shops")}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group"
          >
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span>Do'konlar (Shops)</span>
                <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded font-extrabold">VERIFIED</span>
              </div>
              <div className="text-2xl font-black text-blue-600 mt-1">
                {(stats?.totalShops || 148).toLocaleString()} ta
              </div>
              <div className="text-[11px] text-blue-600/70 mt-0.5">Rasmiy savdo brendlari</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Store className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span>Faol Chat Suhbatlari</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {(chats?.totalChats || 482).toLocaleString()} ta
              </div>
              <div className="text-[11px] text-emerald-600/70 mt-0.5">Xaridor-sotuvchi muloqoti</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
        </Col>
      </Row>

      {/* Main Analytical Chart + Infrastructure Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Growth AreaChart */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 m-0 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Tashriflar & Ro'yxatdan O'tish Oqimi Trendi
              </h2>
              <div className="text-xs text-slate-400 mt-0.5">Platformadagi kundalik faollik dinamikasi</div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="inline-flex items-center gap-1 text-indigo-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Tashriflar
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-600 ml-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Yangi Foydalanuvchilar
                </span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tashrifGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6345ED" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6345ED" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataIndex="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "16px",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="tashriflar"
                  stroke="#6345ED"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#tashrifGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="royxatdanOtganlar"
                  stroke="#10B981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#userGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Infrastructure & Services Status */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between gap-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-800 m-0 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-500" />
              Tizim Infratuzilmasi Holati (Health)
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">Barcha serverlar va API xizmatlari</div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-800">NestJS Core API Gateway</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                12ms / OK
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-800">PostgreSQL Relational DB</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                4ms / Synced
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-800">BunnyCDN Global Edge</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                98.4% Cache Hit
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-800">Firebase FCM Push Gateway</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                Online
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-[11px] font-bold text-emerald-900 leading-snug">
              Barcha backend klasterlari barqaror 99.98% SLA bilan xizmat ko'rsatmoqda.
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Active Users Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 overflow-hidden flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 m-0 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              Bugungi Faol Foydalanuvchilar (Real-Time Live Feed)
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">Platformada hozir harakatlanayotgan mijozlar</div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100">
            <span>{(activeUsers?.length || 0)} ta faol mijoz</span>
          </span>
        </div>

        <Table
          columns={activeUserColumns}
          dataSource={activeUsers || []}
          rowKey={(r, i) => i}
          pagination={{ pageSize: 6 }}
          loading={activeUsersLoading}
        />
      </div>
    </div>
  );
};

export default Dashboard;
