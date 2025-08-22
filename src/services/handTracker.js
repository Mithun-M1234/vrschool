// Minimal hand tracking service (pinch rotate, point_up zoom in, v_sign zoom out)
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
      // Check if MediaPipe libraries are available
      if (typeof window.Hands === 'undefined') {
        throw new Error('MediaPipe Hands library not loaded. Please include MediaPipe scripts in your HTML.');
      }
      
      if (typeof window.Camera === 'undefined') {
        throw new Error('MediaPipe Camera library not loaded. Please include MediaPipe scripts in your HTML.');
      }

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
          if (this.hands) {
            await this.hands.send({ image: videoElement });
          }
        },
        width: 640,
        height: 480
      });

      await this.camera.start();
      this.isInitialized = true;
      console.log('Hand tracking initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize hand tracking:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  onResults(results) {
    if (!this.canvasCtx || !this.canvasElement) {
      console.warn('Canvas context not available');
      return;
    }

    // Clear canvas
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    
  // (Optional) Drawing removed for performance in minimal mode
    
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
      
      this.detectCoreGestures(landmarks, handedness);
    });
  }
  detectCoreGestures(landmarks, handedness) {
    // Pinch detection (thumb tip & index tip proximity)
    const thumb = landmarks[4];
    const index = landmarks[8];
    const pinchDist = this.calculateDistance(thumb, index);
    const isPinching = pinchDist < 0.05;
    const pinchKey = `${handedness}_pinch_active`;
    const wasPinching = this.lastGestures[pinchKey] || false;
    if (isPinching && !wasPinching) this.emit('pinch_start', { handedness, landmarks });
    if (!isPinching && wasPinching) this.emit('pinch_end', { handedness, landmarks });
    this.lastGestures[pinchKey] = isPinching;

    // Pinch drag (while pinching, track index finger delta)
    if (isPinching) {
      const posKey = `${handedness}_pinch_pos`;
      const lastPos = this.lastGestures[posKey];
      if (lastPos) {
        const dx = index.x - lastPos.x;
        const dy = index.y - lastPos.y;
        const thresh = 0.003; // fine threshold for smooth rotation
        if (Math.abs(dx) > thresh || Math.abs(dy) > thresh) {
          this.emit('pinch_drag', { handedness, dx, dy, landmarks });
        }
      }
      this.lastGestures[posKey] = { x: index.x, y: index.y };
    }

    // Static point_up (index extended upward) & v_sign
    const wrist = landmarks[0];
    const dist = (a,b) => Math.hypot(a.x-b.x, a.y-b.y, (a.z||0)-(b.z||0));
    const indexExtended = dist(index, wrist) > dist(landmarks[6], wrist) * 1.2;
    const middleExtended = dist(landmarks[12], wrist) > dist(landmarks[10], wrist) * 1.2;
    const ringFolded = dist(landmarks[16], wrist) < dist(landmarks[14], wrist) * 1.1;
    const pinkyFolded = dist(landmarks[20], wrist) < dist(landmarks[18], wrist) * 1.1;
    const pointUp = indexExtended && !middleExtended && (index.y < wrist.y - 0.02);
    const vSign = indexExtended && middleExtended && ringFolded && pinkyFolded;
    this.emitState('point_up', handedness, pointUp, landmarks);
    this.emitState('v_sign', handedness, vSign, landmarks);
  }

  emitState(name, handedness, active, landmarks) {
    const key = `${handedness}_${name}`;
    const prev = this.lastGestures[key] || false;
    if (prev === active) return;
    this.lastGestures[key] = active;
    if (active) this.emit(name, { handedness, landmarks });
    else this.emit(name + '_end', { handedness, landmarks });
  }

  // emitStateGesture removed (advanced gestures not in minimal set)

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

  off(event, callback) {
    if (!this.eventListeners[event]) return;
    this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }

  // onUserUpdate removed (multi-user mode disabled in minimal build)

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
