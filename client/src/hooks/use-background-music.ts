import { useEffect, useRef, useState } from 'react';
import backgroundMusicFile from '@assets/Pixelated Dreams ext v1.2_1753061935579.mp3';

export function useBackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Create audio element
    const audio = new Audio(backgroundMusicFile);
    audio.loop = true;
    audio.volume = 0.3; // Set to 30% volume to not be overwhelming
    audioRef.current = audio;

    // Handle visibility change to pause/resume music when app goes to background/foreground
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App went to background
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
        }
      } else {
        // App came to foreground
        if (audioRef.current && !isMuted) {
          audioRef.current.play().catch(() => {
            // Handle autoplay restrictions - user needs to interact first
            setIsPlaying(false);
          });
        }
      }
    };

    // Handle audio events
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      console.warn('Background music failed to load or play');
      setIsPlaying(false);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Try to start playing immediately (may fail due to autoplay restrictions)
    if (!isMuted) {
      audio.play().catch(() => {
        // Autoplay blocked - user needs to interact first
        setIsPlaying(false);
      });
    }

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      audio.pause();
      audio.src = '';
    };
  }, [isMuted]);

  const toggleMusic = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsMuted(true);
    } else {
      setIsMuted(false);
      audioRef.current.play().catch(() => {
        console.warn('Could not play background music');
      });
    }
  };

  const startMusic = () => {
    if (!audioRef.current || !isMuted) return;
    
    setIsMuted(false);
    audioRef.current.play().catch(() => {
      console.warn('Could not play background music');
    });
  };

  return {
    isPlaying,
    isMuted,
    toggleMusic,
    startMusic
  };
}