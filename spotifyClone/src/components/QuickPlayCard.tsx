
import { Music } from "lucide-react";

interface QuickPlayCardProps {
  title: string;
  imageColor: string;
}

const QuickPlayCard = ({ title, imageColor }: QuickPlayCardProps) => {
  return (
    <div className="group bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-md flex items-center overflow-hidden cursor-pointer transition-all duration-300">
      <div className={`w-16 h-16 ${imageColor} flex items-center justify-center flex-shrink-0`}>
        <Music className="h-8 w-8 text-white opacity-60" />
      </div>
      <span className="px-4 text-white font-medium truncate">{title}</span>
    </div>
  );
};

export default QuickPlayCard;
