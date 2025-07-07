
import { useState, useEffect, createContext, useContext } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ThinSidebar from "@/components/ThinSidebar";
import MainContent from "@/components/MainContent";
import RightSidebar from "@/components/RightSidebar";
import MusicPlayer from "@/components/MusicPlayer";
import DraggableMiniPlayer from "@/components/DraggableMiniPlayer";
import LikedSongsPage from "@/components/LikedSongsPage";
import PlaylistPage from "@/components/PlaylistPage";
import UploadMusic from "@/components/UploadMusic";

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

const Index = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [currentView, setCurrentView] = useState<CurrentView>('home');
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string>();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // Changed to tablet breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleHomeClick = () => {
    setCurrentView('home');
    setCurrentPlaylistId(undefined);
  };

  const handleViewChange = (view: CurrentView, playlistId?: string) => {
    setCurrentView(view);
    setCurrentPlaylistId(playlistId);
  };

  const renderMainContent = () => {
    switch (currentView) {
      case 'liked-songs':
        return <LikedSongsPage searchQuery={searchQuery} />;
      case 'playlist':
        return currentPlaylistId ? (
          <PlaylistPage playlistId={currentPlaylistId} searchQuery={searchQuery} />
        ) : (
          <MainContent searchQuery={searchQuery} />
        );
      case 'home':
      default:
        return <MainContent searchQuery={searchQuery} />;
    }
  };

  return (
    <NavigationContext.Provider value={{ currentView, currentPlaylistId, setCurrentView: handleViewChange }}>
      <div className="h-screen bg-[#000000] text-white flex  flex-col overflow-hidden">
        {/* Full Width Header */}
        <Header searchQuery={searchQuery} onSearchChange={handleSearch} onHomeClick={handleHomeClick} />

        <div className="flex gap-x-2 flex-1 min-h-0 px-2">
          {/* Left Sidebar */}
          {isMobile ? <ThinSidebar /> : <Sidebar />}
          
          {/* Main Content */}
          {renderMainContent()}
          
          {/* Right Sidebar */}
          {!isMobile && <RightSidebar />}
        </div>
        
        {/* Music Player */}
        <MusicPlayer />
        
        {/* Draggable Mini Player for Mobile/Tablet */}
        {isMobile && <DraggableMiniPlayer />}
      </div>
    </NavigationContext.Provider>
  );
};

export default Index;
