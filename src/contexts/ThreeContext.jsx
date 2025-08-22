import React, { createContext, useContext, useRef, useState } from 'react';
import * as THREE from 'three';
// Use static import for GLTFLoader to avoid dynamic import race conditions / undefined constructor issues
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const ThreeContext = createContext();

export const useThree = () => {
  const context = useContext(ThreeContext);
  if (!context) {
    throw new Error('useThree must be used within a ThreeProvider');
  }
  return context;
};

export const ThreeProvider = ({ children }) => {
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const modelRef = useRef(null);
  const controlsRef = useRef(null);
  
  const [scene, setScene] = useState(null);
  const [camera, setCamera] = useState(null);
  const [renderer, setRenderer] = useState(null);
  const [model, setModel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const initThreeJS = (container) => {
    if (!container) {
      console.error('Container is required for Three.js initialization');
      throw new Error('Container is required for Three.js initialization');
    }

    try {
      // Check if Three.js is available
      if (typeof THREE === 'undefined') {
        throw new Error('Three.js library not loaded');
      }

      console.log('Initializing Three.js scene...');

      // Scene
      const newScene = new THREE.Scene();
      newScene.background = new THREE.Color(0x222222);
      sceneRef.current = newScene;
      setScene(newScene);

      // Camera
      const newCamera = new THREE.PerspectiveCamera(
        75, 
        container.clientWidth / container.clientHeight, 
        0.1, 
        1000
      );
      newCamera.position.set(0, 0, 5);
      cameraRef.current = newCamera;
      setCamera(newCamera);

      // Renderer
      const newRenderer = new THREE.WebGLRenderer({ antialias: true });
      newRenderer.setSize(container.clientWidth, container.clientHeight);
      newRenderer.shadowMap.enabled = true;
      newRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
      newRenderer.setPixelRatio(window.devicePixelRatio);
      
      // Clear previous renderer if exists
      if (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(newRenderer.domElement);
      
      rendererRef.current = newRenderer;
      setRenderer(newRenderer);

      // Lights
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
      newScene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      newScene.add(directionalLight);

      // Handle resize
      const handleResize = () => {
        if (newCamera && newRenderer && container) {
          newCamera.aspect = container.clientWidth / container.clientHeight;
          newCamera.updateProjectionMatrix();
          newRenderer.setSize(container.clientWidth, container.clientHeight);
        }
      };

      window.addEventListener('resize', handleResize);

      // Start render loop
      const animate = () => {
        requestAnimationFrame(animate);
        
        if (controlsRef.current) {
          controlsRef.current.update();
        }
        
        // Auto-rotate solar system models
        if (modelRef.current && modelRef.current.userData && modelRef.current.userData.type === 'solar-system') {
          modelRef.current.rotation.y += 0.005;
        }
        
        if (newRenderer && newScene && newCamera) {
          newRenderer.render(newScene, newCamera);
        }
      };
      animate();

      console.log('✅ Three.js initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Three.js:', error);
      throw error;
    }
  };

  const loadModel = async (modelData) => {
    if (!sceneRef.current) {
      throw new Error('Scene not initialized. Please initialize Three.js first.');
    }

    console.log('Loading model:', modelData);
    setIsLoading(true);
    
    try {
      // Remove previous model
      if (modelRef.current) {
        sceneRef.current.remove(modelRef.current);
      }

      let newModel;

      if (modelData.fileName && modelData.fileName.startsWith('http')) {
        // Load from remote (Firebase Storage) URL
        try {
          const loader = new GLTFLoader();
          const gltf = await new Promise((resolve, reject) => {
            loader.load(
              modelData.fileName,
              (gltf) => resolve(gltf),
              undefined,
              (error) => reject(error)
            );
          });
          newModel = gltf.scene;
        } catch (error) {
          console.error('Error loading GLTF model, falling back to demo primitive:', error);
          newModel = createDemoModel(modelData);
        }
      } else {
        // Create demo model based on name
        newModel = createDemoModel(modelData);
      }

      newModel.userData = { 
        type: modelData.name.toLowerCase().includes('solar') ? 'solar-system' : 'default',
        modelData 
      };

      sceneRef.current.add(newModel);
      modelRef.current = newModel;
      setModel(newModel);

      console.log(`✅ Model loaded: ${modelData.name}`);
    } catch (error) {
      console.error('Error loading model:', error);
      // Create fallback model
      try {
        const fallbackModel = createDemoModel(modelData);
        sceneRef.current.add(fallbackModel);
        modelRef.current = fallbackModel;
        setModel(fallbackModel);
        console.log('✅ Fallback model created');
      } catch (fallbackError) {
        console.error('Error creating fallback model:', fallbackError);
        throw new Error(`Failed to load model: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createDemoModel = (modelData) => {
    const group = new THREE.Group();

    if (modelData.name.toLowerCase().includes('heart')) {
      // Create heart shape
      const heartShape = new THREE.Shape();
      const x = 0, y = 0;
      heartShape.moveTo(x + 5, y + 5);
      heartShape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
      heartShape.bezierCurveTo(x - 6, y, x - 6, y + 3.5, x - 6, y + 3.5);
      heartShape.bezierCurveTo(x - 6, y + 5.5, x - 4, y + 7.7, x, y + 10);
      heartShape.bezierCurveTo(x + 4, y + 7.7, x + 6, y + 5.5, x + 6, y + 3.5);
      heartShape.bezierCurveTo(x + 6, y + 3.5, x + 6, y, x, y);
      
      const extrudeSettings = { 
        depth: 2, 
        bevelEnabled: true, 
        bevelSegments: 2, 
        steps: 2, 
        bevelSize: 1, 
        bevelThickness: 1 
      };
      
      const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
      const material = new THREE.MeshPhongMaterial({ color: 0xff4444 });
      const heart = new THREE.Mesh(geometry, material);
      heart.scale.set(0.1, 0.1, 0.1);
      heart.castShadow = true;
      group.add(heart);
      
    } else if (modelData.name.toLowerCase().includes('solar')) {
      // Create solar system
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
      
    } else {
      // Default cube
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshPhongMaterial({ color: 0x00ff88 });
      const cube = new THREE.Mesh(geometry, material);
      cube.castShadow = true;
      group.add(cube);
    }

    return group;
  };

  const applyGestureAction = (action, config = {}) => {
    if (!cameraRef.current || !modelRef.current) return;

    switch (action) {
      case 'zoomIn':
        cameraRef.current.position.multiplyScalar(0.9);
        break;
      case 'zoomOut':
        cameraRef.current.position.multiplyScalar(1.1);
        break;
      case 'rotateLeft':
        modelRef.current.rotation.y -= 0.2;
        break;
      case 'rotateRight':
        modelRef.current.rotation.y += 0.2;
        break;
      case 'rotateUp':
        modelRef.current.rotation.x -= 0.2;
        break;
      case 'rotateDown':
        modelRef.current.rotation.x += 0.2;
        break;
      case 'resetView':
        cameraRef.current.position.set(0, 0, 5);
        modelRef.current.rotation.set(0, 0, 0);
        break;
      default:
        console.log(`Action not implemented: ${action}`);
    }
  };

  const cleanupScene = () => {
    if (rendererRef.current) {
      if (rendererRef.current.domElement && rendererRef.current.domElement.parentNode) {
        rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current.dispose();
    }
    
    // Clear refs
    sceneRef.current = null;
    cameraRef.current = null;
    rendererRef.current = null;
    modelRef.current = null;
    controlsRef.current = null;
    
    // Clear state
    setScene(null);
    setCamera(null);
    setRenderer(null);
    setModel(null);
  };

  const value = {
    scene,
    camera,
    renderer,
    model,
    isLoading,
    sceneRef,
    cameraRef,
    rendererRef,
    modelRef,
    controlsRef,
    initThreeJS,
    loadModel,
    applyGestureAction,
    cleanupScene,
  };

  return (
    <ThreeContext.Provider value={value}>
      {children}
    </ThreeContext.Provider>
  );
};
