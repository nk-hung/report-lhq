import { useMemo, useState } from 'react';
import { Typography, Tabs, Button, Input, Modal, Dropdown, Badge, Card, Space, Tag } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  FolderOpenOutlined,
  AppstoreOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import SavedProductsPanel from '../components/SavedProductsPanel';
import { useHighlight } from '../hooks/useHighlight';
import { useCompareReport } from '../hooks/useReport';
import { useSavedProducts } from '../hooks/useSavedProducts';
import { useProductFolders } from '../hooks/useProductFolders';
import type { SavedProduct, SavedProductStats } from '../types';

const { Title, Text } = Typography;

export default function SavedProductsPage() {
  const navigate = useNavigate();
  const { highlightedSet, addHighlight } = useHighlight();
  const {
    savedProducts,
    toggleSavedProduct,
    moveProduct,
    isLoading: isSavedProductsLoading,
  } = useSavedProducts();
  const { folders, createFolder, renameFolder, deleteFolder } = useProductFolders();
  const { data: compareData } = useCompareReport();

  const [activeTab, setActiveTab] = useState('all');
  const [newFolderName, setNewFolderName] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState<{ id: string; name: string } | null>(null);
  const [renameName, setRenameName] = useState('');

  const statsBySubId = useMemo(() => {
    const stats: Record<string, SavedProductStats> = {};
    for (const record of compareData?.records ?? []) {
      if (!stats[record.subId]) {
        stats[record.subId] = {
          tcp: record.tcp,
          tdt: record.tdt,
          hq: record.tcp > 0 ? (record.tdt / record.tcp) * 100 : 0,
        };
      }
    }
    return stats;
  }, [compareData?.records]);

  const handleSelect = (subId2: string) => {
    void addHighlight(subId2);
    navigate('/report');
  };

  const uncategorizedProducts = savedProducts.filter((p) => !p.folderId);

  const productsByFolder = useMemo(() => {
    const map: Record<string, SavedProduct[]> = {};
    for (const folder of folders) {
      map[folder._id] = savedProducts.filter((p) => p.folderId === folder._id);
    }
    return map;
  }, [savedProducts, folders]);

  const getFilteredItems = (): SavedProduct[] => {
    if (activeTab === 'all') return savedProducts;
    if (activeTab === 'uncategorized') return uncategorizedProducts;
    return productsByFolder[activeTab] ?? [];
  };

  const handleCreateFolder = async () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    await createFolder(trimmed);
    setNewFolderName('');
    setCreateModalOpen(false);
  };

  const handleRename = async () => {
    if (!renameModalOpen) return;
    const trimmed = renameName.trim();
    if (!trimmed) return;
    await renameFolder(renameModalOpen.id, trimmed);
    setRenameModalOpen(null);
    setRenameName('');
  };

  const handleDeleteFolder = (folderId: string) => {
    Modal.confirm({
      title: 'Xóa folder',
      content: 'Sản phẩm trong folder sẽ chuyển về "Chưa phân loại". Bạn có chắc?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        await deleteFolder(folderId);
        if (activeTab === folderId) {
          setActiveTab('all');
        }
      },
    });
  };

  const handleMoveProduct = async (subId2: string, folderId: string | null) => {
    await moveProduct(subId2, folderId);
  };

  const filteredItems = getFilteredItems();
  const highlightedSavedCount = savedProducts.filter((product) => highlightedSet.has(product.subId2)).length;

  const tabItems = [
    {
      key: 'all',
      label: (
        <Badge count={savedProducts.length} size="small" offset={[8, 0]}>
          <span>Tất cả</span>
        </Badge>
      ),
    },
    {
      key: 'uncategorized',
      label: (
        <Badge count={uncategorizedProducts.length} size="small" offset={[8, 0]}>
          <span>Chưa phân loại</span>
        </Badge>
      ),
    },
    ...folders.map((folder) => ({
      key: folder._id,
      label: (
        <div className="flex items-center gap-1">
          <Badge count={productsByFolder[folder._id]?.length ?? 0} size="small" offset={[8, 0]}>
            <span>{folder.name}</span>
          </Badge>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'rename',
                  icon: <EditOutlined />,
                  label: 'Đổi tên',
                  onClick: (e) => {
                    e.domEvent.stopPropagation();
                    setRenameName(folder.name);
                    setRenameModalOpen({ id: folder._id, name: folder.name });
                  },
                },
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: 'Xóa folder',
                  danger: true,
                  onClick: (e) => {
                    e.domEvent.stopPropagation();
                    handleDeleteFolder(folder._id);
                  },
                },
              ],
            }}
            trigger={['click']}
          >
            <MoreOutlined
              className="ml-1 text-gray-400 hover:text-gray-600"
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        </div>
      ),
    })),
  ];

  return (
    <div className="saved-page space-y-4">
      <div className="saved-hero">
        <div>
          <Text className="saved-eyebrow">Saved Products</Text>
          <Title level={3} style={{ margin: '6px 0 4px' }}>
            Danh sách mã hàng đã lưu
          </Title>
          <Text type="secondary">
            Quản lý danh mục sản phẩm, di chuyển nhanh giữa folder và mở báo cáo chỉ với một click.
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
          Tạo folder
        </Button>
      </div>

      <div className="saved-metric-grid">
        <Card className="saved-metric-card" variant="borderless">
          <Text type="secondary">Tổng sản phẩm đã lưu</Text>
          <div className="saved-metric-value"><AppstoreOutlined /> {savedProducts.length}</div>
          <Text className="saved-metric-caption">Tất cả sản phẩm bookmark</Text>
        </Card>
        <Card className="saved-metric-card" variant="borderless">
          <Text type="secondary">Số folder</Text>
          <div className="saved-metric-value"><FolderOpenOutlined /> {folders.length}</div>
          <Text className="saved-metric-caption">Không tính tab hệ thống</Text>
        </Card>
        <Card className="saved-metric-card" variant="borderless">
          <Text type="secondary">Đang highlight</Text>
          <div className="saved-metric-value"><StarOutlined /> {highlightedSavedCount}</div>
          <Text className="saved-metric-caption">Trong số mã đã lưu</Text>
        </Card>
      </div>

      <div className="saved-tabs-wrap">
        <div className="saved-tabs-header">
          <Space wrap>
            <Tag color="blue">Đang xem: {activeTab === 'all' ? 'Tất cả' : activeTab === 'uncategorized' ? 'Chưa phân loại' : folders.find((f) => f._id === activeTab)?.name ?? 'Folder'}</Tag>
            <Tag color="cyan">Số lượng: {filteredItems.length}</Tag>
          </Space>
        </div>
        <Tabs className="saved-tabs" activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </div>

      <SavedProductsPanel
        items={filteredItems}
        highlightedSet={highlightedSet}
        statsBySubId={statsBySubId}
        loading={isSavedProductsLoading}
        folders={folders}
        currentFolderId={activeTab === 'all' || activeTab === 'uncategorized' ? null : activeTab}
        onSelect={handleSelect}
        onToggleSave={(subId2) => {
          void toggleSavedProduct(subId2);
        }}
        onMoveProduct={handleMoveProduct}
      />

      <Modal
        title="Tạo folder mới"
        open={createModalOpen}
        onOk={handleCreateFolder}
        onCancel={() => {
          setCreateModalOpen(false);
          setNewFolderName('');
        }}
        okText="Tạo"
        cancelText="Hủy"
      >
        <Input
          placeholder="Tên folder"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onPressEnter={handleCreateFolder}
          autoFocus
        />
      </Modal>

      <Modal
        title="Đổi tên folder"
        open={!!renameModalOpen}
        onOk={handleRename}
        onCancel={() => {
          setRenameModalOpen(null);
          setRenameName('');
        }}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Input
          placeholder="Tên folder mới"
          value={renameName}
          onChange={(e) => setRenameName(e.target.value)}
          onPressEnter={handleRename}
          autoFocus
        />
      </Modal>
    </div>
  );
}
