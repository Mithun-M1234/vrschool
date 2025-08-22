import React from 'react';

export default function JitsiEmbed({ room = 'vr-class-room', width = '100%', height = '600px', userName = 'Guest' }) {
  const src = `https://meet.jit.si/${encodeURIComponent(room)}#userInfo.displayName="${encodeURIComponent(userName)}"`;
  return (
    <div style={{ width, height }}>
      <iframe
        title="Jitsi"
        src={src}
        style={{ width: '100%', height: '100%', border: 0 }}
        allow="camera; microphone; fullscreen; display-capture"
      />
    </div>
  );
}
