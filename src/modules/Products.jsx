import React, { useState, useCallback, useMemo } from "react";
import Table from "./../components/Table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "./../config/auth/api";
import { get, isArray } from "lodash";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { CompactStatCard } from "../components/CompactStatCard";
import UserReference from "../components/UserReference";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const initialStatus = searchParams.get("status") || "all";
  const [statusTab, setStatusTab] = useState(initialStatus);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkRejectModalOpen, setBulkRejectModalOpen] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  const [revertModalOpen, setRevertModalOpen] = useState(false);
  const [revertTargetListing, setRevertTargetListing] = useState(null);
  const [revertTargetStatus, setRevertTargetStatus] = useState("pending");
  const [revertReason, setRevertReason] = useState("");
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
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetListing, setRejectTargetListing] = useState(null);
  const [rejectReasonType, setRejectReasonType] = useState("Talablarga javob bermaydi");
  const [rejectCustomReason, setRejectCustomReason] = useState("");
  const [form] = Form.useForm();

  // Fetch products list via Admin Listings API with server-side pagination, status filter, and search
  const {
    data,
    isLoading,
    isFetching,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["admin-listings", page, pageSize, statusTab, searchFilter],
    queryFn: async () => {
      const statusParam = statusTab === "all" || statusTab === "top" ? "" : statusTab;
      const response = await api.get(
        `/admin/listings?page=${page}&limit=${pageSize}&status=${statusParam}&search=${encodeURIComponent(searchFilter)}`
      );
      if (response.status !== 200 || !response.data) {
        throw new Error("Network response was not ok");
      }
      return response.data;
    },
    retry: 2,
    keepPreviousData: true,
  });

  // Fetch admin dashboard stats for accurate system-wide counters
  const { data: dashboardStatsData, refetch: refetchStats } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/admin/dashboard/stats");
      return res.data?.content || res.data;
    },
    staleTime: 30000,
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
      return response.data?.content || response.data;
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

  const productItems = useMemo(() => {
    return get(data, "content.data", get(data, "data", []));
  }, [data]);
  const totalProducts = get(data, "content.total", get(data, "total", 0));
  const currentPage = get(data, "content.page", get(data, "page", 1));

  // Real-time calculated counters from system stats
  const stats = useMemo(() => {
    const kpi = dashboardStatsData?.kpi;
    return {
      total: kpi?.totalListings ?? totalProducts,
      pending: kpi?.pendingListings ?? productItems.filter((p) => p.status === "pending").length,
      active: kpi?.activeListings ?? productItems.filter((p) => p.status === "active").length,
      top: productItems.filter((p) => p.isTop).length,
    };
  }, [dashboardStatsData, totalProducts, productItems]);

  // Approve listing mutation
  const { mutate: approveListing } = useMutation({
    mutationFn: async (id) => {
      const response = await api.post(`/admin/listings/${id}/approve`);
      return response.data;
    },
    onMutate: (id) => setStatusUpdatingId(id),
    onSuccess: () => {
      message.success("E'lon tasdiqlandi va faollashtirildi.");
      refetchProducts();
      refetchStats();
    },
    onError: (error) => {
      const serverMessage = get(error, "response.data.message");
      message.error(serverMessage || "Tasdiqlashda xatolik yuz berdi.");
    },
    onSettled: () => setStatusUpdatingId(null),
  });

  // Reject listing mutation
  const { mutate: rejectListing } = useMutation({
    mutationFn: async ({ id, reason }) => {
      const response = await api.post(`/admin/listings/${id}/reject`, { reason });
      return response.data;
    },
    onMutate: ({ id }) => setStatusUpdatingId(id),
    onSuccess: () => {
      message.success("E'lon rad etildi.");
      refetchProducts();
      refetchStats();
      setRejectModalOpen(false);
      setRejectTargetListing(null);
      setRejectCustomReason("");
    },
    onError: (error) => {
      const serverMessage = get(error, "response.data.message");
      message.error(serverMessage || "Rad etishda xatolik yuz berdi.");
    },
    onSettled: () => setStatusUpdatingId(null),
  });

  const openRejectModal = (listing) => {
    setRejectTargetListing(listing);
    setRejectReasonType("Talablarga javob bermaydi");
    setRejectCustomReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (!rejectTargetListing) return;
    const finalReason =
      rejectReasonType === "Boshqa"
        ? rejectCustomReason.trim() || "Talablarga javob bermaydi"
        : rejectCustomReason.trim()
        ? `${rejectReasonType}: ${rejectCustomReason.trim()}`
        : rejectReasonType;
    rejectListing({ id: rejectTargetListing.id, reason: finalReason });
  };

  // Safe Bulk Operations
  const bulkApproveMutation = useMutation({
    mutationFn: async (listingIds) => {
      const res = await api.post("/admin/listings/bulk-approve", { listingIds });
      return res.data;
    },
    onSuccess: (resData) => {
      const results = resData?.content?.results || [];
      const successes = results.filter((r) => r.success).length;
      const failures = results.filter((r) => !r.success).length;
      if (failures === 0) {
        message.success(`${successes} ta e'lon muvaffaqiyatli tasdiqlandi!`);
      } else {
        message.warning(`${successes} ta tasdiqlandi, ${failures} tasida xatolik yuz berdi.`);
      }
      setSelectedRowKeys([]);
      refetchProducts();
      refetchStats();
    },
    onError: (err) => {
      message.error(err.response?.data?.message || "Ommaviy tasdiqlashda xatolik");
    },
  });

  const bulkRejectMutation = useMutation({
    mutationFn: async ({ listingIds, reason }) => {
      const res = await api.post("/admin/listings/bulk-reject", { listingIds, reason });
      return res.data;
    },
    onSuccess: (resData) => {
      const results = resData?.content?.results || [];
      const successes = results.filter((r) => r.success).length;
      const failures = results.filter((r) => !r.success).length;
      if (failures === 0) {
        message.success(`${successes} ta e'lon rad etildi.`);
      } else {
        message.warning(`${successes} ta rad etildi, ${failures} tasida xatolik yuz berdi.`);
      }
      setSelectedRowKeys([]);
      setBulkRejectModalOpen(false);
      setBulkRejectReason("");
      refetchProducts();
      refetchStats();
    },
    onError: (err) => {
      message.error(err.response?.data?.message || "Ommaviy rad etishda xatolik");
    },
  });

  // Safe Revert Status (Compensating Undo)
  const revertStatusMutation = useMutation({
    mutationFn: async ({ id, targetStatus, reason }) => {
      const res = await api.post(`/admin/listings/${id}/revert-status`, { targetStatus, reason });
      return res.data;
    },
    onSuccess: (resData) => {
      message.success(resData?.message || "E'lon holati qaytarildi!");
      setRevertModalOpen(false);
      setRevertTargetListing(null);
      setRevertReason("");
      refetchProducts();
      refetchStats();
    },
    onError: (err) => {
      message.error(err.response?.data?.message || "Holatni qaytarishda xatolik");
    },
  });

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
      const response = await api.patch(`/products/${id}/publish`, { isPublish: isPublished });
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
      refetchStats();
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
      const response = await api.delete(`/admin/listings/${id}`);
      return response.data;
    },
    onSuccess: () => {
      message.success("E'lon o'chirildi.");
      refetchProducts();
      refetchStats();
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
    if (statusTab === "top") {
      return productItems.filter((p) => p.isTop);
    }
    return productItems;
  }, [productItems, statusTab]);

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
      width: 195,
      render: (_, record) => {
        const owner = record.profile?.fullName || record.profile?.user?.username || "Noma'lum";
        const phone = record.profile?.phone || record.profile?.user?.phone;
        const userId = record.profile?.user?.id || record.profile?.userId || record.userId || record.profile?.id;
        return (
          <UserReference
            user={{
              id: userId,
              fullName: record.profile?.fullName,
              username: record.profile?.user?.username,
              phoneNumber: phone,
              isBlocked: record.profile?.user?.isBlocked,
              isSpam: record.profile?.user?.isSpam,
            }}
            id={userId}
            fallbackName={owner}
            size="sm"
          />
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
            onChange={(val) => {
              if (val === "active") approveListing(record.id);
              else if (val === "rejected") openRejectModal(record);
              else updateProductStatus({ id: record.id, status: val });
            }}
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
                  disabled={statusUpdatingId === record.id}
                  onClick={() => approveListing(record.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-sm shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Qabul</span>
                </button>
              </Tooltip>
              <Tooltip title="Rad etish (Sabab ko'rsatish)">
                <button
                  type="button"
                  disabled={statusUpdatingId === record.id}
                  onClick={() => openRejectModal(record)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
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
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <div className="flex items-center gap-1">
          <Tooltip title="Batafsil ko'rish">
            <button
              type="button"
              aria-label="E'lonni ko'rish"
              onClick={() => {
                setSelectedProductId(record.id);
                setIsViewModalOpen(true);
              }}
              className="btn-action-neutral hover:!text-blue-700 hover:!bg-blue-50"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          {record.status !== "pending" && (
            <Tooltip title="Holatni qaytarish (Revert / Bekor qilish)">
              <button
                type="button"
                aria-label="Holatni qaytarish"
                onClick={() => {
                  setRevertTargetListing(record);
                  setRevertTargetStatus("pending");
                  setRevertReason("");
                  setRevertModalOpen(true);
                }}
                className="btn-action-neutral hover:!text-amber-700 hover:!bg-amber-50"
              >
                <Undo2 className="w-3.5 h-3.5 text-amber-600" />
              </button>
            </Tooltip>
          )}

          <Popconfirm
            title="E'lonni butunlay o'chirish"
            description={`“${record.title || "E'lon"}” (${record.id ? `#${record.id}` : ''}) e’lonini butunlay o‘chirmoqchimisiz? Ushbu amal qaytarilmaydi.`}
            onConfirm={() => deleteProduct(record.id)}
            okText="Ha, o'chirish"
            cancelText="Bekor"
            okButtonProps={{ danger: true, size: "small" }}
            cancelButtonProps={{ size: "small" }}
          >
            <Tooltip title="O'chirish">
              <button
                type="button"
                aria-label="E'lonni o'chirish"
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
      <div className="enterprise-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 m-0">
              E'lonlar & Moderatsiya Markazi
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              CATALOG OPS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Foydalanuvchilar joylagan e'lonlarni tekshirish, tezkor tasdiqlash va TOP statuslarini boshqarish
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Nomi, ID yoki sotuvchi..."
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 w-60"
            />
          </div>

          <Popconfirm
            title="Barcha rasmlarni Bunny CDN ga optimize qilish?"
            description="WebP formatiga o'tkaziladi va yuklanish tezlashadi."
            onConfirm={handleBulkOptimizeProductImages}
            okText="Ha, boshlash"
            cancelText="Bekor"
            disabled={isOptimizing}
          >
            <button
              type="button"
              disabled={isOptimizing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{isOptimizing ? `Optimize... ${optimizeProgress}%` : "Rasmlarni Optimize"}</span>
            </button>
          </Popconfirm>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            title="Jami E'lonlar"
            value={stats.total.toLocaleString()}
            unit="e'lon"
            subtext="Barcha yuklangan e'lonlar bazasi"
            icon={Layers}
            color="blue"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            title="Moderatsiyada"
            value={stats.pending.toLocaleString()}
            unit="kutilmoqda"
            subtext="Tasdiqlash kutilayotganlar"
            icon={Clock}
            color={stats.pending > 0 ? "amber" : "slate"}
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            title="Faol E'lonlar"
            value={stats.active.toLocaleString()}
            unit="sotuvda"
            subtext="Saytda ochiq ko'rinayotganlar"
            icon={CheckCircle2}
            color="emerald"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            title="TOP / VIP Boost"
            value={stats.top.toLocaleString()}
            unit="boost"
            subtext="Yuqori o'ringa ko'tarilganlar"
            icon={Flame}
            color="indigo"
          />
        </Col>
      </Row>

      {/* Main Table with Tabs */}
      <div className="enterprise-card p-4">
        {/* Status Tabs */}
        <div className="border-b border-slate-100 pb-2 mb-4">
          <Tabs
            activeKey={statusTab}
            onChange={(key) => {
              setStatusTab(key);
              setPage(1);
              setSelectedRowKeys([]);
              setSearchParams(key === "all" ? {} : { status: key });
            }}
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

        {/* Safe Bulk Operations Action Bar */}
        {selectedRowKeys.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50/90 border border-blue-200 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-bold text-blue-900">
                {selectedRowKeys.length} ta e'lon tanlandi (Joriy sahifa)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Popconfirm
                title="Tanlangan barcha e'lonlarni tasdiqlaysizmi?"
                description={`${selectedRowKeys.length} ta e'lon saytda faol ko'rinadigan bo'ladi.`}
                onConfirm={() => bulkApproveMutation.mutate(selectedRowKeys)}
                okText="Ha, tasdiqlash"
                cancelText="Bekor"
                disabled={bulkApproveMutation.isPending}
              >
                <Button
                  type="primary"
                  size="small"
                  loading={bulkApproveMutation.isPending}
                  className="!bg-emerald-600 hover:!bg-emerald-700 text-xs font-semibold !rounded-lg"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ommaviy Qabul Qilish ({selectedRowKeys.length})</span>
                </Button>
              </Popconfirm>

              <Button
                danger
                size="small"
                onClick={() => {
                  setBulkRejectReason("");
                  setBulkRejectModalOpen(true);
                }}
                className="text-xs font-semibold !rounded-lg"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Ommaviy Rad Etish ({selectedRowKeys.length})</span>
              </Button>

              <Button
                size="small"
                onClick={() => setSelectedRowKeys([])}
                className="text-xs font-medium !rounded-lg"
              >
                Tanlovni bekor qilish
              </Button>
            </div>
          </div>
        )}

        <Table
          dataSource={filteredItems}
          columnDefs={columns}
          isLoading={isLoading}
          rowSelection={{
            selectedRowKeys,
            onChange: (newSelectedKeys) => setSelectedRowKeys(newSelectedKeys),
          }}
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
                      approveListing(selectedProductData.id);
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
                      openRejectModal(selectedProductData);
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

      {/* Rejection Reason Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-600" />
            <span className="font-extrabold text-slate-900">
              {rejectTargetListing?.title ? `“${rejectTargetListing.title}” e'lonini rad etish` : "E'lonni Rad Etish"}
            </span>
            {rejectTargetListing?.id && (
              <span className="font-mono text-xs text-slate-400 font-semibold">
                #{rejectTargetListing.id}
              </span>
            )}
          </div>
        }
        open={rejectModalOpen}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectTargetListing(null);
          setRejectCustomReason("");
        }}
        onOk={handleConfirmReject}
        okText="Rad etishni tasdiqlash"
        cancelText="Bekor qilish"
        okButtonProps={{ danger: true, loading: statusUpdatingId === rejectTargetListing?.id }}
        className="!rounded-3xl"
        width={540}
      >
        <div className="flex flex-col gap-3 py-2">
          {rejectTargetListing && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
              <Avatar
                src={rejectTargetListing.images?.[0]?.url}
                shape="square"
                size={44}
                className="rounded-lg bg-slate-200"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-xs text-slate-900 truncate">
                  {rejectTargetListing.title}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {Number(rejectTargetListing.price || 0).toLocaleString("uz-UZ")}{" "}
                  {rejectTargetListing.currencyType || "UZS"}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Asosiy rad etish sababi:</label>
            <Select
              value={rejectReasonType}
              onChange={(val) => setRejectReasonType(val)}
              className="w-full !rounded-xl"
            >
              <Select.Option value="Talablarga javob bermaydi">Talablarga javob bermaydi</Select.Option>
              <Select.Option value="Taqiqlangan yoki noqonuniy mahsulot">
                Taqiqlangan yoki noqonuniy mahsulot
              </Select.Option>
              <Select.Option value="Rasm sifatsiz yoki qoidalarga zid">
                Rasm sifatsiz yoki qoidalarga zid
              </Select.Option>
              <Select.Option value="Noto'g'ri narx yoki soxta ma'lumot">
                Noto'g'ri narx yoki soxta ma'lumot
              </Select.Option>
              <Select.Option value="Takroriy (dublikat) e'lon">
                Takroriy (dublikat) e'lon
              </Select.Option>
              <Select.Option value="Boshqa">Boshqa sabab (Qo'lda kiritish)</Select.Option>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              Qo'shimcha izoh yoki foydalanuvchiga xabar:
            </label>
            <Input.TextArea
              rows={3}
              value={rejectCustomReason}
              onChange={(e) => setRejectCustomReason(e.target.value)}
              placeholder="Foydalanuvchiga e'loni nima sababdan rad etilgani va qanday tuzatishi mumkinligini tushuntiring..."
              className="!rounded-xl text-xs"
            />
          </div>
        </div>
      </Modal>

      {/* Bulk Reject Modal */}
      <Modal
        title="Ommaviy Rad Etish"
        open={bulkRejectModalOpen}
        onCancel={() => {
          setBulkRejectModalOpen(false);
          setBulkRejectReason("");
        }}
        onOk={() => {
          if (!bulkRejectReason.trim()) {
            message.warning("Rad etish sababini kiriting!");
            return;
          }
          bulkRejectMutation.mutate({
            listingIds: selectedRowKeys,
            reason: bulkRejectReason.trim(),
          });
        }}
        confirmLoading={bulkRejectMutation.isPending}
        okText={`Rad etish (${selectedRowKeys.length} ta)`}
        cancelText="Bekor"
        okButtonProps={{ danger: true }}
      >
        <div className="py-2 space-y-3">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
            Tanlangan <strong>{selectedRowKeys.length} ta</strong> e'lon rad etiladi va egalariga sabab yuboriladi.
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Umumiy rad etish sababi:</label>
            <Input.TextArea
              rows={3}
              value={bulkRejectReason}
              onChange={(e) => setBulkRejectReason(e.target.value)}
              placeholder="Masalan: Sayt qoidalariga mos kelmasligi sababli ommaviy rad etildi..."
            />
          </div>
        </div>
      </Modal>

      {/* Safe Revert Status (Compensating Undo) Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Undo2 className="w-4 h-4 text-amber-600" />
            <span>E'lon Holatini Qaytarish (Revert)</span>
          </div>
        }
        open={revertModalOpen}
        onCancel={() => {
          setRevertModalOpen(false);
          setRevertTargetListing(null);
          setRevertReason("");
        }}
        onOk={() => {
          if (!revertReason.trim()) {
            message.warning("Holatni qaytarish sababi yoki admin izohini kiriting!");
            return;
          }
          revertStatusMutation.mutate({
            id: revertTargetListing.id,
            targetStatus: revertTargetStatus,
            reason: revertReason.trim(),
          });
        }}
        confirmLoading={revertStatusMutation.isPending}
        okText="Holatni Qaytarish"
        cancelText="Bekor"
      >
        {revertTargetListing && (
          <div className="py-2 space-y-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="font-bold text-slate-900 truncate">
                #{revertTargetListing.id} — {revertTargetListing.title}
              </div>
              <div className="text-slate-500 mt-1">
                Joriy holat: <Tag color="default" className="font-bold">{revertTargetListing.status}</Tag>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Qaytariladigan yangi holat:</label>
              <Select
                value={revertTargetStatus}
                onChange={setRevertTargetStatus}
                className="w-full"
              >
                <Select.Option value="pending">Kutilmoqda (Qayta moderatsiyaga)</Select.Option>
                <Select.Option value="active">Faol (Saytda e'lon qilish)</Select.Option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Audit va Ma'muriy Izoh (Sabab):</label>
              <Input.TextArea
                rows={3}
                value={revertReason}
                onChange={(e) => setRevertReason(e.target.value)}
                placeholder="Qarorni qaytarish asosi (masalan: Moderatsiya xatosi tuzatildi yoki sotuvchi bilan kelishildi)..."
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Products;
