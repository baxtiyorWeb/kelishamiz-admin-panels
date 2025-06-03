import React, { useState } from "react";
import Table from "./../components/Table";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "./../config/auth/api";
import { get, isArray } from "lodash";
import {
  DatePicker,
  Form,
  message,
  Modal,
  Popconfirm,
  Select,
  Tag,
  Tooltip,
  Button,
  Spin,
  Descriptions, // Descriptions komponentini import qilish
  Divider, // Ajratgich qo'shish uchun
} from "antd";
import dayjs from "dayjs";
import { EyeOutlined } from "@ant-design/icons";

const Products = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [isTopModalOpen, setIsTopModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [form] = Form.useForm();

  // Mahsulotlar ro'yxatini olish
  const {
    data,
    isLoading,
    isError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["products", page, pageSize],
    queryFn: async () => {
      const response = await api.get(
        `/products?pageSize=${pageSize}&page=${page}`
      );
      if (response.status !== 200 || !response.data) {
        throw new Error("Network response was not ok");
      }
      return response.data;
    },
    onError: (error) => {
      console.error("Error fetching products:", error);
      message.error("Mahsulotlarni yuklashda xatolik yuz berdi.");
    },
    onSuccess: (data) => {
      console.log("Products fetched successfully:", data);
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
    retryDelay: 1000,
  });

  // Tanlangan mahsulotning to'liq ma'lumotlarini olish
  const {
    data: selectedProductData,
    isLoading: isSelectedProductLoading,
    isError: isSelectedProductError,
    refetch: refetchSelectedProduct, // This refetch is probably not needed, as `enabled` handles fetching
  } = useQuery({
    queryKey: ["product", selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return null;
      const response = await api.get(`/products/by-id/${selectedProductId}`);
      if (response.status !== 200 || !response.data) {
        throw new Error("Network response was not ok");
      }
      return response.data?.content;
    },
    enabled: !!selectedProductId && isViewModalOpen,
    onError: (error) => {
      console.error("Error fetching selected product:", error);
      message.error("Mahsulot ma'lumotlarini yuklashda xatolik yuz berdi.");
    },
  });

  const productItems = get(data, "content.data", []);
  const totalProducts = get(data, "content.total", 0);
  const currentPage = get(data, "content.page", 1);

  // TOP statusini yangilash mutation
  const { mutate: updateProductTopStatus } = useMutation({
    mutationFn: async ({ id, isTop, topExpiresAt }) => {
      const response = await api.patch(`/products/${id}/top`, {
        isTop,
        topExpiresAt,
      });
      if (response.status !== 200 || !response.data) {
        message.error("Mahsulot tafsilotlarini yangilashda xatolik yuz berdi.");
        throw new Error("Failed to update product details");
      }
      return response.data;
    },
    onError: (error) => {
      console.error("Error updating product details:", error);
      message.error("Mahsulot tafsilotlarini yangilashda xatolik yuz berdi.");
    },
    onSuccess: () => {
      message.success("Mahsulot muvaffaqiyatli yangilandi.");
      refetchProducts();
    },
  });

  // Publish statusini yangilash mutation
  const { mutate: updateProductPublishStatus } = useMutation({
    mutationFn: async ({ id, isPublished }) => {
      const response = await api.patch(`/products/${id}/top`, {
        isPublish: isPublished,
      });
      if (response.status !== 200 || !response.data) {
        message.error(
          "Mahsulot publish statusini yangilashda xatolik yuz berdi."
        );
        throw new Error("Failed to update product publish status");
      }
      return response.data;
    },
    onError: (error) => {
      console.error("Error updating product publish status:", error);
      message.error(
        "Mahsulot publish statusini yangilashda xatolik yuz berdi."
      );
    },
    onSuccess: () => {
      message.success("Mahsulot publish statusi muvaffaqiyatli yangilandi.");
      refetchProducts();
    },
  });

  // Mahsulotni o'chirish mutation
  const { mutate: deleteProduct } = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/products/by-id/${id}`);
      if (response.status !== 200) {
        throw new Error("Failed to delete product");
      }
      return response.data;
    },
    onError: (error) => {
      console.error("Error deleting product:", error);
      message.error("Mahsulotni o'chirishda xatolik yuz berdi.");
    },
    onSuccess: () => {
      message.success("Mahsulot muvaffaqiyatli o'chirildi.");
      refetchProducts();
    },
  });

  // Handler functions
  const handleSetTop = (id, isTop, topExpiresAt) => {
    updateProductTopStatus({ id, isTop, topExpiresAt });
  };

  const handleUpdateProductIsPublish = (productId, value) => {
    updateProductPublishStatus({ id: productId, isPublished: value });
  };

  const handleDelete = (id) => {
    deleteProduct(id);
  };

  const showViewModal = (productId) => {
    setSelectedProductId(productId);
    setIsViewModalOpen(true);
  };

  const handleTopModalOk = () => {
    form.validateFields().then((values) => {
      handleSetTop(selectedProductId, true, values.topExpiresAt);
      setIsTopModalOpen(false);
      form.resetFields();
    });
  };

  const handleTopModalCancel = () => {
    setIsTopModalOpen(false);
    form.resetFields();
  };

  const handleViewModalCancel = () => {
    setIsViewModalOpen(false);
    setSelectedProductId(null);
  };

  // Jadval ustunlari
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
      title: "Narx",
      dataIndex: "price",
      key: "price",
      render: (price, record) => (
        <span>
          {price} {record.currencyType}
        </span>
      ),
    },
    {
      title: "Kategoriya",
      dataIndex: ["category", "name"],
      key: "categoryName",
      render: (text) => (
        <Tooltip title={text}>
          <div className="truncate max-w-[80px]">{text}</div>
        </Tooltip>
      ),
    },
    {
      title: "Nashr qilingan",
      dataIndex: "isPublish",
      key: "isPublish",
      render: (isPublish, record) => (
        <div className="truncate max-w-[120px]">
          <Select
            style={{ width: 120 }}
            defaultValue={isPublish}
            onChange={(value) => handleUpdateProductIsPublish(record.id, value)}
          >
            <Select.OptGroup label="Status tanlash">
              <Select.Option value={true}>
                <Tag color="green">Ha</Tag>
              </Select.Option>
              <Select.Option value={false}>
                <Tag color="red">Yo'q</Tag>
              </Select.Option>
            </Select.OptGroup>
          </Select>
        </div>
      ),
    },
    {
      title: "Topda",
      dataIndex: "isTop",
      key: "isTop",
      render: (isTop, record) => {
        const content = isTop ? "Topda" : "Top qilish";
        return (
          <Tooltip title={content}>
            <div className="truncate max-w-[100px]">
              {isTop ? (
                <Popconfirm
                  title="Topdan olib tashlashni xohlaysizmi?"
                  onConfirm={() => handleSetTop(record.id, false, null)}
                  okText="Ha"
                  cancelText="Yo'q"
                >
                  <a className="text-orange-500 hover:text-orange-400">
                    {content}
                  </a>
                </Popconfirm>
              ) : (
                <a
                  onClick={() => {
                    setSelectedProductId(record.id);
                    setIsTopModalOpen(true);
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
      title: "Muddati",
      dataIndex: "topExpiresAt",
      key: "topExpiresAt",
      render: (expiresAt) => {
        if (!expiresAt) return "N/A";

        const now = dayjs();
        const expires = dayjs(expiresAt);
        const diffDays = expires.diff(now, "day");
        const diffHours = expires.diff(now, "hour") % 24;
        const diffMinutes = expires.diff(now, "minute") % 60;

        let text = "";
        if (expires.isAfter(now)) {
          if (diffDays > 0) {
            text = `${diffDays} kun, ${diffHours} soat qoldi`;
          } else if (diffHours > 0) {
            text = `${diffHours} soat, ${diffMinutes} daqiqa qoldi`;
          } else if (diffMinutes > 0) {
            text = `${diffMinutes} daqiqa qoldi`;
          } else {
            text = "Bir necha soniya qoldi";
          }
        } else {
          text = "Muddati o'tgan";
        }

        return (
          <Tooltip title={dayjs(expiresAt).format("YYYY-MM-DD HH:mm")}>
            <div className="truncate max-w-[90px]">{text}</div>
          </Tooltip>
        );
      },
    },
    {
      title: "Amallar",
      key: "actions",
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => showViewModal(record.id)}
            size="small"
            title="To'liq ma'lumotni ko'rish"
          />
          <Popconfirm
            title={`Siz ID: ${record.id} bo'lgan mahsulotni o'chirishga ishonchingiz komilmi?`}
            onConfirm={() => handleDelete(record.id)}
            okText="Ha"
            cancelText="Yo'q"
          >
            <Button type="primary" danger size="small" title="O'chirish">
              O'chirish
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="text-red-500 text-center py-4">
        Mahsulotlarni yuklashda xatolik yuz berdi.
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Mahsulotlar Ro'yxati</h1>
      <Table
        dataSource={productItems}
        columnDefs={columns}
        isLoading={isLoading}
        page={currentPage}
        pageSize={pageSize}
        total={totalProducts}
        setPage={setPage}
        setPageSize={setPageSize}
      />

      {/* TOP qilish modali */}
      <Modal
        title="Mahsulotni Topga Chiqarish"
        open={isTopModalOpen}
        onOk={handleTopModalOk}
        onCancel={handleTopModalCancel}
        okText="Tasdiqlash"
        cancelText="Bekor qilish"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="topExpiresAt"
            label="Top Tugash Sanasi"
            rules={[
              {
                required: true,
                message: "Tugash sanasini tanlang!",
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

      {/* To'liq ma'lumotlarni ko'rish modali */}
      <Modal
        title="Mahsulot haqida to'liq ma'lumot"
        open={isViewModalOpen}
        onCancel={handleViewModalCancel}
        footer={null}
        width={"90%"}
        className="max-w-4xl top-0"
      >
        {isSelectedProductLoading ? (
          <div className="flex justify-center items-center h-40">
            <Spin size="large" tip="Ma'lumotlar yuklanmoqda..." />
          </div>
        ) : isSelectedProductError || !selectedProductData ? (
          <div className="text-red-500 text-center py-4">
            Mahsulot ma'lumotlarini yuklashda xatolik yuz berdi yoki topilmadi.
          </div>
        ) : (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">
              {selectedProductData.title}
            </h2>
            <Divider orientation="left">Umumiy ma'lumotlar</Divider>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="ID">
                {selectedProductData.id}
              </Descriptions.Item>
              <Descriptions.Item label="Narx">
                {selectedProductData.price} {selectedProductData.currencyType}
              </Descriptions.Item>
              <Descriptions.Item label="Kelishilgan narx">
                {selectedProductData.negotiable ? "Ha" : "Yo'q"}
              </Descriptions.Item>
              <Descriptions.Item label="To'lov turi">
                {selectedProductData.paymentType || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Kategoriya" span={2}>
                {selectedProductData.category?.name || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Joylashuv" span={2}>
                {selectedProductData.location || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Viloyat">
                {selectedProductData.region?.name || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Tuman">
                {selectedProductData.district?.name || "N/A"}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Foydalanuvchi ma'lumotlari</Divider>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Profil nomi" span={2}>
                {selectedProductData.profile?.fullName ||
                  selectedProductData.profile?.user?.username ||
                  "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Aloqa" span={2}>
                {selectedProductData.profile?.phone ||
                  selectedProductData.profile?.user?.phone ||
                  "N/A"}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Statistika</Divider>
            <Descriptions bordered column={3} size="small">
              <Descriptions.Item label="Ko'rishlar soni">
                {selectedProductData.viewCount || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Yoqtirishlar soni">
                {selectedProductData.likesCount || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Izohlar soni">
                {selectedProductData.commentsCount || 0}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Holati va vaqt belgilari</Divider>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Nashr qilingan">
                <Tag color={selectedProductData.isPublish ? "green" : "red"}>
                  {selectedProductData.isPublish ? "Ha" : "Yo'q"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Topda">
                <Tag color={selectedProductData.isTop ? "orange" : "blue"}>
                  {selectedProductData.isTop ? "Ha" : "Yo'q"}
                </Tag>
              </Descriptions.Item>
              {selectedProductData.isTop && (
                <Descriptions.Item label="Top muddati" span={2}>
                  {dayjs(selectedProductData.topExpiresAt).format(
                    "YYYY-MM-DD HH:mm:ss"
                  )}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Yaratilgan sana" span={2}>
                {dayjs(selectedProductData.createdAt).format(
                  "YYYY-MM-DD HH:mm:ss"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Oxirgi yangilangan" span={2}>
                {dayjs(selectedProductData.updatedAt).format(
                  "YYYY-MM-DD HH:mm:ss"
                )}
              </Descriptions.Item>
            </Descriptions>

            {/* Tavsif - alohida joylashtirilishi yaxshiroq, chunki uzun bo'lishi mumkin */}
            <Divider orientation="left">Tavsif</Divider>
            <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
              <p className="whitespace-pre-wrap">
                {selectedProductData.description || "Tavsif mavjud emas."}
              </p>
            </div>

            {selectedProductData.images &&
              selectedProductData.images.length > 0 && (
                <>
                  <Divider orientation="left">Rasmlar</Divider>
                  <div className="flex flex-wrap gap-2 mt-2 justify-center">
                    {selectedProductData.images.map((image, index) => (
                      <img
                        key={image.id || index}
                        src={image.url}
                        alt={`Product image ${index + 1}`}
                        className="w-32 h-32 object-cover rounded-md shadow-md hover:scale-105 transition-transform duration-200"
                      />
                    ))}
                  </div>
                </>
              )}

            {selectedProductData.productProperties &&
              selectedProductData.productProperties.length > 0 && (
                <>
                  <Divider orientation="left">Xususiyatlar</Divider>
                  <Descriptions bordered column={1} size="small">
                    {selectedProductData.productProperties.map(
                      (prop, index) => (
                        <Descriptions.Item
                          key={index}
                          label={prop.property?.name || "N/A"}
                        >
                          {prop.value}
                        </Descriptions.Item>
                      )
                    )}
                  </Descriptions>
                </>
              )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Products;
