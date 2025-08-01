import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useLocation } from 'wouter';
import defaultMusicFile from '@assets/lute_1753990497210.mp3';

interface BackgroundMusicContextType {
  isPlaying: boolean;
  isMuted: boolean;
  toggleMusic: () => void;
  startMusic: () => void;
}

const BackgroundMusicContext = createContext<BackgroundMusicContextType | undefined>(undefined);

interface BackgroundMusicProviderProps {
  children: ReactNode;
}

export function BackgroundMusicProvider({ children }: BackgroundMusicProviderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Default to muted/off
  const [location] = useLocation();
  const wasPlayingBeforeHidden = useRef(false);
  const hasTriedAutoplay = useRef(false);



  // Initialize audio track (no need to change based on combat state)
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio(defaultMusicFile);
      audio.loop = true;
      audio.volume = 0.3;
      audio.preload = 'auto';
      audioRef.current = audio;

      // Set up event listeners
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false);
      const handleError = () => {
        setIsPlaying(false);
        console.warn('Background music failed to load');
      };

      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
    }
  }, []);

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!audioRef.current) return;

      if (document.hidden) {
        wasPlayingBeforeHidden.current = !audioRef.current.paused;
      } else {
        if (wasPlayingBeforeHidden.current && !isMuted && audioRef.current.paused) {
          audioRef.current.play().catch(() => {
            setIsPlaying(false);
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isMuted]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    
    if (isMuted || audioRef.current.paused) {
      // Turn music on
      setIsMuted(false);
      audioRef.current.play().catch((error) => {
        console.warn('Could not play background music:', error.message);
        setIsPlaying(false);
      });
    } else {
      // Turn music off
      audioRef.current.pause();
      setIsMuted(true);
      setIsPlaying(false);
    }
  };

  const startMusic = () => {
    if (!audioRef.current || !isMuted) return;
    toggleMusic();
  };

  // Try to start music with delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasTriedAutoplay.current && audioRef.current && !isPlaying && !isMuted) {
        hasTriedAutoplay.current = true;
        audioRef.current.play().catch(() => {
          setIsMuted(true);
          console.warn('Background music autoplay blocked by browser - will start on user interaction');
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  const contextValue: BackgroundMusicContextType = {
    isPlaying,
    isMuted,
    toggleMusic,
    startMusic
  };

  return (
    <BackgroundMusicContext.Provider value={contextValue}>
      {children}
    </BackgroundMusicContext.Provider>
  );
}

export function useBackgroundMusic(): BackgroundMusicContextType {
  const context = useContext(BackgroundMusicContext);
  if (context === undefined) {
    throw new Error('useBackgroundMusic must be used within a BackgroundMusicProvider');
  }
  return context;
}