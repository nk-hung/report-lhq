import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  UploadOutlined,
  BarChartOutlined,
  SaveOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useLogout, isSuperAdmin, getUsername } from '../hooks/useAuth';

const { Header, Sider, Content } = Layout;

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useLogout();

  const menuItems = [
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
    ...(isSuperAdmin() ? [{
      key: '/admin/users',
      icon: <TeamOutlined />,
      label: 'Quản lý user',
    }] : []),
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
        style={{ minHeight: '100vh' }}
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
        <Header className="px-4 flex items-center shadow-sm" style={{ padding: '0 16px', background: '#001529' }}>
          <span
            className="cursor-pointer text-lg text-white"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </span>
          <span className="ml-4 font-semibold text-lg text-white">Camp Report App</span>
          <span className="ml-auto text-white text-sm opacity-75">{getUsername()}</span>
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
