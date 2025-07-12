import { Home, Search, Download, Bell, User, Upload, ChevronDown, LogOut } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import UploadMusic from "./UploadMusic";
import { useAuth } from "../contexts/AuthContext";
import { useAuthPrompt } from "../contexts/AuthPromptContext";
import logo from "../assests/logo.png";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onHomeClick: () => void;
}

const Header = ({ searchQuery, onSearchChange, onHomeClick }: HeaderProps) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { requireAuth } = useAuthPrompt();
  const navigate = useNavigate();
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

  const handleUploadClick = () => {
    requireAuth('upload', () => setShowUploadModal(true));
  };

  const handleLogout = () => {
    logout();
    setShowUserDropdown(false);
  };

  return (
    <header className="sticky top-0 z-10 bg-[#000] text-white p-4 pb-2 border-b border-[#282828]">
      <div className="flex items-center justify-between w-full">
        {/* Left Section - Logo */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <img src={logo} alt="Spotify Logo" className="h-8 w-8" />
          </div>
        </div>

        {/* Center Section - Home Button and Search Bar */}
        <div className="flex items-center gap-3 flex-1 max-w-2xl mx-6">
          {/* Home Button */}
          <button
            onClick={onHomeClick}
            className="rounded-full bg-[#121212] text-[#b3b3b3] hover:text-white h-12 w-12 hover:bg-[#1a1a1a] transition-all duration-200 inline-flex items-center justify-center hover:scale-105 shadow-lg"
            title="Home"
          >
            <Home className="h-6 w-6" />
          </button>

          {/* Search Bar */}
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#a7a7a7] group-focus-within:text-white transition-colors" />
            <input
              id="search-input"
              type="text"
              placeholder="What do you want to play?"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-12 pr-20 py-3 bg-[#242424] border-0 rounded-full text-white placeholder-[#a7a7a7] text-sm hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200 shadow-lg"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-[#6a6a6a] text-xs font-medium opacity-0 group-focus-within:opacity-100 transition-opacity">
              <kbd className="px-1.5 py-0.5 bg-[#2a2a2a] rounded text-xs border border-[#404040]">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 bg-[#2a2a2a] rounded text-xs border border-[#404040]">K</kbd>
            </div>
          </div>
        </div>

        {/* Right Section - User Controls */}
        <div className="flex items-center space-x-2">
          {isAuthenticated ? (
            <>
              <button
                onClick={handleUploadClick}
                className="text-[#b3b3b3] hover:text-white text-sm font-medium px-4 py-2 h-9 hover:bg-[#1a1a1a] rounded-full inline-flex items-center justify-center gap-2 transition-all duration-200"
              >
                <Upload className="h-4 w-4" />
                Upload Music
              </button>
              <button className="text-[#b3b3b3] hover:text-white text-sm font-medium px-4 py-2 h-9 hover:bg-[#1a1a1a] rounded-full inline-flex items-center justify-center gap-2 transition-all duration-200">
                <Download className="h-4 w-4" />
                Install App
              </button>
              <button className="text-[#b3b3b3] hover:text-white h-9 w-9 hover:bg-[#1a1a1a] rounded-full inline-flex items-center justify-center transition-all duration-200">
                <Bell className="h-4 w-4" />
              </button>
              <button className="text-[#b3b3b3] hover:text-white h-9 w-9 hover:bg-[#1a1a1a] rounded-full inline-flex items-center justify-center transition-all duration-200">
                <User className="h-4 w-4" />
              </button>
              
              {/* User Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="rounded-full bg-[#1db954] hover:bg-[#1ed760] h-8 w-8 ml-2 inline-flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  <span className="text-black font-bold text-sm">
                    {user?.email ? user.email.charAt(0).toUpperCase() : 'S'}
                  </span>
                </button>
                
                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-3 w-52 bg-[#282828] rounded-lg shadow-2xl py-2 z-50 border border-[#3e3e3e] animate-fade-in">
                    <div className="px-4 py-3 text-sm text-[#b3b3b3] border-b border-[#3e3e3e]">
                      <div className="font-medium text-white text-base">
                        {user?.email || 'User'}
                      </div>
                      <div className="text-xs mt-1 text-[#a7a7a7]">
                        {user?.email ? 'Premium Account' : 'Free Account'}
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-sm text-[#b3b3b3] hover:text-white hover:bg-[#3e3e3e] transition-colors duration-200 flex items-center gap-3"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={handleUploadClick}
                className="text-[#b3b3b3] hover:text-white text-sm font-medium px-4 py-2 h-9 hover:bg-[#1a1a1a] rounded-full inline-flex items-center justify-center gap-2 transition-all duration-200"
              >
                <Upload className="h-4 w-4" />
                Upload Music
              </button>
              <button className="text-[#b3b3b3] hover:text-white text-sm font-medium px-4 py-2 h-9 hover:bg-[#1a1a1a] rounded-full inline-flex items-center justify-center gap-2 transition-all duration-200">
                <Download className="h-4 w-4" />
                Install App
              </button>
              
              {/* Login/Signup buttons for non-authenticated users */}
              <button
                onClick={() => navigate('/login')}
                className="text-[#b3b3b3] hover:text-white text-sm font-medium px-5 py-2 h-9 hover:bg-[#1a1a1a] rounded-full inline-flex items-center justify-center transition-all duration-200"
              >
                Log in
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="bg-white text-black font-bold px-6 py-2 h-9 rounded-full hover:bg-gray-200 hover:scale-105 transition-all duration-200 text-sm inline-flex items-center justify-center shadow-lg"
              >
                Sign up
              </button>
            </>
          )}
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
