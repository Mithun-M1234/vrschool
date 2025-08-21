import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { getSampleModels, shouldUseSampleModels } from './sampleModels';

// User Management
export const createOrUpdateUser = async (firebaseUser, selectedRole = 'student') => {
  try {
    const userRef = doc(db, 'users', firebaseUser.uid);
    
    let userDoc;
    try {
      userDoc = await getDoc(userRef);
    } catch (error) {
      console.warn('Firestore access error, using default user data:', error);
      // If Firestore isn't available, return basic user data
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: selectedRole,
        profile: {
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          photoURL: firebaseUser.photoURL
        }
      };
    }
    
    const userData = {
      email: firebaseUser.email,
      profile: {
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        photoURL: firebaseUser.photoURL
      },
      lastLogin: serverTimestamp()
    };

    if (!userDoc.exists()) {
      // New user - use selected role or default to student
      userData.role = selectedRole;
      userData.createdAt = serverTimestamp();
    }

    await setDoc(userRef, userData, { merge: true });
    return { uid: firebaseUser.uid, ...userData };
  } catch (error) {
    console.error('Firestore error in createOrUpdateUser:', error);
    // Return basic user data if Firestore fails
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      role: selectedRole,
      profile: {
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        photoURL: firebaseUser.photoURL
      }
    };
  }
};

export const getUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    await updateDoc(doc(db, 'users', userId), { role });
  } catch (error) {
    console.error('Update user role error:', error);
    throw error;
  }
};

// Model Management
export const uploadModel = async (modelFile, configFile, metadata, teacherId) => {
  try {
    console.log('Starting model upload:', { modelFile, metadata, teacherId });
    
    const modelId = doc(collection(db, 'models')).id;
    console.log('Generated model ID:', modelId);
    
    // Upload model file to Storage
    console.log('Uploading model file...');
    const modelRef = ref(storage, `models/${modelId}/model.glb`);
    const modelUpload = await uploadBytes(modelRef, modelFile);
    const modelURL = await getDownloadURL(modelUpload.ref);
    console.log('Model file uploaded:', modelURL);
    
    // Upload config file to Storage
    console.log('Uploading config file...');
    const configRef = ref(storage, `models/${modelId}/config.json`);
    const configUpload = await uploadBytes(configRef, configFile);
    const configURL = await getDownloadURL(configUpload.ref);
    console.log('Config file uploaded:', configURL);
    
    // Save model metadata to Firestore
    const modelData = {
      name: metadata.name,
      description: metadata.description,
      fileName: modelURL,
      configFileName: configURL,
      uploadedBy: teacherId,
      createdAt: serverTimestamp(),
      isActive: true,
      metadata: {
        subject: metadata.subject,
        grade: metadata.grade,
        topic: metadata.topic,
        tags: metadata.tags || []
      }
    };

    console.log('Saving model metadata to Firestore...');
    await setDoc(doc(db, 'models', modelId), modelData);
    console.log('Model successfully uploaded and saved');
    
    return { modelId, ...modelData };
  } catch (error) {
    console.error('Upload model error:', error);
    
    // Provide more specific error messages
    if (error.code === 'storage/unauthorized') {
      throw new Error('You do not have permission to upload files. Please check your authentication status.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('File upload was canceled.');
    } else if (error.code === 'storage/unknown') {
      throw new Error('An unknown error occurred during file upload. Please try again.');
    } else if (error.message.includes('CORS')) {
      throw new Error('File upload blocked by security policy. Please try again or contact support.');
    }
    
    throw error;
  }
};

export const getModels = async (teacherId = null) => {
  try {
    // If using localhost and Firebase Storage is not set up, use sample models
    if (shouldUseSampleModels()) {
      console.log('Using sample models for development');
      let models = getSampleModels();
      
      // Filter by teacher if specified
      if (teacherId) {
        models = models.filter(model => model.uploadedBy === teacherId);
      }
      
      return models;
    }

    let q = query(collection(db, 'models'), where('isActive', '==', true));
    
    if (teacherId) {
      q = query(q, where('uploadedBy', '==', teacherId));
    }
    
    q = query(q, orderBy('createdAt', 'desc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Get models error:', error);
    
    // Fallback to sample models if Firestore fails
    if (shouldUseSampleModels()) {
      console.log('Firestore failed, falling back to sample models');
      return getSampleModels();
    }
    
    throw error;
  }
};

export const getModel = async (modelId) => {
  try {
    const modelDoc = await getDoc(doc(db, 'models', modelId));
    return modelDoc.exists() ? { id: modelDoc.id, ...modelDoc.data() } : null;
  } catch (error) {
    console.error('Get model error:', error);
    throw error;
  }
};

// Assignment Management
export const createAssignment = async (modelId, teacherId, studentEmails, instructions, dueDate) => {
  try {
    // Get student IDs from emails
    const studentIds = await getStudentIdsByEmails(studentEmails);
    
    const assignmentData = {
      modelId,
      teacherId,
      studentIds,
      assignedAt: serverTimestamp(),
      dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : null,
      instructions,
      status: 'active'
    };

    const assignmentRef = await addDoc(collection(db, 'assignments'), assignmentData);
    
    return { id: assignmentRef.id, ...assignmentData };
  } catch (error) {
    console.error('Create assignment error:', error);
    throw error;
  }
};

export const getStudentIdsByEmails = async (emails) => {
  try {
    const promises = emails.map(email => 
      getDocs(query(
        collection(db, 'users'),
        where('email', '==', email),
        where('role', '==', 'student')
      ))
    );
    
    const snapshots = await Promise.all(promises);
    const studentIds = [];
    
    snapshots.forEach(snapshot => {
      snapshot.docs.forEach(doc => studentIds.push(doc.id));
    });
    
    return studentIds;
  } catch (error) {
    console.error('Get student IDs error:', error);
    throw error;
  }
};

export const getStudentAssignments = async (studentId) => {
  try {
    const q = query(
      collection(db, 'assignments'),
      where('studentIds', 'array-contains', studentId),
      where('status', '==', 'active'),
      orderBy('assignedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    const assignments = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const assignment = { id: doc.id, ...doc.data() };
        assignment.model = await getModel(assignment.modelId);
        return assignment;
      })
    );
    
    return assignments;
  } catch (error) {
    console.error('Get student assignments error:', error);
    throw error;
  }
};

export const getTeacherAssignments = async (teacherId) => {
  try {
    const q = query(
      collection(db, 'assignments'),
      where('teacherId', '==', teacherId),
      orderBy('assignedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Get teacher assignments error:', error);
    throw error;
  }
};

// Analytics & Interactions
export const logInteraction = async (userId, modelId, assignmentId, sessionData) => {
  try {
    const interactionData = {
      userId,
      modelId,
      assignmentId,
      sessionStart: Timestamp.fromDate(sessionData.sessionStart),
      sessionEnd: Timestamp.fromDate(sessionData.sessionEnd),
      gesturesUsed: sessionData.gesturesUsed || [],
      totalGestures: sessionData.totalGestures || 0,
      sessionDuration: sessionData.sessionDuration || 0,
      completionPercentage: sessionData.completionPercentage || 0,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'interactions'), interactionData);
    
    return interactionData;
  } catch (error) {
    console.error('Log interaction error:', error);
    throw error;
  }
};

export const getAnalytics = async (teacherId, timeRange = '7d') => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
    }

    // Get teacher's assignments
    const assignmentsSnapshot = await getDocs(query(
      collection(db, 'assignments'),
      where('teacherId', '==', teacherId)
    ));
    
    const assignmentIds = assignmentsSnapshot.docs.map(doc => doc.id);
    
    if (assignmentIds.length === 0) {
      return { totalSessions: 0, avgEngagement: 0, topGestures: [] };
    }

    // Get interactions for those assignments (limited by Firestore 'in' constraint)
    const interactionsSnapshot = await getDocs(query(
      collection(db, 'interactions'),
      where('assignmentId', 'in', assignmentIds.slice(0, 10)), // Firestore limit
      where('sessionStart', '>=', Timestamp.fromDate(startDate))
    ));
    
    const interactions = interactionsSnapshot.docs.map(doc => doc.data());
    
    // Calculate analytics
    const totalSessions = interactions.length;
    const avgEngagement = totalSessions > 0 
      ? interactions.reduce((sum, session) => sum + session.completionPercentage, 0) / totalSessions
      : 0;
    
    // Count gesture usage
    const gestureCount = {};
    interactions.forEach(session => {
      session.gesturesUsed.forEach(gesture => {
        gestureCount[gesture.gesture] = (gestureCount[gesture.gesture] || 0) + 1;
      });
    });
    
    const topGestures = Object.entries(gestureCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([gesture, count]) => ({ gesture, count }));
    
    return {
      totalSessions,
      avgEngagement: Math.round(avgEngagement),
      topGestures,
      totalStudents: new Set(interactions.map(i => i.userId)).size,
      avgSessionDuration: totalSessions > 0 
        ? Math.round(interactions.reduce((sum, s) => sum + s.sessionDuration, 0) / totalSessions / 1000)
        : 0
    };
  } catch (error) {
    console.error('Get analytics error:', error);
    throw error;
  }
};
