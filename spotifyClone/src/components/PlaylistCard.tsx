
import { Music, Play } from "lucide-react";

interface PlaylistCardProps {
  title: string;
  description: string;
  imageColor: string;
}

const PlaylistCard = ({ title, description, imageColor }: PlaylistCardProps) => {
  return (
    <div className="group bg-[#181818] hover:bg-[#282828] rounded-lg p-4 transition-all duration-300 cursor-pointer">
      <div className="relative mb-4">
        <div 
          className={`w-full aspect-square rounded-lg ${imageColor} flex items-center justify-center relative overflow-hidden`}
        >
          <Music className="h-16 w-16 text-white opacity-60" />
          <button
            className="absolute bottom-2 right-2 rounded-full bg-[#1db954] hover:bg-[#1ed760] opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg inline-flex items-center justify-center h-10 w-10"
          >
            <Play className="h-5 w-5 text-black fill-black" />
          </button>
        </div>
      </div>
      <h3 className="font-semibold text-white mb-2 truncate">{title}</h3>
      <p className="text-[#a7a7a7] text-sm line-clamp-2">{description}</p>
    </div>
  );
};

export default PlaylistCard;
