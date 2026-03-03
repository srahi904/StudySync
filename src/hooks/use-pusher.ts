// src/hooks/use-pusher.ts
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getPusherClient } from '@/lib/pusher/client';
import type PusherClient from 'pusher-js';
import type { Channel } from 'pusher-js';

interface UsePusherOptions {
  channelName: string;
  eventName: string;
  onEvent: (data: unknown) => void;
  enabled?: boolean;
}

export function usePusher({ channelName, eventName, onEvent, enabled = true }: UsePusherOptions) {
  const channelRef = useRef<Channel | null>(null);
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !channelName) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    channel.bind(eventName, (data: unknown) => {
      callbackRef.current(data);
    });

    return () => {
      channel.unbind(eventName);
      pusher.unsubscribe(channelName);
      channelRef.current = null;
    };
  }, [channelName, eventName, enabled]);

  return { channel: channelRef.current };
}

// Multi-event subscription
interface UsePusherMultiOptions {
  channelName: string;
  events: Record<string, (data: unknown) => void>;
  enabled?: boolean;
}

export function usePusherMulti({ channelName, events, enabled = true }: UsePusherMultiOptions) {
  const channelRef = useRef<Channel | null>(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    if (!enabled || !channelName) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    const eventNames = Object.keys(eventsRef.current);
    eventNames.forEach((eventName) => {
      channel.bind(eventName, (data: unknown) => {
        eventsRef.current[eventName]?.(data);
      });
    });

    return () => {
      eventNames.forEach((eventName) => {
        channel.unbind(eventName);
      });
      pusher.unsubscribe(channelName);
      channelRef.current = null;
    };
  }, [channelName, enabled]);

  return { channel: channelRef.current };
}
