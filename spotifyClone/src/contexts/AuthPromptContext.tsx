import React, { createContext, useContext, useState, ReactNode } from 'react';
import AuthPrompt from '@/components/AuthPrompt';
import { useAuth } from './AuthContext';

interface AuthPromptContextType {
  showAuthPrompt: (action: 'play' | 'upload' | 'playlist' | 'like' | 'download', trackName?: string) => void;
  requireAuth: (action: 'play' | 'upload' | 'playlist' | 'like' | 'download', callback: () => void, trackName?: string) => void;
}

const AuthPromptContext = createContext<AuthPromptContextType | undefined>(undefined);

export const AuthPromptProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentAction, setCurrentAction] = useState<'play' | 'upload' | 'playlist' | 'like' | 'download'>('play');
  const [currentTrackName, setCurrentTrackName] = useState<string>();
  const { isAuthenticated } = useAuth();

  const showAuthPrompt = (action: 'play' | 'upload' | 'playlist' | 'like' | 'download', trackName?: string) => {
    setCurrentAction(action);
    setCurrentTrackName(trackName);
    setShowPrompt(true);
  };

  const requireAuth = (
    action: 'play' | 'upload' | 'playlist' | 'like' | 'download',
    callback: () => void,
    trackName?: string
  ) => {
    if (isAuthenticated) {
      callback();
    } else {
      showAuthPrompt(action, trackName);
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
    setCurrentTrackName(undefined);
  };

  return (
    <AuthPromptContext.Provider value={{ showAuthPrompt, requireAuth }}>
      {children}
      {showPrompt && (
        <AuthPrompt 
          onClose={handleClose} 
          action={currentAction} 
          trackName={currentTrackName}
        />
      )}
    </AuthPromptContext.Provider>
  );
};

export const useAuthPrompt = (): AuthPromptContextType => {
  const context = useContext(AuthPromptContext);
  if (!context) {
    throw new Error('useAuthPrompt must be used within an AuthPromptProvider');
  }
  return context;
};