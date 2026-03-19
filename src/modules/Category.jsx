"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, isArray } from "lodash";
import {
  Button,
  Popconfirm,
  message,
  TreeSelect,
  Switch,
  Tooltip,
} from "antd";
import { 
  ArrowLeft, 
  ArrowRight, 
  Edit, 
  Trash, 
  Settings2, 
  UploadCloud, 
  Plus 
} from "lucide-react";

import InputComponent from "./../components/Input";
import ModalComponent from "./../components/Modal";
import FileUploadComponent from "./../components/Upload";
import Table from "./../components/Table";
import CascaderComponent from "../components/Cascader";
import api from "../config/auth/api";

// --- Initial States ---
const initialCategoryState = {
  name: "",
  imageUrl: "",
  parentId: null,
  isVisible: true,
  order: 0,
};

const initialPropertyState = {
  name: "",
  type: ["STRING"],
  options: [],
};

const typeOptions = [
  { value: "STRING", label: "Matn (String)" },
  { value: "INTEGER", label: "Butun son (Integer)" },
  { value: "DOUBLE", label: "O'nlik son (Double)" },
  { value: "BOOLEAN", label: "Ha/Yo'q (Boolean)" },
  { value: "SELECT", label: "Tanlovli ro'yxat (Select)" },
];

const Category = () => {
  const queryClient = useQueryClient();

  // --- States ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);

  const [categoryData, setCategoryData] = useState(initialCategoryState);
  const [editingCategory, setEditingCategory] = useState(initialCategoryState);
  const [propertyData, setPropertyData] = useState(initialPropertyState);
  
  const [selectedId, setSelectedId] = useState(null);
  const [activeCategoryIdForProp, setActiveCategoryIdForProp] = useState(null);
  const [history, setHistory] = useState([]);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- Queries ---
  const { data, isLoading } = useQuery({
    queryKey: ["categories", selectedId],
    queryFn: async () => {
      const parentIdQuery = selectedId !== null ? `?parentId=${selectedId}` : "";
      const response = await api.get(`/category${parentIdQuery}`);
      return response.data?.content || response.data || [];
    },
  });

  const categoryList = useMemo(() => (isArray(data) ? data : []), [data]);

  // --- Mutations ---

  // 1. Kategoriya yaratish
  const createCategoryMutation = useMutation({
    mutationFn: async (category) => api.post("/category", category),
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      message.success("Kategoriya qo'shildi! ✨");
      setCategoryData({
        ...initialCategoryState,
        parentId: categoryData.parentId || selectedId
      });
    },
    onError: (error) => message.error(get(error, "response.data.message", "Xato")),
  });

  // 2. Kategoriya tahrirlash
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, ...updateData }) => api.put(`/category/${id}`, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      setIsEditModalOpen(false);
      message.success("Yangilandi! ✅");
    },
  });

  // 3. Xususiyat qo'shish (Kategoriya ichida)
  const createPropertyMutation = useMutation({
    mutationFn: async (payload) => api.post("/property", payload),
    onSuccess: () => {
      message.success("Xususiyat muvaffaqiyatli qo'shildi! ⚙️");
      setPropertyData(initialPropertyState); // Modal yopilmaydi, faqat tozalanadi
    },
    onError: (error) => message.error(get(error, "response.data.message", "Xato")),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id) => api.delete(`/category/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      message.success("O'chirildi! 🗑️");
    },
  });

  // --- Handlers ---
  const handleFileUpload = useCallback(async (file, target = "create") => {
    const formData = new FormData();
    formData.append("file", file);
    setIsUploading(true);
    try {
      const response = await api.post("/file/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const imageUrl = response.data?.content?.url || "";
      if (target === "edit") setEditingCategory((prev) => ({ ...prev, imageUrl }));
      else setCategoryData((prev) => ({ ...prev, imageUrl }));
      message.success("Rasm yuklandi!");
    } catch (error) {
      message.error("Rasm yuklashda xato!");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handlePropertySubmit = () => {
    if (!propertyData.name) return message.warning("Xususiyat nomini kiriting!");
    createPropertyMutation.mutate({
      name: propertyData.name,
      type: propertyData.type[0],
      categoryId: String(activeCategoryIdForProp),
      options: propertyData.type[0] === "SELECT" ? propertyData.options : [],
    });
  };

  const transformToTreeData = (categories) => {
    if (!isArray(categories)) return [];
    return categories.map((item) => ({
      title: item.name,
      value: item.id,
      key: item.id,
      children: item.children ? transformToTreeData(item.children) : undefined,
    }));
  };

  // --- Table Columns ---
  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "Nomi", dataIndex: "name", key: "name" },
    {
      title: "Ko'rinishi",
      dataIndex: "isVisible",
      key: "isVisible",
      width: 100,
      render: (isVisible, record) => (
        <Switch
          checked={isVisible}
          onChange={(checked) => updateCategoryMutation.mutate({ id: record.id, isVisible: checked })}
          loading={updateCategoryMutation.isPending}
        />
      ),
    },
    {
      title: "Keyingi",
      key: "goToChild",
      width: 80,
      render: (_, record) => (
        <ArrowRight
          className="cursor-pointer border p-1 hover:bg-gray-100 rounded"
          size={28}
          onClick={() => {
            setHistory((prev) => [...prev, selectedId]);
            setSelectedId(record.id);
          }}
        />
      ),
    },
    {
      title: "Harakatlar",
      key: "action",
      width: 180,
      render: (_, record) => (
        <div className="flex gap-2">
          <Tooltip title="Xususiyat qo'shish">
            <Button 
              icon={<Settings2 size={18} className="text-purple-600" />} 
              onClick={() => {
                setActiveCategoryIdForProp(record.id);
                setIsPropertyModalOpen(true);
              }}
            />
          </Tooltip>
          <Button 
            icon={<Edit size={18} className="text-blue-500" />} 
            onClick={() => {
              setCurrentEditId(record.id);
              setEditingCategory({
                name: record.name,
                imageUrl: record.imageUrl || "",
                isVisible: record.isVisible,
                order: record.order,
                parentId: record.parent?.id || record.parentId || null,
              });
              setIsEditModalOpen(true);
            }} 
          />
          <Popconfirm title="O'chirasizmi?" onConfirm={() => deleteCategoryMutation.mutate(record.id)}>
            <Button danger icon={<Trash size={18} />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Kategoriyalar</h2>
        <div className="flex gap-2">
          <Button 
            icon={<UploadCloud size={18} />} 
            onClick={() => setIsBulkUploadModalOpen(true)}
          >
            Fayl orqali yuklash
          </Button>
          <Button 
            type="primary" 
            icon={<Plus size={18} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Kategoriya qo'shish
          </Button>
        </div>
      </div>

      <div className="flex mb-4">
        {(history.length > 0 || selectedId !== null) && (
          <Button 
            icon={<ArrowLeft size={16} />} 
            onClick={() => {
              const prev = history[history.length - 1];
              setSelectedId(prev !== undefined ? prev : null);
              setHistory(history.slice(0, -1));
            }}
          >
            Orqaga
          </Button>
        )}
      </div>

      <Table
        dataSource={categoryList}
        columnDefs={columns}
        loading={isLoading}
        rowKey="id"
      />

      {/* --- Create Category Modal --- */}
      <ModalComponent
        title="Yangi kategoriya"
        isModalOpen={isCreateModalOpen}
        setIsModalOpen={setIsCreateModalOpen}
        handleFunc={() => {
            if (!categoryData.name) return message.warning("Nomini kiriting!");
            createCategoryMutation.mutate({
                ...categoryData,
                parentId: categoryData.parentId || selectedId || null,
            });
        }}
        loading={createCategoryMutation.isPending || isUploading}
      >
        <div className="flex flex-col gap-4 py-4">
          <div>
            <label className="block mb-1 font-medium">Nomi</label>
            <InputComponent
              value={categoryData.name}
              onChange={(e) => setCategoryData({ ...categoryData, name: e.target.value })}
              placeholder="Masalan: Elektronika"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Yuqori kategoriya (Parent)</label>
            <TreeSelect
              className="w-full"
              value={categoryData.parentId || selectedId}
              treeData={transformToTreeData(categoryList)}
              onChange={(v) => setCategoryData({ ...categoryData, parentId: v })}
              allowClear
              placeholder="Asosiy kategoriya"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Rasm yuklash</label>
            <FileUploadComponent onFileSelect={(file) => handleFileUpload(file)} />
            {categoryData.imageUrl && (
              <img src={categoryData.imageUrl} alt="preview" className="mt-2 w-20 h-20 object-cover rounded border" />
            )}
          </div>
        </div>
      </ModalComponent>

      {/* --- Property Add Modal --- */}
      <ModalComponent
        title="Kategoriyaga xususiyat qo'shish"
        isModalOpen={isPropertyModalOpen}
        setIsModalOpen={setIsPropertyModalOpen}
        handleFunc={handlePropertySubmit}
        loading={createPropertyMutation.isPending}
      >
        <div className="space-y-4 py-4">
          <div>
            <label className="block mb-1">Xususiyat nomi</label>
            <InputComponent
              value={propertyData.name}
              onChange={(e) => setPropertyData({ ...propertyData, name: e.target.value })}
              placeholder="Masalan: Rang, Hajm..."
            />
          </div>
          <div>
            <label className="block mb-1">Ma'lumot turi</label>
            <CascaderComponent
              value={propertyData.type}
              options={typeOptions}
              onChange={(val) => setPropertyData({ ...propertyData, type: val })}
              isCascader={false}
            />
          </div>
          {propertyData.type[0] === "SELECT" && (
            <div>
              <label className="block mb-1">Variantlar (vergul bilan)</label>
              <InputComponent
                value={propertyData.options.join(", ")}
                onChange={(e) => setPropertyData({ ...propertyData, options: e.target.value.split(",").map(s => s.trim()) })}
                placeholder="Qizil, Yashil, Ko'k"
              />
            </div>
          )}
        </div>
      </ModalComponent>

      {/* --- Bulk Upload Modal --- */}
      <ModalComponent
        title="Fayl orqali yuklash (.xlsx, .csv)"
        isModalOpen={isBulkUploadModalOpen}
        setIsModalOpen={setIsBulkUploadModalOpen}
        handleFunc={() => {
            message.info("Faylni qayta ishlash boshlandi...");
            setIsBulkUploadModalOpen(false);
        }}
      >
        <div className="py-10 flex flex-col items-center border-2 border-dashed border-gray-300 rounded-lg">
           <FileUploadComponent onFileSelect={(file) => console.log("Bulk file selected", file)} />
           <p className="mt-2 text-gray-500 text-sm">Shablonni yuklab oling va to'ldirib qayta yuklang</p>
        </div>
      </ModalComponent>

      {/* --- Edit Modal --- */}
      <ModalComponent
        title="Tahrirlash"
        isModalOpen={isEditModalOpen}
        setIsModalOpen={setIsEditModalOpen}
        handleFunc={() => updateCategoryMutation.mutate({ id: currentEditId, ...editingCategory })}
        loading={updateCategoryMutation.isPending || isUploading}
      >
        <div className="flex flex-col gap-4 py-4">
          <InputComponent
            value={editingCategory.name}
            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
          />
          <TreeSelect
            className="w-full"
            value={editingCategory.parentId}
            treeData={transformToTreeData(categoryList)}
            onChange={(v) => setEditingCategory({ ...editingCategory, parentId: v })}
          />
          <FileUploadComponent onFileSelect={(file) => handleFileUpload(file, "edit")} />
        </div>
      </ModalComponent>
    </div>
  );
};

export default Category;