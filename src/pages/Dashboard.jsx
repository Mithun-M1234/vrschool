import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { Link } from 'react-router-dom';
import { FaHeart, FaSolarPanel, FaPlay, FaEye, FaClock, FaAward } from 'react-icons/fa';
import { getLiveRoomsByUser, deleteLiveRoom, listenLiveRoomsByUser, deleteModel } from '../services/firestore';
import toast from 'react-hot-toast';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem;
`;

const WelcomeSection = styled(motion.div)`
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

const WelcomeTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const WelcomeText = styled.p`
  color: #666;
  font-size: 1.2rem;
  margin-bottom: 1rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

const StatIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #667eea;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  color: #666;
  font-size: 0.9rem;
`;

const ModelsSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 1rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ModelsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const ModelCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const ModelImage = styled.div`
  height: 200px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  color: white;
`;

const ModelContent = styled.div`
  padding: 1.5rem;
`;

const ModelTitle = styled.h3`
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  color: #333;
`;

const ModelDescription = styled.p`
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.6;
`;

const ModelFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PlayButton = styled(Link)`
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  }
`;

const DeleteButton = styled.button`
  background: linear-gradient(45deg, #ff6b6b, #ff4757);
  color: white;
  border: none;
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease;

  &:hover { transform: translateY(-2px); }
`;

const ModelMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #999;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
  font-size: 1.1rem;
`;

const Dashboard = () => {
  const { user, userProfile } = useAuth();
  const { getModels, getUserStats } = useFirestore();
  const [models, setModels] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [liveRooms, setLiveRooms] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [modelsData, userStats] = await Promise.all([
          getModels(),
          getUserStats(user.uid)
        ]);
        
        setModels(modelsData);
        setStats(userStats);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    let unsubscribe = null;

    const start = async () => {
      await loadDashboardData();
      if (userProfile?.role === 'teacher') {
        unsubscribe = listenLiveRoomsByUser(user.uid, (rooms) => setLiveRooms(rooms));
      }
    };

    if (user) start();

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user]);

  const handleDeleteModel = async (modelId) => {
    if (userProfile?.role !== 'teacher') {
      alert('Only teachers can delete models.');
      return;
    }

    if (!confirm('Delete this 3D model? This will hide it from students. Proceed?')) return;

    const prev = models;
    setModels(models.filter(m => m.id !== modelId));
    try {
      await deleteModel(modelId);
      toast.success('Model deleted');
    } catch (err) {
      console.error('deleteModel failed', err);
      setModels(prev);
      toast.error('Failed to delete model');
    }
  };

  const getModelIcon = (modelId) => {
    switch (modelId) {
      case 'heart':
        return '❤️';
      case 'solar-system':
        return '🌌';
      default:
        return '🧬';
    }
  };

  if (loading) {
    return (
      <DashboardContainer>
        <LoadingMessage>Loading your dashboard...</LoadingMessage>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <WelcomeSection
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <WelcomeTitle>
          Welcome back, {userProfile?.profile?.name || user.displayName}! 👋
        </WelcomeTitle>
        <WelcomeText>
          Ready to explore the world of 3D learning through gestures?
        </WelcomeText>
      </WelcomeSection>

      <StatsGrid>
        <StatCard
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <StatIcon><FaPlay /></StatIcon>
          <StatValue>{stats.sessionsCompleted || 0}</StatValue>
          <StatLabel>Sessions Completed</StatLabel>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <StatIcon><FaClock /></StatIcon>
          <StatValue>{Math.round((stats.totalTimeSpent || 0) / 60)}</StatValue>
          <StatLabel>Minutes Learned</StatLabel>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <StatIcon><FaEye /></StatIcon>
          <StatValue>{stats.modelsViewed || 0}</StatValue>
          <StatLabel>Models Explored</StatLabel>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <StatIcon><FaAward /></StatIcon>
          <StatValue>{stats.achievementsUnlocked || 0}</StatValue>
          <StatLabel>Achievements</StatLabel>
        </StatCard>
      </StatsGrid>

      <ModelsSection>
        <SectionTitle>
          🚀 Available 3D Models
        </SectionTitle>
        
        <ModelsGrid>
          {models.map((model, index) => (
            <ModelCard
              key={model.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
            >
              <ModelImage>
                {getModelIcon(model.id)}
              </ModelImage>
              <ModelContent>
                <ModelTitle>{model.name}</ModelTitle>
                <ModelDescription>{model.description}</ModelDescription>
                <ModelFooter>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <PlayButton to={`/model/${model.id}`}>
                      <FaPlay /> Explore
                    </PlayButton>
                    {userProfile?.role === 'teacher' && (
                      <DeleteButton onClick={() => handleDeleteModel(model.id)}>Delete</DeleteButton>
                    )}
                  </div>
                  <ModelMeta>
                    <div>⏱️ {model.estimatedTime || '10'} min</div>
                    <div>📚 {model.subject || 'Science'}</div>
                  </ModelMeta>
                </ModelFooter>
              </ModelContent>
            </ModelCard>
          ))}
        </ModelsGrid>
      </ModelsSection>

      {userProfile?.role === 'teacher' && (
        <ModelsSection>
          <SectionTitle>🔴 Saved Live Rooms</SectionTitle>
          {liveRooms.length === 0 ? (
            <div style={{ padding: 12 }}>No saved rooms. Create one from the Live page.</div>
          ) : (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {liveRooms.map(r => (
                <div key={r.id} style={{ background: 'white', padding: 12, borderRadius: 8, minWidth: 220 }}>
                  <div style={{ fontWeight: 'bold' }}>{r.room}</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <a href={`/jitsi?room=${encodeURIComponent(r.room)}`} target="_blank" rel="noreferrer">Join</a>
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/jitsi?room=${encodeURIComponent(r.room)}`); toast.success('Copied'); }}>Copy</button>
                    <button onClick={async () => {
                      if (!confirm('Delete this saved room?')) return;
                      try {
                        await deleteLiveRoom(r.id);
                        setLiveRooms(prev => prev.filter(x => x.id !== r.id));
                        toast.success('Deleted');
                      } catch (e) {
                        toast.error('Delete failed');
                      }
                    }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ModelsSection>
      )}
    </DashboardContainer>
  );
};

export default Dashboard;
