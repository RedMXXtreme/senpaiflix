import { useEffect } from 'react';
import { disableInspect, disableImageDrag, disableTextSelection } from '../utils/security';

// Custom hook to apply security measures
export const useSecurity = () => {
  useEffect(() => {
    // Apply all security measures when component mounts
    disableInspect();
    disableImageDrag();
    disableTextSelection();

    // Cleanup function (though these are mostly permanent)
    return () => {
      // Security measures are designed to be persistent
    };
  }, []);
};

// Hook for specific security features
export const useDisableInspect = () => {
  useEffect(() => {
    disableInspect();
  }, []);
};

export const useDisableImageDrag = () => {
  useEffect(() => {
    disableImageDrag();
  }, []);
};

export const useDisableTextSelection = () => {
  useEffect(() => {
    disableTextSelection();
  }, []);
};
