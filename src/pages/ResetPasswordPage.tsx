import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';

const schema = z
  .object({
    email: z.string().email('Invalid email'),
    role: z.enum(['USER', 'BRAND']),
    token: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Digits only'),
    newPassword: z
      .string()
      .min(6, 'Min 6 characters')
      .regex(/[A-Z]/, 'Must contain uppercase')
      .regex(/[a-z]/, 'Must contain lowercase')
      .regex(/[0-9]/, 'Must contain number')
      .regex(/[@$!%*?&]/, 'Must contain a special character (@$!%*?&)'),
    newConfirmationPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.newConfirmationPassword, {
    message: 'Passwords do not match',
    path: ['newConfirmationPassword'],
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: 'USER' } });

  const role = watch('role');

  const onSubmit = async (data: FormValues) => {
    try {
      await authApi.resetPassword(data);
      setSuccess(true);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 400) {
        setError('root', { message: 'Invalid or expired code. Please request a new one.' });
      } else {
        setError('root', { message: 'Something went wrong. Please try again.' });
      }
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8 text-center space-y-4">
          <h1 className="text-2xl font-semibold text-gray-900">StyleHub</h1>
          <p className="font-medium text-gray-900">Password reset!</p>
          <p className="text-sm text-gray-500">Your password has been updated. You can now sign in.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-gray-900 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">StyleHub</h1>
          <p className="text-sm text-gray-500 mt-1">Set a new password</p>
        </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">6-digit reset code</label>
            <input
              {...register('token')}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest text-center"
            />
            {errors.token && <p className="text-red-500 text-xs mt-1">{errors.token.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <input
              {...register('newPassword')}
              type="password"
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
            <input
              {...register('newConfirmationPassword')}
              type="password"
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.newConfirmationPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.newConfirmationPassword.message}</p>
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
            {isSubmitting ? 'Resetting…' : 'Reset password'}
          </button>

          <p className="text-center text-sm text-gray-500">
            <Link to="/login" className="text-blue-600 hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
