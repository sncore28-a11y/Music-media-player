import React, { useRef, useState } from 'react';
import { UploadCloud, Music, Sparkles, FolderOpen } from 'lucide-react';

interface FileDropzoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  onLoadDemoTracks?: () => void;
  isCompact?: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFilesSelected,
  onLoadDemoTracks,
  isCompact = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      // Reset input value so same files can be reselected if needed
      e.target.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (isCompact) {
    return (
      <div id="compact-file-upload-section">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac,.aac,.weba"
          className="hidden"
          onChange={handleFileInputChange}
          id="compact-audio-file-input"
        />
        <button
          id="btn-compact-add-audio"
          onClick={triggerFileInput}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-md border border-zinc-700 transition-colors shadow-sm"
        >
          <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>Add Audio Files</span>
        </button>
      </div>
    );
  }

  return (
    <div
      id="main-file-dropzone-container"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full rounded-xl border-2 border-dashed p-6 text-center transition-all ${
        isDragOver
          ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
          : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac,.aac,.weba"
        className="hidden"
        onChange={handleFileInputChange}
        id="main-audio-file-input"
      />

      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-amber-400 shadow-inner">
          <UploadCloud className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-zinc-100">
            Drag & drop your local audio tracks here
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Supports MP3, WAV, FLAC, M4A, OGG, AAC. All audio stays 100% private in your browser.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <button
            id="btn-browse-local-files"
            type="button"
            onClick={triggerFileInput}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Music className="w-3.5 h-3.5" />
            <span>Browse Local Files</span>
          </button>

          {onLoadDemoTracks && (
            <button
              id="btn-load-demo-samples"
              type="button"
              onClick={onLoadDemoTracks}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-300 bg-zinc-800/80 hover:bg-zinc-700/80 rounded-lg border border-zinc-700 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Demo Sounds</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
