import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { Link } from 'react-router-dom';
import { FaHeart, FaSolarPanel, FaPlay, FaEye, FaClock, FaAward } from 'react-icons/fa';

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

    if (user) {
      loadDashboardData();
    }
  }, [user]);

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
                  <PlayButton to={`/model/${model.id}`}>
                    <FaPlay /> Explore
                  </PlayButton>
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
    </DashboardContainer>
  );
};

export default Dashboard;
