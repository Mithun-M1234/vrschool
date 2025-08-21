// Sample 3D models for demonstration - can be used while Firebase Storage is being set up
export const sampleModels = [
  {
    id: 'heart-model-demo',
    name: 'Human Heart Model',
    description: 'Interactive 3D model of the human heart showing chambers, valves, and blood flow',
    fileName: '/models/heart.glb', // We'll create local model files
    configFileName: '/configs/HeartModel_gestureConfig.json',
    uploadedBy: 'system',
    isActive: true,
    metadata: {
      subject: 'Biology',
      grade: '9-12',
      topic: 'Cardiovascular System',
      tags: ['anatomy', 'heart', 'circulation']
    }
  },
  {
    id: 'solar-system-demo',
    name: 'Solar System Model',
    description: 'Complete solar system with planets, orbits, and interactive features',
    fileName: '/models/solar-system.glb',
    configFileName: '/configs/SolarSystem_gestureConfig.json',
    uploadedBy: 'system',
    isActive: true,
    metadata: {
      subject: 'Astronomy',
      grade: '6-12',
      topic: 'Solar System',
      tags: ['planets', 'space', 'astronomy']
    }
  },
  {
    id: 'molecule-demo',
    name: 'Water Molecule (H2O)',
    description: 'Interactive water molecule showing atomic structure and bonds',
    fileName: '/models/water-molecule.glb',
    configFileName: '/configs/Molecule_gestureConfig.json',
    uploadedBy: 'system',
    isActive: true,
    metadata: {
      subject: 'Chemistry',
      grade: '7-12',
      topic: 'Molecular Structure',
      tags: ['chemistry', 'molecules', 'atoms']
    }
  }
];

// Fallback function when Firebase Storage is not available
export const getSampleModels = () => {
  return sampleModels;
};

// Check if we should use sample models or Firebase Storage
export const shouldUseSampleModels = () => {
  // You can modify this logic based on your needs
  return !window.location.hostname.includes('firebase') && window.location.hostname.includes('localhost');
};
