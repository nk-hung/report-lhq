import { Card, Spin, Typography } from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  FundOutlined,
} from '@ant-design/icons';
import { useTotalReport } from '../hooks/useReport';

const { Title } = Typography;

function formatVND(value: number): string {
  return value.toLocaleString('vi-VN') + ' ₫';
}

export default function DashboardPage() {
  const { data, isLoading } = useTotalReport();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  const cards = [
    {
      title: 'Tổng Chi Phí (TCP)',
      value: data?.totalCp ?? 0,
      color: '#cf1322',
      bgColor: '#fff1f0',
      borderColor: '#ffa39e',
      icon: <DollarOutlined style={{ fontSize: 32, color: '#cf1322' }} />,
    },
    {
      title: 'Tổng Doanh Thu (TDT)',
      value: data?.totalDt ?? 0,
      color: '#389e0d',
      bgColor: '#f6ffed',
      borderColor: '#b7eb8f',
      icon: <RiseOutlined style={{ fontSize: 32, color: '#389e0d' }} />,
    },
    {
      title: 'Tổng Lợi Nhuận (TLN)',
      value: data?.totalProfit ?? 0,
      color: '#1677ff',
      bgColor: '#e6f4ff',
      borderColor: '#91caff',
      icon: <FundOutlined style={{ fontSize: 32, color: '#1677ff' }} />,
    },
  ];

  return (
    <div>
      <Title level={3}>Dashboard</Title>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {cards.map((card) => (
          <Card
            key={card.title}
            style={{
              backgroundColor: card.bgColor,
              borderColor: card.borderColor,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-2">{card.title}</div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: card.color }}
                >
                  {formatVND(card.value)}
                </div>
              </div>
              {card.icon}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
