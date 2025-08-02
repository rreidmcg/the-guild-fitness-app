import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroMusicFile from '@assets/guillotine_1754099888859.mp3';

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

    console.log('Setting up auth music with file:', heroMusicFile);

    // Set up event listeners
    const handlePlay = () => {
      console.log('Auth music started playing');
      setIsPlaying(true);
    };
    const handlePause = () => {
      console.log('Auth music paused');
      setIsPlaying(false);
    };
    const handleEnded = () => {
      console.log('Auth music ended');
      setIsPlaying(false);
    };
    const handleError = (e: Event) => {
      console.error('Auth music error:', e);
      console.log('Audio error details:', {
        error: audio.error,
        readyState: audio.readyState,
        networkState: audio.networkState,
        src: audio.src
      });
    };
    const handleCanPlay = () => {
      console.log('Auth music can play');
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    // Try autoplay on first load
    const tryAutoplay = () => {
      audio.play().then(() => {
        setIsMuted(false);
      }).catch((error) => {
        setIsMuted(true);
        console.warn('Auth music autoplay blocked - will start on user interaction:', error);
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
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.pause();
      audio.src = '';
    };
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) {
      console.warn('Audio ref not available');
      return;
    }

    if (audioRef.current.paused) {
      console.log('Attempting to play auth music');
      audioRef.current.play().then(() => {
        console.log('Auth music started successfully');
        setIsMuted(false);
      }).catch((error) => {
        console.error('Could not play auth music:', error);
        console.log('Audio element state:', {
          readyState: audioRef.current?.readyState,
          networkState: audioRef.current?.networkState,
          src: audioRef.current?.src,
          duration: audioRef.current?.duration
        });
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