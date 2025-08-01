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
import { useNavigation } from "@/contexts/NavigationContext";
import { Track } from "@/types/track";
import { LocalTrack } from "@/types/api";

interface MainContentProps {
  searchQuery: string;
}

type TabType = 'all' | 'music';

// Skeleton components
const QuickPlaySkeleton = () => (
  <section className="mb-8">
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
      {Array(6).fill(0).map((_, index) => (
        <div
          key={index}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center gap-4 animate-pulse"
        >
          <div className="w-12 h-12 rounded bg-white/20"></div>
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-white/15 rounded w-1/2"></div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/15"></div>
        </div>
      ))}
    </div>
  </section>
);

const CarouselSkeleton = () => (
  <div className="flex gap-4 overflow-hidden">
    {Array(6).fill(0).map((_, index) => (
      <div key={index} className="flex-shrink-0 w-48 animate-pulse">
        <div className="w-full aspect-square rounded-lg bg-white/20 mb-4"></div>
        <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-white/15 rounded w-1/2"></div>
      </div>
    ))}
  </div>
);

const TrackListSkeleton = () => (
  <div className="space-y-2">
    {Array(8).fill(0).map((_, index) => (
      <div key={index} className="flex items-center gap-4 p-2 animate-pulse">
        <div className="w-4 h-4 bg-white/20 rounded"></div>
        <div className="w-12 h-12 rounded bg-white/20"></div>
        <div className="flex-1 min-w-0">
          <div className="h-4 bg-white/20 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-white/15 rounded w-1/4"></div>
        </div>
        <div className="h-3 bg-white/15 rounded w-20"></div>
        <div className="h-3 bg-white/15 rounded w-12"></div>
        <div className="w-8 h-8 bg-white/15 rounded"></div>
      </div>
    ))}
  </div>
);

const PlaylistGridSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
    {Array(10).fill(0).map((_, index) => (
      <div key={index} className="bg-[#1a1a1a] p-4 rounded-lg animate-pulse">
        <div className="w-full aspect-square rounded-lg bg-white/20 mb-4"></div>
        <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-white/15 rounded w-1/2"></div>
      </div>
    ))}
  </div>
);

const MainContent = ({ searchQuery }: MainContentProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [currentOverlayGradient, setCurrentOverlayGradient] = useState('');
  const { playQueue } = useMusicPlayer();
  const { isAuthenticated } = useAuth();
  const { requireAuth } = useAuthPrompt();
  const { state: playlistState, loadPlaylists } = usePlaylist();
  const { setCurrentView } = useNavigation();

  // Load playlists when component mounts and when auth status changes
  useEffect(() => {
    loadPlaylists();
  }, [isAuthenticated]);

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

  // Convert backend tracks to frontend format
  const convertToFrontendTrack = (track: LocalTrack): Track => ({
    id: track._id,
    name: track.title,
    artist_name: track.artist_name,
    album_name: track.album_name,
    duration: track.duration,
    audio: track.url,
    image: track.image || '/placeholder-album.jpg',
    album_image: track.image || '/placeholder-album.jpg',
    audiodownload_allowed: true,
    // Include backend properties
    _id: track._id,
    title: track.title,
    url: track.url,
    public_id: track.public_id,
    genre: track.genre,
    description: track.description,
    createdAt: track.createdAt,
    updatedAt: track.updatedAt
  });

  // API hooks
  const { data: popularTracks, isLoading: loadingPopular } = usePopularTracks(12);
  const { data: featuredTracks, isLoading: loadingFeatured } = useFeaturedTracks(50);
  const { data: newReleases, isLoading: loadingNew } = useNewReleases(10);
  const { data: searchResults, isLoading: loadingSearch, error: searchError } = useSearchTracks(searchQuery);

  const quickPlayTracks = popularTracks?.audios?.map(convertToFrontendTrack) || [];
  
  const handlePlayAlbum = (tracks: Track[]) => {
    if (tracks.length > 0) {
      if (!isAuthenticated) {
        requireAuth('play', () => playQueue(tracks, 0, 'general'), tracks[0]?.name);
      } else {
        playQueue(tracks, 0, 'general');
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {Array(8).fill(0).map((_, index) => (
                    <div key={index} className="bg-[#1a1a1a] p-4 rounded-lg animate-pulse">
                      <div className="w-full aspect-square rounded-lg bg-white/20 mb-4"></div>
                      <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-white/15 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : searchError ? (
                <div className="text-center py-8">
                  <div className="text-[#ff6b6b]">Error searching: {searchError.message}</div>
                  <p className="text-[#a7a7a7] mt-2">Please try again</p>
                </div>
              ) : searchResults && searchResults.audios?.length > 0 ? (
                <SongCardGrid 
                  tracks={searchResults.audios?.map(convertToFrontendTrack) || []} 
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
          {!searchQuery && (loadingPopular ? (
            <QuickPlaySkeleton />
          ) : quickPlayTracks.length > 0 ? (
            <section className="mb-8">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {quickPlayTracks.map((track, index) => (
                  <div
                    key={track._id || track.id}
                    className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-4 flex items-center gap-4 transition-all duration-300 cursor-pointer"
                    onClick={() => handlePlayAlbum([track])}
                    onMouseEnter={() => handleCardHover(index)}
                    onMouseLeave={handleCardLeave}
                  >
                    <div className="w-12 h-12 rounded overflow-hidden relative flex-shrink-0">
                      {/* Default gradient background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                        <div className="text-white text-lg font-bold opacity-80">
                          {(track.title || track.name || 'Unknown').charAt(0).toUpperCase()}
                        </div>
                      </div>
                      
                      {/* Image overlay */}
                      {track.album_image || track.image ? (
                        <img
                          src={track.album_image || track.image}
                          alt={track.title || track.name}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{track.title || track.name}</h3>
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
          ) : null)}

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
              {(loadingFeatured || (featuredTracks && featuredTracks.audios?.length > 0)) && (
                <section className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Featured Tracks</h2>
                  </div>
                  {loadingFeatured ? (
                    <CarouselSkeleton />
                  ) : (
                    <SongCardCarousel 
                      tracks={featuredTracks.audios?.map(convertToFrontendTrack) || []} 
                      onCardLeave={handleCardLeave}
                    />
                  )}
                </section>
              )}

              {/* New Releases */}
              {(loadingNew || (newReleases && newReleases.audios?.length > 0)) && (
                <section className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">New Releases</h2>
                  </div>
                  {loadingNew ? (
                    <CarouselSkeleton />
                  ) : (
                    <SongCardCarousel 
                      tracks={newReleases.audios?.map(convertToFrontendTrack) || []} 
                      onCardLeave={handleCardLeave}
                    />
                  )}
                </section>
              )}

              {/* All Popular Tracks */}
              {(loadingPopular || (popularTracks && popularTracks.audios?.length > 0)) && (
                <section className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Popular Tracks</h2>
                  </div>
                  {loadingPopular ? (
                    <TrackListSkeleton />
                  ) : (
                    <TrackList tracks={popularTracks.audios?.map(convertToFrontendTrack) || []} />
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
                <TrackListSkeleton />
              ) : popularTracks && popularTracks.audios?.length > 0 ? (
                <TrackList tracks={popularTracks.audios?.map(convertToFrontendTrack) || []} />
              ) : (
                <div className="text-center py-16">
                  <div className="text-[#a7a7a7] text-lg mb-4">No music available</div>
                  <p className="text-[#b3b3b3]">Upload some tracks to see them here!</p>
                </div>
              )}
            </section>
          )}

          {/* Public Playlists */}
          {(playlistState.isLoading || publicPlaylists.length > 0) && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Public Playlists</h2>
              </div>
              {playlistState.isLoading ? (
                <PlaylistGridSkeleton />
              ) : (
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
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default MainContent;
