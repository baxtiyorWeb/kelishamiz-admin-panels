import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, isArray } from "lodash";
import api from "../config/auth/api";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Tag,
  Space,
  Tooltip,
  Breadcrumb,
  InputNumber,
  Row,
  Col,
  Image,
} from "antd";
import {
  Folder,
  FolderPlus,
  Layers,
  Settings2,
  Sparkles,
  Zap,
  Upload,
  ArrowLeft,
  Check,
  X,
  Trash2,
  Edit3,
  ChevronRight,
  Plus,
  Search,
  Sliders,
  CheckCircle2,
  FileSpreadsheet,
  Image as ImageIcon,
  FolderOpen,
} from "lucide-react";

const PROPERTY_TYPES = [
  { value: "STRING", label: "Matn (String)", short: "ABC", color: "blue", bg: "bg-blue-50 text-blue-700" },
  { value: "INTEGER", label: "Butun son (Integer)", short: "123", color: "purple", bg: "bg-purple-50 text-purple-700" },
  { value: "DOUBLE", label: "O'nlik son (Double)", short: "0.0", color: "gold", bg: "bg-amber-50 text-amber-700" },
  { value: "BOOLEAN", label: "Ha / Yo'q (Boolean)", short: "Y/N", color: "green", bg: "bg-emerald-50 text-emerald-700" },
  { value: "SELECT", label: "Tanlovli ro'yxat (Select)", short: "List", color: "red", bg: "bg-rose-50 text-rose-700" },
];

const initCategory = {
  name: "",
  imageUrl: "",
  isVisible: true,
  order: 0,
  parentId: null,
};

const initProperty = {
  name: "",
  type: "STRING",
  options: [],
  optionInput: "",
};

const CategoryPage = () => {
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedCatForProps, setSelectedCatForProps] = useState(null);
  const [searchFilter, setSearchFilter] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const [categoryData, setCategoryData] = useState(initCategory);
  const [editingCategory, setEditingCategory] = useState(null);
  const [currentEditId, setCurrentEditId] = useState(null);

  const [isAddingInline, setIsAddingInline] = useState(false);
  const [inlineName, setInlineName] = useState("");
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineEditName, setInlineEditName] = useState("");

  const [isAddingPropInline, setIsAddingPropInline] = useState(false);
  const [inlinePropData, setInlinePropData] = useState(initProperty);
  const [inlinePropEditId, setInlinePropEditId] = useState(null);
  const [inlinePropEditName, setInlinePropEditName] = useState("");

  const [bulkFile, setBulkFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeProgress, setOptimizeProgress] = useState(0);

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ["categories", selectedId],
    queryFn: async () => {
      const q = selectedId !== null ? `?parentId=${selectedId}` : "";
      const res = await api.get(`/category${q}`);
      return res.data?.content || res.data || [];
    },
  });
  const categoryList = useMemo(() => (isArray(data) ? data : []), [data]);

  const { data: allCategories } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => {
      const res = await api.get("/category");
      return res.data?.content || res.data || [];
    },
  });

  const { data: properties, isLoading: propsLoading } = useQuery({
    queryKey: ["properties", selectedCatForProps?.id],
    queryFn: async () => {
      const res = await api.get(`/category/${selectedCatForProps.id}/properties`);
      return res.data?.content || res.data || [];
    },
    enabled: !!selectedCatForProps?.id,
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const all = isArray(allCategories) ? allCategories : [];
    const rootCats = all.filter((c) => !c.parentId);
    const subCats = all.filter((c) => c.parentId);
    const visibleCount = all.filter((c) => c.isVisible).length;
    const withProps = all.reduce((acc, c) => acc + (c.properties?.length || 0), 0);

    return {
      total: all.length,
      root: rootCats.length,
      sub: subCats.length,
      visible: visibleCount,
      propsCount: withProps,
    };
  }, [allCategories]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload) => api.post("/category", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories-all"] });
      message.success("Kategoriya muvaffaqiyatli qo'shildi!");
      setCategoryData(initCategory);
      setIsCreateModalOpen(false);
      setInlineName("");
      setIsAddingInline(false);
    },
    onError: (e) => message.error(get(e, "response.data.message", "Xatolik yuz berdi")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/category/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories-all"] });
      setIsEditModalOpen(false);
      setInlineEditId(null);
      message.success("Yangilandi!");
    },
    onError: (e) => message.error(get(e, "response.data.message", "Xatolik yuz berdi")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/category/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories-all"] });
      if (selectedCatForProps) setSelectedCatForProps(null);
      message.success("Kategoriya o'chirildi!");
    },
  });

  const createPropertyMutation = useMutation({
    mutationFn: (payload) => api.post("/property", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories-all"] });
      message.success("Xususiyat qo'shildi!");
      setInlinePropData(initProperty);
    },
    onError: (e) => message.error(get(e, "response.data.message", "Xatolik")),
  });

  const updatePropertyMutation = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/property/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      setInlinePropEditId(null);
      message.success("Xususiyat yangilandi!");
    },
    onError: (e) => message.error(get(e, "response.data.message", "Xatolik")),
  });

  const deletePropertyMutation = useMutation({
    mutationFn: (id) => api.delete(`/property/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      message.success("Xususiyat o'chirildi!");
    },
  });

  const bulkMutation = useMutation({
    mutationFn: (file) => {
      const form = new FormData();
      form.append("file", file);
      return api.post("/category/import", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories-all"] });
      message.success("Excel orqali import muvaffaqiyatli yakunlandi!");
      setIsBulkModalOpen(false);
      setBulkFile(null);
    },
    onError: (e) => message.error(get(e, "response.data.message", "Fayl xatosi")),
  });

  // Handlers
  const handleDrill = useCallback(
    (cat) => {
      setHistory((prev) => [...prev, selectedId]);
      setSelectedId(cat.id);
      setSelectedCatForProps(null);
    },
    [selectedId]
  );

  const handleBack = useCallback(() => {
    const prev = history[history.length - 1];
    setSelectedId(prev !== undefined ? prev : null);
    setHistory((h) => h.slice(0, -1));
    setSelectedCatForProps(null);
  }, [history]);

  const handleInlineAdd = useCallback(() => {
    const name = inlineName.trim();
    if (!name) return;
    createMutation.mutate({ name, imageUrl: "", parentId: selectedId, isVisible: true, order: 0 });
  }, [inlineName, selectedId, createMutation]);

  const handleToggleVisibility = useCallback(
    (cat, checked) => {
      updateMutation.mutate({ id: cat.id, isVisible: checked });
    },
    [updateMutation]
  );

  const handleOpenEdit = useCallback((cat) => {
    setCurrentEditId(cat.id);
    setEditingCategory({ ...cat, parentId: cat.parent?.id ?? cat.parentId ?? null });
    setIsEditModalOpen(true);
  }, []);

  const handleInlineEditSave = useCallback(
    (cat) => {
      const name = inlineEditName.trim();
      if (!name) {
        setInlineEditId(null);
        return;
      }
      updateMutation.mutate({ id: cat.id, ...cat, name });
    },
    [inlineEditName, updateMutation]
  );

  const handleAddPropInline = useCallback(() => {
    if (!selectedCatForProps) return;
    if (!inlinePropData.name.trim()) {
      message.warning("Xususiyat nomini kiriting!");
      return;
    }
    createPropertyMutation.mutate({
      name: inlinePropData.name.trim(),
      type: inlinePropData.type,
      categoryId: String(selectedCatForProps.id),
      options: inlinePropData.type === "SELECT" ? inlinePropData.options : [],
    });
  }, [selectedCatForProps, inlinePropData, createPropertyMutation]);

  const handleImageUpload = useCallback(async (file, target) => {
    const form = new FormData();
    form.append("file", file);
    setIsUploading(true);
    try {
      const res = await api.post("/file/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.content?.url || "";
      if (target === "edit") {
        setEditingCategory((prev) => (prev ? { ...prev, imageUrl: url } : prev));
      } else {
        setCategoryData((prev) => ({ ...prev, imageUrl: url }));
      }
      message.success("Rasm yuklandi!");
    } catch {
      message.error("Rasm yuklashda xatolik yuz berdi!");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleBulkOptimizeImages = useCallback(async () => {
    let allCats = [];
    try {
      const res = await api.get("/category");
      allCats = res.data?.content || res.data || [];
    } catch {
      message.error("Kategoriyalar ro'yxatini olishda xato!");
      return;
    }

    const withImages = allCats.filter((c) => c.imageUrl && c.imageUrl.trim());
    if (withImages.length === 0) {
      message.info("Optimizatsiya qilinadigan rasmli kategoriya topilmadi");
      return;
    }

    setIsOptimizing(true);
    setOptimizeProgress(0);

    try {
      const urls = withImages.map((c) => c.imageUrl);
      const chunkSize = 3;
      let successCount = 0;

      for (let i = 0; i < urls.length; i += chunkSize) {
        const chunk = urls.slice(i, i + chunkSize);
        try {
          const res = await api.post("/file/bulk-optimize", { urls: chunk });
          const results = res.data?.results || [];
          successCount += results.filter((r) => r.success).length;
        } catch (chunkErr) {
          console.error("Chunk optimization error", chunkErr);
        }
        setOptimizeProgress(Math.round(((i + chunk.length) / urls.length) * 100));
      }

      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories-all"] });
      message.success(`✅ ${successCount} ta kategoriya rasmi muvaffaqiyatli optimize qilindi!`);
    } catch (err) {
      message.error(get(err, "response.data.message", "Optimizatsiya xatosi"));
    } finally {
      setIsOptimizing(false);
    }
  }, [queryClient]);

  const breadcrumb = useMemo(() => {
    if (!allCategories || selectedId === null) return [];
    const trail = [];
    let cur = allCategories.find((c) => c.id === selectedId);
    while (cur) {
      trail.unshift(cur);
      cur = cur.parentId ? allCategories.find((c) => c.id === cur?.parentId) : undefined;
    }
    return trail;
  }, [allCategories, selectedId]);

  const typeInfo = (type) => PROPERTY_TYPES.find((t) => t.value === type);

  const filteredCategoryList = useMemo(() => {
    if (!searchFilter.trim()) return categoryList;
    const q = searchFilter.toLowerCase();
    return categoryList.filter((c) => c.name?.toLowerCase().includes(q) || c.id?.toString().includes(q));
  }, [categoryList, searchFilter]);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 65,
      render: (id) => <span className="font-mono text-xs font-bold text-slate-400">#{id}</span>,
    },
    {
      title: "Ikonka",
      dataIndex: "imageUrl",
      width: 65,
      render: (img) => (
        <div className="w-10 h-10 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shadow-xs">
          {img ? (
            <img src={img} alt="" className="w-full h-full object-cover" />
          ) : (
            <Folder className="w-5 h-5 text-indigo-400" />
          )}
        </div>
      ),
    },
    {
      title: "Kategoriya Nomi",
      dataIndex: "name",
      render: (name, cat) => {
        if (inlineEditId === cat.id) {
          return (
            <Input
              autoFocus
              size="small"
              value={inlineEditName}
              onChange={(e) => setInlineEditName(e.target.value)}
              onPressEnter={() => handleInlineEditSave(cat)}
              onBlur={() => handleInlineEditSave(cat)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setInlineEditId(null);
              }}
              className="w-48 !rounded-xl"
            />
          );
        }
        return (
          <div
            onDoubleClick={() => {
              setInlineEditId(cat.id);
              setInlineEditName(cat.name);
            }}
            className="cursor-text"
          >
            <div className="font-extrabold text-slate-900 text-sm hover:text-indigo-600 transition-colors">
              {name}
            </div>
            {cat.parent && <div className="text-[11px] text-slate-400 mt-0.5">↳ {cat.parent.name}</div>}
          </div>
        );
      },
    },
    {
      title: "Ko'rinishi",
      dataIndex: "isVisible",
      width: 95,
      render: (val, cat) => (
        <Switch
          checked={val}
          size="small"
          loading={updateMutation.isPending}
          onChange={(checked) => handleToggleVisibility(cat, checked)}
        />
      ),
    },
    {
      title: "Xususiyatlar",
      dataIndex: "properties",
      width: 120,
      render: (props) =>
        props?.length > 0 ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Sliders className="w-3 h-3 text-purple-500" />
            <span>{props.length} ta</span>
          </span>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        ),
    },
    {
      title: "Amallar",
      width: 140,
      render: (_, cat) => (
        <div className="flex items-center gap-1">
          <Tooltip title="Tahrirlash">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEdit(cat);
              }}
              className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip title="Xususiyatlar konstruktori">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCatForProps(cat);
              }}
              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                selectedCatForProps?.id === cat.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600"
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Popconfirm
            title="Kategoriyani o'chirishga ishonchingiz komilmi?"
            onConfirm={() => deleteMutation.mutate(cat.id)}
            okText="Ha"
            cancelText="Yo'q"
            okButtonProps={{ danger: true }}
          >
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="w-7 h-7 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </Popconfirm>

          <Tooltip title="Ichki bo'limlariga kirish">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDrill(cat);
              }}
              className="w-7 h-7 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
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
        <div className="flex items-center gap-3">
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Orqaga</span>
            </button>
          )}
          <div>
            <h1 className="text-xl font-black text-slate-900 m-0 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FolderOpen className="w-4 h-4" />
              </div>
              Kategoriyalar & Dinamik Xususiyatlar Studio
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Kategoriyalar ierarxiyasi, media ikonkalari va har bir bo'lim uchun dinamik parametrlar konstruktori.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel Import</span>
          </button>

          <Popconfirm
            title="Barcha kategoriya rasmlarini CDN ga optimize qilish?"
            onConfirm={handleBulkOptimizeImages}
            okText="Optimize"
            cancelText="Bekor"
            disabled={isOptimizing}
          >
            <button
              type="button"
              disabled={isOptimizing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-amber-600 fill-amber-600" />
              <span>{isOptimizing ? `Optimize... ${optimizeProgress}%` : "⚡ Rasmlarni Optimize"}</span>
            </button>
          </Popconfirm>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Kategoriya</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jami Bo'limlar</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{stats.total} ta</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Barcha darajadagi kategoriyalar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Folder className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                Faol Bo'limlar
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{stats.visible} ta</div>
              <div className="text-[11px] text-emerald-600/70 mt-0.5">Saytda ochiq ko'rinadiganlar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-purple-500 uppercase tracking-wider flex items-center gap-1">
                Ichki Bo'limlar
              </div>
              <div className="text-2xl font-black text-purple-600 mt-1">{stats.sub} ta</div>
              <div className="text-[11px] text-purple-600/70 mt-0.5">2 va 3-darajali podkategoriyalar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                Dinamik Parametrlar
              </div>
              <div className="text-2xl font-black text-amber-600 mt-1">{stats.propsCount} ta</div>
              <div className="text-[11px] text-amber-600/70 mt-0.5">Biriktirilgan parametrlar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sliders className="w-6 h-6" />
            </div>
          </div>
        </Col>
      </Row>

      {/* Breadcrumb path toolbar */}
      <div className="px-5 py-3 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <Breadcrumb
          items={[
            {
              title: (
                <span
                  className="cursor-pointer font-bold text-indigo-600 flex items-center gap-1 text-xs"
                  onClick={() => {
                    setSelectedId(null);
                    setHistory([]);
                    setSelectedCatForProps(null);
                  }}
                >
                  <Folder className="w-3.5 h-3.5" />
                  Asosiy Bo'limlar
                </span>
              ),
            },
            ...breadcrumb.map((c, i) => ({
              title:
                i === breadcrumb.length - 1 ? (
                  <span className="font-extrabold text-slate-800 text-xs">{c.name}</span>
                ) : (
                  <span
                    className="cursor-pointer text-indigo-600 text-xs font-semibold"
                    onClick={() => {
                      const newHistory = breadcrumb.slice(0, i).map((b) => b.id);
                      newHistory.unshift(null);
                      setHistory(newHistory);
                      setSelectedId(c.id);
                      setSelectedCatForProps(null);
                    }}
                  >
                    {c.name}
                  </span>
                ),
            })),
          ]}
        />

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Bo'lim nomi bo'yicha..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 w-48 transition-all"
          />
        </div>
      </div>

      {/* 2-Column Studio: Left Table & Right Property Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Categories Table */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-sm p-4 overflow-hidden flex flex-col">
          <Table
            size="middle"
            loading={isLoading}
            dataSource={filteredCategoryList}
            columns={columns}
            rowKey="id"
            pagination={false}
            onRow={(cat) => ({
              onClick: () => setSelectedCatForProps(cat),
              className: `cursor-pointer transition-colors ${
                selectedCatForProps?.id === cat.id ? "!bg-indigo-50/70" : "hover:!bg-slate-50"
              }`,
            })}
            footer={() =>
              isAddingInline ? (
                <div className="flex items-center gap-2 py-1">
                  <input
                    autoFocus
                    type="text"
                    value={inlineName}
                    placeholder="Kategoriya nomini kiriting... (Enter — saqlash)"
                    onChange={(e) => setInlineName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleInlineAdd();
                      if (e.key === "Escape") {
                        setIsAddingInline(false);
                        setInlineName("");
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={handleInlineAdd}
                    className="w-7 h-7 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingInline(false);
                      setInlineName("");
                    }}
                    className="w-7 h-7 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingInline(true)}
                  className="inline-flex items-center gap-1 text-indigo-600 font-bold text-xs hover:underline cursor-pointer p-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yangi qator tezkor qo'shish</span>
                </button>
              )
            }
          />
        </div>

        {/* Right Dynamic Property Studio */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between overflow-hidden">
          {selectedCatForProps ? (
            <div className="flex flex-col gap-4 h-full">
              <div className="border-b border-slate-100 pb-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                  Dinamik Parametrlar
                </div>
                <div className="text-base font-black text-slate-900 mt-1">
                  {selectedCatForProps.name}
                </div>
              </div>

              {/* Properties List */}
              <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[380px] pr-1">
                {(!properties || properties.length === 0) && !propsLoading && (
                  <div className="text-center py-10 text-slate-400 text-xs italic">
                    Ushbu kategoriya uchun hali parametrlar biriktirilmagan.
                  </div>
                )}
                {properties?.map((prop) => {
                  const info = typeInfo(prop.type);
                  return (
                    <div
                      key={prop.id}
                      className="p-3 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-800 text-xs truncate">{prop.name}</div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold ${info?.bg || "bg-slate-200 text-slate-700"}`}>
                            {info?.short} • {info?.label}
                          </span>
                          {prop.options?.length > 0 && (
                            <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                              {prop.options.slice(0, 2).join(", ")}
                              {prop.options.length > 2 ? "..." : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <Popconfirm
                        title="O'chirishga ishonchingiz komilmi?"
                        onConfirm={() => deletePropertyMutation.mutate(prop.id)}
                        okText="Ha"
                        cancelText="Yo'q"
                        okButtonProps={{ danger: true }}
                      >
                        <button
                          type="button"
                          className="w-7 h-7 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </Popconfirm>
                    </div>
                  );
                })}
              </div>

              {/* Fast Add Property */}
              <div className="border-t border-slate-100 pt-3 flex flex-col gap-2.5">
                <input
                  type="text"
                  placeholder="Yangi parametr (Masalan: Xotira, Rangi)..."
                  value={inlinePropData.name}
                  onChange={(e) => setInlinePropData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-indigo-600"
                />
                <Select
                  size="small"
                  value={inlinePropData.type}
                  onChange={(t) => setInlinePropData((p) => ({ ...p, type: t }))}
                  options={PROPERTY_TYPES}
                  className="w-full !rounded-xl"
                />

                {inlinePropData.type === "SELECT" && (
                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-600">
                      Variantlarni vergul bilan yozing: <code className="text-indigo-600">128GB, 256GB</code>
                    </span>
                    <input
                      type="text"
                      placeholder="128GB, 256GB, 512GB..."
                      value={inlinePropData.optionInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.endsWith(",")) {
                          const parts = val.split(",").map((s) => s.trim()).filter(Boolean);
                          setInlinePropData((p) => ({
                            ...p,
                            options: [...new Set([...p.options, ...parts])],
                            optionInput: "",
                          }));
                        } else {
                          setInlinePropData((p) => ({ ...p, optionInput: val }));
                        }
                      }}
                      className="px-2 py-1 text-xs rounded-lg border border-slate-300 outline-none"
                    />
                    <div className="flex flex-wrap gap-1">
                      {inlinePropData.options.map((o, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-700 flex items-center gap-1"
                        >
                          {o}
                          <X
                            className="w-2.5 h-2.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                            onClick={() =>
                              setInlinePropData((p) => ({
                                ...p,
                                options: p.options.filter((_, i) => i !== idx),
                              }))
                            }
                          />
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  disabled={createPropertyMutation.isPending}
                  onClick={handleAddPropInline}
                  className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Xususiyatni Biriktirish</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <Settings2 className="w-7 h-7" />
              </div>
              <div className="font-extrabold text-slate-800 text-sm">Bo'lim Tanlanmagan</div>
              <div className="text-xs text-slate-400 mt-1 max-w-[200px]">
                Jadvaldan istalgan kategoriya ustiga bosing va uning xususiyatlarini tahrirlang.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-indigo-600" />
            <span className="font-black text-slate-900">Yangi Kategoriya Qo'shish</span>
          </div>
        }
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onOk={() => {
          if (!categoryData.name.trim()) {
            message.warning("Nomini kiriting!");
            return;
          }
          createMutation.mutate({
            ...categoryData,
            parentId: categoryData.parentId || selectedId,
          });
        }}
        confirmLoading={createMutation.isPending || isUploading}
        okText="Qo'shish"
        cancelText="Bekor"
        width={480}
        className="!rounded-3xl"
      >
        <Form layout="vertical" className="mt-4">
          <Form.Item label="Nomi *">
            <Input
              value={categoryData.name}
              onChange={(e) => setCategoryData({ ...categoryData, name: e.target.value })}
              placeholder="Masalan: Elektronika"
              className="!rounded-xl h-11 font-semibold"
            />
          </Form.Item>
          <Form.Item label="Yuqori Kategoriya (Parent)">
            <Select
              allowClear
              placeholder="— Asosiy Kategoriya —"
              value={categoryData.parentId}
              onChange={(v) => setCategoryData({ ...categoryData, parentId: v ?? null })}
              options={(allCategories || []).map((c) => ({ value: c.id, label: c.name }))}
              className="w-full !rounded-xl"
            />
          </Form.Item>
          <Form.Item label="Tartib (Order)">
            <InputNumber
              min={0}
              value={categoryData.order}
              onChange={(v) => setCategoryData({ ...categoryData, order: v ?? 0 })}
              className="w-full !rounded-xl"
            />
          </Form.Item>
          <Form.Item label="Kategoriya Ikonkasi / Rasmi">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageUpload(f, "create");
              }}
              className="text-xs"
            />
            {categoryData.imageUrl && (
              <img
                src={categoryData.imageUrl}
                alt="preview"
                className="w-16 h-16 object-cover rounded-2xl border border-slate-200 mt-2 shadow-xs"
              />
            )}
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-indigo-600" />
            <span className="font-black text-slate-900">Kategoriyani Tahrirlash</span>
          </div>
        }
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={() => {
          if (!editingCategory) return;
          updateMutation.mutate({ id: currentEditId, ...editingCategory });
        }}
        confirmLoading={updateMutation.isPending || isUploading}
        okText="Saqlash"
        cancelText="Bekor"
        width={480}
        className="!rounded-3xl"
      >
        {editingCategory && (
          <Form layout="vertical" className="mt-4">
            <Form.Item label="Nomi">
              <Input
                value={editingCategory.name}
                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                className="!rounded-xl h-11 font-semibold"
              />
            </Form.Item>
            <Form.Item label="Yuqori Kategoriya">
              <Select
                allowClear
                placeholder="— Asosiy —"
                value={editingCategory.parentId ?? undefined}
                onChange={(v) => setEditingCategory({ ...editingCategory, parentId: v ?? null })}
                options={(allCategories || [])
                  .filter((c) => c.id !== editingCategory.id)
                  .map((c) => ({ value: c.id, label: c.name }))}
                className="w-full !rounded-xl"
              />
            </Form.Item>
            <Form.Item label="Tartib">
              <InputNumber
                min={0}
                value={editingCategory.order}
                onChange={(v) => setEditingCategory({ ...editingCategory, order: v ?? 0 })}
                className="w-full !rounded-xl"
              />
            </Form.Item>
            <Form.Item label="Rasm O'zgartirish">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageUpload(f, "edit");
                }}
                className="text-xs"
              />
              {editingCategory.imageUrl && (
                <img
                  src={editingCategory.imageUrl}
                  alt="preview"
                  className="w-16 h-16 object-cover rounded-2xl border border-slate-200 mt-2 shadow-xs"
                />
              )}
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Bulk Excel Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span className="font-black text-slate-900">Excel Orqali Kategoriya Import (.xlsx, .csv)</span>
          </div>
        }
        open={isBulkModalOpen}
        onCancel={() => {
          setIsBulkModalOpen(false);
          setBulkFile(null);
        }}
        onOk={() => {
          if (!bulkFile) {
            message.warning("Avval faylni tanlang!");
            return;
          }
          bulkMutation.mutate(bulkFile);
        }}
        confirmLoading={bulkMutation.isPending}
        okText="Yuklash"
        cancelText="Bekor"
        className="!rounded-3xl"
      >
        <div className="p-8 flex flex-col items-center gap-3 border-2 border-dashed border-slate-200 rounded-3xl mt-4 bg-slate-50/50">
          <Upload className="w-8 h-8 text-indigo-500" />
          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
            className="text-xs"
          />
          {bulkFile && <span className="text-xs font-bold text-emerald-600">{bulkFile.name}</span>}
        </div>
      </Modal>
    </div>
  );
};

export default CategoryPage;
