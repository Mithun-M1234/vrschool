import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { GestureMapper, GestureDetector } from '../../utils/gestureMapper';
import { useThree } from './ThreeContext';
import toast from 'react-hot-toast';

const GestureContext = createContext();

export const useGesture = () => {
  const context = useContext(GestureContext);
  if (!context) {
    throw new Error('useGesture must be used within a GestureProvider');
  }
  return context;
};

export const GestureProvider = ({ children }) => {
  const { applyGestureAction } = useThree();
  
  const [isActive, setIsActive] = useState(false);
  const [currentGesture, setCurrentGesture] = useState(null);
  const [gestureConfig, setGestureConfig] = useState(null);
  const [detectedGestures, setDetectedGestures] = useState([]);
  const [sessionGestures, setSessionGestures] = useState([]);
  
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const gestureMapperRef = useRef(null);
  const gestureDetectorRef = useRef(new GestureDetector());
  const videoElementRef = useRef(null);

  const initMediaPipe = async () => {
    try {
      console.log('🤖 Initializing MediaPipe Hands...');

      // Initialize Hands
      const hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      hands.onResults(onHandsResults);
      handsRef.current = hands;

      console.log('✅ MediaPipe Hands initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize MediaPipe:', error);
      toast.error('Failed to initialize gesture recognition');
      return false;
    }
  };

  const startGestureDetection = async () => {
    if (!handsRef.current) {
      const initialized = await initMediaPipe();
      if (!initialized) return false;
    }

    try {
      // Get video element
      let videoElement = videoElementRef.current;
      if (!videoElement) {
        videoElement = document.createElement('video');
        videoElement.style.display = 'none';
        document.body.appendChild(videoElement);
        videoElementRef.current = videoElement;
      }

      // Initialize camera
      const camera = new Camera(videoElement, {
        onFrame: async () => {
          if (handsRef.current && videoElement) {
            await handsRef.current.send({ image: videoElement });
          }
        },
        width: 640,
        height: 480
      });

      await camera.start();
      cameraRef.current = camera;
      setIsActive(true);
      
      console.log('📹 Gesture detection started');
      toast.success('Gesture detection started! 👋');
      return true;
    } catch (error) {
      console.error('❌ Failed to start gesture detection:', error);
      toast.error('Failed to start camera. Please check permissions.');
      return false;
    }
  };

  const stopGestureDetection = () => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    
    if (videoElementRef.current) {
      document.body.removeChild(videoElementRef.current);
      videoElementRef.current = null;
    }
    
    setIsActive(false);
    setCurrentGesture(null);
    console.log('⏹️ Gesture detection stopped');
    toast('Gesture detection stopped', { icon: '⏹️' });
  };

  const onHandsResults = useCallback((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks;
      const gesture = gestureDetectorRef.current.detectGesture(landmarks);
      
      if (gesture && gestureMapperRef.current) {
        handleGesture(gesture);
      }
    } else {
      // No hands detected
      if (currentGesture) {
        setTimeout(() => setCurrentGesture(null), 1000);
      }
    }
  }, [currentGesture]);

  const handleGesture = useCallback((gesture) => {
    if (!gestureMapperRef.current) return;

    const gestureData = gestureMapperRef.current.processGesture(gesture);
    if (!gestureData) return;

    console.log(`🖐️ Gesture detected: ${gesture} → ${gestureData.action}`);
    
    // Update current gesture
    setCurrentGesture({
      gesture,
      action: gestureData.action,
      timestamp: Date.now(),
      confidence: gestureData.confidence
    });

    // Add to session gestures
    setSessionGestures(prev => [...prev, gestureData]);

    // Add to detected gestures with deduplication
    setDetectedGestures(prev => {
      const newGesture = {
        ...gestureData,
        id: Date.now()
      };
      return [newGesture, ...prev.slice(0, 9)]; // Keep last 10 gestures
    });

    // Apply gesture action to 3D model
    applyGestureAction(gestureData.action, gestureData.config);

    // Clear current gesture after delay
    setTimeout(() => {
      setCurrentGesture(null);
    }, 1500);
  }, [applyGestureAction]);

  const loadGestureConfig = async (modelData) => {
    try {
      let config;
      
      if (modelData.configFileName && modelData.configFileName.startsWith('http')) {
        // Load from Firebase Storage URL
        const response = await fetch(modelData.configFileName);
        config = await response.json();
      } else {
        // Load from local configs folder (demo)
        const configFile = modelData.configFileName || 
          `${modelData.fileName?.replace('.glb', '') || modelData.name}_gestureConfig.json`;
        const response = await fetch(`/configs/${configFile}`);
        config = await response.json();
      }
      
      setGestureConfig(config);
      gestureMapperRef.current = new GestureMapper(config);
      
      console.log('⚙️ Gesture config loaded:', config.modelName);
      toast.success(`Gesture config loaded for ${config.modelName}`);
      return config;
    } catch (error) {
      console.error('❌ Failed to load gesture config:', error);
      
      // Fallback config
      const fallbackConfig = {
        modelName: modelData.name || 'Demo Model',
        gestureMap: {
          pinch: 'zoomIn',
          pinchOut: 'zoomOut',
          openPalm: 'resetView',
          swipeLeft: 'rotateLeft',
          swipeRight: 'rotateRight',
          swipeUp: 'rotateUp',
          swipeDown: 'rotateDown'
        }
      };
      
      setGestureConfig(fallbackConfig);
      gestureMapperRef.current = new GestureMapper(fallbackConfig);
      
      toast('Using default gesture config', { icon: '⚙️' });
      return fallbackConfig;
    }
  };

  const getAvailableGestures = () => {
    return gestureMapperRef.current?.getAvailableGestures() || [];
  };

  const clearSession = () => {
    setSessionGestures([]);
    setDetectedGestures([]);
    setCurrentGesture(null);
  };

  const value = {
    isActive,
    currentGesture,
    gestureConfig,
    detectedGestures,
    sessionGestures,
    initMediaPipe,
    startGestureDetection,
    stopGestureDetection,
    loadGestureConfig,
    getAvailableGestures,
    clearSession,
  };

  return (
    <GestureContext.Provider value={value}>
      {children}
    </GestureContext.Provider>
  );
};
