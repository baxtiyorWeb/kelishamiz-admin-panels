import React, { useEffect, useState } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ProductFilled,
  ProductOutlined,
  ProfileOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, theme } from "antd";
import { Outlet, useNavigate } from "react-router-dom";
import { CiGrid32 } from "react-icons/ci";
import { MapIcon, MapPinHouse, MapPinIcon, Users } from "lucide-react";
const { Header, Sider, Content } = Layout;
const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    if (window.location.pathname === "/") {
      navigate("/categories");
    }
  }, []);

  return (
    <Layout className="min-h-screen">
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={[
            {
              key: "/categories",
              icon: <CiGrid32 />,
              label: "Kategoriyalar",
              onClick: () => navigate("/categories"),
            },
            {
              key: "/properties",
              icon: <ProductOutlined />,
              label: "Xususiyatlar",
              onClick: () => navigate("/properties"),
            },
            {
              key: "/profiles",
              icon: <ProfileOutlined />,
              label: "profillar",
              onClick: () => navigate("/profiles"),
            },
            {
              key: "/products",
              icon: <ProductFilled />,
              label: "mahsulotlar",
              onClick: () => navigate("/products"),
            },
            {
              key: "/locations",
              icon: <MapIcon />,
              label: "joylashuvlar",
              onClick: () => navigate("/locations"),
            },
            {
              key: "/users",
              icon: <Users />,
              label: "Foydalanuvchilar",
              onClick: () => navigate("/users"),
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
              width: 64,
              height: 64,
            }}
          />
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
