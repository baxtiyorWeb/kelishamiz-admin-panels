import React, { useState, useCallback, useMemo } from "react";
import Table from "./../components/Table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "./../config/auth/api";
import { get, isArray } from "lodash";
import { useNavigate } from "react-router-dom";
import {
  DatePicker,
  Form,
  message,
  Modal,
  Popconfirm,
  Select,
  Tag,
  Tooltip,
  Button,
  Spin,
  Descriptions,
  Image,
  Space,
  Avatar,
  Input,
  Tabs,
  Row,
  Col,
} from "antd";
import dayjs from "dayjs";
import {
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  Zap,
  Flame,
  Search,
  Tag as TagIcon,
  Layers,
  MapPin,
  Calendar,
  Phone,
  User,
  Heart,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Wand2,
  Undo2,
} from "lucide-react";
import { ProductImageBgModal } from "../components/ProductImageBgModal";

const STATUS_CONFIG = {
  pending: {
    label: "Kutilmoqda",
    color: "warning",
    badgeColor: "bg-amber-500",
    textColor: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
    icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,
  },
  active: {
    label: "Faol",
    color: "success",
    badgeColor: "bg-emerald-500",
    textColor: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-200",
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
  },
  completed: {
    label: "Yakunlangan",
    color: "blue",
    badgeColor: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
    icon: <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />,
  },
  rejected: {
    label: "Rad etilgan",
    color: "error",
    badgeColor: "bg-rose-500",
    textColor: "text-rose-700",
    bgColor: "bg-rose-50 border-rose-200",
    icon: <XCircle className="w-3.5 h-3.5 text-rose-500" />,
  },
};

const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, conf]) => ({
  value,
  label: conf.label,
  icon: conf.icon,
  textColor: conf.textColor,
}));

const checkerboardStyle = {
  backgroundColor: "#f8fafc",
  backgroundImage: `
    linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
    linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
    linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)
  `,
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
};

const Products = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusTab, setStatusTab] = useState("all");
  const [isTopModalOpen, setIsTopModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeProgress, setOptimizeProgress] = useState(0);
  const [searchFilter, setSearchFilter] = useState("");
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);
  const [selectedBgImages, setSelectedBgImages] = useState([]);
  const [selectedGalleryImageIds, setSelectedGalleryImageIds] = useState([]);
  const [form] = Form.useForm();

  // Fetch products list
  const {
    data,
    isLoading,
    isFetching,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["products", page, pageSize],
    queryFn: async () => {
      const response = await api.get(`/products?pageSize=${pageSize}&page=${page}`);
      if (response.status !== 200 || !response.data) {
        throw new Error("Network response was not ok");
      }
      return response.data;
    },
    retry: 2,
  });

  // Fetch single product details
  const {
    data: selectedProductData,
    isLoading: isSelectedProductLoading,
    isError: isSelectedProductError,
    refetch: refetchSelectedProduct,
  } = useQuery({
    queryKey: ["product", selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return null;
      const response = await api.get(`/products/by-id/${selectedProductId}`);
      if (response.status !== 200 || !response.data) {
        throw new Error("Network response was not ok");
      }
      return response.data?.content;
    },
    enabled: !!selectedProductId && isViewModalOpen,
  });

  const handleRevertImage = async (imageId) => {
    if (!selectedProductData?.id || !imageId) return;
    try {
      const res = await api.post(`/ai/products/${selectedProductData.id}/images/${imageId}/revert`);
      message.success(res.data?.message || "Rasm asl holatiga qaytarildi");
      refetchSelectedProduct();
      refetchProducts();
    } catch (err) {
      message.error(err.response?.data?.message || "Xatolik yuz berdi");
    }
  };

  const productItems = useMemo(() => get(data, "content.data", []), [data]);
  const totalProducts = get(data, "content.total", 0);
  const currentPage = get(data, "content.page", 1);

  // Real-time calculated counters
  const stats = useMemo(() => {
    return {
      total: totalProducts || productItems.length,
      pending: productItems.filter((p) => p.status === "pending").length,
      active: productItems.filter((p) => p.status === "active").length,
      top: productItems.filter((p) => p.isTop).length,
    };
  }, [productItems, totalProducts]);

  // Mutations
  const { mutate: updateProductTopStatus } = useMutation({
    mutationFn: async ({ id, isTop, topExpiresAt }) => {
      const response = await api.patch(`/products/${id}/top`, { isTop, topExpiresAt });
      return response.data;
    },
    onSuccess: () => {
      message.success("E'lon TOP holati yangilandi.");
      refetchProducts();
    },
    onError: () => {
      message.error("TOP holatini yangilashda xatolik yuz berdi.");
    },
  });

  const { mutate: updateProductPublishStatus } = useMutation({
    mutationFn: async ({ id, isPublished }) => {
      const response = await api.patch(`/products/${id}/top`, { isPublish: isPublished });
      return response.data;
    },
    onSuccess: () => {
      message.success("Nashr holati yangilandi.");
      refetchProducts();
    },
    onError: () => {
      message.error("Nashr holatini yangilashda xatolik yuz berdi.");
    },
  });

  const { mutate: updateProductStatus } = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await api.patch(`/products/${id}/status`, { status });
      return response.data;
    },
    onMutate: ({ id }) => setStatusUpdatingId(id),
    onSuccess: () => {
      message.success("E'lon moderatsiya holati muvaffaqiyatli yangilandi.");
      refetchProducts();
    },
    onError: (error) => {
      const serverMessage = get(error, "response.data.message");
      message.error(serverMessage || "Statusni yangilashda xatolik yuz berdi.");
      refetchProducts();
    },
    onSettled: () => setStatusUpdatingId(null),
  });

  const { mutate: deleteProduct } = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/products/by-id/${id}`);
      return response.data;
    },
    onSuccess: () => {
      message.success("E'lon o'chirildi.");
      refetchProducts();
      setIsViewModalOpen(false);
    },
    onError: () => {
      message.error("E'lonni o'chirishda xatolik yuz berdi.");
    },
  });

  const handleBulkOptimizeProductImages = useCallback(async () => {
    setIsOptimizing(true);
    setOptimizeProgress(0);
    try {
      let allImageUrls = [];
      const res = await api.get(`/products?pageSize=200&page=1`);
      const items = get(res, "data.content.data", []);
      items.forEach((product) => {
        if (product.images && product.images.length > 0) {
          product.images.forEach((img) => {
            if (img.url) allImageUrls.push(img.url);
          });
        }
      });

      if (allImageUrls.length === 0) {
        message.info("Optimizatsiya qilinadigan rasmli e'lon topilmadi");
        setIsOptimizing(false);
        return;
      }

      allImageUrls = [...new Set(allImageUrls)];
      const chunkSize = 3;
      let optimizedCount = 0;

      for (let i = 0; i < allImageUrls.length; i += chunkSize) {
        const chunk = allImageUrls.slice(i, i + chunkSize);
        try {
          const optimRes = await api.post("/file/bulk-optimize", { urls: chunk });
          const results = optimRes.data?.results || [];
          results.forEach((r) => {
            if (r.success) optimizedCount++;
          });
        } catch (err) {
          console.error("Chunk error", err);
        }
        setOptimizeProgress(Math.round(((i + chunk.length) / allImageUrls.length) * 100));
      }

      queryClient.invalidateQueries({ queryKey: ["products"] });
      message.success(`✅ ${optimizedCount} ta e'lon rasmi muvaffaqiyatli optimallashtirildi!`);
    } catch (err) {
      message.error("Optimizatsiya xatosi yuz berdi");
    } finally {
      setIsOptimizing(false);
      setOptimizeProgress(0);
    }
  }, [queryClient]);

  const handleTopModalOk = () => {
    form.validateFields().then((values) => {
      updateProductTopStatus({
        id: selectedProductId,
        isTop: true,
        topExpiresAt: values.topExpiresAt,
      });
      setIsTopModalOpen(false);
      form.resetFields();
    });
  };

  const filteredItems = useMemo(() => {
    return productItems.filter((p) => {
      if (statusTab === "pending" && p.status !== "pending") return false;
      if (statusTab === "active" && p.status !== "active") return false;
      if (statusTab === "top" && !p.isTop) return false;
      if (statusTab === "rejected" && p.status !== "rejected") return false;

      if (searchFilter.trim()) {
        const term = searchFilter.toLowerCase();
        return (
          p.title?.toLowerCase().includes(term) ||
          p.category?.name?.toLowerCase().includes(term) ||
          p.id?.toString().includes(term) ||
          p.profile?.fullName?.toLowerCase().includes(term) ||
          p.profile?.user?.username?.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [productItems, statusTab, searchFilter]);

  const columns = [
    {
      title: "E'lon & Media",
      key: "product",
      width: 280,
      render: (_, record) => {
        const firstImg = record.images?.[0]?.url;
        const imgCount = record.images?.length || 0;
        return (
          <div className="flex items-center gap-3.5 py-1.5">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 shadow-sm group cursor-pointer">
              {firstImg ? (
                <img
                  src={firstImg}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onClick={() => {
                    setSelectedProductId(record.id);
                    setIsViewModalOpen(true);
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon className="w-5 h-5 text-slate-300" />
                  <span className="text-[9px] font-bold mt-0.5">Rasm yo'q</span>
                </div>
              )}
              {imgCount > 1 && (
                <div className="absolute bottom-1 right-1 bg-slate-950/80 backdrop-blur-md text-[9px] text-white font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <span>+{imgCount - 1}</span>
                </div>
              )}
            </div>
            <div className="max-w-[210px] flex flex-col gap-1">
              <div
                className="font-extrabold text-slate-800 text-sm hover:text-indigo-600 cursor-pointer truncate transition-colors leading-snug"
                onClick={() => {
                  setSelectedProductId(record.id);
                  setIsViewModalOpen(true);
                }}
              >
                {record.title}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="font-mono text-slate-400 font-semibold">#{record.id}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold text-[10px] truncate">
                  <Layers className="w-3 h-3 text-purple-500 flex-shrink-0" />
                  {record.category?.name || "Kategoriyasiz"}
                </span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Narxi",
      key: "price",
      width: 160,
      render: (_, record) => (
        <div className="flex flex-col">
          <div className="font-black text-slate-900 text-sm tracking-tight flex items-center gap-1">
            <span>{Number(record.price || 0).toLocaleString("uz-UZ")}</span>
            <span className="text-xs text-slate-500 font-bold">{record.currencyType || "UZS"}</span>
          </div>
          {record.negotiable && (
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md w-max mt-0.5">
              🤝 Kelishiladi
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Sotuvchi",
      key: "seller",
      width: 190,
      render: (_, record) => {
        const owner = record.profile?.fullName || record.profile?.user?.username || "Noma'lum";
        const phone = record.profile?.phone || record.profile?.user?.phone;
        const userId = record.profile?.userId || record.userId;
        return (
          <div className="flex items-center gap-2.5">
            <Avatar className="bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex-shrink-0 shadow-sm" size={32}>
              {owner[0]?.toUpperCase()}
            </Avatar>
            <div className="flex flex-col min-w-0">
              <div
                className="font-bold text-slate-800 text-xs hover:text-indigo-600 cursor-pointer truncate transition-colors"
                onClick={() => userId && navigate(`/users/${userId}`)}
              >
                {owner}
              </div>
              {phone && (
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {phone}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Moderatsiya Holati",
      dataIndex: "status",
      key: "status",
      width: 170,
      render: (status, record) => {
        const current = status || "pending";
        return (
          <Select
            value={current}
            loading={statusUpdatingId === record.id}
            disabled={statusUpdatingId === record.id}
            onChange={(val) => updateProductStatus({ id: record.id, status: val })}
            className="w-36 !rounded-xl"
          >
            {STATUS_OPTIONS.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  {opt.icon}
                  <span>{opt.label}</span>
                </div>
              </Select.Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: "Tezkor Moderatsiya",
      key: "quick_actions",
      width: 180,
      render: (_, record) => {
        if (record.status === "pending") {
          return (
            <div className="flex items-center gap-1.5">
              <Tooltip title="Tasdiqlash (Saytda e'lon qilish)">
                <button
                  type="button"
                  onClick={() => updateProductStatus({ id: record.id, status: "active" })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Qabul</span>
                </button>
              </Tooltip>
              <Tooltip title="Rad etish">
                <button
                  type="button"
                  onClick={() => updateProductStatus({ id: record.id, status: "rejected" })}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 font-bold text-xs transition-all cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Rad</span>
                </button>
              </Tooltip>
            </div>
          );
        }
        const cfg = STATUS_CONFIG[record.status] || STATUS_CONFIG.pending;
        return (
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bgColor} ${cfg.textColor}`}>
            {cfg.icon}
            <span>{cfg.label}</span>
          </div>
        );
      },
    },
    {
      title: "TOP & Boost",
      key: "isTop",
      width: 140,
      render: (_, record) => {
        if (record.isTop) {
          return (
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-extrabold text-[11px] shadow-sm shadow-orange-500/20">
                <Flame className="w-3.5 h-3.5 fill-white text-white" />
                <span>TOP VIP</span>
              </div>
              <Popconfirm
                title="TOP dan olib tashlaysizmi?"
                onConfirm={() =>
                  updateProductTopStatus({ id: record.id, isTop: false, topExpiresAt: null })
                }
                okText="Ha"
                cancelText="Bekor"
              >
                <button
                  type="button"
                  className="text-rose-500 hover:text-rose-700 text-xs font-bold underline cursor-pointer p-0"
                >
                  Bekor
                </button>
              </Popconfirm>
            </div>
          );
        }
        return (
          <button
            type="button"
            onClick={() => {
              setSelectedProductId(record.id);
              setIsTopModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-200 hover:border-amber-300 font-bold text-xs transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>TOP qilish</span>
          </button>
        );
      },
    },
    {
      title: "Amallar",
      key: "actions",
      width: 95,
      render: (_, record) => (
        <div className="flex items-center gap-1.5">
          <Tooltip title="Batafsil ko'rish">
            <button
              type="button"
              onClick={() => {
                setSelectedProductId(record.id);
                setIsViewModalOpen(true);
              }}
              className="w-8 h-8 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              <Eye className="w-4 h-4" />
            </button>
          </Tooltip>

          <Popconfirm
            title="E'lonni o'chirishga ishonchingiz komilmi?"
            description="O'chirilgach ma'lumotlar qayta tiklanmaydi."
            onConfirm={() => deleteProduct(record.id)}
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
              <TagIcon className="w-4 h-4" />
            </div>
            E'lonlar & Moderatsiya Markazi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Foydalanuvchilar joylagan e'lonlarni tekshirish, 1-klikda tasdiqlash va TOP statuslarini boshqarish.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Nomi, ID yoki sotuvchi..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all w-60"
            />
          </div>

          <Popconfirm
            title="Barcha rasmlarni Bunny CDN ga optimize qilish?"
            description="WebP formatiga o'tkaziladi va ilova yuklanishi 3 barobar tezlashadi."
            onConfirm={handleBulkOptimizeProductImages}
            okText="Ha, boshlash"
            cancelText="Bekor"
            disabled={isOptimizing}
          >
            <button
              type="button"
              disabled={isOptimizing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-amber-600 fill-amber-600" />
              <span>{isOptimizing ? `Optimize... ${optimizeProgress}%` : "⚡ Rasmlarni Optimize"}</span>
            </button>
          </Popconfirm>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jami E'lonlar</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{stats.total} ta</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Barcha yuklangan e'lonlar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                Moderatsiyada
              </div>
              <div className="text-2xl font-black text-amber-600 mt-1">{stats.pending} ta</div>
              <div className="text-[11px] text-amber-600/70 mt-0.5">Tasdiqlash kutilmoqda</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                Faol E'lonlar
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{stats.active} ta</div>
              <div className="text-[11px] text-emerald-600/70 mt-0.5">Saytda ochiq sotuvda</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1">
                TOP / VIP Boost
              </div>
              <div className="text-2xl font-black text-indigo-600 mt-1">{stats.top} ta</div>
              <div className="text-[11px] text-indigo-600/70 mt-0.5">Yuqori o'rinda turganlar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Flame className="w-6 h-6" />
            </div>
          </div>
        </Col>
      </Row>

      {/* Main Table with Tabs */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 overflow-hidden flex flex-col gap-4">
        {/* Status Tabs */}
        <div className="border-b border-slate-100 pb-2">
          <Tabs
            activeKey={statusTab}
            onChange={(key) => setStatusTab(key)}
            className="!m-0"
            items={[
              {
                key: "all",
                label: (
                  <span className="font-bold flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-slate-500" />
                    Barchasi ({totalProducts})
                  </span>
                ),
              },
              {
                key: "pending",
                label: (
                  <span className="font-bold text-amber-600 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Kutilmoqda ({stats.pending})
                  </span>
                ),
              },
              {
                key: "active",
                label: (
                  <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Faol ({stats.active})
                  </span>
                ),
              },
              {
                key: "top",
                label: (
                  <span className="font-bold text-indigo-600 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-indigo-500" />
                    TOP VIP ({stats.top})
                  </span>
                ),
              },
              {
                key: "rejected",
                label: (
                  <span className="font-bold text-rose-600 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-500" />
                    Rad etilganlar
                  </span>
                ),
              },
            ]}
          />
        </div>

        <Table
          dataSource={filteredItems}
          columnDefs={columns}
          isLoading={isLoading}
          page={currentPage}
          pageSize={pageSize}
          total={totalProducts}
          setPage={setPage}
          setPageSize={setPageSize}
        />
      </div>

      {/* TOP modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span className="font-extrabold text-slate-900">E'lonni TOP ga Chiqarish</span>
          </div>
        }
        open={isTopModalOpen}
        onOk={handleTopModalOk}
        onCancel={() => {
          setIsTopModalOpen(false);
          form.resetFields();
        }}
        okText="TOP qilish"
        cancelText="Bekor"
        okButtonProps={{ className: "!bg-amber-500 !border-amber-500 font-bold" }}
        className="!rounded-3xl"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="topExpiresAt"
            label="TOP tugash muddati"
            rules={[{ required: true, message: "Sanani tanlang!" }]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" className="w-full !rounded-xl h-11" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Product Detail Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TagIcon className="w-4 h-4" />
            </div>
            <span className="font-black text-slate-900 text-base">
              E'lon Tafsilotlari & Moderatsiya (ID #{selectedProductId})
            </span>
          </div>
        }
        open={isViewModalOpen}
        onCancel={() => {
          setIsViewModalOpen(false);
          setSelectedProductId(null);
        }}
        footer={
          selectedProductData ? (
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <Popconfirm
                title="E'lonni butunlay o'chirishga ishonchingiz komilmi?"
                onConfirm={() => deleteProduct(selectedProductData.id)}
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
              <div className="flex gap-2">
                {selectedProductData.status !== "active" && (
                  <button
                    type="button"
                    onClick={() => {
                      updateProductStatus({ id: selectedProductData.id, status: "active" });
                      setIsViewModalOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tasdiqlash (Faol qilish)</span>
                  </button>
                )}
                {selectedProductData.status !== "rejected" && (
                  <button
                    type="button"
                    onClick={() => {
                      updateProductStatus({ id: selectedProductData.id, status: "rejected" });
                      setIsViewModalOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Rad etish</span>
                  </button>
                )}
              </div>
            </div>
          ) : null
        }
        width={860}
        className="!rounded-3xl"
      >
        {isSelectedProductLoading ? (
          <div className="flex justify-center items-center h-48">
            <Spin size="large" />
          </div>
        ) : isSelectedProductError || !selectedProductData ? (
          <div className="text-rose-500 text-center py-6">Ma'lumot topilmadi yoki xatolik yuz berdi.</div>
        ) : (
          <div className="flex flex-col gap-5 pt-2">
            {/* Header info */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row justify-between items-start gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 m-0">{selectedProductData.title}</h3>
                <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold">
                    <Layers className="w-3 h-3 text-purple-500" />
                    {selectedProductData.category?.name || "Kategoriyasiz"}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {selectedProductData.location || "O'zbekiston"}
                  </span>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-2xl font-black text-emerald-600">
                  {Number(selectedProductData.price || 0).toLocaleString("uz-UZ")} {selectedProductData.currencyType}
                </div>
                <div className="mt-1">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_CONFIG[selectedProductData.status]?.bgColor || "bg-slate-50"} ${STATUS_CONFIG[selectedProductData.status]?.textColor || "text-slate-700"}`}>
                    {STATUS_CONFIG[selectedProductData.status]?.icon}
                    <span>{STATUS_CONFIG[selectedProductData.status]?.label || selectedProductData.status}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Photos Lightbox Gallery with AI Background Removal Actions */}
            {selectedProductData.images?.length > 0 && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-500" />
                    Yuklangan Rasmlar Galereyasi ({selectedProductData.images.length} ta)
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedGalleryImageIds.length === selectedProductData.images.length) {
                          setSelectedGalleryImageIds([]);
                        } else {
                          setSelectedGalleryImageIds(selectedProductData.images.map((img) => img.id));
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                    >
                      {selectedGalleryImageIds.length === selectedProductData.images.length
                        ? "Tanlovni bekor qilish"
                        : "Barchasini tanlash"}
                    </button>

                    {selectedGalleryImageIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const toProcess = selectedProductData.images.filter((img) =>
                            selectedGalleryImageIds.includes(img.id)
                          );
                          setSelectedBgImages(toProcess);
                          setIsBgModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-xs shadow-sm shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Fonni tozalash ({selectedGalleryImageIds.length} ta)</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pb-2">
                  {selectedProductData.images.map((img, idx) => {
                    const isSelected = selectedGalleryImageIds.includes(img.id);
                    return (
                      <div
                        key={img.id || idx}
                        className={`group relative rounded-2xl overflow-hidden border-2 transition-all bg-white flex flex-col ${
                          isSelected
                            ? "border-indigo-600 shadow-md ring-2 ring-indigo-600/20"
                            : "border-slate-200 hover:border-indigo-300 shadow-xs"
                        }`}
                      >
                        {/* Checkbox for batch selection */}
                        <div className="absolute top-2 left-2 z-20">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (e.target.checked) {
                                setSelectedGalleryImageIds((prev) => [...prev, img.id]);
                              } else {
                                setSelectedGalleryImageIds((prev) =>
                                  prev.filter((id) => id !== img.id)
                                );
                              }
                            }}
                            className="w-4 h-4 rounded-md accent-indigo-600 cursor-pointer shadow-xs"
                          />
                        </div>

                        {/* Direct Single Action: Fonni tozalash button on hover */}
                        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Tooltip title="AI orqali fonni tozalash">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBgImages([img]);
                                setIsBgModalOpen(true);
                              }}
                              className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md transition-all cursor-pointer active:scale-90"
                            >
                              <Wand2 className="w-3.5 h-3.5" />
                            </button>
                          </Tooltip>

                          {img.originalUrl && (
                            <Popconfirm
                              title="Asl nusxaga qaytarish?"
                              description="Fon tozalangan rasm o'rniga asl rasm tiklanadi."
                              onConfirm={() => handleRevertImage(img.id)}
                              okText="Ha, qaytarish"
                              cancelText="Bekor"
                            >
                              <Tooltip title="Asl nusxasiga qaytarish">
                                <button
                                  type="button"
                                  className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-md transition-all cursor-pointer active:scale-90"
                                >
                                  <Undo2 className="w-3.5 h-3.5" />
                                </button>
                              </Tooltip>
                            </Popconfirm>
                          )}
                        </div>

                        {/* Image Preview with checkerboard if bg removed */}
                        <div
                          className="h-28 w-full flex items-center justify-center overflow-hidden"
                          style={img.isBgRemoved ? checkerboardStyle : { backgroundColor: "#f8fafc" }}
                        >
                          <Image
                            src={img.url}
                            alt={`Product image ${idx + 1}`}
                            height={112}
                            width="100%"
                            className="!object-contain hover:scale-105 transition-transform"
                          />
                        </div>

                        {/* Bottom image badge info */}
                        <div className="p-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="font-mono text-slate-400 font-bold">#{idx + 1}</span>
                          {img.isBgRemoved ? (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Shaffof
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">Asl rasm</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">E'lon Tavsifi</div>
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {selectedProductData.description || "Tavsif berilmagan."}
              </div>
            </div>

            {/* Seller info */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="bg-indigo-600 text-white font-bold" size={40}>
                  {(selectedProductData.profile?.fullName || selectedProductData.profile?.user?.username || "U")[0]?.toUpperCase()}
                </Avatar>
                <div>
                  <div className="font-extrabold text-slate-900 text-sm">
                    {selectedProductData.profile?.fullName || selectedProductData.profile?.user?.username || "Noma'lum sotuvchi"}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {selectedProductData.profile?.phone || selectedProductData.profile?.user?.phone || "Tel yo'q"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4 text-slate-400" /> {selectedProductData.viewCount || 0} ko'rish
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> {selectedProductData.likesCount || 0} yoqdi
                </span>
                <span className="flex items-center gap-1 text-slate-400 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  {dayjs(selectedProductData.createdAt).format("YYYY-MM-DD HH:mm")}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
      {/* AI Background Removal Modal */}
      <ProductImageBgModal
        open={isBgModalOpen}
        onClose={() => {
          setIsBgModalOpen(false);
          setSelectedBgImages([]);
        }}
        productId={selectedProductData?.id}
        images={selectedBgImages}
        onSuccess={() => {
          refetchSelectedProduct();
          refetchProducts();
          setSelectedGalleryImageIds([]);
        }}
      />
    </div>
  );
};

export default Products;
