import { Music, Pause, Play, Repeat, Shuffle, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";
import { formatDuration, getTrackImage } from "@/hooks/useApi";
import HeartButton from "./HeartButton";

// Custom Slider Component
interface CustomSliderProps {
  value: number[];
  max: number;
  step: number;
  onValueChange: (value: number[]) => void;
  className?: string;
}

const CustomSlider = ({ value, max, step, onValueChange, className }: CustomSliderProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange([Number(e.target.value)]);
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={value[0] || 0}
        onChange={handleChange}
        className="w-full h-1 bg-[#4a4a4a] rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, #1db954 0%, #1db954 ${(value[0] / max) * 100}%, #4a4a4a ${(value[0] / max) * 100}%, #4a4a4a 100%)`
        }}
      />
      <style dangerouslySetInnerHTML={{
        __html: `
          .slider::-webkit-slider-thumb {
            appearance: none;
            height: 12px;
            width: 12px;
            border-radius: 50%;
            background: #1db954;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.2s;
          }
          .slider:hover::-webkit-slider-thumb {
            opacity: 1;
          }
          .slider::-moz-range-thumb {
            height: 12px;
            width: 12px;
            border-radius: 50%;
            background: #1db954;
            cursor: pointer;
            border: none;
            opacity: 0;
            transition: opacity 0.2s;
          }
          .slider:hover::-moz-range-thumb {
            opacity: 1;
          }
        `
      }} />
    </div>
  );
};

const MusicPlayer = () => {
  const { state, togglePlay, nextTrack, previousTrack, seekTo, setVolume, toggleShuffle, toggleRepeat } = useMusicPlayer();
  const { isAuthenticated } = useAuth();
  const { requireAuth } = useAuthPrompt();

  const handleSeek = (value: number[]) => {
    const newTime = (value[0] / 100) * state.duration;
    if (!isNaN(newTime) && newTime >= 0 && newTime <= state.duration) {
      seekTo(newTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    if (!isNaN(newVolume) && newVolume >= 0 && newVolume <= 1) {
      setVolume(newVolume);
    }
  };

  const handleTogglePlay = () => {
    // If trying to play (not pause), require authentication
    if (!state.isPlaying && !isAuthenticated) {
      requireAuth('play', () => togglePlay(), state.currentTrack?.name);
    } else {
      togglePlay();
    }
  };

  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  if (!state.currentTrack) {
    return (
      <div className="bg-[#0a0a0a] border-t border-[#1a1a1a] px-6 py-4">
        <div className="flex items-center justify-center">
          <p className="text-[#b3b3b3] text-sm">No track selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] border-t border-[#282828] px-6 py-3">
      <div className="flex items-center justify-between max-w-full">
        {/* Currently playing */}
        <div className="flex items-center space-x-4 w-1/3 min-w-0">
        
          <div className="w-14 h-14 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg">
            {state.currentTrack.album_image || state.currentTrack.image ? (
              <img
                src={getTrackImage(state.currentTrack)}
                alt={state.currentTrack.album_name}
                className="w-full h-full object-cover rounded-md"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.classList.add('bg-gradient-to-br', 'from-purple-500', 'to-blue-600');
                  target.parentElement!.innerHTML = '<svg class="h-5 w-5 text-white"><use href="#music-icon"></use></svg>';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center rounded-md">
                <Music className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
          
          <div className="min-w-0 flex items-center space-x-3">
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-white text-sm font-medium truncate hover:underline cursor-pointer">
                  {state.currentTrack.name}
                </p>
                {state.isPlaying && (
                  <div className="flex space-x-1">
                    <div className="w-1 h-3 bg-[#1db954] rounded-full animate-pulse"></div>
                    <div className="w-1 h-2 bg-[#1db954] rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-4 bg-[#1db954] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                )}
              </div>
              <p className="text-[#a7a7a7] text-xs truncate mt-0.5 hover:text-white hover:underline cursor-pointer transition-colors">
                {state.currentTrack.artist_name}
              </p>
            </div>
            {isAuthenticated && (
              <HeartButton
                track={state.currentTrack}
                size="sm"
                variant="ghost"
                className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
              />
            )}
          </div>
        </div>

        {/* Player controls */}
        <div className="flex flex-col items-center space-y-2 w-1/3">
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleShuffle}
              className={`h-8 w-8 hover:bg-[#1a1a1a] rounded-full inline-flex items-center justify-center transition-all duration-200 ${
                state.shuffle ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
              }`}
            >
              <Shuffle className="h-4 w-4" />
            </button>
            <button
              onClick={previousTrack}
              className="text-[#b3b3b3] hover:text-white h-8 w-8 hover:bg-[#1a1a1a] rounded-full inline-flex items-center justify-center transition-all duration-200"
            >
              <SkipBack className="h-4 w-4 fill-current" />
            </button>
            <button
              onClick={handleTogglePlay}
              className="bg-white hover:bg-gray-100 text-black h-10 w-10 rounded-full inline-flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105"
            >
              {state.isPlaying ? (
                <Pause className="h-5 w-5 fill-black" />
              ) : (
                <Play className="h-5 w-5 fill-black ml-0.5" />
              )}
            </button>
            <button
              onClick={nextTrack}
              className="text-[#b3b3b3] hover:text-white h-8 w-8 hover:bg-[#1a1a1a] rounded-full inline-flex items-center justify-center transition-all duration-200"
            >
              <SkipForward className="h-4 w-4 fill-current" />
            </button>
            <button
              onClick={toggleRepeat}
              title={
                state.repeat === 'none' ? 'Repeat Off' :
                state.repeat === 'once' ? 'Repeat Once - plays current track once more' :
                'Repeat Forever - infinite loop of current track'
              }
              className={`h-8 w-8 hover:bg-[#1a1a1a] rounded-full inline-flex items-center justify-center relative transition-all duration-200 ${
                state.repeat !== 'none' ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
              }`}
            >
              <Repeat className="h-4 w-4" />
              {state.repeat === 'once' && (
                <span 
                  className="absolute -top-1 -right-1 w-2 h-2 bg-[#1db954] rounded-full"
                  title="Repeat once"
                ></span>
              )}
              {state.repeat === 'forever' && (
                <span 
                  className="absolute -top-1 -right-1 text-[8px] font-bold text-[#1db954] leading-none"
                  title="Repeat forever"
                >
                  ∞
                </span>
              )}
            </button>
          </div>
          <div className="flex items-center space-x-3 w-full max-w-lg">
            <span className="text-xs text-[#b3b3b3] w-10 text-right font-mono">
              {formatDuration(Math.floor(state.currentTime))}
            </span>
            <CustomSlider
              value={[progress]}
              max={100}
              step={0.1}
              onValueChange={handleSeek}
              className="flex-1"
            />
            <span className="text-xs text-[#b3b3b3] w-10 font-mono">
              {formatDuration(Math.floor(state.duration))}
            </span>
          </div>
        </div>

      

        {/* Volume and additional controls */}
        <div className="flex items-center justify-end  space-x-2 w-1/3">
          <button
            className="text-[#b3b3b3] hover:text-white h-8 w-8 hover:bg-[#1a1a1a] rounded-full inline-flex items-center justify-center transition-all duration-200"
            onClick={() => {
              const newVolume = state.volume > 0 ? 0 : 0.7;
              setVolume(newVolume);
            }}
            title={state.volume > 0 ? 'Mute' : 'Unmute'}
          >
            {state.volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <div className="w-24">
            <CustomSlider
              value={[Math.round(state.volume * 100)]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="w-full flex items-center justify-center"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
