import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../config/auth/api';
import {
  Table,
  Button,
  Tag,
  Input,
  Space,
  Card,
  Avatar,
  message,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  ShopOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  PhoneOutlined,
} from '@ant-design/icons';

const Shops = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['adminShops', page, pageSize, search],
    queryFn: async () => {
      const res = await api.get('/admin/shops', {
        params: { page, limit: pageSize, search },
      });
      return res.data;
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (id) => {
      return (await api.post(`/admin/shops/${id}/verify`)).data;
    },
    onSuccess: () => {
      message.success('Do‘kon verification holati muvaffaqiyatli yangilandi');
      queryClient.invalidateQueries(['adminShops']);
    },
    onError: () => {
      message.error('Do‘konni tasdiqlashda xatolik yuz berdi');
    },
  });

  const columns = [
    {
      title: 'Do‘kon',
      key: 'shop',
      render: (_, record) => (
        <Space>
          <Avatar
            size={44}
            src={record.logoUrl}
            icon={<ShopOutlined />}
            style={{ backgroundColor: '#1890ff' }}
          />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
              {record.name}{' '}
              {record.isVerified && (
                <Tag color="blue" style={{ marginLeft: 4 }}>
                  VERIFIED
                </Tag>
              )}
            </div>
            <div style={{ color: '#8c8c8c', fontSize: '12px' }}>
              @{record.username} • ID #{record.id}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Telefon',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => (
        <Space>
          <PhoneOutlined style={{ color: '#52c41a' }} />
          <span style={{ fontFamily: 'monospace' }}>{phone}</span>
        </Space>
      ),
    },
    {
      title: 'Egasi',
      key: 'user',
      render: (_, record) => (
        <span>
          {record.user ? `@${record.user.username} (ID #${record.user.id})` : `User #${record.userId}`}
        </span>
      ),
    },
    {
      title: 'Kategoriya',
      key: 'category',
      render: (_, record) => (
        <Tag color="purple">{record.category?.nameUz || record.category?.name || 'Umumiy'}</Tag>
      ),
    },
    {
      title: 'Holat',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.isVerified ? 'success' : 'default'}>
          {record.isVerified ? 'Tasdiqlangan Biznes' : 'Oddiy Do‘kon'}
        </Tag>
      ),
    },
    {
      title: 'Amallar',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type={record.isVerified ? 'default' : 'primary'}
            size="small"
            icon={record.isVerified ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
            loading={verifyMutation.isPending}
            onClick={() => verifyMutation.mutate(record.id)}
          >
            {record.isVerified ? 'Bekor qilish' : 'Tasdiqlash'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🏪 Do‘konlar va Savdo nuqtalari Boshqaruvi</span>
          <Input.Search
            placeholder="Do‘kon nomi yoki username qidirish..."
            allowClear
            onSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
            style={{ width: 300 }}
          />
        </div>
      }
      variant="borderless"
    >
      <Table
        columns={columns}
        dataSource={data?.data || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: data?.total || 0,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
          showSizeChanger: true,
        }}
      />
    </Card>
  );
};

export default Shops;
