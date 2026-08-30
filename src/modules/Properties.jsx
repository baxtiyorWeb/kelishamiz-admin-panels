import React, { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, isArray } from "lodash";
import {
  Button,
  Popconfirm,
  message,
  Select,
  Modal,
  Input,
  Tag,
  Space,
  Cascader,
  Row,
  Col,
  Tabs,
  Tooltip,
} from "antd";
import {
  Sliders,
  Sparkles,
  Plus,
  Search,
  Edit3,
  Trash2,
  Layers,
  Tag as TagIcon,
  CheckCircle2,
  ListFilter,
  Type,
  Hash,
  ToggleLeft,
  List,
  FolderTree,
  X,
} from "lucide-react";
import Table from "./../components/Table";
import api from "../config/auth/api";

const initialPropertyState = {
  id: null,
  name: "",
  type: "STRING",
  categoryId: null,
  options: [],
  optionInput: "",
};

const TYPE_OPTIONS = [
  { value: "STRING", label: "Matn (String)", short: "ABC", color: "blue", bg: "bg-blue-50 text-blue-700 border-blue-200", icon: <Type className="w-3.5 h-3.5 text-blue-500" /> },
  { value: "INTEGER", label: "Butun son (Integer)", short: "123", color: "purple", bg: "bg-purple-50 text-purple-700 border-purple-200", icon: <Hash className="w-3.5 h-3.5 text-purple-500" /> },
  { value: "DOUBLE", label: "O'nlik son (Double)", short: "0.0", color: "gold", bg: "bg-amber-50 text-amber-700 border-amber-200", icon: <Hash className="w-3.5 h-3.5 text-amber-500" /> },
  { value: "BOOLEAN", label: "Ha / Yo'q (Boolean)", short: "Y/N", color: "green", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <ToggleLeft className="w-3.5 h-3.5 text-emerald-500" /> },
  { value: "SELECT", label: "Tanlovli ro'yxat (Select)", short: "List", color: "red", bg: "bg-rose-50 text-rose-700 border-rose-200", icon: <List className="w-3.5 h-3.5 text-rose-500" /> },
];

const Properties = () => {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [propertyFormData, setPropertyFormData] = useState(initialPropertyState);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Queries
  const { data: categoriesData } = useQuery({
    queryKey: ["allCategories"],
    queryFn: async () => (await api.get("/category")).data,
  });

  const categoryList = useMemo(() => {
    const rawData = categoriesData?.content || categoriesData || [];
    return isArray(rawData) ? rawData : [];
  }, [categoriesData]);

  const { data: allPropertiesData, isLoading } = useQuery({
    queryKey: ["allProperties"],
    queryFn: async () => (await api.get("/property")).data,
  });

  const cascaderOptions = useMemo(() => {
    const buildOptions = (cats) =>
      cats.map((cat) => ({
        value: cat.id,
        label: cat.name,
        children: cat.children?.length ? buildOptions(cat.children) : undefined,
      }));
    return buildOptions(categoryList);
  }, [categoryList]);

  const propertiesList = useMemo(() => {
    const rawProps = allPropertiesData?.content || allPropertiesData || [];
    if (!isArray(rawProps)) return [];
    return rawProps.map((p) => ({
      ...p,
      categoryName: p.category?.name || "—",
      categoryId: p.category?.id || null,
    }));
  }, [allPropertiesData]);

  // Real-time statistics
  const stats = useMemo(() => {
    const total = propertiesList.length;
    const selectType = propertiesList.filter((p) => p.type === "SELECT").length;
    const numericType = propertiesList.filter((p) => p.type === "INTEGER" || p.type === "DOUBLE").length;
    const uniqueCats = new Set(propertiesList.map((p) => p.categoryId).filter(Boolean)).size;

    return {
      total,
      selectType,
      numericType,
      uniqueCats,
    };
  }, [propertiesList]);

  // Mutations
  const createPropertyMutation = useMutation({
    mutationFn: (payload) => api.post("/property", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allProperties"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      message.success("Xususiyat muvaffaqiyatli qo'shildi!");
      setPropertyFormData({
        ...initialPropertyState,
        categoryId: propertyFormData.categoryId,
      });
    },
    onError: (err) => {
      message.error(get(err, "response.data.message", "Xatolik yuz berdi"));
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: ({ id, ...payload }) => api.put(`/property/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allProperties"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      message.success("Xususiyat yangilandi!");
      setIsModalOpen(false);
      setPropertyFormData(initialPropertyState);
    },
    onError: (err) => {
      message.error(get(err, "response.data.message", "Yangilashda xatolik"));
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: (id) => api.delete(`/property/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allProperties"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      message.success("Xususiyat o'chirildi!");
    },
  });

  const handleSubmit = () => {
    const { name, type, categoryId, options } = propertyFormData;
    if (!name.trim()) return message.warning("Nomini kiriting!");
    if (!categoryId) return message.warning("Kategoriyani tanlang!");

    const payload = {
      name: name.trim(),
      type: Array.isArray(type) ? type[0] : type,
      categoryId: String(Array.isArray(categoryId) ? categoryId[categoryId.length - 1] : categoryId),
    };

    if (payload.type === "SELECT") {
      const cleanedOptions = options.map((o) => o.trim()).filter(Boolean);
      if (cleanedOptions.length === 0) return message.warning("Variantlarni kiriting!");
      payload.options = cleanedOptions;
    }

    if (isEditMode) {
      updatePropertyMutation.mutate({ id: propertyFormData.id, ...payload });
    } else {
      createPropertyMutation.mutate(payload);
    }
  };

  const handleOpenEdit = (record) => {
    setIsEditMode(true);
    setPropertyFormData({
      id: record.id,
      name: record.name,
      type: record.type,
      categoryId: record.categoryId,
      options: isArray(record.options) ? record.options : [],
      optionInput: "",
    });
    setIsModalOpen(true);
  };

  const addOption = () => {
    if (!propertyFormData.optionInput?.trim()) return;
    const parts = propertyFormData.optionInput.split(",").map((s) => s.trim()).filter(Boolean);
    setPropertyFormData((prev) => ({
      ...prev,
      options: [...new Set([...prev.options, ...parts])],
      optionInput: "",
    }));
  };

  const removeOption = (idx) => {
    setPropertyFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== idx),
    }));
  };

  const filteredProperties = useMemo(() => {
    return propertiesList.filter((p) => {
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (categoryFilter && p.categoryId !== categoryFilter) return false;

      if (search.trim()) {
        const term = search.toLowerCase();
        return (
          p.name?.toLowerCase().includes(term) ||
          p.categoryName?.toLowerCase().includes(term) ||
          p.id?.toString().includes(term)
        );
      }
      return true;
    });
  }, [propertiesList, typeFilter, categoryFilter, search]);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      render: (id) => <span className="font-mono text-xs font-bold text-slate-400">#{id}</span>,
    },
    {
      title: "Xususiyat Parametri",
      dataIndex: "name",
      key: "name",
      width: 220,
      render: (name) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-slate-900 text-sm">{name}</span>
        </div>
      ),
    },
    {
      title: "Ma'lumot Turi",
      dataIndex: "type",
      key: "type",
      width: 170,
      render: (type) => {
        const conf = TYPE_OPTIONS.find((t) => t.value === type) || { label: type, color: "default", bg: "bg-slate-50 text-slate-700" };
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${conf.bg}`}>
            {conf.icon}
            <span>{conf.label}</span>
          </span>
        );
      },
    },
    {
      title: "Bog'langan Kategoriya",
      dataIndex: "categoryName",
      key: "categoryName",
      width: 200,
      render: (cat) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200">
          <Layers className="w-3.5 h-3.5 text-purple-500" />
          <span>{cat}</span>
        </span>
      ),
    },
    {
      title: "Variantlar (Tanlov Ro'yxati)",
      key: "options",
      render: (_, record) =>
        record.options?.length ? (
          <div className="flex gap-1.5 flex-wrap max-w-sm">
            {record.options.map((opt, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700"
              >
                {opt}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-slate-400 text-xs italic">— erkin qiymat —</span>
        ),
    },
    {
      title: "Amallar",
      key: "action",
      width: 95,
      render: (_, record) => (
        <div className="flex items-center gap-1.5">
          <Tooltip title="Tahrirlash">
            <button
              type="button"
              onClick={() => handleOpenEdit(record)}
              className="w-8 h-8 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </Tooltip>
          <Popconfirm
            title="Ushbu xususiyatni o'chirishga ishonchingiz komilmi?"
            onConfirm={() => deletePropertyMutation.mutate(record.id)}
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
              <Sliders className="w-4 h-4" />
            </div>
            Dinamik Mahsulot Xususiyatlari & Parametrlari
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Har bir kategoriya uchun maxsus filtrlar, xotira/rang variantlari va texnik xususiyatlar konstruktori.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Xususiyat yoki kategoriya..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all w-60"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setIsEditMode(false);
              setPropertyFormData(initialPropertyState);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Xususiyat</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jami Xususiyatlar</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{stats.total} ta</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Barcha filtr parametrlari</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sliders className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                Tanlovli (Select)
              </div>
              <div className="text-2xl font-black text-rose-600 mt-1">{stats.selectType} ta</div>
              <div className="text-[11px] text-rose-600/70 mt-0.5">Variantli ro'yxatlar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <List className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-purple-500 uppercase tracking-wider flex items-center gap-1">
                Raqamli Parametrlar
              </div>
              <div className="text-2xl font-black text-purple-600 mt-1">{stats.numericType} ta</div>
              <div className="text-[11px] text-purple-600/70 mt-0.5">Sonli diapazon filtrlari</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Hash className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                Bog'langan Bo'limlar
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{stats.uniqueCats} ta</div>
              <div className="text-[11px] text-emerald-600/70 mt-0.5">Parametrga ega kategoriyalar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
          </div>
        </Col>
      </Row>

      {/* Main Table Card with Type Tabs */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 overflow-hidden flex flex-col gap-4">
        {/* Type Tabs */}
        <div className="border-b border-slate-100 pb-2">
          <Tabs
            activeKey={typeFilter}
            onChange={(k) => setTypeFilter(k)}
            className="!m-0"
            items={[
              { key: "all", label: <span className="font-bold">Barchasi ({propertiesList.length})</span> },
              { key: "SELECT", label: <span className="font-bold text-rose-600">🔴 SELECT (Variantli)</span> },
              { key: "STRING", label: <span className="font-bold text-blue-600">🔵 STRING (Matn)</span> },
              { key: "INTEGER", label: <span className="font-bold text-purple-600">🟣 INTEGER (Son)</span> },
              { key: "DOUBLE", label: <span className="font-bold text-amber-600">🟡 DOUBLE (O'nlik)</span> },
              { key: "BOOLEAN", label: <span className="font-bold text-emerald-600">🟢 BOOLEAN (Ha/Yo'q)</span> },
            ]}
          />
        </div>

        <Table 
          dataSource={filteredProperties} 
          columnDefs={columns} 
          isLoading={isLoading} 
          rowKey="id" 
          page={page}
          pageSize={pageSize}
          setPage={setPage}
          setPageSize={setPageSize}
          total={filteredProperties.length}
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <span className="font-black text-slate-900 text-base">
              {isEditMode ? "Xususiyatni Tahrirlash" : "Yangi Xususiyat Qo'shish"}
            </span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={createPropertyMutation.isPending || updatePropertyMutation.isPending}
        okText={isEditMode ? "Saqlash" : "Qo'shish"}
        cancelText="Yopish"
        className="!rounded-3xl"
        width={540}
      >
        <div className="flex flex-col gap-4 mt-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Tegishli Kategoriya:</label>
            <Cascader
              options={cascaderOptions}
              placeholder="Kategoriyani tanlang"
              value={propertyFormData.categoryId}
              onChange={(val) => setPropertyFormData((prev) => ({ ...prev, categoryId: val }))}
              changeOnSelect
              className="w-full !rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Xususiyat Parametr Nomi:</label>
            <Input
              placeholder="Masalan: Xotira hajmi, Rangi, Ishlab chiqarilgan yili"
              value={propertyFormData.name}
              onChange={(e) => setPropertyFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="!rounded-xl h-11 font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Ma'lumot Turi:</label>
            <Select
              value={propertyFormData.type}
              onChange={(val) => setPropertyFormData((prev) => ({ ...prev, type: val }))}
              options={TYPE_OPTIONS.map((t) => ({
                value: t.value,
                label: (
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    {t.icon}
                    <span>{t.label}</span>
                  </div>
                ),
              }))}
              className="w-full !rounded-xl"
            />
          </div>

          {propertyFormData.type === "SELECT" && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2.5">
              <label className="text-xs font-bold text-slate-700">Variantlar Ro'yxati (Tanlov qiymatlari):</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Variant (Masalan: 128 GB, 256 GB)"
                  value={propertyFormData.optionInput}
                  onChange={(e) => setPropertyFormData((prev) => ({ ...prev, optionInput: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addOption();
                    }
                  }}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600 bg-white font-medium"
                />
                <button
                  type="button"
                  onClick={addOption}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all cursor-pointer"
                >
                  Qo'shish
                </button>
              </div>
              <div className="flex gap-1.5 flex-wrap mt-1">
                {propertyFormData.options.map((opt, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs"
                  >
                    <span>{opt}</span>
                    <X
                      className="w-3 h-3 text-slate-400 hover:text-rose-500 cursor-pointer"
                      onClick={() => removeOption(idx)}
                    />
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Properties;
