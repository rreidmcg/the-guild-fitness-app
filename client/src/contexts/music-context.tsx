import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';

interface MusicContextType {
  isPlaying: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  playMusic: () => void;
  pauseMusic: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

interface MusicProviderProps {
  children: ReactNode;
  audioSrc: string;
}

export function MusicProvider({ children, audioSrc }: MusicProviderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element only once
    if (!audioRef.current) {
      audioRef.current = new Audio(audioSrc);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
      
      // Auto-play when provider mounts
      const playAudio = async () => {
        try {
          await audioRef.current?.play();
          setIsPlaying(true);
        } catch (error) {
          console.log('Auto-play blocked, waiting for user interaction');
        }
      };

      playAudio();
    }

    // Cleanup only when component unmounts completely
    return () => {
      // Don't cleanup the audio here to maintain continuity
    };
  }, [audioSrc]);

  const toggleMute = () => {
    if (!audioRef.current) return;
    
    const newMutedState = !isMuted;
    audioRef.current.muted = newMutedState;
    setIsMuted(newMutedState);
  };

  const playMusic = async () => {
    if (!audioRef.current) return;

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const pauseMusic = () => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    setIsPlaying(false);
  };

  return (
    <MusicContext.Provider value={{
      isPlaying,
      isMuted,
      toggleMute,
      playMusic,
      pauseMusic,
    }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}