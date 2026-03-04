// src/hooks/use-pusher.ts
'use client';

import { useEffect, useRef } from 'react';
import { getPusherClient } from '@/lib/pusher/client';
import type { Channel } from 'pusher-js';

// Global reference counter for Pusher channels across the app
const channelRefs: Record<string, number> = {};

interface UsePusherOptions {
  channelName: string;
  eventName: string;
  onEvent: (data: unknown) => void;
  enabled?: boolean;
}

export function usePusher({ channelName, eventName, onEvent, enabled = true }: UsePusherOptions) {
  const channelInstance = useRef<Channel | null>(null);
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !channelName) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(channelName);
    channelInstance.current = channel;

    // Increment reference count
    channelRefs[channelName] = (channelRefs[channelName] || 0) + 1;

    // Create a stable handler reference to properly unbind ONLY this specific listener later
    const handler = (data: unknown) => {
      callbackRef.current(data);
    };
    channel.bind(eventName, handler);

    return () => {
      // Unbind only this specific component's listener
      channel.unbind(eventName, handler);
      
      // Decrement reference count and unsubscribe if 0 components are using it
      channelRefs[channelName] -= 1;
      if (channelRefs[channelName] <= 0) {
        pusher.unsubscribe(channelName);
        delete channelRefs[channelName];
      }
      channelInstance.current = null;
    };
  }, [channelName, eventName, enabled]);

  return { channel: channelInstance.current };
}

// Multi-event subscription
interface UsePusherMultiOptions {
  channelName: string;
  events: Record<string, (data: unknown) => void>;
  enabled?: boolean;
}

export function usePusherMulti({ channelName, events, enabled = true }: UsePusherMultiOptions) {
  const channelInstance = useRef<Channel | null>(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    if (!enabled || !channelName) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(channelName);
    channelInstance.current = channel;

    // Increment reference count
    channelRefs[channelName] = (channelRefs[channelName] || 0) + 1;

    const eventNames = Object.keys(eventsRef.current);
    
    // Create stable handler references mapped by event name
    const handlers: Record<string, (data: unknown) => void> = {};
    
    eventNames.forEach((eventName) => {
      const handler = (data: unknown) => {
        eventsRef.current[eventName]?.(data);
      };
      handlers[eventName] = handler;
      channel.bind(eventName, handler);
    });

    return () => {
      // Unbind only this specific component's listeners
      eventNames.forEach((eventName) => {
        if (handlers[eventName]) {
          channel.unbind(eventName, handlers[eventName]);
        }
      });
      
      // Decrement reference count and unsubscribe if 0 components are using it
      channelRefs[channelName] -= 1;
      if (channelRefs[channelName] <= 0) {
        pusher.unsubscribe(channelName);
        delete channelRefs[channelName];
      }
      channelInstance.current = null;
    };
  }, [channelName, enabled]);

  return { channel: channelInstance.current };
}
