import { useState } from 'react';
import { Modal, Select, Input, Button, Space, Divider, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ProductFolder } from '../types';

interface SaveFolderModalProps {
  open: boolean;
  subId2: string;
  folders: ProductFolder[];
  onSave: (subId2: string, folderId?: string | null) => void;
  onCreateFolder: (name: string) => Promise<ProductFolder>;
  onCancel: () => void;
}

export default function SaveFolderModal({
  open,
  subId2,
  folders,
  onSave,
  onCreateFolder,
  onCancel,
}: SaveFolderModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSave = () => {
    onSave(subId2, selectedFolderId);
    setSelectedFolderId(null);
    setNewFolderName('');
  };

  const handleSaveUncategorized = () => {
    onSave(subId2, null);
    setSelectedFolderId(null);
    setNewFolderName('');
  };

  const handleCreateFolder = async () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;

    setCreating(true);
    try {
      const folder = await onCreateFolder(trimmed);
      setSelectedFolderId(folder._id);
      setNewFolderName('');
      message.success(`Đã tạo folder "${trimmed}"`);
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    setSelectedFolderId(null);
    setNewFolderName('');
    onCancel();
  };

  return (
    <Modal
      title={`Lưu mã hàng hóa: ${subId2}`}
      open={open}
      onCancel={handleCancel}
      footer={
        <Space>
          <Button onClick={handleCancel}>Hủy</Button>
          <Button onClick={handleSaveUncategorized}>Lưu không phân loại</Button>
          <Button type="primary" onClick={handleSave} disabled={!selectedFolderId}>
            Lưu vào folder
          </Button>
        </Space>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Chọn folder:</label>
          <Select
            className="w-full"
            placeholder="Chọn folder..."
            value={selectedFolderId}
            onChange={setSelectedFolderId}
            options={folders.map((f) => ({ label: f.name, value: f._id }))}
            allowClear
            dropdownRender={(menu) => (
              <>
                {menu}
                <Divider className="my-2" />
                <div className="flex gap-2 px-2 pb-2">
                  <Input
                    placeholder="Tên folder mới"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onPressEnter={handleCreateFolder}
                    size="small"
                  />
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={handleCreateFolder}
                    loading={creating}
                    size="small"
                  >
                    Tạo
                  </Button>
                </div>
              </>
            )}
          />
        </div>
      </div>
    </Modal>
  );
}
