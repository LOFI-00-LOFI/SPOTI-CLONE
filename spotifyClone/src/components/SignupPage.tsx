import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logo from "../assests/logo.png";

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('prefer-not-to-say');

  const { signup, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await signup(email, password, displayName, dateOfBirth, gender);
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
        <h1 className="text-white text-3xl font-bold text-center mb-2">
          Sign up to
        </h1>
        <h1 className="text-white text-3xl font-bold text-center mb-8">
          start listening
        </h1>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-white text-sm font-bold mb-2">
              Email address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded-md focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-white text-sm font-bold mb-2">
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

          <div>
            <label htmlFor="displayName" className="block text-white text-sm font-bold mb-2">
              What should we call you?
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter a profile name"
              className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded-md focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            />
            <p className="text-gray-400 text-xs mt-1">This appears on your profile.</p>
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="block text-white text-sm font-bold mb-2">
              What's your date of birth?
            </label>
            <input
              type="date"
              id="dateOfBirth"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded-md focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="gender" className="block text-white text-sm font-bold mb-2">
              What's your gender?
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded-md focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
            className="w-full bg-green-500 text-black py-3 px-4 rounded-full font-bold hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-white underline hover:text-green-500"
            >
              Log in here.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;