import React, { useState } from 'react';
import {
  Play,
  Pause,
  Trash2,
  Search,
  ArrowUp,
  ArrowDown,
  Volume2,
  FolderPlus,
  RotateCcw,
} from 'lucide-react';
import { AudioTrack } from '../types';
import { formatTime } from '../utils/audioUtils';

interface TrackListProps {
  tracks: AudioTrack[];
  currentTrackId: string | null;
  isPlaying: boolean;
  onSelectTrack: (track: AudioTrack) => void;
  onRemoveTrack: (trackId: string) => void;
  onMoveTrack: (fromIndex: number, toIndex: number) => void;
  onClearPlaylist: () => void;
  onAddTracksClick: () => void;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  currentTrackId,
  isPlaying,
  onSelectTrack,
  onRemoveTrack,
  onMoveTrack,
  onClearPlaylist,
  onAddTracksClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTracks = tracks.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.fileName.toLowerCase().includes(q) ||
      t.format.toLowerCase().includes(q)
    );
  });

  const totalDuration = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  return (
    <div
      id="track-list-container"
      className="bg-zinc-900/70 rounded-xl border border-zinc-800/80 shadow-md backdrop-blur-sm overflow-hidden flex flex-col"
    >
      {/* Header bar */}
      <div className="p-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-100">Audio Playlist</h2>
            <span
              id="playlist-count-badge"
              className="px-2 py-0.5 text-xs font-medium text-zinc-300 bg-zinc-800 rounded-full border border-zinc-700/60"
            >
              {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
            </span>
          </div>
          {tracks.length > 0 && (
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              Total runtime: {formatTime(totalDuration)}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-playlist-add-more"
            type="button"
            onClick={onAddTracksClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/40 active:bg-amber-900/60 rounded-lg border border-amber-800/50 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Add Audio</span>
          </button>

          {tracks.length > 0 && (
            <button
              id="btn-playlist-clear-all"
              type="button"
              onClick={onClearPlaylist}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg border border-zinc-800 hover:border-red-900/40 transition-colors cursor-pointer"
              title="Clear all tracks from playlist"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Filter Bar */}
      {tracks.length > 3 && (
        <div className="px-4 py-2.5 bg-zinc-950/40 border-b border-zinc-800/60">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-playlist-search"
              type="text"
              placeholder="Search by title, artist, or file name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-700/80 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30"
            />
            {searchQuery && (
              <button
                id="btn-clear-search-query"
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Track List Items */}
      <div
        id="playlist-tracks-scroll-area"
        className="divide-y divide-zinc-800/50 max-h-[380px] overflow-y-auto"
      >
        {tracks.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm text-zinc-400">Your playlist is empty.</p>
            <p className="text-xs text-zinc-500">
              Drag and drop audio files above or click &quot;Browse Local Files&quot;.
            </p>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm text-zinc-400">No tracks match &quot;{searchQuery}&quot;</p>
            <button
              id="btn-reset-search-filter"
              type="button"
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset filter</span>
            </button>
          </div>
        ) : (
          filteredTracks.map((track) => {
            const isCurrent = track.id === currentTrackId;
            const originalIndex = tracks.findIndex((t) => t.id === track.id);

            return (
              <div
                key={track.id}
                id={`track-item-${track.id}`}
                onClick={() => onSelectTrack(track)}
                className={`group flex items-center justify-between p-3 transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-amber-500/10 hover:bg-amber-500/15'
                    : 'hover:bg-zinc-800/40'
                }`}
              >
                {/* Left: Indicator & Track Title */}
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                  {/* Track Number or Animated Equalizer */}
                  <div className="w-6 flex-shrink-0 flex items-center justify-center text-xs font-mono">
                    {isCurrent ? (
                      isPlaying ? (
                        <div className="flex items-end gap-0.5 h-3.5">
                          <span className="w-1 bg-amber-400 animate-[bounce_0.8s_infinite] h-3 rounded-full" />
                          <span className="w-1 bg-amber-400 animate-[bounce_0.6s_infinite_0.2s] h-2 rounded-full" />
                          <span className="w-1 bg-amber-400 animate-[bounce_0.9s_infinite_0.4s] h-3.5 rounded-full" />
                        </div>
                      ) : (
                        <Volume2 className="w-4 h-4 text-amber-400" />
                      )
                    ) : (
                      <>
                        <span className="text-zinc-500 group-hover:hidden">
                          {originalIndex + 1}
                        </span>
                        <Play className="w-3.5 h-3.5 text-zinc-300 hidden group-hover:block fill-current" />
                      </>
                    )}
                  </div>

                  {/* Title & Artist */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium truncate ${
                        isCurrent ? 'text-amber-300 font-semibold' : 'text-zinc-200'
                      }`}
                      title={track.title}
                    >
                      {track.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 truncate mt-0.5">
                      <span className="truncate">{track.artist}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-[10px] uppercase font-mono px-1 bg-zinc-800/80 rounded text-zinc-400 border border-zinc-700/50">
                        {track.format}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Duration, Reorder & Remove Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-mono text-zinc-400 mr-1">
                    {track.duration > 0 ? formatTime(track.duration) : '--:--'}
                  </span>

                  {/* Reorder Buttons (on hover) */}
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <button
                      id={`btn-move-up-${track.id}`}
                      type="button"
                      disabled={originalIndex === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveTrack(originalIndex, originalIndex - 1);
                      }}
                      className="p-1 text-zinc-400 hover:text-zinc-200 disabled:opacity-20 disabled:hover:text-zinc-400 rounded transition-colors"
                      title="Move up in queue"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`btn-move-down-${track.id}`}
                      type="button"
                      disabled={originalIndex === tracks.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveTrack(originalIndex, originalIndex + 1);
                      }}
                      className="p-1 text-zinc-400 hover:text-zinc-200 disabled:opacity-20 disabled:hover:text-zinc-400 rounded transition-colors"
                      title="Move down in queue"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    id={`btn-remove-track-${track.id}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveTrack(track.id);
                    }}
                    className="p-1.5 text-zinc-500 hover:text-red-400 rounded transition-colors opacity-70 group-hover:opacity-100"
                    title="Remove from playlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
