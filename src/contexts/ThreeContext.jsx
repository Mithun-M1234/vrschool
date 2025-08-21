import React, { createContext, useContext, useRef, useState } from 'react';
import * as THREE from 'three';

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
    if (!container) return;

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
      if (modelRef.current && modelRef.current.userData.type === 'solar-system') {
        modelRef.current.rotation.y += 0.005;
      }
      
      if (newRenderer && newScene && newCamera) {
        newRenderer.render(newScene, newCamera);
      }
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (container && newRenderer.domElement) {
        container.removeChild(newRenderer.domElement);
      }
      newRenderer.dispose();
    };
  };

  const loadModel = async (modelData) => {
    if (!sceneRef.current) return;

    setIsLoading(true);
    
    try {
      // Remove previous model
      if (modelRef.current) {
        sceneRef.current.remove(modelRef.current);
      }

      let newModel;

      if (modelData.fileName && modelData.fileName.startsWith('http')) {
        // Load from Firebase Storage URL
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const loader = new GLTFLoader();
        
        const gltf = await new Promise((resolve, reject) => {
          loader.load(modelData.fileName, resolve, undefined, reject);
        });
        
        newModel = gltf.scene;
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
      const fallbackModel = createDemoModel(modelData);
      sceneRef.current.add(fallbackModel);
      modelRef.current = fallbackModel;
      setModel(fallbackModel);
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
  };

  return (
    <ThreeContext.Provider value={value}>
      {children}
    </ThreeContext.Provider>
  );
};
