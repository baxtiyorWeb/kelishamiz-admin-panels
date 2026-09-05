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
  Progress,
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
  RefreshCw,
  Play,
  CheckCircle,
  Clock,
  Wand2,
  Undo2,
  ShieldCheck,
} from "lucide-react";
import { ProductImageBgModal } from "../components/ProductImageBgModal";

const PROPERTY_TYPES = [
  { value: "STRING", label: "Matn (String)", short: "ABC", color: "blue", bg: "bg-blue-50 text-blue-700" },
  { value: "INTEGER", label: "Butun son (Integer)", short: "123", color: "purple", bg: "bg-purple-50 text-purple-700" },
  { value: "DOUBLE", label: "O'nlik son (Double)", short: "0.0", color: "gold", bg: "bg-amber-50 text-amber-700" },
  { value: "BOOLEAN", label: "Ha / Yo'q (Boolean)", short: "Y/N", color: "green", bg: "bg-emerald-50 text-emerald-700" },
  { value: "SELECT", label: "Tanlovli ro'yxat (Select)", short: "List", color: "red", bg: "bg-rose-50 text-rose-700" },
];

const CATEGORY_IMAGE_MAPPING = [
  {
    fileName: '01_transport.png',
    title: 'Transport / Avtomobillar',
    desc: '3D Qizil avtomobil',
    categoryIds: [214, 705, 706, 707, 233, 234, 235, 238, 239, 240, 241, 722],
  },
  {
    fileName: '19_plants.png',
    title: "Ko'chmas mulk / Uy-joy",
    desc: '3D Shinam hovli uy',
    categoryIds: [700, 213, 710, 711, 712, 713, 227, 229],
  },
  {
    fileName: '02_real_estate.png',
    title: 'Ish va xizmatlar',
    desc: 'Ish diplomi, kaska va asboblar',
    categoryIds: [216, 715, 716, 717, 718, 719, 720, 721, 723, 724, 725, 726, 727, 253, 254, 255, 256, 257, 258],
  },
  {
    fileName: '04_jobs_education.png',
    title: 'Elektronika va texnika',
    desc: 'iPhone, noutbuk, Apple Watch, AirPods',
    categoryIds: [215, 156, 729, 730, 731, 732, 733, 243, 244, 245, 248, 249, 250, 251],
  },
  {
    fileName: '03_electronics.png',
    title: 'Maishiy texnika',
    desc: 'Kir yuvish, muzlatgich, changyutgich',
    categoryIds: [734, 735, 736, 737, 738, 246, 274, 279],
  },
  {
    fileName: '15_appliances.png',
    title: 'Kiyimlar va poyabzallar',
    desc: 'Sariq hudi, krossovka, ayollar sumkasi',
    categoryIds: [740, 701, 219, 741, 742, 743, 744, 283, 284, 285, 286, 287, 290, 294, 295, 296, 321],
  },
  {
    fileName: '06_fashion_clothing.png',
    title: 'Mebel va interyer',
    desc: 'Binafsharang kreslo, tungi chiroq, tumba',
    categoryIds: [746, 747, 748, 749, 273],
  },
  {
    fileName: '16_furniture.png',
    title: 'Hayvonlar',
    desc: 'Kuchukcha, mushukcha, ozuqa idishi',
    categoryIds: [751, 752, 753, 754, 755, 756, 757, 280],
  },
  {
    fileName: '17_animals.png',
    title: 'Kanselyariya va kitoblar',
    desc: 'Daftar, qalamlar, flomasterlar',
    categoryIds: [759, 703, 704, 760, 761, 300, 308, 309],
  },
  {
    fileName: '18_stationery.png',
    title: "O'simliklar / Uy va bog'",
    desc: 'Xonaki gullar, monstera, kaktus',
    categoryIds: [763, 218, 764, 765, 766, 281],
  },
  {
    fileName: '20_jewelry.png',
    title: 'Zargarlik buyumlari va soatlar',
    desc: 'Olmos uzuk va tilla marjon',
    categoryIds: [768, 769, 770, 771, 772, 289],
  },
  {
    fileName: '21_business.png',
    title: 'Biznes va uskunalar',
    desc: 'Diplomat, tilla tangalar, grafik',
    categoryIds: [774, 775, 776, 777, 778, 779],
  },
  {
    fileName: '09_construction.png',
    title: "Qurilish va ta'mirlash",
    desc: "G'ishtlar, kaska, bo'yoq idishi",
    categoryIds: [222, 781, 782, 783, 315, 316, 317, 318, 319, 320, 322, 323, 324],
  },
  {
    fileName: '07_kids_toys.png',
    title: 'Bolalar dunyosi',
    desc: 'Ayiqcha o‘yinchoq',
    categoryIds: [220, 297, 299, 301, 302, 303],
  },
  {
    fileName: '08_sports_hobby.png',
    title: 'Xobbi, dam olish va sport',
    desc: 'Sport inventarlari va xobbi',
    categoryIds: [221, 305, 306, 307, 310, 311],
  },
  {
    fileName: '10_spare_parts.png',
    title: 'Ehtiyot qismlar va aksessuarlar',
    desc: 'Avtomobil ehtiyot qismlari',
    categoryIds: [702, 236, 252],
  },
  {
    fileName: '13_search.png',
    title: 'Boshqalar / Turli xil',
    desc: 'Lupa va turli bo‘limlar',
    categoryIds: [709, 714, 728, 739, 745, 750, 758, 762, 767, 773, 780, 784],
  },
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

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStepText, setSyncStepText] = useState("");
  const [syncLogs, setSyncLogs] = useState([]);

  // AI Background removal states
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);
  const [selectedBgCategories, setSelectedBgCategories] = useState([]);
  const [selectedCategoryRowKeys, setSelectedCategoryRowKeys] = useState([]);

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

  const openAiBgModalForCategory = useCallback((cat) => {
    if (!cat?.imageUrl) {
      message.warning("Ushbu kategoriyada rasm mavjud emas!");
      return;
    }
    setSelectedBgCategories([cat]);
    setIsBgModalOpen(true);
  }, []);

  const handleBatchAiBgModal = useCallback(() => {
    const toProcess = filteredCategoryList.filter(
      (cat) => selectedCategoryRowKeys.includes(cat.id) && cat.imageUrl
    );
    if (toProcess.length === 0) {
      message.warning("Tanlangan kategoriyalarda rasm mavjud emas!");
      return;
    }
    setSelectedBgCategories(toProcess);
    setIsBgModalOpen(true);
  }, [selectedCategoryRowKeys]);

  const handleRevertCategoryImage = useCallback(async (categoryId) => {
    try {
      const res = await api.post(`/ai/categories/${categoryId}/revert`);
      message.success(res.data?.message || "Kategoriya asl rasmiga qaytarildi!");
      queryClient.invalidateQueries(["categories"]);
      queryClient.invalidateQueries(["categories-all"]);
    } catch (err) {
      message.error(err.response?.data?.message || "Asliga qaytarishda xatolik yuz berdi");
    }
  }, [queryClient]);

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

  const handleSyncCategoryImages = useCallback(async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    setSyncLogs([]);
    const logs = [];

    const addLog = (text, type = "info") => {
      const entry = { text, type, time: new Date().toLocaleTimeString() };
      logs.push(entry);
      setSyncLogs([...logs]);
    };

    addLog("🚀 Sinxronlash jarayoni boshlandi. Backend: POST /file/upload -> Bunny CDN (media.kelishamiz.uz)", "info");
    addLog("🔒 Vercel Blob ishlatilmaydi. Har bir rasm orasida 1 soniyalik interval saqlanadi.", "info");

    let totalUpdated = 0;
    let successImages = 0;

    try {
      for (let i = 0; i < CATEGORY_IMAGE_MAPPING.length; i++) {
        const item = CATEGORY_IMAGE_MAPPING[i];
        setSyncStepText(`[${i + 1}/${CATEGORY_IMAGE_MAPPING.length}] "${item.title}" backendga yuklanmoqda...`);

        // Rasmni static public papkadan yuklab olish
        const imgResponse = await fetch(`/category-images/${item.fileName}`);
        if (!imgResponse.ok) {
          addLog(`❌ Fayl topilmadi: /category-images/${item.fileName}`, "error");
          continue;
        }

        const blob = await imgResponse.blob();
        const form = new FormData();
        form.append("file", blob, item.fileName);

        // Backend POST /file/upload orqali Bunny CDN ga yuklash
        addLog(`📤 [${i + 1}/${CATEGORY_IMAGE_MAPPING.length}] "${item.fileName}" backendga yuklanmoqda...`, "info");
        const uploadRes = await api.post("/file/upload", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const cdnUrl = uploadRes.data?.content?.url || uploadRes.data?.url;

        if (!cdnUrl) {
          addLog(`❌ URL qaytmadi: ${item.fileName}`, "error");
          continue;
        }

        // Qat'iy Vercel Blob tekshiruvi
        if (cdnUrl.includes("vercel") || cdnUrl.includes("blob.core.windows.net")) {
          throw new Error(`XAVFLI: URL Vercel Blob ga yuklangan (${cdnUrl})! Jarayon to'xtatildi.`);
        }

        addLog(`✅ Bunny CDN ga yuklandi: ${cdnUrl}`, "success");
        successImages++;

        // Kategoriyalarni yangilash
        for (const catId of item.categoryIds) {
          try {
            await api.put(`/category/${catId}`, { imageUrl: cdnUrl });
            totalUpdated++;
          } catch (updateErr) {
            addLog(`⚠️ Kategoriya #${catId} yangilanmadi: ${updateErr.message}`, "warning");
          }
        }
        addLog(`✓ ${item.categoryIds.length} ta kategoriya yangilandi`, "success");

        setSyncProgress(Math.round(((i + 1) / CATEGORY_IMAGE_MAPPING.length) * 100));

        // Har bir rasm yuklangandan keyin 1 soniya kutish
        if (i < CATEGORY_IMAGE_MAPPING.length - 1) {
          setSyncStepText(`⏳ Keyingi rasmga o'tishdan oldin 1 soniya kutilmoqda...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      setSyncStepText(`🎉 Barcha 17 ta rasm yuklandi! (${totalUpdated} ta kategoriya yangilandi)`);
      addLog(`🎉 Muvaffaqiyatli yakunlandi! Jami ${successImages} ta rasm va ${totalUpdated} ta kategoriya yangilandi.`, "success");
      message.success("Barcha kategoriya rasmlari Bunny CDN ga muvaffaqiyatli yangilandi!");

      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories-all"] });
    } catch (err) {
      console.error("Sync error:", err);
      addLog(`❌ Xatolik yuz berdi: ${err.message}`, "error");
      message.error(err.message || "Sinxronlashda xatolik yuz berdi");
    } finally {
      setIsSyncing(false);
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
      width: 75,
      render: (img, cat) => (
        <div className="relative group/icon w-10 h-10 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shadow-xs">
          {img ? (
            <img src={img} alt="" className="w-full h-full object-cover" />
          ) : (
            <Folder className="w-5 h-5 text-indigo-400" />
          )}
          {cat.isBgRemoved && (
            <div
              className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xs z-10"
              title="Shaffof fon (AI)"
            >
              <ShieldCheck className="w-2.5 h-2.5" />
            </div>
          )}
          {img && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/icon:opacity-100 transition-opacity flex items-center justify-center gap-1 z-20">
              <Tooltip title="AI Fonni tozalash">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openAiBgModalForCategory(cat);
                  }}
                  className="w-6 h-6 rounded-lg bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center shadow-xs cursor-pointer active:scale-90"
                >
                  <Wand2 className="w-3 h-3" />
                </button>
              </Tooltip>
              {cat.originalImageUrl && (
                <Tooltip title="Asliga qaytarish">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRevertCategoryImage(cat.id);
                    }}
                    className="w-6 h-6 rounded-lg bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center shadow-xs cursor-pointer active:scale-90"
                  >
                    <Undo2 className="w-3 h-3" />
                  </button>
                </Tooltip>
              )}
            </div>
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
      width: 185,
      render: (_, cat) => (
        <div className="flex items-center gap-1">
          {cat.imageUrl && (
            <Tooltip title="AI Fonni tozalash">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openAiBgModalForCategory(cat);
                }}
                className="w-7 h-7 rounded-xl bg-violet-50 hover:bg-violet-600 text-violet-600 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          )}

          {cat.originalImageUrl && (
            <Popconfirm
              title="Asl rasmga qaytarish?"
              description="Fon tozalangan rasm o'rniga asl yuklangan rasm tiklanadi."
              onConfirm={() => handleRevertCategoryImage(cat.id)}
              okText="Ha, tiklash"
              cancelText="Bekor"
            >
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="w-7 h-7 rounded-xl bg-amber-50 hover:bg-amber-600 text-amber-600 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
            </Popconfirm>
          )}

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
              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${selectedCatForProps?.id === cat.id
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
            onClick={() => setIsSyncModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <RefreshCw className="w-4 h-4 text-indigo-600" />
            <span>⚡ 3D Rasmlarni Sinxronlash (CDN)</span>
          </button>

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
          {selectedCategoryRowKeys.length > 0 && (
            <div className="mb-3 p-3 px-4 bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-indigo-900">
                {selectedCategoryRowKeys.length} ta kategoriya tanlandi
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBatchAiBgModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-sm shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>
                    AI Fonni tozalash (
                    {
                      filteredCategoryList.filter(
                        (c) => selectedCategoryRowKeys.includes(c.id) && c.imageUrl
                      ).length
                    }{" "}
                    ta)
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryRowKeys([])}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200 cursor-pointer"
                >
                  Tozalash
                </button>
              </div>
            </div>
          )}
          <Table
            size="middle"
            loading={isLoading}
            dataSource={filteredCategoryList}
            columns={columns}
            rowKey="id"
            rowSelection={{
              selectedRowKeys: selectedCategoryRowKeys,
              onChange: (keys) => setSelectedCategoryRowKeys(keys),
            }}
            pagination={false}
            onRow={(cat) => ({
              onClick: () => setSelectedCatForProps(cat),
              className: `cursor-pointer transition-colors ${selectedCatForProps?.id === cat.id ? "!bg-indigo-50/70" : "hover:!bg-slate-50"
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
                <div className="mt-3 flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-white shrink-0">
                    <img
                      src={editingCategory.imageUrl}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                    {editingCategory.isBgRemoved && (
                      <span
                        className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] shadow-xs"
                        title="Shaffof fon (AI)"
                      >
                        <ShieldCheck className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => openAiBgModalForCategory(editingCategory)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>AI Fonni tozalash</span>
                    </button>
                    {editingCategory.originalImageUrl && (
                      <Popconfirm
                        title="Asl rasmga qaytarish?"
                        description="Fon tozalangan rasm o'rniga asl yuklangan rasm tiklanadi."
                        onConfirm={async () => {
                          await handleRevertCategoryImage(editingCategory.id);
                          setEditingCategory((prev) => ({
                            ...prev,
                            imageUrl: prev.originalImageUrl,
                            originalImageUrl: null,
                            isBgRemoved: false,
                          }));
                        }}
                        okText="Ha, tiklash"
                        cancelText="Bekor"
                      >
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs border border-amber-200 transition-all cursor-pointer"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          <span>Asliga qaytarish</span>
                        </button>
                      </Popconfirm>
                    )}
                  </div>
                </div>
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

      {/* 3D Category Images Sync Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-5 h-5 text-indigo-600 ${isSyncing ? "animate-spin" : ""}`} />
            <span className="font-black text-slate-900">
              Kategoriya Rasmlarini Bunny CDN ga Sinxronlash
            </span>
          </div>
        }
        open={isSyncModalOpen}
        onCancel={() => {
          if (!isSyncing) setIsSyncModalOpen(false);
          else message.warning("Jarayon davom etmoqda, iltimos kuting!");
        }}
        footer={[
          <Button
            key="cancel"
            disabled={isSyncing}
            onClick={() => setIsSyncModalOpen(false)}
            className="rounded-xl font-bold"
          >
            Yopish
          </Button>,
          <Button
            key="start"
            type="primary"
            loading={isSyncing}
            onClick={handleSyncCategoryImages}
            className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold inline-flex items-center gap-1.5"
          >
            <Play className="w-4 h-4" />
            <span>{isSyncing ? "Sinxronlanmoqda..." : "Sinxronlashni Boshlash"}</span>
          </Button>,
        ]}
        width={760}
        className="!rounded-3xl"
      >
        <div className="space-y-4 py-2">
          {/* Info Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-blue-50/60 to-purple-50/80 border border-indigo-100 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-black text-indigo-900">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>To'g'ri vizual tahlil va rasmiy Bunny CDN infratuzilmasi</span>
            </div>
            <ul className="list-disc list-inside text-slate-600 space-y-1 pl-1">
              <li>17 ta rasm vizual tahlil qilinib, haqiqiy kategoriyalarga biriktirilgan.</li>
              <li>Rasmlar backenddagi <code className="bg-indigo-100 text-indigo-800 px-1 py-0.5 rounded font-mono">POST /file/upload</code> orqali <strong>Bunny CDN</strong> (<span className="text-indigo-600 font-semibold">media.kelishamiz.uz</span>) ga yuklanadi.</li>
              <li><strong>Vercel Blob</strong> mutlaqo ishlatilmaydi.</li>
              <li>Har bir rasmni yuklagandan so'ng serverga ortiqcha yuk tushmasligi uchun <strong>1 soniya</strong> kutiladi.</li>
            </ul>
          </div>

          {/* Progress Section */}
          {(isSyncing || syncProgress > 0) && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700">{syncStepText}</span>
                <span className="text-indigo-600">{syncProgress}%</span>
              </div>
              <Progress
                percent={syncProgress}
                status={isSyncing ? "active" : syncProgress === 100 ? "success" : "normal"}
                strokeColor={{ "0%": "#6366f1", "100%": "#10b981" }}
              />
              {syncLogs.length > 0 && (
                <div className="max-h-36 overflow-y-auto bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] space-y-1">
                  {syncLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={
                        log.type === "success"
                          ? "text-emerald-400"
                          : log.type === "error"
                            ? "text-rose-400"
                            : log.type === "warning"
                              ? "text-amber-400"
                              : "text-slate-300"
                      }
                    >
                      <span className="text-slate-500 mr-1.5">[{log.time}]</span>
                      {log.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mapping Preview Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-100/70 px-4 py-2.5 text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Sinxronlanadigan Kategoriya Guruhlari ({CATEGORY_IMAGE_MAPPING.length} ta)</span>
              <span className="text-slate-500 font-normal">17 ta to'plam | ~157 ta bo'lim</span>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
              {CATEGORY_IMAGE_MAPPING.map((item, index) => (
                <div key={index} className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <img
                      src={`/category-images/${item.fileName}`}
                      alt={item.title}
                      className="w-10 h-10 object-contain rounded-xl bg-white border border-slate-200 p-1 shadow-xs"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{item.title}</div>
                      <div className="text-[11px] text-slate-500">{item.desc} • <span className="font-mono text-[10px] text-slate-400">{item.fileName}</span></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag color="blue" className="!rounded-lg text-[11px] font-semibold">
                      {item.categoryIds.length} ta kategoriya
                    </Tag>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* AI Background Removal Modal for Categories */}
      <ProductImageBgModal
        open={isBgModalOpen}
        onClose={() => {
          setIsBgModalOpen(false);
          setSelectedBgCategories([]);
        }}
        type="category"
        images={selectedBgCategories}
        onSuccess={() => {
          queryClient.invalidateQueries(["categories"]);
          queryClient.invalidateQueries(["categories-all"]);
          setSelectedCategoryRowKeys([]);
          if (editingCategory) {
            const updated = (allCategories || []).find((c) => c.id === editingCategory.id);
            if (updated) setEditingCategory(updated);
          }
        }}
      />
    </div>
  );
};

export default CategoryPage;
