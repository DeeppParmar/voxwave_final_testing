import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/runtime';

export interface Track {
  id: string;
  title: string;
  artist?: string;
  thumbnail?: string;
  duration?: number;
  source: 'local' | 'youtube';
  url: string;
}

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  isLooping: boolean;
  isShuffling: boolean;
  queue: Track[];
  audioRef: React.RefObject<HTMLAudioElement>;
  play: (track?: Track) => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleLoop: () => void;
  toggleShuffle: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  playYoutube: (videoId: string, title: string, thumbnail?: string) => void;
  playLocal: (filename: string, title: string) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

const API_BASE = API_BASE_URL;
const QUEUE_STORAGE_KEY = 'voxwave_queue';

function safeParseQueue(value: string | null): Track[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(Boolean);
  } catch {
    return [];
  }
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [queue, setQueue] = useState<Track[]>(() => safeParseQueue(localStorage.getItem(QUEUE_STORAGE_KEY)));
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  }, [queue]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (isLooping) {
        audio.currentTime = 0;
        audio.play();
      } else {
        next();
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [isLooping, queue, currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const play = useCallback((track?: Track) => {
    if (track) {
      setCurrentTrack(track);
      const audio = audioRef.current;
      if (!audio) return;

      const isYoutube = track.source === 'youtube' && track.id.startsWith('yt-');
      const videoId = isYoutube ? track.id.slice(3) : null;
      let retries = 0;

      const setSrc = () => {
        audio.src = isYoutube && videoId
          ? `${API_BASE}/stream/${videoId}?_=${Date.now()}`
          : track.url;
        audio.load();
      };

      audio.onerror = null;
      audio.oncanplay = null;

      audio.onerror = () => {
        if (isYoutube && videoId && retries < 2) {
          retries += 1;
          setSrc();
          return;
        }
        toast.error('Failed to play audio. The stream may not be available.');
      };

      audio.oncanplay = () => {
        audio.play().catch(() => {
          toast.error('Failed to play audio. Please try again.');
        });
      };

      setSrc();
      return;
    }

    audioRef.current?.play().catch(() => {});
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const next = useCallback(() => {
    if (queue.length === 0) return;

    const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
    let nextIndex: number;

    if (isShuffling) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = (currentIndex + 1) % queue.length;
    }

    play(queue[nextIndex]);
  }, [queue, currentTrack, isShuffling, play]);

  const previous = useCallback(() => {
    if (queue.length === 0) return;

    if (currentTime > 3) {
      seek(0);
      return;
    }

    const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
    const prevIndex = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1;
    play(queue[prevIndex]);
  }, [queue, currentTrack, currentTime, play]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(Math.max(0, Math.min(1, vol)));
  }, []);

  const toggleLoop = useCallback(() => setIsLooping(prev => !prev), []);
  const toggleShuffle = useCallback(() => setIsShuffling(prev => !prev), []);

  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => {
      if (prev.some(t => t.id === track.id)) return prev;
      return [...prev, track];
    });
  }, []);

  const removeFromQueue = useCallback((trackId: string) => {
    setQueue(prev => prev.filter(t => t.id !== trackId));
  }, []);

  const clearQueue = useCallback(() => setQueue([]), []);

  const playYoutube = useCallback(async (videoId: string, title: string, thumbnail?: string) => {
    try {
      const track: Track = {
        id: `yt-${videoId}`,
        title,
        thumbnail,
        source: 'youtube',
        url: `${API_BASE}/stream/${videoId}`,
      };

      addToQueue(track);
      play(track);
    } catch (error) {
      toast.error(`Failed to play: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [play, addToQueue]);

  const playLocal = useCallback((filename: string, title: string) => {
    const track: Track = {
      id: `local-${filename}`,
      title,
      source: 'local',
      url: `${API_BASE}/songs/${filename}`,
    };
    addToQueue(track);
    play(track);
  }, [play, addToQueue]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        volume,
        currentTime,
        duration,
        isLooping,
        isShuffling,
        queue,
        audioRef,
        play,
        pause,
        toggle,
        next,
        previous,
        seek,
        setVolume,
        toggleLoop,
        toggleShuffle,
        addToQueue,
        removeFromQueue,
        clearQueue,
        playYoutube,
        playLocal,
      }}
    >
      <audio ref={audioRef} />
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
