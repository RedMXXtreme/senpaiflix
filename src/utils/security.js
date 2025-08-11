// Security utilities to prevent inspect element and dev tools
export const disableInspect = () => {
  // Disable right-click context menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+Shift+I or Ctrl+Shift+J or Ctrl+U
    if ((e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) || 
        (e.ctrlKey && e.key === 'U')) {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+Shift+C (inspect element)
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      return false;
    }
  });

  // Disable drag and drop
  document.addEventListener('dragstart', (e) => {
    e.preventDefault();
    return false;
  });

  // Disable selection
  document.addEventListener('selectstart', (e) => {
    e.preventDefault();
    return false;
  });

  // Disable copy and cut
  document.addEventListener('copy', (e) => {
    e.preventDefault();
    return false;
  });

  document.addEventListener('cut', (e) => {
    e.preventDefault();
    return false;
  });

  // Attempt to detect and close dev tools
  const devtoolsDetector = () => {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    
    if (widthThreshold || heightThreshold) {
      // DevTools detected, attempt to close
      console.clear();
      // You could redirect or show a warning here
      console.log('DevTools detected');
    }
  };

  // Check for dev tools periodically
  setInterval(devtoolsDetector, 1000);

  // Disable console methods
  if (window.console) {
    console.clear();
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
    console.info = () => {};
    console.debug = () => {};
  }
};

// Additional protection: Disable image drag
export const disableImageDrag = () => {
  const images = document.getElementsByTagName('img');
  for (let img of images) {
    img.addEventListener('dragstart', (e) => {
      e.preventDefault();
      return false;
    });
  }
};

// Disable text selection
export const disableTextSelection = () => {
  const style = document.createElement('style');
  style.innerHTML = `
    * {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
  `;
  document.head.appendChild(style);
};
