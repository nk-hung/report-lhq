import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  UploadOutlined,
  BarChartOutlined,
  SaveOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useLogout } from '../hooks/useAuth';

const { Header, Sider, Content } = Layout;

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useLogout();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
    },
    {
      key: '/import',
      icon: <UploadOutlined />,
      label: 'Nhập liệu',
    },
    {
      key: '/report',
      icon: <BarChartOutlined />,
      label: 'Báo cáo',
    },
    {
      key: '/saved-products',
      icon: <SaveOutlined />,
      label: 'Sản phẩm đã lưu',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
    },
  ];

  const handleMenuClick = (info: { key: string }) => {
    if (info.key === 'logout') {
      logout();
    } else {
      navigate(info.key);
    }
  };

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
      >
        <div className="flex items-center justify-center h-16 text-white font-bold text-lg">
          {collapsed ? 'CR' : 'Camp Report'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header className="bg-white px-4 flex items-center shadow-sm" style={{ padding: '0 16px' }}>
          <span
            className="cursor-pointer text-lg"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </span>
          <span className="ml-4 font-semibold text-lg">Camp Report App</span>
        </Header>
        <Content className="m-4 min-h-70">
          <div className="min-w-0 rounded-lg bg-white p-6">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
