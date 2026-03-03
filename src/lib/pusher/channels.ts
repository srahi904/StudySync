// src/lib/pusher/channels.ts
// Channel naming conventions for Pusher

export const CHANNELS = {
  // Private DM channel (sort IDs to ensure same channel name regardless of order)
  dm: (userId1: string, userId2: string) => {
    const ids = [userId1, userId2].sort();
    return `private-dm-${ids[0]}-${ids[1]}`;
  },

  // Public chat channel
  publicChannel: (channelId: string) => {
    return `presence-public-${channelId}`;
  },

  // User's personal notification channel
  user: (userId: string) => {
    return `private-user-${userId}`;
  },
};

export const EVENTS = {
  // Public chat
  NEW_PUBLIC_MESSAGE: 'new-public-message',
  DELETE_PUBLIC_MESSAGE: 'delete-public-message',

  // Private chat
  NEW_PRIVATE_MESSAGE: 'new-private-message',
  MESSAGE_READ: 'message-read',
  MESSAGE_DELIVERED: 'message-delivered',

  // Typing
  TYPING_START: 'typing-start',
  TYPING_STOP: 'typing-stop',

  // Social
  NEW_FOLLOWER: 'new-follower',
  UNFOLLOWED: 'unfollowed',

  // Conversations
  CONVERSATION_UPDATED: 'conversation-updated',
  NEW_CONVERSATION: 'new-conversation',
};
