import React, { useState, useCallback } from "react";
import Table from "./../components/Table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Descriptions,
  Divider,
} from "antd";
import dayjs from "dayjs";
import { EyeOutlined, ThunderboltOutlined } from "@ant-design/icons";

const STATUS_LABELS = {
  pending: "Kutilmoqda",
  active: "Faol",
  completed: "Yakunlangan",
  rejected: "Rad etilgan",
};

const STATUS_COLORS = {
  pending: "gold",
  active: "green",
  completed: "blue",
  rejected: "red",
};

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const Products = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isTopModalOpen, setIsTopModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeProgress, setOptimizeProgress] = useState(0);
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
      console.log(response.data);

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
    refetch: refetchSelectedProduct,
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

  // Mahsulot statusini (pending/active/completed/rejected) yangilash mutation
  const { mutate: updateProductStatus } = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await api.patch(`/products/${id}/status`, { status });
      if (response.status !== 200 || !response.data) {
        throw new Error("Failed to update product status");
      }
      return response.data;
    },
    onMutate: ({ id }) => {
      setStatusUpdatingId(id);
    },
    onError: (error) => {
      console.error("Error updating product status:", error);
      const serverMessage = get(error, "response.data.message");
      const errMsg = isArray(serverMessage)
        ? serverMessage.join(", ")
        : serverMessage || "Mahsulot statusini yangilashda xatolik yuz berdi.";
      message.error(errMsg);
      // Select eski qiymatga qaytishi uchun ro'yxatni qayta yuklaymiz
      refetchProducts();
    },
    onSuccess: () => {
      message.success("Mahsulot statusi muvaffaqiyatli yangilandi.");
      refetchProducts();
    },
    onSettled: () => {
      setStatusUpdatingId(null);
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

  const handleUpdateProductStatus = (productId, status) => {
    updateProductStatus({ id: productId, status });
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

  /**
   * Barcha mahsulot rasmlarini bir xil o'lcham va sifatga keltirish.
   * Barcha sahifalardan rasmlarni oladi, /file/bulk-optimize endpointiga yuboradi.
   */
  const handleBulkOptimizeProductImages = useCallback(async () => {
    setIsOptimizing(true);
    setOptimizeProgress(0);

    try {
      // Barcha mahsulotlardan rasmlarni olish (bir nechta sahifa bo'lishi mumkin)
      let allImageUrls = [];

      // Joriy sahifadagi mahsulotlardan rasmlarni to'playmiz
      const res = await api.get(`/products?pageSize=200&page=1`);
      const items = get(res, "data.content.data", []);

      items.forEach((product) => {
        if (product.images && product.images.length > 0) {
          product.images.forEach((img) => {
            if (img.url) {
              allImageUrls.push(img.url);
            }
          });
        }
      });

      if (allImageUrls.length === 0) {
        message.info("Optimizatsiya qilinadigan rasmli mahsulot topilmadi");
        setIsOptimizing(false);
        return;
      }

      // Duplikatlarni olib tashlash
      allImageUrls = [...new Set(allImageUrls)];

      // Backend endpointiga yuboramiz (3 tadan bo'laklarga bo'lib)
      const chunkSize = 3;
      let optimizedCount = 0;
      const urlMap = {};

      for (let i = 0; i < allImageUrls.length; i += chunkSize) {
        const chunk = allImageUrls.slice(i, i + chunkSize);
        try {
          const optimRes = await api.post("/file/bulk-optimize", { urls: chunk });
          const results = optimRes.data?.results || [];
          results.forEach((r) => {
            if (r.success) {
              urlMap[r.originalUrl] = r.optimizedUrl;
              optimizedCount++;
            }
          });
        } catch (chunkErr) {
          console.error("Chunk optimization error", chunkErr);
        }
        setOptimizeProgress(Math.round(((i + chunk.length) / allImageUrls.length) * 100));
      }

      queryClient.invalidateQueries({ queryKey: ["products"] });
      message.success(`✅ ${optimizedCount} ta mahsulot rasmi optimize qilindi!`);
    } catch (err) {
      message.error(get(err, "response.data.message", "Optimizatsiya xatosi"));
    } finally {
      setIsOptimizing(false);
      setOptimizeProgress(0);
    }
  }, [queryClient]);

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
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => {
        const currentStatus = status || "pending";
        return (
          <Select
            style={{ width: 140 }}
            value={currentStatus}
            loading={statusUpdatingId === record.id}
            disabled={statusUpdatingId === record.id}
            onChange={(value) => handleUpdateProductStatus(record.id, value)}
            optionLabelProp="label"
          >
            {STATUS_OPTIONS.map((opt) => (
              <Select.Option
                key={opt.value}
                value={opt.value}
                label={STATUS_LABELS[opt.value]}
              >
                <Tag color={STATUS_COLORS[opt.value]}>{opt.label}</Tag>
              </Select.Option>
            ))}
          </Select>
        );
      },
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h1 className="text-2xl font-semibold" style={{ margin: 0 }}>Mahsulotlar Ro'yxati</h1>
        <Popconfirm
          title="Barcha mahsulot rasmlarini optimize qilish?"
          description={
            <div style={{ maxWidth: 280 }}>
              <p style={{ margin: 0, fontSize: 12 }}>Barcha rasmlar bir xil o'lcham (max 1200×1200), WebP format va optimal sifatga keltiriladi.</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>Past internet uchun ham tez ochilishi ta'minlanadi.</p>
            </div>
          }
          onConfirm={handleBulkOptimizeProductImages}
          okText="Ha, optimize qil"
          cancelText="Bekor"
          disabled={isOptimizing}
        >
          <Button
            icon={<ThunderboltOutlined />}
            loading={isOptimizing}
            style={{
              background: isOptimizing ? undefined : "#fff7e6",
              borderColor: "#fa8c16",
              color: "#fa8c16"
            }}
          >
            {isOptimizing ? `Optimize qilinmoqda... ${optimizeProgress}%` : "Rasmlarni Optimize"}
          </Button>
        </Popconfirm>
      </div>
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
              <Descriptions.Item label="Status">
                <Tag
                  color={STATUS_COLORS[selectedProductData.status] || "default"}
                >
                  {STATUS_LABELS[selectedProductData.status] ||
                    selectedProductData.status ||
                    "N/A"}
                </Tag>
              </Descriptions.Item>
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
