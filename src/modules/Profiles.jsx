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
      width: 95,
      render: (_, record) => (
        <div className="flex items-center gap-1.5">
          <Tooltip title="Profil tafsilotlarini ko'rish">
            <button
              type="button"
              onClick={() => {
                setSelectedProfile(record);
                setIsDetailModalOpen(true);
              }}
              className="w-8 h-8 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              <Eye className="w-4 h-4" />
            </button>
          </Tooltip>

          <Popconfirm
            title="Ushbu profilni o'chirishga ishonchingiz komilmi?"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Ha, o'chirish"
            cancelText="Bekor"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="O'chirish">
              <button
                type="button"
                className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 m-0 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
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
            className="pl-10 pr-4 py-2 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all w-72"
          />
        </div>
      </div>

      {/* KPI Cards Bar */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jami Profillar</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{stats.total} ta</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Shaxsiy anketalar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Contact className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-purple-500 uppercase tracking-wider flex items-center gap-1">
                Rasmli Profillar
              </div>
              <div className="text-2xl font-black text-purple-600 mt-1">{stats.withAvatar} ta</div>
              <div className="text-[11px] text-purple-600/70 mt-0.5">Avatar yuklanganlar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1">
                Email Biriktirilgan
              </div>
              <div className="text-2xl font-black text-blue-600 mt-1">{stats.withEmail} ta</div>
              <div className="text-[11px] text-blue-600/70 mt-0.5">Elektron pochta egalari</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                Manzili Borlar
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{stats.withAddress} ta</div>
              <div className="text-[11px] text-emerald-600/70 mt-0.5">Hududi to'ldirilganlar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
          </div>
        </Col>
      </Row>

      {/* Main Table Card with Tabs */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 overflow-hidden flex flex-col gap-4">
        {/* Filter Tabs */}
        <div className="border-b border-slate-100 pb-2">
          <Tabs
            activeKey={filterTab}
            onChange={(k) => setFilterTab(k)}
            className="!m-0"
            items={[
              { key: "all", label: <span className="font-bold">Barcha Profillar ({stats.total})</span> },
              {
                key: "avatar",
                label: (
                  <span className="font-bold text-purple-600 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-purple-500" />
                    Rasmli Profillar ({stats.withAvatar})
                  </span>
                ),
              },
              {
                key: "email",
                label: (
                  <span className="font-bold text-blue-600 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-blue-500" />
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

        <Table dataSource={filteredProfiles} columnDefs={columns} isLoading={isLoading} rowKey="id" />
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
