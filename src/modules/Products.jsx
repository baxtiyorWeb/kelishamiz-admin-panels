import React from "react";
import Table from "./../components/Table";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "./../config/auth/api";
import { get, isArray } from "lodash";
import { DatePicker, Form, message, Modal, Popconfirm, Tooltip } from "antd";
import { useState } from "react";
import dayjs from "dayjs";

const Products = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [form] = Form.useForm();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["products", page, pageSize],
    queryFn: async () => {
      const response = await api.get(
        `/products?pageSize=${pageSize}&page=${page}`
      );
      if (!response.status === 200 || !response.data) {
        throw new Error("Network response was not ok");
      }
      return response.data;
    },
    onError: (error) => {
      console.error("Error fetching products:", error);
    },
    onSuccess: (data) => {
      console.log("Products fetched successfully:", data);
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
    retryDelay: 1000,
  });

  const productItems = isArray(get(data, "content.data", []))
    ? get(data, "content", [])
    : [];

  const { mutate: updateProduct } = useMutation({
    mutationFn: async ({ id, isTop, topExpiresAt }) => {
      const response = await api.patch(`/products/${id}/top`, {
        isTop,
        topExpiresAt,
      });
      if (!response.status === 200 || !response.data) {
        message.error("Failed to update product details");
        throw new Error("Failed to update product details");
      }
      return response.data;
    },
    onError: (error) => {
      console.error("Error updating product details:", error);
    },
    onSuccess: () => {
      message.success("Product updated successfully");
      refetch();
    },
  });

  const handleUpdate = (id, isTop, topExpiresAt) => {
    updateProduct({ id, isTop, topExpiresAt });
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text) => (
        <Tooltip title={text}>
          <div className="truncate max-w-[150px]">{text}</div>
        </Tooltip>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => (
        <Tooltip title={text}>
          <div className="truncate max-w-[200px]">{text}</div>
        </Tooltip>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
    },
    {
      title: "Profile Name",
      dataIndex: ["profile", "fullName"],
      key: "profileName",
      render: (text) => (
        <Tooltip title={text}>
          <div className="truncate max-w-[80px]">{text}</div>
        </Tooltip>
      ),
    },
    {
      title: "Category",
      dataIndex: ["category", "name"],
      key: "categoryName",
      render: (text) => (
        <Tooltip title={text}>
          <div className="truncate max-w-[80px]">{text}</div>
        </Tooltip>
      ),
    },
    {
      title: "Region",
      dataIndex: ["region", "name"],
      key: "regionName",
      render: (text) => (
        <Tooltip title={text}>
          <div className="truncate max-w-[80px]">{text}</div>
        </Tooltip>
      ),
    },
    {
      title: "District",
      dataIndex: ["district", "name"],
      key: "districtName",
      render: (text) => (
        <Tooltip title={text}>
          <div className="truncate max-w-[80px]">{text}</div>
        </Tooltip>
      ),
    },
    {
      title: "Payment Type",
      dataIndex: "paymentType",
      key: "paymentType",
      render: (text) => (
        <Tooltip title={text}>
          <div className="truncate max-w-[80px]">{text}</div>
        </Tooltip>
      ),
    },
    {
      title: "isTop",
      dataIndex: "isTop",
      key: "isTop",
      render: (isTop, record) => {
        const content = isTop ? "topda" : "top qilish";
        return (
          <Tooltip title={content}>
            <div className="truncate max-w-[100px]">
              {isTop ? (
                <Popconfirm
                  title="Remove from top?"
                  onConfirm={() => handleUpdate(record.id, false, null)}
                  okText="Yes"
                  cancelText="No"
                >
                  <a className="text-orange-500 hover:text-orange-400">
                    {content}
                  </a>
                </Popconfirm>
              ) : (
                <a
                  onClick={() => {
                    setSelectedProductId(record.id);
                    setIsModalOpen(true);
                  }}
                  className="text-blue-500 hover:underline cursor-pointer"
                >
                  {content}
                </a>
              )}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Expires At",
      dataIndex: "topExpiresAt",
      key: "topExpiresAt",
      render: (expiresAt) => {
        if (!expiresAt) return "N/A";

        const now = dayjs();
        const expires = dayjs(expiresAt);
        const diff = expires.diff(now, "day");

        let text = "";
        if (diff > 0) {
          text = `${diff} kun qoldi`;
        } else if (diff === 0) {
          text = "Bugun tugaydi";
        } else {
          text = `${Math.abs(diff)} kun o‘tdi`;
        }

        return (
          <Tooltip title={dayjs(expiresAt).format("YYYY-MM-DD HH:mm")}>
            <div className="truncate max-w-[60px]">{text}</div>
          </Tooltip>
        );
      },
    },
    {
      title: "Delete",
      key: "delete",
      render: (_, record) => (
        <Popconfirm
          title={`Are you sure you want to delete item with ID: ${record.id}?`}
          onConfirm={() => handleDelete(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <a>Delete</a>
        </Popconfirm>
      ),
    },
  ];

  const { mutate: deleteProduct } = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/products/by-id/${id}`);
      if (!response.status === 200) {
        throw new Error("Failed to delete product");
      }
      return response.data;
    },
    onError: (error) => {
      console.error("Error deleting product:", error);
    },
    onSuccess: () => {
      message.success("Product deleted successfully");
      refetch();
    },
  });

  const handleDelete = (id) => {
    deleteProduct(id);
  };

  if (isError) {
    return <div>Error fetching products.</div>;
  }

  return (
    <div>
      <Table
        dataSource={productItems?.data}
        columnDefs={columns}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        total={productItems?.total}
        setPage={setPage}
        setPageSize={setPageSize}
      />

      <Modal
        title="Set Product as Top"
        open={isModalOpen}
        onOk={() => {
          form.validateFields().then((values) => {
            handleUpdate(selectedProductId, true, values.topExpiresAt);
            setIsModalOpen(false);
            form.resetFields();
          });
        }}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        okText="Confirm"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="topExpiresAt"
            label="Top Expires At"
            rules={[
              {
                required: true,
                message: "Please select expiration date",
              },
            ]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;
