import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Table, Typography, Spin, Button, Space, Tooltip, Input, Tag, Empty, Popconfirm } from 'antd';
import {
  DoubleLeftOutlined,
  LeftOutlined,
  RightOutlined,
  DoubleRightOutlined,
  CalendarOutlined,
  HighlightOutlined,
  DatabaseOutlined,
  SaveOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useCompareReport, useDeleteReportRecord } from '../hooks/useReport';
import { useHighlight } from '../hooks/useHighlight';
import { useSavedProducts } from '../hooks/useSavedProducts';
import { useProductFolders } from '../hooks/useProductFolders';
import type { CompareRecord, DayRecord } from '../types';

const { Title, Text } = Typography;
const SaveFolderModal = lazy(() => import('../components/SaveFolderModal'));

interface CompareTableRecord extends CompareRecord {
  daysByNumber: Partial<Record<number, DayRecord>>;
}

function formatVND(value: number): string {
  return Math.round(value).toLocaleString('vi-VN');
}

function formatPercent(value: number): string {
  return value.toFixed(1) + '%';
}

function formatImportColumnTitle(position: number): string {
  if (position === 1) {
    return 'Import gần nhất';
  }

  if (position === 2) {
    return 'Import liền trước';
  }

  return `Import trước đó ${position - 1}`;
}

/** Calculate rowSpan map and group index for alternating colors */
function useRowMerge(records: CompareTableRecord[]) {
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
  records: CompareTableRecord[],
  sortKey: string | null,
  sortOrder: 'ascend' | 'descend' | null,
) {
  return useMemo(() => {
    if (!sortKey || !sortOrder) return records;

    // Group consecutive rows by subId
    const groups: CompareTableRecord[][] = [];
    for (const record of records) {
      const last = groups[groups.length - 1];
      if (last && last[0].subId === record.subId) {
        last.push(record);
      } else {
        groups.push([record]);
      }
    }

    const multiplier = sortOrder === 'ascend' ? 1 : -1;

    const getGroupValue = (group: CompareTableRecord[]): number => {
      const first = group[0];
      if (sortKey === 'tcp') return first.tcp;
      if (sortKey === 'tdt') return first.tdt;
      if (sortKey === 'tln') return first.tln;

      // day columns: day1_cp, day2_dt, day3_hq
      const match = sortKey.match(/^day(\d+)_(cp|dt|hq)$/);
      if (match) {
        const dayNum = parseInt(match[1]);
        const field = match[2] as 'cp' | 'dt' | 'hq';
        const day = first.daysByNumber[dayNum];
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

function usePreparedRecords(records: CompareRecord[]) {
  return useMemo<CompareTableRecord[]>(() => {
    return records.map((record) => {
      const daysByNumber: Partial<Record<number, DayRecord>> = {};

      for (const [index, day] of record.days.entries()) {
        daysByNumber[index + 1] = day;
      }

      return {
        ...record,
        daysByNumber,
      };
    });
  }, [records]);
}

export default function ReportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const [campaignSearch, setCampaignSearch] = useState('');
  const [appliedCampaignSearch, setAppliedCampaignSearch] = useState('');
  const debouncedCampaignSearch = useDebouncedValue(campaignSearch, 500);
  const { data, isLoading, isFetching } = useCompareReport(sessionId, appliedCampaignSearch);
  const {
    highlightedSubId2s,
    highlightedSet,
    toggleHighlight,
    clearHighlights,
    isUpdating: isHighlightUpdating,
  } = useHighlight();
  const { savedProductSet, saveProduct, unsaveProduct, isUpdating: isSavedProductsUpdating } = useSavedProducts();
  const { folders, createFolder } = useProductFolders();
  const { deleteReportRecord, isDeleting: isDeletingRecord, deletingRecordId } = useDeleteReportRecord();
  const [savingSubId, setSavingSubId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>(null);
  const toggleHighlightRef = useRef(toggleHighlight);
  const unsaveProductRef = useRef(unsaveProduct);

  useEffect(() => {
    setAppliedCampaignSearch(debouncedCampaignSearch.trim());
  }, [debouncedCampaignSearch]);

  useEffect(() => {
    toggleHighlightRef.current = toggleHighlight;
  }, [toggleHighlight]);

  useEffect(() => {
    unsaveProductRef.current = unsaveProduct;
  }, [unsaveProduct]);

  const records = data?.records ?? [];
  const preparedRecords = usePreparedRecords(records);
  const sortedRecords = useSortedRecords(preparedRecords, sortKey, sortOrder);
  const { rowSpanMap } = useRowMerge(sortedRecords);
  const maxDays = data?.maxDays ?? 0;
  const visibleRows = sortedRecords.length;
  const hieuQuaCellBg = '#d9ead3';
  const hasRows = visibleRows > 0;
  const hasImportedSessions = Boolean(
    data?.currentSessionId || data?.prevSessionId || data?.nextSessionId || data?.oldestSessionId,
  );
  const isSearchEmptyState = hasImportedSessions && !hasRows && appliedCampaignSearch.length > 0;
  const emptyDescription = isSearchEmptyState
    ? `Không tìm thấy campaign phù hợp với "${appliedCampaignSearch}".`
    : 'Chưa có dữ liệu. Vui lòng import file trước.';

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

  const columns = useMemo<ColumnsType<CompareTableRecord>>(() => {
    const builtColumns: ColumnsType<CompareTableRecord> = [
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
                void toggleHighlightRef.current(text);
              }}
            >
              {text}
            </button>
          </Tooltip>
        ),
        onCell: (_record: CompareTableRecord, index: number | undefined) => ({
          rowSpan: rowSpanMap.get(index ?? 0) ?? 1,
          style: { maxWidth: 300 },
        }),
      },
      {
        title: 'Action',
        key: 'saved',
        fixed: 'left',
        width: 126,
        onHeaderCell: () => ({ className: 'report-header-dark' }),
        render: (_: unknown, record: CompareTableRecord) => {
          const isSaved = savedProductSet.has(record.subId);

          return (
            <Button
              size="small"
              type={isSaved ? 'default' : 'primary'}
              icon={isSaved ? <DeleteOutlined /> : <SaveOutlined />}
              className={`report-action-button ${isSaved ? 'report-action-button-saved' : 'report-action-button-default'}`}
              onClick={() => {
                if (isSaved) {
                  void unsaveProductRef.current(record.subId);
                } else {
                  setSavingSubId(record.subId);
                }
              }}
            >
              {isSaved ? 'Bỏ lưu' : 'Lưu'}
            </Button>
          );
        },
        onCell: (_record: CompareTableRecord, index: number | undefined) => ({
          rowSpan: rowSpanMap.get(index ?? 0) ?? 1,
          style: { textAlign: 'center' },
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
            sortOrder: sortKey === 'tcp' ? sortOrder : null,
            onHeaderCell: () => ({
              style: { backgroundColor: hieuQuaCellBg, color: '#000000', fontWeight: 'bold', textAlign: 'center' as const },
            }),
            onCell: (_record: CompareTableRecord, index: number | undefined) => ({
              rowSpan: rowSpanMap.get(index ?? 0) ?? 1,
              style: { backgroundColor: hieuQuaCellBg, fontWeight: 'bold' },
            }),
            render: (val: number) => <span className="text-[15px]">{formatVND(val)}</span>,
          },
          {
            title: 'TDT',
            dataIndex: 'tdt',
            key: 'tdt',
            width: 120,
            sorter: true,
            sortOrder: sortKey === 'tdt' ? sortOrder : null,
            onHeaderCell: () => ({
              style: { backgroundColor: hieuQuaCellBg, color: '#000000', fontWeight: 'bold', textAlign: 'center' as const },
            }),
            onCell: (_record: CompareTableRecord, index: number | undefined) => ({
              rowSpan: rowSpanMap.get(index ?? 0) ?? 1,
              style: { backgroundColor: hieuQuaCellBg, fontWeight: 'bold' },
            }),
            render: (val: number) => <span className="text-[15px]">{formatVND(val)}</span>,
          },
          {
            title: 'TLN',
            dataIndex: 'tln',
            key: 'tln',
            width: 120,
            sorter: true,
            sortOrder: sortKey === 'tln' ? sortOrder : null,
            onHeaderCell: () => ({
              style: { backgroundColor: hieuQuaCellBg, color: '#000000', fontWeight: 'bold', textAlign: 'center' as const },
            }),
            onCell: (_record: CompareTableRecord, index: number | undefined) => ({
              rowSpan: rowSpanMap.get(index ?? 0) ?? 1,
              style: { backgroundColor: hieuQuaCellBg, fontWeight: 'bold' },
            }),
            render: (val: number) => (
              <span className="text-[15px]" style={{
                color: val > 0 ? '#0000ff' : val < 0 ? '#cf1322' : undefined,
              }}>
                {formatVND(val)}
              </span>
            ),
          },
        ],
      },
    ];

    for (let d = 1; d <= maxDays; d++) {
      const dayBg = d % 2 === 1 ? '#ffffff' : '#f5f5f5';

      builtColumns.push({
        title: formatImportColumnTitle(d),
        onHeaderCell: () => ({ className: 'report-header-dark' }),
        children: [
          {
            title: 'CP',
            key: `day${d}_cp`,
            width: 100,
            sorter: true,
            sortOrder: sortKey === `day${d}_cp` ? sortOrder : null,
            onHeaderCell: () => ({ className: 'report-header-light' }),
            onCell: () => ({ style: { backgroundColor: dayBg } }),
            render: (_: unknown, record: CompareTableRecord) => {
              const day = record.daysByNumber[d];
              if (!day) return '-';
              return (
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[15px]">{formatVND(day.cp)}</span>
                  {day.recordId ? (
                    <Popconfirm
                      title="Xóa bản ghi này?"
                      description={`Sub ID: ${record.subId}${day.importOrder ? ` • Lần import ${day.importOrder}` : ''}`}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true, loading: deletingRecordId === day.recordId }}
                      onConfirm={() => deleteReportRecord(day.recordId!)}
                    >
                      <Button
                        type="link"
                        danger
                        size="small"
                        className="h-auto! p-0! text-[10px]!"
                        loading={isDeletingRecord && deletingRecordId === day.recordId}
                      >
                        Xóa
                      </Button>
                    </Popconfirm>
                  ) : null}
                </div>
              );
            },
          },
          {
            title: 'DT',
            key: `day${d}_dt`,
            width: 100,
            sorter: true,
            sortOrder: sortKey === `day${d}_dt` ? sortOrder : null,
            onHeaderCell: () => ({ className: 'report-header-light' }),
            onCell: () => ({ style: { backgroundColor: dayBg } }),
            render: (_: unknown, record: CompareTableRecord) => {
              const day = record.daysByNumber[d];
              if (!day) return '-';
              return <span className="text-[15px]">{formatVND(day.dt)}</span>;
            },
          },
          {
            title: 'HQ%',
            key: `day${d}_hq`,
            width: 80,
            sorter: true,
            sortOrder: sortKey === `day${d}_hq` ? sortOrder : null,
            onHeaderCell: () => ({ className: 'report-header-light' }),
            onCell: () => ({ style: { backgroundColor: dayBg } }),
            render: (_: unknown, record: CompareTableRecord) => {
              const day = record.daysByNumber[d];
              if (!day) return '-';
              return (
                <span className="text-[15px]" style={{ fontWeight: 'bold', color: day.hq > 200 ? '#15803d' : undefined }}>
                  {formatPercent(day.hq)}
                </span>
              );
            },
          },
        ],
      });
    }

    return builtColumns;
  }, [
    deleteReportRecord,
    deletingRecordId,
    highlightedSet,
    hieuQuaCellBg,
    isDeletingRecord,
    maxDays,
    rowSpanMap,
    savedProductSet,
    sortKey,
    sortOrder,
  ]);

  if (isLoading && !data) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="report-page">
      <div className="report-toolbar-card mb-4">
        <div className="report-toolbar-top">
          <div>
            <Title level={3} style={{ margin: 0 }}>Báo cáo so sánh</Title>
            <Text type="secondary">Theo dõi hiệu quả theo phiên import, hỗ trợ lọc campaign và điều hướng nhanh.</Text>
          </div>
          <Space wrap>
            <Tag color="blue" icon={<DatabaseOutlined />}>Dòng hiển thị: {visibleRows}</Tag>
            <Tag color="cyan" icon={<CalendarOutlined />}>Tối đa lần import: {maxDays}</Tag>
            <Tag color="gold" icon={<HighlightOutlined />}>Highlight: {highlightedSubId2s.length}</Tag>
          </Space>
        </div>

        <div className="report-toolbar-controls mt-4">
          <Input.Search
            placeholder="Tìm theo tên chiến dịch"
            allowClear
            value={campaignSearch}
            onChange={(event) => {
              setCampaignSearch(event.target.value);
            }}
            onSearch={(value) => {
              setAppliedCampaignSearch(value.trim());
            }}
            style={{ width: 300 }}
          />

          <Space wrap>
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
      </div>

      <div className="report-highlight-card mb-4 flex flex-col gap-3 rounded-lg border border-[#ffe58f] bg-[#fffbe6] p-4 md:flex-row md:items-center md:justify-between">
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

      <div className="report-table-shell">
        {hasRows ? (
          <Table<CompareTableRecord>
            className="report-table"
            columns={columns}
            dataSource={sortedRecords}
            rowKey={(record: CompareTableRecord, index?: number) => `${record.subId}-${index ?? 0}`}
            scroll={{ x: 'max-content', y: 'calc(100vh - 320px)' }}
            loading={isFetching}
            bordered
            size="small"
            pagination={false}
            showSorterTooltip={false}
            sortDirections={['ascend', 'descend']}
            onChange={handleTableChange}
            rowClassName={(record: CompareTableRecord) => (highlightedSet.has(record.subId) ? 'report-row-selected' : '')}
          />
        ) : (
          <div className="report-empty-state">
            <Empty
              image={isSearchEmptyState ? Empty.PRESENTED_IMAGE_SIMPLE : Empty.PRESENTED_IMAGE_DEFAULT}
              description={
                <Space direction="vertical" size={4}>
                  <Text strong>
                    {isSearchEmptyState ? 'Không có kết quả phù hợp' : 'Chưa có dữ liệu báo cáo'}
                  </Text>
                  <Text type="secondary">{emptyDescription}</Text>
                </Space>
              }
            >
              {isSearchEmptyState ? (
                <Button
                  onClick={() => {
                    setCampaignSearch('');
                    setAppliedCampaignSearch('');
                  }}
                >
                  Xóa bộ lọc
                </Button>
              ) : null}
            </Empty>
          </div>
        )}
      </div>
      {savingSubId && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}
    </div>
  );
}
