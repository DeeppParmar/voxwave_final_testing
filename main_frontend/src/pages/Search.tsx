import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, Play, Loader2, Youtube, Clock, User, Heart, Plus } from 'lucide-react';
import axios from 'axios';
import { usePlayer } from '@/contexts/PlayerContext';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface SearchResult {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  duration: string;
}

const API_BASE = '';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { playYoutube, addToQueue, currentTrack, isPlaying } = usePlayer();

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const response = await axios.get(`${API_BASE}/search`, {
        params: { q: query },
      });
      const data = response.data;

      if (typeof data === 'string' && data.trim().startsWith('<')) {
        toast.error('Search returned HTML instead of JSON. Restart frontend dev server (Vite) so the API proxy is active, and ensure backend is running.');
        setResults([]);
        return;
      }

      const rawResults =
        Array.isArray(data) ? data :
        Array.isArray(data?.results) ? data.results :
        Array.isArray(data?.result) ? data.result :
        Array.isArray(data?.data?.results) ? data.data.results :
        [];

      const normalizedResults = (rawResults as any[])
        .filter(Boolean)
        .map((r) => ({
          id: r.id,
          title: r.title,
          channel: r.channel || r.uploader || 'Unknown Channel',
          duration: r.duration,
          thumbnail: r.thumbnail || (r.id ? `https://i.ytimg.com/vi/${r.id}/hqdefault.jpg` : ''),
        }));

      setResults(normalizedResults);
    } catch (error) {
      toast.error('Search failed. Make sure the backend is running.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePlay = (result: SearchResult) => {
    playYoutube(result.id, result.title, result.thumbnail);
    toast.success(`Now playing: ${result.title}`);
  };

  const handleAddToQueue = (result: SearchResult) => {
    addToQueue({
      id: `yt-${result.id}`,
      title: result.title,
      artist: result.channel,
      thumbnail: result.thumbnail,
      source: 'youtube',
      url: `${API_BASE}/stream/${result.id}`,
    });
    toast.success('Added to queue');
  };

  const handleSave = async (result: SearchResult) => {
    try {
      await axios.post(`${API_BASE}/me/library`, {
        track_id: result.id,
        source: 'youtube',
        title: result.title,
        artist: result.channel,
        thumbnail: result.thumbnail,
      });
      toast.success('Saved to Your Library');
    } catch (e) {
      toast.error('Failed to save');
    }
  };

  const isCurrentTrack = (id: string) => {
    return currentTrack?.id === `yt-${id}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Search</h1>
        <p className="text-muted-foreground">
          Find and stream music from YouTube
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl" />
        <div className="relative glass-card rounded-2xl p-2 flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search for songs, artists, albums..."
              className="w-full pl-12 pr-4 py-6 bg-muted/50 border-0 rounded-xl text-lg focus-visible:ring-primary"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-8 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold btn-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <SearchIcon className="w-5 h-5" />
                Search
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Searching YouTube...</p>
        </div>
      ) : hasSearched && results.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-2xl p-12 text-center"
        >
          <SearchIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No results found</h3>
          <p className="text-muted-foreground">
            Try a different search term
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <AnimatePresence>
            {results.map((result) => (
              <motion.div
                key={result.id}
                variants={item}
                layout
                whileHover={{ scale: 1.02 }}
                className={`glass-card rounded-2xl overflow-hidden flex group cursor-pointer transition-all ${
                  isCurrentTrack(result.id) ? 'ring-1 ring-primary/50' : ''
                }`}
                onClick={() => handlePlay(result)}
              >
                {/* Thumbnail */}
                <div className="relative w-40 h-28 flex-shrink-0">
                  <img
                    src={result.thumbnail}
                    alt={result.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-void-deep/80" />
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center"
                  >
                    {isCurrentTrack(result.id) && isPlaying ? (
                      <div className="playing-indicator">
                        <span />
                        <span />
                        <span />
                        <span />
                      </div>
                    ) : (
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="w-12 h-12 rounded-full bg-primary flex items-center justify-center btn-glow"
                      >
                        <Play className="w-5 h-5 text-primary-foreground ml-1" />
                      </motion.div>
                    )}
                  </motion.div>
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {result.duration}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 p-4 flex flex-col justify-center">
                  <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-gradient transition-all">
                    {result.title}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="w-3 h-3" />
                    {result.channel}
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-accent">
                    <Youtube className="w-3 h-3" />
                    YouTube
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToQueue(result);
                      }}
                      className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                      title="Add to queue"
                    >
                      <Plus className="w-4 h-4 text-primary" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSave(result);
                      }}
                      className="p-2 rounded-full bg-accent/10 hover:bg-accent/20 transition-colors"
                      title="Save to library"
                    >
                      <Heart className="w-4 h-4 text-accent" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Empty State */}
      {!hasSearched && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
            <Youtube className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Search YouTube</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Enter a song name, artist, or album to search YouTube and stream directly
          </p>
        </motion.div>
      )}
    </div>
  );
}
