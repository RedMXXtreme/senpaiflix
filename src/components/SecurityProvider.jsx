import React, { useEffect } from 'react';
import { disableInspect, disableImageDrag, disableTextSelection } from '../utils/security';

const SecurityProvider = ({ children }) => {
  useEffect(() => {
    // Apply security measures when the app loads
    disableInspect();
    disableImageDrag();
    disableTextSelection();

    // Additional protection: Clear console on load
    if (window.console) {
      console.clear();
    }

    // Prevent back button navigation
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = function () {
      window.history.go(1);
    };
  }, []);

  return <>{children}</>;
};

export default SecurityProvider;
