import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const submit = async () => {
    if (!username.trim() || !password) {
      toast.error('Enter username and password');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password);
      }
      navigate('/');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Authentication failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-void-deep">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card rounded-2xl p-8"
      >
        <h1 className="text-2xl font-bold mb-2">{mode === 'login' ? 'Login' : 'Create account'}</h1>
        <p className="text-muted-foreground mb-6">
          {mode === 'login'
            ? 'Sign in to your VoxWave account'
            : 'Create a username and password'}
        </p>

        <div className="space-y-3">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="bg-muted/50 border-0"
          />
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className="bg-muted/50 border-0"
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
          />
          <Button
            onClick={submit}
            disabled={loading}
            className="w-full bg-gradient-primary hover:opacity-90 btn-glow"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
          </Button>
        </div>

        <div className="mt-6 text-sm text-muted-foreground">
          {mode === 'login' ? (
            <button
              type="button"
              onClick={() => setMode('register')}
              className="hover:text-foreground transition-colors"
            >
              New here? Create an account
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="hover:text-foreground transition-colors"
            >
              Already have an account? Login
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
