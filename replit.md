# The Guild: Gamified Fitness

## Overview

The Guild: Gamified Fitness is a full-stack fitness tracking application that gamifies the workout experience through RPG-style character progression. Users can create and track workouts, earning experience and building character stats (strength, stamina, agility). The app features a mobile-friendly interface with a custom 2D avatar system, fostering long-term engagement through a unique blend of fitness and fantasy. The project aims to provide an engaging and sustainable fitness journey, with ambitions for continued content expansion and community features.

## Recent Changes (August 4, 2025)
- **AUTOMATIC ATROPHY PROCESSING IMPLEMENTED**: Added scheduled atrophy system that runs daily on server startup and every 24 hours thereafter - ensures consistent stat degradation for inactive users without manual intervention
- **STREAK AND ATROPHY SYSTEMS VERIFIED**: Comprehensive analysis confirmed both systems work correctly - streaks reset to 0 when minimum activity requirements (2/4 daily quests OR 1 workout) aren't met, atrophy subtracts 1% XP and recalculates stats accurately for users inactive >24 hours
- **ZERO'S STATS RESET COMPLETE**: Reset Zero to Level 1 with all stats at 1, 0 XP, 0 gold, and cleared workout history for fresh character progression testing
- **MONSTER ANALYTICS CLEARED**: Deleted all monster battle data (3 instances) to reset combat tracking and encounter system
- **MAILBOX TIMESTAMP OPTIMIZATION**: Updated mail timestamps from "less than a minute ago" to "< 1 min ago" for improved space efficiency in mobile interface
- **ADMIN MAIL SYSTEM FULLY RESTORED**: Fixed critical API request formatting issue in useApiMutation hook that was preventing global mail composition - admin panel can now successfully send notifications to all users with proper authentication and data validation
- **API AUTHENTICATION RESOLVED**: Corrected useApiMutation to use proper apiRequest format with credentials, resolving "string did not match" errors that were actually authentication failures
- **MAIL VALIDATION ENHANCED**: Added enum validation to mailType field in database schema to ensure only valid mail types (news, reward, announcement, event) are accepted
- **DEBUGGING INFRASTRUCTURE IMPROVED**: Enhanced error logging and tracking throughout mail system for better troubleshooting of future issues

## Recent Changes (August 3, 2025)
- **ENHANCED SWIPE DECK IMPLEMENTATION**: Upgraded workout session swipe functionality with card-like navigation inspired by Tinder-style deck mechanics - smooth slide animations, visual direction indicators, opacity feedback during drag, and 100px threshold for improved responsiveness
- **WORKOUT CARD VISUAL FEEDBACK**: Added dynamic visual cues during swipe interactions including directional border highlights (green for forward, orange for backward), contextual instruction text, and smooth opacity transitions
- **UNIVERSAL DEFENSIVE CODING STANDARD**: Established comprehensive defensive coding practices as mandatory app-wide standard - created defensive-coding-standards.css with BEM naming conventions, component isolation, performance optimizations, and accessibility guidelines for all future development
- **BATTLE SYSTEM DEFENSIVE CODING**: Applied comprehensive defensive coding practices to entire battle system (battle.tsx, pve-dungeons.tsx, dungeon-battle.tsx) - created isolated battle-system.css with BEM naming, namespaced state management, and component-specific class prefixes to prevent conflicts and ensure stability
- **CORE PAGES FORTIFICATION**: Applied defensive coding to all major pages (stats.tsx, shop.tsx, leaderboard.tsx, mail.tsx) with isolated state management, BEM class naming, and component boundaries to prevent "butterfly effect" issues
- **WORKOUT TRACKER ENHANCEMENTS**: Implemented smooth swipe navigation between exercises with visual feedback, fixed completion button accessibility issue preventing XP rewards, added arrow navigation controls with progress indicators
- **DEFENSIVE CODING IMPLEMENTATION**: Applied comprehensive defensive coding practices to workout session component - namespaced classes (BEM convention), isolated component state, scoped selectors, and dedicated CSS file to prevent conflicts
- **SWIPE INTERACTION REFINEMENT**: Enhanced swipe functionality with clean horizontal-only movement, 120px threshold, proper touch/mouse event handling, and performance optimizations (hardware acceleration, touch-action)
- **BATTLE ACCESS CONTROL FIX**: Implemented comprehensive battle access restrictions to prevent unauthorized users from accessing PvE dungeons - only Zero and users with G.M. title can now access battles, while restricted users see professional "Access Restricted" message with lock icon
- **EMAIL VERIFICATION MANUAL PROCESS**: Successfully verified user "Doorz" account manually due to MailerSend trial limitations - system can send verification emails to admin for forwarding to users
- **SECURITY LAYER IMPLEMENTATION**: Added frontend battle access checks in addition to existing backend API protections - battle page now validates permissions before allowing navigation to PvE dungeons

## Recent Changes (August 2, 2025)
- **EMAIL VERIFICATION SYSTEM FIX**: Fixed email verification not working by migrating from broken Nodemailer/Ethereal setup to production MailerSend API - new users now receive proper verification emails with professional styling
- **DYNAMIC COLUMN HIDING**: Implemented smart column hiding for workout sessions - bodyweight exercises (like jumping jacks) now only show relevant columns (SET, REPS, RIR) instead of wasting space with weight columns
- **SMART EXERCISE DEFAULTS**: Replaced complex manual field configuration with intelligent defaults based on exercise category - strength exercises show weight/reps/RIR, bodyweight shows reps/RIR, cardio shows time/RPE, etc.
- **SIMPLIFIED WORKOUT BUILDER**: Removed manual tracking field selection UI in favor of automatic smart defaults, significantly improving user experience
- **EXERCISE CATEGORIZATION**: Created comprehensive exercise default system that automatically determines appropriate tracking fields based on exercise type (strength, bodyweight, cardio, plyometric, etc.)
- **ADMIN PANEL STYLING ALIGNMENT**: Successfully brought admin panel in line with app's design system by replacing ParallaxBackground with standard layout, using proper theme variables instead of hardcoded colors, and replacing NavBar with CurrencyHeader for consistency
- **MOBILE MAIL HEADER FIX**: Fixed cramped mail page header on mobile devices with responsive layout adjustments - header now stacks vertically on small screens, hides subtitle text, shows icon-only buttons, and uses proper text sizing
- **WORKOUT SESSION ERROR FIX**: Fixed workout session crash caused by sets being stored as numbers instead of arrays - now properly converts template data to session format

## Previous Changes (August 1, 2025)
- **BATTLE SYSTEM REWARDS**: Battles now only award gold/currency, NOT experience points - XP comes exclusively from completing workouts to ensure level reflects real fitness consistency
- **SIMPLIFIED BATTLE INTERFACE**: Streamlined to attack (sword icon) and flee (boot icon) only, removed items/buffs/consumables
- **ATROPHY IMMUNITY**: Only Rob has permanent atrophy immunity, all other players subject to daily stat degradation when inactive
- **VISUAL EDITOR**: Installed cartographer plugin for drag-and-drop UI editing to reduce micro-adjustments
- **CRITICAL SYSTEM FIXES**: Resolved atrophy system running backwards due to date comparison logic errors - now properly reduces XP/stats for inactive users
- **HP/MP REGENERATION**: Fixed regeneration mechanics with proper formulas (1% HP per minute minimum, MP based on agility stat)
- **POTION SYSTEM**: Eliminated JSON double-stringification bug causing "cannot use potion" errors - potions now work correctly

## User Preferences

Preferred communication style: Simple, everyday language.

**Development Standards (Established August 3, 2025):**
- **Defensive Coding Mandatory**: All new components must follow BEM naming convention (block__element--modifier) and use component-isolated state management
- **Component Boundaries**: Every major component must have clear CSS class prefixes and isolated styling to prevent conflicts
- **Performance First**: Hardware acceleration, touch optimization, and accessibility features required for all interactive elements
- **Future-Proof Architecture**: All changes must consider scalability and maintainability to prevent "butterfly effect" issues during feature expansion

## System Architecture

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **State Management**: TanStack Query
- **Styling**: Tailwind CSS with custom gaming theme variables
- **UI Components**: Radix UI with shadcn/ui
- **Graphics**: Custom 2D avatar system; Three.js planned for 3D avatar display.
- **UI/UX Decisions**: Dark gaming theme, mobile-responsive design with bottom navigation (Stats, Workouts, Battle, Shop, Leaderboard), currency header displaying gold, XP, and level. Progressive Web App (PWA) capabilities including offline functionality and push notifications.

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM (Neon serverless PostgreSQL)
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **API Design**: RESTful API with JSON responses
- **Monorepo Structure**: Shared TypeScript schemas between frontend and backend for type safety.

### Core Features & System Design
- **Authentication & User Management**: Secure registration/login, email verification, password recovery, username validation with profanity filtering and reserved words, admin access control. Includes a comprehensive title rarity system (White to Relic tiers) and RPG-style leveling.
- **Character Progression**: RPG-style character progression with level, experience, and three-stat tracking (Strength, Stamina, Agility). Features an advanced stat allocation engine based on exercise science (energy system classification, RPE) and an exponential leveling formula. Includes an Atrophy System with daily stat degradation and activity tracking to prevent loss.
- **Gamification**:
    - **Dual Resource System**: HP (Health Points) and MP (Magic Points) with regeneration mechanics.
    - **Dual Economy System**: XP from workouts for progression, Gold from monster battles for purchases.
    - **Combat System**: Stat-based combat mechanics influencing damage, HP, MP, and evasion.
    - **Dungeon Progression**: Story-driven, exponential dungeon progression (E-rank to A-rank) representing years of content, designed to promote sustainable workout routines.
    - **Achievements**: Personal records and boss-themed title progression tied to dungeon completion.
    - **Streak System**: Comprehensive streak bonus for consistent activity and an auto-streak freeze system to prevent loss.
- **Workout System**: Template-based workout creation with JSON exercise configuration. Real-time workout session tracking with a timer and post-workout victory screen detailing gains. Includes a comprehensive exercise library with categorization and multi-stat allocation.
- **Analytics**: Comprehensive analytics dashboard for admin users with real-time metrics on users, retention, engagement, and revenue projections.
- **Monetization (Implemented)**: One-time workout program purchases with Stripe integration. Gems currency system for in-app purchases of consumables like streak freezes.
- **Future/Planned Features**: 3D avatar display (Three.js), shop system for armor/equipment, AI workout recommendation system (currently disabled for cost optimization but architecture preserved).

## External Dependencies

- **@neondatabase/serverless**: Neon PostgreSQL driver
- **drizzle-orm**: ORM for database operations
- **express**: Web application framework
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: UI component primitives
- **wouter**: Routing library
- **@types/three**: 3D graphics library (for future avatar implementation)
- **bcrypt**: Password hashing
- **MailerLite**: Email service for verification and notifications
- **Stripe**: Payment processing for workout programs and gem purchases