import { Card, Typography } from 'antd';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../hooks/useAuth';

const { Text } = Typography;

export default function RegisterPage() {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg text-center">
        <Text>
          Chức năng tự đăng ký đã tắt. Vui lòng liên hệ super admin để được tạo tài khoản.
        </Text>
      </Card>
    </div>
  );
}
