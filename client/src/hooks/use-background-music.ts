import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import defaultMusicFile from '@assets/Pixelated Dreams ext v1.2_1753061935579.mp3';
import battleMusicFile from '@assets/Whispers of Aht Urghan ext v2_1753065927311.mp3';

export function useBackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [deviceMuted, setDeviceMuted] = useState(false);
  const [location] = useLocation();

  // Check if device audio is muted or at zero volume
  const checkDeviceAudioState = () => {
    try {
      // Check if Web Audio API is available
      if ('AudioContext' in window || 'webkitAudioContext' in window) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        
        // Check if audio context is suspended (often indicates muted device)
        if (audioContext.state === 'suspended') {
          setDeviceMuted(true);
          return true;
        }
      }

      // Check system volume using a test audio element
      const testAudio = new Audio();
      testAudio.volume = 0.1; // Very low volume for testing
      testAudio.muted = false;
      
      // If we can detect the volume is effectively 0 or muted
      if (testAudio.volume === 0 || testAudio.muted) {
        setDeviceMuted(true);
        return true;
      }

      setDeviceMuted(false);
      return false;
    } catch (error) {
      // If we can't detect, assume device is not muted to be safe
      setDeviceMuted(false);
      return false;
    }
  };

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
            // Check device audio state before resuming
            const isDeviceMuted = checkDeviceAudioState();
            if (!isDeviceMuted) {
              audioRef.current.play().catch(() => {
                // Handle autoplay restrictions - user needs to interact first
                setIsPlaying(false);
              });
            }
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

      // Check device audio state before attempting to play
      const isDeviceMuted = checkDeviceAudioState();
      
      // Try to start playing immediately (may fail due to autoplay restrictions or device mute)
      if (!isMuted && !isDeviceMuted) {
        audio.play().catch(() => {
          // Autoplay blocked or device muted - user needs to interact first
          setIsPlaying(false);
        });
      } else if (isDeviceMuted) {
        // Device is muted, so don't attempt to play
        setIsPlaying(false);
        console.log('Device audio is muted, background music will not play');
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

    // Check device audio state before toggling
    const isDeviceMuted = checkDeviceAudioState();
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsMuted(true);
    } else {
      if (isDeviceMuted) {
        console.log('Device audio is muted, cannot play background music');
        return;
      }
      
      setIsMuted(false);
      audioRef.current.play().catch(() => {
        console.warn('Could not play background music - device may be muted or autoplay blocked');
      });
    }
  };

  const startMusic = () => {
    if (!audioRef.current || !isMuted) return;
    
    // Check device audio state before starting music
    const isDeviceMuted = checkDeviceAudioState();
    if (isDeviceMuted) {
      console.log('Device audio is muted, will not start background music');
      return;
    }
    
    setIsMuted(false);
    audioRef.current.play().catch(() => {
      console.warn('Could not play background music - device may be muted or autoplay blocked');
    });
  };

  // Monitor device audio state changes
  useEffect(() => {
    const handleAudioStateChange = () => {
      const isDeviceMuted = checkDeviceAudioState();
      if (isDeviceMuted && isPlaying) {
        // Device became muted while music was playing
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
        console.log('Device audio became muted, pausing background music');
      }
    };

    // Listen for various events that might indicate audio state changes
    document.addEventListener('visibilitychange', handleAudioStateChange);
    window.addEventListener('focus', handleAudioStateChange);
    window.addEventListener('blur', handleAudioStateChange);
    
    // Check audio state periodically (every 5 seconds)
    const audioStateInterval = setInterval(handleAudioStateChange, 5000);

    return () => {
      document.removeEventListener('visibilitychange', handleAudioStateChange);
      window.removeEventListener('focus', handleAudioStateChange);
      window.removeEventListener('blur', handleAudioStateChange);
      clearInterval(audioStateInterval);
    };
  }, [isPlaying]);

  return {
    isPlaying,
    isMuted,
    deviceMuted,
    toggleMusic,
    startMusic
  };
}