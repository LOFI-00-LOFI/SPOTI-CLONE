import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import logo from "../assests/logo.png";

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('prefer-not-to-say');

  const { signup, loading, error, clearError } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await signup(email, password, displayName, dateOfBirth, gender);
      success('Account created successfully! Welcome to Spotify.');
      navigate('/');
    } catch (err: any) {
      showError(err.message || 'Failed to create account. Please try again.');
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
          Sign up to start listening
        </h1>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-white text-sm font-medium mb-2">
              What's your email?
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full bg-[#121212] border border-gray-600 text-white px-4 py-3 rounded-md focus:border-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-white text-sm font-medium mb-2">
              Create a password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="w-full bg-[#121212] border border-gray-600 text-white px-4 py-3 rounded-md focus:border-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="displayName" className="block text-white text-sm font-medium mb-2">
              What should we call you?
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter a profile name"
              className="w-full bg-[#121212] border border-gray-600 text-white px-4 py-3 rounded-md focus:border-white focus:outline-none"
              required
            />
            <p className="text-gray-400 text-xs mt-1">This appears on your profile.</p>
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="block text-white text-sm font-medium mb-2">
              What's your date of birth?
            </label>
            <input
              type="date"
              id="dateOfBirth"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full bg-[#121212] border border-gray-600 text-white px-4 py-3 rounded-md focus:border-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="gender" className="block text-white text-sm font-medium mb-2">
              What's your gender?
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-[#121212] border border-gray-600 text-white px-4 py-3 rounded-md focus:border-white focus:outline-none appearance-none"
            >
              <option value="prefer-not-to-say">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password || !displayName}
            className="w-full bg-green-500 text-black py-3 px-8 rounded-full font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center mt-8 pb-4">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-white hover:underline font-medium"
            >
              Log in here
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

export default SignupPage;