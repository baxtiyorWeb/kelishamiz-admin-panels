import React, { useState, useMemo } from "react";
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
    Divider,
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
    VideoCameraOutlined,
    PlayCircleOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./../config/auth/api";

const PLACEMENT_OPTIONS = [
    { value: "home_hero", label: "Bosh sahifa (Katta banner)" },
    { value: "category_sidebar", label: "Kategoriya yon paneli" },
    { value: "product_detail_top", label: "Mahsulot batafsil (Yuqori)" },
    { value: "ad_section", label: "Reklama bo'limi" },
];

const PLATFORM_OPTIONS = [
    { value: "youtube", label: "YouTube", icon: <YoutubeOutlined /> },
    { value: "telegram", label: "Telegram", icon: <SendOutlined /> },
    { value: "facebook", label: "Facebook", icon: <FacebookOutlined /> },
    { value: "instagram", label: "Instagram", icon: <InstagramOutlined /> },
];

const Banners = () => {
    const queryClient = useQueryClient();
    const [form] = Form.useForm();
    const isVideoValue = Form.useWatch("isVideo", form);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [fileList, setFileList] = useState([]);

    // Filterlar holati
    const [filters, setFilters] = useState({
        placement: null,
        platform: null,
        isFeatured: null
    });

    // --- API So'rovlari ---

    const { data: banners = [], isPending: isLoading } = useQuery({
        queryKey: ["banners", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.placement) params.append("placement", filters.placement);
            if (filters.platform) params.append("platform", filters.platform);
            if (filters.isFeatured !== null) params.append("isFeatured", filters.isFeatured);

            const response = await api.get(`/banners?${params.toString()}`);
            return response.data?.content || response.data || [];
        }
    });

    const bannerMutation = useMutation({
        mutationFn: async ({ id, values }) => {
            const formData = new FormData();

            if (values.file && values.file[0] && values.file[0].originFileObj) {
                formData.append("file", values.file[0].originFileObj);
            }

            Object.entries(values).forEach(([key, value]) => {
                if (key !== "file" && value !== undefined && value !== null) {
                    formData.append(key, value);
                }
            });

            const config = {
                headers: { "Content-Type": "multipart/form-data" },
            };

            if (id) {
                return api.patch(`/banners/${id}`, formData, config);
            }
            return api.post("/banners", formData, config);
        },
        onSuccess: () => {
            message.success(editingBanner ? "Banner yangilandi" : "Banner yaratildi");
            handleCancel();
            queryClient.invalidateQueries(["banners"]);
        },
        onError: (err) => {
            message.error(err.response?.data?.message || "Xatolik yuz berdi");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/banners/${id}`),
        onSuccess: () => {
            message.success("Banner o'chirildi");
            queryClient.invalidateQueries(["banners"]);
        }
    });

    // --- Handlers ---

    const showModal = (banner = null) => {
        setEditingBanner(banner);
        if (banner) {
            form.setFieldsValue({ ...banner });
            setFileList(banner.imageUrl ? [{ uid: "-1", url: banner.imageUrl, status: "done" }] : []);
        } else {
            form.resetFields();
            setFileList([]);
        }
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingBanner(null);
        setFileList([]);
        form.resetFields();
    };

    const onFinish = (values) => {
        bannerMutation.mutate({ id: editingBanner?.id, values });
    };

    // --- UI Helpers ---

    const stats = useMemo(() => {
        const list = Array.isArray(banners) ? banners : [];
        return {
            total: list.length,
            active: list.filter(b => b.isActive).length,
            videoBanners: list.filter(b => b.isVideo).length,
            views: list.reduce((a, b) => a + (b.views || 0), 0)
        };
    }, [banners]);

    const columns = [
        { title: "ID", dataIndex: "id", key: "id", width: 60 },
        {
            title: "Media",
            key: "media",
            width: 110,
            render: (_, r) => (
                r.isVideo ? (
                    <Tag color="purple" icon={<PlayCircleOutlined />}>
                        Video {r.videoDuration ? `(${r.videoDuration})` : ""}
                    </Tag>
                ) : (
                    <Image src={r.imageUrl} width={70} height={40} className="rounded object-cover" fallback="https://via.placeholder.com/80x40?text=No+Image" />
                )
            )
        },
        {
            title: "Sarlavha",
            dataIndex: "title",
            key: "title",
            render: (t, r) => (
                <div>
                    <Tooltip title={t}><span className="font-medium">{t || "---"}</span></Tooltip>
                    {r.isVideo && <div className="text-xs text-purple-600 font-semibold flex items-center gap-1 mt-0.5"><VideoCameraOutlined /> Video Banner</div>}
                </div>
            )
        },
        {
            title: "Ijtimoiy tarmoqlar",
            key: "socials",
            render: (_, r) => (
                <Space size={4} wrap>
                    {r.youtubeUrl && <Tag icon={<YoutubeOutlined />} color="red">YouTube</Tag>}
                    {r.instagramUrl && <Tag icon={<InstagramOutlined />} color="magenta">Instagram</Tag>}
                    {r.telegramUrl && <Tag icon={<SendOutlined />} color="blue">Telegram</Tag>}
                    {r.facebookUrl && <Tag icon={<FacebookOutlined />} color="geekblue">Facebook</Tag>}
                </Space>
            )
        },
        {
            title: "Joylashuv",
            dataIndex: "placement",
            render: (p) => <Tag color="cyan">{PLACEMENT_OPTIONS.find(o => o.value === p)?.label || p}</Tag>
        },
        {
            title: "Statistika",
            key: "stats",
            render: (_, r) => (
                <Space direction="vertical" size={0}>
                    <small><EyeOutlined /> {r.views || 0}</small>
                    {r.isFeatured && <Tag color="gold" size="small" icon={<StarOutlined />}>Premium</Tag>}
                </Space>
            )
        },
        {
            title: "Holati",
            dataIndex: "isActive",
            render: (act) => <Tag color={act ? "green" : "red"}>{act ? "Faol" : "Nofaol"}</Tag>
        },
        {
            title: "Amallar",
            key: "actions",
            fixed: "right",
            width: 110,
            render: (_, r) => (
                <Space>
                    <Button type="text" icon={<EditOutlined />} onClick={() => showModal(r)} />
                    <Popconfirm title="O'chirilsinmi?" onConfirm={() => deleteMutation.mutate(r.id)}>
                        <Button type="text" danger icon={<DeleteOutlined />} loading={deleteMutation.isPending} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div className="p-6 bg-[#f0f2f5] min-h-screen">
            {/* Statistika Kartalari */}
            <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-sm">
                        <Statistic title="Jami Bannerlar" value={stats.total} prefix={<PlusOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-sm">
                        <Statistic title="Faol Bannerlar" value={stats.active} valueStyle={{ color: '#3f8600' }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-sm">
                        <Statistic title="Video Bannerlar" value={stats.videoBanners} prefix={<VideoCameraOutlined />} valueStyle={{ color: '#722ed1' }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-sm">
                        <Statistic title="Ko'rishlar" value={stats.views} prefix={<EyeOutlined />} />
                    </Card>
                </Col>
            </Row>

            <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold m-0">Bannerlar Boshqaruvi</h2>

                    <Space wrap>
                        <Select
                            placeholder="Joylashuv"
                            allowClear
                            style={{ width: 160 }}
                            onChange={v => setFilters(prev => ({ ...prev, placement: v }))}
                            options={PLACEMENT_OPTIONS}
                        />
                        <Select
                            placeholder="Platforma"
                            allowClear
                            style={{ width: 140 }}
                            onChange={v => setFilters(prev => ({ ...prev, platform: v }))}
                            options={PLATFORM_OPTIONS}
                        />
                        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => showModal()}>
                            Yangi Banner Qo'shish
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={banners}
                    rowKey="id"
                    loading={isLoading}
                    scroll={{ x: 1000 }}
                    pagination={{ pageSize: 8 }}
                    bordered
                />
            </div>

            {/* Qo'shish/Tahrirlash Modali */}
            <Modal
                title={editingBanner ? "Bannerni tahrirlash" : "Yangi banner"}
                open={isModalVisible}
                onCancel={handleCancel}
                onOk={() => form.submit()}
                confirmLoading={bannerMutation.isPending}
                width={700}
                centered
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{ isActive: true, isVideo: false, isFeatured: false, order: 0, placement: "home_hero" }}
                >
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="title" label="Sarlavha" rules={[{ max: 255 }]}>
                                <Input placeholder="Banner sarlavhasini kiriting" />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="description" label="Tavsif">
                                <Input.TextArea rows={2} placeholder="Banner batafsil matni" />
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item name="isVideo" label="Video Banner" valuePropName="checked">
                                <Switch checkedChildren="Video" unCheckedChildren="Rasm" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="isActive" label="Faol" valuePropName="checked">
                                <Switch size="small" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="isFeatured" label="Premium" valuePropName="checked">
                                <Switch size="small" />
                            </Form.Item>
                        </Col>

                        {isVideoValue && (
                            <>
                                <Col span={24}>
                                    <Divider style={{ margin: '8px 0 16px 0' }}>Video sozlamalari</Divider>
                                </Col>
                                <Col span={16}>
                                    <Form.Item name="videoUrl" label="Video URL (MP4 / HLS)" rules={[{ required: isVideoValue, message: "Video URL kiritish shart" }]}>
                                        <Input placeholder="https://example.com/banner-video.mp4" prefix={<VideoCameraOutlined />} />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="videoDuration" label="Davomiyligi">
                                        <Input placeholder="00:15" />
                                    </Form.Item>
                                </Col>

                                <Col span={24}>
                                    <Divider style={{ margin: '8px 0 16px 0' }}>Ijtimoiy Tarmoq Havolalari (Modal uchun)</Divider>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="youtubeUrl" label="YouTube URL">
                                        <Input prefix={<YoutubeOutlined style={{ color: '#ff4d4f' }} />} placeholder="https://youtube.com/watch?v=..." />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="instagramUrl" label="Instagram URL">
                                        <Input prefix={<InstagramOutlined style={{ color: '#ff4081' }} />} placeholder="https://instagram.com/p/..." />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="telegramUrl" label="Telegram URL">
                                        <Input prefix={<SendOutlined style={{ color: '#1890ff' }} />} placeholder="https://t.me/..." />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="facebookUrl" label="Facebook URL">
                                        <Input prefix={<FacebookOutlined style={{ color: '#2f54eb' }} />} placeholder="https://facebook.com/..." />
                                    </Form.Item>
                                </Col>
                            </>
                        )}

                        <Col span={24}>
                            <Divider style={{ margin: '8px 0 16px 0' }}>Umumiy sozlamalar</Divider>
                        </Col>

                        <Col span={16}>
                            <Form.Item name="linkUrl" label="Yo'naltirish havolasi (Asosiy URL)">
                                <Input placeholder="https://..." />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="placement" label="Joylashuv" rules={[{ required: true }]}>
                                <Select options={PLACEMENT_OPTIONS} />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                name="file"
                                label={isVideoValue ? "Banner Muqova Rasmi (Cover Image / Thumbnail)" : "Banner Rasmi"}
                                valuePropName="fileList"
                                getValueFromEvent={e => Array.isArray(e) ? e : e?.fileList}
                            >
                                <Upload
                                    listType="picture-card"
                                    maxCount={1}
                                    beforeUpload={() => false}
                                    fileList={fileList}
                                    onChange={({ fileList }) => setFileList(fileList)}
                                    accept="image/*"
                                >
                                    {fileList.length < 1 && (
                                        <div>
                                            <UploadOutlined />
                                            <div style={{ marginTop: 8 }}>Yuklash</div>
                                        </div>
                                    )}
                                </Upload>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
};

export default Banners;
