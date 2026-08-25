import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Typography,
  Row,
  Col,
  Space,
  Alert,
  Modal,
  Tag,
  Divider,
} from "antd";
import {
  SendOutlined,
  NotificationOutlined,
  MobileOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import api from "./../config/auth/api";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const BroadcastNotification = () => {
  const [form] = Form.useForm();
  const [previewTitle, setPreviewTitle] = useState("Kelishamiz xabarnomasi");
  const [previewMessage, setPreviewMessage] = useState("");
  const [lastSentResult, setLastSentResult] = useState(null);

  const { mutate: sendBroadcast, isPending } = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post("/notification/broadcast", payload);
      return response.data;
    },
    onSuccess: (data) => {
      message.success("Xabarnoma barcha foydalanuvchilarga muvaffaqiyatli yuborildi!");
      setLastSentResult(data);
      form.resetFields();
      setPreviewTitle("Kelishamiz xabarnomasi");
      setPreviewMessage("");
    },
    onError: (error) => {
      console.error("Broadcast error:", error);
      const errMsg =
        error?.response?.data?.message ||
        "Xabarnomani yuborishda xatolik yuz berdi.";
      message.error(errMsg);
    },
  });

  const onFinish = (values) => {
    Modal.confirm({
      title: "Xabarnomani yuborishni tasdiqlaysizmi?",
      icon: <NotificationOutlined style={{ color: "#6345ED" }} />,
      content: (
        <div>
          <Paragraph>
            Ushbu xabar <b>barcha ro'yxatdan o'tgan foydalanuvchilarga</b> mobil push-xabarnoma va ilova ichidagi bildirishnoma sifatida yuboriladi.
          </Paragraph>
          <div style={{ background: "#F8F9FA", padding: 12, borderRadius: 8, border: "1px solid #E9ECEF" }}>
            <Text strong>{values.title || "Kelishamiz xabarnomasi"}</Text>
            <Paragraph style={{ margin: "4px 0 0 0", color: "#495057" }}>
              {values.message}
            </Paragraph>
          </div>
        </div>
      ),
      okText: "Ha, barchaga yuborilsin",
      cancelText: "Bekor qilish",
      okButtonProps: { style: { background: "#6345ED", borderColor: "#6345ED" } },
      onOk: () => {
        sendBroadcast({
          title: values.title || "Kelishamiz xabarnomasi",
          message: values.message,
          link: values.link || "",
        });
      },
    });
  };

  return (
    <div style={{ padding: "10px 0" }}>
      <Row gutter={[24, 24]}>
        {/* Left Side: Form */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <NotificationOutlined style={{ color: "#6345ED", fontSize: 20 }} />
                <span>Barcha foydalanuvchilarga xabar yuborish</span>
              </Space>
            }
            bordered={false}
            style={{
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              borderRadius: 12,
            }}
          >
            <Alert
              message="Ommaviy bildirishnoma (Broadcast)"
              description="Bu yerdan yuborilgan xabar bazadagi barcha foydalanuvchilarga yetib boradi va ularning telefoniga Push-bildirishnoma chiqadi."
              type="info"
              showIcon
              style={{ marginBottom: 24, borderRadius: 8 }}
            />

            {lastSentResult && (
              <Alert
                message="Xabar yuborildi!"
                description={
                  <div>
                    <Text>
                      Foydalanuvchilar soni: <b>{lastSentResult.sentToUsersCount || 0} ta</b>.
                    </Text>
                    <br />
                    <Text>
                      Qurilmalarga yetkazilgan Push-xabarnomalar: <b>{lastSentResult.pushNotificationsSentCount || 0} ta</b>.
                    </Text>
                  </div>
                }
                type="success"
                showIcon
                closable
                onClose={() => setLastSentResult(null)}
                style={{ marginBottom: 24, borderRadius: 8 }}
              />
            )}

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{
                title: "Kelishamiz xabarnomasi",
              }}
            >
              <Form.Item
                label={<Text strong>Xabar sarlavhasi (Ixtiyoriy)</Text>}
                name="title"
              >
                <Input
                  placeholder="Masalan: Kelishamiz yangiliklari yoki Chegirmalar"
                  size="large"
                  onChange={(e) =>
                    setPreviewTitle(e.target.value || "Kelishamiz xabarnomasi")
                  }
                />
              </Form.Item>

              <Form.Item
                label={<Text strong>Xabar matni (Majburiy)</Text>}
                name="message"
                rules={[
                  {
                    required: true,
                    message: "Iltimos, barcha foydalanuvchilarga yuboriladigan xabar matnini kiriting!",
                  },
                ]}
              >
                <TextArea
                  rows={5}
                  placeholder="Barcha foydalanuvchilarga yubormoqchi bo'lgan xabaringizni bu yerga yozing..."
                  showCount
                  maxLength={500}
                  onChange={(e) => setPreviewMessage(e.target.value)}
                />
              </Form.Item>

              <Form.Item
                label={<Text strong>Havola yoki Bo'lim (Ixtiyoriy)</Text>}
                name="link"
                help="Foydalanuvchi xabarnomani bosganda ochiladigan sahifa yoki havola"
              >
                <Input
                  placeholder="Masalan: /catalog yoki https://kelishamiz.uz"
                  size="large"
                />
              </Form.Item>

              <Divider style={{ margin: "20px 0" }} />

              <Form.Item style={{ marginBottom: 0 }}>
                <Space size="middle" wrap>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    icon={<SendOutlined />}
                    loading={isPending}
                    style={{
                      background: "#6345ED",
                      borderColor: "#6345ED",
                      minWidth: 200,
                      height: 46,
                      borderRadius: 8,
                      fontWeight: 600,
                    }}
                  >
                    Barchaga yuborish
                  </Button>

                  <Button
                    size="large"
                    icon={<ClearOutlined />}
                    onClick={() => {
                      form.resetFields();
                      setPreviewTitle("Kelishamiz xabarnomasi");
                      setPreviewMessage("");
                    }}
                    style={{ height: 46, borderRadius: 8 }}
                  >
                    Tozalash
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Right Side: Live Mobile Notification Preview */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <MobileOutlined style={{ color: "#6345ED", fontSize: 18 }} />
                <span>Telefonda qanday ko'rinadi (Preview)</span>
              </Space>
            }
            bordered={false}
            style={{
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              borderRadius: 12,
            }}
          >
            <div
              style={{
                background: "#0F172A",
                padding: "24px 16px",
                borderRadius: 24,
                boxShadow: "inset 0 2px 6px rgba(0,0,0,0.4)",
              }}
            >
              {/* Phone Status Bar Mock */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#94A3B8",
                  fontSize: 11,
                  marginBottom: 16,
                  paddingHorizontal: 8,
                }}
              >
                <span>9:41</span>
                <span>LTE • 100%</span>
              </div>

              {/* Push Notification Card Mock */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(20px)",
                  borderRadius: 16,
                  padding: 14,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: "#6345ED",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      K
                    </div>
                    <Text strong style={{ fontSize: 13, color: "#1E293B" }}>
                      KELISHAMIZ
                    </Text>
                  </div>
                  <Text style={{ fontSize: 11, color: "#94A3B8" }}>hozirgina</Text>
                </div>

                <div style={{ paddingLeft: 30 }}>
                  <Text strong style={{ fontSize: 14, color: "#0F172A", display: "block" }}>
                    {previewTitle || "Kelishamiz xabarnomasi"}
                  </Text>
                  <Paragraph
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: 13,
                      color: "#475569",
                      lineHeight: 1.4,
                    }}
                  >
                    {previewMessage || "Bu yerda siz kiritgan xabar matni foydalanuvchining telefon ekranida chiqadi..."}
                  </Paragraph>
                </div>
              </div>

              <div
                style={{
                  marginTop: 24,
                  textAlign: "center",
                  color: "#64748B",
                  fontSize: 12,
                }}
              >
                <InfoCircleOutlined style={{ marginRight: 4 }} />
                Hamma foydalanuvchilar bildirishnoma oladi
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default BroadcastNotification;
