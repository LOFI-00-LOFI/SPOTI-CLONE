import { Play, Music } from "lucide-react";
import { useState, useEffect } from "react";
import TrackList from "./TrackList";
import SongCardGrid from "./SongCardGrid";
import SongCardCarousel from "./SongCardCarousel";
import { usePopularTracks, useFeaturedTracks, useNewReleases, useSearchTracks } from "@/hooks/useApi";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";
import { usePlaylist } from "@/contexts/PlaylistContext";
import { useNavigation } from "@/pages/Index";

interface MainContentProps {
  searchQuery: string;
}

type TabType = 'all' | 'music';

const MainContent = ({ searchQuery }: MainContentProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [currentOverlayGradient, setCurrentOverlayGradient] = useState('');
  const { playQueue } = useMusicPlayer();
  const { isAuthenticated } = useAuth();
  const { requireAuth } = useAuthPrompt();
  const { state: playlistState, loadPlaylists } = usePlaylist();
  const { setCurrentView } = useNavigation();

  // Predefined gradient colors for different hover states
  const gradientOverlays = [
    'linear-gradient(to bottom, rgba(42, 31, 61, 0.8), rgba(31, 26, 46, 0.6), rgba(18, 18, 18, 0))', // Bright Purple
    'linear-gradient(to bottom, rgba(45, 27, 27, 0.8), rgba(36, 24, 24, 0.6), rgba(18, 18, 18, 0))', // Bright Red
    'linear-gradient(to bottom, rgba(27, 45, 31, 0.8), rgba(24, 36, 25, 0.6), rgba(18, 18, 18, 0))', // Bright Green
    'linear-gradient(to bottom, rgba(45, 36, 27, 0.8), rgba(36, 31, 24, 0.6), rgba(18, 18, 18, 0))', // Bright Orange
    'linear-gradient(to bottom, rgba(27, 36, 45, 0.8), rgba(24, 31, 36, 0.6), rgba(18, 18, 18, 0))', // Bright Blue
    'linear-gradient(to bottom, rgba(45, 33, 27, 0.8), rgba(36, 28, 24, 0.6), rgba(18, 18, 18, 0))', // Bright Brown
    'linear-gradient(to bottom, rgba(45, 27, 36, 0.8), rgba(36, 24, 31, 0.6), rgba(18, 18, 18, 0))', // Bright Pink
    'linear-gradient(to bottom, rgba(33, 27, 45, 0.8), rgba(28, 24, 36, 0.6), rgba(18, 18, 18, 0))', // Bright Indigo
    'linear-gradient(to bottom, rgba(31, 45, 27, 0.8), rgba(26, 36, 24, 0.6), rgba(18, 18, 18, 0))', // Bright Emerald
    'linear-gradient(to bottom, rgba(45, 27, 42, 0.8), rgba(36, 24, 33, 0.6), rgba(18, 18, 18, 0))', // Bright Magenta
  ];

  const handleCardHover = (index: number) => {
    const colorIndex = index % gradientOverlays.length;
    setCurrentOverlayGradient(gradientOverlays[colorIndex]);
    setOverlayOpacity(1);
  };

  const handleCardLeave = () => {
    setOverlayOpacity(0);
  };

  // API hooks
  const { data: popularTracks, isLoading: loadingPopular } = usePopularTracks(12);
  const { data: featuredTracks, isLoading: loadingFeatured } = useFeaturedTracks(50);
  const { data: newReleases, isLoading: loadingNew } = useNewReleases(10);
  const { data: searchResults, isLoading: loadingSearch, error: searchError } = useSearchTracks(searchQuery, searchQuery.length > 0);

  const quickPlayTracks = popularTracks?.results.slice(0, 6) || [];
  
  const handlePlayAlbum = (tracks: any[]) => {
    if (tracks.length > 0) {
      if (!isAuthenticated) {
        requireAuth('play', () => playQueue(tracks), tracks[0]?.name);
      } else {
        playQueue(tracks);
      }
    }
  };

  // Public playlists are loaded automatically by PlaylistProvider on mount

  const handlePlaylistClick = (playlistId: string) => {
    setCurrentView('playlist', playlistId);
  };

  // Use public playlists directly from state
  const publicPlaylists = playlistState.publicPlaylists;

  return (
    <div 
      className="flex-1 text-white overflow-y-auto rounded-xl relative bg-[#121212]"
    >
      {/* Color overlay that fades in/out */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: currentOverlayGradient,
          opacity: overlayOpacity,
          transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      ></div>
      
      <div className="min-h-full relative">
        <main className="p-6 relative z-10">
          {/* Filter tabs */}
          <div className="flex space-x-2 mb-6">
            <button 
              className={`rounded-full px-4 py-2 text-sm font-medium inline-flex items-center justify-center ${
                activeTab === 'all' 
                  ? 'bg-white text-black hover:bg-gray-200' 
                  : 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]'
              }`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button 
              className={`rounded-full px-4 py-2 text-sm inline-flex items-center justify-center ${
                activeTab === 'music'
                  ? 'bg-white text-black hover:bg-gray-200'
                  : 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]'
              }`}
              onClick={() => setActiveTab('music')}
            >
              Music
            </button>
          </div>

          {/* Search Results */}
          {searchQuery && searchQuery.length > 0 && (
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Search Results</h2>
              {loadingSearch ? (
                <div className="text-center py-8">
                  <div className="text-[#a7a7a7]">Searching...</div>
                </div>
              ) : searchError ? (
                <div className="text-center py-8">
                  <div className="text-[#ff6b6b]">Error searching: {searchError.message}</div>
                  <p className="text-[#a7a7a7] mt-2">Please try again</p>
                </div>
              ) : searchResults && searchResults.results.length > 0 ? (
                <SongCardGrid 
                  tracks={searchResults.results} 
                  onCardHover={handleCardHover}
                  onCardLeave={handleCardLeave}
                />
              ) : (
                <div className="text-center py-8">
                  <div className="text-[#a7a7a7]">No results found for "{searchQuery}"</div>
                  <p className="text-[#b3b3b3] mt-2">Try uploading some music to get started!</p>
                </div>
              )}
            </section>
          )}

          {/* Quick Play Grid - Only show when not searching */}
          {!searchQuery && quickPlayTracks.length > 0 && (
            <section className="mb-8">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {quickPlayTracks.map((track, index) => (
                  <div
                    key={track.id}
                    className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-4 flex items-center gap-4 transition-all duration-300 cursor-pointer"
                    onClick={() => handlePlayAlbum([track])}
                    onMouseEnter={() => handleCardHover(index)}
                    onMouseLeave={handleCardLeave}
                  >
                    <div className="w-12 h-12 rounded overflow-hidden relative flex-shrink-0">
                      {/* Default gradient background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                        <div className="text-white text-lg font-bold opacity-80">
                          {track.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      
                      {/* Image overlay */}
                      {track.album_image || track.image ? (
                        <img
                          src={track.album_image || track.image}
                          alt={track.name}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{track.name}</h3>
                      <p className="text-sm text-white/70 truncate">{track.artist_name}</p>
                    </div>
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#1db954] hover:bg-[#1ed760] rounded-full h-10 w-10 inline-flex items-center justify-center"
                    >
                      <Play className="h-4 w-4 text-black fill-current" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* No music uploaded message */}
          {!searchQuery && quickPlayTracks.length === 0 && !loadingPopular && (
            <section className="mb-8">
              <div className="text-center py-16">
                <div className="text-[#a7a7a7] text-lg mb-4">No music uploaded yet</div>
                <p className="text-[#b3b3b3]">Upload your first track to get started!</p>
              </div>
            </section>
          )}

          {/* Content based on active tab */}
          {!searchQuery && activeTab === 'all' && (
            <>
              {/* Featured Tracks */}
              {featuredTracks && featuredTracks.results.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Featured Tracks</h2>
                  </div>
                  {loadingFeatured ? (
                    <div className="text-center py-8">
                      <div className="text-[#a7a7a7]">Loading featured tracks...</div>
                    </div>
                  ) : (
                    <SongCardCarousel 
                      tracks={featuredTracks.results} 
                      onCardLeave={handleCardLeave}
                    />
                  )}
                </section>
              )}

              {/* New Releases */}
              {newReleases && newReleases.results.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">New Releases</h2>
                  </div>
                  {loadingNew ? (
                    <div className="text-center py-8">
                      <div className="text-[#a7a7a7]">Loading new releases...</div>
                    </div>
                  ) : (
                    <SongCardCarousel 
                      tracks={newReleases.results} 
                      onCardLeave={handleCardLeave}
                    />
                  )}
                </section>
              )}

              {/* All Popular Tracks */}
              {popularTracks && popularTracks.results.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Popular Tracks</h2>
                  </div>
                  {loadingPopular ? (
                    <div className="text-center py-8">
                      <div className="text-[#a7a7a7]">Loading popular tracks...</div>
                    </div>
                  ) : (
                    <TrackList tracks={popularTracks.results} />
                  )}
                </section>
              )}
            </>
          )}

          {/* Music Tab Content */}
          {!searchQuery && activeTab === 'music' && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">All Music</h2>
              </div>
              {loadingPopular ? (
                <div className="text-center py-8">
                  <div className="text-[#a7a7a7]">Loading music...</div>
                </div>
              ) : popularTracks && popularTracks.results.length > 0 ? (
                <TrackList tracks={popularTracks.results} />
              ) : (
                <div className="text-center py-16">
                  <div className="text-[#a7a7a7] text-lg mb-4">No music available</div>
                  <p className="text-[#b3b3b3]">Upload some tracks to see them here!</p>
                </div>
              )}
            </section>
          )}

          {/* Public Playlists */}
          {publicPlaylists.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Public Playlists</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {publicPlaylists.map((playlist, index) => (
                  <div
                    key={playlist._id}
                    className="group bg-[#1a1a1a] hover:bg-[#2a2a2a] p-4 rounded-lg cursor-pointer transition-all duration-300"
                    onClick={() => handlePlaylistClick(playlist._id)}
                    onMouseEnter={() => handleCardHover(index)}
                    onMouseLeave={handleCardLeave}
                  >
                    <div className="w-full aspect-square rounded-lg mb-4 overflow-hidden relative">
                      {playlist.image ? (
                        <img
                          src={playlist.image}
                          alt={playlist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: playlist.backgroundColor || '#404040' }}
                        >
                          <Music className="h-12 w-12 text-white opacity-70" />
                        </div>
                      )}
                      <button
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1db954] hover:bg-[#1ed760] rounded-full h-12 w-12 flex items-center justify-center transform translate-y-2 group-hover:translate-y-0 transition-transform"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle play playlist
                        }}
                      >
                        <Play className="h-5 w-5 text-black fill-current ml-0.5" />
                      </button>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-white text-sm mb-1 truncate">{playlist.name}</h3>
                      <p className="text-xs text-[#a7a7a7] truncate">
                        {playlist.description || `${playlist.trackCount || 0} songs`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default MainContent;
