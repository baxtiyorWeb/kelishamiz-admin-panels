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

  // Modal va Id boshqaruvi
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [categoryData, setCategoryData] = useState(initialCategoryState);
  const [editingCategory, setEditingCategory] = useState(initialCategoryState);
  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory] = useState([]);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // 1. Kategoriyalarni olish
  const { data, isLoading } = useQuery({
    queryKey: ["categories", selectedId],
    queryFn: async () => {
      const parentIdQuery = selectedId !== null ? `?parentId=${selectedId}` : "";
      const response = await api.get(`/category${parentIdQuery}`);
      return response.data?.content || response.data || [];
    },
  });

  const categoryList = useMemo(() => (isArray(data) ? data : []), [data]);

  // 2. Kategoriya yaratish (Muvaffaqiyatli bo'lganda modal yopilmaydi)
  const createCategoryMutation = useMutation({
    mutationFn: async (category) => api.post("/category", category),
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      message.success("Kategoriya qo'shildi! ✨");
      
      // FAQAT INPUTLARNI TOZALAYMIZ
      setCategoryData({
        ...initialCategoryState,
        parentId: categoryData.parentId || selectedId // Parent o'zgarmay qoladi (ketma-ket qo'shish uchun)
      });
    },
    onError: (error) => {
      message.error(get(error, "response.data.message", "Yaratishda xato"));
    },
  });

  // 3. Kategoriya tahrirlash (Tahrirlashda modal yopiladi)
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, ...updateData }) => api.put(`/category/${id}`, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      setIsEditModalOpen(false);
      message.success("Yangilandi! ✅");
    },
    onError: (error) => {
      message.error(get(error, "response.data.message", "Yangilashda xato"));
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id) => api.delete(`/category/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      message.success("O'chirildi! 🗑️");
    },
  });

  // Rasm yuklash mantiqi
  const handleFileUpload = useCallback(async (file, isEdit = false) => {
    const formData = new FormData();
    formData.append("file", file);
    setIsUploading(true);

    try {
      const response = await api.post("/file/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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
    if (!categoryData.name) return message.warning("Kategoriya nomini kiriting!");
    
    createCategoryMutation.mutate({
      ...categoryData,
      parentId: categoryData.parentId || selectedId || null,
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
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "Nomi", dataIndex: "name", key: "name" },
    { title: "Tartib", dataIndex: "order", key: "order", width: 100 },
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
      width: 100,
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
      width: 120,
      render: (_, record) => (
        <div className="flex gap-2">
          <Popconfirm title="O'chirasizmi?" onConfirm={() => deleteCategoryMutation.mutate(record.id)}>
            <Button type="text" danger icon={<Trash size={18} />} />
          </Popconfirm>
          <Button 
            type="text" 
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
        </div>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Kategoriyalar</h2>
        <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
          Kategoriya qo'shish
        </Button>
      </div>

      <div className="flex mb-4">
        { (history.length > 0 || selectedId !== null) && (
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

      {/* Create Modal */}
      <ModalComponent
        title="Yangi kategoriya"
        isModalOpen={isCreateModalOpen}
        setIsModalOpen={setIsCreateModalOpen}
        handleFunc={handleCreateCategory} // Modal yopilmaydi (onSuccess'da setIsModalOpen yo'q)
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

      {/* Edit Modal */}
      <ModalComponent
        title="Tahrirlash"
        isModalOpen={isEditModalOpen}
        setIsModalOpen={setIsEditModalOpen}
        handleFunc={() => updateCategoryMutation.mutate({ id: currentEditId, ...editingCategory })}
        loading={updateCategoryMutation.isPending || isUploading}
      >
        <div className="flex flex-col gap-4 py-4">
          <div>
            <label className="block mb-1 font-medium">Nomi</label>
            <InputComponent
              value={editingCategory.name}
              onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Parent</label>
            <TreeSelect
              className="w-full"
              value={editingCategory.parentId}
              treeData={transformToTreeData(categoryList)}
              onChange={(v) => setEditingCategory({ ...editingCategory, parentId: v })}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Rasm yangilash</label>
            <FileUploadComponent onFileSelect={(file) => handleFileUpload(file, true)} />
            {editingCategory.imageUrl && (
              <img src={editingCategory.imageUrl} alt="preview" className="mt-2 w-20 h-20 object-cover rounded border" />
            )}
          </div>
        </div>
      </ModalComponent>
    </div>
  );
};

export default Category;
