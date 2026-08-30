import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, theme } from "antd";
import App from "./App.jsx";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Oyna faollashganda avtomatik qayta yuklamaslik
      refetchOnReconnect: true, // Tarmoq tiklanganda yuklash
      retry: 1, // Xatolik bo'lsa 1 marta urinib ko'rish
      staleTime: 1000 * 60 * 5, // 5 daqiqa davomida ma'lumotlar eskirgan deb hisoblanmaydi (keshdan olinadi)
      gcTime: 1000 * 60 * 30, // 30 daqiqa davomida xotirada saqlanadi
      refetchOnMount: false, // Sahifaga qayta kirganda yana so'rov yubormaslik (keshdan o'qiydi)
    },
  },
});

const antdTheme = {
  token: {
    colorPrimary: "#6345ED",
    colorPrimaryHover: "#795EF5",
    colorPrimaryActive: "#5034D6",
    colorInfo: "#6345ED",
    colorSuccess: "#10B981",
    colorWarning: "#F59E0B",
    colorError: "#EF4444",
    borderRadius: 10,
    borderRadiusLG: 14,
    borderRadiusSM: 6,
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    colorBgBase: "#FFFFFF",
    colorBgContainer: "#FFFFFF",
    colorBgLayout: "#F8FAFC",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)",
    boxShadowSecondary: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03)",
  },
  components: {
    Button: {
      controlHeight: 40,
      controlHeightLG: 44,
      controlHeightSM: 32,
      fontWeight: 600,
    },
    Table: {
      headerBg: "#F8FAFC",
      headerColor: "#475569",
      rowHoverBg: "#F8FAFF",
      borderRadius: 12,
    },
    Card: {
      headerFontSize: 16,
      headerHeight: 52,
    },
    Menu: {
      itemBorderRadius: 8,
      itemMarginInline: 10,
      itemHeight: 40,
    },
    Modal: {
      borderRadiusLG: 16,
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
