import React from 'react';
import { Card, Row, Col, Statistic, Steps, Alert, Tag, Space, Divider } from 'antd';
import {
  DeleteOutlined,
  CheckCircleOutlined,
  CloudSyncOutlined,
  KeyOutlined,
} from '@ant-design/icons';

const AccountDeletions = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#262626', margin: 0 }}>
        <DeleteOutlined /> Foydalanuvchi Hisoblarini O‘chirish Boshqaruv Markazi (Account Deletion Center)
      </h2>

      <Alert
        message="Google Play & Privacy Policy Muvozanati"
        description="Foydalanuvchi akkauntini o‘chirish so‘rovi kelganda, tizim PostgreSQL bazasidagi shaxsiy ma'lumotlar, chat xabarlari, bildirishnomalar bilan birgalikda BunnyCDN bulutli xotirasidagi barcha media fayllarni to‘liq purge qiladi va JWT tokenlarni bekor qiladi."
        type="info"
        showIcon
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card variant="borderless">
            <Statistic
              title="Avtomatik Deletion Pipeline"
              value="100%"
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
            <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: 8 }}>
              Cascade + Cloud CDN Purge integratsiya qilingan
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card variant="borderless">
            <Statistic
              title="Token Invalidation"
              value="Faol (Active)"
              valueStyle={{ color: '#1890ff' }}
              prefix={<KeyOutlined />}
            />
            <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: 8 }}>
              O‘chirilgan akkaunt tokeni darhol 401 rad etiladi
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card variant="borderless">
            <Statistic
              title="Bulutli Xotira (CDN) Tozalash"
              value="Sinxron"
              valueStyle={{ color: '#722ed1' }}
              prefix={<CloudSyncOutlined />}
            />
            <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: 8 }}>
              Avatar va e'lon rasmlari xotiradan tozalanadi
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Akkauntni O‘chirish Bosqichlari (Deletion Pipeline Architecture)" variant="borderless">
        <Steps
          direction="vertical"
          current={5}
          items={[
            {
              title: '1. Foydalanuvchi So‘rovi (User Request)',
              description: 'Mobil ilova yoki Veb-sayt orqali autentifikatsiyadan o‘tgan holda hisobni o‘chirish buyrug‘i beriladi.',
            },
            {
              title: '2. Bulutli Media Fayllarni Tozalash (CDN Purge)',
              description: 'BunnyCDN / Cloudinary serverlaridan foydalanuvchining avatari va mahsulot rasmlari o‘chiriladi.',
            },
            {
              title: '3. Ma’lumotlar Bazasi Tozalash (Database Cascade)',
              description: 'PostgreSQL jadvallari: product_likes_user, user_viewed_product, user_search, comments, likes, products, profile, message, notification, chat_room_participants_user, user to‘liq o‘chiriladi.',
            },
            {
              title: '4. Token Invalidation (JWT Revocation)',
              description: 'JwtStrategy bazada foydalanuvchi mavjudligini tekshiradi va eski tokenni darhol yaroqsiz qiladi.',
            },
            {
              title: '5. Audit va Xavfsizlik Yozuvi (Immutable Audit Log)',
              description: 'Admin audit logiga o‘chirish hodisasi vaqti va tafsilotlari yozib qo‘yiladi.',
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default AccountDeletions;
