# Week 8: AI-Powered Smart Matching System 🎯

## 📋 Overview

**Duration:** 10-14 days  
**Prerequisites:** Week 1-7 Complete  
**Goal:** Build intelligent study partner matching with AI, daily suggestions, auto-matching jobs, swipe UI  
**Optimization Focus:** Zero manual work, auto-background jobs, instant notifications, smooth swipe animations

---

## 🎯 Complete Feature Set

### **Core Matching Features:**

**1. Smart Matching Algorithm (AI-Powered):**
- ✅ Subject compatibility (40%)
- ✅ Learning progress matching (25%)
- ✅ Study time overlap (15%)
- ✅ Goal alignment (10%)
- ✅ Skill level compatibility (5%)
- ✅ Learning style match (5%)
- ✅ Activity score (recent activity bonus)

**2. Daily Study Partner Suggestions:**
- ✅ 3 new partners every day (auto-generated)
- ✅ Temporary groups created automatically
- ✅ Auto-delete after 24hr if not joined
- ✅ Push notifications for new suggestions
- ✅ Personalized based on progress

**3. Learning Progress Matching (Advanced):**
- ✅ Track learning stage per subject
- ✅ Match complementary levels
- ✅ Example: Beginner + Intermediate pairing
- ✅ Avoid same-level redundancy

**4. Instant Match System:**
- ✅ Swipe UI (Tinder-style)
- ✅ Accept/Skip/Block actions
- ✅ Immediate notifications on match
- ✅ Auto-create private chat on accept
- ✅ Match expiry (7 days if no action)

**5. Smart Ranking System:**
- ✅ Rank by compatibility score
- ✅ Last active users first
- ✅ Shared courses bonus
- ✅ Similar goals priority
- ✅ Geographic proximity (optional)

**6. Skip/Block/Report System:**
- ✅ Skip user (won't show again for 30 days)
- ✅ Block user (permanent)
- ✅ Report user (with reason)
- ✅ Admin moderation queue

**7. Auto-Match Background Jobs:**
- ✅ Runs every 6 hours automatically
- ✅ Generates compatible matches
- ✅ Stores in database
- ✅ Sends push notifications
- ✅ Creates daily suggestion groups

**8. Match Analytics:**
- ✅ Track match success rate
- ✅ User compatibility history
- ✅ Algorithm performance metrics
- ✅ A/B testing support

---

## 🏗️ Optimized Architecture (AI + Auto-Jobs)

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js 15 + Framer Motion)                  │
│  - Swipe UI with smooth animations                      │
│  - Optimistic updates                                   │
│  - Real-time match notifications                        │
│  - Daily suggestions feed                               │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  AI MATCHING ENGINE (Gemini AI)                         │
│  - Analyze user preferences                             │
│  - Predict compatibility                                │
│  - Generate personalized suggestions                    │
│  - Learning progress analysis                           │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  CACHE LAYER (Upstash Redis)                            │
│  - Match candidates cache (1 hour)                      │
│  - Daily suggestions cache                              │
│  - Skip/block lists (instant check)                     │
│  - Compatibility scores cache                           │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  BACKGROUND JOBS (Vercel Cron + Inngest)                │
│  - Auto-match job (every 6 hours)                       │
│  - Daily suggestions (every day at 8 AM)                │
│  - Cleanup expired matches (daily)                      │
│  - Delete unused temp groups (hourly)                   │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  DATABASE (Neon PostgreSQL - Optimized)                 │
│  - Match history with scores                            │
│  - User preferences indexed                             │
│  - Learning progress tracking                           │
│  - Skip/block records                                   │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  NOTIFICATIONS (Knock.app - Already from Week 7)        │
│  - Instant match notifications                          │
│  - Daily suggestion alerts                              │
│  - New message from match                               │
│  - Match accepted/rejected                              │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  REAL-TIME CHAT (Stream Chat - Week 6)                  │
│  - Auto-create DM on match accept                       │
│  - Temp group for daily suggestions                     │
│  - File sharing enabled                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ External Services (Load Management)

### 1. **Inngest** (Background Jobs - RECOMMENDED)

**Why Inngest:**
- ✅ Serverless background jobs
- ✅ Cron scheduling built-in
- ✅ Retry logic automatic
- ✅ Event-driven architecture
- ✅ Dashboard for monitoring
- ✅ Free tier: 50K events/month

**Pricing:**
- Free: 50K events/month
- Pro: $50/month - 1M events

**Setup:**

```bash
npm install inngest
```

**Jobs:**
1. **Auto-Match Job** (every 6 hours)
2. **Daily Suggestions** (every day at 8 AM)
3. **Cleanup Expired Matches** (daily)
4. **Delete Temp Groups** (hourly)

**Alternative:** Quirrel (open-source), BullMQ (needs Redis)

---

### 2. **Gemini AI** (Already setup - for Intelligence)

**For Matching:**
- Analyze user preferences
- Predict compatibility
- Generate personalized reasons
- Learning progress analysis

**Features:**
- Free tier available
- Fast responses
- Embeddings for similarity

---

### 3. **Knock.app** (Already from Week 7)

**For Notifications:**
- Match found notification
- Daily suggestions alert
- Match accepted/rejected
- New message from partner

**Workflows:**
- `match-found` - Instant notification
- `daily-suggestions` - 8 AM every day
- `match-accepted` - Both users notified
- `chat-message` - New message alert

---

### 4. **Framer Motion** (Animations)

**Why Framer Motion:**
- ✅ Smooth swipe animations
- ✅ Card flip effects
- ✅ Gesture handling
- ✅ Spring animations
- ✅ Performance optimized

**Setup:**

```bash
npm install framer-motion
```

**Features:**
- Swipe cards
- Match reveal animation
- Compatibility score animation
- Skeleton loading

---

## 🗄️ Complete Database Schema (Prisma 6)

```prisma
// ═══════════════════════════════════════════════════════
// MATCHING SYSTEM MODELS
// ═══════════════════════════════════════════════════════

model UserPreferences {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Subjects & Interests
  subjects    String[] @default([])
  interests   String[] @default([])
  
  // Learning Progress (NEW - Advanced Feature)
  learningProgress Json?  // { "React": "intermediate", "Node": "beginner" }
  
  // Study Preferences
  studyTimes       String[] @default([])  // ["morning", "evening"]
  timezone         String?
  preferredGroupSize Int    @default(4)
  
  // Goals & Style
  goals           String[] @default([])
  learningStyle   LearningStyle @default(VISUAL)
  studyFrequency  String?      // "daily", "weekly", "weekend"
  
  // Availability
  availableDays   String[] @default([])  // ["monday", "wednesday"]
  hoursPerWeek    Int?
  
  // Preferences
  preferredLanguage String?
  lookingFor       String[] @default([])  // ["study-buddy", "mentor", "group"]
  
  // Metadata
  updatedAt   DateTime @updatedAt
  isActive    Boolean  @default(true)
  
  @@index([userId])
  @@map("user_preferences")
}

model Match {
  id          String      @id @default(cuid())
  
  // Users
  user1Id     String
  user2Id     String
  user1       User        @relation("MatchUser1", fields: [user1Id], references: [id], onDelete: Cascade)
  user2       User        @relation("MatchUser2", fields: [user2Id], references: [id], onDelete: Cascade)
  
  // Compatibility
  score       Float       // 0.0 to 1.0
  scoreBreakdown Json?    // Detailed scoring
  
  // Match Details
  matchedSubjects String[] @default([])
  matchReason     String?  @db.Text
  
  // Status
  status      MatchStatus @default(PENDING)
  
  // Actions
  initiatedBy String      // user1Id or user2Id
  respondedAt DateTime?
  
  // Expiry (NEW - 7 days)
  expiresAt   DateTime
  
  // Chat (NEW - Auto-create on accept)
  chatChannelId String?
  
  // Metadata
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  @@unique([user1Id, user2Id])
  @@index([user1Id, status])
  @@index([user2Id, status])
  @@index([status, expiresAt])
  @@index([createdAt])
  @@map("matches")
}

model MatchAction {
  id          String      @id @default(cuid())
  
  // Who acted
  userId      String
  user        User        @relation("MatchActions", fields: [userId], references: [id], onDelete: Cascade)
  
  // Target user
  targetUserId String
  targetUser   User       @relation("TargetMatchActions", fields: [targetUserId], references: [id], onDelete: Cascade)
  
  // Action type
  action      MatchActionType
  
  // Skip/Block details
  reason      String?
  expiresAt   DateTime?  // For skip (30 days), null for block
  
  createdAt   DateTime   @default(now())
  
  @@unique([userId, targetUserId, action])
  @@index([userId, action])
  @@index([targetUserId])
  @@index([expiresAt])
  @@map("match_actions")
}

model DailySuggestion {
  id          String   @id @default(cuid())
  
  // For user
  userId      String
  user        User     @relation("DailySuggestions", fields: [userId], references: [id], onDelete: Cascade)
  
  // Suggested users (top 3)
  suggestedUserIds String[]
  
  // Temp group (NEW - Auto-created)
  tempGroupId      String?
  tempGroupExpiry  DateTime?  // 24 hours from creation
  
  // Status
  viewed      Boolean  @default(false)
  viewedAt    DateTime?
  
  // Join tracking
  joined      Boolean  @default(false)
  joinedAt    DateTime?
  
  createdAt   DateTime @default(now())
  
  @@index([userId, createdAt])
  @@index([tempGroupId])
  @@index([tempGroupExpiry])
  @@map("daily_suggestions")
}

model MatchAnalytics {
  id          String   @id @default(cuid())
  
  // Match reference
  matchId     String
  
  // Users
  user1Id     String
  user2Id     String
  
  // Analytics
  score       Float
  accepted    Boolean
  responseTime Int?    // Seconds to respond
  
  // Algorithm version (for A/B testing)
  algorithmVersion String @default("v1")
  
  // Metadata
  createdAt   DateTime @default(now())
  
  @@index([user1Id])
  @@index([user2Id])
  @@index([accepted])
  @@index([algorithmVersion])
  @@map("match_analytics")
}

enum MatchStatus {
  PENDING
  ACCEPTED
  REJECTED
  EXPIRED
  CANCELLED
}

enum MatchActionType {
  SKIP
  BLOCK
  REPORT
}

enum LearningStyle {
  VISUAL
  AUDITORY
  KINESTHETIC
  READING_WRITING
  MIXED
}

// ═══════════════════════════════════════════════════════
// UPDATE USER MODEL
// ═══════════════════════════════════════════════════════

model User {
  // ... existing fields
  
  // NEW: Matching relations
  preferences          UserPreferences?
  matchesAsUser1       Match[]          @relation("MatchUser1")
  matchesAsUser2       Match[]          @relation("MatchUser2")
  matchActions         MatchAction[]    @relation("MatchActions")
  targetMatchActions   MatchAction[]    @relation("TargetMatchActions")
  dailySuggestions     DailySuggestion[] @relation("DailySuggestions")
  
  // NEW: Matching activity
  lastActive           DateTime         @default(now())
  matchingEnabled      Boolean          @default(true)
  
  // ... rest of fields
}
```

**Migration:**
```bash
npx prisma migrate dev --name add-smart-matching
npx prisma generate
```

---

## 📁 Complete File Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── matching/
│   │       ├── page.tsx                 # Main matching page (swipe UI)
│   │       ├── loading.tsx
│   │       │
│   │       ├── preferences/
│   │       │   └── page.tsx             # Set preferences
│   │       │
│   │       ├── suggestions/
│   │       │   └── page.tsx             # Daily suggestions (3 partners)
│   │       │
│   │       ├── matches/
│   │       │   └── page.tsx             # Accepted matches list
│   │       │
│   │       ├── history/
│   │       │   └── page.tsx             # Match history
│   │       │
│   │       └── analytics/
│   │           └── page.tsx             # Personal analytics
│   │
│   ├── api/
│   │   └── matching/
│   │       ├── preferences/
│   │       │   └── route.ts             # GET, PUT preferences
│   │       │
│   │       ├── find/
│   │       │   └── route.ts             # GET - Find matches
│   │       │
│   │       ├── daily-suggestions/
│   │       │   └── route.ts             # GET - Today's suggestions
│   │       │
│   │       ├── [matchId]/
│   │       │   ├── accept/
│   │       │   │   └── route.ts         # POST - Accept match
│   │       │   ├── reject/
│   │       │   │   └── route.ts         # POST - Reject match
│   │       │   └── skip/
│   │       │       └── route.ts         # POST - Skip user
│   │       │
│   │       ├── block/
│   │       │   └── route.ts             # POST - Block user
│   │       │
│   │       ├── report/
│   │       │   └── route.ts             # POST - Report user
│   │       │
│   │       ├── compatibility/
│   │       │   └── [userId]/
│   │       │       └── route.ts         # GET - Check compatibility
│   │       │
│   │       └── analytics/
│   │           └── route.ts             # GET - Match analytics
│   │
│   └── inngest/
│       └── route.ts                     # Inngest endpoint
│
├── components/
│   └── matching/
│       ├── swipe-card.tsx               # Tinder-style swipe card
│       ├── swipe-stack.tsx              # Stack of cards
│       ├── match-card.tsx               # Match display card
│       ├── preferences-form.tsx         # Preferences form
│       ├── compatibility-score.tsx      # Score visualization
│       ├── daily-suggestions-card.tsx   # 3 suggestions card
│       ├── temp-group-card.tsx          # 24hr temp group
│       ├── match-reason.tsx             # Why matched
│       ├── learning-progress.tsx        # Progress tracker
│       ├── action-buttons.tsx           # Accept/Skip/Block
│       ├── match-reveal.tsx             # Match animation
│       ├── matches-list.tsx             # Accepted matches
│       ├── analytics-dashboard.tsx      # Personal stats
│       └── empty-state.tsx              # No matches
│
├── inngest/
│   ├── client.ts                        # Inngest client
│   └── functions/
│       ├── auto-match.ts                # Run every 6 hours
│       ├── daily-suggestions.ts         # Run daily at 8 AM
│       ├── cleanup-expired.ts           # Run daily
│       └── delete-temp-groups.ts        # Run hourly
│
└── lib/
    └── matching/
        ├── algorithm.ts                 # Compatibility algorithm
        ├── scoring.ts                   # Score calculation
        ├── ai-analysis.ts               # Gemini AI integration
        ├── notifications.ts             # Knock integration
        └── utils.ts                     # Helper functions
```

---

## 🎯 Advanced Matching Algorithm (AI-Powered)

### Scoring Breakdown:

```typescript
// lib/matching/algorithm.ts

interface CompatibilityScore {
  total: number;        // 0-100
  breakdown: {
    subjects: number;         // 40 points
    learningProgress: number; // 25 points (NEW)
    studyTime: number;        // 15 points
    goals: number;            // 10 points
    skillLevel: number;       // 5 points
    learningStyle: number;    // 5 points
    activityBonus: number;    // +0-10 bonus
  };
  reasons: string[];    // Why matched
}

function calculateCompatibility(
  user1: UserWithPreferences,
  user2: UserWithPreferences
): CompatibilityScore {
  
  // 1. Subject Similarity (40 points)
  const commonSubjects = intersection(user1.subjects, user2.subjects);
  const subjectScore = (commonSubjects.length / 
    max(user1.subjects.length, user2.subjects.length)) * 40;
  
  // 2. Learning Progress Matching (25 points) - NEW
  const progressScore = calculateProgressMatch(
    user1.learningProgress,
    user2.learningProgress
  );
  
  // 3. Study Time Overlap (15 points)
  const timeOverlap = intersection(user1.studyTimes, user2.studyTimes);
  const timeScore = (timeOverlap.length / 
    max(user1.studyTimes.length, user2.studyTimes.length)) * 15;
  
  // 4. Goal Alignment (10 points)
  const commonGoals = intersection(user1.goals, user2.goals);
  const goalScore = (commonGoals.length / 
    max(user1.goals.length, user2.goals.length)) * 10;
  
  // 5. Skill Level (5 points)
  // Match complementary levels (beginner + intermediate = good)
  const skillScore = calculateSkillMatch(user1, user2);
  
  // 6. Learning Style (5 points)
  const styleScore = user1.learningStyle === user2.learningStyle ? 5 : 2;
  
  // 7. Activity Bonus (up to 10 points)
  const activityScore = calculateActivityBonus(user1, user2);
  
  const total = Math.round(
    subjectScore + progressScore + timeScore + 
    goalScore + skillScore + styleScore + activityScore
  );
  
  return {
    total,
    breakdown: {
      subjects: subjectScore,
      learningProgress: progressScore,
      studyTime: timeScore,
      goals: goalScore,
      skillLevel: skillScore,
      learningStyle: styleScore,
      activityBonus: activityScore,
    },
    reasons: generateMatchReasons(user1, user2, commonSubjects),
  };
}
```

---

### Learning Progress Matching (Advanced):

```typescript
// lib/matching/algorithm.ts

function calculateProgressMatch(
  progress1: Record<string, string>,
  progress2: Record<string, string>
): number {
  // Match complementary learning stages
  // Example: Beginner (learning) + Intermediate (revision) = Perfect
  
  const stages = {
    'beginner': 1,
    'intermediate': 2,
    'advanced': 3,
  };
  
  const commonSubjects = intersection(
    Object.keys(progress1),
    Object.keys(progress2)
  );
  
  if (commonSubjects.length === 0) return 0;
  
  let totalScore = 0;
  
  for (const subject of commonSubjects) {
    const level1 = stages[progress1[subject]];
    const level2 = stages[progress2[subject]];
    const diff = Math.abs(level1 - level2);
    
    // Perfect match: 1 level difference (can help each other)
    if (diff === 1) {
      totalScore += 10;
    }
    // Good match: same level (study together)
    else if (diff === 0) {
      totalScore += 7;
    }
    // Acceptable: 2 levels (mentor-mentee)
    else if (diff === 2) {
      totalScore += 4;
    }
  }
  
  return Math.min(25, totalScore / commonSubjects.length);
}
```

---

### AI-Enhanced Matching (Gemini):

```typescript
// lib/matching/ai-analysis.ts

async function generateMatchReasonsWithAI(
  user1: User,
  user2: User,
  score: CompatibilityScore
): Promise<string[]> {
  const prompt = `
    Analyze compatibility between two students:
    
    User 1:
    - Subjects: ${user1.subjects.join(', ')}
    - Learning: ${JSON.stringify(user1.learningProgress)}
    - Goals: ${user1.goals.join(', ')}
    
    User 2:
    - Subjects: ${user2.subjects.join(', ')}
    - Learning: ${JSON.stringify(user2.learningProgress)}
    - Goals: ${user2.goals.join(', ')}
    
    Compatibility Score: ${score.total}/100
    
    Generate 3 personalized reasons why they're a good match.
    Format: ["reason 1", "reason 2", "reason 3"]
  `;
  
  const response = await gemini.generateContent(prompt);
  return JSON.parse(response.text());
}
```

---

## 🤖 Background Jobs (Inngest)

### Setup Inngest:

```typescript
// inngest/client.ts
import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'studysync-ai',
  eventKey: process.env.INNGEST_EVENT_KEY,
});
```

---

### Job 1: Auto-Match (Every 6 Hours)

```typescript
// inngest/functions/auto-match.ts

inngest.createFunction(
  { id: 'auto-match-users' },
  { cron: '0 */6 * * *' }, // Every 6 hours
  async ({ step }) => {
    
    // 1. Get all active users with preferences
    const users = await step.run('fetch-active-users', async () => {
      return await prisma.user.findMany({
        where: {
          matchingEnabled: true,
          preferences: { isActive: true },
        },
        include: { preferences: true },
      });
    });
    
    // 2. Generate matches for each user
    await step.run('generate-matches', async () => {
      for (const user of users) {
        // Find compatible users
        const candidates = users.filter(u => {
          // Skip self
          if (u.id === user.id) return false;
          
          // Skip blocked users
          // Skip already matched users
          // Check compatibility score > 60
          
          return true;
        });
        
        // Calculate scores
        const scored = candidates.map(candidate => ({
          candidate,
          score: calculateCompatibility(user, candidate),
        })).filter(s => s.score.total >= 60);
        
        // Sort by score
        scored.sort((a, b) => b.score.total - a.score.total);
        
        // Take top 10
        const topMatches = scored.slice(0, 10);
        
        // Store matches
        for (const match of topMatches) {
          await prisma.match.create({
            data: {
              user1Id: user.id,
              user2Id: match.candidate.id,
              score: match.score.total / 100,
              scoreBreakdown: match.score.breakdown,
              matchReason: match.score.reasons.join('. '),
              initiatedBy: 'system',
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
        }
      }
    });
    
    // 3. Send notifications
    await step.run('send-notifications', async () => {
      // Notify users about new matches
      await knock.workflows.trigger('new-matches-available', {
        recipients: users.map(u => u.id),
      });
    });
    
    return { matched: users.length };
  }
);
```

---

### Job 2: Daily Suggestions (Every Day 8 AM)

```typescript
// inngest/functions/daily-suggestions.ts

inngest.createFunction(
  { id: 'daily-study-suggestions' },
  { cron: '0 8 * * *' }, // Every day at 8 AM
  async ({ step }) => {
    
    const users = await step.run('fetch-users', async () => {
      return await prisma.user.findMany({
        where: { matchingEnabled: true },
        include: { preferences: true },
      });
    });
    
    for (const user of users) {
      await step.run(`suggestions-${user.id}`, async () => {
        
        // 1. Find top 3 compatible users
        const matches = await findTopMatches(user, 3);
        
        if (matches.length === 0) return;
        
        // 2. Create temporary group
        const tempGroup = await prisma.studyGroup.create({
          data: {
            name: `Daily Study Group - ${new Date().toLocaleDateString()}`,
            description: 'Auto-generated suggestion group. Join within 24 hours!',
            privacy: 'INVITE_ONLY',
            creatorId: 'system',
            maxMembers: 4,
          },
        });
        
        // 3. Create Stream Chat channel
        const chatChannel = await streamChat.createChannel(
          'messaging',
          `temp-${tempGroup.id}`,
          {
            name: tempGroup.name,
            auto_delete: true,
            delete_after: 86400, // 24 hours
          }
        );
        
        // 4. Save suggestion
        await prisma.dailySuggestion.create({
          data: {
            userId: user.id,
            suggestedUserIds: matches.map(m => m.id),
            tempGroupId: tempGroup.id,
            tempGroupExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
        
        // 5. Notify user
        await knock.workflows.trigger('daily-suggestions-ready', {
          recipients: [user.id],
          data: {
            suggestedUsers: matches.map(m => m.name),
            groupId: tempGroup.id,
          },
        });
      });
    }
    
    return { processed: users.length };
  }
);
```

---

### Job 3: Cleanup Expired Matches (Daily)

```typescript
// inngest/functions/cleanup-expired.ts

inngest.createFunction(
  { id: 'cleanup-expired-matches' },
  { cron: '0 0 * * *' }, // Every day at midnight
  async ({ step }) => {
    
    // Update expired matches
    const result = await step.run('mark-expired', async () => {
      return await prisma.match.updateMany({
        where: {
          status: 'PENDING',
          expiresAt: { lt: new Date() },
        },
        data: { status: 'EXPIRED' },
      });
    });
    
    return { expired: result.count };
  }
);
```

---

### Job 4: Delete Temp Groups (Hourly)

```typescript
// inngest/functions/delete-temp-groups.ts

inngest.createFunction(
  { id: 'delete-temp-groups' },
  { cron: '0 * * * *' }, // Every hour
  async ({ step }) => {
    
    // Find expired temp groups
    const expired = await step.run('find-expired', async () => {
      return await prisma.dailySuggestion.findMany({
        where: {
          tempGroupExpiry: { lt: new Date() },
          joined: false, // Not joined
          tempGroupId: { not: null },
        },
      });
    });
    
    // Delete groups
    await step.run('delete-groups', async () => {
      for (const suggestion of expired) {
        // Delete Stream Chat channel
        await streamChat.deleteChannel(suggestion.tempGroupId);
        
        // Delete group from DB
        await prisma.studyGroup.delete({
          where: { id: suggestion.tempGroupId },
        });
        
        // Clear tempGroupId
        await prisma.dailySuggestion.update({
          where: { id: suggestion.id },
          data: { tempGroupId: null },
        });
      }
    });
    
    return { deleted: expired.length };
  }
);
```

---

## 🎨 Swipe UI Design (Tinder-Style)

### Main Matching Page:

```
┌──────────────────────────────────────────────────────┐
│  Find Your Study Partner                        [⚙️] │
│  ──────────────────────────────────────────────────  │
│                                                       │
│        ┌───────────────────────────────┐            │
│        │  [User Card - Swipeable]      │            │
│        │                               │            │
│        │  📷 Profile Picture           │            │
│        │                               │            │
│        │  Sarah Chen                   │            │
│        │  Computer Science • 2nd Year │            │
│        │                               │            │
│        │  📚 Common: React, Node.js    │            │
│        │  🎯 Goal: Build Projects      │            │
│        │  ⏰ Study: Evenings           │            │
│        │                               │            │
│        │  💯 95% Match                │            │
│        │  "Both learning React hooks" │            │
│        └───────────────────────────────┘            │
│                                                       │
│        [❌ Skip]  [⭐ Super Like]  [✅ Accept]       │
│                                                       │
│        Progress: 3/10 candidates today              │
└──────────────────────────────────────────────────────┘

Animations:
- Swipe right: Accept (green glow)
- Swipe left: Skip (fade out)
- Swipe up: Block (red flash)
- Double tap: View full profile
- Smooth spring animations
```

---

### Match Reveal Animation:

```
┌──────────────────────────────────────────────────────┐
│                                                       │
│              ✨ IT'S A MATCH! ✨                     │
│                                                       │
│     ┌──────────┐              ┌──────────┐          │
│     │   You    │      ❤️      │  Sarah   │          │
│     │  [Photo] │              │ [Photo]  │          │
│     └──────────┘              └──────────┘          │
│                                                       │
│         You both want to study React!                │
│         Compatibility: 95%                           │
│                                                       │
│         [Send Message] [View Profile]                │
│                                                       │
└──────────────────────────────────────────────────────┘

Animation:
- Cards fly in from sides
- Heart pulses
- Confetti particles
- Auto-redirect to chat after 3s
```

---

### Daily Suggestions Page:

```
┌──────────────────────────────────────────────────────┐
│  Today's Study Partner Suggestions        🎯 3/3     │
│  ──────────────────────────────────────────────────  │
│                                                       │
│  These 3 partners are perfect for you today!         │
│  Join the group within 24 hours or it disappears.    │
│                                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │  Temporary Study Group                         │ │
│  │  Expires in: 18h 45m                          │ │
│  │                                                │ │
│  │  👥 Members (auto-selected):                  │ │
│  │  • Sarah Chen (React intermediate)            │ │
│  │  • Mike Wang (Node.js beginner)               │ │
│  │  • Lisa Park (Full-stack learning)            │ │
│  │                                                │ │
│  │  Why this group?                              │ │
│  │  ✅ All learning MERN stack                  │ │
│  │  ✅ Complementary skill levels                │ │
│  │  ✅ Available evenings                        │ │
│  │                                                │ │
│  │  [Join Group Chat] [Skip Today]              │ │
│  └────────────────────────────────────────────────┘ │
│                                                       │
│  Tomorrow's suggestions ready at 8 AM                │
└──────────────────────────────────────────────────────┘
```

---

## 📊 Compatibility Breakdown UI:

```
┌──────────────────────────────────────────────────────┐
│  Compatibility with Sarah Chen                       │
│  ──────────────────────────────────────────────────  │
│                                                       │
│  Overall Score: 95/100 🔥                            │
│                                                       │
│  Breakdown:                                          │
│  ╔════════════════════════════════════════╗         │
│  ║ Subjects          ████████████ 38/40  ║         │
│  ║ Learning Progress █████████░░ 22/25   ║         │
│  ║ Study Time        ███████░░░░ 12/15   ║         │
│  ║ Goals             ████████░░ 9/10     ║         │
│  ║ Skill Level       ████░░░░░░ 4/5      ║         │
│  ║ Learning Style    █████░░░░░ 5/5      ║         │
│  ║ Activity Bonus    █████░░░░░ +5       ║         │
│  ╚════════════════════════════════════════╝         │
│                                                       │
│  Match Reasons:                                      │
│  • Both learning React hooks and state management    │
│  • You're beginner, Sarah is intermediate (perfect!) │
│  • Both prefer evening study sessions                │
│  • Similar goal: Build real-world projects           │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Indexes (Critical)

```sql
-- Run in Neon SQL Editor

-- User preferences
CREATE INDEX CONCURRENTLY idx_user_preferences_user 
ON user_preferences(user_id);

CREATE INDEX CONCURRENTLY idx_user_preferences_active 
ON user_preferences(is_active);

-- Matches
CREATE INDEX CONCURRENTLY idx_matches_user1_status 
ON matches(user1_id, status);

CREATE INDEX CONCURRENTLY idx_matches_user2_status 
ON matches(user2_id, status);

CREATE INDEX CONCURRENTLY idx_matches_expiry 
ON matches(status, expires_at);

CREATE INDEX CONCURRENTLY idx_matches_score 
ON matches(score DESC);

-- Match actions
CREATE INDEX CONCURRENTLY idx_match_actions_user 
ON match_actions(user_id, action);

CREATE INDEX CONCURRENTLY idx_match_actions_target 
ON match_actions(target_user_id);

CREATE INDEX CONCURRENTLY idx_match_actions_expiry 
ON match_actions(expires_at);

-- Daily suggestions
CREATE INDEX CONCURRENTLY idx_daily_suggestions_user 
ON daily_suggestions(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_daily_suggestions_temp_group 
ON daily_suggestions(temp_group_id);

CREATE INDEX CONCURRENTLY idx_daily_suggestions_expiry 
ON daily_suggestions(temp_group_expiry);

-- Users (for matching)
CREATE INDEX CONCURRENTLY idx_users_last_active 
ON users(last_active DESC);

CREATE INDEX CONCURRENTLY idx_users_matching_enabled 
ON users(matching_enabled);
```

---

## 🧪 Complete Testing Checklist

### Preferences:
- [ ] Set learning preferences
- [ ] Update subjects
- [ ] Set study times
- [ ] Track learning progress
- [ ] Save successfully

### Matching:
- [ ] Find compatible users
- [ ] Calculate scores correctly
- [ ] Swipe right (accept)
- [ ] Swipe left (skip)
- [ ] Block user
- [ ] Report user
- [ ] View compatibility breakdown

### Matches:
- [ ] Match notification received
- [ ] Auto-create chat on accept
- [ ] Both users notified
- [ ] Chat opens automatically
- [ ] Match expires after 7 days

### Daily Suggestions:
- [ ] Receive at 8 AM
- [ ] 3 users suggested
- [ ] Temp group created
- [ ] 24hr countdown shows
- [ ] Group deleted if not joined
- [ ] Group persists if joined

### Background Jobs:
- [ ] Auto-match runs every 6 hours
- [ ] Daily suggestions at 8 AM
- [ ] Expired matches cleaned
- [ ] Temp groups deleted hourly
- [ ] Notifications sent

### UI/UX:
- [ ] Swipe animations smooth
- [ ] Match reveal animation
- [ ] Compatibility score visual
- [ ] Loading states
- [ ] Empty states
- [ ] Mobile responsive

---

## 💰 Cost Estimate (1000 Users)

| Service | Cost/Month |
|---------|------------|
| Inngest (Jobs) | $0 (< 50K events) |
| Knock.app | $0 (from Week 7) |
| Stream Chat | $99 (from Week 6) |
| Gemini AI | $0 (free tier) |
| Neon PostgreSQL | $69 (existing) |
| Upstash Redis | $5 (existing) |
| **Total NEW** | **$0** |

**No additional cost!** 🎉

---

## 🎯 Performance Targets

✅ **Find matches:** < 200ms (cached)  
✅ **Calculate score:** < 50ms  
✅ **Swipe action:** < 100ms (optimistic)  
✅ **Match notification:** < 1 sec  
✅ **Create chat:** < 300ms (auto)  
✅ **Daily suggestions:** 8 AM sharp  
✅ **Background job:** Completes in < 5 min  
✅ **Smooth animations:** 60 FPS

---

Daily at 8 AM:
1. Find top 3 compatible users
2. Create temporary StudyGroup
3. Create Stream Chat channel (24hr TTL)
4. Send notifications
5. Auto-delete after 24hr (hourly cleanup job)
6. Delete from DB if not joined

here group is automatically delete within 1 hr if no one joined or after 24 hr if someone joined delete the group

## 🚀 Implementation Timeline

```
Days 1-2:   Schema + Preferences UI
Days 3-4:   Matching Algorithm + AI
Days 5-6:   Swipe UI + Animations
Days 7-8:   Background Jobs (Inngest)
Days 9-10:  Daily Suggestions + Temp Groups
Days 11-12: Notifications + Chat Integration
Days 13-14: Testing + Polish

Total: 14 days
```

---

## 💡 Advanced Features Summary

### ✅ **Implemented Features:**

1. **AI-Powered Matching** - Gemini analysis
2. **Learning Progress Matching** - Stage-based pairing
3. **Daily Suggestions** - Auto 3 partners every day
4. **Temp Groups** - 24hr auto-delete groups
5. **Auto-Match Jobs** - Every 6 hours background
6. **Instant Notifications** - All events
7. **Auto Chat Creation** - On match accept
8. **Swipe UI** - Tinder-style smooth
9. **Smart Ranking** - Multi-factor scoring
10. **Skip/Block/Report** - Full moderation
11. **Match Expiry** - 7-day timeout
12. **Compatibility Breakdown** - Detailed UI
13. **Match Analytics** - Track success
14. **Activity Bonus** - Recent users prioritized

---

**Complete Week 8 with AI, auto-jobs, daily suggestions, swipe UI, zero manual work, instant notifications, and full optimization!** 🎯🚀

All latest versions, external services, zero server load, smooth 60 FPS animations! 💯
