import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFinanceContext } from '../contexts/FinanceContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa';
import { Alert } from './components/ui/alert';
import { WifiOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle, resetPassword, isOffline, offlineError } = useAuth();
  const { updateUser } = useFinanceContext();
  const navigate = useNavigate();

  useEffect(() => {
    // Clear error when online status changes
    setError('');
  }, [isOffline]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isOffline) {
      setError("Cannot log in while offline. Please check your internet connection.");
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else if (error.message.includes('offline')) {
        setError(error.message);
      } else {
        setError('Failed to log in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isOffline) {
      setError("Cannot log in with Google while offline. Please check your internet connection.");
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      const user = await loginWithGoogle();
      updateUser(user);
      navigate('/dashboard');
    } catch (error) {
      if (error.message.includes('offline')) {
        setError(error.message);
      } else {
        setError('Failed to log in with Google. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (isOffline) {
      setError("Cannot reset password while offline. Please check your internet connection.");
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      await resetPassword(email);
      setShowForgotPassword(false);
      alert('Password reset email sent. Check your inbox.');
    } catch (error) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>

        {isOffline && (
          <Alert variant="destructive" className="mb-4">
            <WifiOff className="h-4 w-4" />
            <div className="ml-2">
              You are currently offline. Sign in requires an internet connection.
            </div>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            {error}
          </Alert>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input type="hidden" name="remember" value="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <button
                type="button"
                onClick={() => setShowForgotPassword(!showForgotPassword)}
                className="font-medium text-indigo-600 hover:text-indigo-500"
                disabled={isLoading}
              >
                Forgot your password?
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        {showForgotPassword && (
          <form onSubmit={handleForgotPassword} className="mt-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              className={`mt-3 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleLogin}
              className={`w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isOffline || isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isOffline || isLoading}
            >
              <FaGoogle className="text-red-500 mr-2" />
              {isLoading ? 'Signing in with Google...' : 'Sign in with Google'}
            </button>
            {isOffline && (
              <p className="mt-2 text-xs text-center text-gray-500">
                Google Sign In requires an internet connection
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link 
            to="/signup" 
            className={`font-medium text-indigo-600 hover:text-indigo-500 ${
              isLoading ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            Don't have an account? Sign up
          </Link>
        </div>

        {/* Offline status indicator */}
        {isOffline && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-md bg-yellow-50 text-yellow-800">
              <WifiOff className="h-4 w-4 mr-2" />
              <span className="text-sm">
                You are currently offline. Some features may be unavailable.
              </span>
            </div>
          </div>
        )}

        {/* Loading state overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-md shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Please wait...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
