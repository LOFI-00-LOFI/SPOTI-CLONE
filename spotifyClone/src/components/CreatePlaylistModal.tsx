import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Music, Image as ImageIcon, Loader2, CheckCircle, Palette } from 'lucide-react';
import { CreatePlaylistData } from '@/types/api';
import { usePlaylist } from '@/contexts/PlaylistContext';

interface CreatePlaylistModalProps {
  onClose: () => void;
  onSuccess?: (playlist?: any) => void;
}

const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CreatePlaylistData>({
    name: '',
    description: '',
    backgroundColor: '#3b82f6',
    isPublic: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { createPlaylist } = usePlaylist();

  // Predefined color options
  const colorOptions = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
    '#f97316', '#6366f1', '#14b8a6', '#eab308'
  ];

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await createPlaylist(formData, imageFile || undefined);
      if (result) {
        onSuccess?.(result);
        onClose();
      }
    } catch (error) {
      console.error('Failed to create playlist:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove image
  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 backdrop-blur-sm z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-playlist-title"
    >
      <div 
        className="bg-[#121212] border border-[#282828] rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 id="create-playlist-title" className="text-xl font-bold text-white">
            Create Playlist
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors hover:bg-[#1a1a1a] rounded-full p-2"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white">Playlist Cover</label>
            <div className="flex items-start gap-4">
              {/* Image Preview/Upload Area */}
              <div 
                className={`w-32 h-32 rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer ${
                  dragOver 
                    ? 'border-[#1db954] bg-[#1db954]/10' 
                    : 'border-[#404040] hover:border-[#1db954]'
                } ${imagePreview ? 'border-solid' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={imagePreview} 
                      alt="Playlist cover" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage();
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div 
                    className="w-full h-full flex flex-col items-center justify-center text-gray-400"
                    style={{ backgroundColor: formData.backgroundColor + '20' }}
                  >
                    <div 
                      className="w-full h-full flex flex-col items-center justify-center rounded-lg"
                      style={{ backgroundColor: formData.backgroundColor }}
                    >
                      <Music className="h-8 w-8 text-white mb-2" />
                      <span className="text-xs text-white text-center px-2">
                        Add Cover
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Color Picker */}
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-400 block mb-2">
                  Background Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.backgroundColor === color 
                          ? 'border-white scale-110' 
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, backgroundColor: color }))}
                    />
                  ))}
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Playlist Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="playlist-name">
              Playlist Name *
            </label>
            <input
              id="playlist-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter playlist name"
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#404040] rounded-lg text-white placeholder-gray-400 focus:border-[#1db954] focus:outline-none transition-colors"
              required
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="playlist-description">
              Description
            </label>
            <textarea
              id="playlist-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add an optional description"
              rows={3}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#404040] rounded-lg text-white placeholder-gray-400 focus:border-[#1db954] focus:outline-none transition-colors resize-none"
              maxLength={300}
            />
          </div>

          {/* Privacy Setting */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Privacy</label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={formData.isPublic}
                  onChange={() => setFormData(prev => ({ ...prev, isPublic: true }))}
                  className="text-[#1db954] focus:ring-[#1db954] bg-[#2a2a2a] border-[#404040]"
                />
                <span className="text-white text-sm">Public</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={!formData.isPublic}
                  onChange={() => setFormData(prev => ({ ...prev, isPublic: false }))}
                  className="text-[#1db954] focus:ring-[#1db954] bg-[#2a2a2a] border-[#404040]"
                />
                <span className="text-white text-sm">Private</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 text-white rounded-lg py-3 hover:bg-gray-600 transition-colors font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
              className="flex-1 bg-[#1db954] text-white rounded-lg py-3 hover:bg-[#1ed760] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle size={16} className="mr-2" />
                  Create Playlist
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CreatePlaylistModal; 