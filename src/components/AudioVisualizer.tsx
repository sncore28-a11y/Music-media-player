import React, { useEffect, useRef } from 'react';
import { VisualizerMode } from '../types';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  mode: VisualizerMode;
  onToggleMode?: () => void;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  analyser,
  isPlaying,
  mode,
  onToggleMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mode === 'off') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bufferLength = 64;
    let dataArray = new Uint8Array(bufferLength);

    if (analyser) {
      analyser.fftSize = mode === 'bars' ? 128 : 256;
      bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
    }

    const dpr = window.devicePixelRatio || 1;
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(canvas);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);

      const width = canvas.getBoundingClientRect().width;
      const height = canvas.getBoundingClientRect().height;

      ctx.clearRect(0, 0, width, height);

      if (analyser && isPlaying) {
        if (mode === 'bars') {
          analyser.getByteFrequencyData(dataArray);
        } else {
          analyser.getByteTimeDomainData(dataArray);
        }
      } else {
        // Idle subtle breathing animation
        const time = Date.now() * 0.002;
        for (let i = 0; i < bufferLength; i++) {
          if (mode === 'bars') {
            dataArray[i] = Math.max(4, 18 * Math.sin(time + i * 0.2));
          } else {
            dataArray[i] = 128 + 12 * Math.sin(time + i * 0.15);
          }
        }
      }

      if (mode === 'bars') {
        // Frequency bars visualizer
        const barCount = 32;
        const gap = 3;
        const totalGap = gap * (barCount - 1);
        const barWidth = Math.max(2, (width - totalGap) / barCount);

        for (let i = 0; i < barCount; i++) {
          // Map to frequency bins with logarithmic emphasis
          const binIndex = Math.min(
            bufferLength - 1,
            Math.floor(Math.pow(i / barCount, 1.4) * bufferLength)
          );
          const value = dataArray[binIndex] || 0;
          const percent = value / 255;
          const barHeight = Math.max(3, percent * (height - 8));

          const x = i * (barWidth + gap);
          const y = height - barHeight;

          // Refined dark studio gradient (warm amber-orange accent to subtle cream)
          const gradient = ctx.createLinearGradient(0, height, 0, y);
          gradient.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
          gradient.addColorStop(0.6, 'rgba(245, 158, 11, 0.85)');
          gradient.addColorStop(1, 'rgba(254, 243, 199, 1)');

          ctx.fillStyle = gradient;
          // Draw rounded pill bar
          const radius = Math.min(barWidth / 2, 3);
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + barWidth - radius, y);
          ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
          ctx.lineTo(x + barWidth, height);
          ctx.lineTo(x, height);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
          ctx.fill();
        }
      } else if (mode === 'wave') {
        // Oscilloscope waveform visualizer
        ctx.beginPath();
        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Subtle glow effect
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
        ctx.lineWidth = 5;
        ctx.stroke();
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [analyser, isPlaying, mode]);

  if (mode === 'off') {
    return null;
  }

  return (
    <div
      id="audio-visualizer-container"
      className="relative w-full h-16 bg-zinc-950/60 rounded-lg p-2 border border-zinc-800/80 overflow-hidden cursor-pointer group"
      onClick={onToggleMode}
      title="Click to switch visualizer style (Bars / Wave / Off)"
    >
      <canvas
        ref={canvasRef}
        id="audio-visualizer-canvas"
        className="w-full h-full block"
      />
      <div className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] uppercase font-mono tracking-wider text-zinc-400 bg-zinc-900/90 px-1.5 py-0.5 rounded pointer-events-none">
        {mode} mode
      </div>
    </div>
  );
};
