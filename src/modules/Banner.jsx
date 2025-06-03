// src/pages/Banners.jsx
import React, { useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  InputNumber,
  Upload,
  message,
  Popconfirm,
  Image,
  Tag,
  Tooltip,
  Select, // placement uchun
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./../config/auth/api"; // Sizning API konfigiratsiyangiz
import dayjs from "dayjs";
const PLACEMENT_OPTIONS = [
  { value: "home_hero", label: "Bosh sahifa (Katta banner)" },
  { value: "category_sidebar", label: "Kategoriya yon paneli" },
  { value: "product_detail_top", label: "Mahsulot batafsil (Yuqori)" },
  { value: "ad_section", label: "Reklama bo'limi" },
];

const Banners = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null); // Tahrirlash uchun banner
  const [fileList, setFileList] = useState([]); // Upload komponenti uchun fayllar ro'yxati
  const [selectedPlacementFilter, setSelectedPlacementFilter] = useState(null); // Filter uchun

  // --- API so'rovlari ---

  // Barcha bannerlarni olish
  const {
    data: banners,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["banners", selectedPlacementFilter],
    queryFn: async () => {
      const url = selectedPlacementFilter
        ? `/banners?placement=${selectedPlacementFilter}`
        : `/banners`;
      const response = await api.get(url);
      if (response.status !== 200 || !response.data) {
        throw new Error("Bannerlarni yuklashda xatolik yuz berdi.");
      }
      return response.data?.content;
    },
    onError: (error) => {
      message.error(
        error.message || "Bannerlarni yuklashda xatolik yuz berdi."
      );
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Banner yaratish
  const createBannerMutation = useMutation({
    mutationFn: async (values) => {
      const formData = new FormData();
      const fileList = values?.file;

      if (fileList && fileList[0] && fileList[0].originFileObj) {
        formData.append("file", fileList[0].originFileObj);
      }

      Object.keys(values).forEach((key) => {
        if (
          key !== "file" &&
          values[key] !== undefined &&
          values[key] !== null
        ) {
          formData.append(key, values[key]);
        }
      });

      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const response = await api.post("/banners", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status !== 201 || !response.data) {
        throw new Error("Banner yaratishda xatolik yuz berdi.");
      }
      return response.data;
    },
    onSuccess: () => {
      message.success("Banner muvaffaqiyatli yaratildi!");
      setIsModalVisible(false);
      form.resetFields();
      setFileList([]);
      queryClient.invalidateQueries("banners");
    },
    onError: (error) => {
      message.error(error.message || "Banner yaratishda xatolik yuz berdi.");
    },
  });

  // Bannerni yangilash
  const updateBannerMutation = useMutation({
    mutationFn: async (values) => {
      const formData = new FormData();
      const fileList = values?.file;
      console.log("FileList:", fileList);
      console.log("Values:", values);

      if (fileList && fileList[0] && fileList[0].originFileObj) {
        formData.append("file", fileList[0].originFileObj);
      }

      Object.keys(values).forEach((key) => {
        if (
          key !== "file" &&
          values[key] !== undefined &&
          values[key] !== null
        ) {
          formData.append(key, values[key]);
        }
      });

      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const response = await api.post("/banners", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status !== 201 || !response.data) {
        throw new Error("Banner yaratishda xatolik yuz berdi.");
      }
      return response.data;
    },
    onSuccess: () => {
      message.success("Banner muvaffaqiyatli yangilandi!");
      setIsModalVisible(false);
      form.resetFields();
      setFileList([]);
      queryClient.invalidateQueries("banners");
    },
    onError: (error) => {
      message.error(error.message || "Banner yangilashda xatolik yuz berdi.");
    },
  });

  // Bannerni o'chirish
  const deleteBannerMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/banners/${id}`);
      if (response.status !== 200) {
        throw new Error("Banner o'chirishda xatolik yuz berdi.");
      }
      return response.data;
    },
    onSuccess: () => {
      message.success("Banner muvaffaqiyatli o'chirildi!");
      queryClient.invalidateQueries("banners");
    },
    onError: (error) => {
      message.error(error.message || "Banner o'chirishda xatolik yuz berdi.");
    },
  });

  // --- Handler funksiyalari ---

  const showAddModal = () => {
    setEditingBanner(null);
    form.resetFields();
    setFileList([]);
    setIsModalVisible(true);
  };

  const showEditModal = (banner) => {
    setEditingBanner(banner);
    form.setFieldsValue({
      ...banner,
      isActive: banner.isActive, // Switch uchun boolean qiymat
    });
    setFileList(
      banner.imageUrl
        ? [
            {
              uid: "-1",
              name: "image.png",
              status: "done",
              url: banner.imageUrl,
            },
          ]
        : []
    );
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      if (editingBanner) {
        updateBannerMutation.mutate({ id: editingBanner.id, values });
      } else {
        createBannerMutation.mutate(values);
      }
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setFileList([]);
    setEditingBanner(null);
  };

  const handleDelete = (id) => {
    deleteBannerMutation.mutate(id);
  };

  const handleFileChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  // --- Jadval ustunlari ---

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 60,
    },
    {
      title: "Rasm",
      dataIndex: "imageUrl",
      key: "imageUrl",
      render: (imageUrl) =>
        imageUrl ? (
          <Image
            src={imageUrl}
            alt="Banner Image"
            width={80}
            height={45}
            style={{ objectFit: "cover", borderRadius: "4px" }}
          />
        ) : (
          "N/A"
        ),
      width: 100,
    },
    {
      title: "Sarlavha",
      dataIndex: "title",
      key: "title",
      render: (text) => (
        <Tooltip title={text}>
          <div className="truncate max-w-[150px]">{text || "N/A"}</div>
        </Tooltip>
      ),
    },
    {
      title: "Joylashuv",
      dataIndex: "placement",
      key: "placement",
      render: (placement) => {
        const option = PLACEMENT_OPTIONS.find((opt) => opt.value === placement);
        return <Tag color="blue">{option ? option.label : placement}</Tag>;
      },
    },
    {
      title: "Holati",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Faol" : "Nofaol"}
        </Tag>
      ),
      width: 80,
    },
    {
      title: "Tartibi",
      dataIndex: "order",
      key: "order",
      width: 80,
    },
    {
      title: "Yaratilgan",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => dayjs(date).format("YYYY-MM-DD HH:mm"),
      width: 150,
    },
    {
      title: "Amallar",
      key: "actions",
      render: (_, record) => (
        <div className="flex space-x-2">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
            size="small"
            title="Tahrirlash"
          />
          <Popconfirm
            title="Siz rostdan ham ushbu bannerni o'chirmoqchimisiz?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ha"
            cancelText="Yo'q"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
              title="O'chirish"
            />
          </Popconfirm>
        </div>
      ),
      width: 120,
    },
  ];

  if (isError) {
    return (
      <div className="text-red-500 text-center py-4">
        Bannerlarni yuklashda xatolik yuz berdi.
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Bannerlar Boshqaruvi
        </h1>
        <div className="flex items-center space-x-4">
          <Select
            placeholder="Joylashuv bo'yicha filter"
            style={{ width: 200 }}
            onChange={(value) => setSelectedPlacementFilter(value)}
            allowClear
            options={[
              { value: null, label: "Barchasi" }, // Barcha bannerlarni ko'rish uchun
              ...PLACEMENT_OPTIONS,
            ]}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showAddModal}
            size="large"
          >
            Yangi Banner Qo'shish
          </Button>
        </div>
      </div>

      <Table
        dataSource={banners}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }} // Bannerlar ko'p bo'lmasa, paginationni sozlash
        bordered
        className="shadow-sm"
      />

      <Modal
        title={editingBanner ? "Bannerni Tahrirlash" : "Yangi Banner Qo'shish"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={editingBanner ? "Saqlash" : "Qo'shish"}
        cancelText="Bekor qilish"
        confirmLoading={
          createBannerMutation.isLoading || updateBannerMutation.isLoading
        }
        className="top-10 "
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ isActive: true, order: 0, placement: "home_hero" }}
        >
          <Form.Item
            name="title"
            label="Sarlavha"
            rules={[
              { max: 255, message: "Sarlavha 255 belgidan oshmasligi kerak!" },
            ]}
          >
            <Input placeholder="Banner sarlavhasi" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Tavsif"
            rules={[
              { max: 500, message: "Tavsif 500 belgidan oshmasligi kerak!" },
            ]}
          >
            <Input.TextArea rows={3} placeholder="Banner tavsifi" />
          </Form.Item>

          <Form.Item
            name="linkUrl"
            label="Havola (Link)"
            rules={[{ type: "url", message: "Yaroqli URL kiriting!" }]} // Agar faqat URL bo'lishi shart bo'lsa
          >
            <Input placeholder="Banner bosilganda ochiladigan URL" />
          </Form.Item>

          <Form.Item
            name="order"
            label="Tartib raqami"
            rules={[
              { type: "number", message: "Tartib raqami son bo'lishi kerak!" },
            ]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Bannerning ko'rsatilish tartibi"
            />
          </Form.Item>

          <Form.Item
            name="placement"
            label="Joylashuv"
            rules={[{ required: true, message: "Joylashuvni tanlang!" }]}
          >
            <Select placeholder="Banner joylashuvini tanlang">
              {PLACEMENT_OPTIONS.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="isActive" label="Faol" valuePropName="checked">
            <Switch checkedChildren="Faol" unCheckedChildren="Nofaol" />
          </Form.Item>

          <Form.Item
            name="file"
            label="Banner rasmi"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
            rules={[
              { required: !editingBanner, message: "Banner rasmi majburiy!" },
            ]}
          >
            <Upload
              listType="picture"
              maxCount={1}
              beforeUpload={() => false} // Faylni avtomatik yuklashni o'chirish
              onChange={handleFileChange}
              fileList={fileList}
              accept=".png,.jpg,.jpeg,.webp"
            >
              <Button icon={<UploadOutlined />}>Rasm yuklash</Button>
            </Upload>
          </Form.Item>
          {editingBanner?.imageUrl && !fileList.length && (
            <div className="mb-4">
              <Image
                src={editingBanner.imageUrl}
                alt="Hozirgi rasm"
                width={100}
              />
              <p className="text-sm text-gray-500 mt-1">Hozirgi rasm</p>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default Banners;
