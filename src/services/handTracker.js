// Hand tracking service using MediaPipe
class HandTracker {
  constructor(options = {}) {
    this.options = {
      maxNumHands: options.maxNumHands || 2,
      minDetectionConfidence: options.minDetectionConfidence || 0.7,
      minTrackingConfidence: options.minTrackingConfidence || 0.7,
      enableMultiUserMode: options.enableMultiUserMode || false,
      ...options
    };
    
    this.hands = null;
    this.camera = null;
    this.videoElement = null;
    this.canvasElement = null;
    this.canvasCtx = null;
    this.eventListeners = {};
    this.lastGestures = {};
    this.isInitialized = false;
  }

  async initialize(videoElement, canvasElement) {
    try {
      this.videoElement = videoElement;
      this.canvasElement = canvasElement;
      this.canvasCtx = canvasElement.getContext('2d');

      // Initialize MediaPipe Hands
      this.hands = new window.Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      this.hands.setOptions({
        maxNumHands: this.options.maxNumHands,
        modelComplexity: 1,
        minDetectionConfidence: this.options.minDetectionConfidence,
        minTrackingConfidence: this.options.minTrackingConfidence
      });

      this.hands.onResults(this.onResults.bind(this));

      // Initialize camera
      this.camera = new window.Camera(videoElement, {
        onFrame: async () => {
          await this.hands.send({ image: videoElement });
        },
        width: 640,
        height: 480
      });

      await this.camera.start();
      this.isInitialized = true;
      console.log('Hand tracking initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize hand tracking:', error);
      throw error;
    }
  }

  onResults(results) {
    // Clear canvas
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    
    // Draw hand landmarks
    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        window.drawConnectors(this.canvasCtx, landmarks, window.HAND_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 2
        });
        window.drawLandmarks(this.canvasCtx, landmarks, {
          color: '#FF0000',
          lineWidth: 1
        });
      }
    }
    
    this.canvasCtx.restore();

    // Process gestures
    this.processGestures(results);
  }

  processGestures(results) {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      return;
    }

    results.multiHandLandmarks.forEach((landmarks, index) => {
      const handedness = results.multiHandedness[index].label;
      
      // Detect pinch gesture
      const pinchDistance = this.calculateDistance(
        landmarks[4], // Thumb tip
        landmarks[8]  // Index finger tip
      );
      
      const isPinching = pinchDistance < 0.05;
      const wasLastPinching = this.lastGestures[`${handedness}_pinch`] || false;
      
      if (isPinching && !wasLastPinching) {
        this.emit('pinch_start', { handedness, landmarks });
      } else if (!isPinching && wasLastPinching) {
        this.emit('pinch_end', { handedness, landmarks });
      }
      
      this.lastGestures[`${handedness}_pinch`] = isPinching;

      // Detect swipe gestures
      this.detectSwipeGestures(landmarks, handedness);
      
      // Detect zoom gestures (two-finger pinch)
      if (isPinching) {
        this.detectZoomGestures(landmarks, handedness);
      }
    });
  }

  detectSwipeGestures(landmarks, handedness) {
    const indexTip = landmarks[8];
    const lastPosition = this.lastGestures[`${handedness}_position`];
    
    if (lastPosition) {
      const deltaX = indexTip.x - lastPosition.x;
      const deltaY = indexTip.y - lastPosition.y;
      const threshold = 0.05;
      
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          this.emit('swipe_right', { handedness, delta: deltaX, landmarks });
        } else {
          this.emit('swipe_left', { handedness, delta: Math.abs(deltaX), landmarks });
        }
      }
      
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          this.emit('swipe_down', { handedness, delta: deltaY, landmarks });
        } else {
          this.emit('swipe_up', { handedness, delta: Math.abs(deltaY), landmarks });
        }
      }
    }
    
    this.lastGestures[`${handedness}_position`] = { x: indexTip.x, y: indexTip.y };
  }

  detectZoomGestures(landmarks, handedness) {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const currentDistance = this.calculateDistance(thumbTip, indexTip);
    const lastDistance = this.lastGestures[`${handedness}_pinch_distance`];
    
    if (lastDistance) {
      const delta = currentDistance - lastDistance;
      if (Math.abs(delta) > 0.01) {
        this.emit('pinch_zoom', { handedness, delta, currentDistance, landmarks });
      }
    }
    
    this.lastGestures[`${handedness}_pinch_distance`] = currentDistance;
  }

  calculateDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }

  onUserUpdate(callback) {
    this.userUpdateCallback = callback;
  }

  dispose() {
    if (this.camera) {
      this.camera.stop();
    }
    if (this.hands) {
      this.hands.close();
    }
    this.isInitialized = false;
  }
}

// Export for use in React components
export default HandTracker;
