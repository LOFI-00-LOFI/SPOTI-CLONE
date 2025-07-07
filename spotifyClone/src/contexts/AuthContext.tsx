import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  profileImage?: string;
  isPremium: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string, dateOfBirth?: string, gender?: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  clearError: () => void;
}

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  
  const isAuthenticated = !!user && !!token;

  // Load user from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        const userStr = localStorage.getItem('auth_user');
        
        if (storedToken && userStr) {
          try {
            const storedUser = JSON.parse(userStr);
            
            // Verify token is still valid by calling /me endpoint
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
              headers: {
                'Authorization': `Bearer ${storedToken}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const data = await response.json();
              setUser(data.user);
              setToken(storedToken);
            } else {
              // Token is invalid, clear stored data
              localStorage.removeItem('auth_token');
              localStorage.removeItem('auth_user');
            }
          } catch (error) {
            console.error('Error parsing stored user data:', error);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false); // Always set loading to false when done
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (emailOrUsername: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrUsername, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store in localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));

      // Update state
      setUser(data.user);
      setToken(data.token);
      setLoading(false);
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
      throw error;
    }
  };


  // Signup function
  const signup = async (
    email: string,
    password: string,
    displayName: string,
    dateOfBirth?: string,
    gender?: string
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          displayName,
          dateOfBirth,
          gender,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // Store in localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));

      // Update state
      setUser(data.user);
      setToken(data.token);
      setLoading(false);
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
      throw error;
    }
  };

  // Logout function
  const logout = (): void => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    setToken(null);
    setError(null);
  };

  // Update user function
  const updateUser = (newUser: User): void => {
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  // Clear error function
  const clearError = (): void => {
    setError(null);
  };

  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login,
    signup,
    logout,
    updateUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to get auth headers for API requests
export const getAuthHeaders = (): { Authorization?: string } => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}; 