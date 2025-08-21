import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useHandTracking } from '../hooks/useHandTracking';
import HandTrackingVisualizer from '../components/HandTrackingVisualizer';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
`;

const ContentArea = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 2rem;
`;

const Title = styled(motion.h1)`
  text-align: center;
  color: white;
  font-size: 2.5rem;
  margin-bottom: 1rem;
  font-weight: 700;
`;

const Subtitle = styled(motion.p)`
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.2rem;
  margin-bottom: 3rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const DemoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const DemoCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const CardTitle = styled.h3`
  color: white;
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
`;

const CardDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1.5rem;
  line-height: 1.6;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FeatureItem = styled.li`
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:before {
    content: '✨';
    font-size: 1.2rem;
  }
`;

const HandTrackingDemo = () => {
  const { user } = useAuth();
  
  const {
    videoRef,
    canvasRef,
    isInitialized,
    isLoading,
    error,
    gestures,
    initialize,
    dispose
  } = useHandTracking({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.5
  });

  return (
    <Container>
      <Header />
      <ContentArea>
        <Title
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          🤚 Hand Tracking Demo
        </Title>
        
        <Subtitle
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Test MediaPipe hand tracking integration before using with 3D models
        </Subtitle>

        <DemoGrid>
          <DemoCard
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <CardTitle>Hand Tracking Control</CardTitle>
            <CardDescription>
              Click "Start Hand Tracking" to begin capturing hand gestures. Make sure to allow camera access.
            </CardDescription>
            
            <HandTrackingVisualizer
              videoRef={videoRef}
              canvasRef={canvasRef}
              isInitialized={isInitialized}
              isLoading={isLoading}
              error={error}
              gestures={gestures}
              onInitialize={initialize}
              onDispose={dispose}
            />
          </DemoCard>

          <DemoCard
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <CardTitle>Supported Gestures</CardTitle>
            <CardDescription>
              The system can detect these hand gestures for 3D model interaction:
            </CardDescription>
            
            <FeatureList>
              <FeatureItem>Pinch gestures for object selection</FeatureItem>
              <FeatureItem>Two-hand zoom in/out</FeatureItem>
              <FeatureItem>Swipe left/right for rotation</FeatureItem>
              <FeatureItem>Swipe up/down for elevation</FeatureItem>
              <FeatureItem>Palm open/close for mode switching</FeatureItem>
              <FeatureItem>Peace sign for special actions</FeatureItem>
            </FeatureList>
          </DemoCard>
        </DemoGrid>

        {/* Instructions */}
        <DemoCard
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Follow these steps to test hand tracking:
          </CardDescription>
          
          <FeatureList>
            <FeatureItem>Click "Start Hand Tracking" and allow camera access</FeatureItem>
            <FeatureItem>Hold your hand(s) in front of the camera</FeatureItem>
            <FeatureItem>Try different gestures and watch the detection log</FeatureItem>
            <FeatureItem>Green dots show detected hand landmarks</FeatureItem>
            <FeatureItem>Gesture events appear in real-time on the right panel</FeatureItem>
          </FeatureList>
        </DemoCard>
      </ContentArea>
    </Container>
  );
};

export default HandTrackingDemo;
