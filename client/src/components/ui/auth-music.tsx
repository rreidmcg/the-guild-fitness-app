import React, { useEffect, useRef } from 'react';
import heroMusicFile from '@assets/time-of-the-hero_1753851442796.mp3';

interface AuthMusicProps {
  shouldPlay?: boolean;
}

export function AuthMusic({ shouldPlay = true }: AuthMusicProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!shouldPlay) return;

    // Create audio element for the heroic track
    const audio = new Audio(heroMusicFile);
    audio.loop = true;
    audio.volume = 0.4; // Slightly louder than background music for impact
    audio.preload = 'auto';
    audioRef.current = audio;

    // Start playing with user interaction fallback
    const playAudio = () => {
      if (audioRef.current) {
        audioRef.current.play().catch((error) => {
          console.warn('Auth music autoplay blocked:', error.message);
        });
      }
    };

    // Try to play immediately
    playAudio();

    // Also try on any user interaction
    const handleUserInteraction = () => {
      playAudio();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [shouldPlay]);

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

  return null; // This component doesn't render anything visible
}