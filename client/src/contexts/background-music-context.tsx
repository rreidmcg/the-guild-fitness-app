import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useLocation } from 'wouter';
import defaultMusicFile from '@assets/Pixelated Dreams ext v1.2_1753061935579.mp3';
import battleMusicFile from '@assets/finale_1753453869533.mp3';

interface BackgroundMusicContextType {
  isPlaying: boolean;
  isMuted: boolean;
  toggleMusic: () => void;
  startMusic: () => void;
  setInCombat: (inCombat: boolean) => void;
}

const BackgroundMusicContext = createContext<BackgroundMusicContextType | undefined>(undefined);

interface BackgroundMusicProviderProps {
  children: ReactNode;
}

export function BackgroundMusicProvider({ children }: BackgroundMusicProviderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Default to muted/off
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [inCombat, setInCombat] = useState(false);
  const [location] = useLocation();
  const wasPlayingBeforeHidden = useRef(false);
  const hasTriedAutoplay = useRef(false);

  // Determine which music track to use based on combat state
  const getMusicTrack = () => {
    if (inCombat) {
      return battleMusicFile;
    }
    return defaultMusicFile;
  };

  // Initialize or change audio track when combat state or location changes
  useEffect(() => {
    const requiredTrack = getMusicTrack();
    
    if (currentTrack !== requiredTrack || !audioRef.current) {
      const wasCurrentlyPlaying = isPlaying && !isMuted;
      
      // Clean up old audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }

      // Create new audio element
      const audio = new Audio(requiredTrack);
      audio.loop = true;
      audio.volume = 0.3;
      audio.preload = 'auto';
      audioRef.current = audio;
      setCurrentTrack(requiredTrack);

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

      // Only resume music if it was playing before track change (no auto-start on first load)
      if (wasCurrentlyPlaying) {
        audio.play().catch(() => {
          setIsPlaying(false);
          setIsMuted(true);
          console.warn('Background music autoplay blocked by browser');
        });
      }
    }
  }, [inCombat, currentTrack]);

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
    startMusic,
    setInCombat
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