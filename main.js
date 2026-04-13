let size = 24;
document.documentElement.style.setProperty('--subtitle-size', size + 'px');
document.documentElement.style.setProperty('--subtitle-font', 'sans-serif');

function changeSize(delta) {
  size = Math.max(10, Math.min(48, size + delta));
  document.documentElement.style.setProperty('--subtitle-size', size + 'px');
  document.getElementById('sizeLabel').textContent = size + 'px';
}

function changeFont(font) {
  document.documentElement.style.setProperty('--subtitle-font', font);
}

function changeLanguage(lang) {
  const video = document.getElementById('video');
  for (const track of video.textTracks) {
    track.mode = track.language === lang ? 'showing' : 'hidden';
  }
}

const video = document.getElementById('video');
const wrapper = document.getElementById('video-wrapper');
const soundText = document.getElementById('sound-text');
const GLOW_START = 22;
const GLOW_END = 65;

video.addEventListener('timeupdate', () => {
  const t = video.currentTime;

  if (t >= GLOW_START && t < GLOW_END) {
    const progress = (t - GLOW_START) / (GLOW_END - GLOW_START); // 0 → 1
    const spread = Math.round(progress * 60);
    const blur   = Math.round(progress * 80);
    const opacity = (progress * 0.85).toFixed(3);

    wrapper.style.boxShadow =
      `0 0 ${blur}px ${spread}px rgba(180, 180, 180, ${opacity}),
       inset 0 0 ${Math.round(blur * 0.5)}px ${Math.round(spread * 0.3)}px rgba(180, 180, 180, ${(opacity * 0.4).toFixed(3)})`;

    soundText.style.fontSize = (12 + Math.round(progress * 80)) + 'px';
    soundText.style.opacity = (0.2 + progress * 0.6).toFixed(3);
  } else {
    wrapper.style.boxShadow = 'none';
    soundText.style.fontSize = '12px';
    soundText.style.opacity = '0';
  }
});

