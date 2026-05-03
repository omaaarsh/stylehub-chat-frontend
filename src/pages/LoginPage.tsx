import { Link } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';

export function LoginPage() {
  return (
    <>
      <LoginForm />
      <p className="text-center text-sm text-gray-500 mt-4">
        No account?{' '}
        <Link to="/register" className="text-blue-600 hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </>
  );
}
