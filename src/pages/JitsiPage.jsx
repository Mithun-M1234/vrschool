import React, { useState } from 'react';
import JitsiEmbed from '../components/JitsiEmbed';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { createLiveRoom } from '../services/firestore';

export default function JitsiPage() {
  const [room, setRoom] = useState(() => {
    const q = new URLSearchParams(window.location.search);
    return q.get('room') || `vr-class-${Math.floor(Math.random() * 10000)}`;
  });
  const [name, setName] = useState('Guest');
  const { user } = useAuth();

  const inviteLink = `${window.location.origin}/jitsi?room=${encodeURIComponent(room)}`;

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Invite link copied to clipboard');
    } catch (e) {
      console.warn('Clipboard copy failed, fallback to prompt', e);
      window.prompt('Copy this link', inviteLink);
    }
  };

  const openPopup = () => {
    const url = `https://meet.jit.si/${encodeURIComponent(room)}#userInfo.displayName="${encodeURIComponent(name)}"`;
    window.open(url, '_blank', 'noopener,noreferrer,width=1024,height=768');
  };

  const saveRoom = async () => {
    if (!user) {
      toast.error('You must be signed in to save rooms');
      return;
    }

    try {
      await createLiveRoom(room, user.uid, { name: room });
      toast.success('Room saved');
    } catch (error) {
      toast.error('Failed to save room');
    }
  };

  return (
    <div style={{ padding: 12 }}>
      <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="room name" />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="your name" />
        <button onClick={copyInvite}>Copy invite</button>
        <button onClick={openPopup}>Open in new window</button>
        <button onClick={() => setRoom(`vr-class-${Math.floor(Math.random() * 10000)}`)}>New room</button>
        <button onClick={saveRoom} title="Save this room to your account">Save room</button>
      </div>
      <JitsiEmbed room={room} userName={name} height="80vh" />
    </div>
  );
}
