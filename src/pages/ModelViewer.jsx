import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useThree } from '../contexts/ThreeContext';
import { useAuth } from '../contexts/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { useHandTracking } from '../hooks/useHandTracking';
import HandTrackingVisualizer from '../components/HandTrackingVisualizer';
import HTMLLessonViewer from '../components/HTMLLessonViewer';
import { FaArrowLeft, FaCamera, FaVolumeUp, FaVolumeMute, FaExpand, FaCompress, FaHandPaper } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ViewerContainer = styled.div`
  position: relative;
  height: 100vh;
  background: #000;
  overflow: hidden;
`;

const CanvasContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const UIOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
`;

const TopBar = styled(motion.div)`
  position: absolute;
  top: 1rem;
  left: 1rem;
  right: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: all;
`;

const BackButton = styled.button`
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.9);
  }
`;

const ModelTitle = styled.h1`
  color: white;
  background: rgba(0, 0, 0, 0.7);
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  margin: 0;
  font-size: 1.5rem;
  backdrop-filter: blur(10px);
`;

const ControlPanel = styled(motion.div)`
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  pointer-events: all;
`;

const ControlButton = styled.button`
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.9);
  }

  &.active {
    background: #667eea;
  }
`;

const GestureStatus = styled(motion.div)`
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 15px;
  backdrop-filter: blur(10px);
  pointer-events: all;
  min-width: 200px;
`;

const StatusTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #667eea;
`;

const StatusText = styled.p`
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
`;

const GestureIndicator = styled.div`
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(102, 126, 234, 0.2);
  border-radius: 8px;
  font-weight: bold;
  text-align: center;
`;

const Instructions = styled(motion.div)`
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 1rem;
  border-radius: 15px;
  backdrop-filter: blur(10px);
  max-width: 300px;
  pointer-events: all;
`;

const InstructionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  z-index: 1000;
`;

const HandTrackingPanel = styled(motion.div)`
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  border-radius: 15px;
  padding: 1rem;
  min-width: 320px;
  pointer-events: all;
  backdrop-filter: blur(10px);
  border: 2px solid #667eea;
  z-index: 200;
  opacity: ${props => props.show ? 1 : 0};
  pointer-events: ${props => props.show ? 'all' : 'none'};
  transition: all 0.3s ease;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  color: white;
`;

const PanelTitle = styled.h3`
  margin: 0;
  color: #667eea;
  font-size: 1rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  
  &:hover {
    color: white;
  }
`;

const ModelViewer = () => {
  const { modelId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { logModelView, recordSession, getModel } = useFirestore();
  const { initThreeJS, loadModel, scene, renderer, cleanupScene } = useThree();
  
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showHandTracking, setShowHandTracking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [model, setModel] = useState(null);
  const [sessionStartTime] = useState(Date.now());
  const [isHTMLLesson, setIsHTMLLesson] = useState(false);
  const [htmlLessonPath, setHtmlLessonPath] = useState(null);

  // Check if this is an HTML lesson
  useEffect(() => {
    const checkLessonType = async () => {
      try {
        // Try to get model data first
        if (getModel && typeof getModel === 'function') {
          const modelData = await getModel(modelId);
          if (modelData && modelData.fileName) {
            // Check if it's an HTML file
            if (modelData.fileName.endsWith('.html') || modelData.fileType === 'html') {
              setIsHTMLLesson(true);
              setHtmlLessonPath(modelData.fileName);
              setModel(modelData);
              setIsLoading(false);
              return;
            }
          }
        }
        
        // Check for predefined HTML lessons
        const htmlLessons = {
          'solar-system-vr': 'lessons/solar_system_vr.html',
          'earth-3d': 'lessons/earth_3d.html',
          'gesture-demo': 'lessons/gesture_demo.html',
          'gesture-earth-demo': 'gesture-earth-demo' // gesture earth remains HTML-ish placeholder
        };
        
        if (htmlLessons[modelId]) {
          setIsHTMLLesson(true);
          
          // For Firebase Storage models, the HTML path will be set from Firebase Storage
          if (modelId === 'gesture-earth-demo') {
            // The HTML path will be set from Firebase Storage when the model is loaded
            setHtmlLessonPath(null); // Will be set when model data is loaded
          } else {
            setHtmlLessonPath(htmlLessons[modelId]);
          }
          
          setModel({
            name: modelId.charAt(0).toUpperCase() + modelId.slice(1).replace('-', ' ') + ' Lesson',
            fileType: 'html'
          });
          setIsLoading(false);
          return;
        }
        
        // If not HTML lesson, continue with normal 3D model loading
        setIsHTMLLesson(false);
      } catch (error) {
        console.error('Error checking lesson type:', error);
        setIsHTMLLesson(false);
      }
    };
    
    checkLessonType();
  }, [modelId, getModel]);
  const {
    videoRef,
    canvasRef: handCanvas,
    isInitialized: handTrackingActive,
    isLoading: handTrackingLoading,
    error: handTrackingError,
    gestures,
    initialize: initializeHandTracking,
    dispose: disposeHandTracking
  } = useHandTracking({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  // Initialize viewer - using useLayoutEffect for better timing with DOM
  useEffect(() => {
    let initializationTimeout;
    let retryTimeout;
    let retryCount = 0;
    const maxRetries = 10;
    
    // Check if this should be an HTML lesson first
    const htmlLessons = {
      'solar-system-vr': 'lessons/solar_system_vr.html',
      'earth-3d': 'lessons/earth_3d.html',
      'gesture-demo': 'lessons/gesture_demo.html',
      'gesture-earth-demo': 'gesture-earth-demo'
    };
    
    // Skip Three.js initialization for HTML lessons
    if (htmlLessons[modelId]) {
      console.log('Skipping Three.js initialization for HTML lesson:', modelId);
      return;
    }
    
    const initializeViewer = async () => {
      setIsLoading(true);
      
      try {
        // Check if required dependencies are available
        if (!canvasRef.current) {
          console.warn('Canvas ref not available, retrying...', retryCount + 1, '/', maxRetries);
          // Don't throw error immediately, let retry mechanism handle it
          return false;
        }
        
        // Validate Three.js context functions are available and are functions
        if (!initThreeJS || typeof initThreeJS !== 'function') {
          console.error('initThreeJS not available:', { initThreeJS, type: typeof initThreeJS });
          throw new Error('initThreeJS function not available from ThreeContext');
        }
        
        if (!loadModel || typeof loadModel !== 'function') {
          console.error('loadModel not available:', { loadModel, type: typeof loadModel });
          throw new Error('loadModel function not available from ThreeContext');
        }
        
        console.log('Initializing Three.js scene...');
        
        // Initialize Three.js scene with error handling
        try {
          const result = await initThreeJS(canvasRef.current);
          console.log('Three.js initialization result:', result);
        } catch (threeError) {
          console.error('Three.js initialization error:', threeError);
          throw new Error('Failed to initialize Three.js: ' + threeError.message);
        }
        
        // Wait for Three.js to be ready
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Load the specific model
        const modelData = { 
          name: modelId.charAt(0).toUpperCase() + modelId.slice(1) + ' Model',
          fileName: null // Will create demo model
        };
        
        console.log('Loading model...', modelData);
        
        try {
          const modelResult = await loadModel(modelData);
          console.log('Model loading result:', modelResult);
          setModel(modelData);
        } catch (modelError) {
          console.error('Model loading error:', modelError);
          throw new Error('Failed to load model: ' + modelError.message);
        }
        
        // Log model view (non-critical, simplified)
        if (user && logModelView && typeof logModelView === 'function') {
          try {
            console.log('Logging model view for user:', user.uid, 'model:', modelId);
            // Don't await this to prevent it from blocking the initialization
            logModelView(user.uid, modelId).catch(error => {
              console.warn('Failed to log model view:', error);
            });
          } catch (logError) {
            console.warn('Failed to log model view:', logError);
          }
        }
        
        toast.success('Model loaded! Click the hand icon to enable gesture control.');
        return true;
      } catch (error) {
        console.error('Error initializing viewer:', error);
        toast.error(`Failed to initialize viewer: ${error.message}`);
        return false;
      } finally {
        setIsLoading(false);
      }
    };

    const attemptInitialization = () => {
      if (initThreeJS && loadModel) {
        initializationTimeout = setTimeout(async () => {
          const success = await initializeViewer();
          
          if (!success && retryCount < maxRetries) {
            retryCount++;
            console.log('Retrying initialization...', retryCount, '/', maxRetries);
            retryTimeout = setTimeout(() => {
              attemptInitialization();
            }, 500); // Shorter retry delay
          } else if (!success) {
            console.error('Max retries reached, giving up initialization');
            setIsLoading(false);
            toast.error('Failed to initialize viewer after multiple attempts');
          }
        }, retryCount === 0 ? 500 : 200); // Longer initial delay, shorter retries
      } else {
        console.warn('ThreeContext not ready, available functions:', { 
          initThreeJS: typeof initThreeJS, 
          loadModel: typeof loadModel 
        });
        if (retryCount < maxRetries) {
          retryCount++;
          retryTimeout = setTimeout(() => {
            attemptInitialization();
          }, 1000);
        } else {
          console.error('ThreeContext still not ready after max retries');
          setIsLoading(false);
          toast.error('Failed to load Three.js context');
        }
      }
    };

    attemptInitialization();

    // Cleanup timeouts
    return () => {
      if (initializationTimeout) clearTimeout(initializationTimeout);
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [modelId, user, initThreeJS, loadModel, logModelView]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      try {
        if (disposeHandTracking && typeof disposeHandTracking === 'function') {
          disposeHandTracking();
        }
      } catch (error) {
        console.warn('Error disposing hand tracking:', error);
      }
      
      try {
        if (cleanupScene && typeof cleanupScene === 'function') {
          cleanupScene();
        }
      } catch (error) {
        console.warn('Error cleaning up scene:', error);
      }
      
      // Disable session recording for now to prevent errors
      // TODO: Re-enable once the data format issues are resolved
      console.log('ModelViewer cleanup completed');
    };
  }, [disposeHandTracking, cleanupScene]);

  // Handle gesture events for 3D model interaction
  useEffect(() => {
    if (gestures.length > 0) {
      const latestGesture = gestures[0];
      
      // Map gestures to 3D interactions based on model type
      switch (latestGesture.type) {
        case 'pinch':
          // Handle pinch gestures for rotation/selection
          console.log('Pinch gesture detected:', latestGesture.description);
          break;
        case 'zoom':
          // Handle zoom gestures
          console.log('Zoom gesture detected:', latestGesture.description);
          break;
        case 'swipe':
          // Handle swipe gestures for navigation
          console.log('Swipe gesture detected:', latestGesture.description);
          break;
        default:
          break;
      }
    }
  }, [gestures]);

  const handleBack = () => {
    navigate('/');
  };

  const toggleHandTracking = () => {
    setShowHandTracking(!showHandTracking);
    if (!showHandTracking && !handTrackingActive) {
      // Auto-initialize when showing for the first time
      try {
        // Check if MediaPipe is available
        if (typeof window.Hands === 'undefined' || typeof window.Camera === 'undefined') {
          toast.error('MediaPipe libraries not loaded. Please refresh the page.');
          return;
        }
        
        // Ensure initializeHandTracking is a function
        if (!initializeHandTracking || typeof initializeHandTracking !== 'function') {
          toast.error('Hand tracking initialization function not available.');
          return;
        }
        
        initializeHandTracking();
      } catch (error) {
        console.error('Error initializing hand tracking:', error);
        toast.error('Failed to initialize hand tracking: ' + error.message);
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getGestureInstructions = () => {
    const instructions = {
      'heart': [
        { gesture: '✋', action: 'Open hand to rotate model' },
        { gesture: '👍', action: 'Thumbs up to zoom in' },
        { gesture: '👎', action: 'Thumbs down to zoom out' },
        { gesture: '☝️', action: 'Point to highlight parts' }
      ],
      'solar-system': [
        { gesture: '✋', action: 'Open hand to orbit camera' },
        { gesture: '👍', action: 'Thumbs up for faster time' },
        { gesture: '👎', action: 'Thumbs down for slower time' },
        { gesture: '☝️', action: 'Point to select planets' }
      ]
    };
    
    return instructions[modelId] || instructions['heart'];
  };

  if (isLoading) {
    return (
      <ViewerContainer>
        <LoadingOverlay>
          Loading {modelId} model...
        </LoadingOverlay>
      </ViewerContainer>
    );
  }

  // Render HTML lesson viewer if it's an HTML-based lesson
  if (isHTMLLesson) {
    return (
      <ViewerContainer>
        <UIOverlay>
          <TopBar
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <BackButton onClick={handleBack}>
              <FaArrowLeft /> Back to Dashboard
            </BackButton>
            
            <ModelTitle>
              {model?.name || `${modelId.charAt(0).toUpperCase() + modelId.slice(1)} Lesson`}
            </ModelTitle>
          </TopBar>
        </UIOverlay>
        
        <HTMLLessonViewer 
          lessonPath={htmlLessonPath}
          title={model?.name || `${modelId.charAt(0).toUpperCase() + modelId.slice(1)} Lesson`}
        />
      </ViewerContainer>
    );
  }


  return (
    <ViewerContainer>
      <CanvasContainer>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </CanvasContainer>
      
      <HandTrackingPanel show={showHandTracking}>
        <PanelHeader>
          <PanelTitle>Hand Tracking Control</PanelTitle>
          <CloseButton onClick={() => setShowHandTracking(false)}>×</CloseButton>
        </PanelHeader>
        <HandTrackingVisualizer
          videoRef={videoRef}
          canvasRef={handCanvas}
          isInitialized={handTrackingActive}
          isLoading={handTrackingLoading}
          error={handTrackingError}
          gestures={gestures}
          onInitialize={initializeHandTracking}
          onDispose={disposeHandTracking}
        />
      </HandTrackingPanel>

      <UIOverlay>
        <TopBar
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BackButton onClick={handleBack}>
            <FaArrowLeft /> Back to Dashboard
          </BackButton>
          
          <ModelTitle>
            {model?.name || `${modelId.charAt(0).toUpperCase() + modelId.slice(1)} Model`}
          </ModelTitle>
        </TopBar>

        <ControlPanel
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ControlButton 
            onClick={toggleHandTracking}
            className={handTrackingActive ? 'active' : ''}
            title="Toggle hand tracking"
          >
            <FaHandPaper />
          </ControlButton>
          
          <ControlButton 
            onClick={toggleMute}
            title="Toggle sound"
          >
            {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
          </ControlButton>
          
          <ControlButton 
            onClick={toggleFullscreen}
            title="Toggle fullscreen"
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </ControlButton>
        </ControlPanel>

        <GestureStatus
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <StatusTitle>Hand Tracking Status</StatusTitle>
          <StatusText>
            Status: {handTrackingActive ? '🟢 Active' : '🔴 Inactive'}
          </StatusText>
          
          {gestures.length > 0 && (
            <GestureIndicator>
              Latest: {gestures[0].description}
            </GestureIndicator>
          )}
          
          {handTrackingError && (
            <StatusText style={{ color: '#ff6b6b', marginTop: '0.5rem' }}>
              Error: {handTrackingError}
            </StatusText>
          )}
        </GestureStatus>

        <Instructions
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <StatusTitle>Gestures</StatusTitle>
          {getGestureInstructions().map((instruction, index) => (
            <InstructionItem key={index}>
              <span>{instruction.gesture}</span>
              <span>{instruction.action}</span>
            </InstructionItem>
          ))}
        </Instructions>
      </UIOverlay>
    </ViewerContainer>
  );
};

export default ModelViewer;
