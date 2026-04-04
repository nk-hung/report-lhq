import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Typography, Popconfirm, Tag, Card, Space } from 'antd';
import {
  UserAddOutlined,
  DeleteOutlined,
  LockOutlined,
  UserOutlined,
  KeyOutlined,
  TeamOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useUsers, useCreateUser, useDeleteUser } from '../hooks/useAuth';
import type { UserInfo } from '../types';

const { Title, Text } = Typography;

export default function AdminUsersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { data: users, isLoading } = useUsers();
  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();
  const userList = users ?? [];
  const superAdminCount = userList.filter((user) => user.role === 'superadmin').length;
  const normalUserCount = userList.filter((user) => user.role !== 'superadmin').length;

  const generatePassword = () => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%^&*_+-=';
    const all = upper + lower + digits + special;

    // Ensure at least 1 of each required type
    const required = [
      upper[Math.floor(Math.random() * upper.length)],
      lower[Math.floor(Math.random() * lower.length)],
      digits[Math.floor(Math.random() * digits.length)],
      special[Math.floor(Math.random() * special.length)],
    ];

    // Fill remaining with random chars
    for (let i = required.length; i < 12; i++) {
      required.push(all[Math.floor(Math.random() * all.length)]);
    }

    // Shuffle
    const password = required.sort(() => Math.random() - 0.5).join('');
    form.setFieldsValue({ password });
    form.validateFields(['password']);
  };

  const handleCreate = async (values: { username: string; password: string }) => {
    await createUserMutation.mutateAsync(values);
    setIsModalOpen(false);
    form.resetFields();
  };

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'superadmin' ? 'red' : 'blue'}>
          {role === 'superadmin' ? 'Super Admin' : 'User'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: unknown, record: UserInfo) => (
        record.role !== 'superadmin' ? (
          <Popconfirm
            title="Xóa tài khoản này?"
            description={`Bạn có chắc muốn xóa "${record.username}"?`}
            onConfirm={() => deleteUserMutation.mutate(record._id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              loading={deleteUserMutation.isPending}
            >
              Xóa
            </Button>
          </Popconfirm>
        ) : null
      ),
    },
  ];

  return (
    <div className="admin-users-page">
      <div className="admin-users-hero mb-4">
        <div>
          <Text className="admin-users-eyebrow">User Administration</Text>
          <Title level={3} style={{ margin: '6px 0 4px' }}>Quản lý tài khoản</Title>
          <Text type="secondary">Tạo, kiểm soát và bảo vệ tài khoản người dùng trong hệ thống báo cáo.</Text>
        </div>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={() => setIsModalOpen(true)}
          className="admin-users-cta"
        >
          Tạo tài khoản
        </Button>
      </div>

      <div className="admin-users-stats-grid mb-4">
        <Card className="admin-users-stat-card" variant="borderless">
          <Text type="secondary">Tổng tài khoản</Text>
          <div className="admin-users-stat-value"><TeamOutlined /> {userList.length}</div>
          <Text className="admin-users-stat-caption">Tất cả user trong hệ thống</Text>
        </Card>
        <Card className="admin-users-stat-card" variant="borderless">
          <Text type="secondary">Super Admin</Text>
          <div className="admin-users-stat-value"><CrownOutlined /> {superAdminCount}</div>
          <Text className="admin-users-stat-caption">Tài khoản có quyền cao nhất</Text>
        </Card>
        <Card className="admin-users-stat-card" variant="borderless">
          <Text type="secondary">Người dùng thường</Text>
          <div className="admin-users-stat-value"><SafetyCertificateOutlined /> {normalUserCount}</div>
          <Text className="admin-users-stat-caption">Có thể đăng nhập và sử dụng tính năng</Text>
        </Card>
      </div>

      <div className="admin-users-table-wrap">
        <div className="admin-users-table-head">
          <Title level={5} style={{ margin: 0 }}>Danh sách tài khoản</Title>
          <Tag color="blue">{userList.length} user</Tag>
        </div>
        <Table
          columns={columns}
          dataSource={userList}
          loading={isLoading}
          rowKey="_id"
          pagination={false}
          className="admin-users-table"
        />
      </div>

      <Modal
        title="Tạo tài khoản mới"
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        footer={null}
        className="admin-users-modal"
      >
        <Form
          form={form}
          onFinish={handleCreate}
          layout="vertical"
          className="mt-4"
        >
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[
              { required: true, message: 'Vui lòng nhập tên đăng nhập' },
              { min: 3, message: 'Tối thiểu 3 ký tự' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" />
          </Form.Item>
          <Form.Item
            name="password"
            label={
              <div className="flex justify-between w-full">
                <span>Mật khẩu</span>
                <Button type="link" size="small" icon={<KeyOutlined />} onClick={generatePassword} className="!p-0 !h-auto">
                  Tạo mật khẩu
                </Button>
              </div>
            }
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
              { min: 8, message: 'Tối thiểu 8 ký tự' },
              { pattern: /[A-Z]/, message: 'Cần ít nhất 1 chữ in hoa' },
              { pattern: /[a-z]/, message: 'Cần ít nhất 1 chữ thường' },
              { pattern: /[0-9]/, message: 'Cần ít nhất 1 chữ số' },
              { pattern: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/, message: 'Cần ít nhất 1 ký tự đặc biệt (!@#$%...)' },
            ]}
          >
            <Input prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>
          <Form.Item className="mb-0">
            <div className="admin-users-modal-actions">
              <Space>
                <Button onClick={() => { setIsModalOpen(false); form.resetFields(); }}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={createUserMutation.isPending}>
                  Tạo tài khoản
                </Button>
              </Space>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
