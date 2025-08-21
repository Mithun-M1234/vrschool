import { useState, useEffect, useRef } from 'react';
import HandTracker from '../services/handTracker';

export const useHandTracking = (options = {}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gestures, setGestures] = useState([]);
  const handTrackerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const initialize = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Video and canvas elements are required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if MediaPipe scripts are loaded
      if (!window.Hands || !window.Camera) {
        throw new Error('MediaPipe scripts not loaded. Please include MediaPipe dependencies.');
      }

      handTrackerRef.current = new HandTracker(options);
      await handTrackerRef.current.initialize(videoRef.current, canvasRef.current);

      // Set up gesture event listeners
      handTrackerRef.current.on('pinch_start', (data) => {
        addGesture(`Pinch start (${data.handedness} hand)`, 'pinch');
      });

      handTrackerRef.current.on('pinch_end', (data) => {
        addGesture(`Pinch end (${data.handedness} hand)`, 'pinch');
      });

      handTrackerRef.current.on('pinch_zoom', (data) => {
        addGesture(`Zoom ${data.delta > 0 ? 'out' : 'in'} (${data.handedness} hand)`, 'zoom');
      });

      handTrackerRef.current.on('swipe_left', (data) => {
        addGesture(`Swipe left (${data.handedness} hand)`, 'swipe');
      });

      handTrackerRef.current.on('swipe_right', (data) => {
        addGesture(`Swipe right (${data.handedness} hand)`, 'swipe');
      });

      handTrackerRef.current.on('swipe_up', (data) => {
        addGesture(`Swipe up (${data.handedness} hand)`, 'swipe');
      });

      handTrackerRef.current.on('swipe_down', (data) => {
        addGesture(`Swipe down (${data.handedness} hand)`, 'swipe');
      });

      setIsInitialized(true);
    } catch (err) {
      setError(err.message);
      console.error('Hand tracking initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addGesture = (description, type) => {
    const newGesture = {
      id: Date.now(),
      description,
      type,
      timestamp: new Date().toLocaleTimeString()
    };

    setGestures(prev => {
      const updated = [newGesture, ...prev].slice(0, 20); // Keep last 20 gestures
      return updated;
    });
  };

  const dispose = () => {
    if (handTrackerRef.current) {
      handTrackerRef.current.dispose();
      handTrackerRef.current = null;
    }
    setIsInitialized(false);
    setGestures([]);
  };

  useEffect(() => {
    return () => {
      dispose();
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    isInitialized,
    isLoading,
    error,
    gestures,
    handTracker: handTrackerRef.current,
    initialize,
    dispose
  };
};
