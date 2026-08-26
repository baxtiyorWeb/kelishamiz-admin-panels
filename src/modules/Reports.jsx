import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../config/auth/api';
import {
  Table,
  Button,
  Tag,
  Space,
  Card,
  Modal,
  Input,
  Select,
  message,
  Tabs,
} from 'antd';
import {
  AlertOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const Reports = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [targetStatus, setTargetStatus] = useState('RESOLVED');
  const [notes, setNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['adminReports', page, pageSize, statusFilter],
    queryFn: async () => {
      const res = await api.get('/admin/reports', {
        params: { page, limit: pageSize, status: statusFilter },
      });
      return res.data;
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, status, resolutionNotes }) => {
      return (
        await api.post(`/admin/reports/${id}/resolve`, {
          status,
          resolutionNotes,
        })
      ).data;
    },
    onSuccess: () => {
      message.success('Shikoyat ko‘rib chiqildi va statusi yangilandi');
      setResolveModalVisible(false);
      setSelectedReport(null);
      setNotes('');
      queryClient.invalidateQueries(['adminReports']);
    },
    onError: () => {
      message.error('Shikoyatni yangilashda xatolik yuz berdi');
    },
  });

  const openResolveModal = (report, st) => {
    setSelectedReport(report);
    setTargetStatus(st);
    setNotes(st === 'RESOLVED' ? 'Chora ko‘rildi va qoidabuzarlik bartaraf etildi.' : 'Asossiz shikoyat sifatida rad etildi.');
    setResolveModalVisible(true);
  };

  const columns = [
    {
      title: 'Nishon (Target)',
      key: 'target',
      render: (_, record) => (
        <div>
          <Tag color="volcano">{record.targetType}</Tag>
          <span style={{ fontWeight: 'bold' }}>ID #{record.targetId}</span>
          <div style={{ fontSize: '11px', color: '#8c8c8c', marginTop: 2 }}>
            {dayjs(record.createdAt).format('YYYY-MM-DD HH:mm')}
          </div>
        </div>
      ),
    },
    {
      title: 'Sabab & Tavsif',
      key: 'reason',
      render: (_, record) => (
        <div>
          <Tag color="magenta">{record.reason}</Tag>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#595959', marginTop: 4 }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Yuboruvchi',
      key: 'reporter',
      render: (_, record) => {
        if (!record.reporter) return <span>User #{record.reporterId || 'Anonim'}</span>;
        const { username, phone, id } = record.reporter;
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 'bold' }}>{username}</span>
            <span style={{ color: '#8c8c8c', fontSize: '12px' }}>{phone || 'Tel kiritilmagan'}</span>
            <span style={{ color: '#bfbfbf', fontSize: '11px' }}>ID #{id}</span>
          </div>
        );
      },
    },
    {
      title: 'Holat',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'PENDING') color = 'warning';
        if (status === 'RESOLVED') color = 'success';
        if (status === 'REJECTED') color = 'error';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Xulosa & Izoh',
      dataIndex: 'resolutionNotes',
      key: 'resolutionNotes',
      render: (text) => text || <span style={{ color: '#bfbfbf' }}>-</span>,
    },
    {
      title: 'Amallar',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'PENDING' ? (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => openResolveModal(record, 'RESOLVED')}
              >
                Qanoatlantirish
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => openResolveModal(record, 'REJECTED')}
              >
                Rad etish
              </Button>
            </>
          ) : (
            <Tag color="default">Yopilgan</Tag>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🚨 Moderatsiya va Foydalanuvchilar Shikoyatlari Markazi</span>
        </div>
      }
      variant="borderless"
    >
      <Tabs
        activeKey={statusFilter}
        onChange={(key) => {
          setStatusFilter(key);
          setPage(1);
        }}
        items={[
          { key: '', label: 'Barcha Shikoyatlar' },
          { key: 'PENDING', label: 'Kutilayotgan (Pending)' },
          { key: 'RESOLVED', label: 'Hal qilingan (Resolved)' },
          { key: 'REJECTED', label: 'Rad etilgan (Rejected)' },
        ]}
      />

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

      <Modal
        title={`Shikoyatni yakunlash (ID #${selectedReport?.id})`}
        open={resolveModalVisible}
        onCancel={() => setResolveModalVisible(false)}
        onOk={() => {
          if (!selectedReport) return;
          resolveMutation.mutate({
            id: selectedReport.id,
            status: targetStatus,
            resolutionNotes: notes,
          });
        }}
        confirmLoading={resolveMutation.isPending}
        okText="Tasdiqlash"
        cancelText="Bekor qilish"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <div>
            <label style={{ fontWeight: 'bold' }}>Yakuniy Xulosa Statusi:</label>
            <Select
              value={targetStatus}
              onChange={setTargetStatus}
              style={{ width: '100%', marginTop: 4 }}
              options={[
                { value: 'RESOLVED', label: 'RESOLVED (Chora ko‘rildi)' },
                { value: 'REJECTED', label: 'REJECTED (Shikoyat asossiz)' },
              ]}
            />
          </div>

          <div>
            <label style={{ fontWeight: 'bold' }}>Audit & Rezolyutsiya Izohi:</label>
            <Input.TextArea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Qabul qilingan qaror sababini yozing..."
              style={{ marginTop: 4 }}
            />
          </div>
        </div>
      </Modal>
    </Card>
  );
};

export default Reports;
