import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import api from '../api/axios';
import type { LoginRequest, RegisterRequest, AuthResponse, ApiResponse, UserInfo } from '../types';

export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const res = await api.post<AuthResponse>('/auth/login', data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.clear();
      localStorage.setItem('token', data.data.access_token);
      localStorage.setItem('role', data.data.role);
      localStorage.setItem('username', data.data.username);
      message.success('Đăng nhập thành công');
      navigate('/dashboard');
    },
    onError: () => {
      message.error('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return () => {
    queryClient.clear();
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    message.success('Đã đăng xuất');
    navigate('/login');
  };
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('token');
}

export function isSuperAdmin(): boolean {
  return localStorage.getItem('role') === 'superadmin';
}

export function getUsername(): string {
  return localStorage.getItem('username') || '';
}

// Admin: create user
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const res = await api.post('/auth/register', data);
      return res.data;
    },
    onSuccess: () => {
      message.success('Tạo tài khoản thành công');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => {
      message.error('Tạo tài khoản thất bại. Username có thể đã tồn tại.');
    },
  });
}

// Admin: list users
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<UserInfo[]>>('/auth/users');
      return res.data.data;
    },
    enabled: isSuperAdmin(),
  });
}

// Admin: delete user
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.delete(`/auth/users/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      message.success('Đã xóa tài khoản');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => {
      message.error('Xóa tài khoản thất bại');
    },
  });
}
