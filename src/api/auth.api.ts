import { api } from '../lib/axios';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../types/auth.types';

export const authApi = {
  login: (data: LoginRequest): Promise<AuthResponse> =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterRequest): Promise<void> =>
    api.post('/auth/register', data).then(() => undefined),

  logout: (): Promise<void> =>
    api.post('/auth/logout').then(() => undefined),

  verifyEmail: (token: string): Promise<{ message: string }> =>
    api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`).then((r) => r.data),

  forgotPassword: (data: ForgotPasswordRequest): Promise<{ message: string }> =>
    api.post('/auth/forgot-password', data).then((r) => r.data),

  resetPassword: (data: ResetPasswordRequest): Promise<{ message: string }> =>
    api.post('/auth/reset-password', data).then((r) => r.data),
};
