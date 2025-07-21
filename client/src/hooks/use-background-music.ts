import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import defaultMusicFile from '@assets/Pixelated Dreams ext v1.2_1753061935579.mp3';
import battleMusicFile from '@assets/Whispers of Aht Urghan ext v2_1753065927311.mp3';

export function useBackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [location] = useLocation();

  // Determine which music track to use based on current page
  const getMusicTrack = () => {
    if (location.startsWith('/battle')) {
      return battleMusicFile;
    }
    return defaultMusicFile;
  };

  useEffect(() => {
    const requiredTrack = getMusicTrack();
    
    // If track needs to change, update it
    if (currentTrack !== requiredTrack) {
      // Stop current audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      // Create new audio element with the correct track
      const audio = new Audio(requiredTrack);
      audio.loop = true;
      audio.volume = 0.3; // Set to 30% volume to not be overwhelming
      audioRef.current = audio;
      setCurrentTrack(requiredTrack);

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
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
      };
    }
  }, [isMuted, location]);

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