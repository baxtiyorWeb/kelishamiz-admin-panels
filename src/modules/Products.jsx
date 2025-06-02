import React from "react";
import Table from "./../components/Table";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "./../config/auth/api";
import { get, isArray } from "lodash";
import { message, Popconfirm } from "antd";

const Products = () => {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(5);
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
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
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
    },
    {
      title: "Category",
      dataIndex: ["category", "name"],
      key: "categoryName",
    },
    {
      title: "Region",
      dataIndex: ["region", "name"],
      key: "regionName",
    },
    {
      title: "District",
      dataIndex: ["district", "name"],
      key: "districtName",
    },
    {
      title: "Payment Type",
      dataIndex: "paymentType",
      key: "paymentType",
    },
    {
      title: "Currency Type",
      dataIndex: "currencyType",
      key: "currencyType",
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
    </div>
  );
};

export default Products;
