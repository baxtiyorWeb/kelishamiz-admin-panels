import React, { useState, useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, isArray } from "lodash";
import {
  Button,
  Popconfirm,
  message,
  Spin,
  TreeSelect,
  Switch,
  InputNumber,
} from "antd";
import { ArrowLeft, ArrowRight, Edit, Trash } from "lucide-react";

import InputComponent from "./../components/Input";
import ModalComponent from "./../components/Modal";
import FileUploadComponent from "./../components/Upload";
import Table from "./../components/Table";
import api from "../config/auth/api";

const initialCategoryState = {
  name: "",
  imageUrl: "",
  parentId: null,
  isVisible: true,
  order: 0,
};

const Category = () => {
  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [categoryData, setCategoryData] = useState(initialCategoryState);
  const [editingCategory, setEditingCategory] = useState(initialCategoryState);
  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory] = useState([]);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [page, setPage] = useState(1);
  const totalPages = 1;

  // 1. Kategoriyalarni olish (Interceptor formatiga moslangan)
  const { data, isLoading } = useQuery({
    queryKey: ["categories", selectedId],
    queryFn: async () => {
      const parentIdQuery = selectedId !== null ? `?parentId=${selectedId}` : "";
      const response = await api.get(`/category${parentIdQuery}`);
      // Interceptor content ichida qaytaradi
      return response.data?.content || response.data || [];
    },
  });

  const categoryList = useMemo(() => (isArray(data) ? data : []), [data]);

  // 2. Kategoriya yaratish
  const createCategoryMutation = useMutation({
    mutationFn: async (category) => api.post("/category", category),
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      setIsCreateModalOpen(false);
      setCategoryData(initialCategoryState);
      message.success("Kategoriya muvaffaqiyatli yaratildi! 🎉");
    },
    onError: (error) => {
      message.error(get(error, "response.data.message", "Yaratishda xato"));
    },
  });

  // 3. Kategoriya tahrirlash
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, ...updateData }) => api.put(`/category/${id}`, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      setIsEditModalOpen(false);
      message.success("Yangilandi!");
    },
    onError: (error) => {
      message.error(get(error, "response.data.message", "Yangilashda xato"));
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id) => api.delete(`/category/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      message.success("O'chirildi!");
    },
  });

  const handleFileUpload = useCallback(async (file, isEdit = false) => {
    const formData = new FormData();
    formData.append("file", file);
    setIsUploading(true);

    try {
      const response = await api.post("/file/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Interceptor content.url qaytaradi
      const imageUrl = response.data?.content?.url || "";

      if (isEdit) {
        setEditingCategory((prev) => ({ ...prev, imageUrl }));
      } else {
        setCategoryData((prev) => ({ ...prev, imageUrl }));
      }
      message.success("Rasm yuklandi!");
    } catch (error) {
      message.error("Rasm yuklashda xato!");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleCreateCategory = () => {
    if (!categoryData.name) return message.warning("Nomini kiriting!");
    
    // ParentId ni to'g'ri aniqlash
    const payload = {
      ...categoryData,
      parentId: categoryData.parentId || selectedId || null,
    };

    createCategoryMutation.mutate(payload);
  };

  const handleUpdateCategory = () => {
    if (!currentEditId) return;
    updateCategoryMutation.mutate({
      id: currentEditId,
      ...editingCategory,
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

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Nomi", dataIndex: "name", key: "name" },
    { title: "Tartib", dataIndex: "order", key: "order" },
    {
      title: "Ko'rinishi",
      dataIndex: "isVisible",
      key: "isVisible",
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
      render: (_, record) => (
        <div className="flex gap-2">
          <Popconfirm title="O'chirasizmi?" onConfirm={() => deleteCategoryMutation.mutate(record.id)}>
            <Trash className="text-red-500 cursor-pointer border p-1" size={28} />
          </Popconfirm>
          <Edit
            className="text-blue-500 cursor-pointer border p-1"
            size={28}
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
        </div>
      ),
    },
  ];

  return (
    <div className="p-4">
      {/* Create Modal */}
      <ModalComponent
        title="Yangi kategoriya"
        isModalOpen={isCreateModalOpen}
        setIsModalOpen={setIsCreateModalOpen}
        handleFunc={handleCreateCategory}
        loading={createCategoryMutation.isPending || isUploading}
      >
        <div className="flex flex-col gap-3">
          <label>Nomi</label>
          <InputComponent
            value={categoryData.name}
            onChange={(e) => setCategoryData({ ...categoryData, name: e.target.value })}
          />
          <label>Parent (Kategoriya ichida bo'lsangiz avtomatik tanlanadi)</label>
          <TreeSelect
            className="w-full"
            value={categoryData.parentId || selectedId}
            treeData={transformToTreeData(categoryList)}
            onChange={(v) => setCategoryData({ ...categoryData, parentId: v })}
            allowClear
            placeholder="Asosiy kategoriya"
          />
          <label>Rasm</label>
          <FileUploadComponent onFileSelect={(file) => handleFileUpload(file)} />
          {categoryData.imageUrl && <img src={categoryData.imageUrl} alt="preview" className="w-20 h-20 object-cover" />}
        </div>
      </ModalComponent>

      {/* Edit Modal */}
      <ModalComponent
        title="Tahrirlash"
        isModalOpen={isEditModalOpen}
        setIsModalOpen={setIsEditModalOpen}
        handleFunc={handleUpdateCategory}
        loading={updateCategoryMutation.isPending || isUploading}
      >
        <div className="flex flex-col gap-3">
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
        </div>
      </ModalComponent>

      <div className="flex justify-between mb-4">
        <div className="flex gap-2">
          {history.length > 0 || selectedId !== null ? (
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
          ) : null}
        </div>
        <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>Qo'shish</Button>
      </div>

      <Table
        dataSource={categoryList}
        columnDefs={columns}
        loading={isLoading}
        rowKey="id"
      />
    </div>
  );
};

export default Category;
