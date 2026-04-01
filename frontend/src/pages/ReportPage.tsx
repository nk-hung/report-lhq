import { useMemo, useState } from 'react';
import { Table, Typography, Spin, Button, Space, Tooltip } from 'antd';
import { DoubleLeftOutlined, LeftOutlined, RightOutlined, DoubleRightOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useSearchParams } from 'react-router-dom';
import { useCompareReport } from '../hooks/useReport';
import { useHighlight } from '../hooks/useHighlight';
import { useSavedProducts } from '../hooks/useSavedProducts';
import { useProductFolders } from '../hooks/useProductFolders';
import SaveFolderModal from '../components/SaveFolderModal';
import type { CompareRecord } from '../types';

const { Title, Text } = Typography;

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

/** Sort records while keeping subId groups together */
function useSortedRecords(
  records: CompareRecord[],
  sortKey: string | null,
  sortOrder: 'ascend' | 'descend' | null,
) {
  return useMemo(() => {
    if (!sortKey || !sortOrder) return records;

    // Group consecutive rows by subId
    const groups: CompareRecord[][] = [];
    for (const record of records) {
      const last = groups[groups.length - 1];
      if (last && last[0].subId === record.subId) {
        last.push(record);
      } else {
        groups.push([record]);
      }
    }

    const multiplier = sortOrder === 'ascend' ? 1 : -1;

    const getGroupValue = (group: CompareRecord[]): number => {
      const first = group[0];
      if (sortKey === 'tcp') return first.tcp;
      if (sortKey === 'tdt') return first.tdt;
      if (sortKey === 'tln') return first.tln;

      // day columns: day1_cp, day2_dt, day3_hq
      const match = sortKey.match(/^day(\d+)_(cp|dt|hq)$/);
      if (match) {
        const dayNum = parseInt(match[1]);
        const field = match[2] as 'cp' | 'dt' | 'hq';
        const day = first.days?.find((d) => d.day === dayNum);
        return day?.[field] ?? 0;
      }

      return 0;
    };

    const sorted = [...groups].sort(
      (a, b) => (getGroupValue(a) - getGroupValue(b)) * multiplier,
    );
    return sorted.flat();
  }, [records, sortKey, sortOrder]);
}

export default function ReportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const { data, isLoading } = useCompareReport(sessionId);
  const {
    highlightedSubId2s,
    highlightedSet,
    toggleHighlight,
    clearHighlights,
    isUpdating: isHighlightUpdating,
  } = useHighlight();
  const { savedProductSet, saveProduct, unsaveProduct, isUpdating: isSavedProductsUpdating } = useSavedProducts();
  const { folders, createFolder } = useProductFolders();
  const [savingSubId, setSavingSubId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>(null);

  const records = data?.records ?? [];
  const sortedRecords = useSortedRecords(records, sortKey, sortOrder);
  const { rowSpanMap } = useRowMerge(sortedRecords);

  const setSessionId = (nextSessionId: string | null) => {
    const nextParams = new URLSearchParams(searchParams);

    if (nextSessionId) {
      nextParams.set('sessionId', nextSessionId);
    } else {
      nextParams.delete('sessionId');
    }

    setSearchParams(nextParams, { replace: true });
  };

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

  if (!data || (records.length === 0 && !data.currentSessionId)) {
    return (
      <div>
        <Title level={3} style={{ margin: 0, marginBottom: 16 }}>Báo cáo so sánh</Title>
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <Text type="secondary" className="text-lg">Chưa có dữ liệu. Vui lòng import file trước.</Text>
        </div>
      </div>
    );
  }

  const maxDays = data?.maxDays ?? 0;

  const getSortOrder = (key: string) => (sortKey === key ? sortOrder : null);

  const handleTableChange = (_pagination: unknown, _filters: unknown, sorter: unknown) => {
    const s = sorter as { columnKey?: string; order?: 'ascend' | 'descend' | null };
    if (s.columnKey && s.order) {
      setSortKey(s.columnKey as string);
      setSortOrder(s.order);
    } else {
      setSortKey(null);
      setSortOrder(null);
    }
  };

  const hieuQuaCellBg = '#d9ead3';

  const columns: ColumnsType<CompareRecord> = [
    {
      title: 'Sub ID',
      dataIndex: 'subId',
      key: 'subId',
      fixed: 'left',
      width: 300,
      onHeaderCell: () => ({ className: 'report-header-dark' }),
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <button
            type="button"
            className={`cursor-pointer border-0 bg-transparent p-0 font-semibold max-w-full overflow-hidden text-ellipsis whitespace-nowrap block ${highlightedSet.has(text) ? 'text-[#ad6800]' : 'text-[#073763]'}`}
            onClick={() => {
              void toggleHighlight(text);
            }}
          >
            {text}
          </button>
        </Tooltip>
      ),
      onCell: (_record: CompareRecord, index: number | undefined) => ({
        rowSpan: rowSpanMap.get(index ?? 0) ?? 1,
        style: { maxWidth: 300 },
      }),
    },
    {
      title: 'Lưu',
      key: 'saved',
      fixed: 'left',
      width: 100,
      onHeaderCell: () => ({ className: 'report-header-dark' }),
      render: (_: unknown, record: CompareRecord) => {
        const isSaved = savedProductSet.has(record.subId);

        return (
          <Button
            size="small"
            type={isSaved ? 'primary' : 'default'}
            onClick={() => {
              if (isSaved) {
                void unsaveProduct(record.subId);
              } else {
                setSavingSubId(record.subId);
              }
            }}
          >
            {isSaved ? 'Bỏ lưu' : 'Lưu'}
          </Button>
        );
      },
      onCell: (_record: CompareRecord, index: number | undefined) => ({
        rowSpan: rowSpanMap.get(index ?? 0) ?? 1,
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
          sorter: true,
          sortOrder: getSortOrder('tcp'),
          onHeaderCell: () => ({
            style: { backgroundColor: hieuQuaCellBg, color: '#000000', fontWeight: 'bold', textAlign: 'center' as const },
          }),
          onCell: (_record: CompareRecord, index: number | undefined) => ({
            rowSpan: rowSpanMap.get(index ?? 0) ?? 1,
            style: { backgroundColor: hieuQuaCellBg, fontWeight: 'bold' },
          }),
          render: (val: number) => formatVND(val),
        },
        {
          title: 'TDT',
          dataIndex: 'tdt',
          key: 'tdt',
          width: 120,
          sorter: true,
          sortOrder: getSortOrder('tdt'),
          onHeaderCell: () => ({
            style: { backgroundColor: hieuQuaCellBg, color: '#000000', fontWeight: 'bold', textAlign: 'center' as const },
          }),
          onCell: (_record: CompareRecord, index: number | undefined) => ({
            rowSpan: rowSpanMap.get(index ?? 0) ?? 1,
            style: { backgroundColor: hieuQuaCellBg, fontWeight: 'bold' },
          }),
          render: (val: number) => formatVND(val),
        },
        {
          title: 'TLN',
          dataIndex: 'tln',
          key: 'tln',
          width: 120,
          sorter: true,
          sortOrder: getSortOrder('tln'),
          onHeaderCell: () => ({
            style: { backgroundColor: hieuQuaCellBg, color: '#000000', fontWeight: 'bold', textAlign: 'center' as const },
          }),
          onCell: (_record: CompareRecord, index: number | undefined) => ({
            rowSpan: rowSpanMap.get(index ?? 0) ?? 1,
            style: { backgroundColor: hieuQuaCellBg, fontWeight: 'bold' },
          }),
          render: (val: number) => (
            <span style={{
              color: val > 0 ? '#0000ff' : val < 0 ? '#cf1322' : undefined,
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
          sorter: true,
          sortOrder: getSortOrder(`day${d}_cp`),
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
          sorter: true,
          sortOrder: getSortOrder(`day${d}_dt`),
          onHeaderCell: () => ({ className: 'report-header-light' }),
          onCell: () => ({ style: { backgroundColor: dayBg } }),
          render: (_: unknown, record: CompareRecord) => {
            const day = record.days?.find((r) => r.day === d);
            if (!day) return '-';
            return formatVND(day.dt);
          },
        },
        {
          title: 'HQ%',
          key: `day${d}_hq`,
          width: 80,
          sorter: true,
          sortOrder: getSortOrder(`day${d}_hq`),
          onHeaderCell: () => ({ className: 'report-header-light' }),
          onCell: () => ({ style: { backgroundColor: dayBg } }),
          render: (_: unknown, record: CompareRecord) => {
            const day = record.days?.find((r) => r.day === d);
            if (!day) return '-';
            return (
              <span style={{ fontWeight: 'bold', color: day.hq > 200 ? '#0000ff' : undefined }}>
                {formatPercent(day.hq)}
              </span>
            );
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
      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-[#ffe58f] bg-[#fffbe6] p-4 md:flex-row md:items-center md:justify-between">
        <Text strong>
          Đang highlight: {highlightedSubId2s.length} mã hàng hóa
        </Text>
        <Space wrap>
          <Button
            onClick={() => {
              void clearHighlights();
            }}
            disabled={highlightedSubId2s.length === 0 || isHighlightUpdating}
          >
            Xóa highlight
          </Button>
          {isSavedProductsUpdating ? <Text type="secondary">Đang đồng bộ mã đã lưu...</Text> : null}
        </Space>
      </div>
      <Table<CompareRecord>
        className="report-table"
        columns={columns}
        dataSource={sortedRecords}
        rowKey={(record: CompareRecord, index?: number) => `${record.subId}-${index ?? 0}`}
        scroll={{ x: 'max-content', y: 'calc(100vh - 280px)' }}
        bordered
        size="small"
        pagination={false}
        showSorterTooltip={false}
        sortDirections={['ascend', 'descend']}
        onChange={handleTableChange}
        rowClassName={(record: CompareRecord) => (highlightedSet.has(record.subId) ? 'report-row-selected' : '')}
      />
      {savingSubId && (
        <SaveFolderModal
          open={!!savingSubId}
          subId2={savingSubId}
          folders={folders}
          onSave={(subId2, folderId) => {
            void saveProduct(subId2, folderId);
            setSavingSubId(null);
          }}
          onCreateFolder={createFolder}
          onCancel={() => setSavingSubId(null)}
        />
      )}
    </div>
  );
}
