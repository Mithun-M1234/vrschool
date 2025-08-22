import { 
  createAssignment, 
  createOrUpdateUser, 
  getAnalytics, 
  getModel, 
  getModels, 
  getStudentAssignments, 
  getStudentIdsByEmails, 
  getTeacherAssignments, 
  getUserProfile, 
  logInteraction, 
  updateUserRole, 
  uploadModel 
} from '../services/firestore';

// Custom hook to provide Firestore operations
export const useFirestore = () => {
  // User operations
  const getUserStats = async (userId) => {
    try {
      const profile = await getUserProfile(userId);
      return {
        sessionsCompleted: profile?.stats?.sessionsCompleted || 0,
        totalTimeSpent: profile?.stats?.totalTimeSpent || 0,
        modelsViewed: profile?.stats?.modelsViewed || 0,
        achievementsUnlocked: profile?.stats?.achievementsUnlocked || 0
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {};
    }
  };

  const logModelView = async (userId, modelId) => {
    try {
      // Temporarily disable to prevent errors - TODO: fix data format
      console.log('Model view logged (disabled):', { userId, modelId });
      return;
      
      await logInteraction(userId, {
        type: 'model_view',
        modelId,
        sessionStart: new Date(),
        sessionEnd: new Date(),
        sessionDuration: 0,
        completionPercentage: 0,
        gesturesUsed: [],
        totalGestures: 0,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error logging model view:', error);
    }
  };

  const recordSession = async (userId, sessionData) => {
    try {
      // Temporarily disable to prevent errors - TODO: fix data format
      console.log('Session recorded (disabled):', { userId, sessionData });
      return;
      
      // Ensure sessionData has the correct format
      const formattedSessionData = {
        type: 'session_complete',
        modelId: sessionData.modelId || 'unknown',
        sessionStart: sessionData.sessionStart || new Date(sessionData.timestamp - (sessionData.duration || 0)),
        sessionEnd: sessionData.sessionEnd || sessionData.timestamp || new Date(),
        sessionDuration: sessionData.duration || 0,
        completionPercentage: sessionData.completed ? 100 : 0,
        gesturesUsed: sessionData.gesturesUsed || [],
        totalGestures: sessionData.totalGestures || 0,
        timestamp: sessionData.timestamp || new Date()
      };
      
      await logInteraction(userId, formattedSessionData);
    } catch (error) {
      console.error('Error recording session:', error);
    }
  };

  const getModelAnalytics = async (modelId) => {
    try {
      const analytics = await getAnalytics(modelId);
      return {
        totalViews: analytics?.totalViews || 0,
        uniqueUsers: analytics?.uniqueUsers || 0,
        avgDuration: analytics?.avgDuration || 0
      };
    } catch (error) {
      console.warn('Error getting model analytics (permissions issue):', error.message);
      // Return default analytics if permissions are insufficient
      return {
        totalViews: 0,
        uniqueUsers: 0,
        avgDuration: 0
      };
    }
  };

  const deleteModel = async (modelId) => {
    try {
      // For now, just log the deletion request
      // In a real implementation, you'd delete from Firebase Storage and Firestore
      console.log('Delete model request for:', modelId);
      throw new Error('Model deletion not implemented yet');
    } catch (error) {
      console.error('Error deleting model:', error);
      throw error;
    }
  };

  return {
    // User operations
    getUserStats,
    logModelView,
    recordSession,
    
    // Model operations
    getModels,
    getModel,
    uploadModel,
    deleteModel,
    getModelAnalytics,
    
    // Assignment operations
    createAssignment,
    getStudentAssignments,
    getTeacherAssignments,
    getStudentIdsByEmails,
    
    // Direct exports
    createOrUpdateUser,
    getUserProfile,
    logInteraction,
    updateUserRole,
    getAnalytics
  };
};
