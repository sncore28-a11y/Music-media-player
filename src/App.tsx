/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Music,
  Headphones,
  Keyboard,
  Info,
  Sparkles,
  Upload,
} from 'lucide-react';
import { AudioTrack, RepeatMode, VisualizerMode } from './types';
import {
  parseFileNameMetadata,
  getFileFormatBadge,
  getAudioDuration,
  generateDemoTracks,
} from './utils/audioUtils';
import { FileDropzone } from './components/FileDropzone';
import { NowPlayingCard } from './components/NowPlayingCard';
import { PlayerControls } from './components/PlayerControls';
import { AudioVisualizer } from './components/AudioVisualizer';
import { TrackList } from './components/TrackList';

export default function App() {
  // Audio state
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('player_volume');
    return saved ? parseFloat(saved) : 0.8;
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [prevVolume, setPrevVolume] = useState<number>(0.8);
  const [isShuffle, setIsShuffle] = useState<boolean>(() => {
    return localStorage.getItem('player_shuffle') === 'true';
  });
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(() => {
    return (localStorage.getItem('player_repeat') as RepeatMode) || 'off';
  });
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>(() => {
    return (localStorage.getItem('player_viz_mode') as VisualizerMode) || 'bars';
  });

  // UI state
  const [isWindowDragActive, setIsWindowDragActive] = useState<boolean>(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // References
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const fileDropInputRef = useRef<HTMLInputElement | null>(null);

  const currentTrack = tracks[currentTrackIndex] || null;

  // Flash status message
  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage((current) => (current === msg ? null : current));
    }, 3000);
  };

  // Initialize Web Audio Graph lazily
  const ensureAudioContext = useCallback(() => {
    if (!audioRef.current) return null;

    if (!audioContextRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;

      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;

      try {
        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        sourceNodeRef.current = source;
      } catch (err) {
        console.warn('AudioContext source connection note:', err);
      }

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
    }

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    return analyserRef.current;
  }, []);

  // Process imported local audio files
  const handleFilesSelected = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((file) =>
      file.type.startsWith('audio/') ||
      /\.(mp3|wav|ogg|m4a|flac|aac|weba)$/i.test(file.name)
    );

    if (files.length === 0) {
      showStatus('No valid audio files detected.');
      return;
    }

    const newTracks: AudioTrack[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      const meta = parseFileNameMetadata(file.name);
      const format = getFileFormatBadge(file.name, file.type);
      const measuredDuration = await getAudioDuration(url);

      newTracks.push({
        id: `local-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        title: meta.title,
        artist: meta.artist,
        duration: measuredDuration,
        url,
        format,
        size: file.size,
        fileName: file.name,
        dateAdded: Date.now() + i,
      });
    }
         >meta<for (let i = 0; i < files.length; i++) {
  // ...
  const measuredDuration = await getAudioDuration(url);
  // ...
}
     Set
  
    setTracks((prev) => {
      const updated = [...prev, ...newTracks];
      // If no track was previously selected, select the first newly added one
      if (currentTrackIndex === -1 && updated.length > 0) {
        setCurrentTrackIndex(prev.length);
      }
      return updated;
    });

    showStatus(`Added ${newTracks.length} ${newTracks.length === 1 ? 'track' : 'tracks'} to playlist`);
  };

  // Load synthesized demo tracks
  const handleLoadDemoTracks = async () => {
    showStatus('Generating demo audio samples...');
    const demoTracks = await generateDemoTracks();
    setTracks((prev) => {
      const updated = [...prev, ...demoTracks];
      if (currentTrackIndex === -1 && updated.length > 0) {
        setCurrentTrackIndex(prev.length);
      }
      return updated;
    });
    showStatus('Loaded 2 built-in demo tracks.');
  };

  // Select and play a specific track
  const handleSelectTrack = (track: AudioTrack) => {
    const index = tracks.findIndex((t) => t.id === track.id);
    if (index !== -1) {
      if (index === currentTrackIndex) {
        // Toggle play/pause
        handlePlayPause();
      } else {
        setCurrentTrackIndex(index);
        setIsPlaying(true);
      }
    }
  };

  // Remove track from queue
  const handleRemoveTrack = (trackId: string) => {
    const indexToRemove = tracks.findIndex((t) => t.id === trackId);
    if (indexToRemove === -1) return;

    const trackToRemove = tracks[indexToRemove];
    if (trackToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(trackToRemove.url);
    }

    const newTracks = tracks.filter((t) => t.id !== trackId);
    setTracks(newTracks);

    if (indexToRemove === currentTrackIndex) {
      if (newTracks.length === 0) {
        setCurrentTrackIndex(-1);
        setIsPlaying(false);
      } else {
        const nextIndex = indexToRemove >= newTracks.length ? 0 : indexToRemove;
        setCurrentTrackIndex(nextIndex);
      }
    } else if (indexToRemove < currentTrackIndex) {
      setCurrentTrackIndex((prev) => prev - 1);
    }
  };

  // Reorder tracks
  const handleMoveTrack = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex >= tracks.length || toIndex < 0 || toIndex >= tracks.length) {
      return;
    }
    const updated = [...tracks];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    // Adjust currentTrackIndex
    if (currentTrackIndex === fromIndex) {
      setCurrentTrackIndex(toIndex);
    } else if (fromIndex < currentTrackIndex && toIndex >= currentTrackIndex) {
      setCurrentTrackIndex((prev) => prev - 1);
    } else if (fromIndex > currentTrackIndex && toIndex <= currentTrackIndex) {
      setCurrentTrackIndex((prev) => prev + 1);
    }

    setTracks(updated);
  };

  // Clear entire playlist
  const handleClearPlaylist = () => {
    tracks.forEach((t) => {
      if (t.url.startsWith('blob:')) {
        URL.revokeObjectURL(t.url);
      }
    });
    setTracks([]);
    setCurrentTrackIndex(-1);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    showStatus('Playlist cleared.');
  };

  // Play / Pause toggle
  const handlePlayPause = () => {
    if (!currentTrack) {
      if (tracks.length > 0) {
        setCurrentTrackIndex(0);
        setIsPlaying(true);
      }
      return;
    }

    ensureAudioContext();

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play().catch((err) => {
        console.warn('Playback initiation note:', err);
      });
      setIsPlaying(true);
    }
  };

  // Next track
  const handleNextTrack = useCallback(() => {
    if (tracks.length === 0) return;

    if (isShuffle && tracks.length > 1) {
      let nextIdx = Math.floor(Math.random() * tracks.length);
      if (nextIdx === currentTrackIndex) {
        nextIdx = (nextIdx + 1) % tracks.length;
      }
      setCurrentTrackIndex(nextIdx);
      setIsPlaying(true);
      return;
    }

    if (currentTrackIndex < tracks.length - 1) {
      setCurrentTrackIndex((prev) => prev + 1);
      setIsPlaying(true);
    } else if (repeatMode === 'all') {
      setCurrentTrackIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [tracks.length, isShuffle, currentTrackIndex, repeatMode]);

  // Previous track
  const handlePrevTrack = useCallback(() => {
    if (tracks.length === 0) return;

    // If more than 3 seconds in, restart current track
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    if (currentTrackIndex > 0) {
      setCurrentTrackIndex((prev) => prev - 1);
      setIsPlaying(true);
    } else if (repeatMode === 'all') {
      setCurrentTrackIndex(tracks.length - 1);
      setIsPlaying(true);
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    }
  }, [tracks.length, currentTrackIndex, repeatMode]);

  // Seek timeline
  const handleSeek = (targetTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  // Volume change
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : newVolume;
    }
    localStorage.setItem('player_volume', newVolume.toString());
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.volume = prevVolume > 0 ? prevVolume : 0.5;
      }
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      if (audioRef.current) {
        audioRef.current.volume = 0;
      }
    }
  };

  // Toggle Shuffle
  const handleToggleShuffle = () => {
    setIsShuffle((prev) => {
      const next = !prev;
      localStorage.setItem('player_shuffle', next.toString());
      showStatus(next ? 'Shuffle enabled' : 'Shuffle disabled');
      return next;
    });
  };

  // Toggle Repeat
  const handleToggleRepeat = () => {
    setRepeatMode((prev) => {
      const next = prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off';
      localStorage.setItem('player_repeat', next);
      const labels: Record<RepeatMode, string> = {
        off: 'Repeat off',
        all: 'Repeat all tracks',
        one: 'Repeat current track',
      };
      showStatus(labels[next]);
      return next;
    });
  };

  // Toggle Visualizer Mode
  const handleToggleVisualizer = () => {
    setVisualizerMode((prev) => {
      const next = prev === 'bars' ? 'wave' : prev === 'wave' ? 'off' : 'bars';
      localStorage.setItem('player_viz_mode', next);
      return next;
    });
  };

  // Update playback rate
  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    showStatus(`Playback speed: ${rate}x`);
  };

  // Sync audio element when current track changes
  useEffect(() => {
    if (!audioRef.current) return;

    if (currentTrack) {
      audioRef.current.src = currentTrack.url;
      audioRef.current.load();
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = isMuted ? 0 : volume;

      if (isPlaying) {
        ensureAudioContext();
        audioRef.current.play().catch((err) => {
          console.warn('Auto-play note:', err);
        });
      }
    } else {
      audioRef.current.removeAttribute('src');
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
    }
  }, [currentTrackIndex, tracks]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (e.shiftKey) {
          handleNextTrack();
        } else if (audioRef.current) {
          handleSeek(Math.min(duration, (audioRef.current.currentTime || 0) + 5));
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (e.shiftKey) {
          handlePrevTrack();
        } else if (audioRef.current) {
          handleSeek(Math.max(0, (audioRef.current.currentTime || 0) - 5));
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleVolumeChange(Math.min(1, volume + 0.05));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleVolumeChange(Math.max(0, volume - 0.05));
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleToggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [volume, isMuted, duration, isPlaying, currentTrack, tracks, handleNextTrack, handlePrevTrack]);

  // Window drag and drop overlay handlers
  useEffect(() => {
    let dragCounter = 0;

    const handleWindowDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.types?.includes('Files')) {
        setIsWindowDragActive(true);
      }
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        setIsWindowDragActive(false);
      }
    };

    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsWindowDragActive(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleFilesSelected(e.dataTransfer.files);
      }
    };

    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  return (
    <div
      id="app-root-container"
      className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased selection:bg-amber-400 selection:text-zinc-950"
    >
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        id="html5-audio-element"
        preload="metadata"
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            const trackDur = audioRef.current.duration;
            setDuration(trackDur);
            // Update track duration in list if it was 0
            if (currentTrack && currentTrack.duration === 0) {
              setTracks((prev) =>
                prev.map((t) => (t.id === currentTrack.id ? { ...t, duration: trackDur } : t))
              );
            }
          }
        }}
        onEnded={() => {
          if (repeatMode === 'one') {
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play();
            }
          } else {
            handleNextTrack();
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Hidden input for navbar or button triggers */}
      <input
        ref={fileDropInputRef}
        id="navbar-audio-file-input"
        type="file"
        multiple
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac,.aac,.weba"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesSelected(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* Global Drag and Drop Overlay */}
      {isWindowDragActive && (
        <div
          id="global-drag-overlay"
          className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-sm border-4 border-dashed border-amber-400 flex flex-col items-center justify-center p-6 pointer-events-none"
        >
          <div className="w-20 h-20 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 mb-4 animate-bounce">
            <Upload className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-100">Drop Audio Tracks to Add</h2>
          <p className="text-sm text-zinc-400 mt-2">MP3, WAV, FLAC, M4A, OGG supported</p>
        </div>
      )}

      {/* Top Header */}
      <header
        id="app-header-bar"
        className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-8 py-3.5"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-zinc-950 flex items-center justify-center shadow-md font-bold">
              <Headphones className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-zinc-100">
                Local Audio Player
              </h1>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Zero upload • Pure in-browser playback
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {tracks.length === 0 && (
              <button
                id="btn-nav-demo-sample"
                type="button"
                onClick={handleLoadDemoTracks}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-700/80 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Try Demo Audio</span>
                <span className="sm:hidden">Demo</span>
              </button>
            )}

            <button
              id="btn-nav-open-files"
              type="button"
              onClick={() => fileDropInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Music className="w-3.5 h-3.5" />
              <span>Open Tracks</span>
            </button>

            <button
              id="btn-toggle-shortcuts"
              type="button"
              onClick={() => setShowKeyboardShortcuts((prev) => !prev)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                showKeyboardShortcuts
                  ? 'bg-zinc-800 text-amber-400 border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-900'
              }`}
              title="Keyboard Shortcuts"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Floating Status Notification */}
      {statusMessage && (
        <div
          id="toast-status-notification"
          className="fixed bottom-6 right-6 z-40 px-3.5 py-2 bg-zinc-800 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 shadow-xl flex items-center gap-2 animate-fade-in"
        >
          <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <div
          id="shortcuts-dialog"
          className="max-w-6xl mx-auto w-full px-4 sm:px-8 mt-3"
        >
          <div className="p-4 bg-zinc-900/90 rounded-xl border border-zinc-800 text-xs text-zinc-300 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <Keyboard className="w-3.5 h-3.5 text-amber-400" /> Hotkeys:
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 font-mono text-[11px]">
                  Space
                </kbd>{' '}
                Play/Pause
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 font-mono text-[11px]">
                  ← / →
                </kbd>{' '}
                Seek ±5s
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 font-mono text-[11px]">
                  Shift + ← / →
                </kbd>{' '}
                Prev/Next Track
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 font-mono text-[11px]">
                  ↑ / ↓
                </kbd>{' '}
                Volume
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 font-mono text-[11px]">
                  M
                </kbd>{' '}
                Mute
              </span>
            </div>
            <button
              id="btn-close-shortcuts-bar"
              type="button"
              onClick={() => setShowKeyboardShortcuts(false)}
              className="text-zinc-500 hover:text-zinc-300 text-xs px-2 py-1 rounded hover:bg-zinc-800"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Dashboard */}
      <main id="main-content-layout" className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* If no tracks are loaded yet, show large dropzone */}
        {tracks.length === 0 ? (
          <div className="py-6 space-y-6">
            <FileDropzone
              onFilesSelected={handleFilesSelected}
              onLoadDemoTracks={handleLoadDemoTracks}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div
                id="feature-card-privacy"
                className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-amber-400">
                  <Headphones className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-200">Local Only</h3>
                <p className="text-xs text-zinc-400">
                  Audio stays entirely in your browser memory. Nothing is uploaded to any server.
                </p>
              </div>

              <div
                id="feature-card-formats"
                className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-amber-400">
                  <Music className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-200">Format Versatility</h3>
                <p className="text-xs text-zinc-400">
                  Play MP3, WAV, FLAC, M4A, OGG, AAC, and WEBM audio files with crystal clarity.
                </p>
              </div>

              <div
                id="feature-card-visualizer"
                className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-200">Real-Time Visualizer</h3>
                <p className="text-xs text-zinc-400">
                  Built-in Web Audio frequency spectrum and oscilloscope responsive waveforms.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* When tracks exist: Two-column player & playlist layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Player, Visualizer & Controls */}
            <div className="lg:col-span-6 space-y-4">
              {/* Now Playing Vinyl Card */}
              <NowPlayingCard
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                currentIndex={currentTrackIndex}
                totalTracks={tracks.length}
              />

              {/* Real-Time Audio Visualizer */}
              <AudioVisualizer
                analyser={analyserRef.current}
                isPlaying={isPlaying}
                mode={visualizerMode}
                onToggleMode={handleToggleVisualizer}
              />

              {/* Player Controls */}
              <PlayerControls
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                volume={volume}
                isMuted={isMuted}
                isShuffle={isShuffle}
                repeatMode={repeatMode}
                playbackRate={playbackRate}
                visualizerMode={visualizerMode}
                onPlayPause={handlePlayPause}
                onPrev={handlePrevTrack}
                onNext={handleNextTrack}
                onSeek={handleSeek}
                onVolumeChange={handleVolumeChange}
                onToggleMute={handleToggleMute}
                onToggleShuffle={handleToggleShuffle}
                onToggleRepeat={handleToggleRepeat}
                onChangePlaybackRate={handlePlaybackRateChange}
                onToggleVisualizer={handleToggleVisualizer}
                disabled={tracks.length === 0}
              />
            </div>

            {/* Right Column: Playlist & Dropzone */}
            <div className="lg:col-span-6 space-y-4">
              <TrackList
                tracks={tracks}
                currentTrackId={currentTrack?.id || null}
                isPlaying={isPlaying}
                onSelectTrack={handleSelectTrack}
                onRemoveTrack={handleRemoveTrack}
                onMoveTrack={handleMoveTrack}
                onClearPlaylist={handleClearPlaylist}
                onAddTracksClick={() => fileDropInputRef.current?.click()}
              />

              {/* Secondary compact dropzone for adding more files */}
              <div className="p-3 bg-zinc-900/40 rounded-xl border border-dashed border-zinc-800 hover:border-zinc-700 transition-colors text-center">
                <p className="text-xs text-zinc-400">
                  Drop more audio files anywhere or click{' '}
                  <button
                    id="btn-inline-browse"
                    type="button"
                    onClick={() => fileDropInputRef.current?.click()}
                    className="text-amber-400 hover:underline font-medium cursor-pointer"
                  >
                    browse files
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        id="app-footer"
        className="py-4 px-6 border-t border-zinc-900 text-center text-xs text-zinc-400"
      >
        <p>Local Audio Player • In-Browser Playback • No Server Upload</p>
      </footer>
    </div>
  );
}
