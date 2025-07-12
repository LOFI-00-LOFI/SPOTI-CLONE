import React from 'react';
import { MusicPlayerProvider } from '@/contexts/MusicPlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthPrompt } from '@/contexts/AuthPromptContext';

interface MusicPlayerWrapperProps {
  children: React.ReactNode;
}

const MusicPlayerWrapper: React.FC<MusicPlayerWrapperProps> = ({ children }) => {
  return (
    <MusicPlayerProvider>
      {children}
    </MusicPlayerProvider>
  );
};

export default MusicPlayerWrapper;