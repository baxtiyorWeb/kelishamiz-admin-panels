import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  Tooltip,
  Avatar,
  Descriptions,
  Switch,
  Divider,
  Radio,
  Row,
  Col,
  Alert,
} from 'antd';
import {
  AlertOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  UserOutlined,
  ShopOutlined,
  TagsOutlined,
  MessageOutlined,
  CommentOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  LinkOutlined,
  SendOutlined,
  StopOutlined,
  SafetyCertificateOutlined,
  ExclamationCircleOutlined,
  NotificationOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const STATUS_CONFIG = {
  PENDING: {
    color: 'warning',
    icon: <ClockCircleOutlined />,
    label: 'Kutilmoqda (Pending)',
  },
  REVIEWING: {
    color: 'processing',
    icon: <SyncOutlined spin />,
    label: 'Ko‘rib chiqilmoqda',
  },
  RESOLVED: {
    color: 'success',
    icon: <CheckCircleOutlined />,
    label: 'Hal qilingan (Resolved)',
  },
  REJECTED: {
    color: 'error',
    icon: <CloseCircleOutlined />,
    label: 'Rad etilgan (Rejected)',
  },
};

const PRIORITY_CONFIG = {
  CRITICAL: { color: '#ff4d4f', label: 'CRITICAL' },
  HIGH: { color: '#fa8c16', label: 'HIGH' },
  NORMAL: { color: '#1890ff', label: 'NORMAL' },
  LOW: { color: '#8c8c8c', label: 'LOW' },
};

const RESOLUTION_TEMPLATES = [
  'Chora ko‘rildi va qoidabuzarlik bartaraf etildi.',
  'Foydalanuvchi ogohlantirildi va qoidalar eslatildi.',
  'Qoidabuzar e‘lon yoki akkaunt bloklandi.',
  'Asossiz shikoyat sifatida rad etildi.',
  'Spam yoki takroriy shikoyat.',
];

const Reports = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [moderationModalVisible, setModerationModalVisible] = useState(false);

  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedUserForAction, setSelectedUserForAction] = useState(null);

  // Resolve form states
  const [targetStatus, setTargetStatus] = useState('RESOLVED');
  const [notes, setNotes] = useState('');
  const [notifyReporter, setNotifyReporter] = useState(true);
  const [reporterMessage, setReporterMessage] = useState('');
  const [notifyTarget, setNotifyTarget] = useState(false);
  const [targetMessage, setTargetMessage] = useState('');
  const [targetModerationAction, setTargetModerationAction] = useState('NONE');
  const [moderationDurationHours, setModerationDurationHours] = useState(24);
  const [moderationReason, setModerationReason] = useState('');

  // Direct Message Modal states
  const [directMessageUserId, setDirectMessageUserId] = useState(null);
  const [directMessageUserName, setDirectMessageUserName] = useState('');
  const [directMessageTitle, setDirectMessageTitle] = useState('Kelishamiz.uz Xabarnomasi');
  const [directMessageBody, setDirectMessageBody] = useState('');

  // Standalone Moderation Modal states
  const [modIsBlocked, setModIsBlocked] = useState(false);
  const [modBlockDuration, setModBlockDuration] = useState('24h');
  const [modBanReason, setModBanReason] = useState('');
  const [modIsSpam, setModIsSpam] = useState(false);
  const [modSpamDuration, setModSpamDuration] = useState('24h');
  const [modSpamReason, setModSpamReason] = useState('');
  const [modSendNotification, setModSendNotification] = useState(true);
  const [modNotificationMessage, setModNotificationMessage] = useState('');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['adminReports', page, pageSize, statusFilter],
    queryFn: async () => {
      const res = await api.get('/admin/reports', {
        params: {
          page,
          limit: pageSize,
          ...(statusFilter ? { status: statusFilter } : {}),
        },
      });
      return res.data?.content || res.data;
    },
  });

  const rawReports = useMemo(() => {
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.content?.data)) return data.content.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  const totalReports = data?.total || data?.content?.total || rawReports.length;

  const filteredReports = useMemo(() => {
    return rawReports.filter((report) => {
      if (targetTypeFilter && report.targetType !== targetTypeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const reason = (report.reason || '').toLowerCase();
        const desc = (report.description || '').toLowerCase();
        const reporterName = (report.reporter?.username || '').toLowerCase();
        const reporterPhone = (report.reporter?.phone || '').toLowerCase();
        const targetId = String(report.targetId || '').toLowerCase();
        const notesText = (report.resolutionNotes || '').toLowerCase();

        return (
          reason.includes(q) ||
          desc.includes(q) ||
          reporterName.includes(q) ||
          reporterPhone.includes(q) ||
          targetId.includes(q) ||
          notesText.includes(q)
        );
      }
      return true;
    });
  }, [rawReports, targetTypeFilter, searchQuery]);

  // Mutation: Resolve Report
  const resolveMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post(`/admin/reports/${payload.id}/resolve`, payload);
      return res.data;
    },
    onSuccess: () => {
      message.success('Shikoyat ko‘rib chiqildi va xabarnomalar yuborildi!');
      setResolveModalVisible(false);
      setDetailModalVisible(false);
      setSelectedReport(null);
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      const errorMsg = err?.response?.data?.message || 'Shikoyatni yangilashda xatolik yuz berdi';
      message.error(errorMsg);
    },
  });

  // Mutation: Send Direct Message
  const directMessageMutation = useMutation({
    mutationFn: async ({ userId, title, message: msgText }) => {
      const res = await api.post('/admin/reports/send-message', {
        userId,
        title,
        message: msgText,
      });
      return res.data;
    },
    onSuccess: () => {
      message.success('Foydalanuvchiga xabarnoma muvaffaqiyatli yuborildi!');
      setMessageModalVisible(false);
      setDirectMessageBody('');
    },
    onError: (err) => {
      const errorMsg = err?.response?.data?.message || 'Xabarnomani yuborishda xatolik yuz berdi';
      message.error(errorMsg);
    },
  });

  // Mutation: User Moderation (Block/Spam)
  const userModerationMutation = useMutation({
    mutationFn: async ({ userId, payload }) => {
      const res = await api.patch(`/admin/users/${userId}/moderation`, payload);
      return res.data;
    },
    onSuccess: () => {
      message.success('Foydalanuvchi intizomiy holati yangilandi!');
      setModerationModalVisible(false);
      setSelectedUserForAction(null);
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      const errorMsg = err?.response?.data?.message || 'Foydalanuvchi holatini yangilashda xatolik yuz berdi';
      message.error(errorMsg);
    },
  });

  const openResolveModal = (report, st) => {
    setSelectedReport(report);
    setTargetStatus(st);

    const defaultNotes =
      st === 'RESOLVED'
        ? 'Chora ko‘rildi va qoidabuzarlik bartaraf etildi.'
        : st === 'REJECTED'
        ? 'Asossiz shikoyat sifatida rad etildi.'
        : 'Moderator ko‘rib chiqishni boshladi.';
    setNotes(report.resolutionNotes || defaultNotes);

    setNotifyReporter(true);
    setReporterMessage(
      st === 'RESOLVED'
        ? `Sizning #${report.id}-raqamli shikoyatingiz ko‘rib chiqildi va zarur choralar ko‘rildi. Kelishamiz.uz platformasi xavfsizligini ta'minlashda yordamingiz uchun rahmat!`
        : `Sizning #${report.id}-raqamli shikoyatingiz ko‘rib chiqildi va asoslar yetarli bo'lmagani sababli rad etildi.`,
    );

    const isUserTarget = report.targetType === 'USER' || report.targetType === 'CHAT_USER';
    setNotifyTarget(isUserTarget && st === 'RESOLVED');
    setTargetMessage(
      'Sizning profilingiz yuzasidan foydalanuvchilar tomonidan shikoyat kelib tushdi. Iltimos, xizmat ko‘rsatish va xavfsizlik qoidalariga amal qiling.',
    );

    setTargetModerationAction('NONE');
    setModerationDurationHours(24);
    setModerationReason(defaultNotes);

    setResolveModalVisible(true);
  };

  const openDetailModal = (report) => {
    setSelectedReport(report);
    setDetailModalVisible(true);
  };

  const openDirectMessageModal = (userId, userName, defaultText = '') => {
    setDirectMessageUserId(userId);
    setDirectMessageUserName(userName || `Foydalanuvchi #${userId}`);
    setDirectMessageTitle('Kelishamiz.uz Xabarnomasi');
    setDirectMessageBody(defaultText);
    setMessageModalVisible(true);
  };

  const openUserModerationModal = (userId, userName, currentBlocked = false, currentSpam = false) => {
    setSelectedUserForAction({ id: userId, username: userName });
    setModIsBlocked(currentBlocked);
    setModBlockDuration('24h');
    setModBanReason('');
    setModIsSpam(currentSpam);
    setModSpamDuration('24h');
    setModSpamReason('');
    setModSendNotification(true);
    setModNotificationMessage('Hisobingiz bo‘yicha moderatsiya cheklovi o‘rnatildi.');
    setModerationModalVisible(true);
  };

  const handleResolveSubmit = () => {
    if (!selectedReport) return;

    let targetUserId = undefined;
    if (selectedReport.targetType === 'USER' || selectedReport.targetType === 'CHAT_USER') {
      const parsed = Number(selectedReport.targetId);
      if (!isNaN(parsed) && parsed > 0) {
        targetUserId = parsed;
      }
    }

    resolveMutation.mutate({
      id: selectedReport.id,
      status: targetStatus,
      resolutionNotes: notes,
      notifyReporter,
      reporterMessage,
      notifyTarget,
      targetUserId,
      targetMessage,
      targetModeration: {
        action: targetModerationAction,
        durationHours: moderationDurationHours,
        reason: moderationReason || notes,
      },
    });
  };

  const handleModerationSubmit = () => {
    if (!selectedUserForAction?.id) return;

    let blockedUntil = null;
    if (modIsBlocked) {
      if (modBlockDuration === '24h') blockedUntil = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      else if (modBlockDuration === '3d') blockedUntil = new Date(Date.now() + 72 * 3600 * 1000).toISOString();
      else if (modBlockDuration === '7d') blockedUntil = new Date(Date.now() + 168 * 3600 * 1000).toISOString();
      else if (modBlockDuration === '30d') blockedUntil = new Date(Date.now() + 720 * 3600 * 1000).toISOString();
      else if (modBlockDuration === 'permanent') blockedUntil = null;
    }

    let spamUntil = null;
    if (modIsSpam) {
      if (modSpamDuration === '24h') spamUntil = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      else if (modSpamDuration === '7d') spamUntil = new Date(Date.now() + 168 * 3600 * 1000).toISOString();
      else if (modSpamDuration === 'permanent') spamUntil = null;
    }

    userModerationMutation.mutate({
      userId: selectedUserForAction.id,
      payload: {
        isBlocked: modIsBlocked,
        blockedUntil,
        banReason: modBanReason || (modIsBlocked ? 'Qoidabuzarlik sababli' : null),
        isSpam: modIsSpam,
        spamUntil,
        spamReason: modSpamReason || (modIsSpam ? 'Spam tarqatish' : null),
        sendNotification: modSendNotification,
        notificationMessage: modNotificationMessage,
      },
    });
  };

  const renderTargetTag = (targetType, targetId) => {
    let icon = <AlertOutlined />;
    let color = 'default';
    let linkPath = null;
    const isUser = targetType === 'CHAT_USER' || targetType === 'USER';

    switch (targetType) {
      case 'CHAT_USER':
      case 'USER':
        icon = <UserOutlined />;
        color = 'purple';
        linkPath = `/users/${targetId}`;
        break;
      case 'PRODUCT':
      case 'LISTING':
        icon = <TagsOutlined />;
        color = 'blue';
        linkPath = '/products';
        break;
      case 'SHOP':
        icon = <ShopOutlined />;
        color = 'gold';
        linkPath = '/shops';
        break;
      case 'MESSAGE':
        icon = <MessageOutlined />;
        color = 'cyan';
        break;
      case 'COMMENT':
        icon = <CommentOutlined />;
        color = 'magenta';
        break;
      default:
        color = 'volcano';
    }

    return (
      <div>
        <Tag color={color} icon={icon} style={{ fontWeight: 600 }}>
          {targetType}
        </Tag>
        <span style={{ fontWeight: 'bold', fontSize: '13px', marginLeft: 4 }}>
          ID #{targetId}
        </span>
        <Space size={2} style={{ marginLeft: 6 }}>
          {linkPath && (
            <Button
              type="link"
              size="small"
              icon={<LinkOutlined />}
              style={{ padding: '0 4px', fontSize: '12px' }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(linkPath);
              }}
            >
              Ochish
            </Button>
          )}
          {isUser && (
            <Button
              type="link"
              size="small"
              icon={<SendOutlined />}
              style={{ padding: '0 4px', fontSize: '12px', color: '#722ed1' }}
              onClick={(e) => {
                e.stopPropagation();
                openDirectMessageModal(targetId, `Foydalanuvchi #${targetId}`);
              }}
            >
              Xabar
            </Button>
          )}
        </Space>
      </div>
    );
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 65,
      render: (id) => <span style={{ fontWeight: 'bold', color: '#595959' }}>#{id}</span>,
    },
    {
      title: 'Nishon (Target)',
      key: 'target',
      width: 230,
      render: (_, record) => (
        <div>
          {renderTargetTag(record.targetType, record.targetId)}
          <div style={{ fontSize: '11px', color: '#8c8c8c', marginTop: 4 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {dayjs(record.createdAt).format('YYYY-MM-DD HH:mm')}
          </div>
        </div>
      ),
    },
    {
      title: 'Sabab & Tavsif',
      key: 'reason',
      render: (_, record) => {
        const priorityCfg = PRIORITY_CONFIG[record.priority] || PRIORITY_CONFIG.NORMAL;
        return (
          <div>
            <Space size={4} wrap>
              <Tag color={priorityCfg.color} style={{ fontWeight: 'bold', fontSize: '11px' }}>
                {priorityCfg.label}
              </Tag>
              <Tag color="magenta" style={{ fontWeight: 'bold' }}>
                {record.reason}
              </Tag>
            </Space>
            {record.description ? (
              <div
                style={{
                  fontSize: '12px',
                  color: '#434343',
                  marginTop: 6,
                  background: '#f9f9f9',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #f0f0f0',
                  maxWidth: 320,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {record.description}
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: '#bfbfbf', marginTop: 4, fontStyle: 'italic' }}>
                Qo‘shimcha tavsif berilmagan
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Yuboruvchi',
      key: 'reporter',
      width: 210,
      render: (_, record) => {
        if (!record.reporter) {
          return (
            <Space>
              <Avatar size="small" icon={<UserOutlined />} />
              <span style={{ color: '#8c8c8c' }}>User #{record.reporterId || 'Anonim'}</span>
            </Space>
          );
        }
        const { username, phone, id, role } = record.reporter;
        return (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <Avatar size="small" style={{ backgroundColor: '#722ed1', marginTop: 2 }}>
              {username ? username[0].toUpperCase() : 'U'}
            </Avatar>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{ fontWeight: 'bold', cursor: 'pointer', color: '#1890ff' }}
                  onClick={() => navigate(`/users/${id}`)}
                >
                  {username || 'Nomsiz'}
                </span>
                <Tooltip title="Shikoyatchiga to‘g‘ridan-to‘g‘ri xabar yuborish">
                  <Button
                    type="text"
                    size="small"
                    icon={<SendOutlined style={{ fontSize: '11px', color: '#52c41a' }} />}
                    style={{ padding: 0, height: 18, width: 18 }}
                    onClick={() => openDirectMessageModal(id, username)}
                  />
                </Tooltip>
              </div>
              <span style={{ color: '#595959', fontSize: '12px' }}>
                {phone || 'Tel kiritilmagan'}
              </span>
              <Space size={4} style={{ marginTop: 2 }}>
                <span style={{ color: '#8c8c8c', fontSize: '11px' }}>ID #{id}</span>
                {role && <Tag color="blue" style={{ fontSize: '10px', padding: '0 4px', lineHeight: '16px' }}>{role}</Tag>}
              </Space>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Holat',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status) => {
        const cfg = STATUS_CONFIG[status] || {
          color: 'default',
          icon: null,
          label: status,
        };
        return (
          <Tag color={cfg.color} icon={cfg.icon} style={{ fontWeight: 600, padding: '3px 8px' }}>
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: 'Xulosa & Moderator',
      key: 'resolution',
      render: (_, record) => {
        if (!record.resolutionNotes && !record.resolvedBy) {
          return <span style={{ color: '#bfbfbf', fontSize: '12px' }}>—</span>;
        }
        return (
          <div>
            {record.resolutionNotes && (
              <div style={{ fontSize: '12px', color: '#262626', fontWeight: 500 }}>
                {record.resolutionNotes}
              </div>
            )}
            {record.resolvedBy && (
              <div style={{ fontSize: '11px', color: '#8c8c8c', marginTop: 2 }}>
                Moderator:{' '}
                <Tag color="geekblue" style={{ fontSize: '11px', padding: '0 4px' }}>
                  @{record.resolvedBy.username || record.resolvedBy.phone || `Admin #${record.resolvedById}`}
                </Tag>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Amallar',
      key: 'actions',
      width: 200,
      render: (_, record) => {
        const isUserTarget = record.targetType === 'USER' || record.targetType === 'CHAT_USER';
        return (
          <Space size={4} wrap>
            <Tooltip title="Batafsil ma'lumot va audit">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => openDetailModal(record)}
              >
                Batafsil
              </Button>
            </Tooltip>

            {isUserTarget && (
              <Tooltip title="Nishon foydalanuvchini bloklash / spamga tushirish">
                <Button
                  size="small"
                  danger
                  icon={<StopOutlined />}
                  onClick={() => openUserModerationModal(record.targetId, `Foydalanuvchi #${record.targetId}`)}
                >
                  Jazo
                </Button>
              </Tooltip>
            )}

            {record.status === 'PENDING' || record.status === 'REVIEWING' ? (
              <Tooltip title="Shikoyatni ko‘rib chiqish va yakunlash">
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                  onClick={() => openResolveModal(record, 'RESOLVED')}
                >
                  Ko‘rib chiqish
                </Button>
              </Tooltip>
            ) : (
              <Button
                size="small"
                onClick={() => openResolveModal(record, record.status)}
              >
                Qayta tahrirlash
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <Space>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                🚨 Moderatsiya va Foydalanuvchilar Shikoyatlari Markazi
              </span>
            </Space>
            <Space>
              <Button
                icon={<ReloadOutlined spin={isFetching} />}
                onClick={() => refetch()}
              >
                Yangilash
              </Button>
            </Space>
          </div>
        }
        variant="borderless"
      >
        {/* Filter Controls Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <Tabs
            activeKey={statusFilter}
            onChange={(key) => {
              setStatusFilter(key);
              setPage(1);
            }}
            style={{ marginBottom: 0 }}
            items={[
              { key: '', label: `Barcha Shikoyatlar` },
              {
                key: 'PENDING',
                label: (
                  <span>
                    Kutilayotgan <Tag color="warning" style={{ marginLeft: 4 }}>PENDING</Tag>
                  </span>
                ),
              },
              {
                key: 'REVIEWING',
                label: (
                  <span>
                    Ko‘rib chiqilmoqda <Tag color="processing" style={{ marginLeft: 4 }}>REVIEWING</Tag>
                  </span>
                ),
              },
              {
                key: 'RESOLVED',
                label: (
                  <span>
                    Hal qilingan <Tag color="success" style={{ marginLeft: 4 }}>RESOLVED</Tag>
                  </span>
                ),
              },
              {
                key: 'REJECTED',
                label: (
                  <span>
                    Rad etilgan <Tag color="error" style={{ marginLeft: 4 }}>REJECTED</Tag>
                  </span>
                ),
              },
            ]}
          />

          <Space wrap>
            <Select
              placeholder="Nishon turi (Target Type)"
              allowClear
              value={targetTypeFilter || undefined}
              onChange={(val) => setTargetTypeFilter(val || '')}
              style={{ width: 170 }}
            >
              <Option value="CHAT_USER">CHAT_USER</Option>
              <Option value="USER">USER</Option>
              <Option value="PRODUCT">PRODUCT / E'lon</Option>
              <Option value="SHOP">SHOP / Do'kon</Option>
              <Option value="COMMENT">COMMENT</Option>
              <Option value="MESSAGE">MESSAGE</Option>
            </Select>

            <Input.Search
              placeholder="Sabab, tavsif, foydalanuvchi..."
              allowClear
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 260 }}
            />
          </Space>
        </div>

        {/* Reports Table */}
        <Table
          columns={columns}
          dataSource={filteredReports}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize,
            total: totalReports,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showSizeChanger: true,
            showTotal: (total) => `Jami ${total} ta shikoyat`,
          }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <Space>
            <AlertOutlined style={{ color: '#ff4d4f' }} />
            <span>Shikoyat Tafsilotlari va Moderatsiya (ID #{selectedReport?.id})</span>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={750}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Yopish
          </Button>,
          selectedReport && (selectedReport.targetType === 'USER' || selectedReport.targetType === 'CHAT_USER') && (
            <Button
              key="ban"
              danger
              icon={<StopOutlined />}
              onClick={() => {
                setDetailModalVisible(false);
                openUserModerationModal(selectedReport.targetId, `Foydalanuvchi #${selectedReport.targetId}`);
              }}
            >
              Nishonni Bloklash / Spam
            </Button>
          ),
          selectedReport && (
            <Button
              key="action"
              type="primary"
              icon={<CheckCircleOutlined />}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              onClick={() => {
                setDetailModalVisible(false);
                openResolveModal(selectedReport, 'RESOLVED');
              }}
            >
              Ko‘rib Chiqish & Xulosa
            </Button>
          ),
        ]}
      >
        {selectedReport && (
          <div style={{ marginTop: 16 }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Shikoyat ID">
                <span style={{ fontWeight: 'bold' }}>#{selectedReport.id}</span>
              </Descriptions.Item>

              <Descriptions.Item label="Holat">
                {(() => {
                  const cfg = STATUS_CONFIG[selectedReport.status] || {
                    color: 'default',
                    icon: null,
                    label: selectedReport.status,
                  };
                  return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>;
                })()}
              </Descriptions.Item>

              <Descriptions.Item label="Muhimlik darajasi (Priority)">
                {(() => {
                  const pCfg = PRIORITY_CONFIG[selectedReport.priority] || PRIORITY_CONFIG.NORMAL;
                  return <Tag color={pCfg.color}>{pCfg.label}</Tag>;
                })()}
              </Descriptions.Item>

              <Descriptions.Item label="Shikoyat qilingan nishon">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {renderTargetTag(selectedReport.targetType, selectedReport.targetId)}
                  {(selectedReport.targetType === 'USER' || selectedReport.targetType === 'CHAT_USER') && (
                    <Button
                      size="small"
                      icon={<SendOutlined />}
                      onClick={() => {
                        setDetailModalVisible(false);
                        openDirectMessageModal(selectedReport.targetId, `Foydalanuvchi #${selectedReport.targetId}`);
                      }}
                    >
                      Nishonga xabar yozish
                    </Button>
                  )}
                </div>
              </Descriptions.Item>

              <Descriptions.Item label="Shikoyat Sababi">
                <Tag color="magenta" style={{ fontWeight: 'bold' }}>{selectedReport.reason}</Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Foydalanuvchi Tavsifi">
                <div style={{ whiteSpace: 'pre-wrap', color: '#262626' }}>
                  {selectedReport.description || <span style={{ color: '#bfbfbf' }}>Tavsif qoldirilmagan</span>}
                </div>
              </Descriptions.Item>

              <Descriptions.Item label="Shikoyat Yuboruvchi">
                {selectedReport.reporter ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 'bold' }}>
                        {selectedReport.reporter.username || 'Nomsiz'} (ID #{selectedReport.reporter.id})
                      </div>
                      <Button
                        size="small"
                        icon={<SendOutlined />}
                        onClick={() => {
                          setDetailModalVisible(false);
                          openDirectMessageModal(selectedReport.reporter.id, selectedReport.reporter.username);
                        }}
                      >
                        Shikoyatchiga xabar yozish
                      </Button>
                    </div>
                    <div style={{ color: '#595959' }}>
                      Tel: {selectedReport.reporter.phone || 'Kiritilmagan'}
                    </div>
                    <div style={{ color: '#8c8c8c', fontSize: '12px' }}>
                      Roli: {selectedReport.reporter.role} | Balans: {selectedReport.reporter.balance || 0} so'm
                    </div>
                    <Button
                      type="link"
                      size="small"
                      style={{ padding: 0, marginTop: 4 }}
                      onClick={() => {
                        setDetailModalVisible(false);
                        navigate(`/users/${selectedReport.reporter.id}`);
                      }}
                    >
                      Foydalanuvchi profiliga o‘tish →
                    </Button>
                  </div>
                ) : (
                  <span>User #{selectedReport.reporterId || 'Anonim'}</span>
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Yaratilgan Vaqt">
                {dayjs(selectedReport.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>

              {selectedReport.resolutionNotes && (
                <Descriptions.Item label="Moderatsiya Xulosasi">
                  <div style={{ fontWeight: 500, color: '#1890ff' }}>
                    {selectedReport.resolutionNotes}
                  </div>
                </Descriptions.Item>
              )}

              {selectedReport.resolvedBy && (
                <Descriptions.Item label="Ko‘rib chiqqan Moderator">
                  <Tag color="geekblue">
                    @{selectedReport.resolvedBy.username || selectedReport.resolvedBy.phone || `Admin #${selectedReport.resolvedById}`}
                  </Tag>
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* Comprehensive Resolve / Action Modal */}
      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#1890ff' }} />
            <span>Shikoyatni Ko‘rib Chiqish va Xabarnomalar Yuborish (ID #{selectedReport?.id})</span>
          </Space>
        }
        open={resolveModalVisible}
        onCancel={() => setResolveModalVisible(false)}
        onOk={handleResolveSubmit}
        confirmLoading={resolveMutation.isPending}
        okText="Tasdiqlash va Amalga Oshirish"
        cancelText="Bekor qilish"
        width={720}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
          {/* 1. Status Selection */}
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>
              1. Yakuniy Qaror Statusi:
            </label>
            <Select
              value={targetStatus}
              onChange={(val) => {
                setTargetStatus(val);
                if (val === 'RESOLVED') {
                  setReporterMessage(
                    `Sizning #${selectedReport?.id}-raqamli shikoyatingiz ko‘rib chiqildi va zarur choralar ko‘rildi. Kelishamiz.uz xavfsizligiga qo'shgan hissangiz uchun rahmat!`,
                  );
                } else if (val === 'REJECTED') {
                  setReporterMessage(
                    `Sizning #${selectedReport?.id}-raqamli shikoyatingiz ko‘rib chiqildi va dalillar yetarli bo'lmagani sababli rad etildi.`,
                  );
                }
              }}
              style={{ width: '100%' }}
              options={[
                {
                  value: 'RESOLVED',
                  label: 'RESOLVED — Qanoatlantirildi (Chora ko‘rildi)',
                },
                {
                  value: 'REJECTED',
                  label: 'REJECTED — Rad etildi (Shikoyat asossiz)',
                },
                {
                  value: 'REVIEWING',
                  label: 'REVIEWING — Jarayonda (Ko‘rib chiqilmoqda)',
                },
              ]}
            />
          </div>

          {/* 2. Quick Templates and Resolution Notes */}
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>
              2. Moderator Audit va Rezolyutsiya Izohi:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {RESOLUTION_TEMPLATES.map((tmpl, idx) => (
                <Tag
                  key={idx}
                  color="blue"
                  style={{ cursor: 'pointer', padding: '3px 8px' }}
                  onClick={() => setNotes(tmpl)}
                >
                  + {tmpl}
                </Tag>
              ))}
            </div>
            <TextArea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Qabul qilingan qaror sababini yozing..."
            />
          </div>

          <Divider style={{ margin: '4px 0' }} />

          {/* 3. Notify Reporter Section */}
          <div style={{ background: '#f6ffed', padding: 12, borderRadius: 8, border: '1px solid #b7eb8f' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Space>
                <NotificationOutlined style={{ color: '#52c41a' }} />
                <span style={{ fontWeight: 'bold', color: '#237804' }}>
                  Shikoyat yuborgan foydalanuvchiga (Reporter) xabarnoma yuborish
                </span>
              </Space>
              <Switch checked={notifyReporter} onChange={setNotifyReporter} />
            </div>
            {notifyReporter && (
              <TextArea
                rows={2}
                value={reporterMessage}
                onChange={(e) => setReporterMessage(e.target.value)}
                placeholder="Shikoyatchiga boradigan bildirishnoma matni..."
                style={{ marginTop: 6 }}
              />
            )}
          </div>

          {/* 4. Notify Target User Section */}
          <div style={{ background: '#fffbe6', padding: 12, borderRadius: 8, border: '1px solid #ffe58f' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Space>
                <AlertOutlined style={{ color: '#fa8c16' }} />
                <span style={{ fontWeight: 'bold', color: '#ad6800' }}>
                  Shikoyat qilingan foydalanuvchiga (Nishon) ogohlantirish yuborish
                </span>
              </Space>
              <Switch checked={notifyTarget} onChange={setNotifyTarget} />
            </div>
            {notifyTarget && (
              <TextArea
                rows={2}
                value={targetMessage}
                onChange={(e) => setTargetMessage(e.target.value)}
                placeholder="Qoidabuzarga boradigan rasmiy ogohlantirish matni..."
                style={{ marginTop: 6 }}
              />
            )}
          </div>

          {/* 5. Moderation Action on Target User (Ban / Spam) */}
          <div style={{ background: '#fff1f0', padding: 12, borderRadius: 8, border: '1px solid #ffa39e' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <StopOutlined style={{ color: '#f5222d' }} />
              <span style={{ fontWeight: 'bold', color: '#cf1322' }}>
                Nishon foydalanuvchiga intizomiy chora (Bloklash / Spam)
              </span>
            </div>

            <Row gutter={[12, 12]}>
              <Col xs={24} sm={14}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#595959' }}>Chora turi:</label>
                <Select
                  value={targetModerationAction}
                  onChange={setTargetModerationAction}
                  style={{ width: '100%', marginTop: 2 }}
                  options={[
                    { value: 'NONE', label: 'Hech qanday chora yo‘q (None)' },
                    { value: 'TEMP_BLOCK', label: 'Vaqtinchalik bloklash (Temp Ban)' },
                    { value: 'PERM_BLOCK', label: 'Doimiy bloklash (Permanent Ban)' },
                    { value: 'TEMP_SPAM', label: 'Vaqtinchalik Spam cheklovi (Temp Spam)' },
                    { value: 'PERM_SPAM', label: 'Doimiy Spam belgisi (Permanent Spam)' },
                    { value: 'UNBLOCK', label: 'Blokdan / Spamdan chiqarish' },
                  ]}
                />
              </Col>

              {(targetModerationAction === 'TEMP_BLOCK' || targetModerationAction === 'TEMP_SPAM') && (
                <Col xs={24} sm={10}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#595959' }}>Muddat:</label>
                  <Select
                    value={moderationDurationHours}
                    onChange={setModerationDurationHours}
                    style={{ width: '100%', marginTop: 2 }}
                    options={[
                      { value: 24, label: '24 soat (1 kun)' },
                      { value: 72, label: '72 soat (3 kun)' },
                      { value: 168, label: '168 soat (7 kun)' },
                      { value: 720, label: '720 soat (30 kun)' },
                    ]}
                  />
                </Col>
              )}

              {targetModerationAction !== 'NONE' && (
                <Col span={24}>
                  <Input
                    placeholder="Chora ko‘rish sababi (User ko‘radigan izoh)..."
                    value={moderationReason}
                    onChange={(e) => setModerationReason(e.target.value)}
                  />
                </Col>
              )}
            </Row>
          </div>
        </div>
      </Modal>

      {/* Direct Message Modal */}
      <Modal
        title={
          <Space>
            <SendOutlined style={{ color: '#722ed1' }} />
            <span>Foydalanuvchiga To‘g‘ridan-to‘g‘ri Xabar Yuborish ({directMessageUserName})</span>
          </Space>
        }
        open={messageModalVisible}
        onCancel={() => setMessageModalVisible(false)}
        onOk={() => {
          if (!directMessageBody.trim()) {
            message.warning('Xabar matnini kiriting!');
            return;
          }
          directMessageMutation.mutate({
            userId: directMessageUserId,
            title: directMessageTitle,
            message: directMessageBody,
          });
        }}
        confirmLoading={directMessageMutation.isPending}
        okText="Xabarni Yuborish"
        cancelText="Bekor qilish"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <Alert
            message="Push & Socket Bildirishnoma"
            description="Ushbu xabar foydalanuvchining telefoniga Push-bildirishnoma va ilova ichidagi xabarnomalar bo‘limiga yetkaziladi."
            type="info"
            showIcon
          />

          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>
              Xabar Sarlavhasi:
            </label>
            <Input
              value={directMessageTitle}
              onChange={(e) => setDirectMessageTitle(e.target.value)}
              placeholder="Masalan: Kelishamiz.uz Moderatsiya Xabari"
            />
          </div>

          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>
              Xabar Matni:
            </label>
            <TextArea
              rows={4}
              value={directMessageBody}
              onChange={(e) => setDirectMessageBody(e.target.value)}
              placeholder="Foydalanuvchiga yuboriladigan to‘liq xabar matnini yozing..."
            />
          </div>
        </div>
      </Modal>

      {/* User Moderation Modal (Block / Spam) */}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#f5222d' }} />
            <span>Foydalanuvchi Intizomiy Holati Boshqaruvi ({selectedUserForAction?.username || `ID #${selectedUserForAction?.id}`})</span>
          </Space>
        }
        open={moderationModalVisible}
        onCancel={() => setModerationModalVisible(false)}
        onOk={handleModerationSubmit}
        confirmLoading={userModerationMutation.isPending}
        okText="O‘zgarishlarni Saqlash"
        cancelText="Bekor qilish"
        width={600}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
          {/* Block Section */}
          <div style={{ background: '#fff1f0', padding: 14, borderRadius: 8, border: '1px solid #ffa39e' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 'bold', color: '#cf1322' }}>
                🚫 Foydalanuvchini Bloklash (Ban)
              </span>
              <Switch checked={modIsBlocked} onChange={setModIsBlocked} />
            </div>

            {modIsBlocked && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>
                    Bloklash Muddati:
                  </label>
                  <Radio.Group value={modBlockDuration} onChange={(e) => setModBlockDuration(e.target.value)}>
                    <Radio.Button value="24h">24 soat (1 kun)</Radio.Button>
                    <Radio.Button value="3d">3 kun</Radio.Button>
                    <Radio.Button value="7d">7 kun</Radio.Button>
                    <Radio.Button value="30d">30 kun</Radio.Button>
                    <Radio.Button value="permanent">Doimiy (Permanent)</Radio.Button>
                  </Radio.Group>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>
                    Bloklash Sababi (Foydalanuvchiga ko‘rsatiladi):
                  </label>
                  <Input
                    placeholder="Qoidabuzarlik sababini kiriting..."
                    value={modBanReason}
                    onChange={(e) => setModBanReason(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Spam Section */}
          <div style={{ background: '#fffbe6', padding: 14, borderRadius: 8, border: '1px solid #ffe58f' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 'bold', color: '#ad6800' }}>
                ⚠️ Spam Belgisi (Cheklov)
              </span>
              <Switch checked={modIsSpam} onChange={setModIsSpam} />
            </div>

            {modIsSpam && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>
                    Spam Cheklovi Muddati:
                  </label>
                  <Radio.Group value={modSpamDuration} onChange={(e) => setModSpamDuration(e.target.value)}>
                    <Radio.Button value="24h">24 soat</Radio.Button>
                    <Radio.Button value="7d">7 kun</Radio.Button>
                    <Radio.Button value="permanent">Doimiy</Radio.Button>
                  </Radio.Group>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>
                    Spam Sababi:
                  </label>
                  <Input
                    placeholder="Spam sababini kiriting..."
                    value={modSpamReason}
                    onChange={(e) => setModSpamReason(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notification to User */}
          <div style={{ background: '#f6ffed', padding: 14, borderRadius: 8, border: '1px solid #b7eb8f' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 'bold', color: '#237804' }}>
                🔔 Foydalanuvchiga Bildirishnoma Jo‘natish
              </span>
              <Switch checked={modSendNotification} onChange={setModSendNotification} />
            </div>

            {modSendNotification && (
              <TextArea
                rows={2}
                value={modNotificationMessage}
                onChange={(e) => setModNotificationMessage(e.target.value)}
                placeholder="Foydalanuvchiga boradigan xabar..."
              />
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Reports;
