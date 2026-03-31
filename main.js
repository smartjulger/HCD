let size = 30;
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

