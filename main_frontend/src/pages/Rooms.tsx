import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Users, Plus, Copy, LogIn, Music2, Crown, Loader2 } from 'lucide-react';
import axios from 'axios';
import { usePlayer } from '@/contexts/PlayerContext';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';

interface Room {
  id: string;
  name: string;
  host: string;
  listeners: number;
  currentTrack?: string;
}

const API_BASE = '';

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [inviteLink, setInviteLink] = useState<string>('');
  const wsRef = useRef<WebSocket | null>(null);
  const { currentTrack, isPlaying, play, pause, seek } = usePlayer();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const createRoom = async () => {
    if (!user?.username) {
      toast.error('Please login');
      return;
    }
    if (!newRoomName.trim()) {
      toast.error('Please enter a room name');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/create-room`);
      const room = response.data;
      setInviteLink(room.join_url || '');
      toast.success('Room created!');
      connectToRoom(room.room_id, user.username, true);
    } catch (error) {
      console.error('Failed to create room:', error);
      toast.error('Failed to create room. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const connectToRoom = useCallback((roomId: string, userId: string, isHost = false) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsHost = window.location.host;
    const ws = new WebSocket(`${wsProtocol}://${wsHost}/ws/${roomId}/${userId}`);

    ws.onopen = () => {
      setActiveRoom({
        id: roomId,
        name: newRoomName.trim() ? newRoomName.trim() : `Room ${roomId}`,
        host: isHost ? userId : 'Unknown',
        listeners: 1,
      });
      setInviteLink(`${window.location.origin}/rooms?room=${roomId}`);
      setMessages(prev => [...prev, `Connected to room ${roomId}`]);
      toast.success('Connected to room!');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'room_state' && data.data) {
          const roomData = data.data;
          setActiveRoom(prev => prev ? {
            ...prev,
            host: roomData.host_id || prev.host,
            listeners: roomData.listener_count ?? prev.listeners,
          } : {
            id: roomId,
            name: `Room ${roomId}`,
            host: roomData.host_id || 'Unknown',
            listeners: roomData.listener_count ?? 1,
          });

          if (roomData.current_song) {
            play(roomData.current_song);
            if (typeof roomData.current_time === 'number') {
              seek(roomData.current_time);
            }
            if (!roomData.is_playing) {
              pause();
            }
          }
          return;
        }

        if (data.type === 'user_joined') {
          toast.info(`${data.user_id} joined the room`);
          return;
        }

        if (data.type === 'user_left') {
          toast.info(`${data.user_id} left the room`);
          return;
        }

        if (data.data) {
          const roomData = data.data;
          setActiveRoom(prev => prev ? {
            ...prev,
            host: roomData.host_id || prev.host,
            listeners: roomData.listener_count ?? prev.listeners,
          } : prev);

          if (roomData.current_song) {
            play(roomData.current_song);
          }
          if (typeof roomData.current_time === 'number') {
            seek(roomData.current_time);
          }
          if (roomData.is_playing) {
            play();
          } else {
            pause();
          }
          return;
        }

        setMessages(prev => [...prev, JSON.stringify(data)]);
      } catch (e) {
        setMessages(prev => [...prev, event.data]);
      }
    };

    ws.onclose = () => {
      setMessages(prev => [...prev, 'Disconnected from room']);
      setActiveRoom(null);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Connection error');
    };

    wsRef.current = ws;
  }, [play, pause, seek]);

  const joinRoom = () => {
    if (!user?.username) {
      toast.error('Please login');
      return;
    }
    if (!joinRoomId.trim()) {
      toast.error('Please enter a room ID');
      return;
    }
    connectToRoom(joinRoomId.trim(), user.username, false);
  };

  const leaveRoom = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setActiveRoom(null);
    setMessages([]);
    toast.info('Left the room');
  };

  const copyRoomId = () => {
    if (activeRoom) {
      const text = inviteLink || activeRoom.id;
      navigator.clipboard.writeText(text);
      toast.success('Invite link copied!');
    }
  };

  // Broadcast player state changes to room (if host)
  useEffect(() => {
    if (wsRef.current && activeRoom && wsRef.current.readyState === WebSocket.OPEN) {
      if (currentTrack) {
        wsRef.current.send(JSON.stringify({
          type: isPlaying ? 'play' : 'pause',
          current_time: 0,
          song: currentTrack,
        }));
      }
    }
  }, [isPlaying, currentTrack, activeRoom]);

  useEffect(() => {
    const roomFromUrl = searchParams.get('room');
    if (!roomFromUrl) return;
    setJoinRoomId(roomFromUrl);
    if (user?.username && !activeRoom) {
      connectToRoom(roomFromUrl, user.username, false);
    }
  }, [searchParams, user?.username, connectToRoom, activeRoom]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Radio className="w-8 h-8 text-accent" />
          Listen Together
        </h1>
        <p className="text-muted-foreground">
          Create or join a room to listen with friends in real-time
        </p>
      </motion.div>

      {!activeRoom ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Room */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Create Room</h2>
                <p className="text-sm text-muted-foreground">Start a listening session</p>
              </div>
            </div>

            <Input
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Room name"
              className="bg-muted/50 border-0"
            />
            <Button
              onClick={createRoom}
              disabled={loading}
              className="w-full bg-gradient-primary hover:opacity-90 btn-glow"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Crown className="w-4 h-4 mr-2" />
              )}
              Create as Host
            </Button>
          </motion.div>

          {/* Join Room */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <LogIn className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Join Room</h2>
                <p className="text-sm text-muted-foreground">Enter an existing session</p>
              </div>
            </div>

            <Input
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              placeholder="Room ID"
              className="bg-muted/50 border-0"
            />
            <Button
              onClick={joinRoom}
              variant="outline"
              className="w-full border-accent/50 hover:bg-accent/10"
            >
              <Users className="w-4 h-4 mr-2" />
              Join as Listener
            </Button>
          </motion.div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl overflow-hidden"
        >
          {/* Room Header */}
          <div className="p-6 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                <Radio className="w-7 h-7 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{activeRoom.name}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  {activeRoom.listeners} listener{activeRoom.listeners !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyRoomId}
                className="text-muted-foreground hover:text-foreground"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={leaveRoom}
              >
                Leave
              </Button>
            </div>
          </div>

          {/* Now Playing */}
          <div className="p-6 border-b border-border/50">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Now Playing</h3>
            {currentTrack ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted">
                  {currentTrack.thumbnail ? (
                    <img
                      src={currentTrack.thumbnail}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/30">
                      <Music2 className="w-8 h-8 text-primary" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold">{currentTrack.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentTrack.artist || 'Unknown Artist'}
                  </p>
                </div>
                {isPlaying && (
                  <div className="ml-auto playing-indicator">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No track playing</p>
            )}
          </div>

          {/* Activity Log */}
          <div className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Activity</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              <AnimatePresence>
                {messages.slice(-10).map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2"
                  >
                    {msg}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}

      {/* Info Section */}
      {!activeRoom && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center py-8"
        >
          <p className="text-muted-foreground">
            🎵 When the host plays, pauses, or seeks, all listeners stay in sync!
          </p>
        </motion.div>
      )}
    </div>
  );
}
