import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Typography, Statistic, Table, Alert, Spin, Tag } from 'antd';
import { WalletOutlined, ArrowUpOutlined, ArrowDownOutlined, GlobalOutlined, DatabaseOutlined } from '@ant-design/icons';
import api from '../config/auth/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const { Title, Text } = Typography;

const Expenses = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await api.get('/expenses/summary');
        setData(response.data.content || response.data);
      } catch (err) {
        console.error("Failed to fetch expenses:", err);
        setError('Harajatlar haqida ma`lumot olishda xatolik yuz berdi.');
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <Spin size="large" tip="Harajatlar yuklanmoqda..." />
      </div>
    );
  }

  if (error) {
    return <Alert message="Xatolik" description={error} type="error" showIcon />;
  }

  const bunnyData = data?.bunny || {};
  const usageData = data?.usage || null;
  const balance = bunnyData.Balance || 0;
  const thisMonthCharges = usageData?.estimatedTotalCost || bunnyData.ThisMonthCharges || 0;
  const billingRecords = bunnyData.BillingRecords || [];

  // Recharts uchun datani tayyorlash
  const chartData = billingRecords.slice(0, 30).reverse().map(record => ({
    date: record.Timestamp ? new Date(record.Timestamp).toLocaleDateString() : 'Noma`lum',
    amount: record.Amount || 0,
    type: record.Payer ? 'To`lov' : 'Harajat'
  }));

  const tableColumns = [
    {
      title: 'Sana',
      dataIndex: 'Timestamp',
      key: 'Timestamp',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: 'Turi',
      key: 'type',
      render: (_, record) => (
        record.Payer ? <Tag color="green">To'lov (Kirim)</Tag> : <Tag color="red">Harajat</Tag>
      ),
    },
    {
      title: 'Miqdor ($)',
      dataIndex: 'Amount',
      key: 'Amount',
      render: (text, record) => (
        <span className={record.Payer ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
          {record.Payer ? '+' : '-'}${Math.abs(text).toFixed(4)}
        </span>
      ),
    },
    {
      title: 'Izoh',
      key: 'description',
      render: (_, record) => record.Payer ? `To'lov: ${record.Payer}` : 'Oylik/Kunlik Harajat',
    }
  ];

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">
        <WalletOutlined className="mr-2" />
        Loyiha Harajatlari
      </Title>

      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={12} md={8}>
          <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Joriy Balans (Bunny.net)"
              value={balance}
              precision={2}
              prefix="$"
              valueStyle={{ color: balance < 5 ? '#cf1322' : '#3f8600' }}
              suffix={balance < 5 ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
            />
            {balance < 5 && (
              <Text type="danger" className="text-xs mt-2 block">
                Diqqat: Balans juda kam!
              </Text>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Bu Oydagi Harajatlar"
              value={thisMonthCharges}
              precision={4}
              prefix="$"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Xarajatlar Tahlili (Grafik)" bordered={false} className="shadow-sm h-full">
            {chartData.length > 0 ? (
              <div style={{ height: 300, width: '100%' }}>
                <ResponsiveContainer>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`$${Math.abs(value).toFixed(4)}`, 'Miqdor']}
                      labelFormatter={(label) => `Sana: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#1890ff"
                      name="Miqdor"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex justify-center items-center h-[300px] text-gray-400">
                Ma'lumot topilmadi
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Infratuzilma" bordered={false} className="shadow-sm h-full">
            <div className="flex items-center mb-4">
              <GlobalOutlined className="text-2xl text-blue-500 mr-4" />
              <div>
                <div className="text-gray-500 text-sm">CDN Bandwidth (Taxminiy)</div>
                <div className="text-lg font-semibold">
                  {usageData ? `${usageData.gbBandwidth.toFixed(4)} GB ($${usageData.estimatedBandwidthCost.toFixed(4)})` : 'Tahlil qilinmoqda...'}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <DatabaseOutlined className="text-2xl text-purple-500 mr-4" />
              <div>
                <div className="text-gray-500 text-sm">Xotira (Storage)</div>
                <div className="text-lg font-semibold">
                  {usageData ? `${usageData.gbStorage.toFixed(4)} GB ($${usageData.estimatedStorageCost.toFixed(4)})` : 'Tahlil qilinmoqda...'}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Alert
                message="API Token orqali"
                description="Barcha ma'lumotlar bevosita provayderlardan real vaqtda olinmoqda."
                type="info"
                showIcon
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="To'lov va Harajatlar Tarixi" bordered={false} className="shadow-sm mt-8">
        <Table
          columns={tableColumns}
          dataSource={billingRecords}
          rowKey={(record) => record.Id || Math.random().toString()}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
};

export default Expenses;
