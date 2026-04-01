import { useState } from 'react';
import { Button, Typography, message, Card, Upload, Table, Popconfirm } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import { InboxOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useImportSessions } from '../hooks/useImportSessions';
import type { ImportSession } from '../types';

const { Title } = Typography;
const { Dragger } = Upload;

export default function ImportPage() {
  const [shopeeFile, setShopeeFile] = useState<UploadFile[]>([]);
  const [affiliateFile, setAffiliateFile] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { sessions, isLoading: sessionsLoading, deleteSession, isDeleting } = useImportSessions();

  const handleUpload = async () => {
    if (shopeeFile.length === 0 || affiliateFile.length === 0) {
      message.warning('Vui lòng chọn cả 2 file trước khi upload.');
      return;
    }

    const formData = new FormData();
    formData.append('shopeeFile', shopeeFile[0].originFileObj as File);
    formData.append('affiliateFile', affiliateFile[0].originFileObj as File);

    setUploading(true);
    try {
      await api.post('/import/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      message.success('Upload thành công!');
      setShopeeFile([]);
      setAffiliateFile([]);
      navigate('/report');
    } catch {
      message.error('Upload thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      message.success('Đã xóa dữ liệu thành công!');
    } catch {
      message.error('Xóa thất bại. Vui lòng thử lại.');
    }
  };

  const sessionColumns = [
    {
      title: 'Ngày import',
      dataIndex: 'importDate',
      key: 'importDate',
      render: (val: string) => new Date(val).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Lần thứ',
      dataIndex: 'importOrder',
      key: 'importOrder',
    },
    {
      title: 'Số bản ghi',
      dataIndex: 'recordCount',
      key: 'recordCount',
    },
    {
      title: '',
      key: 'action',
      width: 80,
      render: (_: unknown, record: ImportSession) => (
        <Popconfirm
          title="Xóa dữ liệu ngày này?"
          description={`Sẽ xóa ${record.recordCount} bản ghi của ngày ${new Date(record.importDate).toLocaleDateString('vi-VN')}`}
          onConfirm={() => void handleDelete(record._id)}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            disabled={isDeleting}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Nhập file dữ liệu</Title>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card title="File Hộ Kinh Doanh (.xlsx / .csv)">
          <Dragger
            accept=".xlsx,.xls,.csv"
            maxCount={1}
            fileList={shopeeFile}
            beforeUpload={() => false}
            onChange={(info: Parameters<NonNullable<UploadProps['onChange']>>[0]) => setShopeeFile(info.fileList)}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Kéo thả hoặc click để chọn file .xlsx hoặc .csv
            </p>
            <p className="ant-upload-hint">File Hộ Kinh Doanh từ Shopee</p>
          </Dragger>
        </Card>

        <Card title="File Hoa hồng Affiliate (.xlsx / .csv)">
          <Dragger
            accept=".xlsx,.xls,.csv"
            maxCount={1}
            fileList={affiliateFile}
            beforeUpload={() => false}
            onChange={(info: Parameters<NonNullable<UploadProps['onChange']>>[0]) => setAffiliateFile(info.fileList)}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Kéo thả hoặc click để chọn file .xlsx hoặc .csv
            </p>
            <p className="ant-upload-hint">File AffiliateCommissionReport</p>
          </Dragger>
        </Card>
      </div>

      <div className="mt-6 text-center">
        <Button
          type="primary"
          size="large"
          onClick={handleUpload}
          loading={uploading}
          disabled={shopeeFile.length === 0 || affiliateFile.length === 0}
        >
          Upload & Xử lý
        </Button>
      </div>

      {sessions.length > 0 && (
        <Card title="Lịch sử import" className="mt-8">
          <Table
            dataSource={sessions}
            columns={sessionColumns}
            rowKey="_id"
            loading={sessionsLoading}
            pagination={false}
            size="small"
          />
        </Card>
      )}
    </div>
  );
}
