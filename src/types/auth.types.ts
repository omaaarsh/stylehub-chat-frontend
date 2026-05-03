export type UserRole = 'USER' | 'BRAND';

export interface LoginRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface ForgotPasswordRequest {
  email: string;
  role: UserRole;
}

export interface ResetPasswordRequest {
  email: string;
  role: UserRole;
  token: string;
  newPassword: string;
  newConfirmationPassword: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmationPassword: string;
  role: UserRole;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isProfileComplete: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  isProfileComplete: boolean;
  iat: number;
  exp: number;
}
