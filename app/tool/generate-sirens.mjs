// Synthesize tiered alert sounds → android res/raw as 16-bit PCM WAV.
//   rb_low   yellow  soft two-tone chime
//   rb_med   orange  ascending three-tone warning
//   rb_high  red     civil-defense wail (hi-lo sweep, loud) — plays on alarm stream
//   rb_clear green   warm downward all-clear shimmer
import { writeFileSync, mkdirSync } from "node:fs";

const SR = 44100;
const dir = new URL("../android/app/src/main/res/raw/", import.meta.url);
mkdirSync(dir, { recursive: true });

function wav(samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE((s * 32767) | 0, 44 + i * 2);
  }
  return buf;
}

const sine = (f, t) => Math.sin(2 * Math.PI * f * t);
// short attack/release envelope to avoid clicks
const env = (t, dur, a = 0.02, r = 0.05) => {
  if (t < a) return t / a;
  if (t > dur - r) return Math.max(0, (dur - t) / r);
  return 1;
};

function build(dur, fn, amp) {
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = fn(t) * env(t, dur) * amp;
  }
  return out;
}

// yellow: G5 then C6, gentle
const low = build(0.55, (t) => sine(t < 0.25 ? 784 : 1047, t), 0.28);

// orange: three ascending tones
const med = build(0.9, (t) => {
  const f = t < 0.3 ? 660 : t < 0.6 ? 880 : 1100;
  return sine(f, t);
}, 0.5);

// red: civil-defense wail — frequency oscillates 520↔1180 Hz, ~0.4 Hz, loud, 4s
const high = build(4.0, (t) => {
  const f = 850 + 330 * Math.sin(2 * Math.PI * 0.42 * t);
  return 0.7 * Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(2 * Math.PI * f * 2 * t);
}, 0.92);

// green all-clear: downward warm shimmer C6→G5→C5
const clear = build(1.1, (t) => {
  const f = 1047 - 523 * (t / 1.1);
  return sine(f, t) + 0.4 * sine(f * 1.5, t);
}, 0.3);

for (const [name, s] of [["rb_low", low], ["rb_med", med], ["rb_high", high], ["rb_clear", clear]]) {
  writeFileSync(new URL(`${name}.wav`, dir), wav(s));
  console.log(`${name}.wav  ${(s.length / SR).toFixed(2)}s`);
}
