# 🚀 Gesture-Controlled 3D Learning Platform

**Iron Man Level Hackathon MVP** - A complete teacher-student 3D learning system with real-time gesture control, Firebase integration, and educational workflow management.

## 🎯 Overview

This platform enables teachers to upload 3D models (created in Blender), configure gesture interactions, and assign them to students. Students can then interact with 3D models using **real-time hand gestures** detected via their webcam using MediaPipe.

## ✨ Key Features

### 🖐️ **Gesture Control**
- **Pinch** → Zoom in/out
- **Open Palm** → Reset view
- **Swipe** → Rotate model
- **Point** → Highlight parts
- **Fist** → Pause animations

### 👩‍🏫 **Teacher Workflow**
- Upload 3D models (.glb/.gltf)
- Assign models to students
- Track engagement analytics

### 👨‍🎓 **Student Experience**
- Google authentication
- View assigned models
- Real-time gesture interaction
- Educational hotspots and information

### 🔥 **Technical Stack**
- **Frontend**: Three.js, MediaPipe Hands, Vanilla JS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **3D Models**: Blender exports (.glb/.gltf)
- **Gestures**: MediaPipe hand tracking
- **Analytics**: Real-time interaction logging

## 🏗️ Project Structure

```
📁 3d-simulator/
├── 📁 frontend/
│   ├── index.html          # Main student interface
│   ├── app.js              # Core application logic
│   └── style.css           # Modern responsive styling
├── 📁 configs/
│   ├── HeartModel_gestureConfig.json    # Sample heart model config
│   └── SolarSystem_gestureConfig.json   # Sample solar system config
├── 📁 firebase/
│   ├── firebaseConfig.js   # Firebase configuration
│   └── dbStructure.js      # Firestore operations & structure
├── 📁 utils/
│   └── gestureMapper.js    # Gesture detection & mapping logic
├── teacher-portal.html     # Teacher interface for uploads/assignments
├── DEMO_SCRIPT.md         # Complete hackathon demo script
├── TEACHER_PORTAL.md      # Teacher workflow documentation
└── package.json           # Project dependencies
```

## 🚀 Quick Start

### 1. **Clone & Install**
```bash
git clone <your-repo>
cd 3d-simulator
npm install
```

### 2. **Configure Firebase** (Optional for demo)
- Create Firebase project at https://console.firebase.google.com
- Enable Authentication (Google), Firestore, Storage
- Replace config in `firebase/firebaseConfig.js`

### 3. **Run Development Server**
```bash
npm start
```
- Student Interface: http://localhost:3000
- Teacher Portal: http://localhost:3000/teacher-portal.html

### 4. **Demo Mode** (No Firebase needed)
- The app works with demo data if Firebase isn't configured
- Perfect for hackathon presentations!

## 🎮 How to Use

### **For Students:**
1. Open http://localhost:3000
2. Click "Login with Google" (or use demo mode)
3. Select an assigned 3D model
4. **Allow camera access** when prompted
5. Use hand gestures to interact:
   - 🤏 **Pinch** fingers to zoom in
   - 👋 **Open palm** to reset view
   - ↔️ **Swipe left/right** to rotate

### **For Teachers:**
1. Open http://localhost:3000/teacher-portal.html
2. Upload 3D models (.glb/.gltf files)
3. Configure subjects, grades, descriptions
4. Assign models to student emails
5. View analytics and engagement metrics

## 🔧 Firebase Database Structure

```javascript
// Firestore Collections:
users: {
  userId: {
    email, role: "teacher|student", 
    profile: { name, photoURL }, createdAt
  }
}

models: {
  modelId: {
    name, description, fileName, configFileName,
    uploadedBy, metadata: { subject, grade, tags }
  }
}

assignments: {
  assignmentId: {
    modelId, teacherId, studentIds[], 
    assignedAt, dueDate, instructions
  }
}

interactions: {
  interactionId: {
    userId, modelId, sessionStart, sessionEnd,
    gesturesUsed[], totalGestures, sessionDuration
  }
}
```

## 🎬 Hackathon Demo Tips

### **Setup:**
- Test camera/lighting conditions beforehand
- Have backup mouse controls ready
- Pre-load models to avoid network delays

### **Demo Flow:**
1. **Hook**: "Students can grab a 3D heart with their hands!"
2. **Teacher Portal**: Upload model, assign to student
3. **Student Experience**: Live gesture demo on stage
4. **Analytics**: Show engagement metrics
5. **Business Impact**: Educational market opportunity

### **Key Talking Points:**
- ✅ No expensive VR headsets required
- ✅ Works on any device with camera
- ✅ Real educational workflow
- ✅ Scales to any subject (biology, physics, chemistry)

## 🏆 Winning Features

### **Innovation:**
- Real-time hand gesture recognition
- Educational 3D interaction
- Complete teacher-student workflow

### **Technical Excellence:**
- Modern web technologies
- Real-time Firebase integration
- Responsive cross-device design
- Robust gesture detection

### **Market Viability:**
- $8.5B educational technology market
- Accessibility (no special hardware)
- Immediate classroom applicability

## 📱 Supported Gestures

| Gesture | Action | Use Case |
|---------|--------|----------|
| 🤏 Pinch | Zoom In | Focus on details |
| 🫳 Pinch Out | Zoom Out | See full model |
| 👋 Open Palm | Reset View | Return to start |
| ↔️ Swipe Left/Right | Rotate | See all angles |
| ↕️ Swipe Up/Down | Tilt | Different perspectives |
| 👆 Point Up | Highlight Part | Educational focus |
| ✊ Fist | Pause/Play | Control animations |

## 🚨 Demo Day Checklist

- [ ] Test gesture recognition in demo lighting
- [ ] Prepare compelling 3D models
- [ ] Practice smooth demo transitions
- [ ] Have backup plans ready
- [ ] Emphasize educational impact
- [ ] Show real-time gesture interaction
- [ ] Highlight scalability potential

## 🔮 Future Enhancements

- AI-powered gesture mapping generation
- Voice commands + gesture combinations
- Multi-student collaborative sessions
- Full WebXR/VR integration
- Mobile app versions
- Advanced analytics dashboard

---

**Ready to revolutionize education with gesture-controlled 3D learning!** 🎓🤖

*Built for hackathons, designed for classrooms, optimized for impact.* ⚡
