import React, { useState, useRef, useEffect } from 'react';
import { Heart, Plus, MoreHorizontal, Share, Download, Info } from 'lucide-react';
import { Track } from '@/types/track';
import { LikedSong } from '@/contexts/LikedSongsContext';
import { useAuthPrompt } from '@/contexts/AuthPromptContext';
import AddToPlaylistModal from './AddToPlaylistModal';
import HeartButton from './HeartButton';

interface TrackContextMenuProps {
  track: Track | LikedSong;
  trigger?: React.ReactNode;
  className?: string;
}

interface Position {
  x: number;
  y: number;
}

const TrackContextMenu: React.FC<TrackContextMenuProps> = ({
  track,
  trigger,
  className = ''
}) => {
  const { requireAuth } = useAuthPrompt();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Handle menu positioning
  const handleToggleMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isOpen) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const menuWidth = 220; // Approximate menu width
      const menuHeight = 250; // Approximate menu height

      let x = rect.left;
      let y = rect.bottom + 5;

      // Adjust if menu would go off-screen horizontally
      if (x + menuWidth > viewportWidth) {
        x = rect.right - menuWidth;
      }

      // Adjust if menu would go off-screen vertically
      if (y + menuHeight > viewportHeight) {
        y = rect.top - menuHeight - 5;
      }

      setPosition({ x, y });
    }

    setIsOpen(!isOpen);
  };

  const menuItems = [
    {
      icon: Plus,
      label: 'Add to playlist',
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        requireAuth('playlist', () => {
          setShowAddToPlaylist(true);
        }, track.name);
        setIsOpen(false);
      }
    },
    {
      icon: Share,
      label: 'Share',
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        // TODO: Implement share functionality
        console.log('Share track:', track.name);
        setIsOpen(false);
      }
    },
    {
      icon: Download,
      label: 'Download',
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        // TODO: Implement download functionality
        if ('audio' in track) {
          window.open(track.audio, '_blank');
        }
        setIsOpen(false);
      }
    },
    {
      icon: Info,
      label: 'View credits',
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        // TODO: Implement view credits functionality
        console.log('View credits for:', track.name);
        setIsOpen(false);
      }
    }
  ];

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={handleToggleMenu}
        className={`h-8 w-8 text-[#a7a7a7] hover:text-white inline-flex items-center justify-center rounded hover:bg-white/10 transition-colors ${className}`}
      >
        {trigger || <MoreHorizontal className="h-4 w-4" />}
      </button>

      {/* Context Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="fixed bg-[#282828] border border-[#404040] rounded-lg shadow-2xl py-2 w-60 z-[100] animate-fade-in"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Like/Unlike - Special treatment */}
          <div className="px-4 py-3 hover:bg-[#404040] transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <HeartButton
                track={track}
                size="sm"
                variant="ghost"
              />
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-[#404040] my-1" />

          {/* Menu Items */}
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className="w-full px-4 py-3 text-left text-white hover:bg-[#404040] transition-all duration-200 flex items-center gap-3 group"
            >
              <item.icon className="h-4 w-4 text-[#a7a7a7] group-hover:text-white transition-colors" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}

          {/* Track Info Section */}
          <div className="border-t border-[#404040] mt-1 px-4 py-3 bg-[#1a1a1a] rounded-b-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 shadow-lg">
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <div className="text-white text-sm font-bold">
                    {track.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-white text-sm font-medium truncate">{track.name}</div>
                <div className="text-[#a7a7a7] text-xs truncate mt-1">{track.artist_name}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add to Playlist Modal */}
      {showAddToPlaylist && (
        <AddToPlaylistModal
          track={track}
          onClose={() => setShowAddToPlaylist(false)}
        />
      )}
    </>
  );
};

export default TrackContextMenu; 