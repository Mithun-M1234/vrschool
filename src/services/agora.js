// Agora Web SDK integration using App ID only mode (for testing/development)
// NOTE: You must install Agora Web SDK: npm install agora-rtc-sdk-ng
// IMPORTANT: Make sure your Agora project is set to "App ID Only" authentication mode
// WARNING: For production, switch to token-based authentication for security!

import AgoraRTC from 'agora-rtc-sdk-ng';

// App ID from your Agora.io dashboard - must be in "App ID Only" mode
// Use a safe runtime lookup so the bundle doesn't reference Node's `process` in browsers.
const AGORA_APP_ID = (() => {
  if (typeof window !== 'undefined' && window.__AGORA_APP_ID) return window.__AGORA_APP_ID;
  if (typeof process !== 'undefined' && process && process.env && process.env.AGORA_APP_ID) return process.env.AGORA_APP_ID;
  // Final fallback (development/testing only)
  return '7509945944ba4aa58e0f58b893d5fc01';
})();

export const createAgoraClient = () => {
  if (!AGORA_APP_ID || AGORA_APP_ID === 'YOUR_AGORA_APP_ID') {
    throw new Error('Agora App ID missing. Please configure AGORA_APP_ID.');
  }
  const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  return client;
};

export const joinChannelAsTeacher = async ({ channel, uid = null, onTrack }) => {
  try {
    console.log(`Joining Agora channel as teacher: ${channel}`);
    const client = createAgoraClient();
    // Using App ID only mode - pass null for token
    await client.join(AGORA_APP_ID, channel, null, uid || null);
    console.log('Teacher joined channel successfully');
    
    console.log('Creating audio/video tracks...');
    const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    const localVideoTrack = await AgoraRTC.createCameraVideoTrack({
      encoderConfig: {
        width: 640,
        height: 360,
        frameRate: 15,
        bitrateMax: 700
      }
    });
    
    console.log('Publishing tracks to channel...');
    await client.publish([localAudioTrack, localVideoTrack]);
    console.log('Tracks published successfully');
    
    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === 'video') {
        onTrack && onTrack(user.videoTrack, 'video');
      } else if (mediaType === 'audio') {
        onTrack && onTrack(user.audioTrack, 'audio');
        user.audioTrack.play();
      }
    });
    
    return { client, localAudioTrack, localVideoTrack };
  } catch (error) {
    console.error('Failed to join as teacher:', error);
    throw error;
  }
};

export const joinChannelAsStudent = async ({ channel, uid = null, onTrack }) => {
  try {
    console.log(`Joining Agora channel as student: ${channel}`);
    const client = createAgoraClient();
    // Using App ID only mode - pass null for token
    await client.join(AGORA_APP_ID, channel, null, uid || null);
    console.log('Student joined channel successfully');
    
    client.on('user-published', async (user, mediaType) => {
      console.log(`Teacher published ${mediaType} stream, subscribing...`);
      await client.subscribe(user, mediaType);
      
      if (mediaType === 'video') {
        console.log('Received teacher video track');
        onTrack && onTrack(user.videoTrack, 'video');
      } else if (mediaType === 'audio') {
        console.log('Received teacher audio track');
        onTrack && onTrack(user.audioTrack, 'audio');
        user.audioTrack.play();
      }
    });
    
    client.on('user-unpublished', (user) => {
      console.log('Teacher unpublished stream');
    });
    
    return { client };
  } catch (error) {
    console.error('Failed to join as student:', error);
    throw error;
  }
};

export const leaveChannel = async ({ client, localAudioTrack, localVideoTrack }) => {
  try {
    if (localAudioTrack) localAudioTrack.close();
    if (localVideoTrack) localVideoTrack.close();
    if (client) await client.leave();
  } catch (e) {
    console.warn('Leave channel warning:', e.message);
  }
};
