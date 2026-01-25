import { useEffect, useRef, useState } from 'react';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
}

export function AudioVisualizer({ audioRef, isPlaying }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const ensureAudioContextRunning = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
    } catch {
    }
  };

  useEffect(() => {
    const handleUserGesture = () => {
      ensureAudioContextRunning();
    };

    window.addEventListener('pointerdown', handleUserGesture);
    window.addEventListener('keydown', handleUserGesture);
    return () => {
      window.removeEventListener('pointerdown', handleUserGesture);
      window.removeEventListener('keydown', handleUserGesture);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas) return;

    const initAudio = () => {
      if (isInitialized) return;
      
      try {
        ensureAudioContextRunning();
        const audioContext = audioContextRef.current;
        if (!audioContext) return;
        const analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 64;
        
        if (!sourceRef.current) {
          sourceRef.current = audioContext.createMediaElementSource(audio);
          sourceRef.current.connect(analyzer);
          analyzer.connect(audioContext.destination);
        }
        
        analyzerRef.current = analyzer;
        setIsInitialized(true);
      } catch (e) {
        console.warn('Audio visualizer not available:', e);
      }
    };

    audio.addEventListener('play', initAudio);
    return () => audio.removeEventListener('play', initAudio);
  }, [audioRef, isInitialized]);

  useEffect(() => {
    return () => {
      try {
        audioContextRef.current?.close();
      } catch {
      }
      audioContextRef.current = null;
      analyzerRef.current = null;
      sourceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const analyzer = analyzerRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);

      if (!isPlaying || !analyzer) {
        // Draw static bars when not playing
        const barCount = 8;
        const barWidth = width / barCount - 2;
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#7c3aed');
        gradient.addColorStop(1, '#06b6d4');

        for (let i = 0; i < barCount; i++) {
          const barHeight = Math.random() * height * 0.3 + height * 0.1;
          ctx.fillStyle = gradient;
          ctx.fillRect(i * (barWidth + 2), height - barHeight, barWidth, barHeight);
        }
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyzer.getByteFrequencyData(dataArray);

      const barCount = 8;
      const barWidth = width / barCount - 2;

      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, '#7c3aed');
      gradient.addColorStop(1, '#06b6d4');

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor(i * (bufferLength / barCount));
        const barHeight = (dataArray[dataIndex] / 255) * height * 0.9 + height * 0.1;
        
        ctx.fillStyle = gradient;
        ctx.fillRect(i * (barWidth + 2), height - barHeight, barWidth, barHeight);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={64}
      height={32}
      className="rounded opacity-80"
    />
  );
}
