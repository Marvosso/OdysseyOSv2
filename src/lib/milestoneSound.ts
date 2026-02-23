/**
 * Optional sound cue for writing milestones (e.g. word count, scene add).
 * Uses Web Audio API for a short, pleasant tone. No external files.
 */

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioContext;
}

/** Play a short success/milestone tone (optional; user can disable in settings later) */
export function playMilestoneSound(): void {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(523.25, now);
  osc.frequency.setValueAtTime(659.25, now + 0.08);
  osc.frequency.setValueAtTime(783.99, now + 0.16);
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  osc.start(now);
  osc.stop(now + 0.35);
}

/** Play a very subtle "add" cue (e.g. new scene/chapter) */
export function playAddSound(): void {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(440, now);
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.start(now);
  osc.stop(now + 0.15);
}
