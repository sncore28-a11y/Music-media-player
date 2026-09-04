import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  Activity,
  Gauge,
} from 'lucide-react';
import { RepeatMode, VisualizerMode } from '../types';
import { formatTime } from '../utils/audioUtils';

interface PlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  playbackRate: number;
  visualizerMode: VisualizerMode;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onChangePlaybackRate: (rate: number) => void;
  onToggleVisualizer: () => void;
  disabled?: boolean;
}

const PLAYBACK_RATES = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isShuffle,
  repeatMode,
  playbackRate,
  visualizerMode,
  onPlayPause,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  onChangePlaybackRate,
  onToggleVisualizer,
  disabled = false,
}) => {
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);

  const effectiveDuration = duration > 0 ? duration : 0;
  const progressPercent = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!effectiveDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(pos * 100);
    setHoverTime(pos * effectiveDuration);
  };

  const handleTimelineMouseLeave = () => {
    setHoverTime(null);
    setHoverPosition(null);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !effectiveDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(pos * effectiveDuration);
  };

  const cyclePlaybackRate = () => {
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
    onChangePlaybackRate(PLAYBACK_RATES[nextIndex]);
  };

  return (
    <div
      id="player-controls-panel"
      className="p-5 bg-zinc-900/90 rounded-xl border border-zinc-800/80 shadow-lg space-y-4"
    >
      {/* Timeline Scrubber */}
      <div className="space-y-1.5">
        <div
          id="timeline-track-wrapper"
          className="relative h-4 flex items-center cursor-pointer group select-none"
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineMouseMove}
          onMouseLeave={handleTimelineMouseLeave}
        >
          {/* Background rail */}
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden group-hover:h-2 transition-all">
            {/* Played progress fill */}
            <div
              id="timeline-progress-fill"
              className="h-full bg-amber-400 rounded-full transition-[width] duration-75 relative"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>

          {/* Scrubber thumb */}
          <div
            id="timeline-thumb-indicator"
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform pointer-events-none"
            style={{ left: `calc(${progressPercent}% - 7px)` }}
          />

          {/* Hover time tooltip */}
          {hoverTime !== null && hoverPosition !== null && (
            <div
              id="timeline-hover-tooltip"
              className="absolute -top-7 -translate-x-1/2 px-1.5 py-0.5 text-[11px] font-mono bg-zinc-800 text-zinc-200 rounded border border-zinc-700 shadow-md pointer-events-none whitespace-nowrap"
              style={{ left: `${hoverPosition}%` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="flex justify-between items-center text-xs font-mono text-zinc-400">
          <span id="label-current-time">{formatTime(currentTime)}</span>
          <span id="label-total-duration">{formatTime(effectiveDuration)}</span>
        </div>
      </div>

      {/* Main Playback Control Buttons */}
      <div className="flex items-center justify-between gap-2">
        {/* Left utility: Shuffle */}
        <div className="flex items-center gap-1.5 w-24">
          <button
            id="btn-toggle-shuffle"
            type="button"
            onClick={onToggleShuffle}
            disabled={disabled}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isShuffle
                ? 'text-amber-400 bg-amber-950/40 border border-amber-800/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title={isShuffle ? 'Shuffle On' : 'Shuffle Off'}
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Prev, Play/Pause, Next */}
        <div className="flex items-center justify-center gap-3">
          <button
            id="btn-previous-track"
            type="button"
            onClick={onPrev}
            disabled={disabled}
            className="p-2.5 text-zinc-300 hover:text-zinc-100 active:text-zinc-400 rounded-full hover:bg-zinc-800/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Previous Track"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            id="btn-play-pause"
            type="button"
            onClick={onPlayPause}
            disabled={disabled}
            className="w-12 h-12 rounded-full bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-zinc-950 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            id="btn-next-track"
            type="button"
            onClick={onNext}
            disabled={disabled}
            className="p-2.5 text-zinc-300 hover:text-zinc-100 active:text-zinc-400 rounded-full hover:bg-zinc-800/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Next Track"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Right utility: Repeat mode */}
        <div className="flex items-center justify-end gap-1.5 w-24">
          <button
            id="btn-toggle-repeat"
            type="button"
            onClick={onToggleRepeat}
            disabled={disabled}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              repeatMode !== 'off'
                ? 'text-amber-400 bg-amber-950/40 border border-amber-800/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title={
              repeatMode === 'off'
                ? 'Repeat: Off'
                : repeatMode === 'all'
                ? 'Repeat: All'
                : 'Repeat: Current Track'
            }
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Secondary Bar: Volume, Speed & Visualizer Toggle */}
      <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Volume controls */}
        <div className="flex items-center gap-2 min-w-[140px]">
          <button
            id="btn-volume-mute"
            type="button"
            onClick={onToggleMute}
            className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-zinc-500" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          <input
            id="slider-volume-control"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-20 sm:w-24 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:accent-amber-300"
            title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          />

          <span className="font-mono text-[11px] text-zinc-500 w-8 text-right">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>

        {/* Speed and Visualizer Toggles */}
        <div className="flex items-center gap-2">
          {/* Playback speed */}
          <button
            id="btn-playback-speed"
            type="button"
            onClick={cyclePlaybackRate}
            className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800/80 hover:bg-zinc-700/80 active:bg-zinc-600 rounded text-zinc-300 font-mono text-[11px] border border-zinc-700/60 transition-colors cursor-pointer"
            title="Playback Speed (click to cycle)"
          >
            <Gauge className="w-3 h-3 text-amber-400" />
            <span>{playbackRate}x</span>
          </button>

          {/* Visualizer Mode Toggle */}
          <button
            id="btn-visualizer-toggle"
            type="button"
            onClick={onToggleVisualizer}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
              visualizerMode !== 'off'
                ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60 hover:text-zinc-200'
            }`}
            title="Toggle Visualizer Style"
          >
            <Activity className="w-3 h-3 text-amber-400" />
            <span className="capitalize">{visualizerMode}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
