import React, { useState, useCallback } from "react";
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
  const totalPages = 1; // Assuming pagination is handled elsewhere
  

  const { data, isLoading } = useQuery({
    queryKey: ["categories", selectedId],
    queryFn: async () => {
      const parentIdQuery =
        selectedId !== null ? `?parentId=${selectedId}` : "";
      return (await api.get(`/category${parentIdQuery}`)).data?.content;
    },
  });

  const categoryList = isArray(data) ? data : [];

  const createCategoryMutation = useMutation({
    mutationFn: async (category) => api.post("/category", category),
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      setIsCreateModalOpen(false);
      setCategoryData(initialCategoryState);
      message.success("Kategoriya muvaffaqiyatli yaratildi! 🎉");
    },
    onError: (error) => {
      message.error(
        "Yaratishda xato: " +
          get(error, "response.data.message", "Noma'lum xato")
      );
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, ...updateData }) =>
      api.put(`/category/${id}`, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      setIsEditModalOpen(false);
      setEditingCategory(initialCategoryState);
      setCurrentEditId(null);
      message.success("Kategoriya muvaffaqiyatli yangilandi!");
    },
    onError: (error) => {
      message.error(
        "Yangilashda xato: " +
          get(error, "response.data.message", "Noma'lum xato")
      );
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id) => api.delete(`/category/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      message.success("Kategoriya muvaffaqiyatli o'chirildi! 🗑️");
    },
    onError: (error) => {
      message.error(
        "O'chirishda xato: " +
          get(error, "response.data.message", "Noma'lum xato")
      );
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, isVisible }) =>
      api.put(`/category/${id}`, { isVisible }),
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      message.success("Ko'rinish muvaffaqiyatli o'zgartirildi!");
    },
    onError: (error) => {
      message.error(
        "Ko'rinish o'zgartirishda xato: " +
          get(error, "response.data.message", "Noma'lum xato")
      );
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
      const imageUrl = get(response, "data.content.url", "");

      if (isEdit) {
        setEditingCategory((prev) => ({ ...prev, imageUrl }));
      } else {
        setCategoryData((prev) => ({ ...prev, imageUrl }));
      }
      message.success("Rasm muvaffaqiyatli yuklandi!");
    } catch (error) {
      message.error("Rasm yuklashda xato!");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleCreateCategory = () => {
    const parentIdToUse = categoryData.parentId ?? selectedId;
    createCategoryMutation.mutate({
      ...categoryData,
      parentId: parentIdToUse,
    });
  };

  const handleUpdateCategory = () => {
    if (!currentEditId) return message.error("Yangilash uchun ID topilmadi.");
    updateCategoryMutation.mutate({
      id: currentEditId,
      ...editingCategory,
    });
  };

  const handleDelete = (id) => {
    deleteCategoryMutation.mutate(id);
  };

  const handleToggleVisibility = (id, checked) => {
    toggleVisibilityMutation.mutate({ id, isVisible: checked });
  };

  const handleGoToChild = (id) => {
    setHistory((prev) => [...prev, selectedId]);
    setSelectedId(id);
  };

  const handleGoBack = () => {
    if (history.length > 0) {
      const previousId = history.pop();
      setSelectedId(previousId);
      setHistory([...history]);
    } else {
      setSelectedId(null);
    }
  };

  const openEditModal = (record) => {
    setCurrentEditId(record.id);
    setEditingCategory({
      name: record.name,
      imageUrl: record.imageUrl || "",
      isVisible: record.isVisible,
      order: record.order,
      parentId: record.parent?.id || null,
    });
    setIsEditModalOpen(true);
  };

  const transformToTreeData = (categories) => {
    const buildTree = (cats) =>
      cats.map((item) => ({
        title: item.name,
        value: item.id,
        key: item.id,
        children: item.children ? buildTree(item.children) : undefined,
      }));
    return buildTree(categories);
  };

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
      title: "Tartib",
      dataIndex: "order",
      key: "order",
    },
    {
      title: "Ko'rinishi",
      dataIndex: "isVisible",
      key: "isVisible",
      render: (isVisible, record) => (
        <Switch
          checked={isVisible}
          onChange={(checked) => handleToggleVisibility(record.id, checked)}
          loading={toggleVisibilityMutation.isPending}
        />
      ),
    },
    {
      title: "Keyingi",
      key: "goToChild",
      render: (_, record) => (
        <ArrowRight
          className="text-gray-600 cursor-pointer rounded-[10px] border p-1 hover:bg-gray-100 transition"
          size={30}
          onClick={() => handleGoToChild(record.id)}
        />
      ),
    },
    {
      title: "Harakatlar",
      key: "action",
      render: (_, record) => (
        <div className="flex items-center">
          <Popconfirm
            title="O'chirishni tasdiqlaysizmi?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ha"
            cancelText="Yo'q"
          >
            <Trash
              className="text-red-500 cursor-pointer rounded-[10px] border p-1 hover:bg-red-50 transition mr-2"
              size={30}
            />
          </Popconfirm>
          <Edit
            onClick={() => openEditModal(record)}
            className="text-blue-500 cursor-pointer rounded-[10px] border p-1 hover:bg-blue-50 transition"
            size={30}
          />
        </div>
      ),
    },
  ];

  if (isLoading)
    return (
      <Spin
        tip="Yuklanmoqda..."
        size="large"
        className="flex justify-center items-center h-screen"
      />
    );

  return (
    <div>
      <ModalComponent
        title="Yangi kategoriya"
        isModalOpen={isCreateModalOpen}
        setIsModalOpen={setIsCreateModalOpen}
        handleFunc={handleCreateCategory}
        loading={createCategoryMutation.isPending || isUploading}
      >
        <div className="grid gap-4 py-4">
          <label>Nomi</label>
          <InputComponent
            value={categoryData.name}
            onChange={(e) =>
              setCategoryData({ ...categoryData, name: e.target.value })
            }
            placeholder="Nomini kiriting"
          />
          <label>Parent</label>
          <TreeSelect
            value={categoryData.parentId}
            onChange={(value) =>
              setCategoryData({ ...categoryData, parentId: value })
            }
            treeData={transformToTreeData(categoryList)}
            placeholder="Parent tanlang"
            allowClear
            style={{ width: "100%" }}
          />
          <label>Rasm</label>
          <FileUploadComponent
            onFileSelect={(file) => handleFileUpload(file)}
          />
          {categoryData.imageUrl && (
            <img
              src={categoryData.imageUrl}
              alt="Yuklangan"
              style={{ maxWidth: "100px" }}
            />
          )}
          <label>Ko'rinishi</label>
          <Switch
            checked={categoryData.isVisible}
            onChange={(checked) =>
              setCategoryData({ ...categoryData, isVisible: checked })
            }
          />
          <label>Tartib</label>
          <InputNumber
            value={categoryData.order}
            onChange={(value) =>
              setCategoryData({ ...categoryData, order: value })
            }
          />
        </div>
      </ModalComponent>

      <ModalComponent
        title={`Tahrirlash (${currentEditId})`}
        isModalOpen={isEditModalOpen}
        setIsModalOpen={setIsEditModalOpen}
        handleFunc={handleUpdateCategory}
        loading={updateCategoryMutation.isPending || isUploading}
      >
        <div className="grid gap-4 py-4">
          <label>Nomi</label>
          <InputComponent
            value={editingCategory.name}
            onChange={(e) =>
              setEditingCategory({ ...editingCategory, name: e.target.value })
            }
            placeholder="Yangi nom"
          />
          <label>Parent</label>
          <TreeSelect
            value={editingCategory.parentId}
            onChange={(value) =>
              setEditingCategory({ ...editingCategory, parentId: value })
            }
            treeData={transformToTreeData(categoryList)}
            placeholder="Yangi parent"
            allowClear
            style={{ width: "100%" }}
          />
          <label>Rasm</label>
          <FileUploadComponent
            onFileSelect={(file) => handleFileUpload(file, true)}
          />
          {editingCategory.imageUrl && (
            <img
              src={editingCategory.imageUrl}
              alt="Joriy"
              style={{ maxWidth: "100px" }}
            />
          )}
          <label>Ko'rinishi</label>
          <Switch
            checked={editingCategory.isVisible}
            onChange={(checked) =>
              setEditingCategory({ ...editingCategory, isVisible: checked })
            }
          />
          <label>Tartib</label>
          <InputNumber
            value={editingCategory.order}
            onChange={(value) =>
              setEditingCategory({ ...editingCategory, order: value })
            }
          />
        </div>
      </ModalComponent>

      <div className="flex justify-between my-4">
        <div className="flex items-center">
          {history.length > 0 && (
            <ArrowLeft
              onClick={handleGoBack}
              className="text-gray-600 cursor-pointer rounded-[10px] border p-1 hover:bg-gray-100 transition mr-2"
              size={30}
            />
          )}
        </div>
        <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
          Qo'shish
        </Button>
      </div>

      <Table
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        dataSource={categoryList}
        columnDefs={columns}
        rowKey="id"
        loading={isLoading}
      />
    </div>
  );
};

export default Category;
