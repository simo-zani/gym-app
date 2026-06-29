/**
 * Audio feedback via Web Audio API.
 * No file loading: tones are synthesised on the fly.
 *
 * Safari blocks AudioContext until user interaction.
 * Call unlockAudio() on the first user tap (e.g. "Inizia allenamento")
 * so that subsequent beeps work without user gesture.
 */

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  return _ctx;
}

export async function unlockAudio(): Promise<void> {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') await ctx.resume();
    // Play a silent buffer to fully unlock on iOS
    const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start();
  } catch {
    // Non-critical
  }
}

function playBeep(frequency = 880, duration = 200, volume = 0.3): void {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = 'sine';
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch {
    // Non-critical — silently ignore if audio is unavailable
  }
}

/** 3 ascending beeps — played at end of rest period. */
export function playRestEnd(): void {
  playBeep(660, 180);
  setTimeout(() => playBeep(880, 180), 200);
  setTimeout(() => playBeep(1100, 350), 400);
}

/** 2 low beeps — played at end of timed exercise. */
export function playTimedEnd(): void {
  playBeep(440, 300);
  setTimeout(() => playBeep(330, 500), 320);
}

/** Short soft tick — played at set completion ("Fatto"). */
export function playSetDone(): void {
  playBeep(660, 120, 0.2);
}

/** Vibration pattern for rest end (Android; no-op on iOS). */
export function vibrateRestEnd(): void {
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200]);
  }
}
