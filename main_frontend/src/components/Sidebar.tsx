import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, Library, Radio, Disc3, LogOut, User, ListMusic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/library', icon: Library, label: 'Library' },
  { to: '/queue', icon: ListMusic, label: 'Queue' },
  { to: '/rooms', icon: Radio, label: 'Rooms' },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed left-0 top-0 bottom-24 w-64 glass flex flex-col z-40"
    >
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="relative"
        >
          <Disc3 className="w-10 h-10 text-primary" />
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-lg" />
        </motion.div>
        <h1 className="text-2xl font-bold text-gradient">VoxWave</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.to;
            return (
              <motion.li
                key={item.to}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <NavLink
                  to={item.to}
                  className={cn(
                    'flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden',
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/10 rounded-xl"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <item.icon
                    className={cn(
                      'w-5 h-5 transition-transform duration-300 relative z-10',
                      isActive && 'text-primary',
                      'group-hover:scale-110'
                    )}
                  />
                  <span className="font-medium relative z-10">{item.label}</span>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-4 w-2 h-2 rounded-full bg-primary"
                    />
                  )}
                </NavLink>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      {/* Decorative gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-void-deep/80 to-transparent pointer-events-none" />

      {user && (
        <div className="px-4 pb-6 relative z-10">
          <div className="glass-card rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user.username}</p>
              <p className="text-xs text-muted-foreground">Logged in</p>
            </div>
            <button
              onClick={() => logout()}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
