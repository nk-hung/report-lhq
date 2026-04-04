import { useEffect, useState } from 'react';
import { Button, Typography, message, Card, Upload, Table, Popconfirm, Space, Tag, Alert } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import {
  InboxOutlined,
  DeleteOutlined,
  WalletOutlined,
  LineChartOutlined,
  CloudUploadOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileDoneOutlined,
  CalendarOutlined,
  DatabaseOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useImportSessions } from '../hooks/useImportSessions';
import type { ImportSession } from '../types';

const { Title, Text } = Typography;
const { Dragger } = Upload;

function formatFileSize(size?: number): string {
  if (!size || size <= 0) return '0 KB';
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function formatImportDate(value: string): string {
  return new Date(value).toLocaleDateString('vi-VN');
}

export default function ImportPage() {
  const [shopeeFile, setShopeeFile] = useState<UploadFile[]>([]);
  const [affiliateFile, setAffiliateFile] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(5);
  const navigate = useNavigate();
  const { sessions, isLoading: sessionsLoading, deleteSession, isDeleting } = useImportSessions();

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(sessions.length / historyPageSize));
    if (historyPage > totalPages) {
      setHistoryPage(totalPages);
    }
  }, [historyPage, historyPageSize, sessions.length]);

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

  const hasExpenseFile = shopeeFile.length > 0;
  const hasRevenueFile = affiliateFile.length > 0;
  const readyCount = Number(hasExpenseFile) + Number(hasRevenueFile);
  const canUpload = hasExpenseFile && hasRevenueFile && !uploading;
  const latestSession = sessions[0];
  const totalImportedRecords = sessions.reduce((sum, item) => sum + item.recordCount, 0);

  const importFlow = [
    {
      key: 'pick',
      title: 'Chọn file nguồn',
      description: 'Thêm đủ file Chi Phí và Doanh Thu đúng định dạng.',
      done: readyCount > 0,
    },
    {
      key: 'validate',
      title: 'Kiểm tra trạng thái',
      description: 'Hệ thống xác nhận đủ 2 file trước khi xử lý.',
      done: readyCount === 2,
    },
    {
      key: 'upload',
      title: 'Upload & đối soát',
      description: 'Đẩy dữ liệu lên server và chuyển sang trang báo cáo.',
      done: false,
    },
  ];

  const sessionColumns = [
    {
      title: 'Ngày import',
      dataIndex: 'importDate',
      key: 'importDate',
      render: (val: string) => (
        <div className="import-date-cell">
          <Text strong>{formatImportDate(val)}</Text>
          <Text type="secondary">{new Date(val).toLocaleDateString('vi-VN', { weekday: 'long' })}</Text>
        </div>
      ),
    },
    {
      title: 'Lần thứ',
      dataIndex: 'importOrder',
      key: 'importOrder',
      render: (value: number) => <Tag color="blue">#{value}</Tag>,
    },
    {
      title: 'Số bản ghi',
      dataIndex: 'recordCount',
      key: 'recordCount',
      render: (value: number) => (
        <span className="import-record-pill">
          <DatabaseOutlined /> {value}
        </span>
      ),
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
    <div className="import-page">
      <section className="import-primary-stage">
        <div className="import-hero import-hero-compact">
          <div>
            <Text className="import-eyebrow">Data Intake</Text>
            <Title level={2} style={{ margin: '8px 0 6px' }}>Nhập file dữ liệu</Title>
            <Text type="secondary">
              Chọn đủ 2 file để xử lý ngay. Khu vực upload được đưa lên trung tâm để thao tác nhanh hơn.
            </Text>
          </div>
          <Space wrap>
            <Tag color={readyCount === 2 ? 'success' : 'processing'} icon={<CheckCircleOutlined />}>
              Đã chọn {readyCount}/2 file
            </Tag>
            <Tag color="blue" icon={<CloudUploadOutlined />}>Upload an toàn</Tag>
          </Space>
        </div>

        <div className="import-upload-stage-grid">
          <Card
            className="import-upload-card"
            title={
              <Space>
                <WalletOutlined className="text-[#9f1239]" />
                <span>File Chi Phí (.xlsx / .csv)</span>
              </Space>
            }
          >
            <Dragger
              accept=".xlsx,.xls,.csv"
              maxCount={1}
              fileList={shopeeFile}
              beforeUpload={() => false}
              className="import-dragger"
              onChange={(info: Parameters<NonNullable<UploadProps['onChange']>>[0]) => setShopeeFile(info.fileList)}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Kéo thả hoặc click để chọn file .xlsx hoặc .csv
              </p>
              <p className="ant-upload-hint">Nguồn từ báo cáo chi tiêu chiến dịch</p>
            </Dragger>
            {hasExpenseFile ? (
              <div className="import-file-meta mt-3">
                <Text strong>{shopeeFile[0].name}</Text>
                <Text type="secondary">Dung lượng: {formatFileSize(shopeeFile[0].size)}</Text>
                <Text type="secondary"><FileDoneOutlined /> Trạng thái: Sẵn sàng</Text>
              </div>
            ) : (
              <Text type="secondary" className="mt-3 block">Chưa chọn file Chi Phí.</Text>
            )}
          </Card>

          <Card
            className="import-upload-card"
            title={
              <Space>
                <LineChartOutlined className="text-[#166534]" />
                <span>File Doanh Thu (.xlsx / .csv)</span>
              </Space>
            }
          >
            <Dragger
              accept=".xlsx,.xls,.csv"
              maxCount={1}
              fileList={affiliateFile}
              beforeUpload={() => false}
              className="import-dragger"
              onChange={(info: Parameters<NonNullable<UploadProps['onChange']>>[0]) => setAffiliateFile(info.fileList)}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Kéo thả hoặc click để chọn file .xlsx hoặc .csv
              </p>
              <p className="ant-upload-hint">Nguồn từ báo cáo hoa hồng Affiliate</p>
            </Dragger>
            {hasRevenueFile ? (
              <div className="import-file-meta mt-3">
                <Text strong>{affiliateFile[0].name}</Text>
                <Text type="secondary">Dung lượng: {formatFileSize(affiliateFile[0].size)}</Text>
                <Text type="secondary"><FileDoneOutlined /> Trạng thái: Sẵn sàng</Text>
              </div>
            ) : (
              <Text type="secondary" className="mt-3 block">Chưa chọn file Doanh Thu.</Text>
            )}
          </Card>
        </div>

        <Card className="import-submit-card import-submit-card-compact" variant="borderless">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>Sẵn sàng xử lý dữ liệu</Text>
              <Text type="secondary">Cần đủ 2 file để bắt đầu upload và đối soát dữ liệu.</Text>
            </div>
            <Tag color={canUpload ? 'success' : 'warning'} icon={canUpload ? <CheckCircleOutlined /> : <ClockCircleOutlined />}>
              Trạng thái: {canUpload ? 'Sẵn sàng upload' : 'Thiếu file'}
            </Tag>
          </div>

          <div className="import-action-panel mt-4">
            <div className="import-action-metrics">
              <span className="import-action-chip">
                <FileDoneOutlined /> Chi Phí: {hasExpenseFile ? 'Đã chọn' : 'Chưa chọn'}
              </span>
              <span className="import-action-chip">
                <FileDoneOutlined /> Doanh Thu: {hasRevenueFile ? 'Đã chọn' : 'Chưa chọn'}
              </span>
            </div>
            <Space wrap>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setShopeeFile([]);
                  setAffiliateFile([]);
                }}
                disabled={uploading || readyCount === 0}
              >
                Xóa file đã chọn
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={handleUpload}
                loading={uploading}
                disabled={!canUpload}
                icon={<CloudUploadOutlined />}
                className="import-upload-cta"
              >
                Upload & Xử lý
              </Button>
            </Space>
          </div>
        </Card>
      </section>

      <Alert
        showIcon
        type="info"
        className="mt-6"
        message="Hỗ trợ định dạng .xlsx, .xls, .csv"
        description="Sau khi upload thành công, hệ thống sẽ tự chuyển đến trang báo cáo để bạn kiểm tra dữ liệu."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        <Card className="import-stat-card" variant="borderless">
          <Text type="secondary">Tiến độ chọn file</Text>
          <div className="import-stat-value">{readyCount}/2</div>
          <Text className="import-stat-caption">{readyCount === 2 ? 'Sẵn sàng xử lý' : 'Đang chờ đủ dữ liệu'}</Text>
        </Card>
        <Card className="import-stat-card" variant="borderless">
          <Text type="secondary">Lần import gần nhất</Text>
          <div className="import-stat-value">{latestSession ? `#${latestSession.importOrder}` : '--'}</div>
          <Text className="import-stat-caption">
            {latestSession ? new Date(latestSession.importDate).toLocaleDateString('vi-VN') : 'Chưa có lịch sử import'}
          </Text>
        </Card>
        <Card className="import-stat-card" variant="borderless">
          <Text type="secondary">Bản ghi gần nhất</Text>
          <div className="import-stat-value">{latestSession ? latestSession.recordCount : 0}</div>
          <Text className="import-stat-caption">Số bản ghi trong lần import mới nhất</Text>
        </Card>
      </div>

      <Card className="import-flow-card mt-5" variant="borderless">
        <div className="import-flow-grid">
          {importFlow.map((step, index) => (
            <div key={step.key} className={`import-flow-step ${step.done ? 'is-done' : ''}`}>
              <div className="import-flow-marker">{step.done ? <CheckCircleOutlined /> : index + 1}</div>
              <div>
                <Text strong>{step.title}</Text>
                <Text type="secondary" className="block">{step.description}</Text>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {sessions.length > 0 && (
        <Card
          title={
            <div className="import-history-title">
              <Space>
                <HistoryOutlined />
                <span>Lịch sử import</span>
              </Space>
              <Space size={8} wrap>
                <Tag icon={<CalendarOutlined />} color="blue">{sessions.length} phiên</Tag>
                <Tag icon={<DatabaseOutlined />} color="cyan">{totalImportedRecords} bản ghi</Tag>
              </Space>
            </div>
          }
          className="mt-8 import-history-card"
        >
          <Table
            dataSource={sessions}
            columns={sessionColumns}
            rowKey="_id"
            loading={sessionsLoading}
            pagination={{
              current: historyPage,
              pageSize: historyPageSize,
              total: sessions.length,
              showSizeChanger: true,
              pageSizeOptions: ['5', '10', '20'],
              showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} phiên`,
              onChange: (page, pageSize) => {
                setHistoryPage(page);
                setHistoryPageSize(pageSize);
              },
            }}
            size="small"
            scroll={{ x: 520 }}
            className="import-history-table"
          />
        </Card>
      )}
    </div>
  );
}
