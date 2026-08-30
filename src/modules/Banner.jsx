import React, { useState, useMemo } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Upload,
  message,
  Popconfirm,
  Image,
  Tag,
  Tooltip,
  Select,
  Row,
  Col,
  Tabs,
} from "antd";
import {
  Image as ImageIcon,
  Video,
  Play,
  Sparkles,
  Eye,
  Plus,
  Search,
  Edit3,
  Trash2,
  ExternalLink,
  Layers,
  Send,
  Youtube,
  Instagram,
  Facebook,
  CheckCircle2,
  Star,
  MonitorPlay,
  UploadCloud,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./../config/auth/api";

const PLACEMENT_OPTIONS = [
  { value: "home_hero", label: "Bosh sahifa (Katta banner)" },
  { value: "category_sidebar", label: "Kategoriya yon paneli" },
  { value: "product_detail_top", label: "Mahsulot batafsil (Yuqori)" },
  { value: "ad_section", label: "Reklama bo'limi" },
];

const Banners = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const isVideoValue = Form.useWatch("isVideo", form);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [typeTab, setTypeTab] = useState("all");
  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState({
    placement: null,
    platform: null,
    isFeatured: null,
  });

  const { data: banners = [], isPending: isLoading } = useQuery({
    queryKey: ["banners", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.placement) params.append("placement", filters.placement);
      if (filters.platform) params.append("platform", filters.platform);
      if (filters.isFeatured !== null) params.append("isFeatured", filters.isFeatured);

      const response = await api.get(`/banners?${params.toString()}`);
      return response.data?.content || response.data || [];
    },
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
      const config = { headers: { "Content-Type": "multipart/form-data" } };
      if (id) {
        return api.patch(`/banners/${id}`, formData, config);
      }
      return api.post("/banners", formData, config);
    },
    onSuccess: () => {
      message.success(editingBanner ? "Banner yangilandi" : "Banner muvaffaqiyatli yaratildi");
      handleCancel();
      queryClient.invalidateQueries(["banners"]);
    },
    onError: (err) => {
      message.error(err.response?.data?.message || "Xatolik yuz berdi");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/banners/${id}`),
    onSuccess: () => {
      message.success("Banner o'chirildi");
      queryClient.invalidateQueries(["banners"]);
    },
  });

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

  const stats = useMemo(() => {
    const list = Array.isArray(banners) ? banners : [];
    return {
      total: list.length,
      active: list.filter((b) => b.isActive).length,
      videoBanners: list.filter((b) => b.isVideo).length,
      views: list.reduce((a, b) => a + (b.views || 0), 0),
    };
  }, [banners]);

  const filteredBanners = useMemo(() => {
    const list = Array.isArray(banners) ? banners : [];
    return list.filter((b) => {
      if (typeTab === "video" && !b.isVideo) return false;
      if (typeTab === "image" && b.isVideo) return false;
      if (typeTab === "featured" && !b.isFeatured) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          b.title?.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q) ||
          b.id?.toString().includes(q)
        );
      }
      return true;
    });
  }, [banners, typeTab, search]);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 60,
      render: (id) => <span className="font-mono text-xs font-bold text-slate-400">#{id}</span>,
    },
    {
      title: "Media Preview",
      key: "media",
      width: 140,
      render: (_, r) => (
        <div className="relative w-24 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs flex-shrink-0 group">
          {r.imageUrl ? (
            <img
              src={r.imageUrl}
              alt=""
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <ImageIcon className="w-6 h-6" />
            </div>
          )}
          {r.isVideo && (
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xs flex items-center justify-center">
              <div className="w-7 h-7 rounded-full bg-white/90 text-indigo-600 flex items-center justify-center shadow-md">
                <Play className="w-3.5 h-3.5 fill-indigo-600 ml-0.5" />
              </div>
            </div>
          )}
          {r.videoDuration && (
            <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white font-mono font-bold text-[9px] px-1 rounded">
              {r.videoDuration}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Sarlavha & Tavsif",
      key: "title",
      render: (_, r) => (
        <div className="flex flex-col gap-1 max-w-sm">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-slate-900 text-sm">{r.title || "Sarlavhasiz Banner"}</span>
            {r.isFeatured && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-extrabold text-[10px] border border-amber-200">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                VIP
              </span>
            )}
          </div>
          {r.description && <div className="text-xs text-slate-500 truncate">{r.description}</div>}
          {r.linkUrl && (
            <a
              href={r.linkUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 truncate mt-0.5 font-medium"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="truncate">{r.linkUrl}</span>
            </a>
          )}
        </div>
      ),
    },
    {
      title: "Ijtimoiy Tarmoqlar",
      key: "socials",
      width: 180,
      render: (_, r) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {r.youtubeUrl && (
            <a
              href={r.youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-50 text-red-600 font-bold text-[10px] border border-red-200"
            >
              <Youtube className="w-3 h-3" />
              YouTube
            </a>
          )}
          {r.telegramUrl && (
            <a
              href={r.telegramUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 font-bold text-[10px] border border-blue-200"
            >
              <Send className="w-3 h-3" />
              Telegram
            </a>
          )}
          {r.instagramUrl && (
            <a
              href={r.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-pink-50 text-pink-600 font-bold text-[10px] border border-pink-200"
            >
              <Instagram className="w-3 h-3" />
              Instagram
            </a>
          )}
          {r.facebookUrl && (
            <a
              href={r.facebookUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200"
            >
              <Facebook className="w-3 h-3" />
              Facebook
            </a>
          )}
          {!r.youtubeUrl && !r.telegramUrl && !r.instagramUrl && !r.facebookUrl && (
            <span className="text-slate-400 text-xs">—</span>
          )}
        </div>
      ),
    },
    {
      title: "Joylashuv",
      dataIndex: "placement",
      width: 170,
      render: (p) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200">
          <Layers className="w-3.5 h-3.5 text-purple-500" />
          <span>{PLACEMENT_OPTIONS.find((o) => o.value === p)?.label || p}</span>
        </span>
      ),
    },
    {
      title: "Ko'rishlar",
      key: "stats",
      width: 120,
      render: (_, r) => (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-black text-xs">
          <Eye className="w-3.5 h-3.5 text-slate-500" />
          <span>{(r.views || 0).toLocaleString()}</span>
        </div>
      ),
    },
    {
      title: "Holati",
      dataIndex: "isActive",
      width: 110,
      render: (act) => (
        <div>
          {act ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Faol</span>
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-bold text-xs">
              Nofaol
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Amallar",
      key: "actions",
      width: 95,
      render: (_, r) => (
        <div className="flex items-center gap-1.5">
          <Tooltip title="Tahrirlash">
            <button
              type="button"
              onClick={() => showModal(r)}
              className="w-8 h-8 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </Tooltip>

          <Popconfirm
            title="Bannerni o'chirishga ishonchingiz komilmi?"
            onConfirm={() => deleteMutation.mutate(r.id)}
            okText="Ha, o'chirish"
            cancelText="Bekor"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="O'chirish">
              <button
                type="button"
                className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 m-0 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MonitorPlay className="w-4 h-4" />
            </div>
            Promo & Bannerlar Boshqaruv Hubi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Bosh sahifa, kategoriyalar va ilova ichidagi rasm va video reklama bannerlarini joylash.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Banner sarlavhasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all w-60"
            />
          </div>

          <button
            type="button"
            onClick={() => showModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Banner</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jami Bannerlar</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{stats.total} ta</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Barcha joylashtirilganlar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                Faol Bannerlar
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{stats.active} ta</div>
              <div className="text-[11px] text-emerald-600/70 mt-0.5">Ilovada ko'rinayotganlar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-purple-500 uppercase tracking-wider flex items-center gap-1">
                Video Promo
              </div>
              <div className="text-2xl font-black text-purple-600 mt-1">{stats.videoBanners} ta</div>
              <div className="text-[11px] text-purple-600/70 mt-0.5">MP4 & HLS video bannerlar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Video className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                Ko'rishlar Soni
              </div>
              <div className="text-2xl font-black text-amber-600 mt-1">{stats.views.toLocaleString()}</div>
              <div className="text-[11px] text-amber-600/70 mt-0.5">Mijozlar tomonidan ko'rilgan</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Eye className="w-6 h-6" />
            </div>
          </div>
        </Col>
      </Row>

      {/* Main Table with Tabs */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 overflow-hidden flex flex-col gap-4">
        {/* Type Tabs */}
        <div className="border-b border-slate-100 pb-2 flex justify-between items-center flex-wrap gap-3">
          <Tabs
            activeKey={typeTab}
            onChange={(k) => setTypeTab(k)}
            className="!m-0"
            items={[
              { key: "all", label: <span className="font-bold">Barchasi ({banners.length})</span> },
              {
                key: "image",
                label: (
                  <span className="font-bold text-blue-600 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-500" />
                    Rasm Bannerlar
                  </span>
                ),
              },
              {
                key: "video",
                label: (
                  <span className="font-bold text-purple-600 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-purple-500" />
                    Video Promo ({stats.videoBanners})
                  </span>
                ),
              },
              {
                key: "featured",
                label: (
                  <span className="font-bold text-amber-600 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500" />
                    VIP Featured
                  </span>
                ),
              },
            ]}
          />

          <Select
            placeholder="Joylashuv bo'yicha filter"
            allowClear
            className="w-56 !rounded-xl"
            onChange={(v) => setFilters((prev) => ({ ...prev, placement: v }))}
            options={PLACEMENT_OPTIONS}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredBanners}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 8 }}
        />
      </div>

      {/* Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <MonitorPlay className="w-5 h-5 text-indigo-600" />
            <span className="font-black text-slate-900">
              {editingBanner ? "Bannerni Tahrirlash" : "Yangi Banner Qo'shish"}
            </span>
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        confirmLoading={bannerMutation.isPending}
        width={700}
        className="!rounded-3xl"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            isActive: true,
            isVideo: false,
            isFeatured: false,
            order: 0,
            placement: "home_hero",
          }}
          className="mt-4"
        >
          <Form.Item name="title" label="Banner Sarlavhasi">
            <Input placeholder="Masalan: Yozgi chegirmalar aksiyasi..." className="!rounded-xl h-11" />
          </Form.Item>

          <Form.Item name="description" label="Qisqacha Tavsif">
            <Input.TextArea rows={2} placeholder="Qisqacha matn..." className="!rounded-xl" />
          </Form.Item>

          <div className="grid grid-cols-3 gap-4 mb-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <Form.Item name="isVideo" label="Video Banner" valuePropName="checked" className="!m-0">
              <Switch checkedChildren="Video" unCheckedChildren="Rasm" />
            </Form.Item>
            <Form.Item name="isActive" label="Faol Holatda" valuePropName="checked" className="!m-0">
              <Switch />
            </Form.Item>
            <Form.Item name="isFeatured" label="VIP Premium" valuePropName="checked" className="!m-0">
              <Switch />
            </Form.Item>
          </div>

          {isVideoValue && (
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 flex flex-col gap-3 mb-4">
              <div className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                <Video className="w-4 h-4" /> Video Sozlamalari
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <Form.Item
                  name="videoUrl"
                  label="Video URL (MP4 / HLS)"
                  rules={[{ required: isVideoValue, message: "Video URL kiritish shart" }]}
                  className="sm:col-span-8 !m-0"
                >
                  <Input placeholder="https://cdn.../promo.mp4" className="!rounded-xl h-10" />
                </Form.Item>
                <Form.Item name="videoDuration" label="Davomiyligi" className="sm:col-span-4 !m-0">
                  <Input placeholder="00:15" className="!rounded-xl h-10" />
                </Form.Item>
              </div>

              <div className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5 mt-2">
                Ijtimoiy Tarmoq Havolalari
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Form.Item name="youtubeUrl" label="YouTube URL" className="!m-0">
                  <Input placeholder="https://youtube.com/..." className="!rounded-xl" />
                </Form.Item>
                <Form.Item name="instagramUrl" label="Instagram URL" className="!m-0">
                  <Input placeholder="https://instagram.com/..." className="!rounded-xl" />
                </Form.Item>
                <Form.Item name="telegramUrl" label="Telegram URL" className="!m-0">
                  <Input placeholder="https://t.me/..." className="!rounded-xl" />
                </Form.Item>
                <Form.Item name="facebookUrl" label="Facebook URL" className="!m-0">
                  <Input placeholder="https://facebook.com/..." className="!rounded-xl" />
                </Form.Item>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="linkUrl" label="Yo'naltirish URL havolasi">
              <Input placeholder="https://..." className="!rounded-xl h-11" />
            </Form.Item>
            <Form.Item name="placement" label="Joylashuv" rules={[{ required: true }]}>
              <Select options={PLACEMENT_OPTIONS} className="!rounded-xl h-11" />
            </Form.Item>
          </div>

          <Form.Item
            name="file"
            label={isVideoValue ? "Banner Muqovasi (Cover Thumbnail)" : "Banner Rasmi"}
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
          >
            <Upload
              listType="picture-card"
              maxCount={1}
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              accept="image/*"
              className="!rounded-2xl"
            >
              {fileList.length < 1 && (
                <div className="flex flex-col items-center">
                  <UploadCloud className="w-6 h-6 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-500 mt-1">Rasm yuklash</span>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Banners;
