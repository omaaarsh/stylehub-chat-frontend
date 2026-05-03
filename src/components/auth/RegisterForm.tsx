import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';

const schema = z
  .object({
    email: z.string().email('Invalid email'),
    password: z
      .string()
      .min(6, 'Min 6 characters')
      .regex(/[A-Z]/, 'Must contain uppercase')
      .regex(/[a-z]/, 'Must contain lowercase')
      .regex(/[0-9]/, 'Must contain number')
      .regex(/[@$!%*?&]/, 'Must contain a special character (@$!%*?&)'),
    confirmationPassword: z.string(),
    role: z.enum(['USER', 'BRAND']),
  })
  .refine((d) => d.password === d.confirmationPassword, {
    message: 'Passwords do not match',
    path: ['confirmationPassword'],
  });

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'USER' },
  });

  const role = watch('role');

  const onSubmit = async (data: FormValues) => {
    try {
      await authApi.register(data);
      setSuccess(true);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 409) {
        setError('root', { message: 'This email is already registered.' });
      } else {
        setError('root', { message: 'Registration failed. Please try again.' });
      }
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-3">
        <div className="text-4xl">📧</div>
        <p className="font-medium text-gray-900">Check your inbox</p>
        <p className="text-sm text-gray-500">
          We sent a verification link to your email. Click it to activate your account.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex rounded-lg border border-gray-200 p-1 gap-1">
        {(['USER', 'BRAND'] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setValue('role', r)}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              role === r ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {r === 'USER' ? 'User' : 'Brand'}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          {...register('email')}
          type="email"
          placeholder="you@example.com"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          {...register('password')}
          type="password"
          placeholder="••••••••"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
        <input
          {...register('confirmationPassword')}
          type="password"
          placeholder="••••••••"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.confirmationPassword && (
          <p className="text-red-500 text-xs mt-1">{errors.confirmationPassword.message}</p>
        )}
      </div>

      {errors.root && (
        <p className="text-red-500 text-sm text-center">{errors.root.message}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}
