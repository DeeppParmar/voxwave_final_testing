import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { PlayerBar } from './PlayerBar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-void-deep">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[80px]" />
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="ml-64 pb-32 min-h-screen relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-8"
        >
          {children}
        </motion.div>
      </main>

      {/* Player Bar */}
      <PlayerBar />
    </div>
  );
}
