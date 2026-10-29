import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isArray } from "lodash";
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Tag,
  Space,
  InputNumber,
  Row,
  Col,
  Tabs,
  Tooltip,
  Card,
  Spin,
  Alert,
} from "antd";
import {
  Sliders,
  Plus,
  Edit3,
  Trash2,
  Layers,
  CheckCircle2,
  XCircle,
  Tag as TagIcon,
  CreditCard,
  DollarSign,
  Gift,
  RefreshCw,
  FolderTree,
  Globe,
  Sparkles,
  Info,
  HelpCircle,
} from "lucide-react";
import api from "../config/auth/api";
import { CompactStatCard } from "../components/CompactStatCard";
import AppTable from "../components/Table";

export default function ProductParameters() {
  const queryClient = useQueryClient();

  // Active Tab: 'conditions' | 'payments'
  const [activeTab, setActiveTab] = useState("conditions");

  // Modals state
  const [isCondModalOpen, setIsCondModalOpen] = useState(false);
  const [editingCond, setEditingCond] = useState(null);
  const [condForm] = Form.useForm();

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [editingPay, setEditingPay] = useState(null);
  const [payForm] = Form.useForm();

  // 1. Fetch system settings
  const { data: rawSettings = {}, isLoading: isSettingsLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await api.get("/settings");
      return res.data;
    },
  });

  const settings = rawSettings?.content || rawSettings || {};
  const conditions = useMemo(() => {
    return isArray(settings.product_conditions) ? settings.product_conditions : [];
  }, [settings.product_conditions]);

  const paymentTypes = useMemo(() => {
    return isArray(settings.product_payment_types) ? settings.product_payment_types : [];
  }, [settings.product_payment_types]);

  // 2. Fetch categories for category binding
  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["allCategories"],
    queryFn: async () => (await api.get("/category")).data,
  });

  const rawCategories = useMemo(() => {
    const raw = categoriesData?.content || categoriesData || [];
    return isArray(raw) ? raw : [];
  }, [categoriesData]);

  // Flattened categories with hierarchy name (e.g. "Avtomobillar > Yengil mashinalar")
  const { categoryOptions, categoryMap } = useMemo(() => {
    const map = {};
    const options = [];

    const traverse = (cats, prefix = "") => {
      cats.forEach((cat) => {
        const fullName = prefix ? `${prefix} › ${cat.name}` : cat.name;
        map[cat.id] = fullName;
        options.push({
          value: Number(cat.id),
          label: fullName,
          rawName: cat.name,
        });
        if (cat.children && cat.children.length > 0) {
          traverse(cat.children, fullName);
        }
      });
    };

    traverse(rawCategories);
    return { categoryOptions: options, categoryMap: map };
  }, [rawCategories]);

  // 3. Mutation for updating settings
  const updateSettingsMutation = useMutation({
    mutationFn: async ({ payload, reason }) => {
      const res = await api.put("/settings", {
        settings: payload,
        reason: reason || "Mahsulot parametrlari yangilandi",
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      message.success("Sozlamalar muvaffaqiyatli saqlandi!");
    },
    onError: (err) => {
      message.error(err.response?.data?.message || "Xatolik yuz berdi");
    },
  });

  // -------------------------------------------------------------
  // CONDITIONS HANDLERS
  // -------------------------------------------------------------
  const handleOpenAddCond = () => {
    setEditingCond(null);
    condForm.resetFields();
    condForm.setFieldsValue({
      order: conditions.length + 1,
      isActive: true,
      categoryIds: [],
    });
    setIsCondModalOpen(true);
  };

  const handleOpenEditCond = (record) => {
    setEditingCond(record);
    condForm.setFieldsValue({
      label: record.label,
      labelRu: record.labelRu || "",
      order: record.order ?? 1,
      isActive: record.isActive !== false,
      categoryIds: record.categoryIds ? record.categoryIds.map(Number) : [],
    });
    setIsCondModalOpen(true);
  };

  const handleToggleCondActive = (record) => {
    const updated = conditions.map((item) =>
      item.id === record.id ? { ...item, isActive: !item.isActive } : item
    );
    updateSettingsMutation.mutate({
      payload: { product_conditions: updated },
      reason: `Mahsulot holati '${record.label}' faolligi o'zgartirildi`,
    });
  };

  const handleDeleteCond = (record) => {
    const updated = conditions.filter((item) => item.id !== record.id);
    updateSettingsMutation.mutate({
      payload: { product_conditions: updated },
      reason: `Mahsulot holati '${record.label}' o'chirildi`,
    });
  };

  const handleSaveCond = async () => {
    try {
      const values = await condForm.validateFields();
      let updated;
      if (editingCond) {
        updated = conditions.map((item) =>
          item.id === editingCond.id
            ? {
                ...item,
                label: values.label.trim(),
                labelRu: values.labelRu?.trim() || values.label.trim(),
                order: Number(values.order) || 1,
                isActive: Boolean(values.isActive),
                categoryIds: values.categoryIds || [],
              }
            : item
        );
      } else {
        const newId =
          values.label
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "_")
            .slice(0, 20) + "_" + Date.now().toString().slice(-4);
        const newItem = {
          id: newId,
          label: values.label.trim(),
          labelRu: values.labelRu?.trim() || values.label.trim(),
          order: Number(values.order) || conditions.length + 1,
          isActive: Boolean(values.isActive),
          categoryIds: values.categoryIds || [],
        };
        updated = [...conditions, newItem];
      }

      updateSettingsMutation.mutate({
        payload: { product_conditions: updated },
        reason: editingCond
          ? `Mahsulot holati '${values.label}' tahrirlandi`
          : `Yangi mahsulot holati '${values.label}' qo'shildi`,
      });

      setIsCondModalOpen(false);
      condForm.resetFields();
    } catch (e) {
      // validation failed
    }
  };

  // -------------------------------------------------------------
  // PAYMENT TYPES HANDLERS
  // -------------------------------------------------------------
  const handleOpenAddPay = () => {
    setEditingPay(null);
    payForm.resetFields();
    payForm.setFieldsValue({
      order: paymentTypes.length + 1,
      isActive: true,
      requiresPrice: true,
      categoryIds: [],
    });
    setIsPayModalOpen(true);
  };

  const handleOpenEditPay = (record) => {
    setEditingPay(record);
    payForm.setFieldsValue({
      label: record.label,
      labelRu: record.labelRu || "",
      requiresPrice: Boolean(record.requiresPrice),
      order: record.order ?? 1,
      isActive: record.isActive !== false,
      categoryIds: record.categoryIds ? record.categoryIds.map(Number) : [],
    });
    setIsPayModalOpen(true);
  };

  const handleTogglePayActive = (record) => {
    const updated = paymentTypes.map((item) =>
      item.id === record.id ? { ...item, isActive: !item.isActive } : item
    );
    updateSettingsMutation.mutate({
      payload: { product_payment_types: updated },
      reason: `To'lov turi '${record.label}' faolligi o'zgartirildi`,
    });
  };

  const handleDeletePay = (record) => {
    const updated = paymentTypes.filter((item) => item.id !== record.id);
    updateSettingsMutation.mutate({
      payload: { product_payment_types: updated },
      reason: `To'lov turi '${record.label}' o'chirildi`,
    });
  };

  const handleSavePay = async () => {
    try {
      const values = await payForm.validateFields();
      let updated;
      if (editingPay) {
        updated = paymentTypes.map((item) =>
          item.id === editingPay.id
            ? {
                ...item,
                label: values.label.trim(),
                labelRu: values.labelRu?.trim() || values.label.trim(),
                requiresPrice: Boolean(values.requiresPrice),
                order: Number(values.order) || 1,
                isActive: Boolean(values.isActive),
                categoryIds: values.categoryIds || [],
              }
            : item
        );
      } else {
        const newId =
          values.label
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "_")
            .slice(0, 20) + "_" + Date.now().toString().slice(-4);
        const newItem = {
          id: newId,
          label: values.label.trim(),
          labelRu: values.labelRu?.trim() || values.label.trim(),
          requiresPrice: Boolean(values.requiresPrice),
          order: Number(values.order) || paymentTypes.length + 1,
          isActive: Boolean(values.isActive),
          categoryIds: values.categoryIds || [],
        };
        updated = [...paymentTypes, newItem];
      }

      updateSettingsMutation.mutate({
        payload: { product_payment_types: updated },
        reason: editingPay
          ? `To'lov turi '${values.label}' tahrirlandi`
          : `Yangi to'lov turi '${values.label}' qo'shildi`,
      });

      setIsPayModalOpen(false);
      payForm.resetFields();
    } catch (e) {
      // validation failed
    }
  };

  // -------------------------------------------------------------
  // TABLE COLUMNS
  // -------------------------------------------------------------
  const conditionColumns = [
    {
      title: "№",
      dataIndex: "order",
      key: "order",
      width: 60,
      render: (val) => <span className="font-mono text-xs text-slate-500 font-bold">{val}</span>,
    },
    {
      title: "Holat Nomi (O'zbekcha)",
      dataIndex: "label",
      key: "label",
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 text-sm">{text}</span>
          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
            {record.id}
          </span>
        </div>
      ),
    },
    {
      title: "Nomi (Ruscha)",
      dataIndex: "labelRu",
      key: "labelRu",
      render: (text) => <span className="text-slate-600 text-xs">{text || "—"}</span>,
    },
    {
      title: "Bog'langan Kategoriyalar",
      dataIndex: "categoryIds",
      key: "categoryIds",
      render: (ids) => {
        if (!ids || ids.length === 0) {
          return (
            <Tag color="blue" className="rounded-md font-semibold text-xs inline-flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Barcha kategoriyalar (Umumiy)
            </Tag>
          );
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-md">
            {ids.map((cId) => (
              <Tag color="purple" key={cId} className="rounded-md font-medium text-xs">
                {categoryMap[cId] || `Kategoriya #${cId}`}
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: "Holati",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (isActive, record) => (
        <Switch
          size="small"
          checked={isActive !== false}
          loading={updateSettingsMutation.isPending}
          onChange={() => handleToggleCondActive(record)}
        />
      ),
    },
    {
      title: "Amallar",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Tahrirlash">
            <Button
              type="text"
              size="small"
              icon={<Edit3 className="w-3.5 h-3.5 text-blue-600" />}
              onClick={() => handleOpenEditCond(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Ushbu holatni o'chirishga ishonchingiz komilmi?"
            description="Bu holat yangi e'lonlar variantlaridan o'chiriladi."
            okText="Ha, o'chirish"
            cancelText="Yo'q"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeleteCond(record)}
          >
            <Tooltip title="O'chirish">
              <Button
                type="text"
                size="small"
                danger
                icon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const paymentColumns = [
    {
      title: "№",
      dataIndex: "order",
      key: "order",
      width: 60,
      render: (val) => <span className="font-mono text-xs text-slate-500 font-bold">{val}</span>,
    },
    {
      title: "To'lov / Kelishuv Turi",
      dataIndex: "label",
      key: "label",
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 text-sm">{text}</span>
          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
            {record.id}
          </span>
        </div>
      ),
    },
    {
      title: "Nomi (Ruscha)",
      dataIndex: "labelRu",
      key: "labelRu",
      render: (text) => <span className="text-slate-600 text-xs">{text || "—"}</span>,
    },
    {
      title: "Narx Talabi",
      dataIndex: "requiresPrice",
      key: "requiresPrice",
      render: (requiresPrice) =>
        requiresPrice ? (
          <Tag color="green" className="rounded-md font-semibold text-xs inline-flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            Narx kiritilishi shart
          </Tag>
        ) : (
          <Tag color="orange" className="rounded-md font-semibold text-xs inline-flex items-center gap-1">
            <Gift className="w-3 h-3" />
            Narxsiz (Tekin / Almashtirish)
          </Tag>
        ),
    },
    {
      title: "Bog'langan Kategoriyalar",
      dataIndex: "categoryIds",
      key: "categoryIds",
      render: (ids) => {
        if (!ids || ids.length === 0) {
          return (
            <Tag color="blue" className="rounded-md font-semibold text-xs inline-flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Barcha kategoriyalar (Umumiy)
            </Tag>
          );
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-md">
            {ids.map((cId) => (
              <Tag color="purple" key={cId} className="rounded-md font-medium text-xs">
                {categoryMap[cId] || `Kategoriya #${cId}`}
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: "Holati",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (isActive, record) => (
        <Switch
          size="small"
          checked={isActive !== false}
          loading={updateSettingsMutation.isPending}
          onChange={() => handleTogglePayActive(record)}
        />
      ),
    },
    {
      title: "Amallar",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Tahrirlash">
            <Button
              type="text"
              size="small"
              icon={<Edit3 className="w-3.5 h-3.5 text-blue-600" />}
              onClick={() => handleOpenEditPay(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Ushbu to'lov turini o'chirishga ishonchingiz komilmi?"
            description="Bu tur yangi e'lonlar variantlaridan o'chiriladi."
            okText="Ha, o'chirish"
            cancelText="Yo'q"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeletePay(record)}
          >
            <Tooltip title="O'chirish">
              <Button
                type="text"
                size="small"
                danger
                icon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // -------------------------------------------------------------
  // STATS
  // -------------------------------------------------------------
  const activeCondsCount = conditions.filter((c) => c.isActive !== false).length;
  const activePaysCount = paymentTypes.filter((p) => p.isActive !== false).length;
  const categorySpecificCount = [...conditions, ...paymentTypes].filter(
    (x) => x.categoryIds && x.categoryIds.length > 0
  ).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Mahsulot Parametrlari
            </h1>
            <Tag color="purple" className="rounded-full px-2.5 py-0.5 text-xs font-bold">
              Kategoriya Bog'lovchi
            </Tag>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            E'lon berishda ko'rinadigan mahsulot holatlari (Yangi, Ishlatilgan...) va to'lov turlarini
            (Pullik, Tekin, Almashtirish...) boshqarish va istalgan kategoriyaga biriktirish.
          </p>
        </div>

        <Button
          icon={<RefreshCw className="w-4 h-4" />}
          loading={isSettingsLoading}
          onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-settings"] })}
          className="rounded-xl text-xs font-semibold"
        >
          Yangilash
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CompactStatCard
          icon={TagIcon}
          label="Mahsulot Holatlari"
          value={`${activeCondsCount} / ${conditions.length}`}
          subtext="Faol holatlar / Jami"
          color="indigo"
        />
        <CompactStatCard
          icon={CreditCard}
          label="To'lov & Kelishuv Turlari"
          value={`${activePaysCount} / ${paymentTypes.length}`}
          subtext="Faol turlar / Jami"
          color="emerald"
        />
        <CompactStatCard
          icon={Layers}
          label="Kategoriyaga Biriktirilgan"
          value={categorySpecificCount}
          subtext="Maxsus kategoriyali parametrlar"
          color="purple"
        />
      </div>

      {/* Info Notice */}
      <Alert
        message="Dinamik Ierarxik Boshqaruv Qoidasi"
        description="Agar biror holat yoki to'lov turiga kategoriya tanlanmasa, u platformadagi barcha kategoriyalar uchun umumiy bo'lib xizmat qiladi. Agar bir yoki bir nechta kategoriya tanlansa, faqat o'sha kategoriya va uning ichki subkategoriyalari tanlangandagina ko'rinadi."
        type="info"
        showIcon
        icon={<Info className="w-4 h-4 text-blue-600" />}
        className="rounded-2xl border-blue-100 bg-blue-50/60"
      />

      {/* Main Tabs Container */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarExtraContent={
            activeTab === "conditions" ? (
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={handleOpenAddCond}
                className="!bg-[#6345ED] hover:!bg-[#5235dc] text-white font-bold !rounded-xl text-xs"
              >
                Yangi Holat Qo'shish
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={handleOpenAddPay}
                className="!bg-[#6345ED] hover:!bg-[#5235dc] text-white font-bold !rounded-xl text-xs"
              >
                Yangi To'lov Turi Qo'shish
              </Button>
            )
          }
          items={[
            {
              key: "conditions",
              label: (
                <span className="flex items-center gap-2 font-bold text-sm px-1">
                  <TagIcon className="w-4 h-4 text-indigo-600" />
                  Mahsulot Holatlari (Condition)
                  <Tag color="purple" className="rounded-full font-bold ml-1">
                    {conditions.length}
                  </Tag>
                </span>
              ),
              children: (
                <div className="pt-2">
                  <AppTable
                    dataSource={conditions}
                    columnDefs={conditionColumns}
                    rowKey="id"
                    isLoading={isSettingsLoading}
                  />
                </div>
              ),
            },
            {
              key: "payments",
              label: (
                <span className="flex items-center gap-2 font-bold text-sm px-1">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  To'lov Turlari (Payment Type)
                  <Tag color="green" className="rounded-full font-bold ml-1">
                    {paymentTypes.length}
                  </Tag>
                </span>
              ),
              children: (
                <div className="pt-2">
                  <AppTable
                    dataSource={paymentTypes}
                    columnDefs={paymentColumns}
                    rowKey="id"
                    isLoading={isSettingsLoading}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CONDITION ADD / EDIT */}
      {/* ------------------------------------------------------------- */}
      <Modal
        title={
          <div className="flex items-center gap-2 font-black text-base text-slate-900 pb-2 border-b border-slate-100">
            <TagIcon className="w-5 h-5 text-indigo-600" />
            <span>{editingCond ? "Mahsulot Holatini Tahrirlash" : "Yangi Mahsulot Holati Qo'shish"}</span>
          </div>
        }
        open={isCondModalOpen}
        onOk={handleSaveCond}
        onCancel={() => setIsCondModalOpen(false)}
        confirmLoading={updateSettingsMutation.isPending}
        okText="Saqlash"
        cancelText="Bekor qilish"
        okButtonProps={{ className: "!bg-[#6345ED] !rounded-xl font-bold" }}
        cancelButtonProps={{ className: "!rounded-xl font-semibold" }}
        width={560}
      >
        <Form form={condForm} layout="vertical" className="pt-4 space-y-3">
          <Form.Item
            label="Holat Nomi (O'zbekcha)"
            name="label"
            rules={[{ required: true, message: "Holat nomini kiriting" }]}
          >
            <Input placeholder="Masalan: Yangi, Ishlatilgan, Ta'mirlangan, Kraskasi toza" className="rounded-xl" />
          </Form.Item>

          <Form.Item
            label="Holat Nomi (Ruscha - ixtiyoriy)"
            name="labelRu"
          >
            <Input placeholder="Masalan: Новый, Б/у, Восстановленный" className="rounded-xl" />
          </Form.Item>

          <Form.Item
            label={
              <span className="flex items-center gap-1.5">
                <span>Bog'lanadigan Kategoriyalar</span>
                <Tooltip title="Agar tanlanmasa, barcha kategoriyalarda ko'rinadi. Bir yoki bir nechta kategoriya tanlansa, faqat o'sha bo'limlarda aks etadi.">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                </Tooltip>
              </span>
            }
            name="categoryIds"
          >
            <Select
              mode="multiple"
              placeholder="🌐 Barcha kategoriyalar (Umumiy)"
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={categoryOptions}
              className="w-full rounded-xl"
              maxTagCount="responsive"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Tartib Raqami (Order)" name="order">
                <InputNumber min={1} max={999} className="w-full rounded-xl" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Faollik Holati" name="isActive" valuePropName="checked">
                <Switch checkedChildren="Faol" unCheckedChildren="Nofaol" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: PAYMENT TYPE ADD / EDIT */}
      {/* ------------------------------------------------------------- */}
      <Modal
        title={
          <div className="flex items-center gap-2 font-black text-base text-slate-900 pb-2 border-b border-slate-100">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <span>{editingPay ? "To'lov Turini Tahrirlash" : "Yangi To'lov Turi Qo'shish"}</span>
          </div>
        }
        open={isPayModalOpen}
        onOk={handleSavePay}
        onCancel={() => setIsPayModalOpen(false)}
        confirmLoading={updateSettingsMutation.isPending}
        okText="Saqlash"
        cancelText="Bekor qilish"
        okButtonProps={{ className: "!bg-[#6345ED] !rounded-xl font-bold" }}
        cancelButtonProps={{ className: "!rounded-xl font-semibold" }}
        width={560}
      >
        <Form form={payForm} layout="vertical" className="pt-4 space-y-3">
          <Form.Item
            label="To'lov / Kelishuv Turi Nomi (O'zbekcha)"
            name="label"
            rules={[{ required: true, message: "To'lov turi nomini kiriting" }]}
          >
            <Input placeholder="Masalan: Pullik, Tekin, Almashtirish, Bo'lib to'lash" className="rounded-xl" />
          </Form.Item>

          <Form.Item
            label="Nomi (Ruscha - ixtiyoriy)"
            name="labelRu"
          >
            <Input placeholder="Masalan: Платный, Бесплатно, Обмен" className="rounded-xl" />
          </Form.Item>

          <Form.Item
            label="Narx kiritilishi shartmi? (Requires Price)"
            name="requiresPrice"
            valuePropName="checked"
            extra="Agar yoqilsa, e'lon beruvchidan narx kiritish talab etiladi. O'chirilsa (masalan Tekin yoki Almashtirish), narx kiritish majburiy bo'lmaydi."
          >
            <Switch checkedChildren="Narx shart" unCheckedChildren="Narxsiz (0 so'm)" />
          </Form.Item>

          <Form.Item
            label={
              <span className="flex items-center gap-1.5">
                <span>Bog'lanadigan Kategoriyalar</span>
                <Tooltip title="Agar tanlanmasa, barcha kategoriyalarda ko'rinadi. Tanlansa, faqat tanlangan kategoriyalar va ularning subkategoriyalarida aks etadi.">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                </Tooltip>
              </span>
            }
            name="categoryIds"
          >
            <Select
              mode="multiple"
              placeholder="🌐 Barcha kategoriyalar (Umumiy)"
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={categoryOptions}
              className="w-full rounded-xl"
              maxTagCount="responsive"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Tartib Raqami (Order)" name="order">
                <InputNumber min={1} max={999} className="w-full rounded-xl" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Faollik Holati" name="isActive" valuePropName="checked">
                <Switch checkedChildren="Faol" unCheckedChildren="Nofaol" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
