import React, { useEffect, useState, useRef } from "react";
import { Button, Card, Progress, Tag, Modal, Alert, Space } from "antd";
import {
  CloudSyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import api from "../config/auth/api";

export default function MediaMigration() {
  const [status, setStatus] = useState({
    isRunning: false,
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    progressPercent: 0,
    currentSection: "IDLE",
    logs: [],
  });

  const [loading, setLoading] = useState(false);
  const logsEndRef = useRef(null);

  const fetchStatus = async () => {
    try {
      const response = await api.get("/file/migration-status");
      const data = response.data?.content || response.data || {};
      setStatus({
        isRunning: data.isRunning ?? false,
        total: data.total ?? 0,
        processed: data.processed ?? 0,
        success: data.success ?? 0,
        failed: data.failed ?? 0,
        progressPercent: data.progressPercent ?? 0,
        currentSection: data.currentSection || "IDLE",
        logs: data.logs || [],
      });
    } catch (err) {
      console.error("Status error:", err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [status.logs]);

  const handleStartMigration = () => {
    Modal.confirm({
      title: "Bunny CDN ga Rasmlarni Ko'chirish",
      content:
        "Barcha mahsulotlar, bannerlar, kategoriyalar va profillardagi Vercel/tashqi rasmlar Bunny CDN ga xavfsiz o'tkaziladi hamda ma'lumotlar bazasidagi URL lar almashtiriladi. Davom ettirasizmi?",
      okText: "Ha, Boshlash",
      cancelText: "Bekor Qilish",
      okType: "primary",
      onOk: async () => {
        setLoading(true);
        try {
          await api.post("/file/migrate-to-bunny");
          await fetchStatus();
        } catch (err) {
          console.error("Start error:", err);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <CloudSyncOutlined className="text-indigo-600 text-3xl" />
            Bunny CDN Media Migratsiyasi
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Barcha Vercel/tashqi rasmlarni Bunny.net Storage & Pull Zone ga xavfsiz va rate limit siz avto-ko'chirish
          </p>
        </div>
        <div>
          <Button
            type="primary"
            size="large"
            icon={status.isRunning ? <LoadingOutlined /> : <CloudSyncOutlined />}
            loading={loading || status.isRunning}
            onClick={handleStartMigration}
            style={{
              backgroundColor: status.isRunning ? "#faad14" : "#6345ED",
              height: "46px",
              paddingHorizontal: "24px",
              borderRadius: "10px",
              fontWeight: "600",
            }}
          >
            {status.isRunning ? "Migratsiya Bajarilmoqda..." : "Migratsiyani Boshlash"}
          </Button>
        </div>
      </div>

      <Alert
        message="Muhim Eslatma"
        description="Jarayon fonda xavfsiz va tezkor ishlaydi (har bir rasm WebP formatga Sharp orqali siqilib, Bunny CDN ga yuboriladi va DB avtomatik yangilanadi). Sahifani yopishingiz ham mumkin."
        type="info"
        showIcon
        className="rounded-xl border border-indigo-100 bg-indigo-50/50"
      />

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-xl border border-gray-100 shadow-sm">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
            Jami Rasmlar
          </div>
          <div className="text-3xl font-extrabold text-gray-900 mt-2">
            {status.total}
          </div>
          <div className="text-xs text-gray-400 mt-1">Ko'chirilishi kerak</div>
        </Card>

        <Card className="rounded-xl border border-gray-100 shadow-sm">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
            Bajarildi
          </div>
          <div className="text-3xl font-extrabold text-indigo-600 mt-2">
            {status.processed} / {status.total}
          </div>
          <div className="text-xs text-gray-400 mt-1">Qayta ishlangan</div>
        </Card>

        <Card className="rounded-xl border border-gray-100 shadow-sm">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
            Muvaffaqiyatli
          </div>
          <div className="text-3xl font-extrabold text-green-600 mt-2 flex items-center gap-2">
            {status.success}
            <CheckCircleOutlined className="text-xl" />
          </div>
          <div className="text-xs text-green-600 mt-1">Bunny CDN ga yozildi</div>
        </Card>

        <Card className="rounded-xl border border-gray-100 shadow-sm">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
            Xatoliklar
          </div>
          <div className="text-3xl font-extrabold text-red-500 mt-2 flex items-center gap-2">
            {status.failed}
            <CloseCircleOutlined className="text-xl" />
          </div>
          <div className="text-xs text-red-500 mt-1">O'tkazib yuborilgan</div>
        </Card>
      </div>

      {/* Progress Bar & Current Section */}
      <Card className="rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-700">Jarayon Holati:</span>
            <Tag color={status.isRunning ? "processing" : status.progressPercent === 100 ? "success" : "default"}>
              {status.isRunning && <SyncOutlined spin className="mr-1" />}
              {status.currentSection}
            </Tag>
          </div>
          <span className="text-2xl font-black text-indigo-600">
            {status.progressPercent}%
          </span>
        </div>

        <Progress
          percent={status.progressPercent}
          status={status.isRunning ? "active" : status.failed > 0 ? "normal" : "success"}
          strokeColor={{
            "0%": "#6345ED",
            "100%": "#10B981",
          }}
          strokeWidth={14}
          style={{ padding: "4px 0" }}
        />
      </Card>

      {/* Live Logs Terminal Viewer */}
      <Card
        title={
          <div className="flex items-center gap-2 text-gray-800">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
            <span className="ml-2 font-mono text-sm font-semibold">Real-Vaqt Konsol Jurnali (Live Logs)</span>
          </div>
        }
        className="rounded-xl border border-gray-900 bg-gray-950 shadow-md text-gray-200"
        bodyStyle={{ padding: "16px" }}
      >
        <div className="font-mono text-xs text-green-400 bg-gray-900 p-4 rounded-lg h-72 overflow-y-auto space-y-1 border border-gray-800">
          {status.logs.length === 0 ? (
            <div className="text-gray-500 italic">Hali loglar yo'q. Jarayonni boshlash uchun tugmani bosing.</div>
          ) : (
            status.logs.map((log, index) => (
              <div
                key={index}
                className={
                  log.includes("CRITICAL") || log.includes("✗") || log.includes("xatolik")
                    ? "text-red-400"
                    : log.includes("✓") || log.includes("muvaffaqiyatli")
                    ? "text-emerald-400 font-semibold"
                    : "text-gray-300"
                }
              >
                {log}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </Card>
    </div>
  );
}
