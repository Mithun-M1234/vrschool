import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaRocket, FaEye, FaEyeSlash, FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import toast from 'react-hot-toast';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
`;

const LoginCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 450px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: bold;
`;

const Subtitle = styled.p`
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  line-height: 1.6;
`;

const RoleSelector = styled.div`
  margin-bottom: 2rem;
`;

const RoleTitle = styled.h3`
  margin-bottom: 1rem;
  color: #333;
  font-size: 1.1rem;
`;

const RoleOptions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const RoleOption = styled(motion.button)`
  flex: 1;
  padding: 1rem;
  border: 2px solid ${props => props.selected ? '#667eea' : '#ddd'};
  background: ${props => props.selected ? 'rgba(102, 126, 234, 0.1)' : 'white'};
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  color: ${props => props.selected ? '#667eea' : '#666'};
  transition: all 0.3s ease;

  &:hover {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.05);
  }
`;

const Features = styled.div`
  text-align: left;
  margin-top: 2rem;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: #666;
  font-size: 0.9rem;
`;

const AuthToggle = styled.div`
  margin: 1.5rem 0;
  text-align: center;
`;

const ToggleText = styled.span`
  color: #666;
  margin: 0 1rem;
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-weight: 600;
  text-decoration: underline;
  
  &:hover {
    color: #5a67d8;
  }
`;

const EmailForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const InputGroup = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 3rem 1rem 3rem;
  border: 2px solid #ddd;
  border-radius: 12px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
  
  &::placeholder {
    color: #999;
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 0;
  
  &:hover {
    color: #667eea;
  }
`;

const SubmitButton = styled(motion.button)`
  width: 100%;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

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

const LoginPage = () => {
  const { signInWithEmail, signUpWithEmail, user } = useAuth();
  const [selectedRole, setSelectedRole] = useState('student');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        await signUpWithEmail(formData.email, formData.password, formData.displayName, selectedRole);
      } else {
        await signInWithEmail(formData.email, formData.password);
      }
      
      // Navigate after successful login
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error) {
      // Error handling is done in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <LoginContainer>
      <LoginCard
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <FaRocket size={50} style={{ color: '#667eea', marginBottom: '1rem' }} />
        <Title>Gesture 3D Learning</Title>
        <Subtitle>
          Experience the future of education with gesture-controlled 3D models. 
          Learn by interacting with virtual objects using just your hands!
        </Subtitle>

        <RoleSelector>
          <RoleTitle>I am a:</RoleTitle>
          <RoleOptions>
            <RoleOption
              selected={selectedRole === 'student'}
              onClick={() => setSelectedRole('student')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              👨‍🎓 Student
            </RoleOption>
            <RoleOption
              selected={selectedRole === 'teacher'}
              onClick={() => setSelectedRole('teacher')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              👨‍🏫 Teacher
            </RoleOption>
          </RoleOptions>
        </RoleSelector>

        <EmailForm onSubmit={handleEmailAuth}>
          {isSignUp && (
            <InputGroup>
              <InputIcon>
                <FaUser />
              </InputIcon>
              <Input
                type="text"
                name="displayName"
                placeholder="Full Name"
                value={formData.displayName}
                onChange={handleInputChange}
                required
              />
            </InputGroup>
          )}
          
          <InputGroup>
            <InputIcon>
              <FaEnvelope />
            </InputIcon>
            <Input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </InputGroup>
          
          <InputGroup>
            <InputIcon>
              <FaLock />
            </InputIcon>
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            <PasswordToggle
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </PasswordToggle>
          </InputGroup>
          
          <SubmitButton
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </SubmitButton>
        </EmailForm>

        <AuthToggle>
          <ToggleText>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </ToggleText>
          <ToggleButton onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </ToggleButton>
        </AuthToggle>

        <Features>
          <FeatureItem>
            🖐️ Hand gesture recognition with MediaPipe
          </FeatureItem>
          <FeatureItem>
            🌟 Interactive 3D models with Three.js
          </FeatureItem>
          <FeatureItem>
            📚 Educational content for various subjects
          </FeatureItem>
          <FeatureItem>
            📊 Progress tracking and analytics
          </FeatureItem>
        </Features>
      </LoginCard>
    </LoginContainer>
  );
};

export default LoginPage;
