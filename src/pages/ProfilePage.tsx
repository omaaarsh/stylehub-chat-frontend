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
  gender: z
    .enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'])
    .optional()
    .or(z.literal('')),
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

/* ================= USER ================= */

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
          gender: (profile.gender as any) ?? '',
        }
      : undefined,
  });

  const onSubmit = async (data: UserFormValues) => {
    try {
      const cleanedData = {
        ...data,
        gender: data.gender === '' ? undefined : data.gender,
      };

      await updateMutation.mutateAsync(
        Object.fromEntries(Object.entries(cleanedData).filter(([, v]) => v !== '')) as UserFormValues
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

  if (isLoading) return <p className="text-sm text-gray-500 text-center py-8">Loading profile…</p>;

  return (
    <div>
      <ProfileImageUpload imageUrl={imageUrl ?? undefined} onUpload={handleUpload} />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <input {...register('username')} placeholder="Username" />

        <select {...register('gender')}>
          <option value="">Prefer not to say</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>

        <button disabled={isSubmitting || !isDirty}>
          {isSubmitting ? 'Saving…' : 'Save'}
        </button>
      </form>

      {deleteConfirm ? (
        <div>
          <button onClick={handleDelete}>Confirm delete</button>
          <button onClick={() => setDeleteConfirm(false)}>Cancel</button>
        </div>
      ) : (
        <button onClick={() => setDeleteConfirm(true)}>Delete account</button>
      )}
    </div>
  );
}

/* ================= BRAND ================= */

function BrandProfileSection() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['brandProfile'],
    queryFn: brandApi.getProfile,
  });

  const updateMutation = useMutation({
    mutationFn: brandApi.updateProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brandProfile'] }),
  });

  const { register, handleSubmit } = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
  });

  const onSubmit = async (data: BrandFormValues) => {
    await updateMutation.mutateAsync({
      ...data,
      websiteUrl: data.websiteUrl || undefined,
    });
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('brandName')} />
      <button>Save</button>
    </form>
  );
}

/* ================= PAGE ================= */

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <div>
      <button onClick={handleLogout}>Logout</button>
      {user?.role === 'BRAND' ? <BrandProfileSection /> : <UserProfileSection />}
    </div>
  );
}