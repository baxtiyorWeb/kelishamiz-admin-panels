"use client";

import React, { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, isArray } from "lodash";
import { Button, Popconfirm, message, Spin } from "antd";
import { Edit, Trash, Plus } from "lucide-react";

import InputComponent from "./../components/Input";
import ModalComponent from "./../components/Modal";
import Table from "./../components/Table";
import CascaderComponent from "../components/Cascader";
import api from "../config/auth/api";

const initialPropertyState = {
  id: null,
  name: "",
  type: ["STRING"],
  categoryId: null,
  options: [],
};

const typeOptions = [
  { value: "STRING", label: "Matn (String)" },
  { value: "INTEGER", label: "Butun son (Integer)" },
  { value: "DOUBLE", label: "O'nlik son (Double/Float)" },
  { value: "BOOLEAN", label: "Ha/Yo'q (Boolean)" },
  { value: "SELECT", label: "Tanlovli ro'yxat (Select)" },
];

const Properties = () => {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [propertyFormData, setPropertyFormData] = useState(initialPropertyState);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);

  // API Queries
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["allCategories"],
    queryFn: async () => (await api.get("/category")).data,
    staleTime: 5 * 60 * 1000,
  });

  const categoryList = isArray(get(categoriesData, "content", []))
    ? get(categoriesData, "content", [])
    : isArray(categoriesData)
    ? categoriesData
    : [];

  const {
    data: filteredPropertiesData,
    isLoading: filteredPropertiesLoading,
    isFetching: isFiltering,
  } = useQuery({
    queryKey: ["categoryProperties", selectedCategoryFilter],
    queryFn: async () => {
      if (!selectedCategoryFilter) return null;
      return (await api.get(`/category/${selectedCategoryFilter}/properties`)).data;
    },
    enabled: !!selectedCategoryFilter,
  });

  const { data: allPropertiesData, isLoading: allPropertiesLoading } = useQuery({
    queryKey: ["allProperties"],
    queryFn: async () => (await api.get("/property")).data,
    enabled: !selectedCategoryFilter,
  });

  // Helpers
  const buildCascaderOptions = (categories = []) => {
    return categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
      children: cat.children?.length ? buildCascaderOptions(cat.children) : undefined,
    }));
  };

  const cascaderOptions = buildCascaderOptions(categoryList);

  const getCategoryNameById = useCallback(
    (id) => {
      if (!id) return "—";
      const flatten = (cats) => {
        let res = [];
        cats.forEach((c) => {
          res.push({ id: c.id, name: c.name });
          if (c.children) res = res.concat(flatten(c.children));
        });
        return res;
      };
      return flatten(categoryList).find((c) => c.id === id)?.name ?? `ID: ${id}`;
    },
    [categoryList]
  );

  const formatPropertiesForTable = (data, isFiltered) => {
    if (!data?.content && !isArray(data)) return [];

    if (isFiltered) {
      const props = [];
      data?.content?.forEach((cat) => {
        cat.properties?.forEach((p) => {
          props.push({
            ...p,
            categoryName: cat.name,
            categoryId: cat.id,
          });
        });
      });
      return props;
    }

    const sourceArray = data?.content || data || [];
    return sourceArray.map((p) => ({
      ...p,
      categoryName: p.category?.name || getCategoryNameById(p.category?.id),
      categoryId: p.category?.id,
    }));
  };

  const currentPropertiesList = selectedCategoryFilter
    ? formatPropertiesForTable(filteredPropertiesData, true)
    : formatPropertiesForTable(allPropertiesData, false);

  // Mutations
  const createPropertyMutation = useMutation({
    mutationFn: (payload) => api.post("/property", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allProperties"] });
      if (selectedCategoryFilter) {
        queryClient.invalidateQueries({ queryKey: ["categoryProperties", selectedCategoryFilter] });
      }
      message.success("Xususiyat qo'shildi");
      // Modal yopilmaydi, faqat formani tozalaymiz
      clearFormFields();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.response?.data?.error || "Xatolik yuz berdi";
      message.error(msg);
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: ({ id, ...payload }) => api.put(`/property/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allProperties"] });
      if (selectedCategoryFilter) {
        queryClient.invalidateQueries({ queryKey: ["categoryProperties", selectedCategoryFilter] });
      }
      message.success("Xususiyat yangilandi");
      // Tahrirlashda esa modalni yopamiz
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.response?.data?.error || "Xatolik yuz berdi";
      message.error(msg);
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: (id) => api.delete(`/property/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allProperties"] });
      if (selectedCategoryFilter) {
        queryClient.invalidateQueries({ queryKey: ["categoryProperties", selectedCategoryFilter] });
      }
      message.success("Xususiyat o'chirildi");
    },
    onError: (err) => {
      message.error(err.response?.data?.message || "O'chirishda xatolik yuz berdi");
    },
  });

  // Form Handlers
  const resetForm = () => {
    setPropertyFormData(initialPropertyState);
    setIsEditMode(false);
  };

  const clearFormFields = () => {
    // Faqat input maydonlarini tozalash, modal holati va kategoriya filtri o'zgarmaydi
    setPropertyFormData((prev) => ({
      ...prev,
      id: null,
      name: "",
      type: ["STRING"],
      options: [],
      // categoryId saqlanadi - oxirgi tanlangan kategoriya qoladi
    }));
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record) => {
    setIsEditMode(true);
    setPropertyFormData({
      id: record.id,
      name: record.name || "",
      type: [record.type || "STRING"],
      categoryId: record.category?.id || null,
      options: isArray(record.options) ? record.options : [],
    });
    setIsModalOpen(true);
  };

  const validateAndPreparePayload = () => {
    const { name, type, categoryId, options } = propertyFormData;

    if (!name.trim()) return { error: "Nomini kiriting" };
    if (!categoryId) return { error: "Kategoriyani tanlang" };
    if (!type.length) return { error: "Turini tanlang" };

    const typeValue = type[0];

    const payload = {
      name: name.trim(),
      type: typeValue,
      categoryId: categoryId, // Backend CreatePropertyDto da categoryId kutadi
    };

    if (typeValue === "SELECT") {
      const cleaned = options.map((o) => o.trim()).filter(Boolean);
      if (cleaned.length === 0) {
        return { error: "SELECT turi uchun kamida 1 ta variant kiriting" };
      }
      payload.options = cleaned;
    }

    return { payload };
  };

  const handleSubmit = () => {
    const result = validateAndPreparePayload();
    if (result.error) {
      message.error(result.error);
      return;
    }

    if (isEditMode) {
      if (!propertyFormData.id) {
        message.error("Tahrirlash uchun ID topilmadi");
        return;
      }
      updatePropertyMutation.mutate({
        id: propertyFormData.id,
        ...result.payload,
      });
    } else {
      createPropertyMutation.mutate(result.payload);
    }
  };

  const handleDelete = (id) => {
    deletePropertyMutation.mutate(id);
  };

  const handleCategoryChange = (value) => {
    const lastId = value?.[value.length - 1] ?? null;
    setPropertyFormData((prev) => ({ ...prev, categoryId: lastId }));
  };

  const handleTypeChange = (value) => {
    const newType = value?.[0] || "STRING";
    setPropertyFormData((prev) => ({
      ...prev,
      type: [newType],
      options: newType === "SELECT" ? prev.options : [],
    }));
  };

  const handleOptionsChange = (e) => {
    const text = e.target.value;
    const arr = text.split(",").map((s) => s.trim());
    setPropertyFormData((prev) => ({ ...prev, options: arr }));
  };

  const handleCategoryFilterChange = (value) => {
    const lastId = value?.[value.length - 1] ?? null;
    setSelectedCategoryFilter(lastId);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    // Modal yopilganda formani to'liq tozalaymiz
    resetForm();
  };

  // Table Columns
  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "Nomi", dataIndex: "name", key: "name" },
    { title: "Turi", dataIndex: "type", key: "type", width: 160 },
    {
      title: "Kategoriya",
      dataIndex: "categoryName",
      key: "categoryName",
      render: (text) => text || "—",
    },
    {
      title: "Variantlar",
      key: "options",
      render: (_, r) =>
        r.type === "SELECT" && isArray(r.options) && r.options.length
          ? r.options.join(", ")
          : "—",
    },
    {
      title: "Harakat",
      key: "action",
      width: 120,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="default"
            size="small"
            icon={<Edit size={16} />}
            onClick={() => handleOpenEditModal(record)}
          />
          <Popconfirm
            title="O'chirishni tasdiqlaysizmi?"
            okText="Ha"
            cancelText="Yo'q"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="default" danger size="small" icon={<Trash size={16} />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const isLoadingData =
    categoriesLoading ||
    allPropertiesLoading ||
    (selectedCategoryFilter ? filteredPropertiesLoading || isFiltering : false);

  if (categoriesLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spin size="large" tip="Kategoriyalar yuklanmoqda..." />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold">Xususiyatlar (Properties)</h2>
        <Button type="primary" icon={<Plus size={18} />} onClick={handleOpenCreateModal}>
          Yangi xususiyat
        </Button>
      </div>

    
      <Table
        dataSource={currentPropertiesList}
        columnDefs={columns}
        rowKey="id"
        loading={isLoadingData}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        locale={{
          emptyText: selectedCategoryFilter
            ? "Ushbu kategoriyada xususiyatlar yo'q"
            : "Xususiyatlar hali mavjud emas yoki yuklanmoqda...",
        }}
      />

      {/* Modal */}
      <ModalComponent
        isModalOpen={isModalOpen}
        setIsModalOpen={handleModalClose}
        title={isEditMode ? "Xususiyatni tahrirlash" : "Yangi xususiyat qo'shish"}
        okText={isEditMode ? "Saqlash" : "Qo'shish"}
        cancelText="Yopish"
        onOk={handleSubmit}
        confirmLoading={createPropertyMutation.isPending || updatePropertyMutation.isPending}
        width={520}
      >
        <div className="space-y-5 py-2">
          <div>
            <label className="block mb-1 font-medium">Nomi *</label>
            <InputComponent
              value={propertyFormData.name}
              onChange={(e) => setPropertyFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="Masalan: Rang, Hajmi, Brend..."
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Turi *</label>
            <CascaderComponent
              value={propertyFormData.type}
              onChange={handleTypeChange}
              options={typeOptions}
              placeholder="Turini tanlang"
              style={{ width: "100%" }}
              allowClear={false}
              isCascader={false}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Kategoriya *</label>
            <CascaderComponent
              value={propertyFormData.categoryId ? [propertyFormData.categoryId] : []}
              onChange={handleCategoryChange}
              options={cascaderOptions}
              placeholder="Kategoriyani tanlang..."
              changeOnSelect
              allowClear
              style={{ width: "100%" }}
            />
          </div>

          {propertyFormData.type[0] === "SELECT" && (
            <div>
              <label className="block mb-1 font-medium">Variantlar (vergul bilan ajratilgan) *</label>
              <InputComponent
                value={propertyFormData.options.join(", ")}
                onChange={handleOptionsChange}
                placeholder="Qora, Oq, Kulrang, Qizil"
              />
              <p className="text-xs text-gray-500 mt-1">Misol: Qora, Oq, Kulrang</p>
            </div>
          )}
        </div>
      </ModalComponent>
    </div>
  );
};

export default Properties;