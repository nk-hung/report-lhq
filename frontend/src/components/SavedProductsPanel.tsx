import { Button, Card, Dropdown, Empty, List, Tag, Typography } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import type { ProductFolder, SavedProduct, SavedProductStats } from '../types';

const { Text } = Typography;

interface SavedProductsPanelProps {
  items: SavedProduct[];
  highlightedSet: Set<string>;
  statsBySubId?: Record<string, SavedProductStats>;
  loading?: boolean;
  folders?: ProductFolder[];
  currentFolderId?: string | null;
  onSelect: (subId2: string) => void;
  onToggleSave: (subId2: string) => void;
  onMoveProduct?: (subId2: string, folderId: string | null) => void;
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
  folders = [],
  currentFolderId,
  onSelect,
  onToggleSave,
  onMoveProduct,
}: SavedProductsPanelProps) {
  const getMoveMenuItems = (item: SavedProduct) => {
    const menuItems: { key: string; label: string }[] = [];

    if (item.folderId) {
      menuItems.push({ key: 'uncategorized', label: 'Chưa phân loại' });
    }

    for (const folder of folders) {
      if (folder._id !== item.folderId) {
        menuItems.push({ key: folder._id, label: folder.name });
      }
    }

    return menuItems;
  };

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
            const moveItems = getMoveMenuItems(item);

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
                      {currentFolderId === null && item.folderId && folders.length > 0 ? (
                        <Tag color="default">
                          {folders.find((f) => f._id === item.folderId)?.name ?? ''}
                        </Tag>
                      ) : null}
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
                  <div className="flex gap-1">
                    {onMoveProduct && moveItems.length > 0 ? (
                      <Dropdown
                        menu={{
                          items: moveItems,
                          onClick: ({ key }) => {
                            onMoveProduct(item.subId2, key === 'uncategorized' ? null : key);
                          },
                        }}
                        trigger={['click']}
                      >
                        <Button size="small" icon={<SwapOutlined />}>
                          Chuyển
                        </Button>
                      </Dropdown>
                    ) : null}
                    <Button size="small" onClick={() => onToggleSave(item.subId2)}>
                      Bỏ lưu
                    </Button>
                  </div>
                </div>
              </List.Item>
            );
          }}
        />
      )}
    </Card>
  );
}
