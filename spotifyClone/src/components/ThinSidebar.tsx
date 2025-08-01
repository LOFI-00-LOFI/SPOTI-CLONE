import { Home, Heart, Upload, Music } from "lucide-react";
import { useNavigation } from "@/contexts/NavigationContext";
import { useLikedSongs } from "@/contexts/LikedSongsContext";

const ThinSidebar = () => {
  const { likedCount } = useLikedSongs();
  const { currentView, setCurrentView } = useNavigation();

  const isActive = currentView === 'liked-songs';

  return (
    <div className="w-20 bg-[#000000] text-white h-full flex flex-col items-center py-4 border-r border-[#1a1a1a]">
      <div className="flex flex-col justify-center h-full">
        <button
          onClick={() => setCurrentView('liked-songs')}
          className={`relative flex flex-col items-center justify-center py-4 px-2 transition-colors group ${
            isActive 
              ? 'text-white' 
              : 'text-[#a7a7a7] hover:text-white'
          }`}
        >
          <div className="relative mb-2">
            <Heart 
              className={`h-8 w-8 ${
                isActive 
                  ? 'fill-[#1db954] text-[#1db954]' 
                  : 'fill-[#a7a7a7] group-hover:fill-white'
              }`} 
            />
            {likedCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-[#1db954] text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {likedCount > 99 ? '99' : likedCount}
              </div>
            )}
          </div>
          <span className={`text-xs font-medium text-center leading-tight ${
            isActive ? 'text-white' : 'text-[#a7a7a7] group-hover:text-white'
          }`}>
            Liked Songs
          </span>
          
          {/* Active indicator dot */}
          {isActive && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1db954] rounded-full"></div>
          )}
        </button>
      </div>
    </div>
  );
};

export default ThinSidebar; 