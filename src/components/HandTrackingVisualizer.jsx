import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const CameraContainer = styled.div`
  position: relative;
  width: 320px;
  height: 240px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  background: #1a1a1a;
`;

const VideoElement = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: ${props => props.show ? 'block' : 'none'};
`;

const Canvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

const StatusOverlay = styled.div`
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  background: ${props => {
    if (props.error) return 'rgba(220, 53, 69, 0.9)';
    if (props.loading) return 'rgba(255, 193, 7, 0.9)';
    if (props.active) return 'rgba(40, 167, 69, 0.9)';
    return 'rgba(108, 117, 125, 0.9)';
  }};
`;

const GestureList = styled.div`
  margin-top: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
`;

const GestureItem = styled(motion.div)`
  padding: 8px 12px;
  margin: 4px 0;
  background: white;
  border-radius: 6px;
  border-left: 3px solid ${props => {
    switch (props.type) {
      case 'pinch': return '#007bff';
      case 'zoom': return '#28a745';
      case 'swipe': return '#ffc107';
      default: return '#6c757d';
    }
  }};
  font-size: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const GestureTime = styled.span`
  float: right;
  color: #6c757d;
  font-size: 12px;
`;

const ErrorMessage = styled.div`
  padding: 12px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  color: #721c24;
  margin-top: 12px;
  font-size: 14px;
`;

const ControlsContainer = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  ${props => props.primary ? `
    background: #007bff;
    color: white;
    &:hover:not(:disabled) {
      background: #0056b3;
    }
  ` : `
    background: #6c757d;
    color: white;
    &:hover:not(:disabled) {
      background: #545b62;
    }
  `}
`;

const HandTrackingVisualizer = ({ 
  videoRef, 
  canvasRef, 
  isInitialized, 
  isLoading, 
  error, 
  gestures = [],
  onInitialize,
  onDispose 
}) => {
  const getStatusText = () => {
    if (error) return 'Error';
    if (isLoading) return 'Loading...';
    if (isInitialized) return 'Active';
    return 'Inactive';
  };

  return (
    <div>
      <CameraContainer>
        <VideoElement 
          ref={videoRef}
          show={isInitialized}
          autoPlay
          muted
          playsInline
        />
        <Canvas ref={canvasRef} />
        <StatusOverlay 
          error={error}
          loading={isLoading}
          active={isInitialized}
        >
          {getStatusText()}
        </StatusOverlay>
      </CameraContainer>

      <ControlsContainer>
        <Button 
          primary
          onClick={onInitialize}
          disabled={isLoading || isInitialized}
        >
          {isLoading ? 'Initializing...' : 'Start Hand Tracking'}
        </Button>
        <Button 
          onClick={onDispose}
          disabled={!isInitialized}
        >
          Stop
        </Button>
      </ControlsContainer>

      {error && (
        <ErrorMessage>
          <strong>Error:</strong> {error}
        </ErrorMessage>
      )}

      {gestures.length > 0 && (
        <GestureList>
          <h4 style={{ margin: '0 0 12px 0', color: '#495057' }}>
            Recent Gestures ({gestures.length})
          </h4>
          <AnimatePresence>
            {gestures.map((gesture) => (
              <GestureItem
                key={gesture.id}
                type={gesture.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {gesture.description}
                <GestureTime>{gesture.timestamp}</GestureTime>
              </GestureItem>
            ))}
          </AnimatePresence>
        </GestureList>
      )}
    </div>
  );
};

export default HandTrackingVisualizer;
