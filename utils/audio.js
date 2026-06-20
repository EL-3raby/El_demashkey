/**
 * Demashki ERP — Offline-Compatible Live HTML5 Audio Synthesizer Chime Utility
 *
 * Synthesizes a two-tone notification chime using the native Web Audio API.
 * Zero dependencies, zero asset loads. Works entirely offline.
 *
 * Tone 1: E5 (659.25 Hz) — immediate attack, 0.6s decay
 * Tone 2: A5 (880 Hz) — 120ms delayed attack, 0.8s decay
 *
 * Usage:
 *   import { playChime } from '@/utils/audio';
 *   playChime();
 */

/**
 * Plays a two-tone synthesized notification chime.
 * Gracefully degrades if the Web Audio API is unavailable.
 */
export function playChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    // ── Tone 1: E5 (659.25 Hz) ──
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.12, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.6);

    // ── Tone 2: A5 (880 Hz) — slightly delayed for chime effect ──
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.8);
  } catch (e) {
    console.error('Audio Synthesizer Error: ', e);
  }
}

/**
 * Plays a short error / failure buzz tone.
 * Single low-frequency square wave with rapid decay.
 */
export function playErrorBuzz() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.error('Audio Synthesizer Error: ', e);
  }
}

/**
 * Plays a subtle click/tap feedback tone.
 * Very short sine burst for micro-interaction feedback.
 */
export function playTapFeedback() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    console.error('Audio Synthesizer Error: ', e);
  }
}
