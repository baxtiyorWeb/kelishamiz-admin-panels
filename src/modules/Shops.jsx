import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../config/auth/api";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Tag,
  Input,
  Space,
  Avatar,
  message,
  Tooltip,
  Modal,
  Descriptions,
  Image,
  Tabs,
  Row,
  Col,
} from "antd";
import dayjs from "dayjs";
import {
  Store,
  BadgeCheck,
  CheckCircle2,
  XCircle,
  Search,
  Phone,
  MapPin,
  Star,
  Users,
  Eye,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  ShoppingBag,
} from "lucide-react";

const Shops = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [filterTab, setFilterTab] = useState("all");
  const [selectedShop, setSelectedShop] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["adminShops", page, pageSize, search],
    queryFn: async () => {
      const res = await api.get("/admin/shops", {
        params: { page, limit: pageSize, search },
      });
      return res.data?.content || res.data;
    },
  });

  const rawShops = useMemo(() => {
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  const totalShops = data?.total || rawShops.length;

  // Real-time statistics
  const stats = useMemo(() => {
    const total = totalShops;
    const verified = rawShops.filter((s) => s.isVerified).length;
    const totalFollowers = rawShops.reduce((acc, s) => acc + (s.followersCount || 0), 0);
    const avgRating = rawShops.length
      ? (rawShops.reduce((acc, s) => acc + Number(s.rating || 0), 0) / rawShops.length).toFixed(1)
      : "5.0";

    return {
      total,
      verified,
      totalFollowers,
      avgRating,
    };
  }, [rawShops, totalShops]);

  // Tab filtered shops
  const filteredShops = useMemo(() => {
    return rawShops.filter((shop) => {
      if (filterTab === "verified" && !shop.isVerified) return false;
      if (filterTab === "unverified" && shop.isVerified) return false;
      if (filterTab === "top_rated" && Number(shop.rating || 0) < 4.5) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          shop.name?.toLowerCase().includes(q) ||
          shop.username?.toLowerCase().includes(q) ||
          shop.phone?.includes(q) ||
          shop.address?.toLowerCase().includes(q) ||
          shop.id?.toString().includes(q)
        );
      }
      return true;
    });
  }, [rawShops, filterTab, search]);

  const verifyMutation = useMutation({
    mutationFn: async (id) => {
      return (await api.post(`/admin/shops/${id}/verify`)).data;
    },
    onSuccess: () => {
      message.success("Do'kon verifikatsiya holati muvaffaqiyatli yangilandi!");
      queryClient.invalidateQueries({ queryKey: ["adminShops"] });
    },
    onError: () => {
      message.error("Do'konni tasdiqlashda xatolik yuz berdi");
    },
  });

  const columns = [
    {
      title: "Do'kon & Brend",
      key: "shop",
      width: 270,
      render: (_, record) => (
        <div className="flex items-center gap-3.5 py-1">
          <div className="relative">
            <Avatar
              size={52}
              src={record.logoUrl}
              icon={<Store className="w-6 h-6 text-indigo-500" />}
              className="bg-indigo-50 text-indigo-600 font-black rounded-2xl shadow-xs border border-indigo-100 flex-shrink-0 flex items-center justify-center"
            />
            {record.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-sm">
                <BadgeCheck className="w-3.5 h-3.5 fill-white text-blue-500" />
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <div
              className="font-black text-slate-900 text-sm hover:text-indigo-600 cursor-pointer flex items-center gap-1.5 truncate transition-colors"
              onClick={() => {
                setSelectedShop(record);
                setIsDetailModalOpen(true);
              }}
            >
              <span className="truncate">{record.name}</span>
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              @{record.username || "nomlanmagan"} • #{record.id}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Aloqa & Manzil",
      key: "contact",
      width: 200,
      render: (_, record) => (
        <div className="text-xs flex flex-col gap-1">
          <div className="font-bold text-slate-800 flex items-center gap-1.5 font-mono">
            <Phone className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span>{record.phone || "Telefon yo'q"}</span>
          </div>
          <div className="text-slate-500 flex items-center gap-1.5 truncate max-w-[190px]">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{record.address || "Manzil kiritilmagan"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Egasi (Seller)",
      key: "user",
      width: 180,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Avatar className="bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs" size={28}>
            {(record.user?.username || "U")[0]?.toUpperCase()}
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span
              className="text-xs font-bold text-slate-800 hover:text-indigo-600 cursor-pointer truncate"
              onClick={() => record.user?.id && navigate(`/users/${record.user.id}`)}
            >
              {record.user ? `@${record.user.username}` : `User #${record.userId}`}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">ID: #{record.user?.id || record.userId}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Reyting & Statistika",
      key: "stats",
      width: 170,
      render: (_, record) => (
        <div className="text-xs flex flex-col gap-1">
          <div className="font-extrabold text-amber-500 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{Number(record.rating || 0).toFixed(1)}</span>
            <span className="text-slate-400 font-normal">({record.reviewsCount || 0} sharh)</span>
          </div>
          <div className="text-slate-600 flex items-center gap-1 font-medium">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{record.followersCount || 0} obunachi</span>
          </div>
        </div>
      ),
    },
    {
      title: "Holat",
      key: "status",
      width: 160,
      render: (_, record) => (
        <div>
          {record.isVerified ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <BadgeCheck className="w-3.5 h-3.5 fill-blue-600 text-white" />
              <span>Verifikatsiyalangan</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Oddiy Do'kon</span>
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Amallar",
      key: "actions",
      width: 170,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={verifyMutation.isPending}
            onClick={() => verifyMutation.mutate(record.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer ${
              record.isVerified
                ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30"
            }`}
          >
            {record.isVerified ? (
              <>
                <XCircle className="w-3.5 h-3.5" />
                <span>Bekor</span>
              </>
            ) : (
              <>
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>Tasdiqlash</span>
              </>
            )}
          </button>

          <Tooltip title="Do'kon tafsilotlarini ko'rish">
            <button
              type="button"
              onClick={() => {
                setSelectedShop(record);
                setIsDetailModalOpen(true);
              }}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4" />
            </button>
          </Tooltip>
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
              <Store className="w-4 h-4" />
            </div>
            Do'konlar & Brend Savdo Nuqtalari
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Platformadagi biznes do'konlar, ularning rasmiy verifikatsiya maqomi va savdo faolligi.
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Do'kon nomi, username yoki tel..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 pr-4 py-2 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all w-72"
          />
        </div>
      </div>

      {/* KPI Cards Bar */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jami Do'konlar</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{stats.total} ta</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Ro'yxatdan o'tgan bizneslar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1">
                Verifikatsiyalangan
              </div>
              <div className="text-2xl font-black text-blue-600 mt-1">{stats.verified} ta</div>
              <div className="text-[11px] text-blue-600/70 mt-0.5">Rasmiy tasdiqlangan brendlar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BadgeCheck className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                O'rtacha Reyting
              </div>
              <div className="text-2xl font-black text-amber-500 mt-1 flex items-center gap-1">
                <Star className="w-5 h-5 fill-amber-400" />
                <span>{stats.avgRating} / 5.0</span>
              </div>
              <div className="text-[11px] text-amber-600/70 mt-0.5">Xaridorlar fikrlari bo'yicha</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                Jami Obunachilar
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{stats.totalFollowers.toLocaleString()}</div>
              <div className="text-[11px] text-emerald-600/70 mt-0.5">Mijozlar audotoriyasi</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </Col>
      </Row>

      {/* Main Table with Tabs */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 overflow-hidden flex flex-col gap-4">
        {/* Filter Tabs */}
        <div className="border-b border-slate-100 pb-2">
          <Tabs
            activeKey={filterTab}
            onChange={(key) => setFilterTab(key)}
            className="!m-0"
            items={[
              {
                key: "all",
                label: (
                  <span className="font-bold flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-slate-500" />
                    Barcha Do'konlar ({totalShops})
                  </span>
                ),
              },
              {
                key: "verified",
                label: (
                  <span className="font-bold text-blue-600 flex items-center gap-1.5">
                    <BadgeCheck className="w-4 h-4 text-blue-500" />
                    Verifikatsiyalangan ({stats.verified})
                  </span>
                ),
              },
              {
                key: "unverified",
                label: (
                  <span className="font-bold text-slate-600 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    Oddiy Do'konlar ({stats.total - stats.verified})
                  </span>
                ),
              },
              {
                key: "top_rated",
                label: (
                  <span className="font-bold text-amber-600 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500" />
                    Yuqori Reytingli (4.5+)
                  </span>
                ),
              },
            ]}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredShops}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize,
            total: totalShops,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showSizeChanger: true,
            className: "px-4 py-2 !m-0",
          }}
        />
      </div>

      {/* Shop Detail Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <span className="font-black text-slate-900 text-base">
              Do'kon Tafsilotlari & Profil (ID #{selectedShop?.id})
            </span>
          </div>
        }
        open={isDetailModalOpen}
        onCancel={() => {
          setIsDetailModalOpen(false);
          setSelectedShop(null);
        }}
        footer={
          selectedShop ? (
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                Yaratilgan: {dayjs(selectedShop.createdAt).format("YYYY-MM-DD HH:mm")}
              </span>
              <button
                type="button"
                onClick={() => {
                  verifyMutation.mutate(selectedShop.id);
                  setIsDetailModalOpen(false);
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer ${
                  selectedShop.isVerified
                    ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30"
                }`}
              >
                {selectedShop.isVerified ? (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Verifikatsiyani Bekor Qilish</span>
                  </>
                ) : (
                  <>
                    <BadgeCheck className="w-4 h-4" />
                    <span>Rasmiy Verifikatsiya Berish</span>
                  </>
                )}
              </button>
            </div>
          ) : null
        }
        width={720}
        className="!rounded-3xl"
      >
        {selectedShop && (
          <div className="flex flex-col gap-5 pt-2">
            {/* Banner & Logo Card */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 text-white shadow-lg">
              {selectedShop.bannerUrl && (
                <img
                  src={selectedShop.bannerUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
                />
              )}
              <div className="relative z-10 flex items-center gap-4">
                <Avatar
                  size={64}
                  src={selectedShop.logoUrl}
                  icon={<Store className="w-8 h-8 text-indigo-600" />}
                  className="bg-white text-indigo-600 font-bold border-2 border-white/80 shadow-md flex-shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white m-0">{selectedShop.name}</h2>
                    {selectedShop.isVerified && (
                      <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white flex items-center gap-1 border border-white/30">
                        <BadgeCheck className="w-3 h-3 fill-white text-indigo-600" />
                        VERIFIED
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-indigo-100 font-mono mt-0.5">
                    @{selectedShop.username || "noma'lum"} • ID: #{selectedShop.id}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {selectedShop.description && (
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Do'kon Haqida Ma'lumot
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 leading-relaxed">
                  {selectedShop.description}
                </div>
              </div>
            )}

            {/* Shop Details Info */}
            <Descriptions bordered size="small" column={2} className="!rounded-2xl overflow-hidden">
              <Descriptions.Item label="Telefon">
                <span className="font-mono font-bold text-slate-800">{selectedShop.phone || "Ko'rsatilmagan"}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Manzil">
                <span className="text-slate-700">{selectedShop.address || "Kiritilmagan"}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Do'kon Egasi">
                <span
                  className="font-bold text-indigo-600 cursor-pointer"
                  onClick={() => selectedShop.user?.id && navigate(`/users/${selectedShop.user.id}`)}
                >
                  {selectedShop.user ? `@${selectedShop.user.username} (ID #${selectedShop.user.id})` : `User #${selectedShop.userId}`}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Reyting / Obunachilar">
                ⭐ {Number(selectedShop.rating || 0).toFixed(1)} ({selectedShop.reviewsCount || 0} sharh) • 👥 {selectedShop.followersCount || 0} obunachi
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Shops;
