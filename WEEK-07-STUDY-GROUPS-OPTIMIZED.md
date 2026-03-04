# Week 7: Study Groups System (Optimized with External Services)

## 📋 Overview

**Duration:** 8-12 days  
**Prerequisites:** Week 1-6 Complete (Foundation, Auth, Dashboard, Materials, AI, Chat)  
**Goal:** Build study groups with shared materials, group chat, and member management  
**Optimization Focus:** No server load, external services, instant UI updates

---

## 🎯 What We're Building

### Core Features:

**1. Group Management:**
- ✅ Create study groups (subject-based)
- ✅ Public/Private/Invite-only groups
- ✅ Group discovery (explore page)
- ✅ Join/Leave groups
- ✅ Member management (roles: Owner, Admin, Member)
- ✅ Group settings

**2. Group Chat (Reuse Week 6):**
- ✅ Real-time group discussions
- ✅ Share materials in chat
- ✅ Mentions, reactions
- ✅ File uploads in group

**3. Shared Materials:**
- ✅ Share materials with group
- ✅ Group material library
- ✅ Download group materials
- ✅ Material permissions

**4. Member Features:**
- ✅ Invite members
- ✅ Approve join requests
- ✅ Remove members
- ✅ Promote to admin
- ✅ Member list with stats

---

## 🏗️ Optimized Architecture (No Server Load)

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js 15 + React 19)                       │
│  - Client-side rendering for instant UI                 │
│  - Optimistic updates                                   │
│  - ISR for group pages                                  │
│  - Edge caching                                         │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  CACHE LAYER (Upstash Redis - Serverless)               │
│  - Group member counts (real-time)                      │
│  - Group discovery cache                                │
│  - Recent groups cache                                  │
│  - Join request queue                                   │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  DATABASE (Neon PostgreSQL - Optimized)                 │
│  - Connection pooling                                   │
│  - Indexed queries                                      │
│  - Read replicas for heavy queries                      │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  REAL-TIME (Stream Chat - Group Channels)               │
│  - Reuse Week 6 setup                                   │
│  - Group channels (presence-group-{id})                 │
│  - Auto member sync                                     │
│  - File sharing built-in                                │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  NOTIFICATIONS (Knock.app - RECOMMENDED)                │
│  Alternative: Novu, OneSignal                           │
│  - New member joined                                    │
│  - Material shared                                      │
│  - Join request pending                                 │
│  - Group invitations                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ External Services (Load Management)

### 1. **Stream Chat** (Already from Week 6)

**For Group Chat:**
- ✅ Create channel: `presence-group-{groupId}`
- ✅ Auto member management
- ✅ Built-in presence
- ✅ File sharing
- ✅ Reactions, threads

**No additional cost** - Reuse Week 6 setup

---

### 2. **Knock.app** (Notifications - RECOMMENDED)

**Why Knock:**
- ✅ Multi-channel (in-app, email, push, SMS)
- ✅ React components included
- ✅ Workflow builder (no code)
- ✅ User preferences
- ✅ Delivery tracking

**Pricing:**
- Free: 10K notifications/month
- Pro: $250/month - 500K notifications

**Setup:**

```bash
npm install @knocklabs/node @knocklabs/react
```

**Use Cases:**
- Member joins group → Notify owner
- Material shared → Notify all members
- Join request → Notify admins
- Group invitation → Notify user

**Alternative:** Novu (open-source, self-hosted option)

---

### 3. **Upstash Redis** (Already from Optimization)

**For Groups:**
- Cache group member counts
- Cache group discovery results
- Rate limiting (create group: 5/hour)
- Join request queue

**No additional cost** - Reuse existing setup

---

### 4. **Neon PostgreSQL** (Already Optimized)

**With Read Replicas (Neon Pro):**

```typescript
// Heavy reads (group discovery) → Replica
const groups = await prismaRead.studyGroup.findMany();

// Writes (create group) → Primary
await prismaWrite.studyGroup.create();
```

---

## 🗄️ Database Schema (Optimized)

```prisma
// ═══════════════════════════════════════════════════════
// STUDY GROUPS MODELS
// ═══════════════════════════════════════════════════════

model StudyGroup {
  id          String       @id @default(cuid())
  name        String
  description String?      @db.Text
  
  // Classification
  subject     String       // "Computer Science", "Mathematics", etc.
  tags        String[]     @default([])
  
  // Privacy
  privacy     GroupPrivacy @default(PUBLIC)
  
  // Creator
  creatorId   String
  creator     User         @relation("CreatedGroups", fields: [creatorId], references: [id], onDelete: Cascade)
  
  // Limits
  maxMembers  Int          @default(50)
  
  // Cached counts (for performance)
  memberCount Int          @default(0)
  materialCount Int        @default(0)
  
  // Relations
  members     GroupMember[]
  materials   GroupMaterial[]
  invitations GroupInvitation[]
  joinRequests GroupJoinRequest[]
  
  // Settings
  settings    Json?        // { allowInvites: true, allowMaterialSharing: true }
  
  // Metadata
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  // Stream Chat channel ID
  chatChannelId String?
  
  @@index([subject])
  @@index([privacy])
  @@index([creatorId])
  @@index([createdAt])
  @@map("study_groups")
}

model GroupMember {
  id        String     @id @default(cuid())
  groupId   String
  group     StudyGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  
  userId    String
  user      User       @relation("GroupMemberships", fields: [userId], references: [id], onDelete: Cascade)
  
  // Role
  role      GroupRole  @default(MEMBER)
  
  // Stats
  joinedAt  DateTime   @default(now())
  lastActiveAt DateTime @default(now())
  
  @@unique([groupId, userId])
  @@index([groupId])
  @@index([userId])
  @@index([groupId, role])
  @@map("group_members")
}

model GroupMaterial {
  id         String     @id @default(cuid())
  groupId    String
  group      StudyGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  
  materialId String
  material   Material   @relation("GroupMaterials", fields: [materialId], references: [id], onDelete: Cascade)
  
  // Who shared
  sharedBy   String
  sharer     User       @relation("SharedGroupMaterials", fields: [sharedBy], references: [id], onDelete: Cascade)
  
  sharedAt   DateTime   @default(now())
  
  @@unique([groupId, materialId])
  @@index([groupId])
  @@index([materialId])
  @@map("group_materials")
}

model GroupInvitation {
  id        String     @id @default(cuid())
  groupId   String
  group     StudyGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  
  // Invited user
  invitedUserId String
  invitedUser   User   @relation("GroupInvitations", fields: [invitedUserId], references: [id], onDelete: Cascade)
  
  // Who invited
  invitedBy String
  inviter   User     @relation("SentGroupInvitations", fields: [invitedBy], references: [id], onDelete: Cascade)
  
  // Status
  status    InvitationStatus @default(PENDING)
  
  // Expiry
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  @@unique([groupId, invitedUserId])
  @@index([invitedUserId])
  @@index([groupId])
  @@map("group_invitations")
}

model GroupJoinRequest {
  id        String     @id @default(cuid())
  groupId   String
  group     StudyGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  
  userId    String
  user      User       @relation("GroupJoinRequests", fields: [userId], references: [id], onDelete: Cascade)
  
  message   String?    @db.Text
  status    RequestStatus @default(PENDING)
  
  // Reviewed by admin
  reviewedBy String?
  reviewedAt DateTime?
  
  createdAt  DateTime   @default(now())
  
  @@unique([groupId, userId])
  @@index([groupId])
  @@index([userId])
  @@map("group_join_requests")
}

enum GroupPrivacy {
  PUBLIC        // Anyone can join
  PRIVATE       // Request to join
  INVITE_ONLY   // Only via invitation
}

enum GroupRole {
  OWNER
  ADMIN
  MEMBER
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  REJECTED
  EXPIRED
}

enum RequestStatus {
  PENDING
  APPROVED
  REJECTED
}

// ═══════════════════════════════════════════════════════
// UPDATE USER MODEL
// ═══════════════════════════════════════════════════════

model User {
  // ... existing fields
  
  // NEW: Group relations
  createdGroups       StudyGroup[]        @relation("CreatedGroups")
  groupMemberships    GroupMember[]       @relation("GroupMemberships")
  sharedGroupMaterials GroupMaterial[]    @relation("SharedGroupMaterials")
  groupInvitations    GroupInvitation[]   @relation("GroupInvitations")
  sentGroupInvitations GroupInvitation[]  @relation("SentGroupInvitations")
  groupJoinRequests   GroupJoinRequest[]  @relation("GroupJoinRequests")
  
  // ... rest of fields
}

// ═══════════════════════════════════════════════════════
// UPDATE MATERIAL MODEL
// ═══════════════════════════════════════════════════════

model Material {
  // ... existing fields
  
  // NEW: Group sharing
  groupMaterials GroupMaterial[] @relation("GroupMaterials")
  
  // ... rest of fields
}
```

**Migration:**
```bash
npx prisma migrate dev --name add-study-groups
npx prisma generate
```

---

## 📁 Complete File Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── groups/
│   │       ├── page.tsx                 # My groups list
│   │       ├── loading.tsx
│   │       │
│   │       ├── discover/
│   │       │   └── page.tsx             # Explore groups
│   │       │
│   │       ├── create/
│   │       │   └── page.tsx             # Create new group
│   │       │
│   │       ├── [groupId]/
│   │       │   ├── page.tsx             # Group detail
│   │       │   │
│   │       │   ├── chat/
│   │       │   │   └── page.tsx         # Group chat (Stream)
│   │       │   │
│   │       │   ├── materials/
│   │       │   │   └── page.tsx         # Shared materials
│   │       │   │
│   │       │   ├── members/
│   │       │   │   └── page.tsx         # Member list
│   │       │   │
│   │       │   └── settings/
│   │       │       └── page.tsx         # Group settings (owner/admin)
│   │       │
│   │       └── invitations/
│   │           └── page.tsx             # My invitations
│   │
│   └── api/
│       └── groups/
│           ├── route.ts                 # GET - List, POST - Create
│           │
│           ├── discover/
│           │   └── route.ts             # GET - Public groups
│           │
│           ├── [id]/
│           │   ├── route.ts             # GET, PATCH, DELETE
│           │   │
│           │   ├── join/
│           │   │   └── route.ts         # POST - Join group
│           │   │
│           │   ├── leave/
│           │   │   └── route.ts         # POST - Leave group
│           │   │
│           │   ├── invite/
│           │   │   └── route.ts         # POST - Invite user
│           │   │
│           │   ├── members/
│           │   │   ├── route.ts         # GET - List members
│           │   │   └── [userId]/
│           │   │       └── route.ts     # PATCH - Update role, DELETE - Remove
│           │   │
│           │   ├── materials/
│           │   │   ├── route.ts         # GET - List, POST - Share
│           │   │   └── [materialId]/
│           │   │       └── route.ts     # DELETE - Unshare
│           │   │
│           │   ├── requests/
│           │   │   ├── route.ts         # GET - List requests
│           │   │   └── [requestId]/
│           │   │       └── route.ts     # PATCH - Approve/Reject
│           │   │
│           │   └── chat-channel/
│           │       └── route.ts         # POST - Create Stream channel
│           │
│           └── invitations/
│               ├── route.ts             # GET - My invitations
│               └── [invitationId]/
│                   └── route.ts         # PATCH - Accept/Reject
│
├── components/
│   └── groups/
│       ├── group-card.tsx               # Single group card
│       ├── group-grid.tsx               # Grid of groups
│       ├── group-header.tsx             # Group detail header
│       ├── group-tabs.tsx               # Chat/Materials/Members tabs
│       ├── create-group-form.tsx        # Create group modal
│       ├── group-settings-form.tsx      # Settings form
│       ├── member-list.tsx              # List of members
│       ├── member-card.tsx              # Single member
│       ├── member-actions.tsx           # Remove/Promote actions
│       ├── material-share-modal.tsx     # Share material to group
│       ├── shared-materials-list.tsx    # Group materials
│       ├── invite-modal.tsx             # Invite users
│       ├── join-request-list.tsx        # Pending requests
│       ├── invitation-card.tsx          # Single invitation
│       ├── group-stats.tsx              # Members/Materials count
│       ├── privacy-badge.tsx            # Public/Private badge
│       └── empty-state.tsx              # No groups placeholder
│
├── hooks/
│   ├── use-group.ts                     # Group data fetching
│   ├── use-group-members.ts             # Members management
│   └── use-group-chat.ts                # Stream Chat integration
│
└── lib/
    ├── groups/
    │   ├── permissions.ts               # Check permissions
    │   ├── notifications.ts             # Knock integration
    │   └── group-utils.ts               # Helper functions
    │
    └── stream-chat.ts                   # Already from Week 6
```

---

## 🎯 Optimized Algorithms

### Algorithm 1: Group Discovery (Cached + Pagination)

**Problem:** Loading 1000+ groups is slow

**Solution: Redis Cache + Cursor Pagination**

```typescript
// API: GET /api/groups/discover?cursor=group_xyz&subject=CS

async function discoverGroups(subject?, cursor?, limit = 20) {
  const cacheKey = `discover:${subject || 'all'}:${cursor || 'first'}`;
  
  // Check Redis cache first (5 min TTL)
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Query database (optimized)
  const groups = await prisma.studyGroup.findMany({
    where: {
      privacy: 'PUBLIC',
      ...(subject && { subject }),
      ...(cursor && { id: { lt: cursor } }),
    },
    select: {
      id: true,
      name: true,
      description: true,
      subject: true,
      tags: true,
      memberCount: true,
      createdAt: true,
      creator: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(groups));
  
  return groups;
}
```

**Benefits:**
- First load: DB query (< 100ms with indexes)
- Subsequent loads: Redis (< 10ms)
- Auto-invalidates on new group creation

---

### Algorithm 2: Real-time Member Count (Redis Counters)

**Problem:** Updating memberCount in DB on every join/leave

**Solution: Redis Counters + Background Sync**

```typescript
// When user joins
async function joinGroup(groupId: string, userId: string) {
  // 1. Add to database
  await prisma.groupMember.create({
    data: { groupId, userId, role: 'MEMBER' },
  });
  
  // 2. Increment Redis counter (instant)
  const newCount = await redis.incr(`group:${groupId}:members`);
  
  // 3. Broadcast to all clients (Stream Chat presence)
  await streamChat.updateChannel(groupId, {
    member_count: newCount,
  });
  
  // 4. Queue background sync to DB (every 5 min)
  // This syncs Redis → Database for accuracy
}

// Background job (every 5 minutes)
async function syncMemberCounts() {
  const groups = await prisma.studyGroup.findMany({
    select: { id: true },
  });
  
  for (const group of groups) {
    const count = await redis.get(`group:${group.id}:members`);
    if (count !== null) {
      await prisma.studyGroup.update({
        where: { id: group.id },
        data: { memberCount: parseInt(count) },
      });
    }
  }
}
```

**Benefits:**
- UI updates instantly (Redis)
- No database bottleneck
- Eventually consistent

---

### Algorithm 3: Permission Check (Cached)

**Problem:** Checking permissions on every action

**Solution: Role-based Check with Cache**

```typescript
// lib/groups/permissions.ts

interface PermissionCheck {
  canEdit: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canManageMembers: boolean;
  canShareMaterials: boolean;
}

async function checkGroupPermissions(
  groupId: string,
  userId: string
): Promise<PermissionCheck> {
  const cacheKey = `perms:${groupId}:${userId}`;
  
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Get member role
  const member = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId },
    },
    select: { role: true },
  });
  
  if (!member) {
    return {
      canEdit: false,
      canDelete: false,
      canInvite: false,
      canManageMembers: false,
      canShareMaterials: false,
    };
  }
  
  const permissions: PermissionCheck = {
    canEdit: ['OWNER', 'ADMIN'].includes(member.role),
    canDelete: member.role === 'OWNER',
    canInvite: ['OWNER', 'ADMIN', 'MEMBER'].includes(member.role),
    canManageMembers: ['OWNER', 'ADMIN'].includes(member.role),
    canShareMaterials: ['OWNER', 'ADMIN', 'MEMBER'].includes(member.role),
  };
  
  // Cache for 10 minutes
  await redis.setex(cacheKey, 600, JSON.stringify(permissions));
  
  return permissions;
}
```

---

### Algorithm 4: Notification Batching (Knock.app)

**Problem:** Sending 50 notifications when material shared in large group

**Solution: Batch Notifications**

```typescript
// lib/groups/notifications.ts
import { Knock } from '@knocklabs/node';

const knock = new Knock(process.env.KNOCK_API_KEY);

async function notifyGroupMembers(
  groupId: string,
  eventType: string,
  data: any
) {
  // Get all members (except actor)
  const members = await prisma.groupMember.findMany({
    where: { 
      groupId,
      userId: { not: data.actorId },
    },
    select: { userId: true },
  });
  
  // Batch notify (Knock handles delivery)
  await knock.workflows.trigger('group-event', {
    recipients: members.map(m => m.userId),
    data: {
      groupId,
      eventType,
      ...data,
    },
  });
}

// Usage
await notifyGroupMembers(groupId, 'material-shared', {
  actorId: userId,
  materialName: material.title,
  groupName: group.name,
});
```

---

## 🎨 UI/UX Design

### Group Discovery Page

```
┌──────────────────────────────────────────────────────────┐
│  Discover Study Groups                                   │
│  ──────────────────────────────────────────────────────  │
│                                                           │
│  Filters:                                                 │
│  [All Subjects ▼] [Public ▼] [Sort: Popular ▼]          │
│                                                           │
│  ──────────────────────────────────────────────────────  │
│                                                           │
│  Groups Grid (3 columns):                                │
│  ┌────────────┬────────────┬────────────┐               │
│  │ Group Card │ Group Card │ Group Card │               │
│  │ CS Study   │ Math Help  │ Physics 101│               │
│  │ 👥 45/50   │ 👥 23/30   │ 👥 67/100  │               │
│  │ 📚 156     │ 📚 89      │ 📚 234     │               │
│  │ [Join]     │ [Request]  │ [Join]     │               │
│  ├────────────┼────────────┼────────────┤               │
│  │ ...        │ ...        │ ...        │               │
│  └────────────┴────────────┴────────────┘               │
│                                                           │
│  [Load More]                                             │
└──────────────────────────────────────────────────────────┘

Features:
- Real-time member count
- Subject badges
- Privacy indicator
- One-click join
```

---

### Group Detail Page (Tabs)

```
┌──────────────────────────────────────────────────────────┐
│  Computer Science Study Group                   [⚙️ ⋮]  │
│  Created by @john_doe • 45 members • 156 materials      │
│  ──────────────────────────────────────────────────────  │
│                                                           │
│  [Chat] [Materials] [Members] [About]                    │
│  ──────────────────────────────────────────────────────  │
│                                                           │
│  Chat Tab (Stream Chat):                                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │  @alice: Check out this OS material I found!      │ │
│  │  📄 operating-systems.pdf                         │ │
│  │  10:23 AM                                         │ │
│  │                                                    │ │
│  │  @bob: Thanks! Added to my collection            │ │
│  │  10:25 AM                                         │ │
│  │                                                    │ │
│  │  [You are typing...]                              │ │
│  └────────────────────────────────────────────────────┘ │
│  [Type message...] [📎] [Send]                           │
└──────────────────────────────────────────────────────────┘

Materials Tab:
- Shared materials list
- Share new material button
- Download options
- Shared by info

Members Tab:
- Member list with roles
- Invite button (if allowed)
- Remove/Promote actions (if admin)

About Tab:
- Description
- Tags
- Rules
- Created date
```

---

## 📦 External Services Setup

### 1. Stream Chat (Group Channels)

**Already setup from Week 6 - Just extend:**

```typescript
// lib/stream-chat.ts (extend existing)

// Create group channel
export async function createGroupChannel(groupId: string, groupName: string) {
  const channel = serverClient.channel('messaging', `group-${groupId}`, {
    name: groupName,
    created_by_id: 'system',
  });
  
  await channel.create();
  return channel.id;
}

// Add member to channel
export async function addMemberToGroupChannel(
  groupId: string,
  userId: string
) {
  const channel = serverClient.channel('messaging', `group-${groupId}`);
  await channel.addMembers([userId]);
}

// Remove member
export async function removeMemberFromGroupChannel(
  groupId: string,
  userId: string
) {
  const channel = serverClient.channel('messaging', `group-${groupId}`);
  await channel.removeMembers([userId]);
}
```

---

### 2. Knock.app (Notifications)

**Setup:**

```bash
npm install @knocklabs/node @knocklabs/react
```

**Server:**

```typescript
// lib/groups/notifications.ts
import { Knock } from '@knocklabs/node';

const knock = new Knock(process.env.KNOCK_API_KEY);

// Workflow examples
export const notifyNewMember = (groupId, newMemberId) => {
  knock.workflows.trigger('new-member-joined', {
    recipients: [groupId], // All group members
    data: { memberId: newMemberId },
  });
};

export const notifyMaterialShared = (groupId, materialId) => {
  knock.workflows.trigger('material-shared', {
    recipients: [groupId],
    data: { materialId },
  });
};

export const notifyJoinRequest = (groupId, requesterId) => {
  knock.workflows.trigger('join-request-pending', {
    recipients: [groupId], // Group admins only
    data: { requesterId },
  });
};
```

**Client:**

```typescript
'use client';

import { KnockProvider, KnockFeedProvider } from '@knocklabs/react';

export function NotificationProvider({ children }) {
  return (
    <KnockProvider
      apiKey={process.env.NEXT_PUBLIC_KNOCK_PUBLISHABLE_KEY!}
      userId={session.user.id}
    >
      <KnockFeedProvider feedId="in-app">
        {children}
      </KnockFeedProvider>
    </KnockProvider>
  );
}
```

---

## 🗄️ Database Indexes (Critical)

```sql
-- Run in Neon SQL Editor

-- Group indexes
CREATE INDEX CONCURRENTLY idx_study_groups_subject 
ON study_groups(subject);

CREATE INDEX CONCURRENTLY idx_study_groups_privacy 
ON study_groups(privacy);

CREATE INDEX CONCURRENTLY idx_study_groups_creator 
ON study_groups(creator_id);

CREATE INDEX CONCURRENTLY idx_study_groups_composite 
ON study_groups(privacy, subject, created_at DESC);

-- Member indexes
CREATE INDEX CONCURRENTLY idx_group_members_group 
ON group_members(group_id);

CREATE INDEX CONCURRENTLY idx_group_members_user 
ON group_members(user_id);

CREATE INDEX CONCURRENTLY idx_group_members_role 
ON group_members(group_id, role);

-- Material indexes
CREATE INDEX CONCURRENTLY idx_group_materials_group 
ON group_materials(group_id, shared_at DESC);

CREATE INDEX CONCURRENTLY idx_group_materials_material 
ON group_materials(material_id);

-- Invitation indexes
CREATE INDEX CONCURRENTLY idx_group_invitations_user 
ON group_invitations(invited_user_id, status);

CREATE INDEX CONCURRENTLY idx_group_invitations_group 
ON group_invitations(group_id, status);

-- Join request indexes
CREATE INDEX CONCURRENTLY idx_group_join_requests_group 
ON group_join_requests(group_id, status);

CREATE INDEX CONCURRENTLY idx_group_join_requests_user 
ON group_join_requests(user_id);
```

---

## 🧪 Testing Checklist

### Group Management:
- [ ] Create public group
- [ ] Create private group
- [ ] Create invite-only group
- [ ] Update group settings
- [ ] Delete group (owner only)

### Membership:
- [ ] Join public group
- [ ] Request to join private
- [ ] Accept invitation
- [ ] Leave group
- [ ] Remove member (admin)
- [ ] Promote to admin

### Materials:
- [ ] Share material to group
- [ ] View shared materials
- [ ] Download group material
- [ ] Unshare material

### Chat:
- [ ] Send message in group
- [ ] Share file in chat
- [ ] Mention member
- [ ] React to message

### Discovery:
- [ ] Browse public groups
- [ ] Filter by subject
- [ ] Search groups
- [ ] Join from discovery

### Notifications:
- [ ] Receive join notification
- [ ] Receive material notification
- [ ] Receive invitation
- [ ] Receive request (admin)

---

## 💰 Cost Estimate (1000 Users, 200 Groups)

| Service | Cost/Month |
|---------|------------|
| Stream Chat | $99 (from Week 6) |
| Knock.app | $0 (< 10K notifications) |
| Upstash Redis | $5 |
| Neon PostgreSQL | $69 |
| **Total NEW** | **$0** (reuse existing) |

**Note:** No additional cost - reuse Week 6 services!

---

## 🎯 Performance Targets

✅ **Group discovery:** < 100ms (Redis cached)  
✅ **Join group:** < 300ms (optimistic UI)  
✅ **Load members:** < 50ms (indexed query)  
✅ **Share material:** < 200ms  
✅ **Send message:** < 100ms (Stream Chat)  
✅ **Real-time count:** Instant (Redis)  
✅ **Notifications:** < 1 sec (Knock)

---

## 🚀 Implementation Timeline

```
Days 1-2:   Database schema + indexes
Days 3-4:   Group CRUD + discovery
Days 5-6:   Membership system + permissions
Days 7-8:   Material sharing
Days 9-10:  Stream Chat integration
Days 11-12: Knock notifications + testing

Total: 12 days
```

---

## 📊 Optimizations Summary

### **1. Redis Caching:**
- Group discovery results (5 min)
- Member counts (real-time)
- Permission checks (10 min)
- Join request queue

### **2. Database:**
- 10+ indexes added
- Read replicas for discovery
- Optimized queries (select only needed fields)
- Connection pooling

### **3. Real-time:**
- Stream Chat for group messages
- Presence for member status
- Auto member sync

### **4. Notifications:**
- Knock.app workflows
- Batch delivery
- Multi-channel (in-app + email)

### **5. Frontend:**
- ISR for group pages
- Optimistic UI updates
- Client-side member list
- Lazy loading

---

**Complete Week 7 with zero server load, instant UI, real-time updates, and external services handling everything!** 🚀⚡

No legacy code, latest versions, fully optimized! 💯
