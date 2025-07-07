import { Home, Search, Download, Bell, User, Upload, ChevronDown, LogOut } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import UploadMusic from "./UploadMusic";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assests/logo.png";  

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onHomeClick: () => void;
}

const Header = ({ searchQuery, onSearchChange, onHomeClick }: HeaderProps) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle Ctrl+K shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('#search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUploadSuccess = () => {
    // Refresh the page or trigger a refetch
    window.location.reload();
  };

  const handleLogout = () => {
    logout();
    setShowUserDropdown(false);
  };

  return (
    <header className="sticky top-0 z-10 bg-[#000] text-white p-4 pb-2">
      <div className="flex items-center justify-between w-full">
        {/* Left Section - Logo */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <img src={logo} alt="Spotify Logo" className="h-8 w-8" />
          </div>
        </div>

        {/* Center Section - Home Button and Search Bar */}
        <div className="flex items-center gap-4 flex-1 max-w-xl mx-6">
          {/* Home Button */}
          <button
            onClick={onHomeClick}
            className="rounded-full bg-[#0a0a0a] text-[#b3b3b3] hover:text-white h-12 w-12 hover:bg-[#1a1a1a] transition-all duration-200 inline-flex items-center justify-center hover:scale-105"
            title="Home"
          >
            <Home className="h-6 w-6" />
          </button>

          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#a7a7a7]" />
            <input
              id="search-input"
              type="text"
              placeholder="What do you want to play?"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-16 py-3 bg-[#1a1a1a] border-0 rounded-full text-white placeholder-[#a7a7a7] text-sm hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] focus:outline-none focus:ring-1 focus:ring-white/20 transition-all duration-200"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-[#6a6a6a] text-xs font-medium">
              <kbd className="px-1.5 py-0.5 bg-[#2a2a2a] rounded text-xs">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 bg-[#2a2a2a] rounded text-xs">K</kbd>
            </div>
          </div>
        </div>

        {/* Right Section - User Controls */}
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => setShowUploadModal(true)}
            className="text-[#b3b3b3] hover:text-white text-sm font-medium px-3 py-1 h-8 hover:bg-[#1a1a1a] rounded-full inline-flex items-center justify-center gap-1"
          >
            <Upload className="h-4 w-4" />
            Upload Music
          </button>
          <button className="text-[#b3b3b3] hover:text-white text-sm font-medium px-3 py-1 h-8 hover:bg-[#1a1a1a] rounded-full inline-flex items-center justify-center gap-1">
            <Download className="h-4 w-4" />
            Install App
          </button>
          <button className="text-[#b3b3b3] hover:text-white h-8 w-8 hover:bg-[#1a1a1a] rounded-full inline-flex items-center justify-center">
            <Bell className="h-4 w-4" />
          </button>
          <button className="text-[#b3b3b3] hover:text-white h-8 w-8 hover:bg-[#1a1a1a] rounded-full inline-flex items-center justify-center">
            <User className="h-4 w-4" />
          </button>
          
          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="rounded-full bg-[#1db954] hover:bg-[#1ed760] h-7 w-7 ml-2 inline-flex items-center justify-center transition-all duration-200"
            >
              <span className="text-black font-bold text-xs">
                {user?.email ? user.email.charAt(0).toUpperCase() : 'S'}
              </span>
            </button>
            
            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-[#282828] rounded-md shadow-lg py-2 z-50">
                <div className="px-4 py-2 text-sm text-[#b3b3b3] border-b border-[#3e3e3e]">
                  <div className="font-medium text-white">
                    {user?.email || 'User'}
                  </div>
                  <div className="text-xs">
                    {user?.email ? 'Premium' : 'Free'}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-[#b3b3b3] hover:text-white hover:bg-[#3e3e3e] transition-colors duration-200 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadMusic 
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
    </header>
  );
};

export default Header;
