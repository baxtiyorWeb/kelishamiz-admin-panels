import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, message, Tag, Space, Typography } from 'antd';
import { SafetyCertificateOutlined, EditOutlined, GlobalOutlined, FileTextOutlined } from '@ant-design/icons';
import api from '../config/auth/api';

const { Title, Paragraph } = Typography;
const { Option } = Select;

const SecurityPolicies = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/security/admin/documents');
      const data = res.data?.content || res.data || [];
      setDocuments(data);
    } catch (err) {
      message.error('Hujjatlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleEdit = (doc) => {
    setEditingDoc(doc);
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
      await api.put(`/security/admin/documents/${editingDoc.id}`, values);
      message.success('Hujjat muvaffaqiyatli yangilandi');
      setEditModalVisible(false);
      fetchDocuments();
    } catch (err) {
      message.error('Hujjatni yangilashda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Hujjat Turi',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'privacy' ? 'purple' : 'blue'}>
          {type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
        </Tag>
      ),
    },
    {
      title: 'Til',
      dataIndex: 'language',
      key: 'language',
      render: (lang) => (
        <Tag icon={<GlobalOutlined />} color={lang === 'uz' ? 'green' : lang === 'ru' ? 'orange' : 'cyan'}>
          {lang === 'uz' ? "O'zbekcha (UZ)" : lang === 'ru' ? 'Русский (RU)' : 'English (EN)'}
        </Tag>
      ),
    },
    {
      title: 'Sarlavha',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <strong style={{ color: '#1890ff' }}>{text}</strong>,
    },
    {
      title: 'Oxirgi yangilanish',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date) => (date ? new Date(date).toLocaleString() : '-'),
    },
    {
      title: 'Amallar',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EditOutlined />}
          size="small"
          onClick={() => handleEdit(record)}
        >
          Tahrirlash
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card variant="borderless">
        <Title level={3} style={{ margin: 0 }}>
          <SafetyCertificateOutlined style={{ color: '#722ed1', marginRight: 10 }} />
          Platforma Xavfsizlik va Huquqiy Hujjatlari Boshqaruvi (3 Tilda)
        </Title>
        <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
          Ushbu modul orqali Mobil ilova va Veb-saytdagi Maxfiylik Siyosati hamda Foydalanish Shartlari matnlarini 3 tilda (O'zbek, Rus va Ingliz) tahrirlashingiz mumkin.
        </Paragraph>
      </Card>

      <Card variant="borderless">
        <Table
          dataSource={documents}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title={
          <span>
            <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Hujjatni Tahrirlash
          </span>
        }
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="title" label="Sarlavha" rules={[{ required: true, message: 'Sarlavhani kiriting' }]}>
            <Input placeholder="Hujjat sarlavhasi..." />
          </Form.Item>

          <Space size="large" style={{ display: 'flex', width: '100%', marginBottom: 16 }}>
            <Form.Item name="type" label="Hujjat Turi" style={{ flex: 1, margin: 0 }}>
              <Select disabled>
                <Option value="privacy">Privacy Policy</Option>
                <Option value="terms">Terms of Service</Option>
              </Select>
            </Form.Item>

            <Form.Item name="language" label="Til" style={{ flex: 1, margin: 0 }}>
              <Select disabled>
                <Option value="uz">O'zbekcha (UZ)</Option>
                <Option value="ru">Русский (RU)</Option>
                <Option value="en">English (EN)</Option>
              </Select>
            </Form.Item>
          </Space>

          <Form.Item
            name="content"
            label="Hujjat Matni (Content)"
            rules={[{ required: true, message: 'Matnni kiriting' }]}
          >
            <Input.TextArea rows={12} placeholder="Hujjat matni..." />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <Button onClick={() => setEditModalVisible(false)}>Bekor qilish</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Saqlash va E'lon qilish
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SecurityPolicies;
