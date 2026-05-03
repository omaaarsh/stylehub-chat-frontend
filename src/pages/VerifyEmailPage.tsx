import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../api/auth.api';

type Status = 'loading' | 'success' | 'error';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      return;
    }
    authApi
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [params]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8 text-center space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">StyleHub</h1>

        {status === 'loading' && (
          <p className="text-sm text-gray-500">Verifying your email…</p>
        )}

        {status === 'success' && (
          <>
            <p className="font-medium text-gray-900">Email verified!</p>
            <p className="text-sm text-gray-500">Your account is now active. You can sign in.</p>
            <Link
              to="/login"
              className="inline-block mt-2 bg-gray-900 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Sign in
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="font-medium text-gray-900">Invalid or expired link</p>
            <p className="text-sm text-gray-500">
              The verification link is invalid or has expired. Please register again.
            </p>
            <Link
              to="/register"
              className="inline-block mt-2 text-sm text-blue-600 hover:underline"
            >
              Back to sign up
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
