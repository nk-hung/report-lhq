import { useState } from 'react';
import { Button, Typography, message, Card, Upload } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const { Title } = Typography;
const { Dragger } = Upload;

export default function ImportPage() {
  const [shopeeFile, setShopeeFile] = useState<UploadFile[]>([]);
  const [affiliateFile, setAffiliateFile] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

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

  return (
    <div>
      <Title level={3}>Import Files</Title>
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

        <Card title="File Affiliate Commission (.xlsx / .csv)">
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
    </div>
  );
}
