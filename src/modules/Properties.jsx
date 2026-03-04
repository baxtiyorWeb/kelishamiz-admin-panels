"use client";

import React, { useState, useCallback, useMemo } from "react";
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

  // --- API QUERIES ---

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["allCategories"],
    queryFn: async () => (await api.get("/category")).data,
    staleTime: 5 * 60 * 1000,
  });

  const categoryList = useMemo(() => {
    const rawData = categoriesData?.content || categoriesData || [];
    return isArray(rawData) ? rawData : [];
  }, [categoriesData]);

  const { data: allPropertiesData, isLoading: allPropertiesLoading } = useQuery({
    queryKey: ["allProperties"],
    queryFn: async () => (await api.get("/property")).data,
  });

  // --- HELPERS ---

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
    
    return rawProps.map(p => ({
      ...p,
      categoryName: p.category?.name || "—",
      categoryId: p.category?.id || null
    }));
  }, [allPropertiesData]);

  // --- MUTATIONS ---

  const createPropertyMutation = useMutation({
    mutationFn: (payload) => api.post("/property", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allProperties"] });
      message.success("Xususiyat qo'shildi! ✨");
      // MODAL YOPILMAYDI, faqat inputlar tozalanadi
      setPropertyFormData({
        ...initialPropertyState,
        categoryId: propertyFormData.categoryId // Oxirgi tanlangan kategoriya qolsin (qulaylik uchun)
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
      message.success("Xususiyat yangilandi! ✅");
      setIsModalOpen(false); // Tahrirlashda modal yopiladi
      setPropertyFormData(initialPropertyState);
    },
    onError: (err) => {
      message.error(get(err, "response.data.message", "Yangilashda xato"));
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: (id) => api.delete(`/property/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allProperties"] });
      message.success("O'chirildi! 🗑️");
    },
  });

  // --- HANDLERS ---

  const handleSubmit = () => {
    const { name, type, categoryId, options } = propertyFormData;
    
    if (!name.trim()) return message.warning("Nomini kiriting!");
    if (!categoryId) return message.warning("Kategoriyani tanlang!");

    const payload = {
      name: name.trim(),
      type: type[0],
      categoryId: categoryId,
    };

    if (payload.type === "SELECT") {
      const cleanedOptions = options.map(o => o.trim()).filter(Boolean);
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
      type: [record.type],
      categoryId: record.categoryId,
      options: isArray(record.options) ? record.options : [],
    });
    setIsModalOpen(true);
  };

  // --- COLUMNS ---

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "Nomi", dataIndex: "name", key: "name" },
    { title: "Turi", dataIndex: "type", key: "type" },
    { title: "Kategoriya", dataIndex: "categoryName", key: "categoryName" },
    {
      title: "Harakat",
      key: "action",
      width: 120,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button icon={<Edit size={16} />} onClick={() => handleOpenEdit(record)} />
          <Popconfirm title="O'chirasizmi?" onConfirm={() => deletePropertyMutation.mutate(record.id)}>
            <Button danger icon={<Trash size={16} />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Xususiyatlar</h2>
        <Button 
          type="primary" 
          icon={<Plus size={18} />} 
          onClick={() => {
            setIsEditMode(false);
            setPropertyFormData(initialPropertyState);
            setIsModalOpen(true);
          }}
        >
          Yangi xususiyat
        </Button>
      </div>

      <Table
        dataSource={propertiesList}
        columnDefs={columns}
        rowKey="id"
        loading={allPropertiesLoading || categoriesLoading}
      />

      <ModalComponent
        title={isEditMode ? "Tahrirlash" : "Yangi qo'shish"}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        handleFunc={handleSubmit} // AppModal'dagi nomga moslandi
        loading={createPropertyMutation.isPending || updatePropertyMutation.isPending} // AppModal'dagi nomga moslandi
      >
        <div className="space-y-4 py-4">
          <div>
            <label className="block mb-1">Xususiyat nomi</label>
            <InputComponent
              value={propertyFormData.name}
              onChange={(e) => setPropertyFormData({ ...propertyFormData, name: e.target.value })}
              placeholder="Masalan: Rang"
            />
          </div>

          <div>
            <label className="block mb-1">Kategoriya</label>
            <CascaderComponent
              value={propertyFormData.categoryId ? [propertyFormData.categoryId] : []}
              options={cascaderOptions}
              onChange={(val) => setPropertyFormData({ ...propertyFormData, categoryId: val?.[val.length - 1] })}
              placeholder="Tanlang"
              changeOnSelect
            />
          </div>

          <div>
            <label className="block mb-1">Ma'lumot turi</label>
            <CascaderComponent
              value={propertyFormData.type}
              options={typeOptions}
              onChange={(val) => setPropertyFormData({ ...propertyFormData, type: val, options: val[0] === 'SELECT' ? propertyFormData.options : [] })}
              isCascader={false}
            />
          </div>

          {propertyFormData.type[0] === "SELECT" && (
            <div>
              <label className="block mb-1">Variantlar (vergul bilan)</label>
              <InputComponent
                value={propertyFormData.options.join(", ")}
                onChange={(e) => setPropertyFormData({ ...propertyFormData, options: e.target.value.split(",").map(s => s.trim()) })}
                placeholder="Qizil, Yashil, Ko'k"
              />
            </div>
          )}
        </div>
      </ModalComponent>
    </div>
  );
};

export default Properties;
