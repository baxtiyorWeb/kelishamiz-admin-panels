import React, { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, isArray } from "lodash";
import { Button } from "antd";

import { Popconfirm, Upload, message } from "antd";
import CascaderComponent from "./../components/Cascader";
import InputComponent from "./../components/Input";
import ModalComponent from "./../components/Modal";
import FileUploadComponent from "./../components/Upload";
// Import your actual API configuration
import api from "../config/auth/api";
import Table from "./../components/Table";

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

  const [lastId, setLastId] = useState(null);
  const buildCascaderOptions = (categories = []) => {
    return categories.map((item) => ({
      label: item.name,
      value: item.id,
      children: item.children?.length
        ? buildCascaderOptions(item.children)
        : undefined,
    }));
  };
  const options = buildCascaderOptions(categoryList);

  const handleChange = (value) => {
    const selectedId = value[value.length - 1]; // oxirgi id
    setLastId(selectedId);
    console.log("Selected last category ID:", selectedId);
  };

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
      parentId: lastId,
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
          <div className="grid grid-cols-1 items-center gap-4">
            <label htmlFor="name" className="text-left">
              Name
            </label>
            <InputComponent
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 items-center gap-4">
            <label htmlFor="parent" className="text-leftt">
              Parent Category
            </label>
            <CascaderComponent
              options={options}
              onChange={(value) => handleChange(value)}
            />
          </div>
          <div className="grid grid-cols-1 items-center gap-4">
            <label htmlFor="image" className="text-left">
              Image
            </label>
            <FileUploadComponent onFileSelect={handleFileUpload} />
          </div>
          {imageUrl && (
            <div className="grid grid-cols-1 items-center gap-4">
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

      <Table dataSource={categoryList} columnDefs={columns} rowKey="id" />
    </div>
  );
};

export default Category;
