import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, isArray } from "lodash";
import api from "../config/auth/api";
import Table from "./../components/Table";
import {
  Button,
  message,
  Popconfirm,
  Avatar,
  Input,
  Tag,
  Space,
  Row,
  Col,
  Tabs,
  Tooltip,
  Modal,
  Descriptions,
} from "antd";
import {
  Contact,
  User,
  Mail,
  Phone,
  MapPin,
  Wallet,
  Eye,
  Trash2,
  Search,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Image as ImageIcon,
  ExternalLink,
  Calendar,
  Building,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { CompactStatCard } from "../components/CompactStatCard";

const Profiles = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState("all");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const response = await api.get("/profiles");
      if (!response.status || response.status !== 200) {
        throw new Error("Network response was not ok");
      }
      return response.data;
    },
  });

  const profileItems = useMemo(() => {
    const raw = get(data, "content", []);
    return isArray(raw) ? raw : [];
  }, [data]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = profileItems.length;
    const withAvatar = profileItems.filter((p) => p.avatar && p.avatar.trim()).length;
    const withEmail = profileItems.filter((p) => p.email && p.email.trim()).length;
    const withAddress = profileItems.filter((p) => p.address && p.address.trim()).length;

    return {
      total,
      withAvatar,
      withEmail,
      withAddress,
    };
  }, [profileItems]);

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/profiles/${id}`);
      return response.data;
    },
    onSuccess: () => {
      message.success("Profil muvaffaqiyatli o'chirildi");
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      setIsDetailModalOpen(false);
    },
    onError: () => {
      message.error("Profilni o'chirishda xatolik yuz berdi");
    },
  });

  const filteredProfiles = useMemo(() => {
    return profileItems.filter((p) => {
      if (filterTab === "avatar" && (!p.avatar || !p.avatar.trim())) return false;
      if (filterTab === "email" && (!p.email || !p.email.trim())) return false;
      if (filterTab === "address" && (!p.address || !p.address.trim())) return false;

      if (search.trim()) {
        const term = search.toLowerCase();
        return (
          p.fullName?.toLowerCase().includes(term) ||
          p.email?.toLowerCase().includes(term) ||
          p.phoneNumber?.toLowerCase().includes(term) ||
          p.address?.toLowerCase().includes(term) ||
          p.id?.toString().includes(term)
        );
      }
      return true;
    });
  }, [profileItems, filterTab, search]);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 65,
      render: (id) => <span className="font-mono text-xs font-bold text-slate-400">#{id}</span>,
    },
    {
      title: "Profil & To'liq Ism",
      key: "fullName",
      width: 250,
      render: (_, record) => {
        const name = record.fullName || "Ismsiz Profil";
        return (
          <div className="flex items-center gap-3.5 py-1">
            <Avatar
              src={record.avatar}
              size={44}
              className="bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-sm flex-shrink-0 shadow-xs ring-2 ring-indigo-50"
            >
              {name[0]?.toUpperCase()}
            </Avatar>
            <div className="flex flex-col min-w-0">
              <div
                className="font-extrabold text-slate-900 text-sm hover:text-indigo-600 cursor-pointer truncate transition-colors flex items-center gap-1.5"
                onClick={() => {
                  setSelectedProfile(record);
                  setIsDetailModalOpen(true);
                }}
              >
                <span>{name}</span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{record.phoneNumber || "Telefon yo'q"}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Email Manzili",
      dataIndex: "email",
      key: "email",
      width: 210,
      render: (email) =>
        email ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200">
            <Mail className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
            <span className="truncate max-w-[170px]">{email}</span>
          </span>
        ) : (
          <span className="text-slate-400 text-xs italic">— biriktirilmagan —</span>
        ),
    },
    {
      title: "Manzil & Hudud",
      dataIndex: "address",
      key: "address",
      width: 220,
      render: (addr) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 max-w-[200px] truncate">
          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="truncate">{addr || "Manzil ko'rsatilmagan"}</span>
        </div>
      ),
    },
    {
      title: "Hisob Balansi",
      key: "balance",
      width: 160,
      render: (_, record) => {
        const bal = get(record, "user.balance", 0);
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-black text-xs">
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{Number(bal).toLocaleString("uz-UZ")} UZS</span>
          </div>
        );
      },
    },
    {
      title: "Amallar",
      key: "actions",
      width: 80,
      fixed: "right",
      render: (_, record) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Tooltip title="Profil tafsilotlarini ko'rish">
            <button
              type="button"
              aria-label="Profil tafsilotini ko'rish"
              onClick={() => {
                setSelectedProfile(record);
                setIsDetailModalOpen(true);
              }}
              className="btn-action-primary"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Popconfirm
            title="Profilni o'chirish"
            description={`Haqiqatan ham #${record.id} profilni o'chirmoqchimisiz?`}
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Ha, o'chirish"
            cancelText="Bekor"
            okButtonProps={{ danger: true, size: "small" }}
            cancelButtonProps={{ size: "small" }}
          >
            <Tooltip title="O'chirish">
              <button
                type="button"
                aria-label="Profilni o'chirish"
                className="btn-action-danger"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Card */}
      <div className="enterprise-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 m-0 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center">
              <Contact className="w-4 h-4" />
            </div>
            Foydalanuvchi Profillari Reestri
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Platformada to'ldirilgan shaxsiy ma'lumotlar, kontaktlar va manzillar kartotekasi.
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Ism, email yoki telefon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium text-slate-800 outline-none focus:border-blue-700 transition-all w-72"
          />
        </div>
      </div>

      {/* Compact KPI Cards */}
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={6} lg={6}>
          <CompactStatCard
            label="Jami Profillar"
            value={stats.total}
            unit="ta"
            icon={<Contact className="w-4 h-4" />}
            color="blue"
            description="Shaxsiy anketalar"
          />
        </Col>

        <Col xs={12} sm={6} lg={6}>
          <CompactStatCard
            label="Rasmli Profillar"
            value={stats.withAvatar}
            unit="ta"
            icon={<ImageIcon className="w-4 h-4" />}
            color="indigo"
            description="Avatar yuklanganlar"
          />
        </Col>

        <Col xs={12} sm={6} lg={6}>
          <CompactStatCard
            label="Email Biriktirilgan"
            value={stats.withEmail}
            unit="ta"
            icon={<Mail className="w-4 h-4" />}
            color="blue"
            description="Elektron pochta egalari"
          />
        </Col>

        <Col xs={12} sm={6} lg={6}>
          <CompactStatCard
            label="Manzili Borlar"
            value={stats.withAddress}
            unit="ta"
            icon={<MapPin className="w-4 h-4" />}
            color="emerald"
            description="Hududi to'ldirilganlar"
          />
        </Col>
      </Row>

      {/* Main Table Card with Tabs */}
      <div className="enterprise-card p-4 overflow-hidden flex flex-col gap-3">
        {/* Filter Tabs */}
        <div className="border-b border-slate-100 pb-2">
          <Tabs
            activeKey={filterTab}
            onChange={(k) => setFilterTab(k)}
            className="!m-0"
            items={[
              { key: "all", label: <span className="font-semibold text-xs">Barcha Profillar ({stats.total})</span> },
              {
                key: "avatar",
                label: (
                  <span className="font-semibold text-xs text-indigo-700 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                    Rasmli Profillar ({stats.withAvatar})
                  </span>
                ),
              },
              {
                key: "email",
                label: (
                  <span className="font-semibold text-xs text-blue-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    Email Borlar ({stats.withEmail})
                  </span>
                ),
              },
              {
                key: "address",
                label: (
                  <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    Manzili Kiritilganlar ({stats.withAddress})
                  </span>
                ),
              },
            ]}
          />
        </div>

        <Table dataSource={filteredProfiles} columnDefs={columns} isLoading={isLoading} rowKey="id" size="small" />
      </div>

      {/* Profile Detail Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Contact className="w-4 h-4" />
            </div>
            <span className="font-black text-slate-900 text-base">
              Foydalanuvchi Shaxsiy Profili (ID #{selectedProfile?.id})
            </span>
          </div>
        }
        open={isDetailModalOpen}
        onCancel={() => {
          setIsDetailModalOpen(false);
          setSelectedProfile(null);
        }}
        footer={
          selectedProfile ? (
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <Popconfirm
                title="Profilni o'chirishga ishonchingiz komilmi?"
                onConfirm={() => deleteMutation.mutate(selectedProfile.id)}
                okText="Ha, o'chirish"
                cancelText="Bekor"
                okButtonProps={{ danger: true }}
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>O'chirish</span>
                </button>
              </Popconfirm>
              {selectedProfile.userId && (
                <button
                  type="button"
                  onClick={() => navigate(`/users/${selectedProfile.userId}`)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>360° CRM Profiliga O'tish</span>
                </button>
              )}
            </div>
          ) : null
        }
        width={680}
        className="!rounded-3xl"
      >
        {selectedProfile && (
          <div className="flex flex-col gap-5 pt-2">
            {/* Header info */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white flex items-center gap-4 shadow-lg">
              <Avatar
                size={64}
                src={selectedProfile.avatar}
                className="bg-white text-indigo-600 font-black text-xl border-2 border-white/80 shadow-md flex-shrink-0"
              >
                {(selectedProfile.fullName || "P")[0]?.toUpperCase()}
              </Avatar>
              <div>
                <h3 className="text-lg font-black text-white m-0">
                  {selectedProfile.fullName || "Ism ko'rsatilmagan"}
                </h3>
                <div className="text-xs text-indigo-100 font-mono mt-1 flex items-center gap-2">
                  <span>Tel: {selectedProfile.phoneNumber || "Mavjud emas"}</span>
                  <span>•</span>
                  <span>ID: #{selectedProfile.id}</span>
                </div>
              </div>
            </div>

            {/* Profile details */}
            <Descriptions bordered size="small" column={2} className="!rounded-2xl overflow-hidden">
              <Descriptions.Item label="Email">
                <span className="font-semibold text-slate-800">{selectedProfile.email || "Kiritilmagan"}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Hisob Balansi">
                <span className="font-black text-emerald-600">
                  {Number(get(selectedProfile, "user.balance", 0)).toLocaleString("uz-UZ")} UZS
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Viloyat / Tuman">
                <span className="text-slate-700">
                  {selectedProfile.regionId ? `Region #${selectedProfile.regionId}` : "—"} /{" "}
                  {selectedProfile.districtId ? `District #${selectedProfile.districtId}` : "—"}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="To'liq Manzil">
                <span className="text-slate-700">{selectedProfile.address || "Ko'rsatilmagan"}</span>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Profiles;
