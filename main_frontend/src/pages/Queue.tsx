import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, Play, Trash2, Music2 } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import { Button } from '@/components/ui/button';

export default function Queue() {
  const { queue, currentTrack, isPlaying, play, clearQueue, removeFromQueue } = usePlayer();

  const items = useMemo(() => queue, [queue]);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <List className="w-8 h-8 text-accent" />
            Queue
          </h1>
          <p className="text-muted-foreground">
            {items.length} track{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="outline" onClick={clearQueue} disabled={items.length === 0}>
          Clear
        </Button>
      </motion.div>

      {items.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-12 text-center">
          <Music2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Queue is empty</h3>
          <p className="text-muted-foreground">Add songs from Search or Library</p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          <AnimatePresence>
            {items.map((t) => {
              const isCurrent = currentTrack?.id === t.id;
              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`glass-card rounded-xl p-4 flex items-center gap-4 group cursor-pointer transition-all hover:bg-muted/30 ${
                    isCurrent ? 'ring-1 ring-primary/50 bg-primary/5' : ''
                  }`}
                  onClick={() => play(t)}
                >
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {t.thumbnail ? (
                      <img src={t.thumbnail} alt={t.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/30">
                        <Music2 className="w-5 h-5 text-primary" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{t.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{t.artist || (t.source === 'youtube' ? 'YouTube' : 'Local')}</p>
                  </div>

                  {isCurrent && isPlaying ? (
                    <div className="playing-indicator">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : (
                    <button
                      className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity btn-glow"
                      onClick={(e) => {
                        e.stopPropagation();
                        play(t);
                      }}
                    >
                      <Play className="w-4 h-4 text-primary" />
                    </button>
                  )}

                  <button
                    className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromQueue(t.id);
                    }}
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
