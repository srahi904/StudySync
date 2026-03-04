// src/lib/pusher/channels.ts
// Channel naming conventions for Pusher

export const CHANNELS = {
  // Private DM channel (sort IDs to ensure same channel name regardless of order)
  dm: (userId1: string, userId2: string) => {
    const ids = [userId1, userId2].sort()
    return `private-dm-${ids[0]}-${ids[1]}`
  },

  // Public chat channel
  publicChannel: (channelId: string) => {
    return `presence-public-${channelId}`
  },

  // User's personal notification channel
  user: (userId: string) => {
    return `private-user-${userId}`
  },

  // Study group channel (private — members only)
  group: (groupId: string) => {
    return `private-group-${groupId}`
  },

  // Material specific channel for likes and comments
  material: (materialId: string) => {
    return `presence-material-${materialId}`
  },
}

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

  // Notifications
  NEW_NOTIFICATION: 'new-notification',

  // Study Groups
  GROUP_CHAT_MESSAGE: 'group-chat-message',
  GROUP_MEMBER_JOINED: 'group-member-joined',
  GROUP_MEMBER_LEFT: 'group-member-left',
  GROUP_MEMBER_UPDATED: 'group-member-updated',
  GROUP_MATERIAL_SHARED: 'group-material-shared',
  GROUP_JOIN_REQUEST: 'group-join-request',
  GROUP_INVITATION: 'group-invitation',
  GROUP_UPDATED: 'group-updated',

  // Materials
  NEW_MATERIAL_COMMENT: 'new-material-comment',
  MATERIAL_LIKES_UPDATED: 'material-likes-updated',
}
