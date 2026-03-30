 let size = 16;
 
      function changeSize(delta) {
        size = Math.max(10, Math.min(48, size + delta));
        document.documentElement.style.setProperty('--subtitle-size', size + 'px');
        document.getElementById('sizeLabel').textContent = size + 'px';
      }