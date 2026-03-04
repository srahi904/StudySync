'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { usePusher } from '@/hooks/use-pusher';
import { CHANNELS, EVENTS } from '@/lib/pusher/channels';
import { useToast } from '@/components/ui/use-toast';
import { playNotificationSound } from '@/lib/utils/audio';

export function GlobalChatListener() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  
  // Keep track of pathname in a ref so Pusher callback always has the latest without rebinding
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  usePusher({
    channelName: session?.user?.id ? CHANNELS.user(session.user.id) : '',
    eventName: EVENTS.CONVERSATION_UPDATED,
    onEvent: (data) => {
      const update = data as {
        conversationId: string;
        lastMessage: string;
        lastMessageAt: string;
        senderId: string;
        senderName: string;
      };

      // Don't toast if the user sent the message themselves (e.g. from another tab)
      if (update.senderId === session?.user?.id) return;

      // If user is actively typing/reading in the specific chat window, don't show the toast
      // The assumption here is that if they are on `/chat` they might see it.
      // But let's be strict: if they are not explicitly on `/chat`, we show a toast.
      const isCurrentlyInChat = pathnameRef.current === '/chat';
      
      // Play sound
      playNotificationSound();

      // Show toast if not actively in the chat page
      if (!isCurrentlyInChat) {
         toast({
          title: `New message from ${update.senderName}`,
          description: update.lastMessage.length > 50 ? update.lastMessage.substring(0, 50) + '...' : update.lastMessage,
          onClick: () => {
            // Optional: navigate to the chat page when clicking the toast.
            // Using a query param or state to select the conversation would be ideal, 
            // but just navigating to /chat is good enough for now.
            router.push('/chat');
          },
        });
      }
    },
    enabled: !!session?.user?.id,
  });

  return null;
}
