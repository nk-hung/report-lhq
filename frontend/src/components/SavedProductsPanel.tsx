import { Button, Card, Empty, List, Tag, Typography } from 'antd';
import type { SavedProduct, SavedProductStats } from '../types';

const { Text } = Typography;

interface SavedProductsPanelProps {
  items: SavedProduct[];
  highlightedSet: Set<string>;
  statsBySubId?: Record<string, SavedProductStats>;
  loading?: boolean;
  onSelect: (subId2: string) => void;
  onToggleSave: (subId2: string) => void;
}

function formatVND(value: number): string {
  return Math.round(value).toLocaleString('vi-VN');
}

function formatPercent(value: number): string {
  return value.toFixed(1) + '%';
}

export default function SavedProductsPanel({
  items,
  highlightedSet,
  statsBySubId,
  loading,
  onSelect,
  onToggleSave,
}: SavedProductsPanelProps) {
  return (
    <Card
      title="Sản phẩm đã lưu"
      extra={<Tag color="blue">{items.length}</Tag>}
      className="shadow-sm"
    >
      {items.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có mã hàng hóa đã lưu" />
      ) : (
        <List
          loading={loading}
          dataSource={items}
          split
          renderItem={(item) => {
            const stats = statsBySubId?.[item.subId2];
            const isHighlighted = highlightedSet.has(item.subId2);

            return (
              <List.Item className="px-0!">
                <div className="flex w-full items-start justify-between gap-3">
                  <button
                    type="button"
                    className="flex-1 cursor-pointer border-0 bg-transparent p-0 text-left"
                    onClick={() => onSelect(item.subId2)}
                  >
                    <div className="flex items-center gap-2">
                      <Text strong>{item.subId2}</Text>
                      {isHighlighted ? <Tag color="gold">Đang highlight</Tag> : null}
                    </div>
                    {stats ? (
                      <Text type="secondary" className="block mt-1 text-xs">
                        TCP {formatVND(stats.tcp)} | DT {formatVND(stats.tdt)} | HQ {formatPercent(stats.hq)}
                      </Text>
                    ) : (
                      <Text type="secondary" className="block mt-1 text-xs">
                        Chưa có dữ liệu trong báo cáo hiện tại
                      </Text>
                    )}
                  </button>
                  <Button size="small" onClick={() => onToggleSave(item.subId2)}>
                    Bỏ lưu
                  </Button>
                </div>
              </List.Item>
            );
          }}
        />
      )}
    </Card>
  );
}