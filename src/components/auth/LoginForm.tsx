import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../stores/auth.store';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['USER', 'BRAND']),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);

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
      const res = await authApi.login(data);
      setTokens(res.accessToken, res.refreshToken);
      navigate('/');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 401) {
        setError('root', { message: 'Wrong password or email not verified. Check your inbox.' });
      } else if (status === 404) {
        setError('root', { message: 'Account not found.' });
      } else {
        setError('root', { message: 'Login failed. Please try again.' });
      }
    }
  };

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

      <div className="text-right -mt-2">
        <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
          Forgot password?
        </Link>
      </div>

      {errors.root && (
        <p className="text-red-500 text-sm text-center">{errors.root.message}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
