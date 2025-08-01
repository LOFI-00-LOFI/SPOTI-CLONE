import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Music, Image as ImageIcon, Loader2, CheckCircle, Trash2 } from 'lucide-react';
import { UploadTrackData } from '@/types/api';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

interface UploadMusicProps {
  onClose: () => void;
  onUploadSuccess?: () => void;
}

interface FileWithMetadata {
  file: File;
  metadata: UploadTrackData;
  progress: number;
  error?: string;
}

const UploadMusic: React.FC<UploadMusicProps> = ({ onClose, onUploadSuccess }) => {
  const [files, setFiles] = useState<FileWithMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadMode, setUploadMode] = useState<'single' | 'multiple'>('single');

  const { success, error } = useToast();

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    // Handle Escape key to close modal
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

  const createFileWithMetadata = (file: File): FileWithMetadata => {
    const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ').trim();
    return {
      file,
      metadata: {
        title: cleanTitle,
        artist_name: '',
        album_name: 'Single',
        genre: 'Other',
        description: '',
        duration: 0,
      },
      progress: 0,
      error: undefined,
    };
  };

  const processAudioFile = async (fileWithMetadata: FileWithMetadata) => {
    const audio = new Audio();
    const url = URL.createObjectURL(fileWithMetadata.file);
    
    return new Promise<FileWithMetadata>((resolve) => {
      audio.src = url;
      audio.onloadedmetadata = () => {
        const updatedFile = {
          ...fileWithMetadata,
          metadata: {
            ...fileWithMetadata.metadata,
            duration: Math.round(audio.duration),
          },
          progress: 100,
        };
        URL.revokeObjectURL(url);
        resolve(updatedFile);
      };
      audio.onerror = () => {
        console.error('Error loading audio metadata for:', fileWithMetadata.file.name);
        const updatedFile = {
          ...fileWithMetadata,
          progress: 0,
          error: 'Failed to load metadata',
        };
        URL.revokeObjectURL(url);
        resolve(updatedFile);
      };
    });
  };

  const handleFilesAdded = async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const audioFiles = fileArray.filter(file => file.type.startsWith('audio/'));
    
    if (audioFiles.length === 0) {
      error('Please select at least one audio file');
      return;
    }

    // Check file sizes
    const oversizedFiles = audioFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      error(`These files are too large (max 10MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    // Create file objects with metadata
    const filesWithMetadata = audioFiles.map(createFileWithMetadata);
    
    // Add to state first
    setFiles(prev => [...prev, ...filesWithMetadata]);

    // Process each file's metadata asynchronously
    for (const fileWithMetadata of filesWithMetadata) {
      const processedFile = await processAudioFile(fileWithMetadata);
      setFiles(prev => prev.map(f => f.file.name === processedFile.file.name ? processedFile : f));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesAdded(e.target.files);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFilesAdded(e.dataTransfer.files);
  };

  const removeFile = (name: string) => {
    setFiles(prev => prev.filter(f => f.file.name !== name));
  };

  const updateFileMetadata = (name: string, field: keyof UploadTrackData, value: string | number) => {
    setFiles(prev => prev.map(f => 
      f.file.name === name 
        ? { ...f, metadata: { ...f.metadata, [field]: value } }
        : f
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      error('Please select at least one audio file');
      return;
    }

    // Validate all files have required metadata
    const invalidFiles = files.filter(f => !f.metadata.title.trim() || !f.metadata.artist_name.trim());
    if (invalidFiles.length > 0) {
      error('Please fill in title and artist name for all files');
      return;
    }

    setIsUploading(true);
    
    try {
      if (files.length === 1) {
        // Single file upload
        await api.uploadTrack(files[0].file, null, files[0].metadata);
        success('Track uploaded successfully!');
      } else {
        // Multiple file upload
        const audioFiles = files.map(f => f.file);
        const tracksData = files.map(f => f.metadata);
        
        const response = await api.uploadMultipleTracks(audioFiles, tracksData);
        
        if (response.error) {
          throw response.error;
        } else {
          success(`All ${response.uploadedTracks.length} tracks uploaded successfully!`);
        }
      }
      
      onUploadSuccess?.();
      onClose();
    } catch (err) {
      console.error('Upload error:', err);
      error('Failed to upload tracks. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleMultipleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const audioFiles = files.map(f => f.file);
      const tracksData = files.map(f => f.metadata);
      
      const response = await api.uploadMultipleTracks(audioFiles, tracksData);
      if (response.error) {
        throw response.error;
      }
      
      const uploadedTracks = response.data?.uploadedTracks || [];
      success(`All ${uploadedTracks.length} tracks uploaded successfully!`);
      onUploadSuccess?.();
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      setFiles(current =>
        current.map(file => ({ ...file, error: 'Upload failed' }))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const genres = [
    'Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical',
    'R&B', 'Country', 'Reggae', 'Blues', 'Folk', 'Indie', 'Other'
  ];

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ zIndex: 999999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div 
        className="bg-[#121212] border border-[#282828] rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-scale-in"
        style={{ zIndex: 1000000 }}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        ref={(el) => el?.focus()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="upload-modal-title" className="text-2xl font-bold text-white">Upload Music</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors hover:bg-[#1a1a1a] rounded-full p-2"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Mode Toggle */}
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-white font-medium">Upload Mode:</span>
            <button
              type="button"
              onClick={() => setUploadMode('single')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                uploadMode === 'single' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Single File
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('multiple')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                uploadMode === 'multiple' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Multiple Files
            </button>
          </div>

          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
              dragOver
                ? 'border-green-500 bg-green-500 bg-opacity-10 scale-105'
                : files.length > 0
                  ? 'border-green-500 bg-green-500 bg-opacity-5'
                  : 'border-gray-600 hover:border-gray-500 hover:bg-[#1a1a1a]'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <Music className="mx-auto text-gray-400 mb-4" size={48} />
              <div className="space-y-2">
                <p className="text-white text-lg font-medium">
                  Drop your audio files here
                </p>
                <p className="text-gray-400 text-sm">
                  or click below to browse • MP3, WAV, FLAC supported • Max 10MB each
                  {uploadMode === 'multiple' && ' • Up to 10 files'}
                </p>
              </div>
              
              <input
                type="file"
                accept="audio/*"
                multiple={uploadMode === 'multiple'}
                onChange={handleFileUpload}
                className="hidden"
                id="audio-upload"
              />
              
              <label
                htmlFor="audio-upload"
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors mt-4 font-medium"
              >
                <Upload size={20} className="mr-2" />
                Choose Audio Files
              </label>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-white font-medium">Selected Files ({files.length})</h3>
              
              {files.map((fileWithMetadata) => (
                <div key={fileWithMetadata.file.name} className="bg-[#1a1a1a] border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center text-green-500">
                        {fileWithMetadata.progress === 100 ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{fileWithMetadata.file.name}</p>
                        <p className="text-gray-400 text-sm">
                          {formatFileSize(fileWithMetadata.file.size)}
                          {fileWithMetadata.metadata.duration > 0 && (
                            <> • {formatDuration(fileWithMetadata.metadata.duration)}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(fileWithMetadata.file.name)}
                      className="text-gray-400 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Metadata Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white mb-2 font-medium text-sm">Title *</label>
                      <input
                        type="text"
                        value={fileWithMetadata.metadata.title}
                        onChange={(e) => updateFileMetadata(fileWithMetadata.file.name, 'title', e.target.value)}
                        className="w-full bg-[#2a2a2a] border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                        placeholder="Enter track title"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-white mb-2 font-medium text-sm">Artist *</label>
                      <input
                        type="text"
                        value={fileWithMetadata.metadata.artist_name}
                        onChange={(e) => updateFileMetadata(fileWithMetadata.file.name, 'artist_name', e.target.value)}
                        className="w-full bg-[#2a2a2a] border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                        placeholder="Enter artist name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-white mb-2 font-medium text-sm">Album</label>
                      <input
                        type="text"
                        value={fileWithMetadata.metadata.album_name}
                        onChange={(e) => updateFileMetadata(fileWithMetadata.file.name, 'album_name', e.target.value)}
                        className="w-full bg-[#2a2a2a] border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                        placeholder="Album name"
                      />
                    </div>

                    <div>
                      <label className="block text-white mb-2 font-medium text-sm">Genre</label>
                      <select
                        value={fileWithMetadata.metadata.genre}
                        onChange={(e) => updateFileMetadata(fileWithMetadata.file.name, 'genre', e.target.value)}
                        className="w-full bg-[#2a2a2a] border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                      >
                        {genres.map(genre => (
                          <option key={genre} value={genre} className="bg-[#2a2a2a]">
                            {genre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-white mb-2 font-medium text-sm">Description</label>
                      <textarea
                        value={fileWithMetadata.metadata.description}
                        onChange={(e) => updateFileMetadata(fileWithMetadata.file.name, 'description', e.target.value)}
                        className="w-full bg-[#2a2a2a] border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors h-20 resize-none"
                        placeholder="Enter track description (optional)"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 text-white rounded-lg py-3 hover:bg-gray-600 transition-colors font-medium"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || files.length === 0}
              className="flex-1 bg-green-600 text-white rounded-lg py-3 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium"
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Uploading {files.length} file{files.length > 1 ? 's' : ''}...
                </>
              ) : (
                <>
                  <Upload size={20} className="mr-2" />
                  Upload {files.length} Track{files.length > 1 ? 's' : ''}
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

export default UploadMusic; 