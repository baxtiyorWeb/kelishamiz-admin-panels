"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  User,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  Shield,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import api from "../config/auth/api";

const LoginComponent = () => {
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState("login"); // "login" | "mfa"
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [isBackupCode, setIsBackupCode] = useState(false);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccess("");

    const cleanIdentifier = loginIdentifier.trim();
    if (!cleanIdentifier) {
      setError("Iltimos, login (username) yoki telefon raqamingizni kiriting.");
      return;
    }

    if (!password) {
      setError("Iltimos, parolingizni kiriting.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/admin/auth/login", {
        login: cleanIdentifier,
        password,
      });

      if (response.data?.requiresMfa) {
        setMfaToken(response.data.mfaToken);
        setStep("mfa");
        setSuccess("Ikki bosqichli autentifikatsiya (2FA) talab qilinadi.");
        setLoading(false);
        return;
      }

      const token =
        response.data?.access_token ||
        response.data?.accessToken ||
        response.data?.content?.accessToken;
      const refreshToken =
        response.data?.refresh_token ||
        response.data?.refreshToken ||
        response.data?.content?.refreshToken;
      const user = response.data?.user;

      if (token) {
        localStorage.setItem("accessToken", token);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        if (user) localStorage.setItem("user", JSON.stringify(user));
        setSuccess("Super Admin tasdiqlandi! Boshqaruv paneliga yo'naltirilmoqda...");

        setTimeout(() => {
          window.location.href = "/";
        }, 600);
      } else {
        setError(response.data?.message || "Tizimga kirishda xatolik yuz berdi.");
      }
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;

      if (status === 429) {
        setError(
          message || "Ko'p marotaba noto'g'ri urinish qilindi. Xavfsizlik tufayli hisob bloklandi yoki cheklov o'rnatildi.",
        );
      } else if (status === 401) {
        setError(message || "Login yoki parol noto'g'ri. Admin huquqi talab qilinadi.");
      } else {
        setError(message || "Serverga ulanishda xatolik yuz berdi. Qaytadan urinib ko'ring.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMfa = async (e) => {
    if (e) e.preventDefault();
    if (!mfaCode.trim()) {
      setError("Iltimos, tasdiqlash kodini kiriting.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/admin/auth/mfa/verify", {
        mfaToken,
        code: mfaCode.trim(),
        isBackupCode,
      });

      const token =
        res.data?.access_token ||
        res.data?.accessToken ||
        res.data?.content?.accessToken;
      const refreshToken =
        res.data?.refresh_token ||
        res.data?.refreshToken ||
        res.data?.content?.refreshToken;
      const user = res.data?.user;

      if (token) {
        localStorage.setItem("accessToken", token);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        if (user) localStorage.setItem("user", JSON.stringify(user));
        setSuccess("2FA muvaffaqiyatli tasdiqlandi! Yo'naltirilmoqda...");
        setTimeout(() => {
          window.location.href = "/";
        }, 600);
      } else {
        setError("Autentifikatsiya kodi noto'g'ri.");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        "2FA kodi noto'g'ri yoki muddati o'tgan. Qaytadan urinib ko'ring.",
      );
    } finally {
      setLoading(false);
    }
  };

  const goBackToLogin = () => {
    setStep("login");
    setMfaCode("");
    setMfaToken("");
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

            {step === "mfa" && (
              <button
                type="button"
                onClick={goBackToLogin}
                className="rounded-xl p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-bold text-white">
              {step === "login" && "Super Admin Kirish"}
              {step === "mfa" && "2FA Tasdiqlash (TOTP)"}
            </h2>
            <p className="text-xs text-indigo-100/80 mt-0.5">
              {step === "login" && "Login (telefon yoki username) va maxfiy parolingizni kiriting"}
              {step === "mfa" && (isBackupCode ? "Zaxira tiklash kodini kiriting" : "Authenticator ilovangizdagi 6 xonali kod")}
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

          {/* Login Step */}
          {step === "login" && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Login / Telefon Raqami
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Masalan: superadmin yoki +998901234567"
                    disabled={loading}
                    autoComplete="username"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 font-semibold text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Maxfiy Parol
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Parolingizni kiriting"
                    disabled={loading}
                    autoComplete="current-password"
                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 font-semibold text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-indigo-900/80 leading-relaxed font-medium">
                  Ushbu panelga faqat <span className="font-bold text-indigo-700">SUPER_ADMIN</span> huquqiga ega akkauntlar kira oladi. Barcha kirish urinishlari qatʼiy xavfsizlik nazoratida.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !loginIdentifier || !password}
                className="w-full mt-1 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Tizimga Kirish</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MFA Step */}
          {step === "mfa" && (
            <form onSubmit={handleVerifyMfa} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {isBackupCode ? "Zaxira (Backup) Kodingiz" : "Authenticator 6 xonali kodi"}
                </label>
                <div className="relative">
                  <Shield className="w-5 h-5 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder={isBackupCode ? "XXXX-XXXX" : "123456"}
                    maxLength={isBackupCode ? 16 : 8}
                    disabled={loading}
                    autoFocus
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-indigo-200 bg-indigo-50/30 focus:bg-white text-slate-900 font-mono font-bold text-center tracking-widest text-base outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !mfaCode.trim()}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>2FA Tasdiqlash & Kirish</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsBackupCode(!isBackupCode);
                    setMfaCode("");
                    setError("");
                  }}
                  className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  {isBackupCode
                    ? "← Authenticator ilovasi kodidan foydalanish"
                    : "Zaxira (backup recovery) kodidan foydalanish"}
                </button>
              </div>
            </form>
          )}

          {/* Security badge footer */}
          <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-slate-400 font-medium border-t border-slate-100">
            <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
            <span>256-Bit SSL Shifrlangan • Faqat Super Admin Kirish</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;
