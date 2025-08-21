// Firebase Firestore database operations
import { auth, db, storage } from './firebaseConfig.js';

// Database Collections Structure:
/*
FIRESTORE COLLECTIONS:

1. users/
   - userId (auth.uid)
   - email
   - role: "teacher" | "student" 
   - profile: { name, school, grade, photoURL }
   - createdAt
   - lastLogin

2. models/
   - modelId (auto-generated)
   - name
   - description
   - fileName (in Storage)
   - configFileName (in Storage)
   - uploadedBy (teacher userId)
   - createdAt
   - isActive: boolean
   - metadata: { subject, grade, topic, tags[] }
   - thumbnailURL

3. assignments/
   - assignmentId (auto-generated)
   - modelId
   - teacherId
   - studentIds: [userId1, userId2, ...]
   - assignedAt
   - dueDate
   - instructions
   - status: "active" | "completed" | "archived"

4. interactions/ (analytics)
   - interactionId (auto-generated)
   - userId
   - modelId
   - assignmentId
   - sessionStart
   - sessionEnd
   - gesturesUsed: [{gesture, timestamp, action}]
   - totalGestures: number
   - sessionDuration: number
   - completionPercentage: number

5. schools/
   - schoolId
   - name
   - teachers: [userId1, userId2]
   - students: [userId1, userId2]
   - settings: {}
*/

class FirebaseService {
  
  // Authentication
  async signInWithGoogle() {
    try {
      const result = await auth.signInWithPopup(googleProvider);
      const user = result.user;
      
      // Create or update user profile
      await this.createOrUpdateUser(user);
      
      return user;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // User Management
  async createOrUpdateUser(firebaseUser) {
    const userRef = db.collection('users').doc(firebaseUser.uid);
    const userDoc = await userRef.get();
    
    const userData = {
      email: firebaseUser.email,
      profile: {
        name: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL
      },
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (!userDoc.exists) {
      // New user - set default role as student
      userData.role = 'student';
      userData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    }

    await userRef.set(userData, { merge: true });
    return userData;
  }

  async getUserProfile(userId) {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      return userDoc.exists ? userDoc.data() : null;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  async updateUserRole(userId, role) {
    try {
      await db.collection('users').doc(userId).update({ role });
    } catch (error) {
      console.error('Update user role error:', error);
      throw error;
    }
  }

  // Model Management
  async uploadModel(modelFile, configFile, metadata, teacherId) {
    try {
      const modelId = db.collection('models').doc().id;
      
      // Upload model file to Storage
      const modelRef = storage.ref(`models/${modelId}/model.glb`);
      const modelUpload = await modelRef.put(modelFile);
      const modelURL = await modelUpload.ref.getDownloadURL();
      
      // Upload config file to Storage
      const configRef = storage.ref(`models/${modelId}/config.json`);
      const configUpload = await configRef.put(configFile);
      const configURL = await configUpload.ref.getDownloadURL();
      
      // Save model metadata to Firestore
      const modelData = {
        name: metadata.name,
        description: metadata.description,
        fileName: modelURL,
        configFileName: configURL,
        uploadedBy: teacherId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        isActive: true,
        metadata: {
          subject: metadata.subject,
          grade: metadata.grade,
          topic: metadata.topic,
          tags: metadata.tags || []
        }
      };

      await db.collection('models').doc(modelId).set(modelData);
      
      return { modelId, ...modelData };
    } catch (error) {
      console.error('Upload model error:', error);
      throw error;
    }
  }

  async getModels(teacherId = null) {
    try {
      let query = db.collection('models').where('isActive', '==', true);
      
      if (teacherId) {
        query = query.where('uploadedBy', '==', teacherId);
      }
      
      const snapshot = await query.orderBy('createdAt', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Get models error:', error);
      throw error;
    }
  }

  async getModel(modelId) {
    try {
      const modelDoc = await db.collection('models').doc(modelId).get();
      return modelDoc.exists ? { id: modelDoc.id, ...modelDoc.data() } : null;
    } catch (error) {
      console.error('Get model error:', error);
      throw error;
    }
  }

  // Assignment Management
  async createAssignment(modelId, teacherId, studentEmails, instructions, dueDate) {
    try {
      // Get student IDs from emails
      const studentIds = await this.getStudentIdsByEmails(studentEmails);
      
      const assignmentData = {
        modelId,
        teacherId,
        studentIds,
        assignedAt: firebase.firestore.FieldValue.serverTimestamp(),
        dueDate: firebase.firestore.Timestamp.fromDate(new Date(dueDate)),
        instructions,
        status: 'active'
      };

      const assignmentRef = await db.collection('assignments').add(assignmentData);
      
      return { id: assignmentRef.id, ...assignmentData };
    } catch (error) {
      console.error('Create assignment error:', error);
      throw error;
    }
  }

  async getStudentIdsByEmails(emails) {
    try {
      const promises = emails.map(email => 
        db.collection('users')
          .where('email', '==', email)
          .where('role', '==', 'student')
          .get()
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
  }

  async getStudentAssignments(studentId) {
    try {
      const snapshot = await db.collection('assignments')
        .where('studentIds', 'array-contains', studentId)
        .where('status', '==', 'active')
        .orderBy('assignedAt', 'desc')
        .get();
      
      const assignments = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const assignment = { id: doc.id, ...doc.data() };
          assignment.model = await this.getModel(assignment.modelId);
          return assignment;
        })
      );
      
      return assignments;
    } catch (error) {
      console.error('Get student assignments error:', error);
      throw error;
    }
  }

  async getTeacherAssignments(teacherId) {
    try {
      const snapshot = await db.collection('assignments')
        .where('teacherId', '==', teacherId)
        .orderBy('assignedAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Get teacher assignments error:', error);
      throw error;
    }
  }

  // Analytics & Interactions
  async logInteraction(userId, modelId, assignmentId, sessionData) {
    try {
      const interactionData = {
        userId,
        modelId,
        assignmentId,
        sessionStart: firebase.firestore.Timestamp.fromDate(sessionData.sessionStart),
        sessionEnd: firebase.firestore.Timestamp.fromDate(sessionData.sessionEnd),
        gesturesUsed: sessionData.gesturesUsed || [],
        totalGestures: sessionData.totalGestures || 0,
        sessionDuration: sessionData.sessionDuration || 0,
        completionPercentage: sessionData.completionPercentage || 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('interactions').add(interactionData);
      
      return interactionData;
    } catch (error) {
      console.error('Log interaction error:', error);
      throw error;
    }
  }

  async getAnalytics(teacherId, timeRange = '7d') {
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
      const assignmentsSnapshot = await db.collection('assignments')
        .where('teacherId', '==', teacherId)
        .get();
      
      const assignmentIds = assignmentsSnapshot.docs.map(doc => doc.id);
      
      if (assignmentIds.length === 0) {
        return { totalSessions: 0, avgEngagement: 0, topGestures: [] };
      }

      // Get interactions for those assignments
      const interactionsSnapshot = await db.collection('interactions')
        .where('assignmentId', 'in', assignmentIds.slice(0, 10)) // Firestore limit
        .where('sessionStart', '>=', firebase.firestore.Timestamp.fromDate(startDate))
        .get();
      
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
  }

  // Real-time listeners
  onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
  }

  listenToUserAssignments(userId, callback) {
    return db.collection('assignments')
      .where('studentIds', 'array-contains', userId)
      .where('status', '==', 'active')
      .onSnapshot(snapshot => {
        const assignments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(assignments);
      });
  }
}

// Export singleton instance
const firebaseService = new FirebaseService();
export default firebaseService;
