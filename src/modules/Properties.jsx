"use client";

import React, { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, isArray } from "lodash";
import { Button, Popconfirm, message, Spin } from "antd";
import { Edit, Trash } from "lucide-react";

// Lokal komponentlar va API
import InputComponent from "./../components/Input";
import ModalComponent from "./../components/Modal";
import Table from "./../components/Table";
import CascaderComponent from "../components/Cascader";
import api from "../config/auth/api";

const initialPropertyState = {
  id: null,
  name: "",
  type: ["STRING"], // CascaderComponent uchun array formatida default
  categoryId: null,
  options: [],
};

// Property turlari
const typeOptions = [
  { value: "STRING", label: "String" },
  { value: "NUMBER", label: "Number" },
  { value: "BOOLEAN", label: "Boolean" },
  { value: "DATE", label: "Date" },
  { value: "SELECT", label: "Select" },
];

const Properties = () => {
  const queryClient = useQueryClient();

  // --- State boshqaruvi ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [propertyFormData, setPropertyFormData] =
    useState(initialPropertyState);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);

  // --- API chaqiruvlari ---

  // 1. Barcha kategoriyalarni olish
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["allCategories"],
    queryFn: async () => (await api.get("/category")).data,
    staleTime: 5 * 60 * 1000,
  });

  const categoryList = isArray(get(categoriesData, "content", []))
    ? get(categoriesData, "content")
    : [];

  // 2. Filtrlangan property'larni olish (tanlangan kategoriya bo'yicha)
  const {
    data: filteredPropertiesData,
    isLoading: filteredPropertiesLoading,
    isFetching: isFiltering,
  } = useQuery({
    queryKey: ["categoryProperties", selectedCategoryFilter],
    queryFn: async () => {
      if (!selectedCategoryFilter) return null;
      return (await api.get(`/category/${selectedCategoryFilter}/properties`))
        .data;
    },
    enabled: !!selectedCategoryFilter,
  });

  // 3. Barcha property'larni olish (Filter tanlanmagan bo'lsa)
  const { data: allPropertiesData, isLoading: allPropertiesLoading } = useQuery(
    {
      queryKey: ["allProperties"],
      queryFn: async () => (await api.get("/property")).data,
      enabled: !selectedCategoryFilter,
    }
  );

  // --- Data formatlash ---

  // Cascader Options uchun kategoriya daraxtini yasash
  const buildCascaderOptions = (categories = []) => {
    return categories.map((category) => {
      const option = {
        value: category.id,
        label: category.name,
      };

      if (category.children && category.children.length > 0) {
        option.children = buildCascaderOptions(category.children);
      }

      return option;
    });
  };

  const cascaderOptions = buildCascaderOptions(categoryList);

  // Kategoriya ID'si bo'yicha nomini topish uchun yordamchi funksiya
  const getCategoryNameById = useCallback(
    (id) => {
      // Agar bu loyiha kichik bo'lsa, oddiy qidirish ishlaydi
      const flatCategories = (categories) => {
        let result = [];
        categories?.forEach((cat) => {
          result.push({ id: cat.id, name: cat.name });
          if (cat.children) {
            result = result.concat(flatCategories(cat.children));
          }
        });
        return result;
      };
      const allFlatCategories = flatCategories(categoryList);
      return allFlatCategories.find((cat) => cat.id === id)?.name;
    },
    [categoryList]
  );

  // Jadval uchun property listini tayyorlash
  const formatPropertiesForTable = (data, isFiltered) => {
    if (!data || !data.content) return [];

    if (isFiltered) {
      // Filtrlangan ma'lumotlar Category/ID/properties endpointidan keladi
      const properties = [];
      data.content.forEach((category) => {
        if (category.properties && Array.isArray(category.properties)) {
          category.properties.forEach((property) => {
            properties.push({
              ...property,
              categoryName: category.name, // Kategoriya nomi to'g'ridan-to'g'ri keladi
              categoryId: category.id,
            });
          });
        }
      });
      return properties;
    } else {
      // Barcha ma'lumotlar /property endpointidan keladi
      // categoryName ni topish kerak
      return data.content.map((prop) => ({
        ...prop,
        categoryName:
          getCategoryNameById(prop?.category?.id) ||
          `ID: ${prop?.category?.name}`,
      }));
    }
  };

  const currentPropertiesList = selectedCategoryFilter
    ? formatPropertiesForTable(filteredPropertiesData, true)
    : formatPropertiesForTable(allPropertiesData, false);

  // --- Mutatsiyalar ---

  // Yaratish
  const createPropertyMutation = useMutation({
    mutationFn: async (property) => api.post("/property", property),
    onSuccess: () => {
      queryClient.invalidateQueries(["allProperties"]);
      if (selectedCategoryFilter) {
        queryClient.invalidateQueries([
          "categoryProperties",
          selectedCategoryFilter,
        ]);
      }
      setIsModalOpen(false);
      message.success("Xususiyat muvaffaqiyatli yaratildi! ✨");
    },
    onError: (error) => {
      message.error(
        "Yaratishda xato: " +
          get(error, "response.data.message", "Noma'lum xato")
      );
    },
  });

  // Tahrirlash
  const updatePropertyMutation = useMutation({
    mutationFn: async (property) => {
      const { id, ...updateData } = property;
      return api.put(`/property/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["allProperties"]);
      if (selectedCategoryFilter) {
        queryClient.invalidateQueries([
          "categoryProperties",
          selectedCategoryFilter,
        ]);
      }
      setIsModalOpen(false);
      message.success("Xususiyat muvaffaqiyatli tahrirlandi! ✏️");
    },
    onError: (error) => {
      message.error(
        "Tahrirlashda xato: " +
          get(error, "response.data.message", "Noma'lum xato")
      );
    },
  });

  // O'chirish
  const deletePropertyMutation = useMutation({
    mutationFn: async (id) => api.delete(`/property/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["allProperties"]);
      if (selectedCategoryFilter) {
        queryClient.invalidateQueries([
          "categoryProperties",
          selectedCategoryFilter,
        ]);
      }
      message.success("Xususiyat muvaffaqiyatli o'chirildi! 🗑️");
    },
    onError: (error) => {
      message.error(
        "O'chirishda xato: " +
          get(error, "response.data.message", "Noma'lum xato")
      );
    },
  });

  // --- Event Handlerlar ---

  const resetForm = () => {
    setPropertyFormData(initialPropertyState);
    setIsEditMode(false);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record) => {
    setIsEditMode(true);
    // Type qiymatini Cascader/Select uchun array formatida saqlash
    const typeValue = record.type ? [record.type] : ["STRING"];
    // Options null/string bo'lsa ham arrayga aylantiramiz
    const optionsArray = Array.isArray(record.options)
      ? record.options
      : record.options
      ? record.options.split(",").map((o) => o.trim())
      : [];

    setPropertyFormData({
      id: record.id,
      name: record.name,
      type: typeValue,
      categoryId: record.categoryId,
      options: optionsArray,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    const { name, type, categoryId, options } = propertyFormData;

    if (!name || !categoryId || !type || type.length === 0) {
      message.error("Ism, Kategoriya va Tur majburiy maydonlar.");
      return;
    }

    const propertyType = type[0].toString();

    const propertyPayload = {
      name,
      type: propertyType,
      categoryId,
      options:
        propertyType === "SELECT"
          ? options.map((opt) => opt.trim()).filter((opt) => opt.length > 0)
          : null,
    };

    if (isEditMode) {
      if (!propertyFormData.id)
        return message.error("Tahrirlash uchun ID topilmadi.");
      updatePropertyMutation.mutate({
        ...propertyPayload,
        id: propertyFormData.id,
      });
    } else {
      createPropertyMutation.mutate(propertyPayload);
    }
  };

  const handleDelete = (id) => {
    deletePropertyMutation.mutate(id);
  };

  // Kategoriya tanlanganda eng oxirgi ID ni state'ga yozish
  const handleCategoryChange = (value) => {
    const lastSelectedId = Array.isArray(value)
      ? value[value.length - 1]
      : value;
    setPropertyFormData((prev) => ({ ...prev, categoryId: lastSelectedId }));
  };

  // Type o'zgarganda options ni reset qilish
  const handleTypeChange = (value) => {
    setPropertyFormData((prev) => ({
      ...prev,
      type: value,
      options: value[0] === "SELECT" ? prev.options : [],
    }));
  };

  const handleOptionsChange = (e) => {
    // Inputdan kelgan stringni vergul orqali arrayga ajratish
    const newOptionsArray = e.target.value.split(",");
    setPropertyFormData((prev) => ({ ...prev, options: newOptionsArray }));
  };

  // Kategoriya filterini boshqarish
  const handleCategoryFilterChange = (value) => {
    if (!value || value.length === 0) {
      setSelectedCategoryFilter(null);
    } else {
      const lastSelectedId = Array.isArray(value)
        ? value[value.length - 1]
        : value;
      setSelectedCategoryFilter(lastSelectedId);
    }
  };

  // --- Jadval ustunlari ---
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Nomi",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Turi",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Kategoriya",
      dataIndex: "categoryName",
      key: "categoryName",
      render: (text, record) => text || record.categoryId || "-",
    },
    {
      title: "Variantlar (Options)",
      key: "options",
      render: (_, record) => {
        if (record.type === "SELECT" && Array.isArray(record.options)) {
          return record.options.join(", ");
        }
        return "-";
      },
    },
    {
      title: "Harakat",
      key: "action",
      render: (_, record) => (
        <div className="flex space-x-2">
          <Button
            type="primary"
            size="small"
            onClick={() => handleOpenEditModal(record)}
          >
            <Edit size={14} />
          </Button>
          <Popconfirm
            title="Haqiqatan ham ushbu xususiyatni o'chirmoqchimisiz?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ha"
            cancelText="Yo'q"
            okButtonProps={{ loading: deletePropertyMutation.isPending }}
          >
            <Button
              type="primary"
              danger
              size="small"
              loading={
                deletePropertyMutation.isPending &&
                deletePropertyMutation.variables === record.id
              }
            >
              <Trash size={14} />
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const isMutating =
    createPropertyMutation.isPending || updatePropertyMutation.isPending;

  const isLoadingData =
    categoriesLoading ||
    allPropertiesLoading ||
    (selectedCategoryFilter ? filteredPropertiesLoading : false) ||
    isFiltering;

  if (categoriesLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Kategoriyalar yuklanmoqda..." />
      </div>
    );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">
        Xususiyatlarni Boshqarish (Properties)
      </h2>
      <hr className="mb-4" />

      {/* Kategoriya bo'yicha Filterlash */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <label
          htmlFor="categoryFilter"
          className="font-medium whitespace-nowrap"
        >
          Kategoriya bo'yicha filter:
        </label>
        <CascaderComponent
          id="categoryFilter"
          value={selectedCategoryFilter ? [selectedCategoryFilter] : []}
          onChange={handleCategoryFilterChange}
          options={cascaderOptions}
          placeholder="Filterlash uchun kategoriyani tanlang"
          changeOnSelect
          allowClear
          style={{ width: "100%", maxWidth: "400px" }}
        />
        <Button
          type="default"
          onClick={() => setSelectedCategoryFilter(null)}
          disabled={!selectedCategoryFilter}
        >
          Filterni Tozalash
        </Button>
      </div>

      <Button
        type="primary"
        className="mb-4 float-end"
        onClick={handleOpenCreateModal}
      >
        + Xususiyat qo'shish
      </Button>

      {/* Xususiyatlar jadvali */}
      <Table
        dataSource={currentPropertiesList}
        columnDefs={columns}
        rowKey="id"
        loading={isLoadingData}
        locale={{
          emptyText: selectedCategoryFilter
            ? "Ushbu kategoriya uchun xususiyatlar topilmadi."
            : "Barcha xususiyatlar yuklanmoqda yoki mavjud emas.",
        }}
      />

      {/* Yaratish/Tahrirlash Modali */}
      <ModalComponent
        handleFunc={handleSubmit}
        setIsModalOpen={setIsModalOpen}
        isModalOpen={isModalOpen}
        title={isEditMode ? "Xususiyatni Tahrirlash" : "Xususiyat qo'shish"}
        okText={isEditMode ? "Saqlash" : "Qo'shish"}
        loading={isMutating}
      >
        <div className="grid gap-4 py-4">
          {/* Nomi */}
          <div className="grid grid-cols-1 items-center gap-2">
            <label htmlFor="name" className="text-left font-medium">
              Nomi
            </label>
            <InputComponent
              id="name"
              value={propertyFormData.name}
              onChange={(e) =>
                setPropertyFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Xususiyat nomini kiriting"
            />
          </div>

          {/* Type */}
          <div className="grid grid-cols-1 items-center gap-2">
            <label htmlFor="type" className="text-left font-medium">
              Turi
            </label>
            <CascaderComponent
              id="type"
              value={propertyFormData.type}
              onChange={handleTypeChange}
              options={typeOptions}
              placeholder="Turni tanlang"
              style={{ width: "100%" }}
              isCascader={false}
            />
          </div>

          {/* Category */}
          <div className="grid grid-cols-1 items-center gap-2">
            <label htmlFor="category" className="text-left font-medium">
              Kategoriya
            </label>
            <CascaderComponent
              id="category"
              value={
                propertyFormData.categoryId ? [propertyFormData.categoryId] : []
              }
              onChange={handleCategoryChange}
              options={cascaderOptions}
              placeholder="Kategoriyani tanlang"
              changeOnSelect
              allowClear
            />
          </div>

          {/* Options (faqat SELECT uchun) */}
          {propertyFormData.type[0] === "SELECT" && (
            <div className="grid grid-cols-1 items-center gap-2">
              <label htmlFor="options" className="text-left font-medium">
                Variantlar (vergul bilan ajratilgan)
              </label>
              <InputComponent
                id="options"
                // Arrayni vergul bilan ajratilgan stringga aylantiramiz
                value={propertyFormData.options.join(", ")}
                onChange={handleOptionsChange}
                placeholder="Variant1, Variant2, Variant3"
              />
            </div>
          )}
        </div>
      </ModalComponent>
    </div>
  );
};

export default Properties;
