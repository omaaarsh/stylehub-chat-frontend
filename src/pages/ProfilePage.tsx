import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/user.api';
import { brandApi } from '../api/brand.api';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../stores/auth.store';

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const userSchema = z.object({
  username: z.string().min(1, 'Required'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  bio: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY', '']).optional(),
});

const brandSchema = z.object({
  brandName: z.string().min(1, 'Required'),
  username: z.string().min(1, 'Required'),
  phoneNumber: z.string().min(1, 'Required'),
  bio: z.string().optional(),
  websiteUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type UserFormValues = z.infer<typeof userSchema>;
type BrandFormValues = z.infer<typeof brandSchema>;

function ProfileImageUpload({
  imageUrl,
  onUpload,
}: {
  imageUrl?: string;
  onUpload: (file: File) => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Only jpg, png, webp images allowed.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('File must be under 4 MB.');
      return;
    }
    setError('');
    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 mb-6">
      <div
        className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-200 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
        onClick={() => fileRef.current?.click()}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl text-gray-400">+</span>
        )}
      </div>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="text-xs text-blue-600 hover:underline"
        disabled={uploading}
      >
        {uploading ? 'Uploading…' : 'Change photo'}
      </button>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

function UserProfileSection() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: userApi.getProfile,
  });

  const { data: imageUrl, refetch: refetchImage } = useQuery({
    queryKey: ['userImage'],
    queryFn: userApi.getImageUrl,
  });

  const updateMutation = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userProfile'] }),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    setError,
    reset,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    values: profile
      ? {
          username: profile.username,
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          phoneNumber: profile.phoneNumber ?? '',
          bio: profile.bio ?? '',
          gender: profile.gender ?? '',
        }
      : undefined,
  });

  const onSubmit = async (data: UserFormValues) => {
    try {
      await updateMutation.mutateAsync(
        Object.fromEntries(Object.entries(data).filter(([, v]) => v !== '')) as UserFormValues,
      );
      reset(data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 409) setError('username', { message: 'Username already taken.' });
      else setError('root', { message: 'Update failed. Please try again.' });
    }
  };

  const handleUpload = async (file: File) => {
    await userApi.uploadImage(file);
    refetchImage();
  };

  const handleDelete = async () => {
    await userApi.deleteAccount();
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return <p className="text-sm text-gray-500 text-center py-8">Loading profile…</p>;
  }

  return (
    <div>
      <ProfileImageUpload imageUrl={imageUrl ?? undefined} onUpload={handleUpload} />
      <div className="text-center mb-6 text-xs text-gray-400">
        {profile?.numberOfFollowers ?? 0} followers · {profile?.numberOfFollowing ?? 0} following · {profile?.numberOfPosts ?? 0} posts
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input {...register('username')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
            <input {...register('firstName')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
            <input {...register('lastName')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input {...register('phoneNumber')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea {...register('bio')} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select {...register('gender')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Prefer not to say</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        {errors.root && <p className="text-red-500 text-sm text-center">{errors.root.message}</p>}
        <button type="submit" disabled={isSubmitting || !isDirty} className="bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-40 transition-colors">
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <div className="mt-8 border-t border-gray-100 pt-6">
        {!deleteConfirm ? (
          <button onClick={() => setDeleteConfirm(true)} className="w-full text-sm text-red-500 hover:text-red-700 py-2">
            Delete account
          </button>
        ) : (
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-700">This cannot be undone. Are you sure?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BrandProfileSection() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['brandProfile'],
    queryFn: brandApi.getProfile,
  });

  const { data: imageUrl, refetch: refetchImage } = useQuery({
    queryKey: ['brandImage'],
    queryFn: brandApi.getImageUrl,
  });

  const updateMutation = useMutation({
    mutationFn: brandApi.updateProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brandProfile'] }),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    setError,
    reset,
  } = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    values: profile
      ? {
          brandName: profile.brandName,
          username: profile.username,
          phoneNumber: profile.phoneNumber,
          bio: profile.bio ?? '',
          websiteUrl: profile.websiteUrl ?? '',
        }
      : undefined,
  });

  const onSubmit = async (data: BrandFormValues) => {
    try {
      await updateMutation.mutateAsync({ ...data, websiteUrl: data.websiteUrl || undefined });
      reset(data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 409) setError('username', { message: 'Username already taken.' });
      else setError('root', { message: 'Update failed. Please try again.' });
    }
  };

  const handleUpload = async (file: File) => {
    await brandApi.uploadImage(file);
    refetchImage();
  };

  const handleDelete = async () => {
    await brandApi.deleteAccount();
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return <p className="text-sm text-gray-500 text-center py-8">Loading profile…</p>;
  }

  return (
    <div>
      <ProfileImageUpload imageUrl={imageUrl ?? undefined} onUpload={handleUpload} />
      <div className="text-center mb-6 text-xs text-gray-400">
        {profile?.numberOfFollowers ?? 0} followers · {profile?.numberOfPosts ?? 0} posts
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand name</label>
          <input {...register('brandName')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input {...register('username')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input {...register('phoneNumber')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea {...register('bio')} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
          <input {...register('websiteUrl')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.websiteUrl && <p className="text-red-500 text-xs mt-1">{errors.websiteUrl.message}</p>}
        </div>
        {errors.root && <p className="text-red-500 text-sm text-center">{errors.root.message}</p>}
        <button type="submit" disabled={isSubmitting || !isDirty} className="bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-40 transition-colors">
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <div className="mt-8 border-t border-gray-100 pt-6">
        {!deleteConfirm ? (
          <button onClick={() => setDeleteConfirm(true)} className="w-full text-sm text-red-500 hover:text-red-700 py-2">
            Delete account
          </button>
        ) : (
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-700">This cannot be undone. Are you sure?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const isBrand = user?.role === 'BRAND';

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back
        </button>
        <h2 className="text-sm font-semibold text-gray-900">Profile</h2>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">
          Sign out
        </button>
      </header>
      <div className="max-w-md mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-4">
          {isBrand ? <BrandProfileSection /> : <UserProfileSection />}
        </div>
      </div>
    </div>
  );
}
