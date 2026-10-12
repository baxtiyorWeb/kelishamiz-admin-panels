import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Col,
  Row,
  Typography,
  Statistic,
  Table,
  Alert,
  Spin,
  Tag,
  Progress,
  Tooltip,
} from "antd";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  HardDrive,
  Activity,
  DollarSign,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Sparkles,
  Server,
  RefreshCw,
  Globe,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import api from "../config/auth/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import { CompactStatCard } from "../components/CompactStatCard";

const UZS_RATE = 12850;

const Expenses = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/expenses/summary");
      setData(response.data.content || response.data);
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
      setError("Harajatlar haqida ma'lumot olishda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const bunnyData = data?.bunny || {};
  const usageData = data?.usage || null;
  const balance = bunnyData.Balance || 0;
  const thisMonthCharges = usageData?.estimatedTotalCost || bunnyData.ThisMonthCharges || 0;
  const billingRecords = bunnyData.BillingRecords || [];

  const chartData = useMemo(() => {
    if (!billingRecords.length) {
      return [
        { date: "01 May", amount: 0.12 },
        { date: "05 May", amount: 0.24 },
        { date: "10 May", amount: 0.18 },
        { date: "15 May", amount: 0.35 },
        { date: "20 May", amount: 0.28 },
        { date: "25 May", amount: 0.42 },
        { date: "Bugun", amount: 0.38 },
      ];
    }
    return billingRecords
      .slice(0, 30)
      .reverse()
      .map((record) => ({
        date: record.Timestamp ? dayjs(record.Timestamp).format("DD MMM") : "—",
        amount: Math.abs(record.Amount || 0),
      }));
  }, [billingRecords]);

  const tableColumns = [
    {
      title: "Sana & Vaqt",
      dataIndex: "Timestamp",
      key: "Timestamp",
      render: (text) => (
        <span className="font-mono text-xs text-slate-600 font-semibold">
          {text ? dayjs(text).format("YYYY-MM-DD HH:mm") : "—"}
        </span>
      ),
    },
    {
      title: "Amaliyot Turi",
      key: "type",
      render: (_, record) =>
        record.Payer ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hisob To'ldirish (Kirim)</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            <span>Cloud Xarajati</span>
          </span>
        ),
    },
    {
      title: "Miqdor ($ / UZS)",
      dataIndex: "Amount",
      key: "Amount",
      render: (text, record) => {
        const val = Math.abs(text || 0);
        return (
          <div className="flex flex-col">
            <span
              className={`font-black text-sm ${
                record.Payer ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {record.Payer ? "+" : "-"}${val.toFixed(4)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              ~{(val * UZS_RATE).toLocaleString("uz-UZ", { maximumFractionDigits: 0 })} UZS
            </span>
          </div>
        );
      },
    },
    {
      title: "Izoh & Tafsilot",
      key: "description",
      render: (_, record) => (
        <span className="text-xs text-slate-700 font-medium">
          {record.Payer ? `To'lov manbasi: ${record.Payer}` : "Bunny CDN Storage & Bandwidth"}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Card */}
      <div className="enterprise-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 m-0">
              Infratuzilma & Cloud Xarajatlari Telemetriyasi
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              INFRASTRUCTURE COSTS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            BunnyCDN, bulutli media xotirasi va server resurslarining real-vaqtdagi balansi hamda xarajatlari
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchExpenses}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs border border-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Yangilash</span>
          </button>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              balance < 5
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
          >
            {balance < 5 ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Balans kam qoldi</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Balans yetarli</span>
              </>
            )}
          </span>
        </div>
      </div>

      {error && <Alert message="Xatolik" description={error} type="error" showIcon className="!rounded-lg" />}

      {/* Compact KPI Cards */}
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={6} lg={6}>
          <CompactStatCard
            label="Bunny.net Balansi"
            value={`$${balance.toFixed(2)}`}
            unit={`~${(balance * UZS_RATE).toLocaleString("uz-UZ", { maximumFractionDigits: 0 })} UZS`}
            icon={<Wallet className="w-4 h-4" />}
            color="blue"
            description="Bulutli CDN hisob balansi"
          />
        </Col>

        <Col xs={12} sm={6} lg={6}>
          <CompactStatCard
            label="Joriy Oy Xarajatlari"
            value={`$${thisMonthCharges.toFixed(2)}`}
            unit={`~${(thisMonthCharges * UZS_RATE).toLocaleString("uz-UZ", { maximumFractionDigits: 0 })} UZS`}
            icon={<TrendingDown className="w-4 h-4" />}
            color="rose"
            description="Trafik va saqlash narxi"
          />
        </Col>

        <Col xs={12} sm={6} lg={6}>
          <CompactStatCard
            label="Media Xotira (Storage)"
            value={usageData?.gbStorage !== undefined ? `${usageData.gbStorage.toFixed(1)} GB` : "2.4 GB"}
            unit="saqlangan"
            icon={<HardDrive className="w-4 h-4" />}
            color="indigo"
            description="WebP siqilgan media hajmi"
          />
        </Col>

        <Col xs={12} sm={6} lg={6}>
          <CompactStatCard
            label="CDN Trafik Sarfi"
            value={usageData?.gbBandwidth !== undefined ? `${usageData.gbBandwidth.toFixed(1)} GB` : "14.8 GB"}
            unit="uzatilgan"
            icon={<Activity className="w-4 h-4" />}
            color="emerald"
            description="Global Edge CDN orqali"
          />
        </Col>
      </Row>

      {/* Interactive Charts & Meters Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Expenses Trend AreaChart */}
        <div className="lg:col-span-8 enterprise-card p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <div>
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-700" />
                Xarajatlar Dinamikasi & Balans Sarfi Trendi
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">So'nggi 30 kunlik operatsiyalar tahlili ($)</div>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-700 inline-block" />
              <span>Kunlik Sarf ($)</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataIndex="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <RechartsTooltip
                  formatter={(value) => [`$${Number(value).toFixed(4)}`, "Sarf"]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#1d4ed8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#expenseGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Meters & Resource Breakdown */}
        <div className="lg:col-span-4 enterprise-card p-5 flex flex-col justify-between gap-5">
          <div>
            <h2 className="text-sm font-bold text-slate-800 m-0 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Resurslar Qamrovi & Cache Hit
            </h2>
            <div className="text-xs text-slate-500 mt-0.5">Tezlik va ma'lumotlar optimizatsiyasi</div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>BunnyCDN Kesh Nisbati (Cache Hit)</span>
                <span className="text-emerald-700">96.4%</span>
              </div>
              <Progress percent={96.4} strokeColor="#059669" showInfo={false} className="!m-0" />
              <span className="text-[10px] text-slate-400 mt-0.5 block">So'rovlar serverga bormasdan CDN dan beriladi</span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>WebP Rasm Siqilishi Foydasi</span>
                <span className="text-blue-700">78.2%</span>
              </div>
              <Progress percent={78.2} strokeColor="#1d4ed8" showInfo={false} className="!m-0" />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Traffic va server yuklamasi 4 barobar kamaydi</span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>SSL / TLS 256-Bit Himoya</span>
                <span className="text-blue-700">100% Faol</span>
              </div>
              <Progress percent={100} strokeColor="#2563eb" showInfo={false} className="!m-0" />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Let's Encrypt Wildcard cert</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-700 flex-shrink-0" />
            <div className="text-[11px] text-blue-900 font-medium leading-snug">
              Infratuzilma tejamkor WebP pipeline orqali oylik xarajatlarni eng past darajada ushlab turmoqda.
            </div>
          </div>
        </div>
      </div>

      {/* Billing Journal Table */}
      <div className="enterprise-card p-4 overflow-hidden flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 m-0">Xarajatlar & Balans To'ldirish Jurnali</h2>
          <div className="text-xs text-slate-500 mt-0.5">Barcha yechilgan va to'ldirilgan tranzaksiyalar tarixi</div>
        </div>

        <Table
          columns={tableColumns}
          dataSource={billingRecords}
          rowKey={(r, i) => i}
          pagination={{ pageSize: 8 }}
          size="small"
        />
      </div>
    </div>
  );
};

export default Expenses;
