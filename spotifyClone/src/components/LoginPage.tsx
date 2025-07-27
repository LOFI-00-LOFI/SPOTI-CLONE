import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import logo from "../assests/logo.png";
import { LucideEye, LucideEyeOff } from 'lucide-react';


const LoginPage: React.FC = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error, clearError } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(emailOrUsername, password);
      success('Successfully logged in!');
      navigate('/');
    } catch (err: any) {
      showError(err.message || 'Failed to log in. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[600px] bg-black rounded-lg p-8">
        {/* Spotify Logo */}
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Spotify Logo" className="h-10" />
        </div>

        {/* Title */}
        <h1 className="text-white text-[2rem] font-bold text-center mb-10">
          Log in to Spotify
        </h1>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full bg-[#121212] border border-gray-600 text-white px-4 py-3 rounded-md focus:border-white focus:outline-none"
              required
            />
          </div>

          <div className="relative">
            <label htmlFor="password" className="block text-white text-sm font-medium mb-2">
              Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-[#121212] border border-gray-600 text-white px-4 py-3 rounded-md focus:border-white focus:outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[42px] text-gray-500 hover:text-white"
            >
              {showPassword ? <LucideEye className="w-5 h-5 text-gray-500 hover:text-white" /> : <LucideEyeOff className="w-5 h-5 text-gray-500 hover:text-white" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-black py-3 px-8 rounded-full font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Continue'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="#" className="text-white hover:underline text-sm font-medium">
            Forgot your password?
          </Link>
        </div>

        {/* Signup Link */}
        <div className="text-center mt-8 pb-4">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-white hover:underline font-medium"
            >
              Sign up for Spotify
            </Link>
          </p>
        </div>

        {/* Terms */}
        <div className="text-center mt-8 text-xs text-gray-400">
          <p>
            This site is protected by reCAPTCHA and the Google{' '}
            <a href="#" className="underline">Privacy Policy</a> and{' '}
            <a href="#" className="underline">Terms of Service</a> apply.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;