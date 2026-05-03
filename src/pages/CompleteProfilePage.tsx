import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { userApi } from '../api/user.api';
import { brandApi } from '../api/brand.api';
import { useAuthStore } from '../stores/auth.store';

const userSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  bio: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
});

const brandSchema = z.object({
  brandName: z.string().min(1, 'Brand name is required'),
  username: z.string().min(1, 'Username is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  bio: z.string().optional(),
  websiteUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type UserFormValues = z.infer<typeof userSchema>;
type BrandFormValues = z.infer<typeof brandSchema>;

// ---------------------------------------------------------------------------
// Shared avatar picker — click the circle to pick a photo, shows preview
// ---------------------------------------------------------------------------
interface AvatarPickerProps {
  previewUrl: string | null;
  onChange: (file: File) => void;
}

function AvatarPicker({ previewUrl, onChange }: AvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onChange(file);
  };

  return (
    <div className="flex flex-col items-center gap-2 mb-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Upload profile photo"
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Profile preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full gap-1 text-gray-400">
            <Camera size={22} />
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera size={18} className="text-white" />
        </div>
      </button>
      <p className="text-xs text-gray-400">{previewUrl ? 'Click to change photo' : 'Add profile photo'}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

function UserProfileForm() {
  const navigate = useNavigate();
  const updateUser = useAuthStore((s) => s.updateUser);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Revoke object URL on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handlePhotoChange = (file: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPhotoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<UserFormValues>({ resolver: zodResolver(userSchema) });

  const onSubmit = async (data: UserFormValues) => {
    try {
      const cleaned = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== '' && v !== undefined),
      ) as UserFormValues;
      await userApi.completeProfile(cleaned);
      if (photoFile) {
        await userApi.uploadImage(photoFile);
      }
      updateUser({ isProfileComplete: true });
      navigate('/');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 409) {
        setError('username', { message: 'Username already taken.' });
      } else {
        setError('root', { message: 'Failed to save profile. Please try again.' });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <AvatarPicker previewUrl={previewUrl} onChange={handlePhotoChange} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Username <span className="text-red-500">*</span>
        </label>
        <input
          {...register('username')}
          placeholder="john_doe"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
          <input
            {...register('firstName')}
            placeholder="John"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
          <input
            {...register('lastName')}
            placeholder="Doe"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
        <input
          {...register('phoneNumber')}
          placeholder="+1234567890"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
        <textarea
          {...register('bio')}
          rows={3}
          placeholder="Tell us about yourself…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
        <select
          {...register('gender')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Prefer not to say</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
          <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
        </select>
      </div>

      {errors.root && <p className="text-red-500 text-sm text-center">{errors.root.message}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? 'Saving…' : 'Continue'}
      </button>
    </form>
  );
}

function BrandProfileForm() {
  const navigate = useNavigate();
  const updateUser = useAuthStore((s) => s.updateUser);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handlePhotoChange = (file: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPhotoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<BrandFormValues>({ resolver: zodResolver(brandSchema) });

  const onSubmit = async (data: BrandFormValues) => {
    try {
      const cleaned = { ...data, websiteUrl: data.websiteUrl || undefined };
      await brandApi.completeProfile(cleaned);
      if (photoFile) {
        await brandApi.uploadImage(photoFile);
      }
      updateUser({ isProfileComplete: true });
      navigate('/');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 409) {
        setError('username', { message: 'Username already taken.' });
      } else {
        setError('root', { message: 'Failed to save profile. Please try again.' });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <AvatarPicker previewUrl={previewUrl} onChange={handlePhotoChange} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Brand name <span className="text-red-500">*</span>
        </label>
        <input
          {...register('brandName')}
          placeholder="StyleCo"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Username <span className="text-red-500">*</span>
        </label>
        <input
          {...register('username')}
          placeholder="styleco_official"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone number <span className="text-red-500">*</span>
        </label>
        <input
          {...register('phoneNumber')}
          placeholder="+1234567890"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
        <textarea
          {...register('bio')}
          rows={3}
          placeholder="Describe your brand…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
        <input
          {...register('websiteUrl')}
          placeholder="https://yourbrand.com"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.websiteUrl && <p className="text-red-500 text-xs mt-1">{errors.websiteUrl.message}</p>}
      </div>

      {errors.root && <p className="text-red-500 text-sm text-center">{errors.root.message}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? 'Saving…' : 'Continue'}
      </button>
    </form>
  );
}

export function CompleteProfilePage() {
  const { role } = useParams<{ role: string }>();
  const isBrand = role === 'brand';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">StyleHub</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isBrand ? 'Set up your brand profile' : 'Complete your profile'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Required before accessing the app.</p>
        </div>
        {isBrand ? <BrandProfileForm /> : <UserProfileForm />}
      </div>
    </div>
  );
}
