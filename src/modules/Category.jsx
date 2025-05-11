import React, { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, isArray } from "lodash";
import { Button } from "antd";
import { Input } from "antd";
import { Select } from "antd";
import { Table } from "antd";
import { Modal } from "antd";
import { Popconfirm, Upload, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import CascaderComponent from "./../components/Cascader";
import InputComponent from "./../components/Input";
import ModalComponent from "./../components/Modal";
import FileUploadComponent from "./../components/Upload";
// Import your actual API configuration
import api from "../config/auth/api";

// Mock FileUpload Component (Replace with your actual component)

const Category = () => {
  const [isOpenEditModal, setisOpenEditModal] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    // Added refetch
    queryKey: ["categories"],
    queryFn: async () => {
      return (await api.get("/category")).data;
    },
  });

  const categoryList = isArray(get(data, "content", []))
    ? get(data, "content")
    : [];

  const buildOptionsRecursively = (categories = [], parentName = null) => {
    return categories.map((item) => {
      const currentName = parentName
        ? `${parentName} / ${item.name}`
        : item.name;
      const option = {
        value: item.id,
        label: currentName,
      };

      return option;
    });
  };

  const options = buildOptionsRecursively(categoryList);

  const handleCategoryMutate = useMutation({
    mutationFn: async (category) => {
      return await api.post("/category", category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      setisOpenEditModal(false);
      setName("");
      setImageUrl("");
      setSelectedParentId(null);
    },
    onError: (error) => {
      console.error("Error creating category", error);
      message.error("Failed to create category");
    },
  });

  const handleCategoryMutateDelete = useMutation({
    mutationFn: async (id) => {
      return await api.delete(`/category/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
    },
    onError: (error) => {
      console.error("Error deleting category", error);
      message.error("Failed to delete category"); // Show error message
    },
  });

  const handleFileUpload = useCallback(async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/file/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImageUrl(get(response, "data.content.url", ""));
      message.success("File uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      message.error("File upload failed");
    }
  }, []);

  const handleCreateCategory = () => {
    handleCategoryMutate.mutate({
      name,
      imageUrl,
      parentId: selectedParentId,
    });
  };

  const handleDelete = (id) => {
    handleCategoryMutateDelete.mutate(id);
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Category Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Parent Category",
      dataIndex: "parentName",
      key: "parentName",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Popconfirm
          title="Are you sure to delete this category?"
          onConfirm={() => handleDelete(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button type="danger" size="small">
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <ModalComponent
        handleFunc={handleCreateCategory}
        setIsModalOpen={setisOpenEditModal}
        isModalOpen={isOpenEditModal}
      >
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-right">
              Name
            </label>
            <InputComponent
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="parent" className="text-right">
              Parent Category
            </label>
            <CascaderComponent
              options={options}
              onChange={(value) =>
                setSelectedParentId(value === "null" ? null : parseInt(value))
              }
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="image" className="text-right">
              Image
            </label>
            <FileUploadComponent onFileSelect={handleFileUpload} />
          </div>
          {imageUrl && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Preview</label>
              <div className="col-span-3">
                <img
                  src={imageUrl}
                  alt="Uploaded"
                  style={{ maxWidth: "100px", maxHeight: "100px" }}
                />
              </div>
            </div>
          )}
        </div>
      </ModalComponent>

      <Button
        variant="outline"
        className="my-4 float-end"
        onClick={() => setisOpenEditModal(true)}
      >
        Add Category
      </Button>

      <Table dataSource={categoryList} columns={columns} rowKey="id" />
    </div>
  );
};

export default Category;
