# Week 3: Dashboard Layout + User Profile System

## 📋 Overview

**Duration:** 7-10 days  
**Prerequisites:** Week 1-2 (Landing + Authentication) must be complete  
**Goal:** Build complete user dashboard with profile management  
**Status:** Frontend + Backend both included

---

## ✅ What's Already Done (Week 2)

Before starting Week 3, make sure these are working:

- ✅ User can signup with email
- ✅ User can login with credentials
- ✅ Email verification works
- ✅ Password reset works
- ✅ Session management working
- ✅ User data stored in database
- ✅ Protected routes middleware exists

---

## 🔄 Changes Needed After Week 2

### 1. **Update Middleware** (`middleware.ts`)

**Current:** Only checks if user is authenticated  
**Need to Add:**
- Check user role for admin routes (Week 11 preparation)
- Redirect authenticated users away from auth pages
- Add dashboard routes to protected paths

**Protected Routes to Add:**
```typescript
// Add these routes to matcher
matcher: [
  '/dashboard/:path*',      // Main dashboard
  '/profile/:path*',        // User profile
  '/settings/:path*',       // User settings
  '/materials/:path*',      // Week 4
  '/ai-assistant/:path*',   // Week 5
  '/chat/:path*',           // Week 6
  '/groups/:path*',         // Week 7
  '/matching/:path*',       // Week 8
  '/quizzes/:path*',        // Week 9
  '/analytics/:path*',      // Week 10
  '/admin/:path*'           // Week 11
]
```

**Redirect Logic:**
```typescript
// If user is logged in and tries to access /login or /signup
// Redirect them to /dashboard

// If user is not logged in and tries to access /dashboard
// Redirect them to /login
```

---

### 2. **Update Prisma Schema** (Add to existing User model)

**File:** `prisma/schema.prisma`

**Add these fields to User model:**
```prisma
model User {
  // ... existing fields (id, name, email, etc.)
  
  // NEW: Profile completion tracking
  profileCompleted   Boolean   @default(false)
  
  // NEW: Avatar/Profile picture
  avatar             String?   // URL to uploaded image
  
  // NEW: Cover photo for profile
  coverPhoto         String?
  
  // NEW: Additional profile fields
  phoneNumber        String?
  dateOfBirth        DateTime?
  gender             Gender?
  location           String?   // City, Country
  
  // NEW: Academic details (already there but make sure)
  university         String?
  major              String?
  graduationYear     Int?
  currentYear        String?   // "1st Year", "2nd Year", etc.
  
  // NEW: Social links
  linkedinUrl        String?
  githubUrl          String?
  twitterUrl         String?
  websiteUrl         String?
  
  // NEW: Study preferences
  preferredStudyTime String?   // "Morning", "Evening", etc.
  studyGoals         String[]  @default([])
  subjects           String[]  @default([])
  
  // ... rest of existing fields
}

enum Gender {
  MALE
  FEMALE
  OTHER
  PREFER_NOT_TO_SAY
}
```

**Run Migration:**
```bash
npx prisma migrate dev --name add-profile-fields
npx prisma generate
```

---

### 3. **Update Session Object**

**File:** `src/lib/auth.ts` (NextAuth config)

**Add to callbacks:**
```typescript
callbacks: {
  session: async ({ session, token }) => {
    if (session.user) {
      session.user.id = token.sub
      session.user.role = token.role
      session.user.avatar = token.avatar      // NEW
      session.user.profileCompleted = token.profileCompleted  // NEW
    }
    return session
  },
  jwt: async ({ token, user }) => {
    if (user) {
      token.role = user.role
      token.avatar = user.avatar              // NEW
      token.profileCompleted = user.profileCompleted  // NEW
    }
    return token
  }
}
```

---

### 4. **Create Global Navigation State** (Optional but recommended)

**Why:** Dashboard sidebar needs to know active route

**Options:**
1. Use Zustand (recommended)
2. Use React Context
3. Use URL pathname (simplest)

---

## 🎯 Week 3 Goals

### What We're Building:

#### **Frontend (7 pages + components):**
1. Dashboard Layout (sidebar + header)
2. Dashboard Home (overview)
3. User Profile (public view)
4. Edit Profile (form)
5. Settings (account, privacy, notifications)
6. Search Users (global search)
7. View Other User Profile

#### **Backend (5 API routes):**
1. Get current user profile
2. Update user profile
3. Upload avatar/cover photo
4. Search users
5. Get user by ID

---

## 🎨 Design System Updates

### New Colors for Dashboard:

```css
/* Sidebar background */
--sidebar-bg: 250 40% 98%           /* Light mode: very light purple */
--sidebar-bg-dark: 222.2 84% 4.9%   /* Dark mode: navy */

/* Sidebar active item */
--sidebar-active: 262.1 83.3% 57.8%  /* Primary purple */

/* Stats card colors */
--stats-blue: 217 91% 60%      /* For study time */
--stats-green: 142 76% 36%     /* For progress */
--stats-orange: 25 95% 53%     /* For achievements */
--stats-purple: 262 83% 58%    /* For materials */
```

### Dashboard Spacing:

```css
/* Sidebar width */
--sidebar-width: 16rem          /* 256px - desktop */
--sidebar-width-collapsed: 4rem /* 64px - collapsed state */

/* Header height */
--header-height: 4rem           /* 64px */

/* Content padding */
--content-padding: 1.5rem       /* 24px mobile */
--content-padding-desktop: 2rem /* 32px desktop */
```

---

## 📁 File Structure (Week 3 Only)

```
src/
├── app/
│   ├── (dashboard)/                    # Route group for dashboard
│   │   ├── layout.tsx                 # Dashboard layout (sidebar + header)
│   │   │
│   │   ├── dashboard/                 # Main dashboard home
│   │   │   ├── page.tsx              # Dashboard overview
│   │   │   └── loading.tsx           # Loading skeleton
│   │   │
│   │   ├── profile/                   # User profile section
│   │   │   ├── page.tsx              # Current user profile (redirects to /profile/[userId])
│   │   │   ├── edit/
│   │   │   │   └── page.tsx          # Edit profile form
│   │   │   └── [userId]/
│   │   │       └── page.tsx          # View any user's profile
│   │   │
│   │   └── settings/                  # User settings
│   │       ├── page.tsx              # Settings layout
│   │       ├── account/
│   │       │   └── page.tsx          # Account settings (email, password)
│   │       ├── profile/
│   │       │   └── page.tsx          # Profile settings (bio, social links)
│   │       ├── privacy/
│   │       │   └── page.tsx          # Privacy settings
│   │       └── notifications/
│   │           └── page.tsx          # Notification preferences
│   │
│   └── api/
│       ├── users/
│       │   ├── me/
│       │   │   └── route.ts          # GET/PATCH - Current user
│       │   ├── [userId]/
│       │   │   └── route.ts          # GET - User by ID
│       │   └── search/
│       │       └── route.ts          # GET - Search users
│       │
│       └── upload/
│           ├── avatar/
│           │   └── route.ts          # POST - Upload avatar
│           └── cover/
│               └── route.ts          # POST - Upload cover photo
│
├── components/
│   ├── dashboard/
│   │   ├── sidebar.tsx               # Left sidebar navigation
│   │   ├── sidebar-item.tsx          # Single nav item
│   │   ├── header.tsx                # Top header bar
│   │   ├── user-menu.tsx             # User dropdown (top right)
│   │   ├── search-bar.tsx            # Global search
│   │   ├── stats-card.tsx            # Dashboard stats card
│   │   ├── activity-feed.tsx         # Recent activity list
│   │   ├── quick-actions.tsx         # Quick action buttons
│   │   └── mobile-nav.tsx            # Bottom nav for mobile
│   │
│   ├── profile/
│   │   ├── profile-header.tsx        # Profile banner + avatar
│   │   ├── profile-info.tsx          # User info display
│   │   ├── profile-tabs.tsx          # About, Materials, Activity tabs
│   │   ├── edit-profile-form.tsx     # Profile edit form
│   │   ├── avatar-upload.tsx         # Avatar upload with preview
│   │   ├── cover-upload.tsx          # Cover photo upload
│   │   ├── social-links.tsx          # Social media links
│   │   └── profile-stats.tsx         # Profile statistics
│   │
│   └── settings/
│       ├── settings-nav.tsx          # Settings sidebar
│       ├── account-form.tsx          # Account settings form
│       ├── profile-form.tsx          # Profile settings form
│       ├── privacy-form.tsx          # Privacy settings
│       └── notification-form.tsx     # Notification preferences
│
└── lib/
    └── upload.ts                     # File upload utilities
```

---

## 🏗️ Dashboard Layout Structure

### Route: `/(dashboard)/layout.tsx`

**Layout Hierarchy:**
```
┌──────────────────────────────────────────────────────┐
│  Sidebar (Fixed Left)          │  Main Content       │
│  - Logo                         │  ┌───────────────┐ │
│  - Navigation Items             │  │  Header       │ │
│  - User Section                 │  │  - Breadcrumb │ │
│                                 │  │  - Search     │ │
│  Desktop: 256px width           │  │  - User Menu  │ │
│  Mobile: Hidden (drawer)        │  └───────────────┘ │
│                                 │                     │
│                                 │  ┌───────────────┐ │
│                                 │  │               │ │
│                                 │  │  Page Content │ │
│                                 │  │               │ │
│                                 │  │               │ │
│                                 │  └───────────────┘ │
└──────────────────────────────────────────────────────┘

Mobile Layout:
┌──────────────────────────────────┐
│  Header (with hamburger)         │
├──────────────────────────────────┤
│                                  │
│  Page Content                    │
│                                  │
├──────────────────────────────────┤
│  Bottom Navigation (4-5 items)   │
└──────────────────────────────────┘
```

---

## 🧭 Sidebar Navigation

### Navigation Items Structure:

```typescript
type NavItem = {
  label: string
  icon: LucideIcon
  href: string
  badge?: number        // For notification counts
  disabled?: boolean    // For features not yet built
}

const navigationItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/dashboard"
  },
  {
    label: "Materials",
    icon: BookOpen,
    href: "/materials",
    disabled: true    // Week 4
  },
  {
    label: "AI Assistant",
    icon: Bot,
    href: "/ai-assistant",
    disabled: true    // Week 5
  },
  {
    label: "Chat",
    icon: MessageSquare,
    href: "/chat",
    badge: 5,         // Unread count
    disabled: true    // Week 6
  },
  {
    label: "Groups",
    icon: Users,
    href: "/groups",
    disabled: true    // Week 7
  },
  {
    label: "Matching",
    icon: Heart,
    href: "/matching",
    disabled: true    // Week 8
  },
  {
    label: "Quizzes",
    icon: Award,
    href: "/quizzes",
    disabled: true    // Week 9
  },
  {
    label: "Analytics",
    icon: BarChart,
    href: "/analytics",
    disabled: true    // Week 10
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings"
  }
]
```

### Sidebar States:

**Desktop:**
- Default: Expanded (256px width)
- Collapsed: Icons only (64px width)
- Toggle button to collapse/expand

**Mobile:**
- Hidden by default
- Slide-in drawer from left
- Overlay background when open
- Close on navigation or outside click

### Sidebar Bottom Section:

```
┌─────────────────────────┐
│  User Profile Card      │
│  ┌─────┬──────────────┐ │
│  │ AVA │  User Name   │ │
│  │ TAR │  user@email  │ │
│  └─────┴──────────────┘ │
│  [Profile] [Logout]     │
└─────────────────────────┘
```

---

## 📊 Dashboard Home Page

### Route: `/dashboard`

**Page Sections:**

#### 1. Welcome Section
```
┌────────────────────────────────────────┐
│  Good Morning, John! 👋                 │
│  Here's your learning overview         │
└────────────────────────────────────────┘
```

#### 2. Stats Cards (4 cards in row, 2x2 on mobile)

**Card 1: Study Time**
- Icon: Clock
- Title: "Study Time"
- Value: "12.5 hours"
- Subtitle: "This week"
- Trend: "+2.5h from last week" (with up arrow)
- Color: Blue

**Card 2: Materials**
- Icon: BookOpen
- Title: "Study Materials"
- Value: "24"
- Subtitle: "Total uploaded"
- Trend: "+3 this week"
- Color: Purple

**Card 3: Quiz Score**
- Icon: Award
- Title: "Average Score"
- Value: "85%"
- Subtitle: "Last 5 quizzes"
- Trend: "+5% improvement"
- Color: Green

**Card 4: Streak**
- Icon: Flame
- Title: "Study Streak"
- Value: "7 days"
- Subtitle: "Keep it going!"
- Trend: "Personal best!"
- Color: Orange

#### 3. Quick Actions (4 buttons in grid)

```
┌─────────────┬─────────────┐
│ Upload      │ Start AI    │
│ Material    │ Chat        │
├─────────────┼─────────────┤
│ Create      │ Take        │
│ Group       │ Quiz        │
└─────────────┴─────────────┘
```

Each button:
- Icon
- Label
- Hover effect (scale + shadow)
- Disabled state if feature not ready

#### 4. Recent Activity Feed

**Timeline Style:**
```
○ 2 hours ago
  Uploaded "Operating Systems Notes.pdf"
  
○ Yesterday
  Completed Quiz: Data Structures (Score: 90%)
  
○ 2 days ago
  Joined study group "CS Fundamentals"
  
○ 3 days ago
  Chatted with AI Assistant about algorithms
```

**Each activity:**
- Timestamp
- Action description
- Icon based on activity type
- Click to view details

#### 5. Recommended for You (Optional)

```
Suggestions based on your activity:
- Join "Web Development" group
- Take quiz on "React Hooks"
- Upload more materials for better AI assistance
```

---

## 👤 User Profile Pages

### 1. Current User Profile: `/profile`

**Behavior:**
- This route automatically redirects to `/profile/[currentUserId]`
- Shows current user's own profile
- Has "Edit Profile" button visible

---

### 2. View Any User Profile: `/profile/[userId]`

**Profile Header:**
```
┌────────────────────────────────────────────────────────┐
│  [Cover Photo - 1200x300]                              │
│                                                        │
│    ┌─────────┐                                        │
│    │         │                                        │
│    │ Avatar  │  John Doe                 [Edit]      │
│    │ 150x150 │  @johndoe                             │
│    │         │  Computer Science Student              │
│    └─────────┘  Stanford University                   │
│                                                        │
│  📍 San Francisco, CA  🎓 Class of 2025               │
│  🔗 linkedin.com/in/johndoe                           │
└────────────────────────────────────────────────────────┘
```

**Profile Stats Row:**
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   24         │   156        │   12         │   850        │
│ Materials    │ Study Hours  │ Groups       │ XP Points    │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**Tabs:**
1. **About** (Default)
   - Bio/Description
   - Academic info (university, major, year)
   - Study goals
   - Subjects of interest
   - Social links (clickable)
   - Member since date

2. **Materials** (Week 4 feature)
   - List of public materials shared by user
   - Grid view with thumbnails
   - Shows: "This user hasn't shared any materials yet"

3. **Activity** (Week 10 feature)
   - Recent activity timeline
   - Achievements earned
   - Study streak
   - Shows: "Activity data will be available soon"

**Conditional Elements:**
- If viewing own profile: Show "Edit Profile" button
- If viewing other's profile: Show "Send Message" button (Week 6)
- If viewing other's profile: Show "Add to Group" button (Week 7)

---

### 3. Edit Profile: `/profile/edit`

**Protected:** Only accessible if user is viewing their own profile

**Form Sections:**

#### Section 1: Profile Photos
```
┌───────────────────────────────────────┐
│  Cover Photo                          │
│  [Upload new cover] [Remove]          │
│  Recommended: 1200x300px              │
│                                       │
│  Profile Picture                      │
│  [   Avatar   ]                       │
│  [Upload new] [Remove]                │
│  Recommended: 400x400px               │
└───────────────────────────────────────┘
```

#### Section 2: Basic Info
- Full Name (required)
- Username/Handle (unique, lowercase, no spaces)
- Bio (textarea, max 500 chars, character count)
- Phone Number (optional, with country code)
- Date of Birth (date picker)
- Gender (dropdown: Male, Female, Other, Prefer not to say)
- Location (City, Country)

#### Section 3: Academic Info
- University (text input with autocomplete)
- Major/Field of Study
- Current Year (dropdown: 1st, 2nd, 3rd, 4th, Graduate)
- Expected Graduation Year (year picker: 2024-2035)

#### Section 4: Social Links
- LinkedIn URL
- GitHub URL
- Twitter/X URL
- Personal Website URL

**Validation:**
- All URLs must be valid format
- Username must be unique (check on blur)
- Show character count for bio
- Date of birth: Must be at least 13 years old

**Buttons:**
- "Save Changes" (primary)
- "Cancel" (go back)

**Auto-save Draft:**
- Save form state to localStorage every 30 seconds
- Show "Draft saved" indicator
- Restore draft if user navigates away and comes back

---

## ⚙️ Settings Pages

### Route: `/settings`

**Layout:**
```
┌────────────────────────────────────────────────────┐
│  Settings                                          │
│                                                    │
│  Sidebar          │  Content Area                 │
│  ┌──────────────┐ │  ┌──────────────────────────┐│
│  │ Account      │ │  │                          ││
│  │ Profile      │ │  │  Settings Form           ││
│  │ Privacy      │ │  │                          ││
│  │ Notifications│ │  │                          ││
│  │ Appearance   │ │  │                          ││
│  └──────────────┘ │  └──────────────────────────┘│
└────────────────────────────────────────────────────┘
```

---

### 1. Account Settings: `/settings/account`

**Email Management:**
- Current email: user@example.com (verified ✓)
- [Change email] button
  - Opens modal with new email input
  - Sends verification to new email
  - Shows: "Verification pending" until confirmed

**Password Management:**
- Last changed: 2 months ago
- [Change password] button
  - Opens modal with 3 fields:
    - Current password
    - New password (with strength meter)
    - Confirm new password
  - Validates on submit

**Account Deletion:**
- [Delete Account] button (red, at bottom)
- Opens confirmation dialog:
  - "Are you sure? This action cannot be undone."
  - "Type DELETE to confirm"
  - Text input for confirmation
  - [Cancel] [Delete permanently]

---

### 2. Profile Settings: `/settings/profile`

**Public Profile Visibility:**
- Toggle: "Make my profile public"
- Description: "Allow others to view your profile"

**Profile Information Display:**
- Toggle: "Show email on profile"
- Toggle: "Show phone number on profile"
- Toggle: "Show social links on profile"
- Toggle: "Show study stats on profile"

**Discovery Settings:**
- Toggle: "Allow others to find me by email"
- Toggle: "Show me in user search results"
- Toggle: "Allow others to see my online status"

---

### 3. Privacy Settings: `/settings/privacy`

**Who can contact me:**
- Radio options:
  - Everyone
  - Only people in my groups
  - Only people I follow
  - No one

**Who can see my activity:**
- Radio options:
  - Everyone
  - Only connections
  - Only me

**Data & Privacy:**
- Toggle: "Allow analytics tracking"
- Toggle: "Share anonymous usage data"
- [Download my data] button
  - Generates zip file with all user data
  - Includes: profile, materials, chats, etc.

---

### 4. Notification Settings: `/settings/notifications`

**Email Notifications:**
- Toggle: "New message received"
- Toggle: "Someone joined my group"
- Toggle: "Someone commented on my material"
- Toggle: "Quiz reminder"
- Toggle: "Weekly summary email"
- Toggle: "Product updates and announcements"

**Push Notifications (Web):**
- Toggle: "Enable push notifications"
- Toggle: "New messages"
- Toggle: "Group activity"
- Toggle: "AI assistant responses"

**Notification Frequency:**
- Radio options:
  - Real-time
  - Digest (once per hour)
  - Daily summary
  - Weekly summary

---

### 5. Appearance Settings: `/settings` (default tab)

**Theme:**
- Radio options:
  - Light
  - Dark
  - System (auto-detect)

**Display Preferences:**
- Font size slider (Small → Medium → Large)
- Toggle: "Compact mode" (reduces spacing)
- Toggle: "Animations" (enable/disable transitions)

**Language:** (Future feature)
- Dropdown: English, Hindi, Spanish, etc.

---

## 🔌 API Routes (Backend)

### 1. Get Current User Profile

**Endpoint:** `GET /api/users/me`  
**Auth:** Required  
**File:** `src/app/api/users/me/route.ts`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://...",
    "coverPhoto": "https://...",
    "bio": "Computer Science student...",
    "role": "USER",
    "profileCompleted": true,
    "university": "Stanford",
    "major": "Computer Science",
    "graduationYear": 2025,
    "subjects": ["Math", "Physics", "CS"],
    "studyGoals": ["Exam prep", "Skill development"],
    "socialLinks": {
      "linkedin": "https://linkedin.com/in/johndoe",
      "github": "https://github.com/johndoe"
    },
    "createdAt": "2024-01-15T00:00:00Z",
    "lastActiveAt": "2024-02-27T10:30:00Z"
  }
}
```

**Use Cases:**
- Load user data in dashboard header
- Pre-fill edit profile form
- Display current user info

---

### 2. Update User Profile

**Endpoint:** `PATCH /api/users/me`  
**Auth:** Required  
**File:** `src/app/api/users/me/route.ts`

**Request Body:**
```json
{
  "name": "John Updated",
  "bio": "New bio text",
  "university": "MIT",
  "major": "AI/ML",
  "graduationYear": 2026,
  "phoneNumber": "+1234567890",
  "dateOfBirth": "2000-01-15",
  "gender": "MALE",
  "location": "Boston, MA",
  "subjects": ["AI", "ML", "Data Science"],
  "studyGoals": ["Research", "PhD prep"],
  "socialLinks": {
    "linkedin": "https://linkedin.com/in/john",
    "github": "https://github.com/john",
    "twitter": "https://twitter.com/john",
    "website": "https://john.com"
  }
}
```

**Validation:**
- All fields optional (partial update)
- Validate URLs if provided
- Validate email format if changing email
- Sanitize bio (remove HTML, limit length)

**Process:**
1. Validate input with Zod
2. Check if email is unique (if changing)
3. Update user in database (Prisma)
4. Return updated user object
5. If profileCompleted was false, set to true

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { /* updated user object */ }
}
```

---

### 3. Upload Avatar

**Endpoint:** `POST /api/upload/avatar`  
**Auth:** Required  
**File:** `src/app/api/upload/avatar/route.ts`

**Request:** Multipart form data
- Field name: "file"
- Accepted types: image/jpeg, image/png, image/webp
- Max size: 5MB

**Process:**
1. Validate file type and size
2. Generate unique filename (userId_timestamp.ext)
3. Upload to storage (Options):
   - **Option A:** Cloudinary (recommended)
   - **Option B:** AWS S3
   - **Option C:** Vercel Blob Storage
   - **Option D:** Local storage (development only)
4. Resize image to 400x400 (square)
5. Save URL to user.avatar in database
6. Delete old avatar if exists
7. Return new avatar URL

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://cloudinary.com/.../avatar.jpg",
    "width": 400,
    "height": 400
  }
}
```

**Error Handling:**
- 400: Invalid file type
- 413: File too large
- 500: Upload failed

---

### 4. Upload Cover Photo

**Endpoint:** `POST /api/upload/cover`  
**Auth:** Required  
**File:** `src/app/api/upload/cover/route.ts`

**Same as avatar upload but:**
- Max size: 10MB
- Resize to: 1200x300 (landscape)
- Save to: user.coverPhoto

---

### 5. Search Users

**Endpoint:** `GET /api/users/search?q=john&page=1&limit=20`  
**Auth:** Required  
**File:** `src/app/api/users/search/route.ts`

**Query Parameters:**
- `q` (required): Search query (min 2 characters)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 50)

**Search Logic:**
- Search in: name, email, university, major
- Case-insensitive
- Partial match
- Exclude current user from results
- Only show users with emailVerified = true
- Order by relevance (exact match first)

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_456",
        "name": "John Smith",
        "email": "john.smith@example.com",  // Only if public
        "avatar": "https://...",
        "university": "MIT",
        "major": "Computer Science",
        "bio": "Student at MIT...",
        "profileCompleted": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

**Use Cases:**
- Global search in header
- Find users to add to groups (Week 7)
- Find study partners (Week 8)

---

### 6. Get User by ID

**Endpoint:** `GET /api/users/[userId]`  
**Auth:** Required  
**File:** `src/app/api/users/[userId]/route.ts`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_456",
    "name": "Jane Doe",
    "avatar": "https://...",
    "coverPhoto": "https://...",
    "bio": "Medical student...",
    "university": "Harvard",
    "major": "Medicine",
    "graduationYear": 2026,
    "subjects": ["Biology", "Chemistry"],
    "socialLinks": {
      "linkedin": "https://linkedin.com/in/janedoe"
    },
    "stats": {
      "materialsCount": 24,
      "studyHours": 156,
      "groupsCount": 12,
      "xpPoints": 850
    },
    "memberSince": "2024-01-15T00:00:00Z",
    "isOnline": true,
    "lastActiveAt": "2024-02-27T10:30:00Z"
  }
}
```

**Privacy Filter:**
- Only return fields based on user's privacy settings
- If user set profile to private, return limited info
- Never return: password, email (unless public), phone number

**Use Cases:**
- View other user's profile
- Display user info in group members
- Show user details in chat

---

## 📤 File Upload Flow (Avatar/Cover)

### Frontend Flow:

```
User clicks "Upload Avatar"
  ↓
File input opens
  ↓
User selects image
  ↓
Preview image (before upload)
  ↓
Show crop/resize UI (optional)
  ↓
User clicks "Save"
  ↓
Show loading spinner
  ↓
Upload to /api/upload/avatar
  ↓
Receive URL response
  ↓
Update UI with new avatar
  ↓
Show success toast
```

### Backend Flow (with Cloudinary):

```
1. Receive file from multipart form
2. Validate file type and size
3. Create FormData with file
4. Upload to Cloudinary:
   POST https://api.cloudinary.com/v1_1/{cloud_name}/image/upload
   Body: {
     file: base64_or_file,
     upload_preset: "studysync_avatars",
     folder: "avatars",
     transformation: "w_400,h_400,c_fill"
   }
5. Receive response with secure_url
6. Save URL to database (user.avatar)
7. Return URL to frontend
```

**Cloudinary Setup Required:**
- Create account at cloudinary.com
- Get cloud_name, api_key, api_secret
- Create upload preset (unsigned)
- Set transformation presets:
  - Avatar: 400x400, crop fill
  - Cover: 1200x300, crop fill

**Alternative: AWS S3:**
```
1. Generate pre-signed URL
2. Upload directly from frontend
3. Save S3 URL to database
```

---

## 🎨 Component Styling Guide

### Sidebar Item (Active State):

```tsx
// Active item
className="bg-primary text-primary-foreground rounded-lg px-4 py-3 
           font-medium flex items-center gap-3"

// Inactive item
className="text-muted-foreground hover:text-foreground hover:bg-muted 
           rounded-lg px-4 py-3 flex items-center gap-3 transition-colors"

// Disabled item
className="text-muted-foreground/50 cursor-not-allowed 
           rounded-lg px-4 py-3 flex items-center gap-3"
```

### Stats Card:

```tsx
className="bg-card border border-border rounded-xl p-6 
           hover:shadow-lg transition-all"

// Icon container
className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 
           flex items-center justify-center mb-4"

// Value text
className="text-3xl font-bold"

// Trend indicator
className="flex items-center gap-1 text-sm text-green-600"
```

### Profile Header:

```tsx
// Cover photo container
className="relative h-48 md:h-72 bg-gradient-to-r from-purple-500 to-blue-500"

// Avatar container
className="absolute -bottom-16 left-8 w-32 h-32 rounded-full 
           border-4 border-background"

// Edit button (floating)
className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm 
           px-4 py-2 rounded-lg"
```

### Form Layout:

```tsx
// Form section
className="bg-card border border-border rounded-xl p-6 space-y-6"

// Section title
className="text-lg font-semibold mb-4"

// Form field
className="space-y-2"

// Label
className="text-sm font-medium"

// Input
className="w-full px-4 py-3 border border-input rounded-lg 
           focus:ring-2 focus:ring-primary"
```

---

## 📱 Responsive Behavior

### Sidebar:

**Desktop (>= 1024px):**
- Always visible
- Fixed position
- 256px width
- Can be collapsed to 64px

**Tablet (768px - 1023px):**
- Hidden by default
- Slide-in drawer
- Overlay when open
- Full height

**Mobile (< 768px):**
- Hidden
- Use bottom navigation instead
- 4-5 main items only

### Bottom Navigation (Mobile):

```
┌──────┬──────┬──────┬──────┬──────┐
│ Home │ Chat │   +  │ Noti │ Menu │
└──────┴──────┴──────┴──────┴──────┘
```

**Items:**
1. Home (Dashboard)
2. Chat (Week 6)
3. Add (Quick actions menu)
4. Notifications (Week 6)
5. More (Settings, Profile)

### Dashboard Content:

**Desktop:**
- Stats cards: 4 in a row
- Activity feed: Right sidebar
- Main content: 60% width

**Tablet:**
- Stats cards: 2x2 grid
- Activity feed: Below main content
- Main content: Full width

**Mobile:**
- Stats cards: 2x2 grid (smaller)
- Activity feed: Scrollable horizontal
- Main content: Full width

---

## 🔒 Security & Permissions

### Route Protection:

```typescript
// In middleware.ts

// Public routes (no auth needed)
const publicRoutes = ['/', '/about', '/login', '/signup']

// Protected routes (auth required)
const protectedRoutes = ['/dashboard', '/profile', '/settings']

// Check if user is authenticated
if (protectedRoutes.includes(pathname) && !session) {
  return NextResponse.redirect('/login')
}

// Redirect authenticated users from auth pages
if (publicRoutes.includes(pathname) && session) {
  return NextResponse.redirect('/dashboard')
}
```

### Data Access Control:

**Own Profile:**
- Can view all fields
- Can edit all fields
- Can delete account

**Other's Profile:**
- Can view only if user's privacy settings allow
- Cannot edit
- Cannot see private fields (email, phone)

**Admin (Week 11):**
- Can view all profiles
- Can edit any profile
- Can delete any account

---

## ✅ Testing Checklist

### Dashboard Layout:
- [ ] Sidebar shows all navigation items
- [ ] Active route is highlighted
- [ ] Sidebar collapses on toggle (desktop)
- [ ] Sidebar drawer works (mobile)
- [ ] Header shows user avatar and name
- [ ] User dropdown menu works
- [ ] Global search opens search modal
- [ ] Theme toggle works (dark/light)
- [ ] Logout button works

### Dashboard Home:
- [ ] Welcome message shows user name
- [ ] All 4 stats cards display
- [ ] Stats show correct data (even if dummy)
- [ ] Quick action buttons are clickable
- [ ] Disabled features show tooltip
- [ ] Activity feed scrolls
- [ ] Recent activities display with icons

### Profile View:
- [ ] Own profile redirects to /profile/[id]
- [ ] Cover photo displays correctly
- [ ] Avatar displays correctly
- [ ] User info shows correctly
- [ ] Stats row displays all 4 stats
- [ ] Tabs work (About, Materials, Activity)
- [ ] Social links are clickable
- [ ] Edit button visible on own profile
- [ ] Edit button hidden on other's profile

### Edit Profile:
- [ ] Form pre-fills with current data
- [ ] Avatar upload works
- [ ] Avatar preview shows before save
- [ ] Cover photo upload works
- [ ] Cover photo preview shows
- [ ] All fields validate correctly
- [ ] Character count shows for bio
- [ ] Username uniqueness checks
- [ ] Save button disabled during submit
- [ ] Success message shows after save
- [ ] Data updates in profile view
- [ ] Cancel button discards changes

### Settings:
- [ ] Settings tabs work
- [ ] Account settings form works
- [ ] Change email modal works
- [ ] Change password modal works
- [ ] Profile visibility toggles work
- [ ] Privacy settings save
- [ ] Notification toggles work
- [ ] Theme selection works
- [ ] All changes persist after refresh

### Search:
- [ ] Search input shows results
- [ ] Results filter as you type
- [ ] Min 2 characters required
- [ ] Click result navigates to profile
- [ ] No results message shows
- [ ] Loading state shows while searching

### API Routes:
- [ ] GET /api/users/me returns current user
- [ ] PATCH /api/users/me updates profile
- [ ] POST /api/upload/avatar uploads file
- [ ] POST /api/upload/cover uploads file
- [ ] GET /api/users/search returns results
- [ ] GET /api/users/[id] returns user data
- [ ] All routes require authentication
- [ ] Error responses are handled

### Responsive Design:
- [ ] Works on mobile (320px+)
- [ ] Works on tablet (768px+)
- [ ] Works on desktop (1024px+)
- [ ] Sidebar adapts correctly
- [ ] Stats cards stack properly
- [ ] Forms are usable on mobile
- [ ] Images scale correctly

---

## 📦 Required NPM Packages

```json
{
  "dependencies": {
    // Already installed from Week 1-2
    
    // NEW: File upload
    "react-dropzone": "latest",      // Drag & drop file upload
    
    // NEW: Image cropping (optional but recommended)
    "react-easy-crop": "latest",     // Image crop UI
    
    // NEW: File upload to cloud
    "cloudinary": "latest",          // Cloudinary SDK
    // OR
    "@aws-sdk/client-s3": "latest",  // AWS S3 SDK
    // OR  
    "@vercel/blob": "latest",        // Vercel Blob Storage
    
    // NEW: Rich text editor for bio (optional)
    "@tiptap/react": "latest",
    "@tiptap/starter-kit": "latest",
    
    // NEW: Date picker
    "react-day-picker": "latest",
    "date-fns": "latest"
  }
}
```

---

## 🚀 Implementation Order

### Day 1-2: Setup & Layout
1. Create dashboard layout structure
2. Build sidebar component
3. Build header component
4. Add navigation items (some disabled)
5. Add user menu dropdown
6. Test responsive behavior

### Day 3-4: Dashboard Home
1. Create stats cards component
2. Add dummy data for stats
3. Create quick actions grid
4. Build activity feed component
5. Style and polish

### Day 5-6: Profile System
1. Create profile view page
2. Add profile header (cover + avatar)
3. Create profile info display
4. Add tabs (About, Materials, Activity)
5. Create edit profile page
6. Build all form sections
7. Add validation

### Day 7-8: File Upload
1. Set up Cloudinary account
2. Create upload API routes
3. Build avatar upload component
4. Build cover upload component
5. Add image preview
6. Add crop functionality (optional)
7. Test upload flow

### Day 9: Settings Pages
1. Create settings layout
2. Build settings navigation
3. Create all settings forms
4. Add toggle switches
5. Connect to API

### Day 10: Polish & Testing
1. Add loading states
2. Add error handling
3. Test all flows
4. Fix responsive issues
5. Add animations/transitions
6. Test on different devices

---

## 🎯 Success Criteria

Week 3 is complete when:

✅ Dashboard layout is responsive  
✅ Sidebar navigation works  
✅ Dashboard home shows stats and activity  
✅ User can view their profile  
✅ User can edit their profile  
✅ Avatar upload works  
✅ Cover photo upload works  
✅ Settings pages are functional  
✅ All forms validate correctly  
✅ Changes persist in database  
✅ Search users works  
✅ View other user profiles works  
✅ Privacy settings work  
✅ Theme switching works  
✅ Mobile experience is smooth  
✅ No console errors  
✅ All API routes work

---

## 📝 Notes for Next Weeks

### Week 4 (Materials):
- Will add materials list to profile
- Will show uploaded materials count
- Will connect to "Upload Material" quick action

### Week 5 (AI Assistant):
- Will add AI chat history
- Will show AI interaction count in stats

### Week 6 (Chat):
- Will add unread message count badge
- Will add "Send Message" button on profiles
- Will power chat quick action

### Week 7 (Groups):
- Will add groups list to profile
- Will show groups joined count
- Will add "Invite to Group" button

### Week 8 (Matching):
- Will use profile data for matching
- Will show compatibility scores

### Week 9 (Quizzes):
- Will add quiz scores to stats
- Will show quiz history in activity

### Week 10 (Analytics):
- Will power all stats cards with real data
- Will show study time charts
- Will display progress graphs

### Week 11 (Admin):
- Will add admin badge to profiles
- Will add "Edit Any User" for admins

---

## 🔗 Integration with Week 2

After completing Week 3, these should work together:

✅ Login → Redirect to Dashboard  
✅ Signup → Redirect to Onboarding → Dashboard  
✅ Dashboard shows logged-in user info  
✅ Logout → Clear session → Redirect to landing  
✅ Protected routes work via middleware  
✅ Session persists across page refreshes  
✅ Avatar shows in navbar and profile  
✅ User data from database displays correctly

---

**Time Estimate:** 7-10 days  
**Difficulty:** Medium  
**Next Week:** Week 4 - Study Materials System

---

Built with ❤️ for StudySync AI
