// Chill lo-fi background loop, synthesized with Web Audio (no audio files).
// Browsers only allow sound after a click, so startMusic() is called from the first button handler.

let ctx, master, muted = false, started = false;
const BPM = 72;
const BEAT = 60 / BPM;
// Fmaj7 - Em7 - Dm7 - Cmaj7, two bars each
const CHORDS = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];
const SCALE = [69, 72, 74, 76, 79, 81]; // A minor pentatonic for the little melody
const freq = (m) => 440 * 2 ** ((m - 69) / 12);

function voice(type, f, t, dur, gain, dest = master) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = f;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + Math.min(0.4, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noiseBuffer(seconds) {
  const b = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function hit(t, { freq: f = 8000, dur = 0.05, gain = 0.05, type = "highpass" } = {}) {
  const s = ctx.createBufferSource();
  s.buffer = noiseBuffer(dur + 0.02);
  const filt = ctx.createBiquadFilter();
  filt.type = type;
  filt.frequency.value = f;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(filt).connect(g).connect(master);
  s.start(t);
}

function kick(t) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.setValueAtTime(110, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.25);
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.35);
}

function scheduleBar(bar, t) {
  const chord = CHORDS[Math.floor(bar / 2) % CHORDS.length];
  if (bar % 2 === 0) {
    chord.forEach((m) => voice("triangle", freq(m), t, BEAT * 8, 0.05));
    voice("sine", freq(chord[0] - 12), t, BEAT * 8, 0.12);
  }
  for (let b = 0; b < 4; b++) {
    const bt = t + b * BEAT;
    if (b === 0 || b === 2) kick(bt + (b === 2 ? BEAT * 0.5 : 0));
    if (b === 1 || b === 3) hit(bt, { freq: 1800, dur: 0.18, gain: 0.08, type: "bandpass" });
    hit(bt, { gain: 0.025 });
    hit(bt + BEAT / 2 + 0.03, { gain: 0.018 }); // lazy swing
    if (Math.random() < 0.35) voice("sine", freq(SCALE[Math.floor(Math.random() * SCALE.length)]), bt + BEAT / 2, BEAT * 1.5, 0.035);
  }
}

// If an audio file is dropped into public/music/ (bgm.mp3), loop that instead of the synth.
const TRACK = "/music/bgm.mp3";
let track;

export function startMusic() {
  if (started) return;
  started = true;
  ctx = new AudioContext(); // created inside the click so Chrome lets it play later
  track = new Audio(TRACK);
  track.loop = true;
  track.volume = 0.4;
  track.muted = muted;
  track.play().catch(() => {
    track = null; // no file (or it can't play): fall back to the synthesized loop
    startSynth();
  });
}

function startSynth() {
  ctx.resume();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.5;
  const warm = ctx.createBiquadFilter(); // lo-fi: roll off the highs
  warm.type = "lowpass";
  warm.frequency.value = 2200;
  const out = ctx.createGain();
  out.gain.value = 0.35;
  master.connect(warm).connect(out).connect(ctx.destination);

  // vinyl crackle
  const crackle = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() < 0.0008 ? Math.random() * 2 - 1 : (Math.random() * 2 - 1) * 0.01;
  crackle.buffer = buf;
  crackle.loop = true;
  crackle.connect(master);
  crackle.start();

  let bar = 0;
  let next = ctx.currentTime + 0.1;
  setInterval(() => {
    while (next < ctx.currentTime + 1.5) {
      scheduleBar(bar++, next);
      next += BEAT * 4;
    }
  }, 300);
}

// Floating mute toggle, bottom-right above the status bar.
export function mountMusicToggle() {
  const b = document.createElement("button");
  b.className = "music-toggle";
  b.textContent = "♫ Music: ON";
  b.onclick = () => {
    muted = !muted;
    b.textContent = muted ? "♫ Music: OFF" : "♫ Music: ON";
    if (master) master.gain.value = muted ? 0 : 0.5;
    if (track) track.muted = muted;
    startMusic();
  };
  document.body.append(b);
}
