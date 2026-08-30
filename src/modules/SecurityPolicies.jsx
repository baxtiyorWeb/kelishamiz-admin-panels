import React, { useState, useEffect, useMemo } from "react";
import { Table, Button, Modal, Form, Input, Select, message, Tag, Space, Row, Col, Tabs, Tooltip } from "antd";
import {
  ShieldCheck,
  FileText,
  Globe,
  Lock,
  Edit3,
  Eye,
  Save,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Layers,
  Scale,
  Calendar,
} from "lucide-react";
import api from "../config/auth/api";
import dayjs from "dayjs";

const { Option } = Select;

const SecurityPolicies = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [editorTab, setEditorTab] = useState("edit");
  const [docContent, setDocContent] = useState("");
  const [form] = Form.useForm();

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/security/admin/documents");
      const data = res.data?.content || res.data || [];
      setDocuments(data);
    } catch (err) {
      message.error("Hujjatlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleEdit = (doc) => {
    setEditingDoc(doc);
    setDocContent(doc.content || "");
    setEditorTab("edit");
    form.setFieldsValue({
      title: doc.title,
      type: doc.type,
      language: doc.language,
      content: doc.content,
    });
    setEditModalVisible(true);
  };

  const handleSave = async (values) => {
    if (!editingDoc) return;
    setSubmitting(true);
    try {
      await api.put(`/security/admin/documents/${editingDoc.id}`, {
        ...values,
        content: docContent,
      });
      message.success("Huquqiy hujjat muvaffaqiyatli yangilandi va chop etildi!");
      setEditModalVisible(false);
      fetchDocuments();
    } catch (err) {
      message.error("Hujjatni yangilashda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = documents.length;
    const privacy = documents.filter((d) => d.type === "privacy").length;
    const terms = documents.filter((d) => d.type === "terms").length;
    return {
      total,
      privacy,
      terms,
      languages: 3,
    };
  }, [documents]);

  const filteredDocs = useMemo(() => {
    if (typeFilter === "all") return documents;
    return documents.filter((d) => d.type === typeFilter);
  }, [documents, typeFilter]);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 65,
      render: (id) => <span className="font-mono text-xs font-bold text-slate-400">#{id}</span>,
    },
    {
      title: "Hujjat Turi",
      dataIndex: "type",
      key: "type",
      width: 180,
      render: (type) =>
        type === "privacy" ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Lock className="w-3.5 h-3.5 text-purple-600" />
            <span>Privacy Policy</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Terms of Service</span>
          </span>
        ),
    },
    {
      title: "Til",
      dataIndex: "language",
      key: "language",
      width: 160,
      render: (lang) => {
        const conf = {
          uz: { label: "🇺🇿 O'zbekcha", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
          ru: { label: "🇷🇺 Русский", bg: "bg-amber-50 text-amber-700 border-amber-200" },
          en: { label: "🇬🇧 English", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
        }[lang] || { label: lang, bg: "bg-slate-50 text-slate-700" };

        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${conf.bg}`}>
            <Globe className="w-3.5 h-3.5" />
            <span>{conf.label}</span>
          </span>
        );
      },
    },
    {
      title: "Hujjat Sarlavhasi",
      dataIndex: "title",
      key: "title",
      render: (text) => <strong className="text-slate-800 text-sm font-extrabold">{text}</strong>,
    },
    {
      title: "Oxirgi Yangilanish",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 170,
      render: (date) => (
        <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "—"}</span>
        </span>
      ),
    },
    {
      title: "Amallar",
      key: "actions",
      width: 95,
      render: (_, record) => (
        <Tooltip title="Tahrirlash va matnini ko'rish">
          <button
            type="button"
            onClick={() => handleEdit(record)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Tahrirlash</span>
          </button>
        </Tooltip>
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
              <Scale className="w-4 h-4" />
            </div>
            Platforma Xavfsizlik & Huquqiy Hujjatlari (3 Tilda)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Mobil ilova va Veb-sayt uchun Maxfiylik Siyosati hamda Foydalanish Shartlarini tahrirlash markazi.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>App Store & Google Play Compliant</span>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jami Hujjatlar</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{stats.total} ta</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Faol yuridik hujjatlar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Scale className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-purple-500 uppercase tracking-wider flex items-center gap-1">
                Privacy Policies
              </div>
              <div className="text-2xl font-black text-purple-600 mt-1">{stats.privacy} ta</div>
              <div className="text-[11px] text-purple-600/70 mt-0.5">Maxfiylik hujjatlari</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1">
                Terms of Service
              </div>
              <div className="text-2xl font-black text-blue-600 mt-1">{stats.terms} ta</div>
              <div className="text-[11px] text-blue-600/70 mt-0.5">Foydalanish qoidalari</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                Qo'llab-quvvatlanuvchi Tillar
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1">3 ta Til</div>
              <div className="text-[11px] text-emerald-600/70 mt-0.5">UZ / RU / EN</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
          </div>
        </Col>
      </Row>

      {/* Table Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 overflow-hidden flex flex-col gap-4">
        <div className="border-b border-slate-100 pb-2">
          <Tabs
            activeKey={typeFilter}
            onChange={(k) => setTypeFilter(k)}
            className="!m-0"
            items={[
              { key: "all", label: <span className="font-bold">Barcha Hujjatlar ({documents.length})</span> },
              {
                key: "privacy",
                label: (
                  <span className="font-bold text-purple-600 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-purple-500" />
                    Maxfiylik Siyosati (Privacy)
                  </span>
                ),
              },
              {
                key: "terms",
                label: (
                  <span className="font-bold text-blue-600 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-500" />
                    Foydalanish Qoidalari (Terms)
                  </span>
                ),
              },
            ]}
          />
        </div>

        <Table
          dataSource={filteredDocs}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </div>

      {/* Rich Markdown Editor Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-600" />
            <span className="font-black text-slate-900">
              Huquqiy Hujjatni Tahrirlash ({editingDoc?.title})
            </span>
          </div>
        }
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="Saqlash va Chop Etish"
        cancelText="Bekor"
        okButtonProps={{ className: "!bg-indigo-600 !border-indigo-600 font-bold !rounded-xl" }}
        cancelButtonProps={{ className: "!rounded-xl font-semibold" }}
        width={860}
        className="!rounded-3xl"
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4 flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="title" label="Hujjat Sarlavhasi" rules={[{ required: true }]} className="col-span-2">
              <Input className="!rounded-xl h-11 font-semibold" />
            </Form.Item>
            <Form.Item name="language" label="Til" rules={[{ required: true }]}>
              <Select className="!rounded-xl h-11">
                <Option value="uz">🇺🇿 O'zbekcha (UZ)</Option>
                <Option value="ru">🇷🇺 Русский (RU)</Option>
                <Option value="en">🇬🇧 English (EN)</Option>
              </Select>
            </Form.Item>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-700">Hujjat Matni (Markdown formatida):</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditorTab("edit")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    editorTab === "edit" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  Tahrir (Editor)
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab("preview")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    editorTab === "preview" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  Jonli Prevyu
                </button>
              </div>
            </div>

            {editorTab === "edit" ? (
              <Input.TextArea
                rows={12}
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                placeholder="Markdown formatidagi matn..."
                className="!rounded-2xl font-mono text-xs leading-relaxed"
              />
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-h-96 overflow-y-auto text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                {docContent || "Matn kiritilmagan"}
              </div>
            )}
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SecurityPolicies;
