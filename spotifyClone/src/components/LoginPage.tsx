import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logo from "../assests/logo.png";

const LoginPage: React.FC = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(emailOrUsername, password);
      navigate('/');
    } catch (err: any) {
      // Error is handled by context
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Spotify Logo */}
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Spotify Logo" className="h-16 w-16" />
        </div>

        {/* Title */}
        <h1 className="text-white text-3xl font-bold text-center mb-8">
          Log in to Spotify
        </h1>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="emailOrUsername" className="block text-white text-sm font-medium mb-2">
              Email or username
            </label>
            <input
              type="text"
              id="emailOrUsername"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              placeholder="Email or username"
              className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded-md focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-white text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded-md focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-black py-3 px-4 rounded-full font-bold hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* Demo Credentials */}
        {/* <div className="mt-8 p-4 bg-gray-900 rounded-md border border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Demo credentials:</p>
          <p className="text-white text-sm">Email: test@example.com</p>
          <p className="text-white text-sm">Password: testpass123</p>
        </div> */}

        {/* Signup Link */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-white underline hover:text-green-500"
            >
              Sign up for Spotify
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;