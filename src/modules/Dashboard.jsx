import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "./../config/auth/api";
import { Card, Col, Row, Statistic, Table, Tag, Spin, Alert, Tooltip, DatePicker, Select } from "antd";
const { RangePicker } = DatePicker;
const { Option } = Select;
import {
  UserOutlined,
  MessageOutlined,
  ProductOutlined,
  EyeOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const Dashboard = () => {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const response = await api.get("/analytics/dashboard");
      return response.data?.content;
    },
    refetchInterval: 30000,
  });

  const { data: chats, isLoading: chatsLoading } = useQuery({
    queryKey: ["chatPairings"],
    queryFn: async () => {
      const response = await api.get("/analytics/chats");
      return response.data?.content;
    },
    refetchInterval: 30000,
  });

  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [interval, setInterval] = useState("day");

  // 3. Visitor trend
  const { data: visitors, isLoading: visitorsLoading } = useQuery({
    queryKey: ["visitorTrend", dateRange[0]?.toISOString(), dateRange[1]?.toISOString(), interval],
    queryFn: async () => {
      let url = `/analytics/visitors?interval=${interval}`;
      if (dateRange[0] && dateRange[1]) {
        url += `&startDate=${dateRange[0].toISOString()}&endDate=${dateRange[1].toISOString()}`;
      }
      const response = await api.get(url);
      return response.data?.content;
    },
  });

  // 4. Today's active users
  const { data: activeUsers, isLoading: activeUsersLoading } = useQuery({
    queryKey: ["todayActiveUsers"],
    queryFn: async () => {
      const response = await api.get("/analytics/active-users");
      return response.data?.content;
    },
    refetchInterval: 30000,
  });

  if (statsLoading || chatsLoading || visitorsLoading || activeUsersLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Spin size="large" tip="Statistikalar yuklanmoqda...">
          <div style={{ padding: "50px" }} />
        </Spin>
      </div>
    );
  }

  if (statsError) {
    return (
      <Alert
        message="Xatolik"
        description="Statistikalarni yuklashda xatolik yuz berdi. Iltimos, backend serveringiz va API sozlamalarini tekshiring."
        type="error"
        showIcon
      />
    );
  }

  const activeUserColumns = [
    {
      title: "Foydalanuvchi",
      key: "user",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: "bold" }}>{record.username || "Noma'lum"}</div>
          <div style={{ color: "#8c8c8c", fontSize: "12px" }}>{record.phone}</div>
        </div>
      ),
    },
    {
      title: "Birinchi faollik",
      dataIndex: "visitedAt",
      key: "visitedAt",
      render: (date) => dayjs(date).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "Oxirgi faollik",
      dataIndex: "lastActiveAt",
      key: "lastActiveAt",
      render: (date) => dayjs(date).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "Tashriflar soni",
      dataIndex: "visitCount",
      key: "visitCount",
      render: (count) => <Tag color="blue">{count} marta</Tag>,
    },
    {
      title: "Tizimda bo'lish vaqti (Bugun)",
      dataIndex: "activeDuration",
      key: "activeDuration",
      render: (seconds) => {
        if (!seconds) return <Tag color="default">0 soniya</Tag>;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        let timeStr = "";
        if (hours > 0) timeStr += `${hours} soat `;
        if (minutes > 0) timeStr += `${minutes} daqiqa `;
        if (secs > 0 || timeStr === "") timeStr += `${secs} soniya`;

        return <Tag color="green">{timeStr.trim()}</Tag>;
      },
    },
  ];

  const columns = [
    {
      title: "Chat ID",
      dataIndex: "id",
      key: "id",
      render: (id) => <Tag color="blue">#{id}</Tag>,
    },
    {
      title: "Foydalanuvchi A (Yaratuvchi)",
      dataIndex: "userA",
      key: "userA",
      render: (userA) => (
        userA ? (
          <div>
            <div style={{ fontWeight: "bold" }}>{userA.username || "Ismsiz"}</div>
            <div style={{ color: "#8c8c8c", fontSize: "12px" }}>{userA.phone}</div>
          </div>
        ) : (
          <span style={{ color: "#bfbfbf" }}>Noma'lum</span>
        )
      ),
    },
    {
      title: "Foydalanuvchi B (Qabul qiluvchi)",
      dataIndex: "userB",
      key: "userB",
      render: (userB) => (
        userB ? (
          <div>
            <div style={{ fontWeight: "bold" }}>{userB.username || "Ismsiz"}</div>
            <div style={{ color: "#8c8c8c", fontSize: "12px" }}>{userB.phone}</div>
          </div>
        ) : (
          <span style={{ color: "#bfbfbf" }}>Noma'lum</span>
        )
      ),
    },
    {
      title: "E'lon",
      dataIndex: "product",
      key: "product",
      render: (product) => (
        product ? (
          <Tag color="purple">{product.title}</Tag>
        ) : (
          <span style={{ color: "#bfbfbf" }}>O'chirilgan mahsulot</span>
        )
      ),
    },
    {
      title: "Boshlangan vaqt",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => dayjs(date).format("YYYY-MM-DD HH:mm"),
    },
  ];

  const maxVisitors = visitors && visitors.length > 0
    ? Math.max(...visitors.map(v => v.count), 1)
    : 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#262626", margin: 0 }}>Tizim Analitikasi & Monitoring</h2>

      {/* Cards Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" style={{ boxShadow: "0 1px 2px 0 rgba(0,0,0,0.03)" }}>
            <Statistic
              title="Bugungi Noyob Tashriflar"
              value={stats?.todayVisitors || 0}
              precision={0}
              valueStyle={{ color: "#3f8600" }}
              prefix={<ArrowUpOutlined />}
              suffix={<EyeOutlined style={{ marginLeft: "8px", color: "#bfbfbf" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" style={{ boxShadow: "0 1px 2px 0 rgba(0,0,0,0.03)" }}>
            <Statistic
              title="Jami Foydalanuvchilar"
              value={stats?.totalUsers || 0}
              prefix={<UserOutlined style={{ color: "#1890ff", marginRight: "8px" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" style={{ boxShadow: "0 1px 2px 0 rgba(0,0,0,0.03)" }}>
            <Statistic
              title="Jami E'lonlar"
              value={stats?.totalProducts || 0}
              prefix={<ProductOutlined style={{ color: "#722ed1", marginRight: "8px" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" style={{ boxShadow: "0 1px 2px 0 rgba(0,0,0,0.03)" }}>
            <Statistic
              title="Jami Chatlar"
              value={stats?.totalChats || 0}
              prefix={<MessageOutlined style={{ color: "#52c41a", marginRight: "8px" }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts & Graphs Row */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title="Tashriflar dinamikasi"
            variant="borderless"
            style={{ boxShadow: "0 1px 2px 0 rgba(0,0,0,0.03)" }}
            extra={
              <div style={{ display: 'flex', gap: '8px' }}>
                <Select value={interval} onChange={setInterval} style={{ width: 120 }}>
                  <Option value="day">Kunlik</Option>
                  <Option value="week">Haftalik</Option>
                  <Option value="month">Oylik</Option>
                </Select>
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  allowClear={false}
                />
              </div>
            }
          >
            {visitors && visitors.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "180px", borderBottom: "1px solid #f0f0f0", paddingBottom: "8px" }}>
                  {visitors.map((v, idx) => {
                    const heightPercent = (v.count / maxVisitors) * 100;

                    const prevCount = idx > 0 ? visitors[idx - 1].count : v.count;
                    let changeText = "0% (o'zgarmadi)";
                    let changeColor = "#8c8c8c";
                    if (idx > 0 && prevCount > 0) {
                      const diff = v.count - prevCount;
                      const percent = ((Math.abs(diff) / prevCount) * 100).toFixed(1);
                      if (diff > 0) {
                        changeText = `+${percent}% 📈 (ko'tarildi)`;
                        changeColor = "#52c41a";
                      } else if (diff < 0) {
                        changeText = `-${percent}% 📉 (tushdi)`;
                        changeColor = "#f5222d";
                      }
                    } else if (idx > 0 && prevCount === 0 && v.count > 0) {
                      changeText = `+100% 📈 (ko'tarildi)`;
                      changeColor = "#52c41a";
                    }

                    const tooltipContent = (
                      <div>
                        <div><strong>Sana:</strong> {v.date}</div>
                        <div><strong>Tashriflar:</strong> {v.count} ta</div>
                        <div><strong>Ro'yxatdan o'tganlar:</strong> {v.registeredCount || 0} ta</div>
                        {idx > 0 && (
                          <div style={{ color: changeColor, marginTop: '4px' }}>
                            <strong>O'zgarish:</strong> {changeText}
                          </div>
                        )}
                      </div>
                    );

                    return (
                      <Tooltip key={idx} title={tooltipContent} color="#fff" overlayInnerStyle={{ color: '#000' }}>
                        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", flex: 1, height: "100%", position: "relative" }}>
                          <div style={{ fontSize: '10px', color: '#595959', marginBottom: '4px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {v.registeredCount > 0 && <span style={{ color: '#faad14', fontSize: '9px', marginBottom: '2px' }}>+{v.registeredCount}</span>}
                            <span>{v.count}</span>
                          </div>
                          <div
                            style={{
                              width: "60%",
                              backgroundColor: "#1890ff",
                              height: `${Math.max(heightPercent, 2)}%`,
                              borderTopLeftRadius: "2px",
                              borderTopRightRadius: "2px",
                              transition: "height 0.3s ease",
                              cursor: "pointer"
                            }}
                          ></div>
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#8c8c8c" }}>
                  <span>{visitors[0]?.date}</span>
                  <span>{interval === 'day' ? 'Kunlik' : interval === 'week' ? 'Haftalik' : 'Oylik'} statistika</span>
                  <span>{visitors[visitors.length - 1]?.date}</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "#bfbfbf", padding: "40px 0" }}>Tashriflar tarixi topilmadi.</div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Today's Active Users */}
      <Card title="Bugungi faol foydalanuvchilar va tizimda bo'lish vaqti" variant="borderless" style={{ boxShadow: "0 1px 2px 0 rgba(0,0,0,0.03)" }}>
        <Table
          columns={activeUserColumns}
          dataSource={activeUsers || []}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          scroll={{ x: true }}
        />
      </Card>

      {/* Active Chats Pairing */}
      <Card title="Barcha chat xonalari monitoringi (Kim kim bilan chatlashmoqda)" variant="borderless" style={{ boxShadow: "0 1px 2px 0 rgba(0,0,0,0.03)" }}>
        <Table
          columns={columns}
          dataSource={chats || []}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
