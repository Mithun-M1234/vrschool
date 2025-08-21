// Maps gestures to actions based on gestureConfig.json
class GestureMapper {
  constructor(gestureConfig) {
    this.config = gestureConfig;
    this.gestureMap = gestureConfig.gestureMap;
    this.animations = gestureConfig.animations || {};
    this.hotspots = gestureConfig.hotspots || [];
  }

  // Map detected gesture to action
  mapGesture(gesture) {
    return this.gestureMap[gesture] || null;
  }

  // Get all available gestures
  getAvailableGestures() {
    return Object.keys(this.gestureMap);
  }

  // Get animation config
  getAnimation(animationName) {
    return this.animations[animationName] || null;
  }

  // Get hotspot by name
  getHotspot(name) {
    return this.hotspots.find(hotspot => hotspot.name === name);
  }

  // Process gesture and return action details
  processGesture(gesture, confidence = 1.0) {
    const action = this.mapGesture(gesture);
    if (!action) return null;

    return {
      gesture,
      action,
      confidence,
      timestamp: Date.now(),
      config: this.getActionConfig(action)
    };
  }

  // Get configuration for specific action
  getActionConfig(action) {
    const configs = {
      zoomIn: { factor: 1.2, duration: 300 },
      zoomOut: { factor: 0.8, duration: 300 },
      rotateLeft: { angle: -15, axis: 'y', duration: 500 },
      rotateRight: { angle: 15, axis: 'y', duration: 500 },
      rotateUp: { angle: -15, axis: 'x', duration: 500 },
      rotateDown: { angle: 15, axis: 'x', duration: 500 },
      resetView: { duration: 1000, easing: 'easeInOut' },
      pauseAnimation: { toggle: true },
      highlightAorta: { hotspot: 'aorta', duration: 2000 },
      highlightVentricles: { hotspot: 'leftVentricle', duration: 2000 },
      speedUpTime: { multiplier: 2.0 },
      slowDownTime: { multiplier: 0.5 },
      focusEarth: { hotspot: 'earth', zoom: 2.0 },
      showOrbits: { toggle: true, opacity: 0.5 }
    };
    
    return configs[action] || {};
  }
}

// Gesture detection utilities
class GestureDetector {
  constructor() {
    this.lastGesture = null;
    this.gestureStartTime = 0;
    this.minGestureDuration = 300; // ms
    this.gestureThreshold = 0.7; // confidence threshold
  }

  // Analyze MediaPipe hand landmarks to detect gestures
  detectGesture(landmarks) {
    if (!landmarks || landmarks.length === 0) return null;

    const hand = landmarks[0]; // Use first detected hand
    
    // Basic gesture detection logic
    const gestures = {
      pinch: this.detectPinch(hand),
      pinchOut: this.detectPinchOut(hand),
      openPalm: this.detectOpenPalm(hand),
      fist: this.detectFist(hand),
      pointUp: this.detectPointUp(hand),
      pointDown: this.detectPointDown(hand),
      peace: this.detectPeace(hand),
      thumbsUp: this.detectThumbsUp(hand),
      swipeLeft: this.detectSwipe(hand, 'left'),
      swipeRight: this.detectSwipe(hand, 'right'),
      swipeUp: this.detectSwipe(hand, 'up'),
      swipeDown: this.detectSwipe(hand, 'down')
    };

    // Find gesture with highest confidence
    let bestGesture = null;
    let maxConfidence = 0;

    for (const [gesture, confidence] of Object.entries(gestures)) {
      if (confidence > maxConfidence && confidence > this.gestureThreshold) {
        maxConfidence = confidence;
        bestGesture = gesture;
      }
    }

    return bestGesture;
  }

  // Gesture detection methods (simplified - would need full implementation)
  detectPinch(hand) {
    // Calculate distance between thumb and index finger
    const thumb = hand.landmarks[4];
    const index = hand.landmarks[8];
    const distance = this.calculateDistance(thumb, index);
    return distance < 0.05 ? 0.9 : 0.0;
  }

  detectOpenPalm(hand) {
    // Check if all fingers are extended
    const fingerTips = [8, 12, 16, 20]; // Index, middle, ring, pinky
    const fingerBases = [6, 10, 14, 18];
    
    let extendedCount = 0;
    for (let i = 0; i < fingerTips.length; i++) {
      if (hand.landmarks[fingerTips[i]].y < hand.landmarks[fingerBases[i]].y) {
        extendedCount++;
      }
    }
    
    return extendedCount >= 3 ? 0.8 : 0.0;
  }

  detectFist(hand) {
    // Check if all fingers are closed
    const fingerTips = [8, 12, 16, 20];
    const palm = hand.landmarks[0];
    
    let closedCount = 0;
    for (const tip of fingerTips) {
      if (hand.landmarks[tip].y > palm.y) {
        closedCount++;
      }
    }
    
    return closedCount >= 3 ? 0.8 : 0.0;
  }

  detectPointUp(hand) {
    // Index finger up, others down
    const indexTip = hand.landmarks[8];
    const indexBase = hand.landmarks[6];
    return indexTip.y < indexBase.y ? 0.7 : 0.0;
  }

  detectPointDown(hand) {
    // Index finger down
    const indexTip = hand.landmarks[8];
    const indexBase = hand.landmarks[6];
    return indexTip.y > indexBase.y ? 0.7 : 0.0;
  }

  detectPeace(hand) {
    // Index and middle finger up
    const indexUp = hand.landmarks[8].y < hand.landmarks[6].y;
    const middleUp = hand.landmarks[12].y < hand.landmarks[10].y;
    return (indexUp && middleUp) ? 0.8 : 0.0;
  }

  detectThumbsUp(hand) {
    // Thumb up, others closed
    const thumbTip = hand.landmarks[4];
    const thumbBase = hand.landmarks[2];
    return thumbTip.y < thumbBase.y ? 0.7 : 0.0;
  }

  detectPinchOut(hand) {
    // Similar to pinch but with larger distance
    const thumb = hand.landmarks[4];
    const index = hand.landmarks[8];
    const distance = this.calculateDistance(thumb, index);
    return (distance > 0.1 && distance < 0.2) ? 0.8 : 0.0;
  }

  detectSwipe(hand, direction) {
    // Would need to track hand movement over time
    // This is a simplified version
    return 0.0; // Placeholder
  }

  calculateDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = (point1.z || 0) - (point2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}

export { GestureMapper, GestureDetector };
