import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import App from "./App.jsx";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
      staleTime: 1000 * 60 * 3, // 3 daqiqa
      gcTime: 1000 * 60 * 30, // 30 daqiqa
      refetchOnMount: false,
    },
  },
});

const antdTheme = {
  token: {
    // Enterprise Deep Blue Design System
    colorPrimary: "#1d4ed8",
    colorPrimaryHover: "#1e40af",
    colorPrimaryActive: "#1e3a8a",
    colorInfo: "#1d4ed8",
    colorSuccess: "#059669",
    colorWarning: "#d97706",
    colorError: "#dc2626",
    colorTextBase: "#0f172a",
    colorTextSecondary: "#475569",
    colorBgBase: "#ffffff",
    colorBgContainer: "#ffffff",
    colorBgLayout: "#f8fafc",
    colorBorder: "#e2e8f0",
    colorBorderSecondary: "#f1f5f9",
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 13.5,
    boxShadow: "0 1px 2px 0 rgba(15, 23, 42, 0.04)",
    boxShadowSecondary: "0 2px 4px 0 rgba(15, 23, 42, 0.05)",
  },
  components: {
    Button: {
      controlHeight: 38,
      controlHeightLG: 42,
      controlHeightSM: 30,
      fontWeight: 500,
      borderRadius: 8,
    },
    Table: {
      headerBg: "#f8fafc",
      headerColor: "#475569",
      rowHoverBg: "#f8fafc",
      borderRadius: 10,
    },
    Card: {
      headerFontSize: 15,
      headerHeight: 48,
      borderRadiusLG: 12,
    },
    Menu: {
      itemBorderRadius: 6,
      itemMarginInline: 8,
      itemHeight: 38,
    },
    Modal: {
      borderRadiusLG: 12,
    },
  },
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ConfigProvider theme={antdTheme}>
      <BrowserRouter basename="/">
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </BrowserRouter>
    </ConfigProvider>
  </StrictMode>
);
