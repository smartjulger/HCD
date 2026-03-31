// === Config ===

const VIDEOS = {
  testmp4: {
    src: 'mp4/testmp4.mp4',
    vtt: 'mp4/testmp4.vtt',
    lang: 'nl',
    label: 'Nederlands voetbal',
  },
  office: {
    src: 'mp4/the-office-clips.mp4',
    vtt: 'mp4/the-office-clips.vtt',
    lang: 'en',
    label: 'The Office',
  },
};

const SPEAKER_COLORS = {
  michael: '--color-michael',
  dwight:  '--color-dwight',
  jim:     '--color-jim',
  pam:     '--color-pam',
  oscar:   '--color-oscar',
  ryan:    '--color-ryan',
  kevin:   '--color-kevin',
  angela:  '--color-angela',
};

const AUDIO_CFG = {
  fftSize: 256,
  bassEndBin: 8,
  glowMaxSize: 40,
  glowMaxBlur: 60,
};

const SIZE_BOUNDS = { min: 10, max: 48, default: 16 };

// === DOM refs ===

const video          = document.getElementById('video');
const videoContainer = document.getElementById('videoContainer');
const subtitleOverlay = document.getElementById('subtitleOverlay');
const videoSelect    = document.getElementById('videoSelect');
const glowBtn        = document.getElementById('glowBtn');
const fullscreenBtn  = document.getElementById('fullscreenBtn');
const sizeDownBtn    = document.getElementById('sizeDown');
const sizeUpBtn      = document.getElementById('sizeUp');
const sizeLabel      = document.getElementById('sizeLabel');

// === VideoController ===

class VideoController {
  constructor(el) {
    this.el = el;
    this.current = null;
  }

  load(key) {
    const def = VIDEOS[key];
    if (!def) return;

    this.el.pause();

    // Verwijder oude track elementen
    [...this.el.querySelectorAll('track')].forEach(t => t.remove());

    // Nieuwe video source
    this.el.src = def.src;

    // Nieuw track element
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = def.label;
    track.srclang = def.lang;
    track.src = def.vtt;
    this.el.appendChild(track);

    this.el.load();
    this.current = key;

    // Zet mode op 'hidden' zodra metadata geladen is
    // 'hidden' = cues beschikbaar via JS, geen native rendering
    this.el.addEventListener('loadedmetadata', () => {
      const tt = this.el.textTracks[0];
      if (tt) tt.mode = 'hidden';
    }, { once: true });
  }
}

// === SubtitleRenderer ===

function parseCueText(rawText) {
  const voiceTagRe = /<v\s+([^>]+)>([\s\S]*?)(?:<\/v>|$)/g;
  const segments = [];
  let match;
  let lastIndex = 0;

  while ((match = voiceTagRe.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      const plain = rawText.slice(lastIndex, match.index).trim();
      if (plain) segments.push({ speaker: null, text: plain });
    }
    segments.push({ speaker: match[1].trim(), text: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < rawText.length) {
    const trailing = rawText.slice(lastIndex).trim();
    if (trailing) segments.push({ speaker: null, text: trailing });
  }

  if (segments.length === 0 && rawText.trim()) {
    segments.push({ speaker: null, text: rawText.trim() });
  }

  return segments;
}

function getSpeakerColor(speakerName) {
  if (!speakerName) return '#ffffff';
  const key = speakerName.toLowerCase().split(' ')[0];
  const cssVar = SPEAKER_COLORS[key];
  if (!cssVar) return '#ffffff';
  return getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
}

class SubtitleRenderer {
  constructor(videoEl, overlayEl) {
    this.video = videoEl;
    this.overlay = overlayEl;
    this._lastKey = '';
  }

  render() {
    const tt = this.video.textTracks[0];
    if (!tt || tt.mode === 'disabled') {
      this.overlay.innerHTML = '';
      return;
    }

    const t = this.video.currentTime - 2.5;
    const activeCues = tt.cues
      ? [...tt.cues].filter(c => c.startTime <= t && c.endTime > t)
      : [];

    // Stabiliteitcheck — geen DOM update als cues niet veranderd zijn
    const key = activeCues.map(c => c.startTime + '|' + c.endTime).join(',');
    if (key === this._lastKey) return;
    this._lastKey = key;

    this.overlay.innerHTML = '';

    for (const cue of activeCues) {
      const segments = parseCueText(cue.text);
      for (const seg of segments) {
        const div = document.createElement('div');
        div.className = 'subtitle-line';
        div.textContent = seg.text;
        const color = getSpeakerColor(seg.speaker);
        div.style.borderLeftColor = color;
        div.style.color = color;
        this.overlay.appendChild(div);
      }
    }
  }
}

// === AudioAnalyzer ===

class AudioAnalyzer {
  constructor(videoEl) {
    this.video = videoEl;
    this.ctx = null;
    this.analyser = null;
    this.dataArray = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.ctx.createMediaElementSource(this.video);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = AUDIO_CFG.fftSize;
      this.analyser.smoothingTimeConstant = 0.8;
      source.connect(this.analyser);
      this.analyser.connect(this.ctx.destination); // kritisch: anders geen audio
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.initialized = true;
    } catch (e) {
      console.warn('AudioContext kon niet worden gestart:', e);
    }
  }

  getFrequencyData() {
    if (!this.initialized) return;
    this.analyser.getByteFrequencyData(this.dataArray);
  }

  getBassAverage() {
    if (!this.initialized) return 0;
    let sum = 0;
    for (let i = 0; i < AUDIO_CFG.bassEndBin; i++) sum += this.dataArray[i];
    return sum / AUDIO_CFG.bassEndBin;
  }
}

// === VisualEffects ===

class VisualEffects {
  constructor(containerEl) {
    this.container = containerEl;
    this.glowEnabled = true;
  }

  applyGlow(bassAvg) {
    if (!this.glowEnabled) {
      this.container.style.removeProperty('--glow-size');
      this.container.style.removeProperty('--glow-blur');
      this.container.style.removeProperty('--glow-color');
      return;
    }
    const t = Math.min(bassAvg / 255, 1);
    if (t < 0.05) {
      this.container.style.removeProperty('--glow-size');
      this.container.style.removeProperty('--glow-blur');
      this.container.style.removeProperty('--glow-color');
      return;
    }
    const size = Math.round(t * AUDIO_CFG.glowMaxSize);
    const blur = Math.round(t * AUDIO_CFG.glowMaxBlur);
    const hue = Math.round(30 - t * 30);
    this.container.style.setProperty('--glow-size', size + 'px');
    this.container.style.setProperty('--glow-blur', blur + 'px');
    this.container.style.setProperty('--glow-color', `hsl(${hue}, 90%, 50%)`);
  }
}

// === Ondertitel grootte ===

let subtitleSize = SIZE_BOUNDS.default;

function applySubtitleSize() {
  document.documentElement.style.setProperty('--subtitle-size', subtitleSize + 'px');
  sizeLabel.textContent = subtitleSize + 'px';
}

sizeDownBtn.addEventListener('click', () => {
  subtitleSize = Math.max(SIZE_BOUNDS.min, subtitleSize - 2);
  applySubtitleSize();
});

sizeUpBtn.addEventListener('click', () => {
  subtitleSize = Math.min(SIZE_BOUNDS.max, subtitleSize + 2);
  applySubtitleSize();
});

// === Fullscreen ===

fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    videoContainer.requestFullscreen().catch(err => {
      console.warn('Fullscreen niet mogelijk:', err);
    });
  } else {
    document.exitFullscreen();
  }
});

document.addEventListener('fullscreenchange', () => {
  fullscreenBtn.textContent = document.fullscreenElement
    ? 'Verlaat volledig scherm'
    : 'Volledig scherm';
});

// === Glow toggle ===

glowBtn.addEventListener('click', () => {
  visualEffects.glowEnabled = !visualEffects.glowEnabled;
  glowBtn.textContent = visualEffects.glowEnabled ? 'Glow: aan' : 'Glow: uit';
});

// === Video wissel ===

videoSelect.addEventListener('change', (e) => {
  videoController.load(e.target.value);
});

// === Hoofd animatie loop ===

function tick() {
  subtitleRenderer.render();

  if (audioAnalyzer.initialized && !video.paused) {
    audioAnalyzer.getFrequencyData();
    const bass = audioAnalyzer.getBassAverage();
    visualEffects.applyGlow(bass);
  } else if (!audioAnalyzer.initialized) {
    visualEffects.applyGlow(0);
  }

  requestAnimationFrame(tick);
}

// === Opstarten ===

const videoController  = new VideoController(video);
const subtitleRenderer = new SubtitleRenderer(video, subtitleOverlay);
const audioAnalyzer    = new AudioAnalyzer(video);
const visualEffects    = new VisualEffects(videoContainer);

// AudioContext pas initialiseren bij eerste play (browser autoplay policy)
video.addEventListener('play', () => audioAnalyzer.init(), { once: true });

videoController.load('testmp4');
requestAnimationFrame(tick);
