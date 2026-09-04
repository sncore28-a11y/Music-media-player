import { AudioTrack } from '../types';

/**
 * Format seconds to mm:ss or hh:mm:ss
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const totalSecs = Math.floor(seconds);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (hours > 0) {
    return `${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Format bytes to readable size
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Parse metadata from file name
 */
export function parseFileNameMetadata(fileName: string): { title: string; artist: string } {
  // Strip extension
  const baseName = fileName.replace(/\.[^/.]+$/, '').trim();

  // Remove leading track numbers like "01. ", "01 - ", "01 "
  const cleanedName = baseName.replace(/^(\d+[\s._-]+)/, '').replace(/_/g, ' ');

  // Look for "Artist - Title" pattern
  if (cleanedName.includes(' - ')) {
    const parts = cleanedName.split(' - ');
    const artist = parts[0].trim();
    const title = parts.slice(1).join(' - ').trim();
    return {
      artist: artist || 'Unknown Artist',
      title: title || 'Untitled Track',
    };
  }

  return {
    artist: 'Local Artist',
    title: cleanedName || 'Untitled Track',
  };
}

/**
 * Determine audio file format badge
 */
export function getFileFormatBadge(fileName: string, mimeType?: string): string {
  const ext = fileName.split('.').pop()?.toUpperCase() || '';
  if (['MP3', 'WAV', 'OGG', 'M4A', 'FLAC', 'AAC', 'WEBM'].includes(ext)) {
    return ext;
  }
  if (mimeType) {
    if (mimeType.includes('mpeg')) return 'MP3';
    if (mimeType.includes('wav')) return 'WAV';
    if (mimeType.includes('ogg')) return 'OGG';
    if (mimeType.includes('flac')) return 'FLAC';
    if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'M4A';
  }
  return 'AUDIO';
}

/**
 * Measure audio duration by loading temporarily
 */
export function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'metadata';

    const onLoadedMetadata = () => {
      cleanup();
      resolve(audio.duration || 0);
    };

    const onError = () => {
      cleanup();
      resolve(0);
    };

    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('error', onError);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('error', onError);
    audio.src = url;

    // Timeout fallback after 3s
    setTimeout(() => {
      cleanup();
      resolve(audio.duration || 0);
    }, 3000);
  });
}

/**
 * Encodes an AudioBuffer into a WAV Blob
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit precision

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

/**
 * Generate lightweight high-quality synthetic demo tracks so the user has immediate audio to test
 */
export async function generateDemoTracks(): Promise<AudioTrack[]> {
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return [];

  const ctx = new AudioCtx();
  const sampleRate = 22050; // Lower sample rate for lightning-fast synthesis & small memory footprint

  // Track 1: "Lo-Fi Midnight Chords" (Warm jazz chords with gentle low pass)
  const duration1 = 12; // 12 seconds loop
  const totalSamples1 = sampleRate * duration1;
  const buffer1 = ctx.createBuffer(2, totalSamples1, sampleRate);
  const left1 = buffer1.getChannelData(0);
  const right1 = buffer1.getChannelData(1);

  // Chords: Dm9 -> G13 -> Cmaj9 -> Am7
  const chordFreqs = [
    [146.83, 220.0, 261.63, 329.63], // Dm9
    [196.0, 246.94, 329.63, 392.0],  // G13
    [130.81, 196.0, 246.94, 329.63], // Cmaj9
    [220.0, 261.63, 329.63, 392.0],  // Am7
  ];

  for (let i = 0; i < totalSamples1; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.floor((t / 3) % 4);
    const chordT = (t % 3) / 3;
    const freqs = chordFreqs[chordIndex];
    let sample = 0;

    // Chords with envelope
    const env = Math.exp(-chordT * 2.2) * (1 - Math.exp(-chordT * 40));
    for (const f of freqs) {
      // Warm vibrato
      const vib = 1 + 0.003 * Math.sin(2 * Math.PI * 4.5 * t);
      sample += Math.sin(2 * Math.PI * f * vib * t) * 0.12;
      sample += Math.sin(4 * Math.PI * f * vib * t) * 0.03;
    }
    sample *= env;

    // Gentle sub bass on root note
    const root = freqs[0] / 2;
    const bassEnv = Math.exp(-chordT * 3);
    sample += Math.sin(2 * Math.PI * root * t) * 0.18 * bassEnv;

    // Soft beat: kick on beat 1 and 3, snare/rim on 2 and 4
    const beatT = (t * 1.5) % 1;
    if (beatT < 0.2) {
      const kickFreq = 90 * Math.exp(-beatT * 25) + 40;
      sample += Math.sin(2 * Math.PI * kickFreq * beatT) * 0.15 * Math.exp(-beatT * 12);
    }

    // Gentle vinyl warmth
    const crackle = (Math.random() - 0.5) * 0.008;

    left1[i] = (sample + crackle) * 0.7;
    right1[i] = (sample * 0.95 + crackle) * 0.7;
  }

  const blob1 = audioBufferToWav(buffer1);
  const url1 = URL.createObjectURL(blob1);

  // Track 2: "Solaris Chill Ambient"
  const duration2 = 14;
  const totalSamples2 = sampleRate * duration2;
  const buffer2 = ctx.createBuffer(2, totalSamples2, sampleRate);
  const left2 = buffer2.getChannelData(0);
  const right2 = buffer2.getChannelData(1);

  const notes2 = [220, 277.18, 329.63, 440, 554.37]; // A major pentatonic

  for (let i = 0; i < totalSamples2; i++) {
    const t = i / sampleRate;
    let sLeft = 0;
    let sRight = 0;

    // Ambient sweeping drone
    const droneFreq = 110 + 2 * Math.sin(2 * Math.PI * 0.1 * t);
    const drone = Math.sin(2 * Math.PI * droneFreq * t) * 0.12;
    sLeft += drone;
    sRight += drone;

    // Sparkling bell notes
    const noteIdx = Math.floor((t * 0.8) % notes2.length);
    const noteT = (t * 0.8) % 1;
    const freq = notes2[noteIdx];
    const bellEnv = Math.exp(-noteT * 3.5);
    const bell = Math.sin(2 * Math.PI * freq * t) * 0.14 * bellEnv;

    // Stereo panning
    const pan = 0.5 + 0.4 * Math.sin(2 * Math.PI * 0.3 * t);
    sLeft += bell * (1 - pan);
    sRight += bell * pan;

    left2[i] = sLeft * 0.7;
    right2[i] = sRight * 0.7;
  }

  const blob2 = audioBufferToWav(buffer2);
  const url2 = URL.createObjectURL(blob2);

  // Close context to free hardware resources
  try {
    ctx.close();
  } catch {
    // ignore
  }

  return [
    {
      id: 'demo-1',
      title: 'Midnight Lo-Fi Chords',
      artist: 'Demo Synth Loop',
      album: 'Built-in Demo',
      duration: duration1,
      url: url1,
      format: 'DEMO',
      size: blob1.size,
      fileName: 'midnight_lofi_demo.wav',
      isDemo: true,
      dateAdded: Date.now(),
    },
    {
      id: 'demo-2',
      title: 'Solaris Chill Ambient',
      artist: 'Demo Ambient Pad',
      album: 'Built-in Demo',
      duration: duration2,
      url: url2,
      format: 'DEMO',
      size: blob2.size,
      fileName: 'solaris_ambient_demo.wav',
      isDemo: true,
      dateAdded: Date.now() + 1,
    },
  ];
}
