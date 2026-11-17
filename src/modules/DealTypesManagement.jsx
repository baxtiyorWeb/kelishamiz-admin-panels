import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isArray } from "lodash";
import {
  Button,
  Modal,
  Drawer,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Tag,
  Space,
  InputNumber,
  Row,
  Col,
  Tabs,
  Tooltip,
  Card,
  Spin,
  Alert,
  Checkbox,
  Badge,
  Divider,
} from "antd";
import {
  Tag as TagIcon,
  Plus,
  Edit3,
  Trash2,
  Layers,
  CheckCircle2,
  XCircle,
  FolderTree,
  Globe,
  Sparkles,
  Info,
  HelpCircle,
  RotateCcw,
  Search,
  Filter,
  Check,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Key,
  ShoppingBag,
  Home,
  CreditCard,
  Repeat,
  ChevronRight,
  CheckSquare,
  Square,
  AlertCircle,
} from "lucide-react";
import api from "../config/auth/api";
import { CompactStatCard } from "../components/CompactStatCard";
import AppTable from "../components/Table";

export const PRESET_DEAL_TYPES_MAP = {
  SELL: { key: "SELL", label: "Sotaman", labelRu: "Продаю", desc: "Sotuvga chiqarish", icon: TagIcon, color: "blue" },
  RENT_OUT: { key: "RENT_OUT", label: "Ijaraga beraman", labelRu: "Сдам в аренду", desc: "Ijaraga topshirish", icon: Key, color: "emerald" },
  DAILY_RENT: { key: "DAILY_RENT", label: "Kunlik ijara", labelRu: "Посуточная аренда", desc: "Kunlik ijaraga berish", icon: Calendar, color: "purple" },
  BUY: { key: "BUY", label: "Sotib olaman", labelRu: "Куплю", desc: "Sotib olish istagi", icon: ShoppingBag, color: "amber" },
  RENT_IN: { key: "RENT_IN", label: "Ijaraga olaman", labelRu: "Арендую", desc: "Ijaraga olish istagi", icon: Home, color: "indigo" },
  INSTALLMENT: { key: "INSTALLMENT", label: "Bo'lib to'lash", labelRu: "В рассрочку", desc: "Nasiya / muddatli to'lov", icon: CreditCard, color: "cyan" },
  VIPKUP: { key: "VIPKUP", label: "Boshlang'ich to'lov (Vipkup)", labelRu: "С выкупом", desc: "Vipkup shartlarida", icon: ShieldCheck, color: "orange" },
  EXCHANGE: { key: "EXCHANGE", label: "Barter / Almashish", labelRu: "Обмен / Бартер", desc: "Almashish istagi", icon: Repeat, color: "rose" },
};

export const DEFAULT_DEAL_TYPES_LIST = Object.values(PRESET_DEAL_TYPES_MAP).map(
  ({ key, label, labelRu, desc }) => ({ key, label, labelRu, desc })
);

const QUICK_CATEGORY_PRESETS = [
  {
    id: "sell_only",
    title: "Faqat Sotuv",
    desc: "Oddiy tovarlar uchun",
    badge: "1 tur",
    keys: ["SELL"],
  },
  {
    id: "rent_and_sell",
    title: "Ijara & Sotuv",
    desc: "Kvartira, xonadon, ofislar",
    badge: "3 tur",
    keys: ["SELL", "RENT_OUT", "DAILY_RENT"],
  },
  {
    id: "auto_and_credit",
    title: "Avto & Nasiya",
    desc: "Avtomobillar, mototransport",
    badge: "4 tur",
    keys: ["SELL", "INSTALLMENT", "VIPKUP", "EXCHANGE"],
  },
  {
    id: "real_estate_full",
    title: "Ko'chmas Mulk To'liq",
    desc: "Barcha ko'chmas mulk turlari",
    badge: "5 tur",
    keys: ["SELL", "RENT_OUT", "DAILY_RENT", "BUY", "RENT_IN"],
  },
  {
    id: "all_standard",
    title: "Barcha 8 ta tur",
    desc: "Barcha mumkin bo'lgan bitimlar",
    badge: "8 tur",
    keys: ["SELL", "RENT_OUT", "DAILY_RENT", "BUY", "RENT_IN", "INSTALLMENT", "VIPKUP", "EXCHANGE"],
  },
];

export default function DealTypesManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("categories");

  // Filter & Search states for Category Matrix
  const [catSearch, setCatSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'custom' | 'inherited' | 'default'
  const [dealTypeFilter, setDealTypeFilter] = useState("all");

  // Drawer state for editing category deal types
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [drawerDealTypes, setDrawerDealTypes] = useState([]);
  const [drawerApplyToChildren, setDrawerApplyToChildren] = useState(false);

  // Custom deal type input inside drawer
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customKey, setCustomKey] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [customDesc, setCustomDesc] = useState("");

  // Registry (Global) Modal state
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [editingRegItem, setEditingRegItem] = useState(null);
  const [regForm] = Form.useForm();

  // 1. Fetch categories
  const { data: rawCategories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["deal-types-categories"],
    queryFn: async () => {
      const res = await api.get("/category");
      return res.data?.content || res.data || [];
    },
  });

  // 2. Fetch global settings for product_deal_types
  const { data: rawSettings = {}, isLoading: isSettingsLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await api.get("/settings");
      return res.data;
    },
  });

  const settings = rawSettings?.content || rawSettings || {};
  const globalDealTypes = useMemo(() => {
    return isArray(settings.product_deal_types) && settings.product_deal_types.length > 0
      ? settings.product_deal_types
      : DEFAULT_DEAL_TYPES_LIST.map((item, idx) => ({
          ...item,
          id: item.key,
          order: idx + 1,
          isActive: true,
          categoryIds: [],
        }));
  }, [settings.product_deal_types]);

  // Build flattened category list with hierarchy path and parent lookups
  const { flatCategories, categoryMap, rootCategories } = useMemo(() => {
    const list = isArray(rawCategories) ? rawCategories : [];
    const map = new Map();
    const flat = [];
    const roots = [];

    // First map all categories by ID
    list.forEach((c) => {
      map.set(Number(c.id), c);
      if (!c.parentId && !c.parent?.id) {
        roots.push(c);
      }
    });

    // Helper to get parent chain
    const getParentChain = (cat) => {
      const chain = [];
      let current = cat;
      while (current) {
        const pId = current.parentId || current.parent?.id;
        if (!pId) break;
        const parent = map.get(Number(pId));
        if (parent) {
          chain.unshift(parent);
          current = parent;
        } else {
          break;
        }
      }
      return chain;
    };

    list.forEach((cat) => {
      const chain = getParentChain(cat);
      const pathNames = [...chain.map((p) => p.name), cat.name];
      const hasOwnDealTypes = Array.isArray(cat.dealTypes) && cat.dealTypes.length > 0;

      // Find inherited deal types if any
      let inheritedFrom = null;
      let effectiveDealTypes = [];
      let mode = "default"; // 'custom' | 'inherited' | 'default'

      if (hasOwnDealTypes) {
        mode = "custom";
        effectiveDealTypes = cat.dealTypes;
      } else {
        // Look up chain from immediate parent upwards
        for (let i = chain.length - 1; i >= 0; i--) {
          const parent = chain[i];
          if (Array.isArray(parent.dealTypes) && parent.dealTypes.length > 0) {
            inheritedFrom = parent;
            effectiveDealTypes = parent.dealTypes;
            mode = "inherited";
            break;
          }
        }
        if (mode === "default") {
          effectiveDealTypes = DEFAULT_DEAL_TYPES_LIST;
        }
      }

      flat.push({
        ...cat,
        id: Number(cat.id),
        chain,
        path: pathNames.join(" › "),
        level: chain.length,
        hasOwnDealTypes,
        inheritedFrom,
        effectiveDealTypes,
        mode,
      });
    });

    return { flatCategories: flat, categoryMap: map, rootCategories: roots };
  }, [rawCategories]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = flatCategories.length;
    const custom = flatCategories.filter((c) => c.mode === "custom").length;
    const inherited = flatCategories.filter((c) => c.mode === "inherited").length;
    const def = flatCategories.filter((c) => c.mode === "default").length;
    const activeGlobal = globalDealTypes.filter((t) => t.isActive !== false).length;

    return { total, custom, inherited, def, activeGlobal };
  }, [flatCategories, globalDealTypes]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return flatCategories.filter((cat) => {
      if (catSearch.trim()) {
        const q = catSearch.toLowerCase().trim();
        const matchesName = cat.name.toLowerCase().includes(q) || cat.path.toLowerCase().includes(q);
        const matchesId = String(cat.id) === q;
        if (!matchesName && !matchesId) return false;
      }
      if (statusFilter !== "all") {
        if (cat.mode !== statusFilter) return false;
      }
      if (dealTypeFilter !== "all") {
        const hasKey = cat.effectiveDealTypes.some(
          (dt) => (dt.key || dt.id || "").toUpperCase() === dealTypeFilter.toUpperCase()
        );
        if (!hasKey) return false;
      }
      return true;
    });
  }, [flatCategories, catSearch, statusFilter, dealTypeFilter]);

  // -------------------------------------------------------------
  // MUTATIONS
  // -------------------------------------------------------------
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.put(`/category/${id}`, payload);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deal-types-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories-all"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      message.success(
        variables.payload.applyToChildren
          ? "Kategoriya va barcha ichki kategoriyalar e'lon turlari muvaffaqiyatli yangilandi!"
          : "Kategoriya e'lon turlari saqlandi!"
      );
      setIsDrawerOpen(false);
      setSelectedCategory(null);
    },
    onError: (err) => {
      message.error(err.response?.data?.message || "Xatolik yuz berdi");
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async ({ payload, reason }) => {
      const res = await api.put("/settings", {
        settings: payload,
        reason: reason || "E'lon turlari registri yangilandi",
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      message.success("Global e'lon turlari registri muvaffaqiyatli yangilandi!");
      setIsRegModalOpen(false);
      regForm.resetFields();
    },
    onError: (err) => {
      message.error(err.response?.data?.message || "Xatolik yuz berdi");
    },
  });

  // -------------------------------------------------------------
  // DRAWER HANDLERS
  // -------------------------------------------------------------
  const handleOpenDrawer = (category) => {
    setSelectedCategory(category);
    // If category has own deal types, clone them; otherwise use empty array (so it's clear)
    if (category.hasOwnDealTypes && Array.isArray(category.dealTypes)) {
      setDrawerDealTypes([...category.dealTypes]);
    } else {
      // Default to empty so user can choose preset or custom
      setDrawerDealTypes([]);
    }
    setDrawerApplyToChildren(false);
    setIsAddingCustom(false);
    setCustomKey("");
    setCustomLabel("");
    setCustomDesc("");
    setIsDrawerOpen(true);
  };

  const handleApplyPreset = (preset) => {
    const list = preset.keys.map((k) => {
      const presetInfo = PRESET_DEAL_TYPES_MAP[k];
      return {
        key: k,
        label: presetInfo?.label || k,
        desc: presetInfo?.desc || "",
      };
    });
    setDrawerDealTypes(list);
  };

  const handleToggleDealType = (key) => {
    const exists = drawerDealTypes.some((item) => (item.key || item.id) === key);
    if (exists) {
      setDrawerDealTypes(drawerDealTypes.filter((item) => (item.key || item.id) !== key));
    } else {
      const presetInfo = PRESET_DEAL_TYPES_MAP[key];
      const newItem = {
        key,
        label: presetInfo?.label || key,
        desc: presetInfo?.desc || "",
      };
      setDrawerDealTypes([...drawerDealTypes, newItem]);
    }
  };

  const handleAddCustomDealType = () => {
    const label = customLabel.trim();
    if (!label) {
      message.warning("Iltimos, e'lon turi nomini kiriting");
      return;
    }
    const key =
      customKey.trim().toUpperCase() ||
      label
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "_")
        .slice(0, 30);
    const exists = drawerDealTypes.some((item) => (item.key || item.id) === key);
    if (exists) {
      message.warning(`"${key}" kalitli e'lon turi allaqachon mavjud!`);
      return;
    }
    setDrawerDealTypes([
      ...drawerDealTypes,
      {
        key,
        label,
        desc: customDesc.trim() || undefined,
      },
    ]);
    setCustomKey("");
    setCustomLabel("");
    setCustomDesc("");
    setIsAddingCustom(false);
  };

  const handleSaveDrawer = () => {
    if (!selectedCategory) return;
    updateCategoryMutation.mutate({
      id: selectedCategory.id,
      payload: {
        dealTypes: drawerDealTypes.length > 0 ? drawerDealTypes : null,
        applyToChildren: drawerApplyToChildren,
      },
    });
  };

  const handleResetCategoryToInherit = (cat) => {
    updateCategoryMutation.mutate({
      id: cat.id,
      payload: {
        dealTypes: null,
        applyToChildren: false,
      },
    });
  };

  // -------------------------------------------------------------
  // REGISTRY MODAL HANDLERS
  // -------------------------------------------------------------
  const handleOpenAddRegItem = () => {
    setEditingRegItem(null);
    regForm.resetFields();
    regForm.setFieldsValue({
      order: globalDealTypes.length + 1,
      isActive: true,
      categoryIds: [],
    });
    setIsRegModalOpen(true);
  };

  const handleOpenEditRegItem = (record) => {
    setEditingRegItem(record);
    regForm.setFieldsValue({
      key: record.key || record.id,
      label: record.label,
      labelRu: record.labelRu || "",
      desc: record.desc || "",
      order: record.order ?? 1,
      isActive: record.isActive !== false,
      categoryIds: record.categoryIds ? record.categoryIds.map(Number) : [],
    });
    setIsRegModalOpen(true);
  };

  const handleToggleRegActive = (record) => {
    const updated = globalDealTypes.map((item) =>
      item.id === record.id || item.key === record.key ? { ...item, isActive: !item.isActive } : item
    );
    updateSettingsMutation.mutate({
      payload: { product_deal_types: updated },
      reason: `E'lon turi '${record.label}' faolligi o'zgartirildi`,
    });
  };

  const handleDeleteRegItem = (record) => {
    const updated = globalDealTypes.filter((item) => item.id !== record.id && item.key !== record.key);
    updateSettingsMutation.mutate({
      payload: { product_deal_types: updated },
      reason: `E'lon turi '${record.label}' o'chirildi`,
    });
  };

  const handleSaveRegItem = async () => {
    try {
      const values = await regForm.validateFields();
      const rawKey =
        values.key?.trim().toUpperCase() ||
        values.label
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "_")
          .slice(0, 30);

      let updated;
      if (editingRegItem) {
        updated = globalDealTypes.map((item) =>
          item.id === editingRegItem.id || item.key === editingRegItem.key
            ? {
                ...item,
                id: rawKey,
                key: rawKey,
                label: values.label.trim(),
                labelRu: values.labelRu?.trim() || values.label.trim(),
                desc: values.desc?.trim() || "",
                order: Number(values.order) || 1,
                isActive: Boolean(values.isActive),
                categoryIds: values.categoryIds || [],
              }
            : item
        );
      } else {
        const newItem = {
          id: rawKey,
          key: rawKey,
          label: values.label.trim(),
          labelRu: values.labelRu?.trim() || values.label.trim(),
          desc: values.desc?.trim() || "",
          order: Number(values.order) || globalDealTypes.length + 1,
          isActive: Boolean(values.isActive),
          categoryIds: values.categoryIds || [],
        };
        updated = [...globalDealTypes, newItem];
      }

      updateSettingsMutation.mutate({
        payload: { product_deal_types: updated },
        reason: editingRegItem
          ? `E'lon turi '${values.label}' tahrirlandi`
          : `Yangi e'lon turi '${values.label}' qo'shildi`,
      });
    } catch (e) {
      // validation failed
    }
  };

  const handleResetToFactoryDefaults = () => {
    updateSettingsMutation.mutate({
      payload: {
        product_deal_types: DEFAULT_DEAL_TYPES_LIST.map((item, idx) => ({
          ...item,
          id: item.key,
          order: idx + 1,
          isActive: true,
          categoryIds: [],
        })),
      },
      reason: "E'lon turlari standart qiymatlarga tiklandi",
    });
  };

  // -------------------------------------------------------------
  // TABLE COLUMNS: CATEGORY MATRIX
  // -------------------------------------------------------------
  const categoryColumns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      render: (id) => <span className="font-mono text-xs text-slate-400">#{id}</span>,
    },
    {
      title: "Kategoriya Nomi & Ierarxiya",
      dataIndex: "name",
      key: "name",
      width: 280,
      render: (name, record) => {
        return (
          <div className="flex flex-col gap-0.5" style={{ paddingLeft: record.level * 16 }}>
            <div className="flex items-center gap-2">
              {record.level > 0 && <span className="text-slate-300 text-xs">└─</span>}
              {record.imageUrl ? (
                <img
                  src={record.imageUrl}
                  alt={name}
                  className="w-6 h-6 rounded-md object-cover border border-slate-200"
                />
              ) : (
                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-400">
                  <FolderTree className="w-3.5 h-3.5" />
                </div>
              )}
              <span className="font-bold text-slate-800 text-sm">{name}</span>
            </div>
            {record.level > 0 && (
              <span className="text-[11px] text-slate-400 pl-8 line-clamp-1">{record.path}</span>
            )}
          </div>
        );
      },
    },
    {
      title: "Amaldagi E'lon Turlari",
      dataIndex: "effectiveDealTypes",
      key: "effectiveDealTypes",
      render: (types = [], record) => {
        if (!types || types.length === 0) {
          return <span className="text-xs text-slate-400 italic">Mavjud emas</span>;
        }
        return (
          <div className="flex flex-wrap gap-1.5 max-w-xl">
            {types.map((dt) => {
              const k = (dt.key || dt.id || "").toUpperCase();
              const preset = PRESET_DEAL_TYPES_MAP[k];
              const color = preset?.color || "default";
              return (
                <Tag
                  key={k}
                  color={color}
                  className="rounded-lg font-semibold text-xs px-2 py-0.5 inline-flex items-center gap-1"
                >
                  <span>{dt.label || preset?.label || k}</span>
                  <span className="font-mono text-[9px] opacity-70">({k})</span>
                </Tag>
              );
            })}
          </div>
        );
      },
    },
    {
      title: "Manba / Status",
      dataIndex: "mode",
      key: "mode",
      width: 170,
      render: (mode, record) => {
        if (mode === "custom") {
          return (
            <Tag color="purple" className="rounded-md font-semibold text-xs inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-600" />
              Maxsus sozlangan
            </Tag>
          );
        }
        if (mode === "inherited") {
          return (
            <Tooltip title={`Ota kategoriya: "${record.inheritedFrom?.name}" dan meros olingan`}>
              <Tag color="blue" className="rounded-md font-medium text-xs inline-flex items-center gap-1 cursor-help">
                <Layers className="w-3 h-3 text-blue-500" />
                <span>Ota kategoriyadan meros</span>
              </Tag>
            </Tooltip>
          );
        }
        return (
          <Tag color="default" className="rounded-md text-xs inline-flex items-center gap-1 text-slate-500">
            <Globe className="w-3 h-3" />
            Standart tizim
          </Tag>
        );
      },
    },
    {
      title: "Amallar",
      key: "actions",
      width: 180,
      render: (_, record) => {
        return (
          <Space size="small">
            <Button
              type="primary"
              size="small"
              className="!rounded-lg !bg-indigo-600 hover:!bg-indigo-700 !font-medium flex items-center gap-1"
              icon={<Edit3 className="w-3.5 h-3.5" />}
              onClick={() => handleOpenDrawer(record)}
            >
              Sozlash
            </Button>
            {record.hasOwnDealTypes && (
              <Popconfirm
                title="Maxsus sozlamani bekor qilish"
                description={`"${record.name}" kategoriyasining shaxsiy e'lon turlarini o'chirib, ota kategoriyadan meros olishga qaytarmoqchimisiz?`}
                okText="Ha, merosga qaytarish"
                cancelText="Bekor"
                onConfirm={() => handleResetCategoryToInherit(record)}
              >
                <Tooltip title="Merosga qaytarish">
                  <Button
                    type="default"
                    size="small"
                    className="!rounded-lg text-slate-500 hover:text-slate-800"
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  // -------------------------------------------------------------
  // TABLE COLUMNS: GLOBAL REGISTRY
  // -------------------------------------------------------------
  const registryColumns = [
    {
      title: "№ / Tartib",
      dataIndex: "order",
      key: "order",
      width: 90,
      render: (val) => <span className="font-mono text-xs text-slate-500 font-bold">{val}</span>,
    },
    {
      title: "E'lon Turi Nomi (O'zbekcha)",
      dataIndex: "label",
      key: "label",
      render: (text, record) => {
        const k = (record.key || record.id || "").toUpperCase();
        const preset = PRESET_DEAL_TYPES_MAP[k];
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">{text}</span>
              <Tag color="cyan" className="font-mono text-[10px] m-0">
                {k}
              </Tag>
            </div>
            {record.desc && <span className="text-slate-400 text-xs italic">{record.desc}</span>}
          </div>
        );
      },
    },
    {
      title: "Nomi (Ruscha)",
      dataIndex: "labelRu",
      key: "labelRu",
      render: (text) => <span className="text-slate-600 text-xs">{text || "—"}</span>,
    },
    {
      title: "Bog'langan Kategoriyalar",
      dataIndex: "categoryIds",
      key: "categoryIds",
      render: (ids) => {
        if (!ids || ids.length === 0) {
          return (
            <Tag color="blue" className="rounded-md font-semibold text-xs inline-flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Barcha kategoriyalar (Umumiy)
            </Tag>
          );
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-md">
            {ids.map((cId) => {
              const cat = categoryMap.get(Number(cId));
              return (
                <Tag color="purple" key={cId} className="rounded-md font-medium text-xs">
                  {cat ? cat.name : `#${cId}`}
                </Tag>
              );
            })}
          </div>
        );
      },
    },
    {
      title: "Holati",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (isActive, record) => (
        <Switch
          size="small"
          checked={isActive !== false}
          loading={updateSettingsMutation.isPending}
          onChange={() => handleToggleRegActive(record)}
        />
      ),
    },
    {
      title: "Amallar",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Tahrirlash">
            <Button
              type="text"
              size="small"
              icon={<Edit3 className="w-3.5 h-3.5 text-blue-600" />}
              onClick={() => handleOpenEditRegItem(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Ushbu e'lon turini o'chirishga ishonchingiz komilmi?"
            description="Bu tur yangi e'lonlar variantlaridan o'chiriladi."
            okText="Ha, o'chirish"
            cancelText="Yo'q"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeleteRegItem(record)}
          >
            <Tooltip title="O'chirish">
              <Button
                type="text"
                size="small"
                danger
                icon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <TagIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                E'lon Turlari Boshqaruvi
              </h1>
              <p className="text-xs text-slate-500">
                Kategoriyalar bo'yicha sotuv/bitim turlari (Sotaman, Ijaraga beraman, Bo'lib to'lash) va umumiy registr
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "registry" ? (
            <>
              <Popconfirm
                title="Standart qiymatlarni tiklash"
                description="Barcha standart 8 ta e'lon turlarini zavod holatiga qaytarmoqchimisiz?"
                okText="Ha, tiklash"
                cancelText="Bekor"
                onConfirm={handleResetToFactoryDefaults}
              >
                <Button
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                  className="!rounded-xl text-slate-600 font-medium"
                >
                  Standartni Tiklash
                </Button>
              </Popconfirm>
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={handleOpenAddRegItem}
                className="!rounded-xl !bg-indigo-600 hover:!bg-indigo-700 font-bold shadow-sm"
              >
                Yangi Tur Qo'shish
              </Button>
            </>
          ) : (
            <Button
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["deal-types-categories"] });
                message.info("Kategoriyalar yangilandi");
              }}
              className="!rounded-xl text-slate-600 font-medium"
            >
              Yangilash
            </Button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            label="Jami Kategoriyalar"
            value={stats.total}
            unit="ta"
            color="slate"
            icon={FolderTree}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            label="Maxsus Sozlangan"
            value={stats.custom}
            unit="ta"
            color="purple"
            icon={Sparkles}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            label="Ota Kategoriyadan Meros"
            value={stats.inherited}
            unit="ta"
            color="blue"
            icon={Layers}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            label="Tizim Registri (Faol)"
            value={stats.activeGlobal}
            unit="ta tur"
            color="emerald"
            icon={CheckCircle2}
          />
        </Col>
      </Row>

      {/* Main Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        className="deal-types-tabs"
        items={[
          {
            key: "categories",
            label: (
              <span className="flex items-center gap-2 font-bold px-2 py-1">
                <FolderTree className="w-4 h-4 text-indigo-600" />
                Kategoriyalar Bo'yicha E'lon Turlari
              </span>
            ),
            children: (
              <div className="space-y-4">
                {/* Search & Filter Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 flex-1">
                    <Input
                      placeholder="Kategoriya nomi yoki ID bo'yicha qidirish..."
                      prefix={<Search className="w-4 h-4 text-slate-400 mr-1" />}
                      value={catSearch}
                      onChange={(e) => setCatSearch(e.target.value)}
                      allowClear
                      className="!rounded-xl max-w-sm"
                    />

                    <Select
                      value={statusFilter}
                      onChange={setStatusFilter}
                      className="!rounded-xl min-w-[180px]"
                      options={[
                        { value: "all", label: "Barcha holatlar" },
                        { value: "custom", label: "Faqat maxsus sozlangan" },
                        { value: "inherited", label: "Ota kategoriyadan meros" },
                        { value: "default", label: "Standart tizim" },
                      ]}
                    />

                    <Select
                      value={dealTypeFilter}
                      onChange={setDealTypeFilter}
                      className="!rounded-xl min-w-[190px]"
                      options={[
                        { value: "all", label: "Barcha e'lon turlari" },
                        ...Object.values(PRESET_DEAL_TYPES_MAP).map((dt) => ({
                          value: dt.key,
                          label: `${dt.label} (${dt.key})`,
                        })),
                      ]}
                    />
                  </div>

                  <div className="text-xs font-semibold text-slate-500">
                    Ko'rsatilmoqda: <span className="text-slate-900 font-bold">{filteredCategories.length}</span> ta kategoriya
                  </div>
                </div>

                {/* Categories Table */}
                <AppTable
                  isLoading={isCategoriesLoading}
                  dataSource={filteredCategories}
                  columnDefs={categoryColumns}
                  rowKey="id"
                  pageSize={25}
                  scroll={{ x: 1000 }}
                />
              </div>
            ),
          },
          {
            key: "registry",
            label: (
              <span className="flex items-center gap-2 font-bold px-2 py-1">
                <Globe className="w-4 h-4 text-emerald-600" />
                Tizim E'lon Turlari Registri
              </span>
            ),
            children: (
              <div className="space-y-4">
                <Alert
                  type="info"
                  showIcon
                  className="!rounded-2xl"
                  message="Tizim e'lon turlari registri"
                  description="Ushbu ro'yxat Kelishamiz platformasida mavjud barcha e'lon turlarini (Sotaman, Ijaraga beraman, Kunlik ijara, Bo'lib to'lash va h.k.) belgilaydi. Bu yerda yangi tur yaratish, ruscha/o'zbekcha tarjimalarni kiritish va alohida kategoriyalarga biriktirish mumkin."
                />

                <AppTable
                  isLoading={isSettingsLoading}
                  dataSource={globalDealTypes}
                  columnDefs={registryColumns}
                  rowKey="id"
                  scroll={{ x: 900 }}
                />
              </div>
            ),
          },
        ]}
      />

      {/* ------------------------------------------------------------- */}
      {/* DRAWER: EDIT CATEGORY DEAL TYPES */}
      {/* ------------------------------------------------------------- */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <TagIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-base">
                "{selectedCategory?.name}" e'lon turlarini sozlash
              </div>
              <div className="text-xs text-slate-400 font-normal">
                {selectedCategory?.path}
              </div>
            </div>
          </div>
        }
        placement="right"
        width={560}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        footer={
          <div className="flex items-center justify-between p-2">
            <Button
              onClick={() => {
                setDrawerDealTypes([]);
                message.info("E'lon turlari bo'shatildi (Merosga/Standartga qaytadi)");
              }}
              className="!rounded-xl text-slate-500 hover:text-slate-800"
            >
              Merosga Qaytarish
            </Button>
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsDrawerOpen(false)} className="!rounded-xl">
                Bekor qilish
              </Button>
              <Button
                type="primary"
                onClick={handleSaveDrawer}
                loading={updateCategoryMutation.isPending}
                className="!rounded-xl !bg-indigo-600 hover:!bg-indigo-700 font-bold"
              >
                Saqlash
              </Button>
            </div>
          </div>
        }
      >
        {selectedCategory && (
          <div className="space-y-6">
            {/* Current Status Info */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-bold text-slate-800">
                  Amaldagi holat:{" "}
                  {selectedCategory.mode === "custom" ? (
                    <span className="text-purple-600">Maxsus sozlangan</span>
                  ) : selectedCategory.mode === "inherited" ? (
                    <span className="text-blue-600">
                      Ota kategoriya ("{selectedCategory.inheritedFrom?.name}") dan meros
                    </span>
                  ) : (
                    <span className="text-slate-600">Standart tizim turlari</span>
                  )}
                </div>
                <p className="text-slate-500">
                  Ushbu kategoriyada yangi e'lon beruvchi foydalanuvchilar qaysi bitim turlarini tanlay olishini belgilang.
                </p>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Tezkor Shablonlar (1-bosishda):
                </span>
                <span className="text-[11px] text-slate-400">Tavsiya etilgan</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_CATEGORY_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 group-hover:text-indigo-600">
                        {preset.title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {preset.badge}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                      {preset.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Divider className="my-4" />

            {/* Deal Types Selector */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Ruxsat etilgan E'lon Turlari:
                </span>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {drawerDealTypes.length} ta tanlangan
                </span>
              </div>

              <div className="space-y-2">
                {Object.values(PRESET_DEAL_TYPES_MAP).map((dt) => {
                  const isChecked = drawerDealTypes.some(
                    (item) => (item.key || item.id || "").toUpperCase() === dt.key
                  );
                  const Icon = dt.icon || TagIcon;

                  return (
                    <div
                      key={dt.key}
                      onClick={() => handleToggleDealType(dt.key)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? "bg-indigo-50/70 border-indigo-500/80 shadow-2xs"
                          : "bg-white border-slate-200/90 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isChecked ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{dt.label}</span>
                            <span className="font-mono text-[10px] text-slate-400 bg-white/80 px-1.5 py-0.2 rounded border border-slate-200">
                              {dt.key}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 line-clamp-1">{dt.desc}</span>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isChecked
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom deal types added */}
            {drawerDealTypes.filter(
              (item) => !PRESET_DEAL_TYPES_MAP[(item.key || item.id || "").toUpperCase()]
            ).length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Qo'shimcha Maxsus Turlar:
                </span>
                <div className="space-y-2">
                  {drawerDealTypes
                    .filter((item) => !PRESET_DEAL_TYPES_MAP[(item.key || item.id || "").toUpperCase()])
                    .map((item) => (
                      <div
                        key={item.key}
                        className="p-3 rounded-2xl border border-purple-200 bg-purple-50/60 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-purple-900">{item.label}</span>
                            <Tag color="purple" className="font-mono text-[9px] m-0">
                              {item.key}
                            </Tag>
                          </div>
                          {item.desc && (
                            <span className="text-[11px] text-purple-600 italic">{item.desc}</span>
                          )}
                        </div>
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          onClick={() =>
                            setDrawerDealTypes(
                              drawerDealTypes.filter((d) => (d.key || d.id) !== item.key)
                            )
                          }
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Add Custom Deal Type */}
            <div>
              {!isAddingCustom ? (
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 cursor-pointer py-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Boshqa maxsus bitim turini qo'shish</span>
                </button>
              ) : (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="font-bold text-xs text-slate-800">Yangi Maxsus Tur Qo'shish</div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Nomi (masalan: Test-drayv)"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      className="!rounded-xl"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Kalit / Kod (masalan: TEST_DRIVE)"
                        value={customKey}
                        onChange={(e) => setCustomKey(e.target.value)}
                        className="!rounded-xl uppercase font-mono text-xs"
                      />
                      <Input
                        placeholder="Qisqacha tavsif (ixtiyoriy)"
                        value={customDesc}
                        onChange={(e) => setCustomDesc(e.target.value)}
                        className="!rounded-xl"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        size="small"
                        onClick={() => setIsAddingCustom(false)}
                        className="!rounded-lg text-xs"
                      >
                        Bekor
                      </Button>
                      <Button
                        size="small"
                        type="primary"
                        onClick={handleAddCustomDealType}
                        className="!rounded-lg !bg-indigo-600 text-xs font-semibold"
                      >
                        Qo'shish
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Divider className="my-3" />

            {/* Apply to Children Checkbox */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/60 to-orange-50/40 border border-amber-200/80 space-y-1.5">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={drawerApplyToChildren}
                  onChange={(e) => setDrawerApplyToChildren(e.target.checked)}
                  id="applyToChildren"
                />
                <label
                  htmlFor="applyToChildren"
                  className="font-bold text-xs text-slate-800 cursor-pointer"
                >
                  Barcha ichki (bola) kategoriyalarga ham tatbiq etish
                </label>
              </div>
              <p className="text-[11px] text-slate-500 pl-6">
                Belgilansa, ushbu kategoriyaning barcha quyi kategoriyalariga (ichki bo'limlariga) ham aynan shu e'lon turlari avtomatik o'rnatiladi.
              </p>
            </div>
          </div>
        )}
      </Drawer>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT GLOBAL REGISTRY DEAL TYPE */}
      {/* ------------------------------------------------------------- */}
      <Modal
        title={
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <TagIcon className="w-4 h-4 text-indigo-600" />
            {editingRegItem ? "E'lon Turini Tahrirlash" : "Yangi E'lon Turi Qo'shish"}
          </div>
        }
        open={isRegModalOpen}
        onCancel={() => setIsRegModalOpen(false)}
        onOk={handleSaveRegItem}
        confirmLoading={updateSettingsMutation.isPending}
        okText="Saqlash"
        cancelText="Bekor qilish"
        className="!rounded-3xl"
        width={520}
      >
        <Form form={regForm} layout="vertical" className="mt-4">
          <Form.Item
            name="label"
            label="Nomi (O'zbekcha)"
            rules={[{ required: true, message: "Nomini kiriting" }]}
          >
            <Input placeholder="Masalan: Sotaman" className="!rounded-xl" />
          </Form.Item>

          <Form.Item name="labelRu" label="Nomi (Ruscha)">
            <Input placeholder="Masalan: Продаю" className="!rounded-xl" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={14}>
              <Form.Item
                name="key"
                label="Kod / Kalit (Key)"
                rules={[{ required: true, message: "Kalitni kiriting" }]}
                tooltip="Tizim bo'ylab ishlatiladigan unikal kalit (masalan: SELL, RENT_OUT)"
              >
                <Input
                  placeholder="SELL"
                  disabled={!!editingRegItem}
                  className="!rounded-xl uppercase font-mono"
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="order" label="Tartib raqami">
                <InputNumber min={1} className="w-full !rounded-xl" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="desc" label="Qisqacha tavsif">
            <Input placeholder="Masalan: Sotuvga chiqarish" className="!rounded-xl" />
          </Form.Item>

          <Form.Item
            name="categoryIds"
            label="Biriktirilgan kategoriyalar"
            tooltip="Agar bo'sh qoldirilsa, barcha kategoriyalarda umumiy ko'rinadi"
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="Barcha kategoriyalar (Umumiy)"
              className="w-full !rounded-xl"
              options={flatCategories.map((c) => ({
                value: c.id,
                label: c.path,
              }))}
            />
          </Form.Item>

          <Form.Item name="isActive" valuePropName="checked" label="Faol holatda">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
