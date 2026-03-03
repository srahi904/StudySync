'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getPusherClient } from '@/lib/pusher/client';
import { PresenceChannel, Members } from 'pusher-js';

// Export a custom hook so components can get the global list of online users
export let globalOnlineUsers = new Set<string>();
let listeners: Array<(users: Set<string>) => void> = [];

function notifyListeners() {
  listeners.forEach(l => l(new Set(globalOnlineUsers)));
}

export function useActiveList() {
  const [activeUsers, setActiveUsers] = useState<Set<string>>(globalOnlineUsers);

  useEffect(() => {
    const listener = (users: Set<string>) => setActiveUsers(users);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  return activeUsers;
}

export function ActiveStatusProvider() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    let isActive = false;
    let channel: PresenceChannel | null = null;
    let timeoutId: NodeJS.Timeout;

    const setupPusher = async () => {
      const pusher = getPusherClient();
      
      // We use a global presence channel
      channel = pusher.subscribe('presence-studysync') as PresenceChannel;

      channel.bind('pusher:subscription_succeeded', (members: Members) => {
        const newSet = new Set<string>();
        members.each((member: { id: string }) => newSet.add(member.id));
        globalOnlineUsers = newSet;
        notifyListeners();
        
        // Update DB
        if (!isActive) {
          isActive = true;
          fetch('/api/users/me/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isOnline: true }),
            keepalive: true
          }).catch(console.error);
        }
      });

      channel.bind('pusher:member_added', (member: { id: string }) => {
        globalOnlineUsers.add(member.id);
        notifyListeners();
      });

      channel.bind('pusher:member_removed', (member: { id: string }) => {
        globalOnlineUsers.delete(member.id);
        notifyListeners();
      });
    };

    // Debounce connection slightly to prevent thrashing
    timeoutId = setTimeout(setupPusher, 1000);

    const handleUnload = () => {
      if (isActive && session?.user?.id) {
        // Use sendBeacon for reliable delivery during page unload
        const url = '/api/users/me/status';
        const data = JSON.stringify({ isOnline: false });
        
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, data);
        } else {
          // Fallback if sendBeacon not available
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: data,
            keepalive: true
          }).catch(console.error);
        }
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('beforeunload', handleUnload);
      
      if (channel) {
        const pusher = getPusherClient();
        pusher.unsubscribe('presence-studysync');
      }
      
      if (isActive) {
        handleUnload();
        isActive = false;
      }
    };
  }, [session?.user?.id]);

  return null;
}
