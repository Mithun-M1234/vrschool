import React from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaSignOutAlt, FaUser, FaChalkboardTeacher, FaHandPaper } from 'react-icons/fa';

const HeaderContainer = styled.header`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: bold;
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Avatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #667eea;
`;

const RoleBadge = styled.span`
  background: linear-gradient(45deg, #4285f4, #34a853);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const NavLink = styled(Link)`
  color: #333;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 8px;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background-color: rgba(102, 126, 234, 0.1);
  }
`;

const SignOutButton = styled.button`
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid #ef4444;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: #ef4444;
    color: white;
  }
`;

const Header = () => {
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();

  // Create a simple default avatar using initials
  const getDefaultAvatar = (name, email) => {
    const initials = name 
      ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : email ? email[0].toUpperCase() : 'U';
    
    // Create a simple SVG avatar with initials
    const svg = `
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#667eea"/>
        <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">${initials}</text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <HeaderContainer>
      <Logo to="/">
        🤖 Gesture 3D Learning
      </Logo>
      
      <UserInfo>
        <NavLinks>
          <NavLink to="/">
            <FaUser /> Dashboard
          </NavLink>
          <NavLink to="/demo/hand-tracking">
            <FaHandPaper /> Hand Demo
          </NavLink>
          {userProfile?.role === 'teacher' && (
            <NavLink to="/teacher">
              <FaChalkboardTeacher /> Teacher Portal
            </NavLink>
          )}
        </NavLinks>
        
        <UserProfile>
          <Avatar 
            src={userProfile?.profile?.photoURL || getDefaultAvatar(
              userProfile?.profile?.name || user?.displayName,
              user?.email
            )} 
            alt="Avatar"
            onError={(e) => {
              e.target.src = getDefaultAvatar(
                userProfile?.profile?.name || user?.displayName,
                user?.email
              );
            }}
          />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
              {userProfile?.profile?.name || user.displayName}
            </div>
            <RoleBadge>{userProfile?.role || 'student'}</RoleBadge>
          </div>
        </UserProfile>
        
        <SignOutButton onClick={handleSignOut}>
          <FaSignOutAlt /> Sign Out
        </SignOutButton>
      </UserInfo>
    </HeaderContainer>
  );
};

export default Header;
