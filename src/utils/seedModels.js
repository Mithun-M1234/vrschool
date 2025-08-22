import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { storage, db } from '../services/firebase';

export async function seedGestureModel() {
  try {
    console.log('Starting gesture model seeding...');
    
    // Check if model already exists
    const q = query(collection(db, 'models'), where('id', '==', 'gesture-earth-demo'));
    const existingDocs = await getDocs(q);
    
    if (!existingDocs.empty) {
      console.log('Gesture model already exists, skipping seed');
      return existingDocs.docs[0].id;
    }

    const modelId = 'gesture-earth-demo';
    
    // Create the HTML content for the gesture demo (based on og/3d project)
    const gestureHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gesture-Controlled Earth | VR School</title>
    <script type="importmap">
    {
        "imports": {
            "three": "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js"
        }
    }
    </script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
            font-family: 'Arial', sans-serif;
            overflow: hidden;
            color: white;
        }
        #container {
            width: 100vw;
            height: 100vh;
            position: relative;
        }
        #canvas-container {
            width: 100%;
            height: 100%;
        }
        .ui-overlay {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(0, 20, 40, 0.9);
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(100, 200, 255, 0.3);
            max-width: 350px;
            z-index: 100;
            backdrop-filter: blur(10px);
        }
        .ui-overlay h3 {
            margin: 0 0 15px 0;
            color: #64C8FF;
            font-size: 18px;
            text-align: center;
            text-shadow: 0 0 10px rgba(100, 200, 255, 0.5);
        }
        .gesture-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .gesture-item {
            display: flex;
            align-items: center;
            margin: 10px 0;
            padding: 8px;
            background: rgba(100, 200, 255, 0.1);
            border-radius: 8px;
            border-left: 3px solid #64C8FF;
        }
        .gesture-emoji {
            font-size: 24px;
            margin-right: 12px;
        }
        .gesture-text {
            font-size: 14px;
            line-height: 1.4;
        }
        .status-bar {
            position: absolute;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: rgba(0, 20, 40, 0.9);
            padding: 15px;
            border-radius: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(100, 200, 255, 0.3);
        }
        .status-item {
            text-align: center;
            flex: 1;
        }
        .status-label {
            font-size: 12px;
            color: #64C8FF;
            margin-bottom: 5px;
        }
        .status-value {
            font-size: 16px;
            font-weight: bold;
        }
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            z-index: 200;
        }
        .spinner {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(100, 200, 255, 0.3);
            border-top: 3px solid #64C8FF;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div id="container">
        <div id="loading" class="loading">
            <div class="spinner"></div>
            <div>Loading Gesture-Controlled Earth...</div>
        </div>
        
        <div class="ui-overlay">
            <h3>🌍 Gesture Controls</h3>
            <ul class="gesture-list">
                <li class="gesture-item">
                    <span class="gesture-emoji">✋</span>
                    <span class="gesture-text">Open palm - Reset view</span>
                </li>
                <li class="gesture-item">
                    <span class="gesture-emoji">👆</span>
                    <span class="gesture-text">Point up - Zoom in</span>
                </li>
                <li class="gesture-item">
                    <span class="gesture-emoji">👇</span>
                    <span class="gesture-text">Point down - Zoom out</span>
                </li>
                <li class="gesture-item">
                    <span class="gesture-emoji">👈</span>
                    <span class="gesture-text">Point left - Rotate left</span>
                </li>
                <li class="gesture-item">
                    <span class="gesture-emoji">👉</span>
                    <span class="gesture-text">Point right - Rotate right</span>
                </li>
                <li class="gesture-item">
                    <span class="gesture-emoji">🤏</span>
                    <span class="gesture-text">Pinch - Toggle auto-rotate</span>
                </li>
                <li class="gesture-item">
                    <span class="gesture-emoji">✊</span>
                    <span class="gesture-text">Fist - Shake Earth</span>
                </li>
                <li class="gesture-item">
                    <span class="gesture-emoji">✌️</span>
                    <span class="gesture-text">Peace - Random view</span>
                </li>
            </ul>
        </div>

        <div id="canvas-container"></div>
        
        <div class="status-bar">
            <div class="status-item">
                <div class="status-label">Camera</div>
                <div class="status-value" id="camera-status">Initializing...</div>
            </div>
            <div class="status-item">
                <div class="status-label">Gesture</div>
                <div class="status-value" id="gesture-status">None</div>
            </div>
            <div class="status-item">
                <div class="status-label">Rotation</div>
                <div class="status-value" id="rotation-status">0°</div>
            </div>
        </div>
    </div>

    <script type="module">
        import * as THREE from 'three';
        
        // Enhanced Gesture Recognition based on og/3d project structure
        class GestureRecognition {
            constructor() {
                this.hands = null;
                this.videoElement = null;
                this.camera = null;
                this.callbacks = {};
                this.isInitialized = false;
                this.gestureHistory = [];
                this.gestureThreshold = 5;
            }

            async initialize() {
                if (this.isInitialized) return;

                try {
                    // Setup video element
                    this.videoElement = document.createElement('video');
                    this.videoElement.style.display = 'none';
                    document.body.appendChild(this.videoElement);

                    // Get camera stream
                    const stream = await navigator.mediaDevices.getUserMedia({ 
                        video: { width: 640, height: 480 } 
                    });
                    this.videoElement.srcObject = stream;
                    await this.videoElement.play();

                    // Initialize MediaPipe Hands
                    this.hands = new Hands({
                        locateFile: (file) => \`https://cdn.jsdelivr.net/npm/@mediapipe/hands/\${file}\`
                    });

                    this.hands.setOptions({
                        maxNumHands: 2,
                        modelComplexity: 1,
                        minDetectionConfidence: 0.7,
                        minTrackingConfidence: 0.5
                    });

                    this.hands.onResults(this.onResults.bind(this));

                    // Setup camera
                    this.camera = new Camera(this.videoElement, {
                        onFrame: async () => {
                            await this.hands.send({ image: this.videoElement });
                        },
                        width: 640,
                        height: 480
                    });

                    this.camera.start();
                    this.isInitialized = true;
                    this.triggerCallback('initialized', true);

                } catch (error) {
                    console.error('Gesture recognition initialization failed:', error);
                    this.triggerCallback('error', error);
                }
            }

            onResults(results) {
                if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                    const landmarks = results.multiHandLandmarks[0];
                    const gesture = this.detectGesture(landmarks);
                    
                    this.gestureHistory.push(gesture);
                    if (this.gestureHistory.length > this.gestureThreshold) {
                        this.gestureHistory.shift();
                    }

                    const consistentGesture = this.getConsistentGesture();
                    if (consistentGesture) {
                        this.triggerCallback('gesture', {
                            gesture: consistentGesture,
                            landmarks: landmarks,
                            confidence: this.calculateConfidence(consistentGesture)
                        });
                    }
                } else {
                    this.triggerCallback('gesture', { gesture: 'none', landmarks: null });
                }
            }

            detectGesture(landmarks) {
                const fingerPositions = this.getFingerPositions(landmarks);
                
                // Open palm detection
                if (fingerPositions.allExtended) {
                    return 'open_palm';
                }
                
                // Pointing gestures
                if (fingerPositions.indexExtended && !fingerPositions.middleExtended) {
                    const indexTip = landmarks[8];
                    if (indexTip.y < 0.3) return 'point_up';
                    if (indexTip.y > 0.7) return 'point_down';
                    if (indexTip.x < 0.3) return 'point_left';
                    if (indexTip.x > 0.7) return 'point_right';
                    return 'point';
                }
                
                // Pinch detection
                const thumbTip = landmarks[4];
                const indexTip = landmarks[8];
                const distance = this.calculateDistance(thumbTip, indexTip);
                
                if (distance < 0.05) {
                    return 'pinch';
                }
                
                // Peace sign
                if (fingerPositions.indexExtended && fingerPositions.middleExtended && 
                    !fingerPositions.ringExtended && !fingerPositions.pinkyExtended) {
                    return 'peace';
                }
                
                // Fist
                if (!fingerPositions.indexExtended && !fingerPositions.middleExtended && 
                    !fingerPositions.ringExtended && !fingerPositions.pinkyExtended) {
                    return 'fist';
                }
                
                return 'unknown';
            }

            getFingerPositions(landmarks) {
                return {
                    thumbExtended: landmarks[4].y < landmarks[3].y,
                    indexExtended: landmarks[8].y < landmarks[6].y,
                    middleExtended: landmarks[12].y < landmarks[10].y,
                    ringExtended: landmarks[16].y < landmarks[14].y,
                    pinkyExtended: landmarks[20].y < landmarks[18].y,
                    get allExtended() {
                        return this.thumbExtended && this.indexExtended && 
                               this.middleExtended && this.ringExtended && this.pinkyExtended;
                    }
                };
            }

            calculateDistance(point1, point2) {
                return Math.sqrt(
                    Math.pow(point1.x - point2.x, 2) + 
                    Math.pow(point1.y - point2.y, 2) + 
                    Math.pow(point1.z - point2.z, 2)
                );
            }

            getConsistentGesture() {
                if (this.gestureHistory.length < this.gestureThreshold) return null;
                
                const lastGestures = this.gestureHistory.slice(-3);
                const consistentGesture = lastGestures[0];
                
                if (lastGestures.every(g => g === consistentGesture)) {
                    return consistentGesture;
                }
                
                return null;
            }

            calculateConfidence(gesture) {
                const matches = this.gestureHistory.filter(g => g === gesture).length;
                return matches / this.gestureHistory.length;
            }

            on(event, callback) {
                if (!this.callbacks[event]) {
                    this.callbacks[event] = [];
                }
                this.callbacks[event].push(callback);
            }

            triggerCallback(event, data) {
                if (this.callbacks[event]) {
                    this.callbacks[event].forEach(callback => callback(data));
                }
            }

            destroy() {
                if (this.camera) {
                    this.camera.stop();
                }
                if (this.videoElement && this.videoElement.srcObject) {
                    this.videoElement.srcObject.getTracks().forEach(track => track.stop());
                }
                if (this.videoElement) {
                    document.body.removeChild(this.videoElement);
                }
                this.isInitialized = false;
            }
        }

        class EarthController {
            constructor(earth, camera) {
                this.earth = earth;
                this.camera = camera;
                this.rotationSpeed = 0.01;
                this.zoomSpeed = 0.1;
                this.autoRotateSpeed = 0.005;
                this.isAutoRotating = true;
                
                // Animation properties
                this.targetRotation = { x: 0, y: 0 };
                this.targetZoom = 5;
                this.currentRotation = { x: 0, y: 0 };
                this.currentZoom = 5;
                
                this.setupAnimationLoop();
            }

            handleGesture(gestureData) {
                const { gesture, confidence } = gestureData;
                
                if (confidence < 0.6) return; // Ignore low confidence gestures
                
                switch (gesture) {
                    case 'open_palm':
                        this.resetView();
                        break;
                    case 'point_up':
                        this.zoomIn();
                        break;
                    case 'point_down':
                        this.zoomOut();
                        break;
                    case 'point_left':
                        this.rotateLeft();
                        break;
                    case 'point_right':
                        this.rotateRight();
                        break;
                    case 'pinch':
                        this.toggleAutoRotate();
                        break;
                    case 'fist':
                        this.shake();
                        break;
                    case 'peace':
                        this.randomView();
                        break;
                }
            }

            resetView() {
                this.targetRotation = { x: 0, y: 0 };
                this.targetZoom = 5;
                this.isAutoRotating = true;
            }

            zoomIn() {
                this.targetZoom = Math.max(this.targetZoom - this.zoomSpeed, 2);
            }

            zoomOut() {
                this.targetZoom = Math.min(this.targetZoom + this.zoomSpeed, 10);
            }

            rotateLeft() {
                this.targetRotation.y -= this.rotationSpeed * 3;
                this.isAutoRotating = false;
            }

            rotateRight() {
                this.targetRotation.y += this.rotationSpeed * 3;
                this.isAutoRotating = false;
            }

            toggleAutoRotate() {
                this.isAutoRotating = !this.isAutoRotating;
            }

            shake() {
                // Create a shaking effect
                for (let i = 0; i < 10; i++) {
                    setTimeout(() => {
                        this.earth.position.x = (Math.random() - 0.5) * 0.1;
                        this.earth.position.y = (Math.random() - 0.5) * 0.1;
                        if (i === 9) {
                            this.earth.position.set(0, 0, 0);
                        }
                    }, i * 50);
                }
            }

            randomView() {
                this.targetRotation.x = (Math.random() - 0.5) * Math.PI;
                this.targetRotation.y = (Math.random() - 0.5) * Math.PI * 2;
                this.targetZoom = 3 + Math.random() * 4;
            }

            setupAnimationLoop() {
                const animate = () => {
                    // Smooth interpolation
                    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.1;
                    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.1;
                    this.currentZoom += (this.targetZoom - this.currentZoom) * 0.1;

                    // Apply rotations
                    this.earth.rotation.x = this.currentRotation.x;
                    this.earth.rotation.y = this.currentRotation.y;

                    // Auto-rotate if enabled
                    if (this.isAutoRotating) {
                        this.earth.rotation.y += this.autoRotateSpeed;
                        this.targetRotation.y += this.autoRotateSpeed;
                    }

                    // Apply zoom
                    this.camera.position.z = this.currentZoom;

                    requestAnimationFrame(animate);
                };
                animate();
            }
        }

        class UIManager {
            constructor() {
                this.gestureDisplay = document.getElementById('gesture-status');
                this.cameraDisplay = document.getElementById('camera-status');
                this.rotationDisplay = document.getElementById('rotation-status');
                this.confidenceDisplay = this.createConfidenceDisplay();
            }

            createConfidenceDisplay() {
                const display = document.createElement('div');
                display.style.position = 'absolute';
                display.style.top = '20px';
                display.style.right = '20px';
                display.style.background = 'rgba(0, 20, 40, 0.9)';
                display.style.padding = '10px';
                display.style.borderRadius = '10px';
                display.style.color = 'white';
                display.style.fontFamily = 'Arial, sans-serif';
                display.innerHTML = '<div>Confidence: <span id="confidence-value">0%</span></div>';
                document.body.appendChild(display);
                return display.querySelector('#confidence-value');
            }

            updateGestureStatus(gestureData) {
                if (this.gestureDisplay) {
                    const { gesture, confidence } = gestureData;
                    this.gestureDisplay.textContent = this.formatGestureName(gesture);
                    
                    if (this.confidenceDisplay && confidence !== undefined) {
                        this.confidenceDisplay.textContent = Math.round(confidence * 100) + '%';
                    }
                }
            }

            updateCameraStatus(status) {
                if (this.cameraDisplay) {
                    this.cameraDisplay.textContent = status;
                }
            }

            updateRotationStatus(rotation) {
                if (this.rotationDisplay) {
                    this.rotationDisplay.textContent = Math.round(rotation * 180 / Math.PI) + '°';
                }
            }

            formatGestureName(gesture) {
                const gestureNames = {
                    'open_palm': 'Open Palm',
                    'point_up': 'Point Up',
                    'point_down': 'Point Down',
                    'point_left': 'Point Left',
                    'point_right': 'Point Right',
                    'pinch': 'Pinch',
                    'fist': 'Fist',
                    'peace': 'Peace',
                    'none': 'None',
                    'unknown': 'Unknown'
                };
                return gestureNames[gesture] || gesture;
            }

            showInstructions() {
                const instructions = document.querySelector('.ui-overlay');
                if (instructions) {
                    instructions.style.opacity = '1';
                    setTimeout(() => {
                        instructions.style.opacity = '0.7';
                    }, 5000);
                }
            }
        }

        class EarthApp {
            constructor() {
                this.scene = null;
                this.camera = null;
                this.renderer = null;
                this.earth = null;
                this.gestureRecognition = null;
                this.earthController = null;
                this.uiManager = null;
                
                this.init();
            }

            async init() {
                try {
                    this.setupThreeJS();
                    this.uiManager = new UIManager();
                    
                    await this.loadEarthModel();
                    this.setupLighting();
                    this.createStarField();
                    
                    this.earthController = new EarthController(this.earth, this.camera);
                    
                    await this.initializeGestureRecognition();
                    
                    this.startRenderLoop();
                    this.uiManager.showInstructions();
                    
                    document.getElementById('loading').style.display = 'none';
                } catch (error) {
                    console.error('Initialization error:', error);
                    document.getElementById('loading').innerHTML = 
                        '<div>Error loading application: ' + error.message + '</div>';
                }
            }

            setupThreeJS() {
                const container = document.getElementById('canvas-container');
                
                this.scene = new THREE.Scene();
                this.scene.background = new THREE.Color(0x000011);

                this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                this.camera.position.z = 5;

                this.renderer = new THREE.WebGLRenderer({ antialias: true });
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                container.appendChild(this.renderer.domElement);
            }

            async loadEarthModel() {
                // Create Earth geometry and materials
                const geometry = new THREE.SphereGeometry(1, 64, 64);
                
                // Enhanced Earth material with textures
                const material = new THREE.MeshPhongMaterial({
                    color: 0x4a90e2,
                    shininess: 100,
                    transparent: true,
                    opacity: 0.9
                });

                this.earth = new THREE.Mesh(geometry, material);
                this.earth.castShadow = true;
                this.earth.receiveShadow = true;
                this.scene.add(this.earth);

                // Add atmosphere effect
                this.createAtmosphere();
            }

            createAtmosphere() {
                const atmosphereGeometry = new THREE.SphereGeometry(1.05, 64, 64);
                const atmosphereMaterial = new THREE.MeshPhongMaterial({
                    color: 0x87CEEB,
                    transparent: true,
                    opacity: 0.3,
                    side: THREE.BackSide
                });
                const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
                this.scene.add(atmosphere);
            }

            setupLighting() {
                const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
                this.scene.add(ambientLight);

                const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
                directionalLight.position.set(5, 3, 5);
                directionalLight.castShadow = true;
                directionalLight.shadow.mapSize.width = 2048;
                directionalLight.shadow.mapSize.height = 2048;
                this.scene.add(directionalLight);

                const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
                pointLight.position.set(-5, -3, -5);
                this.scene.add(pointLight);
            }

            createStarField() {
                const starsGeometry = new THREE.BufferGeometry();
                const starsMaterial = new THREE.PointsMaterial({ 
                    color: 0xffffff, 
                    size: 1,
                    transparent: true,
                    opacity: 0.8
                });

                const starsVertices = [];
                for (let i = 0; i < 2000; i++) {
                    const x = (Math.random() - 0.5) * 400;
                    const y = (Math.random() - 0.5) * 400;
                    const z = (Math.random() - 0.5) * 400;
                    starsVertices.push(x, y, z);
                }

                starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
                const stars = new THREE.Points(starsGeometry, starsMaterial);
                this.scene.add(stars);
            }

            async initializeGestureRecognition() {
                this.gestureRecognition = new GestureRecognition();
                
                this.gestureRecognition.on('initialized', (success) => {
                    this.uiManager.updateCameraStatus(success ? 'Active' : 'Failed');
                });

                this.gestureRecognition.on('gesture', (gestureData) => {
                    this.uiManager.updateGestureStatus(gestureData);
                    this.earthController.handleGesture(gestureData);
                });

                this.gestureRecognition.on('error', (error) => {
                    console.error('Gesture recognition error:', error);
                    this.uiManager.updateCameraStatus('Error');
                });

                await this.gestureRecognition.initialize();
            }

            startRenderLoop() {
                const animate = () => {
                    requestAnimationFrame(animate);
                    
                    if (this.earth) {
                        this.uiManager.updateRotationStatus(this.earth.rotation.y);
                    }
                    
                    this.renderer.render(this.scene, this.camera);
                };
                animate();
            }
        }

        // Initialize the application
        window.addEventListener('load', () => {
            new EarthApp();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.earthApp && window.earthApp.camera && window.earthApp.renderer) {
                window.earthApp.camera.aspect = window.innerWidth / window.innerHeight;
                window.earthApp.camera.updateProjectionMatrix();
                window.earthApp.renderer.setSize(window.innerWidth, window.innerHeight);
            }
        });
    </script>
</body>
</html>`;

    // Create config data (enhanced based on og/3d project)
    const configData = {
      name: 'Gesture-Controlled Earth Visualization',
      description: 'Interactive 3D Earth model with advanced gesture recognition controls',
      version: '2.0',
      author: 'VR School Platform',
      gestures: [
        {
          name: 'Open Palm',
          description: 'Reset view to default position',
          action: 'reset_view',
          confidence_threshold: 0.7
        },
        {
          name: 'Point Up',
          description: 'Zoom in on the Earth',
          action: 'zoom_in',
          confidence_threshold: 0.6
        },
        {
          name: 'Point Down',
          description: 'Zoom out from the Earth',
          action: 'zoom_out',
          confidence_threshold: 0.6
        },
        {
          name: 'Point Left',
          description: 'Rotate Earth to the left',
          action: 'rotate_left',
          confidence_threshold: 0.6
        },
        {
          name: 'Point Right',
          description: 'Rotate Earth to the right',
          action: 'rotate_right',
          confidence_threshold: 0.6
        },
        {
          name: 'Pinch',
          description: 'Toggle automatic rotation',
          action: 'toggle_auto_rotate',
          confidence_threshold: 0.7
        },
        {
          name: 'Fist',
          description: 'Create earthquake shake effect',
          action: 'shake',
          confidence_threshold: 0.8
        },
        {
          name: 'Peace',
          description: 'Jump to random viewing angle',
          action: 'random_view',
          confidence_threshold: 0.7
        }
      ],
      controls: {
        camera: true,
        gestures: true,
        autoRotate: true,
        smoothAnimation: true,
        confidenceDisplay: true
      },
      features: {
        atmosphere: true,
        starField: true,
        dynamicLighting: true,
        shadowMapping: true,
        gestureHistory: true,
        uiOverlay: true
      },
      educational: {
        subject: 'Earth Science & Astronomy',
        grade_levels: ['High School', 'College'],
        learning_objectives: [
          'Understanding Earth\'s rotation and structure',
          'Learning gesture-based interaction',
          'Exploring 3D visualization concepts',
          'Developing spatial awareness'
        ],
        duration: '15-30 minutes',
        difficulty: 'Intermediate'
      }
    };

    // Convert files to blobs
    const htmlBlob = new Blob([gestureHtmlContent], { type: 'text/html' });
    const configBlob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });

    // Upload files to Firebase Storage
    console.log('Uploading HTML file...');
    const htmlRef = ref(storage, `models/${modelId}/interactive.html`);
    const htmlUpload = await uploadBytes(htmlRef, htmlBlob);
    const htmlURL = await getDownloadURL(htmlUpload.ref);

    console.log('Uploading config file...');
    const configRef = ref(storage, `models/${modelId}/config.json`);
    const configUpload = await uploadBytes(configRef, configBlob);
    const configURL = await getDownloadURL(configUpload.ref);

    // Create Firestore document
    const modelData = {
      id: modelId,
      name: 'Gesture-Controlled Earth Visualization',
      description: 'Interactive 3D Earth model with gesture recognition controls. Explore the solar system using hand gestures to rotate, zoom, and navigate around our planet.',
      fileName: htmlURL,
      configFileName: configURL,
      fileType: 'html',
      originalFileName: 'gesture-earth-demo.html',
      uploadedBy: 'system',
      createdAt: new Date(),
      isActive: true,
      featured: true,
      metadata: {
        subject: 'Earth Science',
        grade: 'High School',
        topic: 'Astronomy',
        tags: ['earth', 'solar-system', 'gesture-control', 'astronomy', 'interactive'],
        difficulty: 'intermediate',
        estimatedTime: '15-20 minutes',
        type: 'interactive-demo'
      },
      instructions: [
        'Allow camera access when prompted',
        'Use open palm gesture to reset the view',
        'Point up to zoom in on Earth',
        'Point down to zoom out',
        'Use pinch gesture to rotate the planet',
        'Watch the status bar for gesture feedback'
      ]
    };

    console.log('Saving model to Firestore...');
    await setDoc(doc(db, 'models', modelId), modelData);
    
    console.log('Gesture model seeded successfully!');
    return modelId;

  } catch (error) {
    console.error('Error seeding gesture model:', error);
    throw error;
  }
}

export async function checkAndSeedModels() {
  try {
    const hasSeededGesture = localStorage.getItem('gesture-model-seeded');
    // Legacy solar system seeding removed (procedural React component now)
    
    if (!hasSeededGesture) {
      console.log('First run - seeding gesture Earth model...');
      await seedGestureModel();
      localStorage.setItem('gesture-model-seeded', 'true');
    }
    
    // Solar system model no longer seeded via HTML upload; skipped.
  } catch (error) {
    console.error('Error checking/seeding models:', error);
  }
}
