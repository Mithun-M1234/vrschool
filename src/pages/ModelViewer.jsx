import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useThree } from '../contexts/ThreeContext';
import { useAuth } from '../contexts/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { useHandTracking } from '../hooks/useHandTracking';
import HandTrackingVisualizer from '../components/HandTrackingVisualizer';
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
  const { logModelView, recordSession } = useFirestore();
  const { initializeScene, loadModel, cleanupScene } = useThree();
  
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showHandTracking, setShowHandTracking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [model, setModel] = useState(null);
  const [sessionStartTime] = useState(Date.now());

  // Hand tracking hook
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

  useEffect(() => {
    const initializeViewer = async () => {
      setIsLoading(true);
      
      try {
        // Initialize Three.js scene
        const scene = await initializeScene(canvasRef.current);
        
        // Load the specific model
        const modelData = await loadModel(modelId);
        setModel(modelData);
        
        // Log model view
        if (user) {
          await logModelView(user.uid, modelId);
        }
        
        toast.success('Model loaded! Click the hand icon to enable gesture control.');
      } catch (error) {
        console.error('Error initializing viewer:', error);
        toast.error('Failed to load model. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeViewer();

    // Cleanup on unmount
    return () => {
      disposeHandTracking();
      cleanupScene();
      
      // Record session data
      if (user && modelId) {
        const sessionDuration = Date.now() - sessionStartTime;
        recordSession(user.uid, {
          modelId,
          duration: sessionDuration,
          timestamp: new Date(),
          completed: true
        });
      }
    };
  }, [modelId, user]);

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
      initializeHandTracking();
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
