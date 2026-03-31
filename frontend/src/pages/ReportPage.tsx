import { useMemo, useState } from 'react';
import { Table, Typography, Spin, Button, Space } from 'antd';
import { DoubleLeftOutlined, LeftOutlined, RightOutlined, DoubleRightOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useCompareReport } from '../hooks/useReport';
import type { CompareRecord } from '../types';

const { Title } = Typography;

function formatVND(value: number): string {
  return Math.round(value).toLocaleString('vi-VN');
}

function formatPercent(value: number): string {
  return value.toFixed(1) + '%';
}

/** Calculate rowSpan map and group index for alternating colors */
function useRowMerge(records: CompareRecord[]) {
  return useMemo(() => {
    const rowSpanMap = new Map<number, number>();
    const groupIndexMap = new Map<number, number>();
    let groupIdx = 0;

    let i = 0;
    while (i < records.length) {
      const currentSubId = records[i].subId;
      let count = 1;
      while (i + count < records.length && records[i + count].subId === currentSubId) {
        count++;
      }
      for (let j = 0; j < count; j++) {
        rowSpanMap.set(i + j, j === 0 ? count : 0);
        groupIndexMap.set(i + j, groupIdx);
      }
      groupIdx++;
      i += count;
    }

    return { rowSpanMap, groupIndexMap };
  }, [records]);
}

export default function ReportPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { data, isLoading } = useCompareReport(sessionId);

  const records = data?.records ?? [];
  const { rowSpanMap } = useRowMerge(records);
  const highlightedSubIdThreshold = 5_000_000;

  const handleNewest = () => setSessionId(null);

  const handlePrev = () => {
    if (data?.nextSessionId) setSessionId(data.nextSessionId);
  };

  const handleNext = () => {
    if (data?.prevSessionId) setSessionId(data.prevSessionId);
  };

  const handleOldest = () => {
    if (data?.oldestSessionId) setSessionId(data.oldestSessionId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  const maxDays = data?.maxDays ?? 0;

  const mergedCellProps = (_record: CompareRecord, index: number | undefined) => ({
    rowSpan: rowSpanMap.get(index ?? 0) ?? 1,
  });

  const hieuQuaCellBg = '#d9ead3';

  const columns: ColumnsType<CompareRecord> = [
    {
      title: 'Sub ID',
      dataIndex: 'subId',
      key: 'subId',
      fixed: 'left',
      width: 180,
      onHeaderCell: () => ({ className: 'report-header-dark' }),
      render: (text: string) => (
        <span className="font-semibold">{text}</span>
      ),
      onCell: (record, index) => ({
        rowSpan: rowSpanMap.get(index ?? 0) ?? 1,
        className: record.tln > highlightedSubIdThreshold ? 'report-subid-highlight' : undefined,
      }),
    },
    {
      title: 'Hiệu quả',
      onHeaderCell: () => ({
        style: { backgroundColor: '#00ffff', color: '#000000', fontWeight: 'bold', textAlign: 'center' as const },
      }),
      children: [
        {
          title: 'TCP',
          dataIndex: 'tcp',
          key: 'tcp',
          width: 120,
          onHeaderCell: () => ({
            style: { backgroundColor: hieuQuaCellBg, color: '#000000', fontWeight: 'bold', textAlign: 'center' as const },
          }),
          onCell: (record: CompareRecord, index: number | undefined) => ({
            rowSpan: rowSpanMap.get(index ?? 0) ?? 1,
          }),
          render: (val: number) => formatVND(val),
        },
        {
          title: 'TDT',
          dataIndex: 'tdt',
          key: 'tdt',
          width: 120,
          onHeaderCell: () => ({
            style: { backgroundColor: hieuQuaCellBg, color: '#000000', fontWeight: 'bold', textAlign: 'center' as const },
          }),
          onCell: (record: CompareRecord, index: number | undefined) => ({
            rowSpan: rowSpanMap.get(index ?? 0) ?? 1,
          }),
          render: (val: number) => formatVND(val),
        },
        {
          title: 'TLN',
          dataIndex: 'tln',
          key: 'tln',
          width: 120,
          onHeaderCell: () => ({
            style: { backgroundColor: hieuQuaCellBg, color: '#000000', fontWeight: 'bold', textAlign: 'center' as const },
          }),
          onCell: (record: CompareRecord, index: number | undefined) => ({
            rowSpan: rowSpanMap.get(index ?? 0) ?? 1,
          }),
          render: (val: number) => (
            <span style={{
              color: val > 0 ? '#0000ff' : val < 0 ? '#cf1322' : undefined,
              fontWeight: Math.abs(val) > 5_000_000 ? 'bold' : undefined,
            }}>
              {formatVND(val)}
            </span>
          ),
        },
      ],
    },
  ];

  // Add day columns dynamically
  for (let d = 1; d <= maxDays; d++) {
    // Alternating bg: even days white, odd days light gray
    const dayBg = d % 2 === 1 ? '#ffffff' : '#f5f5f5';

    columns.push({
      title: `Ngày ${d}`,
      onHeaderCell: () => ({ className: 'report-header-dark' }),
      children: [
        {
          title: 'CP',
          key: `day${d}_cp`,
          width: 100,
          onHeaderCell: () => ({ className: 'report-header-light' }),
          onCell: () => ({ style: { backgroundColor: dayBg } }),
          render: (_: unknown, record: CompareRecord) => {
            const day = record.days?.find((r) => r.day === d);
            if (!day) return '-';
            return formatVND(day.cp);
          },
        },
        {
          title: 'DT',
          key: `day${d}_dt`,
          width: 100,
          onHeaderCell: () => ({ className: 'report-header-light' }),
          onCell: () => ({ style: { backgroundColor: dayBg } }),
          render: (_: unknown, record: CompareRecord) => {
            const day = record.days?.find((r) => r.day === d);
            if (!day) return '-';
            return formatVND(day.dt);
          },
        },
        {
          title: 'Hiệu quả',
          key: `day${d}_hq`,
          width: 80,
          onHeaderCell: () => ({ className: 'report-header-light' }),
          onCell: () => ({ style: { backgroundColor: dayBg } }),
          render: (_: unknown, record: CompareRecord) => {
            const day = record.days?.find((r) => r.day === d);
            if (!day) return '-';
            return <span style={{ fontWeight: 'bold' }}>{formatPercent(day.hq)}</span>;
          },
        },
      ],
    });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Title level={3} style={{ margin: 0 }}>Báo cáo so sánh</Title>
        <Space>
          <Button
            icon={<DoubleLeftOutlined />}
            onClick={handleNewest}
            disabled={!data?.nextSessionId}
          >
            Mới nhất
          </Button>
          <Button
            icon={<LeftOutlined />}
            onClick={handlePrev}
            disabled={!data?.nextSessionId}
          >
            Mới hơn
          </Button>
          <Button
            icon={<RightOutlined />}
            onClick={handleNext}
            disabled={!data?.prevSessionId}
          >
            Cũ hơn
          </Button>
          <Button
            icon={<DoubleRightOutlined />}
            onClick={handleOldest}
            disabled={!data?.prevSessionId}
          >
            Cũ nhất
          </Button>
        </Space>
      </div>
      <Table<CompareRecord>
        className="report-table"
        columns={columns}
        dataSource={records}
        rowKey={(_, index) => `row-${index}`}
        scroll={{ x: 'max-content' }}
        bordered
        size="small"
        pagination={false}
      />
    </div>
  );
}
