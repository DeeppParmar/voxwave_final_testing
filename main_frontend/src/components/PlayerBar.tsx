import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Music2,
} from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { AudioVisualizer } from './AudioVisualizer';

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    isLooping,
    isShuffling,
    toggle,
    next,
    previous,
    seek,
    setVolume,
    toggleLoop,
    toggleShuffle,
    audioRef,
  } = usePlayer();

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="fixed bottom-4 left-4 right-4 h-20 glass rounded-2xl z-50 flex items-center px-6 gap-6"
    >
      {/* Track Info */}
      <div className="flex items-center gap-4 w-64 min-w-0">
        <motion.div
          animate={isPlaying ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0"
        >
          {currentTrack?.thumbnail ? (
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/30">
              <Music2 className="w-6 h-6 text-primary" />
            </div>
          )}
          {isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="playing-indicator">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </motion.div>
        <div className="min-w-0">
          <p className="font-medium truncate text-foreground">
            {currentTrack?.title || 'No track selected'}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {currentTrack?.artist || 'Select a song to play'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 flex flex-col items-center gap-2">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleShuffle}
            className={cn(
              'p-2 rounded-full transition-all duration-300',
              isShuffling
                ? 'text-accent'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button
            onClick={previous}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggle}
            className="w-12 h-12 rounded-full bg-primary flex items-center justify-center btn-glow"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-primary-foreground" />
            ) : (
              <Play className="w-5 h-5 text-primary-foreground ml-1" />
            )}
          </motion.button>
          <button
            onClick={next}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </button>
          <button
            onClick={toggleLoop}
            className={cn(
              'p-2 rounded-full transition-all duration-300',
              isLooping
                ? 'text-accent'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xl flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <div className="flex-1 relative group">
            <Slider
              value={[progress]}
              max={100}
              step={0.1}
              onValueChange={([value]) => seek((value / 100) * duration)}
              className="cursor-pointer"
            />
          </div>
          <span className="text-xs text-muted-foreground w-10">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume & Visualizer */}
      <div className="flex items-center gap-4 w-48">
        <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVolume(volume === 0 ? 0.7 : 0)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {volume === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <Slider
            value={[volume * 100]}
            max={100}
            step={1}
            onValueChange={([value]) => setVolume(value / 100)}
            className="w-24"
          />
        </div>
      </div>
    </motion.div>
  );
}
