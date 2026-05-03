import { api } from '../lib/axios';
import type {
  BrandProfile,
  CompleteBrandProfileRequest,
  UpdateBrandProfileRequest,
} from '../types/profile.types';

export const brandApi = {
  completeProfile: (data: CompleteBrandProfileRequest): Promise<BrandProfile> =>
    api.post<BrandProfile>('/brand/complete-profile', data).then((r) => r.data),

  getProfile: (): Promise<BrandProfile> =>
    api.get<BrandProfile>('/brand/profile').then((r) => r.data),

  updateProfile: (data: UpdateBrandProfileRequest): Promise<BrandProfile> =>
    api.patch<BrandProfile>('/brand/profile', data).then((r) => r.data),

  uploadImage: (file: File): Promise<{ message: string }> => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post('/brand/profile/image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  getImageUrl: (): Promise<string> =>
    api.get<string>('/brand/profile/image').then((r) => r.data),

  deleteAccount: (): Promise<{ message: string }> =>
    api.delete('/brand/account').then((r) => r.data),
};
