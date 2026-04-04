import { Card, Progress, Spin, Tag, Typography } from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  FundOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useTotalReport } from '../hooks/useReport';

const { Title, Text } = Typography;

function formatVND(value: number): string {
  return value.toLocaleString('vi-VN') + ' ₫';
}

export default function DashboardPage() {
  const { data, isLoading } = useTotalReport();

  const totalCp = data?.totalCp ?? 0;
  const totalDt = data?.totalDt ?? 0;
  const totalProfit = data?.totalProfit ?? 0;
  const profitRate = totalDt > 0 ? (totalProfit / totalDt) * 100 : 0;
  const expenseCoverage = totalCp > 0 ? Math.min((totalDt / totalCp) * 100, 200) : 0;

  const profitTone =
    totalProfit > 0
      ? {
          color: '#15803d',
          icon: <ArrowUpOutlined />, 
          label: 'Sinh lời tốt',
          tagColor: 'success' as const,
        }
      : totalProfit < 0
        ? {
            color: '#b91c1c',
            icon: <ArrowDownOutlined />,
            label: 'Đang lỗ',
            tagColor: 'error' as const,
          }
        : {
            color: '#1d4ed8',
            icon: <ExclamationCircleOutlined />,
            label: 'Chưa phát sinh',
            tagColor: 'processing' as const,
          };

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
      value: totalCp,
      accentClass: 'overview-card-expense',
      icon: <DollarOutlined style={{ fontSize: 24, color: '#9f1239' }} />,
      helperText: 'Tổng chi cho tất cả phiên import',
    },
    {
      title: 'Tổng Doanh Thu (TDT)',
      value: totalDt,
      accentClass: 'overview-card-revenue',
      icon: <RiseOutlined style={{ fontSize: 24, color: '#166534' }} />,
      helperText: 'Doanh thu tích lũy từ affiliate',
    },
    {
      title: 'Tổng Lợi Nhuận (TLN)',
      value: totalProfit,
      accentClass: 'overview-card-profit',
      icon: <FundOutlined style={{ fontSize: 24, color: '#1d4ed8' }} />,
      helperText: 'Tổng doanh thu trừ tổng chi phí',
    },
  ];

  return (
    <div className="overview-page">
      <div className="overview-hero">
        <div>
          <Text className="overview-eyebrow">Executive Dashboard</Text>
          <Title level={2} style={{ margin: '8px 0 4px' }}>Tổng quan hiệu suất chiến dịch</Title>
          <Text type="secondary">Theo dõi chi phí, doanh thu và lợi nhuận trên toàn bộ dữ liệu đã import.</Text>
        </div>
        <Tag color={profitTone.tagColor} icon={totalProfit > 0 ? <CheckCircleOutlined /> : profitTone.icon}>
          {profitTone.label}
        </Tag>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
        {cards.map((card) => (
          <Card
            key={card.title}
            className={`overview-kpi-card ${card.accentClass}`}
            variant="borderless"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[13px] font-semibold tracking-wide text-slate-600 mb-2">{card.title}</div>
                <div className="text-3xl font-bold leading-none" style={{ color: 'var(--overview-value)' }}>
                  {formatVND(card.value)}
                </div>
                <div className="text-xs text-slate-500 mt-3">{card.helperText}</div>
              </div>
              <div className="overview-kpi-icon">{card.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-5">
        <Card className="overview-detail-card" variant="borderless">
          <Text strong style={{ display: 'block', marginBottom: 10 }}>Biên lợi nhuận trên doanh thu</Text>
          <div className="flex items-end justify-between gap-3 mb-3">
            <Text style={{ fontSize: 30, lineHeight: 1, color: profitTone.color, fontWeight: 700 }}>
              {profitRate.toFixed(1)}%
            </Text>
            <Tag color={profitTone.tagColor} icon={profitTone.icon}>{profitTone.label}</Tag>
          </div>
          <Progress
            percent={Math.max(0, Math.min(100, Math.abs(profitRate)))}
            status={totalProfit < 0 ? 'exception' : 'active'}
            showInfo={false}
            strokeColor={totalProfit < 0 ? '#ef4444' : '#22c55e'}
          />
        </Card>

        <Card className="overview-detail-card" variant="borderless">
          <Text strong style={{ display: 'block', marginBottom: 10 }}>Tỷ lệ bù chi phí (DT/CP)</Text>
          <div className="flex items-end justify-between gap-3 mb-3">
            <Text style={{ fontSize: 30, lineHeight: 1, color: '#1d4ed8', fontWeight: 700 }}>
              {totalCp > 0 ? `${((totalDt / totalCp) * 100).toFixed(1)}%` : '0.0%'}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>Mức hiển thị tối đa thanh tiến trình: 200%</Text>
          </div>
          <Progress
            percent={expenseCoverage / 2}
            showInfo={false}
            strokeColor={{ '0%': '#38bdf8', '100%': '#2563eb' }}
          />
        </Card>
      </div>
    </div>
  );
}
