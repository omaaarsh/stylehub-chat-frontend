import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">StyleHub</h1>
          <p className="text-sm text-gray-500 mt-1">Social Media Service</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
