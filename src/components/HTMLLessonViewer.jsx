import React, { useState, useEffect } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaExpand, FaCompress, FaExternalLinkAlt, FaSpinner } from 'react-icons/fa';

const ViewerContainer = styled.div`
  position: relative;
  width: 100%;
  height: ${props => props.fullscreen ? '100vh' : '600px'};
  background: #000;
  border-radius: ${props => props.fullscreen ? '0' : '15px'};
  overflow: hidden;
  ${props => props.fullscreen && `
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;
  `}
`;

const IFrame = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  background: #000;
`;

const Controls = styled(motion.div)`
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  z-index: 100;
`;

const ControlButton = styled.button`
  background: rgba(0, 0, 0, 0.8);
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
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(102, 126, 234, 0.8);
    transform: scale(1.1);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.2rem;
  gap: 1rem;
`;

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #ff4444;
  color: white;
  text-align: center;
  padding: 2rem;
`;

const HTMLLessonViewer = ({ lessonPath, title = "Interactive 3D Lesson" }) => {
  const [htmlUrl, setHtmlUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const loadLesson = async () => {
      if (!lessonPath) {
        setError('No lesson path provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Loading HTML lesson from:', lessonPath);
        
        // Get download URL from Firebase Storage
        const fileRef = ref(storage, lessonPath);
        const url = await getDownloadURL(fileRef);
        
        console.log('HTML lesson URL:', url);
        setHtmlUrl(url);
        setError(null);
      } catch (err) {
        console.error('Error loading HTML lesson:', err);
        setError('Failed to load lesson: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [lessonPath]);

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  const openInNewTab = () => {
    if (htmlUrl) {
      window.open(htmlUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <ViewerContainer fullscreen={fullscreen}>
        <LoadingContainer>
          <FaSpinner className="animate-spin" />
          Loading {title}...
        </LoadingContainer>
      </ViewerContainer>
    );
  }

  if (error) {
    return (
      <ViewerContainer fullscreen={fullscreen}>
        <ErrorContainer>
          <div>
            <h3>Failed to Load Lesson</h3>
            <p>{error}</p>
          </div>
        </ErrorContainer>
      </ViewerContainer>
    );
  }

  return (
    <ViewerContainer fullscreen={fullscreen}>
      <IFrame
        src={htmlUrl}
        title={title}
        allow="camera; microphone; accelerometer; gyroscope; xr-spatial-tracking"
        allowFullScreen
      />
      
      <Controls
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <ControlButton 
          onClick={openInNewTab}
          title="Open in new tab"
        >
          <FaExternalLinkAlt />
        </ControlButton>
        
        <ControlButton 
          onClick={toggleFullscreen}
          title="Toggle fullscreen"
        >
          {fullscreen ? <FaCompress /> : <FaExpand />}
        </ControlButton>
      </Controls>
    </ViewerContainer>
  );
};

export default HTMLLessonViewer;
