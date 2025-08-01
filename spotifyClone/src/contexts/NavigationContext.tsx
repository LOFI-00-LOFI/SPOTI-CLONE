import { createContext, useContext, useState, ReactNode } from 'react';

type CurrentView = 'home' | 'liked-songs' | 'playlist';

interface NavigationContextType {
  currentView: CurrentView;
  currentPlaylistId?: string;
  setCurrentView: (view: CurrentView, playlistId?: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider = ({ children }: NavigationProviderProps) => {
  const [currentView, setCurrentView] = useState<CurrentView>('home');
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string>();

  const handleViewChange = (view: CurrentView, playlistId?: string) => {
    setCurrentView(view);
    setCurrentPlaylistId(playlistId);
  };

  return (
    <NavigationContext.Provider value={{ currentView, currentPlaylistId, setCurrentView: handleViewChange }}>
      {children}
    </NavigationContext.Provider>
  );
}; 