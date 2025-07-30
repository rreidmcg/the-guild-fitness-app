import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroMusicFile from '@assets/time-of-the-hero_1753851442796.mp3';

export function AuthMusicBanner() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    const audio = new Audio(heroMusicFile);
    audio.loop = true;
    audio.volume = 0.4;
    audio.preload = 'auto';
    audioRef.current = audio;

    // Set up event listeners
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    // Try autoplay on first load
    const tryAutoplay = () => {
      audio.play().then(() => {
        setIsMuted(false);
      }).catch(() => {
        setIsMuted(true);
        console.warn('Auth music autoplay blocked - will start on user interaction');
      });
    };

    // Delay autoplay attempt
    const timer = setTimeout(tryAutoplay, 500);

    // Cleanup
    return () => {
      clearTimeout(timer);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      audio.src = '';
    };
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      audioRef.current.play().then(() => {
        setIsMuted(false);
      }).catch(() => {
        console.warn('Could not play auth music');
      });
    } else {
      audioRef.current.pause();
      setIsMuted(true);
    }
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMusic}
        className="text-white/80 hover:text-white hover:bg-white/10 transition-colors p-2"
      >
        {isPlaying ? (
          <Volume2 className="w-5 h-5" />
        ) : (
          <VolumeX className="w-5 h-5" />
        )}
      </Button>
    </div>
  );
}