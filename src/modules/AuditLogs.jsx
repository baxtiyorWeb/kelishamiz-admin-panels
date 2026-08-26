import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../config/auth/api';
import { Table, Tag, Input, Card, Space } from 'antd';
import { HistoryOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const AuditLogs = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const { data, isLoading } = useQuery({
    queryKey: ['adminAuditLogs', page, pageSize, search],
    queryFn: async () => {
      const res = await api.get('/admin/audit-logs', {
        params: { page, limit: pageSize, search },
      });
      return res.data?.content || res.data;
    },
  });

  const columns = [
    {
      title: 'Vaqt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: 'Admin',
      key: 'admin',
      render: (_, record) => (
        <span style={{ fontWeight: 'bold' }}>
          {record.admin ? `@${record.admin.username}` : `Admin #${record.adminId}`}
        </span>
      ),
    },
    {
      title: 'Amal (Action)',
      dataIndex: 'action',
      key: 'action',
      render: (action) => (
        <Tag color="purple" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
          {action}
        </Tag>
      ),
    },
    {
      title: 'Nishon (Target)',
      key: 'target',
      render: (_, record) => (
        <span>
          <Tag color="cyan">{record.targetType || 'SYSTEM'}</Tag>
          <span style={{ fontFamily: 'monospace' }}>#{record.targetId || '-'}</span>
        </span>
      ),
    },
    {
      title: 'Batafsil / Metadata',
      dataIndex: 'details',
      key: 'details',
      render: (details) =>
        details ? (
          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#595959' }}>
            {JSON.stringify(details)}
          </span>
        ) : (
          <span style={{ color: '#bfbfbf' }}>-</span>
        ),
    },
  ];

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📋 Tizim Xavfsizlik va Audit Tarixi (Immutable Operations Log)</span>
          <Input.Search
            placeholder="Amal yoki target bo‘yicha qidirish..."
            allowClear
            onSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
            style={{ width: 320 }}
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

export default AuditLogs;
