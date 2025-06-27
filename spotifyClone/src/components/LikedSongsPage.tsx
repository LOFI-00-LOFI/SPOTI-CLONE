import { Heart, Play, Download, MoreHorizontal, List, Clock } from "lucide-react";
import { useLikedSongs } from "@/contexts/LikedSongsContext";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useState, useEffect, useRef } from "react";
import TrackList from "./TrackList";

interface LikedSongsPageProps {
  searchQuery: string;
}

const LikedSongsPage = ({ searchQuery }: LikedSongsPageProps) => {
  const { likedSongs, likedCount } = useLikedSongs();
  const { playQueue } = useMusicPlayer();
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [showTableHeaderBg, setShowTableHeaderBg] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter liked songs based on search query
  const filteredLikedSongs = searchQuery.length > 0 
    ? likedSongs.filter(song => 
        song.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (song.album_name && song.album_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : likedSongs;

  const handlePlayAll = () => {
    if (filteredLikedSongs.length > 0) {
      playQueue(filteredLikedSongs, 0, 'liked-songs');
    }
  };

  const handleShuffle = () => {
    if (filteredLikedSongs.length > 0) {
      const shuffled = [...filteredLikedSongs].sort(() => Math.random() - 0.5);
      playQueue(shuffled, 0, 'liked-songs');
    }
  };

  // Handle scroll to show/hide sticky header
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      // Show sticky header when user scrolls past the main header (around 300px)
      setShowStickyHeader(scrollTop > 300);
      // Show table header background when scrolled past controls section (around 450px)
      setShowTableHeaderBg(scrollTop > 450);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="flex-1 rounded-xl bg-gradient-to-b from-[#5038a0] via-[#3b2f7c84] via-10% to-[#12121200] text-white overflow-y-auto relative"
    >
      {/* Sticky Header - shows on scroll */}
      {showStickyHeader && (
        <div className="sticky top-0 z-20 bg-gradient-to-r from-[#5038a0] to-[#3a2f7c] px-8 py-4 transition-all duration-300">
          <div className="flex items-center gap-6 max-w-full">
            <button
              onClick={handlePlayAll}
              className="bg-[#1db954] hover:bg-[#1ed760] hover:scale-105 text-black h-12 w-12 rounded-full transition-all duration-200 shadow-lg inline-flex items-center justify-center flex-shrink-0"
            >
              <Play className="h-5 w-5 fill-current ml-0.5" />
            </button>
            <h2 className="text-2xl font-bold text-white truncate">
              {searchQuery ? `Search in Liked Songs` : 'Liked Songs'}
            </h2>
          </div>
        </div>
      )}

      {/* Header Section with Purple Gradient */}
      <div className="bg-gradient-to-b from-[#5038a0] to-[#3730a3] px-8 pt-16 pb-6">
        <div className="flex items-end space-x-6">
          {/* Large Heart Icon */}
          <div className="w-48 h-48 bg-gradient-to-br from-[#4c1d95] to-[#c471ed] rounded-[8px] flex items-center justify-center flex-shrink-0 shadow-2xl">
            <Heart className="h-20 w-20 text-white fill-white" />
          </div>
          
          {/* Playlist Info */}
          <div className="flex-1 min-w-0 pb-4">
            <p className="text-sm font-bold mb-2 uppercase tracking-wide text-white">Playlist</p>
            <h1 className="text-[72px] font-black mb-4 leading-none text-white tracking-tight">
              {searchQuery ? `Search in Liked Songs` : 'Liked Songs'}
            </h1>
            <div className="flex items-center text-sm text-white">
              <span className="font-semibold">SJSL</span>
              <span className="mx-2">•</span>
              <span className="font-normal">
                {searchQuery 
                  ? `${filteredLikedSongs.length} of ${likedCount} songs` 
                  : `${likedCount} songs`
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="px-8 py-6 bg-gradient-to-b from-transparent to-transparent">
        {filteredLikedSongs.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Play Button */}
              <button
                onClick={handlePlayAll}
                className="bg-[#1db954] hover:bg-[#1ed760] hover:scale-105 text-black h-14 w-14 rounded-full transition-all duration-200 shadow-lg inline-flex items-center justify-center"
              >
                <Play className="h-6 w-6 fill-current ml-1" />
              </button>
              
              {/* Download Button */}
              <button
                className="text-[#a7a7a7] hover:text-white h-8 w-8 hover:bg-[#ffffff10] inline-flex items-center justify-center rounded"
              >
                <Download className="h-5 w-5" />
              </button>
              
              {/* More Options */}
              <button
                className="text-[#a7a7a7] hover:text-white h-8 w-8 hover:bg-[#ffffff10] inline-flex items-center justify-center rounded"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
            
            {/* List View Toggle */}
            <div className="flex items-center space-x-4">
              <button
                className="text-[#a7a7a7] hover:text-white text-sm font-medium h-8 px-3 hover:bg-[#ffffff10] inline-flex items-center justify-center gap-2 rounded"
              >
                List
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Track List Section */}
      <div className={`px-8 pb-8 ${showStickyHeader ? 'bg-[#121212]' : ''}`}>
        {filteredLikedSongs.length > 0 ? (
          <div>
            {/* Track List Header */}
            <div className={`
              grid grid-cols-[16px_4fr_2fr_1fr_1fr_50px] gap-4 px-8 py-2 text-sm text-[#6a6a6a] border-b border-[#282828] mb-2 sticky top-20 z-10 transition-all duration-300 -mx-8
              ${showTableHeaderBg ? 'bg-[#121212] backdrop-blur-sm' : 'bg-transparent'}
            `}>
              <div className="flex justify-center">#</div>
              <div>Title</div>
              <div>Album</div>
              <div className="text-right">Date added</div>
              <div className="flex justify-center">
                <Clock className="h-4 w-4" />
              </div>
              <div></div>
            </div>
            
            {/* Enhanced Track List */}
            <TrackList 
              tracks={filteredLikedSongs} 
              showAlbum={true}
              showDateAdded={true}
              showHeader={false}
              source="liked-songs"
            />
          </div>
        ) : (
          <div className="text-center py-20">
            {searchQuery && likedSongs.length > 0 ? (
              // Show "No search results" when searching but no matches found
              <>
                <Heart className="h-20 w-20 text-[#a7a7a7] mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-white mb-4">No results found</h2>
                <p className="text-[#a7a7a7] mb-8 text-lg">
                  Try searching for something else in your liked songs.
                </p>
              </>
            ) : (
              // Show default empty state when no liked songs at all
              <>
                <Heart className="h-20 w-20 text-[#a7a7a7] mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-white mb-4">Songs you like will appear here</h2>
                <p className="text-[#a7a7a7] mb-8 text-lg">
                  Save songs by tapping the heart icon.
                </p>
                <button
                  className="bg-white text-black hover:bg-gray-200 font-bold px-8 py-3 rounded-full inline-flex items-center justify-center"
                >
                  Find something to like
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LikedSongsPage; 