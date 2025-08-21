// 🚀 GESTURE-CONTROLLED 3D LEARNING PLATFORM
// Iron Man level hackathon MVP with Firebase Firestore!

import { GestureMapper, GestureDetector } from '../utils/gestureMapper.js';
import firebaseService from '../firebase/dbStructure.js';
import { auth } from '../firebase/firebaseConfig.js';

class App {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.model = null;
    this.gestureMapper = null;
    this.gestureDetector = new GestureDetector();
    this.hands = null;
    this.camera_feed = null;
    this.currentUser = null;
    this.currentUserProfile = null;
    this.currentModelConfig = null;
    this.currentAssignment = null;
    this.sessionStart = null;
    this.gesturesUsed = [];
    this.authUnsubscribe = null;
    
    this.init();
  }

  async init() {
    console.log('🚀 Initializing Gesture-Controlled 3D Learning Platform with Firebase...');
    
    // Setup Firebase auth listener
    this.setupAuthListener();
    
    // Setup UI event listeners
    this.setupEventListeners();
    
    // Initialize MediaPipe
    await this.initMediaPipe();
    
    // Show login screen initially
    this.showScreen('loginScreen');
  }

  setupAuthListener() {
    this.authUnsubscribe = firebaseService.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('🔐 User authenticated:', user.email);
        this.currentUser = user;
        
        // Get user profile from Firestore
        this.currentUserProfile = await firebaseService.getUserProfile(user.uid);
        this.updateUserInfo();
        
        // Load user's assignments/models
        await this.loadUserContent();
        this.showDashboard();
      } else {
        console.log('🔐 User signed out');
        this.currentUser = null;
        this.currentUserProfile = null;
        this.showScreen('loginScreen');
      }
    });
  }

  updateUserInfo() {
    const userInfoDiv = document.getElementById('userInfo');
    if (this.currentUserProfile) {
      userInfoDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <img src="${this.currentUserProfile.profile.photoURL || '/default-avatar.png'}" 
               alt="Avatar" style="width: 32px; height: 32px; border-radius: 50%;">
          <span>${this.currentUserProfile.profile.name}</span>
          <span class="role-badge">${this.currentUserProfile.role}</span>
          <button id="signOutBtn" class="btn-secondary" style="margin-left: 1rem;">Sign Out</button>
        </div>
      `;
      
      document.getElementById('signOutBtn').addEventListener('click', () => {
        this.signOut();
      });
    }
  }

  setupEventListeners() {
    // Login button
    document.getElementById('loginBtn').addEventListener('click', () => {
      this.signInWithGoogle();
    });
    
    // Back button
    document.getElementById('backBtn').addEventListener('click', () => {
      this.endSession();
      this.showDashboard();
    });
  }

  async signInWithGoogle() {
    try {
      console.log('🔐 Signing in with Google...');
      await firebaseService.signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
      alert('Sign in failed. Please try again.');
    }
  }

  async signOut() {
    try {
      await firebaseService.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  async loadUserContent() {
    if (!this.currentUser) return;
    
    try {
      if (this.currentUserProfile.role === 'student') {
        // Load student assignments
        const assignments = await firebaseService.getStudentAssignments(this.currentUser.uid);
        this.userAssignments = assignments;
      } else if (this.currentUserProfile.role === 'teacher') {
        // Load teacher's models and assignments
        const models = await firebaseService.getModels(this.currentUser.uid);
        const assignments = await firebaseService.getTeacherAssignments(this.currentUser.uid);
        this.userModels = models;
        this.userAssignments = assignments;
      }
    } catch (error) {
      console.error('Error loading user content:', error);
      
      // Fallback to demo data
      this.loadDemoData();
    }
  }

  loadDemoData() {
    // Demo data for when Firebase isn't configured
    const demoModels = [
      {
        id: 'heart-model',
        name: 'Human Heart',
        description: 'Interactive 3D model of the human heart with gesture controls',
        fileName: 'HeartModel.glb',
        configFileName: 'HeartModel_gestureConfig.json',
        metadata: {
          subject: 'Biology',
          grade: 'Grade 10',
          tags: ['Biology', 'Anatomy', 'Grade 10']
        }
      },
      {
        id: 'solar-system',
        name: 'Solar System',
        description: 'Explore our solar system with gesture-controlled interactions',
        fileName: 'SolarSystem.glb',
        configFileName: 'SolarSystem_gestureConfig.json',
        metadata: {
          subject: 'Astronomy',
          grade: 'Grade 8',
          tags: ['Astronomy', 'Physics', 'Grade 8']
        }
      }
    ];

    if (this.currentUserProfile?.role === 'student') {
      this.userAssignments = demoModels.map(model => ({
        id: `assignment-${model.id}`,
        model: model,
        assignedAt: new Date(),
        instructions: `Explore the ${model.name} using gesture controls.`
      }));
    } else {
      this.userModels = demoModels;
    }
  }

  showDashboard() {
    this.showScreen('dashboard');
    this.renderContent();
  }

  renderContent() {
    const modelsList = document.getElementById('modelsList');
    const dashboardTitle = document.querySelector('#dashboard h2');
    
    if (this.currentUserProfile?.role === 'student') {
      dashboardTitle.textContent = 'Your Assignments';
      this.renderStudentAssignments(modelsList);
    } else if (this.currentUserProfile?.role === 'teacher') {
      dashboardTitle.textContent = 'Your 3D Models';
      this.renderTeacherModels(modelsList);
    } else {
      dashboardTitle.textContent = 'Demo Models';
      this.renderDemoModels(modelsList);
    }
  }

  renderStudentAssignments(container) {
    container.innerHTML = '';
    
    if (!this.userAssignments || this.userAssignments.length === 0) {
      container.innerHTML = '<div class="no-content">No assignments yet. Check back later!</div>';
      return;
    }

    this.userAssignments.forEach(assignment => {
      const model = assignment.model;
      const assignmentCard = document.createElement('div');
      assignmentCard.className = 'model-card';
      
      const dueDate = assignment.dueDate ? new Date(assignment.dueDate.seconds * 1000).toLocaleDateString() : 'No due date';
      
      assignmentCard.innerHTML = `
        <h3>${model.name}</h3>
        <p>${model.description}</p>
        <div class="assignment-info">
          <small><strong>Due:</strong> ${dueDate}</small>
          <p><strong>Instructions:</strong> ${assignment.instructions || 'Explore the model using gesture controls.'}</p>
        </div>
        <div class="tags">
          ${model.metadata.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      `;
      
      assignmentCard.addEventListener('click', () => {
        this.openAssignment(assignment);
      });
      
      container.appendChild(assignmentCard);
    });
  }

  renderTeacherModels(container) {
    container.innerHTML = '';
    
    if (!this.userModels || this.userModels.length === 0) {
      container.innerHTML = `
        <div class="no-content">
          <h3>No models uploaded yet</h3>
          <p>Upload your first 3D model to get started!</p>
          <button class="btn-primary" onclick="alert('Teacher portal coming soon!')">Upload Model</button>
        </div>
      `;
      return;
    }

    this.userModels.forEach(model => {
      const modelCard = document.createElement('div');
      modelCard.className = 'model-card';
      modelCard.innerHTML = `
        <h3>${model.name}</h3>
        <p>${model.description}</p>
        <div class="model-stats">
          <small>Created: ${new Date(model.createdAt.seconds * 1000).toLocaleDateString()}</small>
        </div>
        <div class="tags">
          ${model.metadata.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <div class="model-actions">
          <button class="btn-secondary" onclick="alert('Assignment feature coming soon!')">Assign to Students</button>
        </div>
      `;
      
      modelCard.addEventListener('click', () => {
        this.openModelPreview(model);
      });
      
      container.appendChild(modelCard);
    });
  }

  renderDemoModels(container) {
    this.loadDemoData();
    container.innerHTML = '';

    this.userModels.forEach(model => {
      const modelCard = document.createElement('div');
      modelCard.className = 'model-card';
      modelCard.innerHTML = `
        <h3>${model.name}</h3>
        <p>${model.description}</p>
        <div class="tags">
          ${model.metadata.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      `;
      
      modelCard.addEventListener('click', () => {
        this.openModelDemo(model);
      });
      
      container.appendChild(modelCard);
    });
  }

  async openAssignment(assignment) {
    console.log(`🎮 Opening assignment: ${assignment.model.name}`);
    
    this.currentAssignment = assignment;
    this.sessionStart = new Date();
    this.gesturesUsed = [];
    
    this.showScreen('viewer');
    
    // Load gesture configuration
    await this.loadGestureConfig(assignment.model);
    
    // Initialize Three.js scene
    this.initThreeJS();
    
    // Load 3D model
    await this.load3DModel(assignment.model);
    
    // Start gesture detection
    this.startGestureDetection();
    
    // Show gesture instructions
    this.showGestureInstructions();
  }

  async openModelPreview(model) {
    console.log(`👀 Previewing model: ${model.name}`);
    this.openModelDemo(model);
  }

  async openModelDemo(model) {
    console.log(`🎮 Opening demo: ${model.name}`);
    
    this.sessionStart = new Date();
    this.gesturesUsed = [];
    
    this.showScreen('viewer');
    
    // Load gesture configuration
    await this.loadGestureConfig(model);
    
    // Initialize Three.js scene
    this.initThreeJS();
    
    // Load 3D model
    await this.load3DModel(model);
    
    // Start gesture detection
    this.startGestureDetection();
    
    // Show gesture instructions
    this.showGestureInstructions();
  }

  async loadGestureConfig(model) {
    try {
      let config;
      
      if (model.configFileName && model.configFileName.startsWith('http')) {
        // Load from Firebase Storage URL
        const response = await fetch(model.configFileName);
        config = await response.json();
      } else {
        // Load from local configs folder (demo)
        const configFile = model.configFileName || `${model.fileName.replace('.glb', '')}_gestureConfig.json`;
        const response = await fetch(`../configs/${configFile}`);
        config = await response.json();
      }
      
      this.currentModelConfig = config;
      this.gestureMapper = new GestureMapper(config);
      
      console.log('⚙️ Gesture config loaded:', config.modelName);
    } catch (error) {
      console.error('Failed to load gesture config:', error);
      
      // Fallback config
      this.currentModelConfig = {
        modelName: model.name,
        gestureMap: {
          pinch: 'zoomIn',
          pinchOut: 'zoomOut',
          openPalm: 'resetView',
          swipeLeft: 'rotateLeft',
          swipeRight: 'rotateRight'
        }
      };
      this.gestureMapper = new GestureMapper(this.currentModelConfig);
    }
  }

  initThreeJS() {
    const container = document.getElementById('threejs-container');
    
    // Clear previous scene
    if (this.renderer) {
      container.removeChild(this.renderer.domElement);
    }
    
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x222222);
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 5);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
    
    // Controls (backup for gestures)
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    // Handle window resize
    window.addEventListener('resize', () => {
      if (this.camera && this.renderer) {
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
      }
    });
    
    // Start render loop
    this.animate();
    
    console.log('🎬 Three.js initialized');
  }

  async load3DModel(model) {
    try {
      console.log(`📦 Loading 3D model: ${model.name}`);
      
      // Clear previous model
      if (this.model) {
        this.scene.remove(this.model);
      }
      
      if (model.fileName && model.fileName.startsWith('http')) {
        // Load from Firebase Storage URL
        const loader = new THREE.GLTFLoader();
        const gltf = await new Promise((resolve, reject) => {
          loader.load(model.fileName, resolve, undefined, reject);
        });
        
        this.model = gltf.scene;
        this.scene.add(this.model);
        
        console.log('📦 Model loaded from Firebase Storage');
      } else {
        // Create demo model based on name
        if (model.name.toLowerCase().includes('heart')) {
          this.createHeartModel();
        } else if (model.name.toLowerCase().includes('solar')) {
          this.createSolarSystemModel();
        } else {
          this.createDefaultModel();
        }
      }
    } catch (error) {
      console.error('Error loading 3D model:', error);
      this.createDefaultModel();
    }
  }

  createHeartModel() {
    // Create a simple heart-like shape for demo
    const heartShape = new THREE.Shape();
    const x = 0, y = 0;
    heartShape.moveTo(x + 5, y + 5);
    heartShape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
    heartShape.bezierCurveTo(x - 6, y, x - 6, y + 3.5, x - 6, y + 3.5);
    heartShape.bezierCurveTo(x - 6, y + 5.5, x - 4, y + 7.7, x, y + 10);
    heartShape.bezierCurveTo(x + 4, y + 7.7, x + 6, y + 5.5, x + 6, y + 3.5);
    heartShape.bezierCurveTo(x + 6, y + 3.5, x + 6, y, x, y);
    
    const extrudeSettings = { depth: 2, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
    const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    const material = new THREE.MeshPhongMaterial({ color: 0xff4444 });
    
    this.model = new THREE.Mesh(geometry, material);
    this.model.scale.set(0.1, 0.1, 0.1);
    this.model.castShadow = true;
    this.scene.add(this.model);
    
    console.log('❤️ Heart model created');
  }

  createSolarSystemModel() {
    // Create a simple solar system
    const group = new THREE.Group();
    
    // Sun
    const sunGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    group.add(sun);
    
    // Earth
    const earthGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const earthMaterial = new THREE.MeshPhongMaterial({ color: 0x0077ff });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.x = 3;
    group.add(earth);
    
    // Mars
    const marsGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const marsMaterial = new THREE.MeshPhongMaterial({ color: 0xff4422 });
    const mars = new THREE.Mesh(marsGeometry, marsMaterial);
    mars.position.x = 4.5;
    group.add(mars);
    
    this.model = group;
    this.scene.add(this.model);
    
    console.log('🌌 Solar system model created');
  }

  createDefaultModel() {
    // Default cube
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff88 });
    this.model = new THREE.Mesh(geometry, material);
    this.model.castShadow = true;
    this.scene.add(this.model);
    
    console.log('📦 Default model created');
  }

  async initMediaPipe() {
    console.log('👋 Initializing MediaPipe Hands...');
    
    // Initialize Hands
    this.hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });
    
    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    
    this.hands.onResults(this.onHandsResults.bind(this));
    
    // Initialize camera
    const videoElement = document.getElementById('input_video');
    this.camera_feed = new Camera(videoElement, {
      onFrame: async () => {
        await this.hands.send({ image: videoElement });
      },
      width: 640,
      height: 480
    });
  }

  startGestureDetection() {
    if (this.camera_feed) {
      this.camera_feed.start();
      console.log('📹 Gesture detection started');
    }
  }

  onHandsResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks;
      const gesture = this.gestureDetector.detectGesture(landmarks);
      
      if (gesture) {
        this.handleGesture(gesture);
        this.updateGestureUI(gesture);
      }
    }
  }

  handleGesture(gesture) {
    if (!this.gestureMapper || !this.model) return;
    
    const gestureData = this.gestureMapper.processGesture(gesture);
    if (!gestureData) return;
    
    console.log(`🖐️ Gesture detected: ${gesture} → ${gestureData.action}`);
    
    // Log gesture for analytics
    this.gesturesUsed.push({
      gesture,
      action: gestureData.action,
      timestamp: Date.now()
    });
    
    // Apply gesture action to 3D model
    this.applyGestureAction(gestureData.action, gestureData.config);
  }

  applyGestureAction(action, config) {
    if (!this.model) return;
    
    switch (action) {
      case 'zoomIn':
        this.camera.position.multiplyScalar(0.9);
        break;
      case 'zoomOut':
        this.camera.position.multiplyScalar(1.1);
        break;
      case 'rotateLeft':
        this.model.rotation.y -= 0.2;
        break;
      case 'rotateRight':
        this.model.rotation.y += 0.2;
        break;
      case 'rotateUp':
        this.model.rotation.x -= 0.2;
        break;
      case 'rotateDown':
        this.model.rotation.x += 0.2;
        break;
      case 'resetView':
        this.camera.position.set(0, 0, 5);
        this.model.rotation.set(0, 0, 0);
        break;
      case 'pauseAnimation':
        // Toggle animation if any
        break;
      default:
        console.log(`Action not implemented: ${action}`);
    }
  }

  updateGestureUI(gesture) {
    const gestureDisplay = document.getElementById('detectedGesture');
    gestureDisplay.textContent = gesture.toUpperCase();
    gestureDisplay.style.color = '#4285f4';
    
    // Clear after 1 second
    setTimeout(() => {
      gestureDisplay.textContent = 'Detecting...';
      gestureDisplay.style.color = '#666';
    }, 1000);
  }

  showGestureInstructions() {
    if (!this.gestureMapper) return;
    
    const instructionsDiv = document.getElementById('gestureInstructions');
    const gestures = this.gestureMapper.getAvailableGestures();
    
    const instructions = gestures.map(gesture => {
      const action = this.gestureMapper.mapGesture(gesture);
      return `<div class="gesture-instruction"><strong>${gesture}:</strong> ${action}</div>`;
    }).join('');
    
    instructionsDiv.innerHTML = instructions;
  }

  async endSession() {
    if (this.sessionStart && this.currentUser) {
      const sessionEnd = new Date();
      const sessionDuration = sessionEnd - this.sessionStart;
      
      const sessionData = {
        sessionStart: this.sessionStart,
        sessionEnd: sessionEnd,
        gesturesUsed: this.gesturesUsed,
        totalGestures: this.gesturesUsed.length,
        sessionDuration: sessionDuration,
        completionPercentage: Math.min(100, (this.gesturesUsed.length / 10) * 100) // Simple completion metric
      };
      
      try {
        if (this.currentAssignment) {
          await firebaseService.logInteraction(
            this.currentUser.uid,
            this.currentAssignment.modelId,
            this.currentAssignment.id,
            sessionData
          );
          console.log('📊 Session analytics saved');
        }
      } catch (error) {
        console.error('Error saving session analytics:', error);
      }
    }
    
    // Stop camera
    if (this.camera_feed) {
      this.camera_feed.stop();
    }
    
    // Reset session data
    this.sessionStart = null;
    this.gesturesUsed = [];
    this.currentAssignment = null;
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    if (this.controls) {
      this.controls.update();
    }
    
    // Simple rotation animation for demo
    if (this.model && this.currentModelConfig?.modelName === 'SolarSystem') {
      this.model.rotation.y += 0.005;
    }
    
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });
    
    // Show selected screen
    document.getElementById(screenId).classList.add('active');
  }

  // Cleanup when app is destroyed
  destroy() {
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
    }
    
    if (this.camera_feed) {
      this.camera_feed.stop();
    }
    
    this.endSession();
  }
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.app) {
    window.app.destroy();
  }
});

console.log('🚀 Gesture-Controlled 3D Learning Platform with Firebase loaded! Ready for Iron Man level demos!');
