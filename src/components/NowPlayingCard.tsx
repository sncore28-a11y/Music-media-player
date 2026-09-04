import React from 'react';
import { Disc3, Music2, FileAudio } from 'lucide-react';
import { AudioTrack } from '../types';
import { formatFileSize } from '../utils/audioUtils';

interface NowPlayingCardProps {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  currentIndex: number;
  totalTracks: number;
}

export const NowPlayingCard: React.FC<NowPlayingCardProps> = ({
  currentTrack,
  isPlaying,
  currentIndex,
  totalTracks,
}) => {
  if (!currentTrack) {
    return (
      <div
        id="now-playing-empty-state"
        className="flex flex-col items-center justify-center p-8 bg-zinc-900/50 rounded-xl border border-zinc-800/80 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center text-zinc-500 mb-3">
          <Disc3 className="w-10 h-10 stroke-1" />
        </div>
        <h4 className="text-sm font-medium text-zinc-300">No Track Selected</h4>
        <p className="text-xs text-zinc-500 mt-1 max-w-xs">
          Select a track from the playlist or load local audio files to start playing.
        </p>
      </div>
    );
  }

  return (
    <div
      id="now-playing-card-container"
      className="p-5 bg-zinc-900/70 rounded-xl border border-zinc-800/80 shadow-md backdrop-blur-sm"
    >
      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* Animated Vinyl Disc */}
        <div className="relative flex-shrink-0">
          <div
            id="vinyl-record-disc"
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-zinc-950 border-4 border-zinc-800 shadow-xl flex items-center justify-center relative overflow-hidden transition-transform ${
              isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''
            }`}
            style={{
              backgroundImage: `radial-gradient(circle, #18181b 25%, #09090b 26%, #27272a 38%, #09090b 40%, #27272a 60%, #09090b 62%, #18181b 80%)`,
            }}
          >
            {/* Center Label */}
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-amber-500/90 border-2 border-zinc-900 flex items-center justify-center text-zinc-950 shadow-md">
              <Disc3 className="w-5 h-5 animate-pulse" />
            </div>
            {/* Spindle hole */}
            <div className="w-2 h-2 rounded-full bg-zinc-950 border border-zinc-900 absolute z-10" />
          </div>

          {/* Playing glow ring */}
          {isPlaying && (
            <div className="absolute inset-0 rounded-full border border-amber-500/30 animate-ping pointer-events-none" />
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0 text-center sm:text-left space-y-2 w-full">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span
              id="badge-track-format"
              className="px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-300 bg-amber-950/80 border border-amber-800/60 rounded uppercase whitespace-nowrap"
            >
              {currentTrack.format}
            </span>
            <span
              id="badge-track-index"
              className="px-2 py-0.5 text-[10px] font-medium text-zinc-400 bg-zinc-800/80 border border-zinc-700/60 rounded whitespace-nowrap"
            >
              Track {currentIndex + 1} of {totalTracks}
            </span>
            {currentTrack.size > 0 && (
              <span
                id="badge-track-size"
                className="px-2 py-0.5 text-[10px] font-medium text-zinc-400 bg-zinc-800/80 border border-zinc-700/60 rounded whitespace-nowrap"
              >
                {formatFileSize(currentTrack.size)}
              </span>
            )}
            {currentTrack.isDemo && (
              <span
                id="badge-track-demo"
                className="px-2 py-0.5 text-[10px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 rounded whitespace-nowrap"
              >
                Sample Track
              </span>
            )}
          </div>

          <div>
            <h3
              id="now-playing-title"
              className="text-lg sm:text-xl font-bold text-zinc-100 truncate tracking-tight"
              title={currentTrack.title}
            >
              {currentTrack.title}
            </h3>
            <p
              id="now-playing-artist"
              className="text-sm font-medium text-zinc-400 truncate mt-0.5"
            >
              {currentTrack.artist}
            </p>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-zinc-500 truncate pt-0.5 font-mono">
            <FileAudio className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
            <span className="truncate">{currentTrack.fileName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
