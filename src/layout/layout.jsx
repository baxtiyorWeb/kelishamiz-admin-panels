import React, { useEffect, useState } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TagsOutlined,
  ControlOutlined,
  IdcardOutlined,
  RocketOutlined,
  DashboardOutlined,
  CreditCardOutlined,
  CloudSyncOutlined,
  NotificationOutlined,
  ShopOutlined,
  AlertOutlined,
  HistoryOutlined,
  DeleteOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  EnvironmentOutlined,
  TeamOutlined,
<<<<<<< HEAD
  WalletOutlined,
=======
  SafetyCertificateOutlined,
>>>>>>> c0ecd46105d9fc311942301c8676b394e39439b4
} from "@ant-design/icons";
import { Button, Layout, Menu, theme, Space, Tag, Popconfirm } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

const { Header, Sider, Content } = Layout;

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    if (window.location.pathname === "/") {
      navigate("/dashboard");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/auth/login";
  };

  return (
    <Layout className="min-h-screen">
      <Sider trigger={null} collapsible collapsed={collapsed} width={240}>
        <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #722ed1, #1890ff)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "18px"
          }}>
            K
          </div>
          {!collapsed && (
            <div>
              <div style={{ color: "#fff", fontWeight: "bold", fontSize: "15px", lineHeight: 1.2 }}>
                KELISHAMIZ
              </div>
              <div style={{ color: "#8c8c8c", fontSize: "10px", fontWeight: "bold" }}>
                OPERATIONS CENTER
              </div>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={[
            {
              key: "/dashboard",
              icon: <DashboardOutlined />,
              label: "Boshqaruv & Telemetriya",
              onClick: () => navigate("/dashboard"),
            },
            {
              key: "/products",
              icon: <TagsOutlined />,
              label: "E'lonlar & Moderatsiya",
              onClick: () => navigate("/products"),
            },
            {
              key: "/shops",
              icon: <ShopOutlined />,
              label: "Do'konlar (Shops)",
              onClick: () => navigate("/shops"),
            },
            {
              key: "/reports",
              icon: <AlertOutlined />,
              label: "Shikoyatlar & Moderatsiya",
              onClick: () => navigate("/reports"),
            },
            {
              key: "/categories",
              icon: <AppstoreOutlined />,
              label: "Kategoriyalar",
              onClick: () => navigate("/categories"),
            },
            {
              key: "/properties",
              icon: <ControlOutlined />,
              label: "Xususiyatlar",
              onClick: () => navigate("/properties"),
            },
            {
              key: "/users",
              icon: <TeamOutlined />,
              label: "Foydalanuvchilar",
              onClick: () => navigate("/users"),
            },
            {
              key: "/profiles",
              icon: <IdcardOutlined />,
              label: "Profillar",
              onClick: () => navigate("/profiles"),
            },
            {
              key: "/locations",
              icon: <EnvironmentOutlined />,
              label: "Joylashuvlar",
              onClick: () => navigate("/locations"),
            },
            {
              key: "/notifications",
              icon: <NotificationOutlined />,
              label: "Xabarnomalar",
              onClick: () => navigate("/notifications"),
            },
            {
              key: "/payments",
              icon: <CreditCardOutlined />,
              label: "To'lovlar",
              onClick: () => navigate("/payments"),
            },
            {
              key: "/banners",
              icon: <RocketOutlined />,
              label: "Bannerlar",
              onClick: () => navigate("/banners"),
            },
            {
              key: "/migration",
              icon: <CloudSyncOutlined />,
              label: "Bunny CDN Xotira",
              onClick: () => navigate("/migration"),
            },
            {
              key: "/deletions",
              icon: <DeleteOutlined />,
              label: "Account Deletion Center",
              onClick: () => navigate("/deletions"),
            },
            {
              key: "/security-policies",
              icon: <SafetyCertificateOutlined />,
              label: "Xavfsizlik Hujjatlari",
              onClick: () => navigate("/security-policies"),
            },
            {
              key: "/audit-logs",
              icon: <HistoryOutlined />,
              label: "Audit Tarixi",
              onClick: () => navigate("/audit-logs"),
            },
            {
              key: "/expenses",
              icon: <WalletOutlined />,
              label: "Loyiha Harajatlari",
              onClick: () => navigate("/expenses"),
            },
          ]}
        />
      </Sider>

      <Layout>
        <Header style={{ padding: "0 24px", background: colorBgContainer, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
              width: 44,
              height: 44,
            }}
          />

          <Space size="large">
            <Tag color="success">🟢 System Operational</Tag>
            <Popconfirm
              title="Tizimdan chiqish"
              description="Haqiqatan ham Admin paneldan chiqmoqchimisiz?"
              onConfirm={handleLogout}
              okText="Ha, chiqish"
              cancelText="Bekor qilish"
            >
              <Button type="text" danger icon={<LogoutOutlined />}>
                Chiqish
              </Button>
            </Popconfirm>
          </Space>
        </Header>
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
