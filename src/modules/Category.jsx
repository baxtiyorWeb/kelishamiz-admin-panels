import React, { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, isArray } from "lodash";
import { Button, Popconfirm, message, Spin, TreeSelect } from "antd";
import { ArrowLeft, ArrowRight, Edit, Trash } from "lucide-react";

import InputComponent from "./../components/Input";
import ModalComponent from "./../components/Modal";
import FileUploadComponent from "./../components/Upload";
import Table from "./../components/Table";
import api from "../config/auth/api";

const initialCategoryState = {
  name: "",
  imageUrl: "",
  parentId: null, // TreeSelect qiymatini saqlash uchun qo'shildi
};

const Category = () => {
  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModal] = useState(false);
  const [categoryData, setCategoryData] = useState(initialCategoryState);
  const [editingCategory, setEditingCategory] = useState(initialCategoryState);
  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory] = useState([]);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["categories", selectedId],
    queryFn: async () => {
      const parentIdQuery =
        selectedId !== null ? `?parentId=${selectedId}` : "";
      return (await api.get(`/category${parentIdQuery}`)).data;
    },
  });

  const categoryList = isArray(get(data, "content", []))
    ? get(data, "content")
    : [];

  const cleanedCategoryList = categoryList?.map(
    ({ children, ...rest }) => rest
  );

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
    mutationFn: async (category) => {
      const { id, ...updateData } = category;
      return api.put(`/category/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      setIsEditModal(false);
      setEditingCategory(initialCategoryState);
      setCurrentEditId(null);
      message.success("Kategoriya muvaffaqiyatli tahrirlandi!");
    },
    onError: (error) => {
      message.error(
        "Tahrirlashda xato: " +
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
      message.success("Fayl muvaffaqiyatli yuklandi!");
    } catch (error) {
      message.error("Fayl yuklashda xato!");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleCreateCategory = () => {
    // 1. Agar TreeSelect (categoryData.parentId) orqali Parent tanlangan bo'lsa, o'shani ishlat.
    // 2. Aks holda, joriy jadval ko'rinishi (selectedId) parent bo'ladi.
    const parentIdToUse =
      categoryData.parentId !== undefined && categoryData.parentId !== null
        ? categoryData.parentId
        : selectedId;

    createCategoryMutation.mutate({
      name: categoryData.name,
      imageUrl: categoryData.imageUrl,
      parentId: parentIdToUse,
    });
  };

  const handleUpdateCategory = () => {
    if (!currentEditId) return message.error("Tahrirlash uchun ID topilmadi.");

    updateCategoryMutation.mutate({
      id: currentEditId,
      name: editingCategory.name,
      imageUrl: editingCategory.imageUrl,
    });
  };

  const handleDelete = (id) => {
    deleteCategoryMutation.mutate(id);
  };

  const handleGoToChild = (id) => {
    if (selectedId !== id) {
      setHistory((prev) => [...prev, selectedId]);
      setSelectedId(id);
    }
  };

  const handleGoBack = () => {
    if (history.length > 0) {
      const previousId = history[history.length - 1];
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setSelectedId(previousId);
    } else {
      setSelectedId(null);
    }
  };

  const openEditModal = (record) => {
    setCurrentEditId(record.id);
    setEditingCategory({
      name: record.name,
      imageUrl: record.imageUrl || "",
    });
    setIsEditModal(true);
  };

  const transformToTreeData = (categories) => {
    // API'dan kelgan ma'lumotni TreeSelect uchun formatlash
    return categories?.map((item) => ({
      title: item.name,
      value: item.id,
      key: item.id,
      children: item.children?.map((child) => ({
        title: child.name,
        value: child.id,
        key: child.id,
      })),
    }));
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
      title: "Keyingi kategoriya",
      key: "goToChild",
      render: (_, record) => (
        <div>
          <ArrowRight
            className="text-gray-600 mx-3 cursor-pointer rounded-[10px] border p-1 hover:bg-gray-100 transition"
            size={30}
            onClick={() => handleGoToChild(record.id)}
          />
        </div>
      ),
    },
    {
      title: "Harakatlar",
      key: "action",
      render: (_, record) => (
        <div className="flex justify-start items-center w-full">
          <Popconfirm
            title="Haqiqatan ham ushbu kategoriyani o'chirmoqchimisiz?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ha"
            cancelText="Yo'q"
            okButtonProps={{ loading: deleteCategoryMutation.isPending }}
          >
            <Trash
              className={`mx-3 cursor-pointer rounded-[10px] border p-1 transition ${
                deleteCategoryMutation.isPending
                  ? "text-gray-400"
                  : "text-red-500 hover:bg-red-50"
              }`}
              size={30}
            />
          </Popconfirm>

          <Edit
            onClick={() => openEditModal(record)}
            className="text-blue-500 mx-3 cursor-pointer rounded-[10px] border p-1 hover:bg-blue-50 transition"
            size={30}
          />
        </div>
      ),
    },
  ];

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Kategoriyalar yuklanmoqda..." />
      </div>
    );

  return (
    <div>
      <ModalComponent
        title="Kategoriya qo'shish"
        handleFunc={handleCreateCategory}
        setIsModalOpen={setIsCreateModalOpen}
        isModalOpen={isCreateModalOpen}
        okText="Qo'shish"
        cancelText="Bekor qilish"
        loading={createCategoryMutation.isPending || isUploading}
      >
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 items-center gap-4">
            <label htmlFor="name" className="text-left font-medium">
              Nomi
            </label>
            <InputComponent
              id="name"
              value={categoryData.name}
              onChange={(e) =>
                setCategoryData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Kategoriya nomini kiriting"
            />
          </div>

          <div className="grid grid-cols-1 items-center gap-4">
            <label htmlFor="parent" className="text-left font-medium">
              Parent Category
            </label>
            <TreeSelect
              value={categoryData.parentId}
              onChange={(value) =>
                setCategoryData((prev) => ({ ...prev, parentId: value }))
              }
              treeData={transformToTreeData(categoryList)}
              placeholder="Parent kategoriyani tanlang"
              allowClear
              
              style={{ width: "100%" }}
            />
          </div>

          <div className="grid grid-cols-1 items-center gap-4">
            <label htmlFor="image" className="text-left font-medium">
              Rasm
            </label>
            <div className="relative">
              <FileUploadComponent
                onFileSelect={(file) => handleFileUpload(file, false)}
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 rounded-md">
                  <Spin size="small" />
                </div>
              )}
            </div>
          </div>

          {categoryData.imageUrl && (
            <div className="grid grid-cols-1 items-center gap-4">
              <label className="text-left font-medium">Ko'rish</label>
              <div className="col-span-3">
                <img
                  src={categoryData.imageUrl}
                  alt="Uploaded"
                  style={{ maxWidth: "100px", maxHeight: "100px" }}
                />
              </div>
            </div>
          )}
        </div>
      </ModalComponent>

      <ModalComponent
        title={`Kategoriyani tahrirlash ( ${currentEditId || ""})`}
        handleFunc={handleUpdateCategory}
        isModalOpen={isEditModalOpen}
        setIsModalOpen={setIsEditModal}
        okText="Saqlash"
        cancelText="Bekor qilish"
        loading={updateCategoryMutation.isPending || isUploading}
      >
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 items-center gap-4">
            <label htmlFor="edit-name" className="text-left font-medium">
              Nomi
            </label>
            <InputComponent
              id="edit-name"
              value={editingCategory.name}
              onChange={(e) =>
                setEditingCategory((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Yangi nomini kiriting"
            />
          </div>
          <div className="grid grid-cols-1 items-center gap-4">
            <label htmlFor="edit-image" className="text-left font-medium">
              Rasm
            </label>
            <div className="relative">
              <FileUploadComponent
                onFileSelect={(file) => handleFileUpload(file, true)}
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 rounded-md">
                  <Spin size="small" />
                </div>
              )}
            </div>
          </div>
          {editingCategory.imageUrl && (
            <div className="grid grid-cols-1 items-center gap-4">
              <label className="text-left font-medium">Joriy rasm</label>
              <div className="col-span-3">
                <img
                  src={editingCategory.imageUrl}
                  alt="Current"
                  style={{ maxWidth: "100px", maxHeight: "100px" }}
                />
              </div>
            </div>
          )}
        </div>
      </ModalComponent>

      <div className="w-full my-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {(selectedId !== null || history.length > 0) && (
            <ArrowLeft
              onClick={handleGoBack}
              className="text-gray-600 cursor-pointer rounded-[10px] border p-1 hover:bg-gray-100 transition"
              size={30}
              title="Orqaga"
            />
          )}
         
        </div>

        <Button
          type="primary"
          onClick={() => {
            setCategoryData(initialCategoryState);
            setIsCreateModalOpen(true);
          }}
          disabled={
            createCategoryMutation.isPending || updateCategoryMutation.isPending
          }
        >
          Kategoriya qo'shish
        </Button>
      </div>

      <Table
        dataSource={cleanedCategoryList}
        columnDefs={columns}
        rowKey="id"
        loading={isLoading || deleteCategoryMutation.isPending}
      />
    </div>
  );
};

export default Category;
