import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth.api';

const schema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['USER', 'BRAND']),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: 'USER' } });

  const role = watch('role');

  const onSubmit = async (data: FormValues) => {
    await authApi.forgotPassword(data);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">StyleHub</h1>
          <p className="text-sm text-gray-500 mt-1">Reset your password</p>
        </div>

        {sent ? (
          <div className="text-center space-y-3">
            <p className="font-medium text-gray-900">Check your email</p>
            <p className="text-sm text-gray-500">
              If this account exists, we sent a 6-digit reset code to your inbox.
            </p>
            <Link to="/reset-password" className="inline-block mt-2 text-sm text-blue-600 hover:underline">
              Enter reset code
            </Link>
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Sending…' : 'Send reset code'}
            </button>

            <p className="text-center text-sm text-gray-500">
              <Link to="/login" className="text-blue-600 hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
