import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Music2, File, Trash2, Play, Loader2, FolderOpen, CloudUpload, Youtube } from 'lucide-react';
import axios from 'axios';
import { usePlayer } from '@/contexts/PlayerContext';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/runtime';

interface LibraryFile {
  filename: string;
  size: number;
  modified: string;
}

interface SavedTrack {
  track_id: string;
  source: string;
  title: string;
  artist?: string;
  thumbnail?: string;
  created_at: number;
}

const API_BASE = API_BASE_URL;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatDateFlexible(dateValue: string | number): string {
  const date = typeof dateValue === 'number' ? new Date(dateValue * 1000) : new Date(dateValue);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function Library() {
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [saved, setSaved] = useState<SavedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { playLocal, playYoutube, addToQueue, currentTrack, isPlaying } = usePlayer();

  const fetchLibrary = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/library`);
      setFiles(response.data.songs || []);
      const savedResp = await axios.get(`${API_BASE}/me/library`);
      setSaved(savedResp.data.tracks || []);
    } catch (error) {
      toast.error('Failed to load library. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const handleUpload = async (uploadFiles: FileList | null) => {
    if (!uploadFiles || uploadFiles.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    for (let i = 0; i < uploadFiles.length; i++) {
      formData.append('file', uploadFiles[i]);
    }

    try {
      await axios.post(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('File uploaded successfully!');
      fetchLibrary();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleUpload(e.dataTransfer.files);
  };

  const handlePlayFile = (file: LibraryFile) => {
    const title = file.filename.replace(/\.[^/.]+$/, '');
    playLocal(file.filename, title);
  };

  const handlePlaySaved = (t: SavedTrack) => {
    if (t.source === 'youtube') {
      playYoutube(t.track_id, t.title, t.thumbnail);
    }
  };

  const handleRemoveSaved = async (t: SavedTrack) => {
    try {
      await axios.delete(`${API_BASE}/me/library`, { params: { track_id: t.track_id, source: t.source } });
      setSaved(prev => prev.filter(x => !(x.track_id === t.track_id && x.source === t.source)));
      toast.success('Removed from Your Library');
    } catch {
      toast.error('Failed to remove');
    }
  };

  const isCurrentTrack = (filename: string) => {
    return currentTrack?.url.includes(filename);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Library</h1>
          <p className="text-muted-foreground">
            {files.length} track{files.length !== 1 ? 's' : ''} in your collection
          </p>
        </div>
      </motion.div>

      {/* Saved Tracks */}
      {loading ? null : saved.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Saved from YouTube</h2>
            <p className="text-sm text-muted-foreground">{saved.length} saved</p>
          </div>
          <div className="space-y-2">
            <AnimatePresence>
              {saved.map((t) => (
                <motion.div
                  key={`${t.source}-${t.track_id}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="glass-card rounded-xl p-4 flex items-center gap-4 group cursor-pointer transition-all hover:bg-muted/30"
                  onClick={() => handlePlaySaved(t)}
                >
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {t.thumbnail ? (
                      <img src={t.thumbnail} alt={t.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/30">
                        <Youtube className="w-5 h-5 text-accent" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{t.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{t.artist || 'YouTube'}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity btn-glow"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToQueue({
                          id: `yt-${t.track_id}`,
                          title: t.title,
                          artist: t.artist,
                          thumbnail: t.thumbnail,
                          source: 'youtube',
                          url: `${API_BASE}/stream/${t.track_id}`,
                        });
                        toast.success('Added to queue');
                      }}
                      title="Add to queue"
                    >
                      <Play className="w-4 h-4 text-primary" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSaved(t);
                      }}
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative glass-card rounded-2xl p-8 transition-all duration-300 ${
          dragActive ? 'ring-2 ring-primary bg-primary/10' : ''
        }`}
      >
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => handleUpload(e.target.files)}
          className="absolute inset-0 opacity-0 cursor-pointer"
          disabled={uploading}
          multiple
        />
        <div className="flex flex-col items-center justify-center text-center pointer-events-none">
          {uploading ? (
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          ) : (
            <motion.div
              animate={dragActive ? { scale: 1.1 } : { scale: 1 }}
              className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4"
            >
              <CloudUpload className="w-8 h-8 text-primary" />
            </motion.div>
          )}
          <h3 className="text-lg font-semibold mb-2">
            {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Supports MP3, WAV, FLAC and more
          </p>
        </div>
      </motion.div>

      {/* File List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : files.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-2xl p-12 text-center"
        >
          <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No tracks yet</h3>
          <p className="text-muted-foreground">
            Upload some music to get started
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          <AnimatePresence>
            {files.map((file, index) => (
              <motion.div
                key={file.filename}
                variants={item}
                layout
                style={{ animationDelay: `${index * 0.05}s` }}
                className={`glass-card rounded-xl p-4 flex items-center gap-4 group cursor-pointer transition-all hover:bg-muted/30 ${
                  isCurrentTrack(file.filename) ? 'ring-1 ring-primary/50 bg-primary/5' : ''
                }`}
                onClick={() => handlePlayFile(file)}
              >
                {/* Thumbnail */}
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/30">
                    {isCurrentTrack(file.filename) && isPlaying ? (
                      <div className="playing-indicator">
                        <span />
                        <span />
                        <span />
                        <span />
                      </div>
                    ) : (
                      <Music2 className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play className="w-5 h-5 text-primary-foreground" />
                  </motion.div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">
                    {file.filename.replace(/\.[^/.]+$/, '')}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <File className="w-3 h-3" />
                    {formatFileSize(file.size)} • {formatDateFlexible((file as any).modified)}
                  </p>
                </div>

                {/* Actions */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity btn-glow"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayFile(file);
                  }}
                >
                  <Play className="w-4 h-4 text-primary" />
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
