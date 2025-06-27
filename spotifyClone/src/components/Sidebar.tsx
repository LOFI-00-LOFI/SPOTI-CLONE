import { Heart, Music, Search } from "lucide-react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useLikedSongs } from "@/contexts/LikedSongsContext";
import { useNavigation } from "@/pages/Index";

const Sidebar = () => {
  const { state } = useMusicPlayer();
  const { likedCount } = useLikedSongs();
  const { setCurrentView } = useNavigation();

  return (
    <div className="w-80 bg-[#121212] text-white h-full flex flex-col rounded-xl">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[#a7a7a7] font-semibold">Your Library</h2>
        </div>

        {/* Search */}
        <div className="flex items-center justify-between mb-4">
          <button className="h-8 w-8 text-[#a7a7a7] hover:text-white hover:bg-[#1a1a1a] inline-flex items-center justify-center rounded">
            <Search className="h-4 w-4" />
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-[#a7a7a7] text-sm">Recents</span>
            <div className="flex flex-col space-y-1">
              <div className="w-3 h-0.5 bg-[#a7a7a7]"></div>
              <div className="w-3 h-0.5 bg-[#a7a7a7]"></div>
              <div className="w-3 h-0.5 bg-[#a7a7a7]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-2 overflow-y-auto">
        {/* Liked Songs */}
        <div 
          className="flex items-center space-x-3 p-2 rounded-md hover:bg-[#1a1a1a] cursor-pointer group transition-colors"
          onClick={() => setCurrentView('liked-songs')}
        >
          <div className="w-12 h-12 rounded bg-gradient-to-br from-purple-700 to-blue-300 flex items-center justify-center flex-shrink-0">
            <Heart className="h-6 w-6 text-white fill-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">Liked Songs</p>
            <p className="text-[#a7a7a7] text-xs truncate">
              Playlist • {likedCount} song{likedCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Placeholder for future playlists */}
        <div className="mt-6 text-center py-8">
          <div className="text-[#a7a7a7] text-sm mb-2">Create your first playlist</div>
          <p className="text-[#b3b3b3] text-xs">It's easy, we'll help you</p>
          <button className="mt-4 bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
            Create playlist
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
