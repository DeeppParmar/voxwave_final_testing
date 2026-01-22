import { motion } from 'framer-motion';
import { Play, Music2, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { usePlayer, Track } from '@/contexts/PlayerContext';

const featuredTracks: Track[] = [
  {
    id: 'demo-1',
    title: 'Midnight Dreams',
    artist: 'Electronic Vibes',
    source: 'local',
    url: '',
    thumbnail: 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=300&h=300&fit=crop',
  },
  {
    id: 'demo-2',
    title: 'Neon Lights',
    artist: 'Synthwave Masters',
    source: 'local',
    url: '',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
  },
  {
    id: 'demo-3',
    title: 'Ocean Waves',
    artist: 'Chill Collective',
    source: 'local',
    url: '',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
  },
  {
    id: 'demo-4',
    title: 'City Pulse',
    artist: 'Urban Beats',
    source: 'local',
    url: '',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  const { currentTrack, isPlaying } = usePlayer();

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl glass-card p-8 md:p-12"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-accent/20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 mb-4"
          >
            <Sparkles className="w-5 h-5 text-accent" />
            <span className="text-sm text-accent font-medium">Premium Experience</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Welcome to <span className="text-gradient">VoxWave</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mb-8">
            Experience music like never before. Stream, discover, and share your favorite tracks
            with the most immersive audio platform.
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 rounded-xl bg-gradient-primary text-primary-foreground font-semibold btn-glow flex items-center gap-3"
          >
            <Play className="w-5 h-5" />
            Start Listening
          </motion.button>
        </div>
      </motion.section>

      {/* Quick Stats */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          { icon: Music2, label: 'Your Library', value: 'Explore tracks', color: 'primary' },
          { icon: TrendingUp, label: 'Trending', value: 'Discover new', color: 'accent' },
          { icon: Clock, label: 'Recent', value: 'Continue playing', color: 'primary' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            variants={item}
            whileHover={{ scale: 1.02, y: -5 }}
            className="glass-card p-6 rounded-2xl cursor-pointer group"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                stat.color === 'primary' ? 'bg-primary/20' : 'bg-accent/20'
              }`}
            >
              <stat.icon className={`w-6 h-6 ${stat.color === 'primary' ? 'text-primary' : 'text-accent'}`} />
            </div>
            <h3 className="font-semibold text-foreground group-hover:text-gradient transition-all">
              {stat.label}
            </h3>
            <p className="text-sm text-muted-foreground">{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Featured Tracks */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Featured Tracks</h2>
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            View all
          </button>
        </div>
        
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {featuredTracks.map((track, index) => (
            <motion.div
              key={track.id}
              variants={item}
              whileHover={{ y: -8 }}
              className="glass-card rounded-2xl overflow-hidden group cursor-pointer"
            >
              <div className="relative aspect-square">
                <img
                  src={track.thumbnail}
                  alt={track.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-void-deep via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1.1 }}
                  className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 btn-glow"
                >
                  <Play className="w-5 h-5 text-primary-foreground ml-1" />
                </motion.button>
              </div>
              <div className="p-4">
                <h3 className="font-semibold truncate">{track.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Now Playing Widget */}
      {currentTrack && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6"
        >
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
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Now Playing</p>
              <h3 className="font-semibold">{currentTrack.title}</h3>
              <p className="text-sm text-muted-foreground">{currentTrack.artist || 'Unknown Artist'}</p>
            </div>
            {isPlaying && (
              <div className="playing-indicator">
                <span />
                <span />
                <span />
                <span />
              </div>
            )}
          </div>
        </motion.section>
      )}
    </div>
  );
}
