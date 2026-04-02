"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, isArray } from "lodash";
import {
  Button,
  Popconfirm,
  message,
  Switch,
  Modal,
  Select,
  Input,
  InputNumber,
  Table,
  Tag,
  Tooltip,
  Space,
  Typography,
  Breadcrumb,
  Divider,
  Form,
  Upload,
} from "antd";
import {
  ArrowLeftOutlined,
  RightOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  UploadOutlined,
  PlusOutlined,
  CloseOutlined,
  CheckOutlined,
  FolderOpenOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import api from "../config/auth/api";

const { Text, Title } = Typography;

// ─── Constants ────────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: "STRING",  label: "Matn",           short: "STR",  color: "blue" },
  { value: "INTEGER", label: "Butun son",       short: "INT",  color: "purple" },
  { value: "DOUBLE",  label: "O'nlik son",      short: "DBL",  color: "gold" },
  { value: "BOOLEAN", label: "Ha / Yo'q",       short: "BOOL", color: "green" },
  { value: "SELECT",  label: "Tanlov ro'yxati", short: "SEL",  color: "red" },
];

const initCategory = { name: "", imageUrl: "", parentId: null, isVisible: true, order: 0 };
const initProperty = { name: "", type: "STRING", options: [], optionInput: "" };

// ─── Component ────────────────────────────────────────────────────────────────

const CategoryPage = () => {
  const queryClient = useQueryClient();

  // Navigation
  const [selectedId, setSelectedId]     = useState(null);
  const [history, setHistory]           = useState([]);

  // Selected category for properties panel
  const [selectedCatForProps, setSelectedCatForProps] = useState(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen,   setIsEditModalOpen]   = useState(false);
  const [isBulkModalOpen,   setIsBulkModalOpen]   = useState(false);

  // Inline add row – categories
  const [isAddingInline, setIsAddingInline] = useState(false);
  const [inlineName,     setInlineName]     = useState("");

  // Inline add row – properties
  const [isAddingPropInline, setIsAddingPropInline] = useState(false);
  const [inlinePropData, setInlinePropData] = useState(initProperty);

  // Inline edit – category row
  const [inlineEditId,   setInlineEditId]   = useState(null);
  const [inlineEditName, setInlineEditName] = useState("");

  // Inline edit – property row
  const [inlinePropEditId,   setInlinePropEditId]   = useState(null);
  const [inlinePropEditName, setInlinePropEditName] = useState("");

  // Forms
  const [categoryData,    setCategoryData]    = useState(initCategory);
  const [editingCategory, setEditingCategory] = useState(null);
  const [currentEditId,   setCurrentEditId]   = useState(null);
  const [bulkFile,        setBulkFile]        = useState(null);
  const [isUploading,     setIsUploading]     = useState(false);

  // ─── Queries ──────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ["categories", selectedId],
    queryFn: async () => {
      const q = selectedId !== null ? `?parentId=${selectedId}` : "";
      const res = await api.get(`/category${q}`);
      return res.data?.content || res.data || [];
    },
  });
  const categoryList = useMemo(() => (isArray(data) ? data : []), [data]);

  const { data: allCategories } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => {
      const res = await api.get("/category");
      return res.data?.content || res.data || [];
    },
  });

  const { data: properties, isLoading: propsLoading } = useQuery({
    queryKey: ["properties", selectedCatForProps?.id],
    queryFn: async () => {
      const res = await api.get(`/category/${selectedCatForProps.id}/properties`);
      return res.data?.content || res.data || [];
    },
    enabled: !!selectedCatForProps?.id,
  });

  // ─── Mutations ────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (payload) => api.post("/category", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      message.success("Kategoriya qo'shildi!");
      setCategoryData(initCategory);
      setIsCreateModalOpen(false);
      setInlineName("");
      setIsAddingInline(false);
    },
    onError: (e) => message.error(get(e, "response.data.message", "Xato yuz berdi")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/category/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsEditModalOpen(false);
      setInlineEditId(null);
      message.success("Yangilandi!");
    },
    onError: (e) => message.error(get(e, "response.data.message", "Xato")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/category/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      if (selectedCatForProps) setSelectedCatForProps(null);
      message.success("O'chirildi!");
    },
  });

  const createPropertyMutation = useMutation({
    mutationFn: (payload) => api.post("/property", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      message.success("Xususiyat qo'shildi!");
      setInlinePropData(initProperty);
      // setIsAddingPropInline(false);
    },
    onError: (e) => message.error(get(e, "response.data.message", "Xato")),
  });

  const updatePropertyMutation = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/property/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      setInlinePropEditId(null);
      message.success("Xususiyat yangilandi!");
    },
    onError: (e) => message.error(get(e, "response.data.message", "Xato")),
  });

  const deletePropertyMutation = useMutation({
    mutationFn: (id) => api.delete(`/property/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      message.success("Xususiyat o'chirildi!");
    },
  });

  const bulkMutation = useMutation({
    mutationFn: (file) => {
      const form = new FormData();
      form.append("file", file);
      return api.post("/category/import", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      message.success("Import muvaffaqiyatli!");
      setIsBulkModalOpen(false);
      setBulkFile(null);
    },
    onError: (e) => message.error(get(e, "response.data.message", "Fayl xatosi")),
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleDrill = useCallback((cat) => {
    setHistory((prev) => [...prev, selectedId]);
    setSelectedId(cat.id);
    setSelectedCatForProps(null);
  }, [selectedId]);

  const handleBack = useCallback(() => {
    const prev = history[history.length - 1];
    setSelectedId(prev !== undefined ? prev : null);
    setHistory((h) => h.slice(0, -1));
    setSelectedCatForProps(null);
  }, [history]);

  const handleInlineAdd = useCallback(() => {
    const name = inlineName.trim();
    if (!name) return;
    createMutation.mutate({ name, imageUrl: "", parentId: selectedId, isVisible: true, order: 0 });
  }, [inlineName, selectedId, createMutation]);

  const handleToggleVisibility = useCallback((cat, checked) => {
    updateMutation.mutate({ id: cat.id, isVisible: checked });
  }, [updateMutation]);

  const handleOpenEdit = useCallback((cat) => {
    setCurrentEditId(cat.id);
    setEditingCategory({ ...cat, parentId: cat.parent?.id ?? cat.parentId ?? null });
    setIsEditModalOpen(true);
  }, []);

  const handleRowDoubleClick = useCallback((cat) => {
    setInlineEditId(cat.id);
    setInlineEditName(cat.name);
  }, []);

  const handleInlineEditSave = useCallback((cat) => {
    const name = inlineEditName.trim();
    if (!name) { setInlineEditId(null); return; }
    updateMutation.mutate({ id: cat.id, ...cat, name });
  }, [inlineEditName, updateMutation]);

  const handlePropDoubleClick = useCallback((prop) => {
    setInlinePropEditId(prop.id);
    setInlinePropEditName(prop.name);
  }, []);

  const handlePropInlineEditSave = useCallback((prop) => {
    const name = inlinePropEditName.trim();
    if (!name) { setInlinePropEditId(null); return; }
    updatePropertyMutation.mutate({ id: prop.id, name });
  }, [inlinePropEditName, updatePropertyMutation]);

  const handleAddPropInline = useCallback(() => {
    if (!selectedCatForProps) return;
    if (!inlinePropData.name.trim()) {
      message.warning("Xususiyat nomini kiriting!");
      return;
    }
    createPropertyMutation.mutate({
      name: inlinePropData.name.trim(),
      type: inlinePropData.type,
      categoryId: String(selectedCatForProps.id),
      options: inlinePropData.type === "SELECT" ? inlinePropData.options : [],
    });
  }, [selectedCatForProps, inlinePropData, createPropertyMutation]);

  const handleImageUpload = useCallback(async (file, target) => {
    const form = new FormData();
    form.append("file", file);
    setIsUploading(true);
    try {
      const res = await api.post("/file/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
      const url = res.data?.content?.url || "";
      if (target === "edit") setEditingCategory((prev) => prev ? { ...prev, imageUrl: url } : prev);
      else setCategoryData((prev) => ({ ...prev, imageUrl: url }));
      message.success("Rasm yuklandi!");
    } catch {
      message.error("Rasm yuklashda xato!");
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Breadcrumb
  const breadcrumb = useMemo(() => {
    if (!allCategories || selectedId === null) return [];
    const trail = [];
    let cur = allCategories.find((c) => c.id === selectedId);
    while (cur) {
      trail.unshift(cur);
      cur = cur.parentId ? allCategories.find((c) => c.id === cur?.parentId) : undefined;
    }
    return trail;
  }, [allCategories, selectedId]);

  const typeInfo = (type) => PROPERTY_TYPES.find((t) => t.value === type);

  // ─── Table Columns ────────────────────────────────────────────────────────

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 60,
      render: (id) => <Text type="secondary" style={{ fontFamily: "monospace", fontSize: 12 }}>#{id}</Text>,
    },
    {
      title: "Nomi",
      dataIndex: "name",
      render: (name, cat) => {
        if (inlineEditId === cat.id) {
          return (
            <Input
              autoFocus
              size="small"
              value={inlineEditName}
              onChange={(e) => setInlineEditName(e.target.value)}
              onPressEnter={() => handleInlineEditSave(cat)}
              onBlur={() => handleInlineEditSave(cat)}
              onKeyDown={(e) => { if (e.key === "Escape") setInlineEditId(null); }}
              style={{ width: 180 }}
            />
          );
        }
        return (
          <div onDoubleClick={() => handleRowDoubleClick(cat)} style={{ cursor: "text" }}>
            <Text strong>{name}</Text>
            {cat.parent && <div><Text type="secondary" style={{ fontSize: 11 }}>↳ {cat.parent.name}</Text></div>}
            <Text type="secondary" style={{ fontSize: 10, display: "block" }}>
              (2x bosing — tahrirlash)
            </Text>
          </div>
        );
      },
    },
    {
      title: "Ko'rinish",
      dataIndex: "isVisible",
      width: 90,
      render: (val, cat) => (
        <Switch
          checked={val}
          size="small"
          loading={updateMutation.isPending}
          onChange={(checked) => handleToggleVisibility(cat, checked)}
        />
      ),
    },
    {
      title: "Xususiyatlar",
      dataIndex: "properties",
      width: 110,
      render: (props) =>
        props?.length > 0
          ? <Tag color="blue" icon={<SettingOutlined />}>{props.length} ta</Tag>
          : <Text type="secondary" style={{ fontSize: 12 }}>—</Text>,
    },
    {
      title: "Tartib",
      dataIndex: "order",
      width: 70,
      render: (v) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Harakatlar",
      width: 140,
      render: (_, cat) => (
        <Space size={2}>
          <Tooltip title="Tahrirlash (modal)">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(cat); }}
            />
          </Tooltip>
          <Tooltip title="Xususiyatlar">
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined />}
              style={selectedCatForProps?.id === cat.id ? { color: "#1677ff", background: "#e6f4ff" } : {}}
              onClick={(e) => { e.stopPropagation(); setSelectedCatForProps(cat); }}
            />
          </Tooltip>
          <Popconfirm
            title="Bu kategoriyani o'chirmoqchimisiz?"
            onConfirm={() => deleteMutation.mutate(cat.id)}
            okText="Ha"
            cancelText="Yo'q"
          >
            <Tooltip title="O'chirish">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
            </Tooltip>
          </Popconfirm>
          <Tooltip title="Ichiga kirish">
            <Button
              type="text"
              size="small"
              icon={<RightOutlined />}
              onClick={(e) => { e.stopPropagation(); handleDrill(cat); }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f5f5f5" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "#fff", borderBottom: "1px solid #f0f0f0", flexWrap: "wrap", gap: 8 }}>
        <Space>
          {history.length > 0 && (
            <Button size="small" icon={<ArrowLeftOutlined />} onClick={handleBack}>Orqaga</Button>
          )}
          <Title level={5} style={{ margin: 0 }}>Kategoriyalar</Title>
          <Tag color="default">{categoryList.length} ta</Tag>
        </Space>
        <Space>
          <Button icon={<UploadOutlined />} onClick={() => setIsBulkModalOpen(true)}>Excel yuklash</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>Yangi kategoriya</Button>
        </Space>
      </div>

      <div style={{ padding: "6px 16px", background: "#fff", borderBottom: "1px solid #f0f0f0" }}>
        <Breadcrumb
          items={[
            {
              title: (
                <span
                  style={{ cursor: "pointer", color: "#1677ff" }}
                  onClick={() => { setSelectedId(null); setHistory([]); setSelectedCatForProps(null); }}
                >
                  Barcha kategoriyalar
                </span>
              ),
            },
            ...breadcrumb.map((c, i) => ({
              title: i === breadcrumb.length - 1
                ? <Text strong style={{ fontSize: 12 }}>{c.name}</Text>
                : (
                  <span
                    style={{ cursor: "pointer", color: "#1677ff", fontSize: 12 }}
                    onClick={() => {
                      const newHistory = breadcrumb.slice(0, i).map((b) => b.id);
                      newHistory.unshift(null);
                      setHistory(newHistory);
                      setSelectedId(c.id);
                      setSelectedCatForProps(null);
                    }}
                  >
                    {c.name}
                  </span>
                ),
            })),
          ]}
        />
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", }}>

        <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column",  }}>
          <Table
            size="small"
            loading={isLoading}
            dataSource={categoryList}
            columns={columns}
            rowKey="id"
            pagination={false}
            onRow={(cat) => ({
              onClick: () => setSelectedCatForProps(cat),
              style: {
                background: selectedCatForProps?.id === cat.id ? "#e6f4ff" : undefined,
                cursor: "pointer",
                transition: "background 0.15s",
              },
            })}
            style={{ flex: 1 }}
            scroll={{ y: "calc(100vh - 200px)" }}
            footer={() => (
              isAddingInline ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0" }}>
                  <Input
                    autoFocus
                    size="small"
                    value={inlineName}
                    placeholder="Kategoriya nomini kiriting... (Enter — saqlash, Esc — bekor)"
                    onChange={(e) => setInlineName(e.target.value)}
                    onPressEnter={handleInlineAdd}
                    onKeyDown={(e) => { if (e.key === "Escape") { setIsAddingInline(false); setInlineName(""); } }}
                    style={{ flex: 1 }}
                  />
                  <Button size="small" type="primary" icon={<CheckOutlined />} onClick={handleInlineAdd} loading={createMutation.isPending} />
                  <Button size="small" icon={<CloseOutlined />} onClick={() => { setIsAddingInline(false); setInlineName(""); }} />
                </div>
              ) : (
                <Button
                  type="link"
                  size="small"
                  icon={<PlusOutlined />}
                  style={{ color: "#1677ff", padding: 0, fontSize: 12 }}
                  onClick={() => setIsAddingInline(true)}
                >
                  Yangi kategoriya qo'shish
                </Button>
              )
            )}
          />
        </div>

        <div style={{ width: 300, height: "430px", borderLeft: "1px solid #f0f0f0", background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {selectedCatForProps ? (
            <>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid #f0f0f0", background: "#fafafa" }}>
                <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Xususiyatlar</Text>
                <div><Text strong>{selectedCatForProps.name}</Text></div>
              </div>

              <div style={{ flex: 1, overflowY: "auto" }}>
                {(!properties || properties.length === 0) && !propsLoading && (
                  <div style={{ padding: "24px 16px", textAlign: "center", color: "#bbb", fontSize: 12 }}>
                    Hali xususiyat yo'q
                  </div>
                )}
                {properties?.map((prop) => {
                  const info = typeInfo(prop.type);
                  return (
                    <div
                      key={prop.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        padding: "8px 14px",
                        borderBottom: "1px solid #f5f5f5",
                        transition: "background 0.15s",
                      }}
                      className="prop-row"
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {inlinePropEditId === prop.id ? (
                          <Input
                            autoFocus
                            size="small"
                            value={inlinePropEditName}
                            onChange={(e) => setInlinePropEditName(e.target.value)}
                            onPressEnter={() => handlePropInlineEditSave(prop)}
                            onBlur={() => handlePropInlineEditSave(prop)}
                            onKeyDown={(e) => { if (e.key === "Escape") setInlinePropEditId(null); }}
                          />
                        ) : (
                          <div onDoubleClick={() => handlePropDoubleClick(prop)} style={{ cursor: "text" }}>
                            <Text style={{ fontSize: 13 }}>{prop.name}</Text>
                            <Text type="secondary" style={{ fontSize: 10, display: "block" }}>(2x bosing — tahrirlash)</Text>
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
                          <Tag color={info?.color} style={{ fontSize: 10, padding: "0 4px", lineHeight: "16px" }}>{info?.short}</Tag>
                          {prop.options?.length > 0 && (
                            <Text type="secondary" style={{ fontSize: 10 }}>
                              {prop.options.slice(0, 3).join(", ")}{prop.options.length > 3 ? "..." : ""}
                            </Text>
                          )}
                        </div>
                      </div>
                      <Space size={2}>
                        <Tooltip title="Tahrirlash">
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handlePropDoubleClick(prop)}
                          />
                        </Tooltip>
                        <Popconfirm
                          title="O'chirasizmi?"
                          onConfirm={() => deletePropertyMutation.mutate(prop.id)}
                          okText="Ha"
                          cancelText="Yo'q"
                        >
                          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Space>
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: "1px solid #f0f0f0", padding: "10px 14px", background: "#fafafa" }}>
                {isAddingPropInline ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <Input
                      autoFocus
                      size="small"
                      placeholder="Xususiyat nomi..."
                      value={inlinePropData.name}
                      onChange={(e) => setInlinePropData((p) => ({ ...p, name: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Escape") { setIsAddingPropInline(false); setInlinePropData(initProperty); } }}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                      {PROPERTY_TYPES.map((t) => (
                        <button
                          key={t.value}
                          onClick={() => setInlinePropData((p) => ({ ...p, type: t.value, options: [], optionInput: "" }))}
                          style={{
                            fontSize: 11,
                            padding: "4px 6px",
                            borderRadius: 4,
                            border: "1px solid",
                            cursor: "pointer",
                            textAlign: "left",
                            background: inlinePropData.type === t.value ? "#1677ff" : "#fff",
                            borderColor: inlinePropData.type === t.value ? "#1677ff" : "#d9d9d9",
                            color: inlinePropData.type === t.value ? "#fff" : "#555",
                            transition: "all 0.15s",
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{t.short}</span>
                          <span style={{ display: "block", fontSize: 10, opacity: 0.75 }}>{t.label}</span>
                        </button>
                      ))}
                    </div>

                    {inlinePropData.type === "SELECT" && (
                      <div>
                        <div style={{ display: "flex", gap: 4 }}>
                          <Input
                            size="small"
                            placeholder="Variant... Enter"
                            value={inlinePropData.optionInput}
                            onChange={(e) => setInlinePropData((p) => ({ ...p, optionInput: e.target.value }))}
                            onPressEnter={() => {
                              const v = inlinePropData.optionInput.trim();
                              if (!v || inlinePropData.options.includes(v)) return;
                              setInlinePropData((p) => ({ ...p, options: [...p.options, v], optionInput: "" }));
                            }}
                          />
                          <Button
                            size="small"
                            onClick={() => {
                              const v = inlinePropData.optionInput.trim();
                              if (!v || inlinePropData.options.includes(v)) return;
                              setInlinePropData((p) => ({ ...p, options: [...p.options, v], optionInput: "" }));
                            }}
                          >+</Button>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                          {inlinePropData.options.map((o, i) => (
                            <Tag
                              key={i}
                              closable
                              onClose={() => setInlinePropData((p) => ({ ...p, options: p.options.filter((_, idx) => idx !== i) }))}
                              style={{ fontSize: 10 }}
                            >
                              {o}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 6 }}>
                      <Button size="small" type="primary" icon={<CheckOutlined />} loading={createPropertyMutation.isPending} onClick={handleAddPropInline} style={{ flex: 1 }}>
                        Qo'shish
                      </Button>
                      <Button size="small" icon={<CloseOutlined />} onClick={() => { setIsAddingPropInline(false); setInlinePropData(initProperty); }} />
                    </div>
                  </div>
                ) : (
                  <Button
                    type="link"
                    size="small"
                    icon={<PlusOutlined />}
                    style={{ color: "#1677ff", padding: 0, fontSize: 12 }}
                    onClick={() => setIsAddingPropInline(true)}
                  >
                    Yangi xususiyat qo'shish
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#bbb", padding: "0 24px", textAlign: "center" }}>
              <SettingOutlined style={{ fontSize: 32 }} />
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Kategoriya tanlang</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>Jadvaldan kategoriya ustiga bosing va unga xususiyatlar qo'shing</Text>
            </div>
          )}
        </div>
      </div>


      <Modal
        title="Yangi kategoriya"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onOk={() => {
          if (!categoryData.name.trim()) { message.warning("Nomini kiriting!"); return; }
          createMutation.mutate({ ...categoryData, parentId: categoryData.parentId || selectedId });
        }}
        confirmLoading={createMutation.isPending || isUploading}
        okText="Qo'shish"
        cancelText="Bekor"
        width={480}
      >
        <Form layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item label="Nomi *">
            <Input
              value={categoryData.name}
              onChange={(e) => setCategoryData({ ...categoryData, name: e.target.value })}
              placeholder="Masalan: Elektronika"
            />
          </Form.Item>
          <Form.Item label="Yuqori kategoriya">
            <Select
              style={{ width: "100%" }}
              allowClear
              placeholder="— Asosiy kategoriya —"
              value={categoryData.parentId}
              onChange={(v) => setCategoryData({ ...categoryData, parentId: v ?? null })}
              options={(allCategories || []).map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item label="Tartib (order)">
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              value={categoryData.order}
              onChange={(v) => setCategoryData({ ...categoryData, order: v ?? 0 })}
            />
          </Form.Item>
          <Form.Item label="Rasm yuklash">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "create"); }}
            />
            {categoryData.imageUrl && (
              <img src={categoryData.imageUrl} alt="preview" style={{ marginTop: 8, width: 64, height: 64, objectFit: "cover", borderRadius: 4, border: "1px solid #f0f0f0" }} />
            )}
          </Form.Item>
          <Form.Item label="Ko'rinishi">
            <Switch checked={categoryData.isVisible} onChange={(v) => setCategoryData({ ...categoryData, isVisible: v })} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Kategoriyani tahrirlash"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={() => {
          if (!editingCategory) return;
          updateMutation.mutate({ id: currentEditId, ...editingCategory });
        }}
        confirmLoading={updateMutation.isPending || isUploading}
        okText="Saqlash"
        cancelText="Bekor"
        width={480}
      >
        {editingCategory && (
          <Form layout="vertical" style={{ marginTop: 8 }}>
            <Form.Item label="Nomi">
              <Input
                value={editingCategory.name}
                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="Yuqori kategoriya">
              <Select
                style={{ width: "100%" }}
                allowClear
                placeholder="— Asosiy —"
                value={editingCategory.parentId ?? undefined}
                onChange={(v) => setEditingCategory({ ...editingCategory, parentId: v ?? null })}
                options={(allCategories || []).filter((c) => c.id !== editingCategory.id).map((c) => ({ value: c.id, label: c.name }))}
              />
            </Form.Item>
            <Form.Item label="Tartib">
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                value={editingCategory.order}
                onChange={(v) => setEditingCategory({ ...editingCategory, order: v ?? 0 })}
              />
            </Form.Item>
            <Form.Item label="Rasm o'zgartirish">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "edit"); }}
              />
              {editingCategory.imageUrl && (
                <img src={editingCategory.imageUrl} alt="preview" style={{ marginTop: 8, width: 64, height: 64, objectFit: "cover", borderRadius: 4, border: "1px solid #f0f0f0" }} />
              )}
            </Form.Item>
            <Form.Item label="Ko'rinishi">
              <Switch checked={editingCategory.isVisible} onChange={(v) => setEditingCategory({ ...editingCategory, isVisible: v })} />
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title="Excel orqali import (.xlsx, .csv)"
        open={isBulkModalOpen}
        onCancel={() => { setIsBulkModalOpen(false); setBulkFile(null); }}
        onOk={() => {
          if (!bulkFile) { message.warning("Avval faylni tanlang!"); return; }
          bulkMutation.mutate(bulkFile);
        }}
        confirmLoading={bulkMutation.isPending}
        okText="Yuklash"
        cancelText="Bekor"
      >
        <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: "100%",
              border: "2px dashed #d9d9d9",
              borderRadius: 8,
              padding: 32,
              textAlign: "center",
              cursor: "pointer",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "#1677ff"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "#d9d9d9"}
          >
            <InboxOutlined style={{ fontSize: 36, color: "#bbb", marginBottom: 8, display: "block", marginLeft: "auto", marginRight: "auto" }} />
            <input
              type="file"
              accept=".xlsx,.csv"
              onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
              style={{ fontSize: 13 }}
            />
            {bulkFile && <Text type="success" style={{ display: "block", marginTop: 8 }}>{bulkFile.name}</Text>}
          </div>
          <Text type="secondary" style={{ fontSize: 12, textAlign: "center" }}>
            Excel ustunlari: <Text code>name</Text>, <Text code>imageUrl</Text>, <Text code>isVisible</Text>, <Text code>parentId</Text>
          </Text>
        </div>
      </Modal>

      <style>{`
        .prop-row:hover { background: #fafafa; }
      `}</style>
    </div>
  );
};

export default CategoryPage;