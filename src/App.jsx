import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThreeProvider } from './contexts/ThreeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ModelViewer from './pages/ModelViewer';
import TeacherPortal from './pages/TeacherPortal';
import HandTrackingDemo from './pages/HandTrackingDemo';
import './index.css';

function App() {
  // Initialize models on app startup
  // (Removed model seeding - models now procedural or loaded directly)
  useEffect(() => {}, []);

  return (
    <AuthProvider>
      <ThreeProvider>
        <Router>
          <div className="App">
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  style: {
                    background: '#10b981',
                  },
                },
                error: {
                  duration: 5000,
                  style: {
                    background: '#ef4444',
                  },
                },
              }}
            />
            
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <>
                    <Header />
                    <Dashboard />
                  </>
                </ProtectedRoute>
              } />
              
              <Route path="/model/:modelId" element={
                <ProtectedRoute>
                  <ModelViewer />
                </ProtectedRoute>
              } />
              
              <Route path="/teacher" element={
                <ProtectedRoute requiredRole="teacher">
                  <>
                    <Header />
                    <TeacherPortal />
                  </>
                </ProtectedRoute>
              } />
              
              <Route path="/demo/hand-tracking" element={
                <ProtectedRoute>
                  <HandTrackingDemo />
                </ProtectedRoute>
              } />
              
              {/* Fallback route */}
              <Route path="*" element={
                <ProtectedRoute>
                  <>
                    <Header />
                    <Dashboard />
                  </>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </ThreeProvider>
    </AuthProvider>
  );
}

export default App;
