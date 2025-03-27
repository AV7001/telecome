import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Shield } from 'lucide-react';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Loading state
  const navigate = useNavigate();
  const signIn = useAuthStore(state => state.signIn);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); // Set loading to true when submitting
    setError(''); // Clear previous error

    try {
      await signIn(email, password);
      navigate('/admin');
    } catch (error: any) {
      setError(error?.message || 'Invalid credentials'); // Display specific error message
    } finally {
      setLoading(false); // Reset loading state after attempt
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-center mb-8">
            <Shield className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            Admin Login
          </h2>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading} // Disable input while loading
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading} // Disable input while loading
              />
            </div>
            <button
              type="submit"
              className={`w-full py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
              disabled={loading} // Disable button while loading
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link to="/user/login" className="text-blue-600 hover:text-blue-800">
              ← User Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
