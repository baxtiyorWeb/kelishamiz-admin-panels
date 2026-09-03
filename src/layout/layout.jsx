import React, { useEffect, useState } from "react";
import {
  Menu,
  Space,
  Tag,
  Avatar,
  Badge,
  Dropdown,
  Tooltip,
} from "antd";
import {
  LayoutDashboard,
  Tag as TagIcon,
  Store,
  Layers,
  Sliders,
  Sparkles,
  Users,
  AlertTriangle,
  Bell,
  Contact,
  MapPin,
  CreditCard,
  Wallet,
  CloudUpload,
  UserX,
  Scale,
  History,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Shield,
  Search,
  Plus,
  Radio,
  ExternalLink,
  Zap,
  Globe,
  Settings,
} from "lucide-react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (window.location.pathname === "/") {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/auth/login";
  };

  const menuItems = [
    {
      key: "group-main",
      type: "group",
      label: <span className="text-[10px] font-extrabold text-slate-400 tracking-wider">ASOSIY</span>,
      children: [
        {
          key: "/dashboard",
          icon: <LayoutDashboard className="w-4 h-4" />,
          label: "Boshqaruv & Telemetriya",
          onClick: () => navigate("/dashboard"),
        },
        {
          key: "/settings",
          icon: <Settings className="w-4 h-4 text-purple-400" />,
          label: "Tizim Sozlamalari & Flags",
          onClick: () => navigate("/settings"),
        },
      ],
    },
    {
      key: "group-marketplace",
      type: "group",
      label: <span className="text-[10px] font-extrabold text-slate-400 tracking-wider">SAVDO & KONTENT</span>,
      children: [
        {
          key: "/products",
          icon: <TagIcon className="w-4 h-4" />,
          label: "E'lonlar & Moderatsiya",
          onClick: () => navigate("/products"),
        },
        {
          key: "/shops",
          icon: <Store className="w-4 h-4" />,
          label: "Do'konlar (Shops)",
          onClick: () => navigate("/shops"),
        },
        {
          key: "/categories",
          icon: <Layers className="w-4 h-4" />,
          label: "Kategoriyalar Studio",
          onClick: () => navigate("/categories"),
        },
        {
          key: "/properties",
          icon: <Sliders className="w-4 h-4" />,
          label: "Dinamik Xususiyatlar",
          onClick: () => navigate("/properties"),
        },
        {
          key: "/banners",
          icon: <Sparkles className="w-4 h-4" />,
          label: "Promo & Bannerlar",
          onClick: () => navigate("/banners"),
        },
      ],
    },
    {
      key: "group-users-crm",
      type: "group",
      label: <span className="text-[10px] font-extrabold text-slate-400 tracking-wider">MIJOZLAR & CRM</span>,
      children: [
        {
          key: "/users",
          icon: <Users className="w-4 h-4" />,
          label: "Foydalanuvchilar CRM",
          onClick: () => navigate("/users"),
        },
        {
          key: "/reports",
          icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
          label: "Shikoyatlar Markazi",
          onClick: () => navigate("/reports"),
        },
        {
          key: "/notifications",
          icon: <Bell className="w-4 h-4" />,
          label: "Push Bildirishnomalar",
          onClick: () => navigate("/notifications"),
        },
        {
          key: "/profiles",
          icon: <Contact className="w-4 h-4" />,
          label: "Profillar Reestri",
          onClick: () => navigate("/profiles"),
        },
        {
          key: "/locations",
          icon: <MapPin className="w-4 h-4" />,
          label: "Hududlar & Manzillar",
          onClick: () => navigate("/locations"),
        },
      ],
    },
    {
      key: "group-system",
      type: "group",
      label: <span className="text-[10px] font-extrabold text-slate-400 tracking-wider">TIZIM & SOZLAMALAR</span>,
      children: [
        {
          key: "/settings-full",
          icon: <Settings className="w-4 h-4 text-purple-400" />,
          label: "Tizim Sozlamalari (Control Plane)",
          onClick: () => navigate("/settings"),
        },
        {
          key: "/migration",
          icon: <CloudUpload className="w-4 h-4" />,
          label: "Bunny CDN Xotira",
          onClick: () => navigate("/migration"),
        },
        {
          key: "/deletions",
          icon: <UserX className="w-4 h-4" />,
          label: "Account Deletions Ops",
          onClick: () => navigate("/deletions"),
        },
        {
          key: "/security-policies",
          icon: <Scale className="w-4 h-4" />,
          label: "Xavfsizlik Hujjatlari",
          onClick: () => navigate("/security-policies"),
        },
        {
          key: "/audit-logs",
          icon: <History className="w-4 h-4" />,
          label: "Audit Tarixi & Logs",
          onClick: () => navigate("/audit-logs"),
        },
      ],
    },
  ];

  const userMenu = {
    items: [
      {
        key: "1",
        label: (
          <div className="py-2 px-1 flex items-center gap-3">
            <Avatar className="bg-gradient-to-tr from-indigo-500 to-purple-600 font-bold text-white shadow-xs" size={38}>
              A
            </Avatar>
            <div>
              <div className="font-black text-slate-900 text-xs">Super Administrator</div>
              <div className="text-[10px] text-slate-400 font-mono">admin@kelishamiz.uz</div>
            </div>
          </div>
        ),
        disabled: true,
      },
      {
        type: "divider",
      },
      {
        key: "settings_profile",
        icon: <Settings className="w-3.5 h-3.5 text-purple-500" />,
        label: <span className="text-xs font-semibold">Tizim Sozlamalari</span>,
        onClick: () => navigate("/settings"),
      },
      {
        key: "users_crm",
        icon: <Users className="w-3.5 h-3.5 text-indigo-500" />,
        label: <span className="text-xs font-semibold">Foydalanuvchilar CRM</span>,
        onClick: () => navigate("/users"),
      },
      {
        key: "security",
        icon: <Shield className="w-3.5 h-3.5 text-purple-500" />,
        label: <span className="text-xs font-semibold">Xavfsizlik & Siyosat</span>,
        onClick: () => navigate("/security-policies"),
      },
      {
        key: "audit",
        icon: <History className="w-3.5 h-3.5 text-blue-500" />,
        label: <span className="text-xs font-semibold">Audit Tarixi</span>,
        onClick: () => navigate("/audit-logs"),
      },
      {
        type: "divider",
      },
      {
        key: "logout",
        danger: true,
        icon: <LogOut className="w-3.5 h-3.5" />,
        label: <span className="text-xs font-bold">Tizimdan Chiqish</span>,
        onClick: handleLogout,
      },
    ],
  };

  const getPageInfo = () => {
    const path = location.pathname;
    if (path.includes("dashboard"))
      return { title: "Boshqaruv & Telemetriya", icon: <LayoutDashboard className="w-4 h-4 text-indigo-600" /> };
    if (path.includes("settings"))
      return { title: "Tizim Boshqaruvi & Feature Flags", icon: <Settings className="w-4 h-4 text-purple-600" /> };
    if (path.includes("products"))
      return { title: "E'lonlar & Moderatsiya", icon: <TagIcon className="w-4 h-4 text-indigo-600" /> };
    if (path.includes("shops"))
      return { title: "Do'konlar (Shops)", icon: <Store className="w-4 h-4 text-indigo-600" /> };
    if (path.includes("categories"))
      return { title: "Kategoriyalar Studio", icon: <Layers className="w-4 h-4 text-indigo-600" /> };
    if (path.includes("properties"))
      return { title: "Dinamik Xususiyatlar", icon: <Sliders className="w-4 h-4 text-indigo-600" /> };
    if (path.includes("banners"))
      return { title: "Promo & Bannerlar", icon: <Sparkles className="w-4 h-4 text-indigo-600" /> };
    if (path.includes("users"))
      return { title: "Foydalanuvchilar CRM", icon: <Users className="w-4 h-4 text-indigo-600" /> };
    if (path.includes("reports"))
      return { title: "Shikoyatlar Markazi", icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> };
    if (path.includes("notifications"))
      return { title: "Push Bildirishnomalar", icon: <Bell className="w-4 h-4 text-indigo-600" /> };
    if (path.includes("profiles"))
      return { title: "Profillar Reestri", icon: <Contact className="w-4 h-4 text-indigo-600" /> };
    if (path.includes("locations"))
      return { title: "Hududlar & Manzillar", icon: <MapPin className="w-4 h-4 text-indigo-600" /> };
    if (path.includes("payments"))
      return { title: "To'lovlar & Tranzaksiyalar", icon: <CreditCard className="w-4 h-4 text-indigo-600" /> };
    if (path.includes("expenses"))
      return { title: "Server & CDN Xarajatlari", icon: <Wallet className="w-4 h-4 text-indigo-600" /> };
    if (path.includes("migration"))
      return { title: "Bunny CDN Xotira", icon: <CloudUpload className="w-4 h-4 text-indigo-600" /> };
    if (path.includes("deletions"))
      return { title: "Account Deletions Ops", icon: <UserX className="w-4 h-4 text-indigo-600" /> };
    if (path.includes("security-policies"))
      return { title: "Xavfsizlik Hujjatlari", icon: <Scale className="w-4 h-4 text-indigo-600" /> };
    if (path.includes("audit-logs"))
      return { title: "Audit Tarixi & Logs", icon: <History className="w-4 h-4 text-indigo-600" /> };
    return { title: "Dashboard", icon: <LayoutDashboard className="w-4 h-4 text-indigo-600" /> };
  };

  const pageInfo = getPageInfo();

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex overflow-hidden">
      {/* 1. LEFT FLOATING SIDEBAR */}
      <aside
        className={`${
          collapsed ? "w-20" : "w-64"
        } my-4 ml-4 h-[calc(100vh-2rem)] rounded-3xl bg-[#0f172a] border border-slate-800 shadow-2xl sticky top-4 flex-shrink-0 flex flex-col justify-between overflow-hidden transition-all duration-300 z-30`}
      >
        {/* Brand Header */}
        <div>
          <div className="p-4 flex items-center justify-between border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6345ED] via-[#8B5CF6] to-[#38BDF8] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/30 flex-shrink-0">
                K
              </div>
              {!collapsed && (
                <div className="overflow-hidden">
                  <div className="text-white font-black text-[15px] tracking-wide flex items-center gap-1.5">
                    KELISHAMIZ <span className="text-[9px] bg-indigo-500/30 text-indigo-300 font-extrabold px-1.5 py-0.5 rounded border border-indigo-500/40">PRO</span>
                  </div>
                  <div className="text-slate-400 text-[10px] font-semibold tracking-tight">
                    Operations Center
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Menu */}
          <div className="py-2 overflow-y-auto max-h-[calc(100vh-13rem)] scrollbar-none">
            <Menu
              theme="dark"
              mode="inline"
              inlineCollapsed={collapsed}
              selectedKeys={[location.pathname]}
              className="!bg-transparent !border-0 text-slate-300 font-medium"
              items={menuItems}
            />
          </div>
        </div>

        {/* Sider Footer */}
        {!collapsed && (
          <div className="p-3.5 m-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-semibold">v2.5.0 Live</span>
            </div>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-md">
              Cloud CDN
            </span>
          </div>
        )}
      </aside>

      {/* 2. RIGHT WRAPPER (TOP NAVBAR + MAIN CONTENT) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* TOP ULTRA-MODERN FLOATING NAVBAR */}
        <header className="mt-4 mx-4 px-5 h-16 rounded-3xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-sm flex items-center justify-between sticky top-4 z-20 flex-shrink-0 gap-3">
          {/* Left: Breadcrumbs with Icon */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-xs flex-shrink-0">
              {pageInfo.icon}
            </div>
            <div className="flex items-center text-xs font-bold text-slate-700 truncate">
              <span className="text-slate-400 font-normal mr-1.5 hidden sm:inline">Boshqaruv Paneli /</span>
              <span className="text-slate-900 font-black truncate">{pageInfo.title}</span>
            </div>
          </div>

          {/* Center / Right: Global Search & Quick Actions */}
          <div className="flex items-center gap-3">
            {/* Global Search Bar */}
            <div className="relative hidden md:block">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tezkor qidiruv..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="pl-9 pr-10 py-1.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all w-52"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-slate-200/80 text-slate-500 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md">
                ⌘K
              </span>
            </div>

            {/* Quick Action Button: New Broadcast Push */}
            <Tooltip title="Ommaviy Push Xabar Yuborish">
              <button
                type="button"
                onClick={() => navigate("/notifications")}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-95 text-white font-bold text-xs shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-white text-white" />
                <span>Tezkor Push</span>
              </button>
            </Tooltip>

            {/* Live Server Telemetry */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-700 text-xs font-black shadow-2xs">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>99.98% Live</span>
            </div>

            {/* Notifications Bell */}
            <Tooltip title="Xabarnomalar">
              <button
                type="button"
                onClick={() => navigate("/notifications")}
                className="relative w-9 h-9 rounded-2xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
              </button>
            </Tooltip>

            {/* Admin Profile Dropdown */}
            <Dropdown menu={userMenu} placement="bottomRight" arrow>
              <div className="flex items-center gap-2.5 pl-1 cursor-pointer hover:opacity-85 transition-opacity">
                <div className="relative">
                  <Avatar
                    className="bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 shadow-sm text-white font-black text-xs ring-2 ring-indigo-100"
                    size={36}
                  >
                    A
                  </Avatar>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div className="hidden xl:block text-left">
                  <div className="text-xs font-black text-slate-800 leading-tight">Admin</div>
                  <div className="text-[10px] text-slate-400 font-semibold leading-tight flex items-center gap-1">
                    <span>Superuser</span>
                    <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1 rounded font-bold">PRO</span>
                  </div>
                </div>
              </div>
            </Dropdown>
          </div>
        </header>

        {/* 3. MAIN CONTENT CONTAINER (FULL WIDTH) */}
        <main className="flex-1 p-4 sm:p-5 lg:p-6 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
