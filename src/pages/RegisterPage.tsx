import { Link } from 'react-router-dom';
import { RegisterForm } from '../components/auth/RegisterForm';

export function RegisterPage() {
  return (
    <>
      <RegisterForm />
      <p className="text-center text-sm text-gray-500 mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </>
  );
}
