"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Lock,
  User,
  MapPin,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  Shield,
  Sparkles,
} from "lucide-react";
import api from "../config/auth/api";

const LoginComponent = () => {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState("phone"); // phone | otp | register
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [regionId, setRegionId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [error, setError] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [success, setSuccess] = useState("");
  const [responseCode, setResponseCode] = useState("");

  // Fetch regions when step becomes register
  useEffect(() => {
    if (step === "register") {
      fetchRegionsData();
    }
  }, [step]);

  const fetchRegionsData = async () => {
    try {
      const response = await api.get("/location/regions");
      const data = await response.data;
      if (data?.content) {
        setRegions(data.content);
      }
    } catch (err) {
      setError("Viloyatlarni yuklashda xatolik yuz berdi");
    }
  };

  const handleRegionChange = (e) => {
    const selectedRegionId = e.target.value;
    setRegionId(selectedRegionId);
    setDistrictId("");

    const selectedRegion = regions.find((r) => r.id === parseInt(selectedRegionId));
    setDistricts(selectedRegion ? selectedRegion.districts : []);
  };

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{0,2})(\d{0,3})(\d{0,2})(\d{0,2})?/);
    if (!match) return "";

    return [match[1], match[2], match[3], match[4]].filter(Boolean).join(" ").trim();
  };

  const handleChange = (e) => {
    const { value } = e.target;
    const cleanedValue = value.replace("+998 ", "").replace(/\s/g, "");
    const formatted = formatPhoneNumber(cleanedValue);
    const finalValue = formatted ? `+998 ${formatted}` : "";
    setPhone(finalValue);
  };

  useEffect(() => {
    let timer;
    if (countdown > 0 && step === "otp") {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown, step]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSendPhone = async () => {
    setError("");
    setLoading(true);

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 9) {
      setError("Iltimos, to'g'ri telefon raqamini kiriting");
      setLoading(false);
      return;
    }

    try {
      const checkRes = await api.post("/auth/check-phone", {
        phone: `+${phoneDigits}`,
      });
      setIsNewUser(!checkRes.data?.exists);

      try {
        const response = await api.post("/auth/send-otp", {
          phone: `+${phoneDigits}`,
        });
        setStep("otp");
        setCountdown(120);
        setSuccess("Tasdiqlash kodi yuborildi");
        setResponseCode(response.data.code);

        if (response.data.code) {
          setTimeout(() => {
            setCode(response.data.code);
          }, 1000);
        }
      } catch (otpError) {
        if (otpError?.response?.status === 409) {
          setStep("otp");
          setCountdown(120);
          setError("Bu telefon raqam allaqachon ro'yxatdan o'tgan. OTP kodini kiriting.");
        } else {
          setError("OTP yuborishda xatolik yuz berdi. Qayta urinib ko'ring.");
        }
      }
    } catch (checkErr) {
      setError("Telefon raqamini tekshirishda xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setLoading(true);

    if (code.length < 4 && !responseCode) {
      setError("Iltimos, to'g'ri kodni kiriting");
      setLoading(false);
      return;
    }

    try {
      const phoneDigits = phone.replace(/\D/g, "");
      const verifyRes = await api.post("/auth/verify-otp", {
        phone: `+${phoneDigits}`,
        code: responseCode || code,
      });

      if (verifyRes.data?.success) {
        if (isNewUser) {
          setStep("register");
          setSuccess("Kod tasdiqlandi. Iltimos, ma'lumotlaringizni kiriting");
        } else {
          try {
            const loginRes = await api.post("/auth/login/verify-otp", {
              phone: `+${phoneDigits}`,
              code: responseCode || code,
            });
            localStorage.setItem("accessToken", loginRes.data?.accessToken);
            localStorage.setItem("refreshToken", loginRes.data?.refreshToken);
            setSuccess("Muvaffaqiyatli kirildi! Yo'naltirilmoqda...");

            setTimeout(() => {
              window.location.href = "/";
            }, 1000);
          } catch (loginErr) {
            setError("Tizimga kirishda xatolik yuz berdi.");
          }
        }
      } else {
        setError(verifyRes.data?.message || "OTP kodi noto'g'ri yoki muddati o'tgan.");
      }
    } catch (err) {
      setError("OTP tekshirishda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    setError("");
    setLoading(true);

    if (!username.trim()) {
      setError("Iltimos, foydalanuvchi nomini kiriting");
      setLoading(false);
      return;
    }

    if (!regionId) {
      setError("Iltimos, viloyatni tanlang");
      setLoading(false);
      return;
    }

    if (!districtId) {
      setError("Iltimos, tumanni tanlang");
      setLoading(false);
      return;
    }

    try {
      const phoneDigits = phone.replace(/\D/g, "");
      const res = await api.post("/auth/create-account", {
        phone: `+${phoneDigits}`,
        username,
        regionId: parseInt(regionId),
        districtId: parseInt(districtId),
      });

      localStorage.setItem("accessToken", res.data?.content?.accessToken);
      localStorage.setItem("refreshToken", res.data?.content?.refreshToken);

      setSuccess("Hisobingiz muvaffaqiyatli yaratildi! Yo'naltirilmoqda...");

      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (err) {
      if (err?.response?.status === 409) {
        setError("Bu telefon raqam allaqachon ro'yxatdan o'tgan.");
      } else {
        setError("Hisob yaratishda xato. Qayta urinib ko'ring.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setError("");
    setLoading(true);

    try {
      const phoneDigits = phone.replace(/\D/g, "");
      const response = await api.post("/auth/send-otp", {
        phone: `+${phoneDigits}`,
      });
      setCountdown(120);
      setResponseCode(response.data?.code);
      setSuccess("Yangi tasdiqlash kodi yuborildi");
    } catch (err) {
      setError("OTP qayta yuborishda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === "otp") {
      setStep("phone");
    } else if (step === "register") {
      setStep("otp");
    }
    setError("");
    setSuccess("");
  };

  return (
    <div className="flex w-full min-h-screen items-center justify-center bg-slate-950 p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/40 shadow-2xl z-10">
        {/* Header gradient banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 px-8 pt-8 pb-7 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-black text-xl shadow-inner">
                K
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white leading-none">
                  KELISHAMIZ
                </h1>
                <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-widest mt-1 block">
                  Boshqaruv Paneli
                </span>
              </div>
            </div>

            {step !== "phone" && (
              <button
                onClick={goBack}
                className="rounded-xl p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-bold text-white">
              {step === "phone" && "Tizimga Kirish"}
              {step === "otp" && "SMS Tasdiqlash"}
              {step === "register" && "Admin Ma'lumotlari"}
            </h2>
            <p className="text-xs text-indigo-100/80 mt-0.5">
              {step === "phone" && "Telefon raqamingizni kiritib tasdiqlang"}
              {step === "otp" && "SMS orqali yuborilgan 6 xonali kod"}
              {step === "register" && "Yangi administrator hisobini to'ldiring"}
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8 flex flex-col gap-5">
          {/* Messages */}
          <AnimatePresence mode="wait">
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold"
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Steps */}
          {step === "phone" && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Telefon Raqam
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={handleChange}
                    placeholder="+998 90 123 45 67"
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 font-semibold text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                  />
                </div>
              </div>

              <button
                onClick={handleSendPhone}
                disabled={loading || !phone}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>SMS Kodni Olish</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {step === "otp" && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  SMS Tasdiqlash Kodi
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Masalan: 123456"
                    maxLength={6}
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 font-mono font-bold text-center tracking-widest text-base outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                  />
                </div>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading || (!code && !responseCode)}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Tasdiqlash & Kirish</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center mt-1">
                {countdown > 0 ? (
                  <span className="text-xs text-slate-400 font-medium">
                    Kodni qayta yuborish: {formatTime(countdown)}
                  </span>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Kodni qayta yuborish
                  </button>
                )}
              </div>
            </div>
          )}

          {step === "register" && (
            <div className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">To'liq Ism</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ism va familiya"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Viloyat</label>
                <select
                  value={regionId}
                  onChange={handleRegionChange}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-indigo-600"
                >
                  <option value="">Viloyatni tanlang</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tuman</label>
                <select
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value)}
                  disabled={!regionId}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-indigo-600 disabled:opacity-50"
                >
                  <option value="">Tumanni tanlang</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleCreateAccount}
                disabled={loading || !username || !regionId || !districtId}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Hisobni Yakunlash</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Security badge footer */}
          <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-slate-400 font-medium border-t border-slate-100">
            <Shield className="w-3.5 h-3.5 text-indigo-500" />
            <span>256-Bit SSL Shifrlangan Xavfsiz Boshqaruv Tizimi</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;
