import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import defaultMusicFile from '@assets/Pixelated Dreams ext v1.2_1753061935579.mp3';
import battleMusicFile from '@assets/Whispers of Aht Urghan ext v2_1753065927311.mp3';

export function useBackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [location] = useLocation();
  const wasPlayingBeforeHidden = useRef(false);

  // Determine which music track to use based on current page
  const getMusicTrack = () => {
    if (location.startsWith('/battle')) {
      return battleMusicFile;
    }
    return defaultMusicFile;
  };

  // Initialize or change audio track
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

      // Resume playing if it was playing before track change
      if (wasCurrentlyPlaying) {
        audio.play().catch(() => {
          setIsPlaying(false);
        });
      }
    }
  }, [location]);

  // Handle visibility changes to prevent music from stopping when switching tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!audioRef.current) return;

      if (document.hidden) {
        // Store playing state before hiding
        wasPlayingBeforeHidden.current = !audioRef.current.paused;
        // Don't pause the audio - let it continue playing in background
      } else {
        // Tab became visible again
        if (wasPlayingBeforeHidden.current && !isMuted && audioRef.current.paused) {
          // Resume if it was playing before and user hasn't muted it
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

  return {
    isPlaying,
    isMuted,
    toggleMusic,
    startMusic
  };
}