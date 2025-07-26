# Dumbbells & Dragons - Gamified Fitness Tracking Application

## Overview

Dumbbells & Dragons is a full-stack fitness tracking application that gamifies the workout experience through RPG-style character progression. Users can create workouts, track their sessions, and earn experience points while building their character's stats (strength, stamina, endurance, flexibility). The app features a mobile-friendly bottom navigation with dedicated pages for Stats, Workouts, and Settings, plus a custom 2D avatar system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **Styling**: Tailwind CSS with custom gaming theme variables
- **UI Components**: Radix UI components with shadcn/ui component library
- **3D Graphics**: Three.js integration planned for 3D avatar display

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **API Design**: RESTful API with JSON responses

### Database Schema
- **Users**: Character progression with level, experience, three-stat tracking (Strength, Stamina, Agility), gold currency, HP system, MP system, and atrophy tracking fields
- **Exercises**: Exercise library with multi-stat allocation system using JSON statTypes field
- **Workouts**: Template-based workout creation with JSON exercise configuration
- **Workout Sessions**: Completed workout tracking with sophisticated XP and stat allocation
- **Exercise Performances**: Individual exercise set/rep/weight tracking with RPE integration
- **Personal Records**: Achievement tracking for user milestones

## Key Components

### Atrophy System
- **Daily Stat Degradation**: Players lose 1% of overall XP and all main stats each day without activity
- **Activity Tracking**: Workouts, battles, and streak freezes count as activity to prevent atrophy
- **New User Protection**: 7-day immunity period for new players to learn the system
- **Streak Freeze Integration**: Existing streak freezes can be used to prevent atrophy
- **Auto Streak Freeze**: Automatically applies streak freeze at 12:00 AM local time if player has freezes and didn't meet daily requirements
- **Real-time Warnings**: UI components alert players when they're at risk of stat loss

### Authentication & User Management
- Secure user registration and login system with bcrypt password hashing
- Email verification system with secure token generation and 24-hour expiry
- Password recovery system with 1-hour reset token expiry
- Enhanced login/signup pages with password visibility toggle and forgot password functionality
- **Username Validation & Profanity Filtering**: Comprehensive validation system with:
  - Character restrictions (letters only, no spaces, 2-20 characters)
  - Profanity detection with leetspeak normalization
  - Reserved word protection (admin, staff, etc.)
  - Real-time validation feedback in forms
  - Backend and frontend validation consistency
- **Title Rarity System**: Comprehensive color-coded title progression system:
  - White (common): Recruit, Fitness Novice
  - Green (uncommon): Fitness Apprentice, Iron Novice
  - Blue (rare): Fitness Warrior, Iron Warrior, Fitness Veteran
  - Purple (epic): Fitness Champion, Iron Champion, Fitness Master
  - Yellow (legendary): Fitness Grandmaster, Iron Grandmaster, Fitness Legend
  - Orange (mythic): Fitness Mythic, Iron Mythic, Fitness Godlike
  - Red (relic): G.M. title (highest rarity for admin users)
  - Applied consistently across leaderboard, stats, admin, and settings pages
- Admin access control for G.M. titled users
- Character progression system with RPG-style leveling
- Stat tracking (strength, stamina, agility)

### Exercise Management
- Comprehensive exercise library with categorization
- Muscle group targeting and stat type associations
- Exercise search and filtering capabilities

### Workout System
- Template-based workout creation
- JSON-based exercise configuration with sets, reps, weights
- Real-time workout session tracking with timer
- **Victory Screen**: Full-screen completion modal showing XP gained, stats improved, and workout summary
- Progress tracking and performance logging

### Gamification Features
- **Advanced Stat Allocation Engine**: Sophisticated XP calculation based on exercise science
  - Energy system classification (ATP-PC, Glycolytic, Mixed, Aerobic, Recovery)
  - RPE-based effort scaling (1-10 perceived effort scale)
  - Work unit calculations for resistance vs cardio exercises
  - **Individual Stat Progression**: Each stat (Strength, Stamina, Agility) has its own XP system with visual progress bars
  - Exponential leveling formula: level^2 * 100 XP per stat level
- **Dual Resource System**:
  - **HP (Health Points)**: Base 10 + (Stamina × 3), regenerates 1% per minute
  - **MP (Magic Points)**: (Stamina × 2) + (Agility × 1), regenerates (Agility ÷ 2)% per minute
- **Dual Economy System**:
  - **XP from Workouts**: Character progression, leveling up, stat increases for stronger combat
  - **Gold from Monster Battles**: Currency for purchasing armor and equipment in shop
- **Combat System**: Advanced stat-based combat mechanics:
  - **Strength**: Modifies damage (base 3 + strength/2 + 1-3 random)
  - **Stamina**: Determines HP (10 base + stamina * 3) and MP pool (primary contributor)
  - **Agility**: Determines evasion (5% per agility point, max 90%) and MP regeneration rate
- **Exponential Progression System**: Story-driven dungeon progression with increasing time commitment:
  - **E-rank (4 weeks)**: 4 zones × 6 monsters each = 24 monsters (Lv 1-5)
  - **D-rank (8 weeks)**: 6 zones × 6 monsters each = 36 monsters (Lv 6-13) 
  - **C-rank (16 weeks)**: 8 zones × 6 monsters each = 48 monsters (Lv 14-23)
  - **B-rank (32 weeks)**: 12 zones × 6 monsters each = 72 monsters (Lv 24-36)
  - **A-rank (64 weeks)**: 5 zones × 6 monsters each = 30 monsters (Lv 37-43)
  - Each rank takes twice as long as the previous, promoting sustainable 3-workout/week routine
  - Total: 210 monsters across 35 themed zones representing 2.5+ years of dedicated fitness content
- Level progression with title system
- Multi-stat exercises (e.g., power cleans award all three stats)
- Achievement system through personal records

### User Interface
- Dark gaming theme with custom color palette
- Mobile-responsive design with bottom navigation
- Bottom navigation bar with Stats, Workouts, Battle, Shop, and Leaderboard pages
- **Reorganized Navigation**: Storage icon moved to thin currency header, replaced with leaderboard button in bottom menu
- **Currency Header**: Thin header displaying gold, XP, level, and storage access across all pages
- **Enhanced Battle Results**: Full-screen modal showing detailed victory/defeat information with prominent gold rewards
- Custom 2D avatar system with visual progression based on stats
- Real-time workout session interface
- Leaderboard page ranking all players by total experience points earned
- Dedicated pages for different app functions

## Data Flow

1. **User Registration/Login** → Character creation with initial stats
2. **Exercise Library** → Browse/search exercises by category and muscle groups
3. **Workout Creation** → Template builder with exercise selection and configuration
4. **Workout Execution** → Real-time session tracking with timer and performance logging
5. **Progress Calculation** → XP and stat gains based on workout completion
6. **Character Progression** → Level ups and stat improvements reflected in dashboard
7. **Battle System** → Fight monsters in progressive dungeons (E/D/C-rank) to earn gold coins with exponential time investment
8. **Shop System** → Use gold to purchase armor and equipment (planned feature)

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver
- **drizzle-orm**: Type-safe ORM for database operations
- **express**: Web application framework
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **wouter**: Lightweight routing library
- **@types/three**: 3D graphics library (for future avatar implementation)

### Development Dependencies
- **drizzle-kit**: Database schema management and migrations
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundler for production builds
- **tailwindcss**: Utility-first CSS framework
- **vite**: Fast frontend build tool

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite dev server with HMR
- **Database**: Development database with push migrations
- **Process Management**: tsx for TypeScript execution

### Production Build
- **Frontend**: Vite build with optimized bundles
- **Backend**: esbuild compilation to ESM format
- **Database**: Drizzle Kit for schema migrations
- **Deployment**: Single-server deployment with static file serving

### Environment Configuration
- **Database URL**: Required environment variable for PostgreSQL connection
- **Session Storage**: PostgreSQL-backed session management
- **Static Assets**: Served through Express in production

The application follows a monorepo structure with shared TypeScript schemas between frontend and backend, ensuring type safety across the entire stack. The gaming theme is implemented through custom CSS variables and a comprehensive UI component system built on Radix UI primitives.

# Recent Changes

**January 27, 2025 - Performance & Polish Implementation:**
- **Enhanced Performance & Error Handling**: Complete loading states and error boundaries system
  - Added comprehensive loading spinner and loading state components
  - Implemented error boundary with fallback UI and retry functionality
  - Created API error component with network detection and retry mechanisms
  - Added network status indicator for offline detection
- **Progressive Web App (PWA) Capabilities**: Full mobile-first experience with offline functionality
  - Complete PWA manifest with app shortcuts and share targets
  - Service worker with cache-first strategy for static assets and API responses
  - Offline page with feature availability and auto-reconnection
  - Background sync for offline workout sessions with automatic upload when online
  - Push notification system with daily quest reminders and atrophy warnings
  - PWA installation banner with user-friendly prompts
- **Analytics & Admin Dashboard**: Comprehensive admin tools for G.M. users only
  - Full analytics dashboard with user engagement metrics and retention rates
  - Workout completion statistics and achievement unlock tracking
  - Battle statistics and user progression analytics
  - Content management system for exercises, monsters, and achievements
  - Real-time data visualization with responsive design
  - Admin access restricted to users with <G.M.> title
- **Input Validation & Security**: Enhanced data validation and rate limiting
  - Comprehensive validation schemas for all user inputs
  - Sanitization functions to prevent XSS and injection attacks
  - Rate limiting implementation to prevent abuse
  - Enhanced error handling with detailed logging

**Previous Updates:**
- **Implemented Interactive Storage Menu**: Complete item management system for player inventory
  - Added tap-to-interact functionality for all inventory items
  - Created action dialogs with Use/Delete options for enhanced user control
  - Integrated potion usage with health/mana validation preventing waste
  - Added confirmation dialogs for item deletion to prevent accidents
  - Backend API endpoints for secure item deletion and potion consumption
- **Enhanced Leaderboard with Player Avatar Previews**: Community-focused social features
  - Added interactive player profile popups when tapping leaderboard entries
  - Displays full 2D avatars with custom appearance (skin, hair, gender)
  - Shows detailed player stats, rank icons, titles, and experience points
  - Creates admiration system for strong players and character customization showcase
- **Exclusive G.M. Avatar System**: Special visual representation for admin users
  - Added unique dark armored avatar with glowing red eyes for "<G.M.>" title holders
  - Avatar2D component intelligently selects appropriate avatar based on user title
  - Maintains standard male/female avatars for regular players
  - Creates clear visual distinction for administrative users

**January 26, 2025:**
- **Implemented Auto Streak Freeze System**: Streak freezes now automatically apply at 12:00 AM local time
  - Players with available streak freezes who didn't meet daily requirements (2/4 quests OR 1 workout) get automatic protection
  - Integrated with existing daily reset system for timezone-aware midnight processing
  - Auto freeze maintains streak continuity without manual intervention
  - Reduces penalty for players who invest in streak freeze items
- **Enhanced Background Music System**: Fixed multiple audio instances playing simultaneously
  - Converted from multiple hook instances to single context provider
  - Speaker button now shows VolumeX when muted, Volume2 when playing
  - Positioned speaker control in currency header left side
- **UI Improvements**: Made atrophy warning more compact and less intrusive
  - Reduced padding, text sizes, and icon dimensions
  - Shortened warning text while preserving essential information
  - Removed manual "Use Freeze" buttons since system is now fully automatic
  - Moved streak count and freeze count to currency header for cleaner interface
  - Removed "Auto-Protected" text from atrophy warning to reduce clutter

**January 25, 2025:**
- Fixed critical application startup errors and undefined data access issues
- Resolved TypeScript errors in stats and leaderboard pages  
- Added proper loading states and data validation for all API responses
- Fixed title color display issue for `<G.M.>` title on leaderboard (now shows red/relic color)
- **Implemented Daily Quest Reset System**: Daily quests now automatically reset at 12:00 AM local time
  - Added timezone detection and automatic timezone setting for users
  - Created `DailyResetSystem` service with timezone-aware date calculations
  - Added user timezone field to database schema
  - Integrated timezone-based reset logic into daily progress API endpoints
  - Users' timezones are automatically detected and set on first app load
- Application fully functional with all features working properly