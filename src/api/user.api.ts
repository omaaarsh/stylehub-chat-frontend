import { api } from '../lib/axios';
import type {
  UserProfile,
  BrandProfile,
  CompleteUserProfileRequest,
  UpdateUserProfileRequest,
} from '../types/profile.types';

export const userApi = {
  /** Fetch any participant's public profile by their user/brand id. */
  getPublicProfile: (id: string): Promise<UserProfile | BrandProfile> =>
    api.get<UserProfile | BrandProfile>(`/search/account/${id}`).then((r) => r.data),

  completeProfile: (data: CompleteUserProfileRequest): Promise<UserProfile> =>
    api.post<UserProfile>('/user/complete-profile', data).then((r) => r.data),

  getProfile: (): Promise<UserProfile> =>
    api.get<UserProfile>('/user/profile').then((r) => r.data),

  updateProfile: (data: UpdateUserProfileRequest): Promise<UserProfile> =>
    api.patch<UserProfile>('/user/profile', data).then((r) => r.data),

  uploadImage: (file: File): Promise<{ message: string }> => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post('/user/profile/image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  getImageUrl: (): Promise<string> =>
    api.get<string>('/user/profile/image').then((r) => r.data),

  deleteAccount: (): Promise<{ message: string }> =>
    api.delete('/user/account').then((r) => r.data),
};
