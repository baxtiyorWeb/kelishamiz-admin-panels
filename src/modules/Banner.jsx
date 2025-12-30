// src/pages/Banners.jsx
import React, {useState} from "react";
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
    Select,
    Space,
    Statistic,
    Card,
    Row,
    Col,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    UploadOutlined,
    EyeOutlined,
    YoutubeOutlined,
    FacebookOutlined,
    InstagramOutlined,
    SendOutlined,
    StarOutlined,
} from "@ant-design/icons";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import api from "./../config/auth/api";
import dayjs from "dayjs";

const PLACEMENT_OPTIONS = [
    {value: "home_hero", label: "Bosh sahifa (Katta banner)"},
    {value: "category_sidebar", label: "Kategoriya yon paneli"},
    {value: "product_detail_top", label: "Mahsulot batafsil (Yuqori)"},
    {value: "ad_section", label: "Reklama bo'limi"},
];

const PLATFORM_OPTIONS = [
    {value: "youtube", label: "YouTube", icon: <YoutubeOutlined/>},
    {value: "telegram", label: "Telegram", icon: <SendOutlined/>},
    {value: "facebook", label: "Facebook", icon: <FacebookOutlined/>},
    {value: "instagram", label: "Instagram", icon: <InstagramOutlined/>},
];

const Banners = () => {
    const queryClient = useQueryClient();
    const [form] = Form.useForm();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [selectedPlacementFilter, setSelectedPlacementFilter] = useState(null);
    const [selectedPlatformFilter, setSelectedPlatformFilter] = useState(null);
    const [selectedFeaturedFilter, setSelectedFeaturedFilter] = useState(null);

    // --- API so'rovlari ---

    // Barcha bannerlarni olish
    const {
        data: banners,
        isLoading,
        isError,
    } = useQuery({
        queryKey: [
            "banners",
            selectedPlacementFilter,
            selectedPlatformFilter,
            selectedFeaturedFilter,
        ],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (selectedPlacementFilter)
                params.append("placement", selectedPlacementFilter);
            if (selectedPlatformFilter)
                params.append("platform", selectedPlatformFilter);
            if (selectedFeaturedFilter !== null)
                params.append("isFeatured", selectedFeaturedFilter);

            const url = `/banners${params.toString() ? `?${params.toString()}` : ""}`;
            const response = await api.get(url);
            if (response.status !== 200 || !response.data) {
                throw new Error("Bannerlarni yuklashda xatolik yuz berdi.");
            }
            return response.data?.content || response.data;
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
            queryClient.invalidateQueries(["banners"]);
        },
        onError: (error) => {
            message.error(error.message || "Banner yaratishda xatolik yuz berdi.");
        },
    });

    // Bannerni yangilash
    const updateBannerMutation = useMutation({
        mutationFn: async ({id, values}) => {
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

            const response = await api.patch(`/banners/${id}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            if (response.status !== 200 || !response.data) {
                throw new Error("Banner yangilashda xatolik yuz berdi.");
            }
            return response.data;
        },
        onSuccess: () => {
            message.success("Banner muvaffaqiyatli yangilandi!");
            setIsModalVisible(false);
            form.resetFields();
            setFileList([]);
            setEditingBanner(null);
            queryClient.invalidateQueries(["banners"]);
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
            queryClient.invalidateQueries(["banners"]);
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
            isActive: banner.isActive,
            isFeatured: banner.isFeatured,
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
                updateBannerMutation.mutate({id: editingBanner.id, values});
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

    const handleFileChange = ({fileList: newFileList}) => {
        setFileList(newFileList);
    };

    const getPlatformIcon = (platform) => {
        const platformConfig = PLATFORM_OPTIONS.find((p) => p.value === platform);
        return platformConfig?.icon;
    };

    const getPlatformColor = (platform) => {
        const colors = {
            youtube: "red",
            telegram: "blue",
            facebook: "geekblue",
            instagram: "purple",
        };
        return colors[platform] || "default";
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
                        width={100}
                        height={50}
                        style={{objectFit: "cover", borderRadius: "8px"}}
                        preview={true}
                    />
                ) : (
                    "N/A"
                ),
            width: 120,
        },
        {
            title: "Sarlavha",
            dataIndex: "title",
            key: "title",
            render: (text) => (
                <Tooltip title={text}>
                    <div className="truncate max-w-[200px] font-medium">
                        {text || "N/A"}
                    </div>
                </Tooltip>
            ),
        },
        {
            title: "Platform",
            dataIndex: "platform",
            key: "platform",
            render: (platform) =>
                platform ? (
                    <Tag color={getPlatformColor(platform)} icon={getPlatformIcon(platform)}>
                        {platform.toUpperCase()}
                    </Tag>
                ) : (
                    <Tag>N/A</Tag>
                ),
            width: 120,
        },
        {
            title: "Brend/Do'kon",
            dataIndex: "brand",
            key: "brand",
            render: (brand) => (
                <Tooltip title={brand}>
                    <div className="truncate max-w-[150px]">{brand || "N/A"}</div>
                </Tooltip>
            ),
        },
        {
            title: "Joylashuv",
            dataIndex: "placement",
            key: "placement",
            render: (placement) => {
                const option = PLACEMENT_OPTIONS.find((opt) => opt.value === placement);
                return <Tag color="cyan">{option ? option.label : placement}</Tag>;
            },
            width: 180,
        },
        {
            title: "Ko'rishlar",
            dataIndex: "views",
            key: "views",
            render: (views) => (
                <Space>
                    <EyeOutlined/>
                    <span className="font-semibold">{views || 0}</span>
                </Space>
            ),
            sorter: (a, b) => (a.views || 0) - (b.views || 0),
            width: 100,
        },
        {
            title: "Holati",
            key: "status",
            render: (_, record) => (
                <Space direction="vertical" size="small">
                    <Tag color={record.isActive ? "green" : "red"}>
                        {record.isActive ? "Faol" : "Nofaol"}
                    </Tag>
                    {record.isFeatured && (
                        <Tag color="gold" icon={<StarOutlined/>}>
                            Premium
                        </Tag>
                    )}
                </Space>
            ),
            width: 100,
        },
        {
            title: "Tartib",
            dataIndex: "order",
            key: "order",
            sorter: (a, b) => a.order - b.order,
            width: 80,
        },
        {
            title: "Yaratilgan",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (date) => (
                <Tooltip title={dayjs(date).format("YYYY-MM-DD HH:mm:ss")}>
                    {dayjs(date).format("YYYY-MM-DD")}
                </Tooltip>
            ),
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
            width: 120,
        },
        {
            title: "Amallar",
            key: "actions",
            fixed: "right",
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="primary"
                        icon={<EditOutlined/>}
                        onClick={() => showEditModal(record)}
                        size="small"
                        title="Tahrirlash"
                    />
                    <Popconfirm
                        title="Siz rostdan ham ushbu bannerni o'chirmoqchimisiz?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Ha"
                        cancelText="Yo'q"
                        placement="topRight"
                    >
                        <Button
                            type="primary"
                            danger
                            icon={<DeleteOutlined/>}
                            size="small"
                            title="O'chirish"
                        />
                    </Popconfirm>
                </Space>
            ),
            width: 120,
        },
    ];

    // Statistika hisoblash
    const stats = React.useMemo(() => {
        if (!banners) return {total: 0, active: 0, featured: 0, totalViews: 0};
        return {
            total: banners.length,
            active: banners.filter((b) => b.isActive).length,
            featured: banners.filter((b) => b.isFeatured).length,
            totalViews: banners.reduce((sum, b) => sum + (b.views || 0), 0),
        };
    }, [banners]);

    if (isError) {
        return (
            <div className="text-red-500 text-center py-4">
                Bannerlarni yuklashda xatolik yuz berdi.
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Statistika */}
            <Row gutter={16} className="mb-6">
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Jami Bannerlar"
                            value={stats.total}
                            prefix={<PlusOutlined/>}
                            valueStyle={{color: "#1890ff"}}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Faol Bannerlar"
                            value={stats.active}
                            valueStyle={{color: "#52c41a"}}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Premium Bannerlar"
                            value={stats.featured}
                            prefix={<StarOutlined/>}
                            valueStyle={{color: "#faad14"}}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Jami Ko'rishlar"
                            value={stats.totalViews}
                            prefix={<EyeOutlined/>}
                            valueStyle={{color: "#722ed1"}}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Asosiy kontent */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Bannerlar Boshqaruvi
                    </h1>
                    <Space wrap>
                        <Select
                            placeholder="Joylashuv"
                            style={{width: 180}}
                            onChange={(value) => setSelectedPlacementFilter(value)}
                            allowClear
                            options={[{value: null, label: "Barchasi"}, ...PLACEMENT_OPTIONS]}
                        />
                        <Select
                            placeholder="Platform"
                            style={{width: 150}}
                            onChange={(value) => setSelectedPlatformFilter(value)}
                            allowClear
                            options={[
                                {value: null, label: "Barchasi"},
                                ...PLATFORM_OPTIONS,
                            ]}
                        />
                        <Select
                            placeholder="Premium"
                            style={{width: 130}}
                            onChange={(value) => setSelectedFeaturedFilter(value)}
                            allowClear
                            options={[
                                {value: null, label: "Barchasi"},
                                {value: "true", label: "Premium"},
                                {value: "false", label: "Oddiy"},
                            ]}
                        />
                        <Button
                            type="primary"
                            icon={<PlusOutlined/>}
                            onClick={showAddModal}
                            size="large"
                        >
                            Yangi Banner
                        </Button>
                    </Space>
                </div>

                <Table
                    dataSource={banners}
                    columns={columns}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Jami: ${total} ta banner`,
                    }}
                    bordered
                    scroll={{x: 1400}}
                    className="shadow-sm"
                />

                <Modal
                    title={
                        <div className="text-xl font-bold">
                            {editingBanner ? "Bannerni Tahrirlash" : "Yangi Banner Qo'shish"}
                        </div>
                    }
                    open={isModalVisible}
                    onOk={handleOk}
                    onCancel={handleCancel}
                    okText={editingBanner ? "Saqlash" : "Qo'shish"}
                    cancelText="Bekor qilish"
                    confirmLoading={
                        createBannerMutation.isLoading || updateBannerMutation.isLoading
                    }
                    width={700}
                    className="top-10"
                >
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={{
                            isActive: true,
                            isFeatured: false,
                            order: 0,
                            views: 0,
                            placement: "home_hero",
                        }}
                    >
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item
                                    name="title"
                                    label="Sarlavha"
                                    rules={[
                                        {
                                            max: 255,
                                            message: "Sarlavha 255 belgidan oshmasligi kerak!",
                                        },
                                    ]}
                                >
                                    <Input placeholder="Banner sarlavhasi"/>
                                </Form.Item>
                            </Col>

                            <Col span={24}>
                                <Form.Item
                                    name="description"
                                    label="Tavsif"
                                    rules={[
                                        {
                                            max: 500,
                                            message: "Tavsif 500 belgidan oshmasligi kerak!",
                                        },
                                    ]}
                                >
                                    <Input.TextArea rows={3} placeholder="Banner tavsifi"/>
                                </Form.Item>
                            </Col>

                            <Col span={12}>
                                <Form.Item
                                    name="platform"
                                    label="Ijtimoiy Tarmoq"
                                    tooltip="Banner qaysi platformada ko'rsatiladi"
                                >
                                    <Select placeholder="Platformani tanlang">
                                        {PLATFORM_OPTIONS.map((option) => (
                                            <Select.Option key={option.value} value={option.value}>
                                                <Space>
                                                    {option.icon}
                                                    {option.label}
                                                </Space>
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col span={12}>
                                <Form.Item
                                    name="brand"
                                    label="Brend/Do'kon Nomi"
                                    tooltip="Do'kon yoki brend nomi"
                                >
                                    <Input placeholder="Masalan: TechStore UZ"/>
                                </Form.Item>
                            </Col>

                            <Col span={24}>
                                <Form.Item
                                    name="linkUrl"
                                    label="Havola (Link)"
                                    rules={[
                                        {type: "url", message: "Yaroqli URL kiriting!"},
                                    ]}
                                >
                                    <Input placeholder="Banner bosilganda ochiladigan URL"/>
                                </Form.Item>
                            </Col>

                            <Col span={12}>
                                <Form.Item
                                    name="placement"
                                    label="Joylashuv"
                                    rules={[
                                        {required: true, message: "Joylashuvni tanlang!"},
                                    ]}
                                >
                                    <Select placeholder="Banner joylashuvini tanlang">
                                        {PLACEMENT_OPTIONS.map((option) => (
                                            <Select.Option key={option.value} value={option.value}>
                                                {option.label}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col span={12}>
                                <Form.Item
                                    name="order"
                                    label="Tartib raqami"
                                    tooltip="Kichik raqam birinchi ko'rsatiladi"
                                    rules={[
                                        {
                                            type: "number",
                                            message: "Tartib raqami son bo'lishi kerak!",
                                        },
                                    ]}
                                >
                                    <InputNumber
                                        min={0}
                                        style={{width: "100%"}}
                                        placeholder="0"
                                    />
                                </Form.Item>
                            </Col>

                            <Col span={12}>
                                <Form.Item
                                    name="views"
                                    label="Ko'rishlar soni"
                                    tooltip="Banner qancha marta ko'rilgani"
                                >
                                    <InputNumber
                                        min={0}
                                        style={{width: "100%"}}
                                        placeholder="0"
                                    />
                                </Form.Item>
                            </Col>

                            <Col span={12}>
                                <Form.Item name="isActive" label="Faol" valuePropName="checked">
                                    <Switch checkedChildren="Faol" unCheckedChildren="Nofaol"/>
                                </Form.Item>
                            </Col>

                            <Col span={12}>
                                <Form.Item
                                    name="isFeatured"
                                    label="Premium Banner"
                                    valuePropName="checked"
                                    tooltip="Premium bannerlar birinchi o'rinda ko'rsatiladi"
                                >
                                    <Switch
                                        checkedChildren={<StarOutlined/>}
                                        unCheckedChildren="Oddiy"
                                    />
                                </Form.Item>
                            </Col>

                            <Col span={24}>
                                <Form.Item
                                    name="file"
                                    label="Banner rasmi"
                                    valuePropName="fileList"
                                    getValueFromEvent={(e) =>
                                        Array.isArray(e) ? e : e && e.fileList
                                    }
                                    rules={[
                                        {
                                            required: !editingBanner,
                                            message: "Banner rasmi majburiy!",
                                        },
                                    ]}
                                >
                                    <Upload
                                        listType="picture-card"
                                        maxCount={1}
                                        beforeUpload={() => false}
                                        onChange={handleFileChange}
                                        fileList={fileList}
                                        accept=".png,.jpg,.jpeg,.webp"
                                    >
                                        {fileList.length === 0 && (
                                            <div>
                                                <UploadOutlined/>
                                                <div style={{marginTop: 8}}>Rasm yuklash</div>
                                            </div>
                                        )}
                                    </Upload>
                                </Form.Item>
                                {editingBanner?.imageUrl && fileList.length === 0 && (
                                    <div className="mb-4">
                                        <p className="text-sm text-gray-500 mb-2">Hozirgi rasm:</p>
                                        <Image
                                            src={editingBanner.imageUrl}
                                            alt="Hozirgi rasm"
                                            width={200}
                                            className="rounded-lg"
                                        />
                                    </div>
                                )}
                            </Col>
                        </Row>
                    </Form>
                </Modal>
            </div>
        </div>
    );
};

export default Banners;