import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { FaUpload, FaTrash, FaEdit, FaEye, FaUsers, FaChartLine, FaPlus } from 'react-icons/fa';
import toast from 'react-hot-toast';

const PortalContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
`;

const PortalHeader = styled(motion.div)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 1.2rem;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
`;

const Tab = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'active'
})`
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.7)'};
  color: ${props => props.active ? '#667eea' : '#666'};
  border: none;
  padding: 1rem 2rem;
  border-radius: 15px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: rgba(255, 255, 255, 0.95);
    transform: translateY(-2px);
  }
`;

const ContentCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
`;

const ModelsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
`;

const ModelCard = styled(motion.div)`
  background: #f8f9fa;
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
  transition: all 0.3s ease;

  &:hover {
    border-color: #667eea;
    transform: translateY(-5px);
  }
`;

const ModelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const ModelTitle = styled.h3`
  margin: 0;
  color: #333;
  font-size: 1.3rem;
`;

const ModelActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: ${props => props.danger ? '#ef4444' : '#667eea'};
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 35px;
  height: 35px;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
  }
`;

const ModelStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1rem;
`;

const StatItem = styled.div`
  text-align: center;
  padding: 0.75rem;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 10px;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.25rem;
`;

const UploadSection = styled.div`
  border: 2px dashed #667eea;
  border-radius: 15px;
  padding: 2rem;
  text-align: center;
  margin-bottom: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(102, 126, 234, 0.05);
  }
`;

const UploadIcon = styled.div`
  font-size: 3rem;
  color: #667eea;
  margin-bottom: 1rem;
`;

const UploadText = styled.p`
  color: #666;
  font-size: 1.1rem;
  margin: 0;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #333;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 10px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const SubmitButton = styled.button`
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 15px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-self: flex-start;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const TeacherPortal = () => {
  const { user } = useAuth();
  const { getModels, uploadModel, deleteModel, getModelAnalytics } = useFirestore();
  const [activeTab, setActiveTab] = useState('models');
  const [models, setModels] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(false);
  const [newModel, setNewModel] = useState({
    name: '',
    description: '',
    subject: '',
    grade: '',
    estimatedTime: '',
    file: null
  });

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const modelsData = await getModels();
      setModels(modelsData);
      
      // Load analytics for each model (with error handling)
      const analyticsData = {};
      for (const model of modelsData) {
        try {
          analyticsData[model.id] = await getModelAnalytics(model.id);
        } catch (analyticsError) {
          console.warn(`Failed to load analytics for model ${model.id}:`, analyticsError.message);
          // Set default analytics if loading fails
          analyticsData[model.id] = {
            totalViews: 0,
            uniqueUsers: 0,
            avgDuration: 0
          };
        }
      }
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading models:', error);
      toast.error('Failed to load models');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file type
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const supportedTypes = ['glb', 'gltf', 'obj', 'fbx', 'html', 'htm'];
      
      if (!supportedTypes.includes(fileExtension)) {
        toast.error('Unsupported file type. Please select a 3D model file (.glb, .gltf, .obj, .fbx) or HTML lesson (.html)');
        return;
      }
      
      setNewModel({ ...newModel, file, fileType: fileExtension });
      
      if (fileExtension === 'html' || fileExtension === 'htm') {
        toast.success(`Selected HTML lesson: ${file.name}`);
      } else {
        toast.success(`Selected 3D model: ${file.name}`);
      }
    }
  };

  const handleModelSubmit = async (e) => {
    e.preventDefault();
    if (!newModel.name || !newModel.description || !newModel.file) {
      toast.error('Please fill in all required fields and select a file');
      return;
    }

    setLoading(true);
    try {
      // Create config data
      const configData = {
        name: newModel.name,
        description: newModel.description,
        subject: newModel.subject,
        estimatedTime: newModel.estimatedTime,
        gestures: []
      };
      
      // Convert config to blob
      const configBlob = new Blob([JSON.stringify(configData, null, 2)], {
        type: 'application/json'
      });
      
      // Create metadata object
      const metadata = {
        name: newModel.name,
        description: newModel.description,
        subject: newModel.subject,
        grade: newModel.grade || 'General',
        topic: newModel.subject,
        tags: newModel.subject ? [newModel.subject] : []
      };
      
      // Call uploadModel with correct parameter order: (modelFile, configFile, metadata, teacherId)
      await uploadModel(newModel.file, configBlob, metadata, user.uid);
      toast.success('Model uploaded successfully!');
      setNewModel({
        name: '',
        description: '',
        subject: '',
        grade: '',
        estimatedTime: '',
        file: null
      });
      // Reset file input
      document.getElementById('file-upload').value = '';
      loadModels();
    } catch (error) {
      console.error('Error uploading model:', error);
      toast.error('Failed to upload model: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModel = async (modelId) => {
    if (window.confirm('Are you sure you want to delete this model?')) {
      try {
        await deleteModel(modelId);
        toast.success('Model deleted successfully');
        loadModels();
      } catch (error) {
        console.error('Error deleting model:', error);
        toast.error('Failed to delete model');
      }
    }
  };

  const renderModelsTab = () => (
    <ContentCard
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2>Manage 3D Models</h2>
      
      <UploadSection onClick={() => document.getElementById('file-upload').click()}>
        <UploadIcon>📁</UploadIcon>
        <UploadText>
          Click to upload 3D models (.glb, .gltf, .obj, .fbx) or interactive HTML lessons (.html)
        </UploadText>
        <input
          id="file-upload"
          type="file"
          accept=".glb,.gltf,.obj,.fbx,.html,.htm"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </UploadSection>

      <form onSubmit={handleModelSubmit}>
        <FormGrid>
          <FormGroup>
            <Label>Model Name *</Label>
            <Input
              type="text"
              value={newModel.name}
              onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
              placeholder="e.g., Human Heart"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Subject</Label>
            <Input
              type="text"
              value={newModel.subject}
              onChange={(e) => setNewModel({ ...newModel, subject: e.target.value })}
              placeholder="e.g., Biology"
            />
          </FormGroup>

          <FormGroup>
            <Label>Grade Level</Label>
            <Input
              type="text"
              value={newModel.grade}
              onChange={(e) => setNewModel({ ...newModel, grade: e.target.value })}
              placeholder="e.g., 5th Grade, High School"
            />
          </FormGroup>

          <FormGroup>
            <Label>Estimated Time (minutes)</Label>
            <Input
              type="number"
              value={newModel.estimatedTime}
              onChange={(e) => setNewModel({ ...newModel, estimatedTime: e.target.value })}
              placeholder="10"
            />
          </FormGroup>
        </FormGrid>

        <FormGroup>
          <Label>Description *</Label>
          <TextArea
            value={newModel.description}
            onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
            placeholder="Describe what students will learn from this model..."
            required
          />
        </FormGroup>

        <SubmitButton type="submit" disabled={loading}>
          <FaPlus /> {loading ? 'Uploading...' : 'Add Model'}
        </SubmitButton>
      </form>

      <ModelsGrid>
        {models.map((model) => (
          <ModelCard
            key={model.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ModelHeader>
              <ModelTitle>{model.name}</ModelTitle>
              <ModelActions>
                <ActionButton title="View Analytics">
                  <FaEye />
                </ActionButton>
                <ActionButton title="Edit Model">
                  <FaEdit />
                </ActionButton>
                <ActionButton 
                  danger 
                  title="Delete Model"
                  onClick={() => handleDeleteModel(model.id)}
                >
                  <FaTrash />
                </ActionButton>
              </ModelActions>
            </ModelHeader>
            
            <p style={{ color: '#666', marginBottom: '1rem' }}>{model.description}</p>

            <ModelStats>
              <StatItem>
                <StatValue>{analytics[model.id]?.totalViews || 0}</StatValue>
                <StatLabel>Views</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{analytics[model.id]?.uniqueUsers || 0}</StatValue>
                <StatLabel>Users</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{Math.round((analytics[model.id]?.avgDuration || 0) / 60)}</StatValue>
                <StatLabel>Avg Minutes</StatLabel>
              </StatItem>
            </ModelStats>
          </ModelCard>
        ))}
      </ModelsGrid>
    </ContentCard>
  );

  const renderAnalyticsTab = () => (
    <ContentCard
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2>Analytics Dashboard</h2>
      <p>Coming soon: Detailed analytics, student progress tracking, and engagement metrics.</p>
    </ContentCard>
  );

  const renderStudentsTab = () => (
    <ContentCard
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2>Student Management</h2>
      <p>Coming soon: Student roster, assignment tracking, and progress monitoring.</p>
    </ContentCard>
  );

  return (
    <PortalContainer>
      <PortalHeader
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Title>👨‍🏫 Teacher Portal</Title>
        <Subtitle>
          Manage your 3D learning content and track student progress
        </Subtitle>
      </PortalHeader>

      <TabsContainer>
        <Tab 
          active={activeTab === 'models'} 
          onClick={() => setActiveTab('models')}
        >
          <FaUpload /> Models
        </Tab>
        <Tab 
          active={activeTab === 'students'} 
          onClick={() => setActiveTab('students')}
        >
          <FaUsers /> Students
        </Tab>
        <Tab 
          active={activeTab === 'analytics'} 
          onClick={() => setActiveTab('analytics')}
        >
          <FaChartLine /> Analytics
        </Tab>
      </TabsContainer>

      {activeTab === 'models' && renderModelsTab()}
      {activeTab === 'students' && renderStudentsTab()}
      {activeTab === 'analytics' && renderAnalyticsTab()}
    </PortalContainer>
  );
};

export default TeacherPortal;
