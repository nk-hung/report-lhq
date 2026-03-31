import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import api from '../api/axios';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types';

export function useLogin() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const res = await api.post<AuthResponse>('/auth/login', data);
      return res.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.data.access_token);
      message.success('Đăng nhập thành công');
      navigate('/dashboard');
    },
    onError: () => {
      message.error('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const res = await api.post('/auth/register', data);
      return res.data;
    },
    onSuccess: () => {
      message.success('Đăng ký thành công. Vui lòng đăng nhập.');
      navigate('/login');
    },
    onError: () => {
      message.error('Đăng ký thất bại. Vui lòng thử lại.');
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();

  return () => {
    localStorage.removeItem('token');
    message.success('Đã đăng xuất');
    navigate('/login');
  };
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('token');
}
