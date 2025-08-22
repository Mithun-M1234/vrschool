import { useState, useEffect, useRef } from 'react';
import HandTracker from '../services/handTracker';

export const useHandTracking = (options = {}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gestures, setGestures] = useState([]);
  const handTrackerRef = useRef(null);
  const [handTrackerInstance, setHandTrackerInstance] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const initialize = async () => {
    if (handTrackerRef.current) {
      // Already initialized or in progress
      setIsInitialized(true);
      return;
    }
    if (!videoRef.current || !canvasRef.current) {
      setError('Video and canvas elements are required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Wait up to 6s for MediaPipe scripts if they are still loading
      const waitForScripts = async () => {
        const start = Date.now();
        while (!(window.Hands && window.Camera)) {
          if (Date.now() - start > 6000) {
            throw new Error('MediaPipe scripts not loaded (timeout).');
          }
          await new Promise(r => setTimeout(r, 120));
        }
      };
      await waitForScripts();

      handTrackerRef.current = new HandTracker(options);
      await handTrackerRef.current.initialize(videoRef.current, canvasRef.current);
      if (!handTrackerRef.current) {
        throw new Error('HandTracker failed to instantiate');
      }
      setHandTrackerInstance(handTrackerRef.current);

      // Set up gesture event listeners for debug log list (guarded)
      const map = [
        ['pinch_start', () => addGesture('Pinch start', 'pinch')],
        ['pinch_end', () => addGesture('Pinch end', 'pinch')],
        ['pinch_drag', (d) => addGesture(`Pinch drag dx:${d.dx.toFixed(3)} dy:${d.dy.toFixed(3)}`, 'drag')],
        ['point_up', () => addGesture('Point Up', 'zoom')],
        ['v_sign', () => addGesture('V Sign', 'zoom')]
      ];
      if (handTrackerRef.current && typeof handTrackerRef.current.on === 'function') {
        map.forEach(([ev, fn]) => handTrackerRef.current.on(ev, fn));
      } else {
        console.warn('HandTracker instance missing on() method when binding gestures');
      }

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
    setHandTrackerInstance(null);
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
  handTracker: handTrackerInstance,
    initialize,
    dispose
  };
};
