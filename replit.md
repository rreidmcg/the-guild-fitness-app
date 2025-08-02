# The Guild: Gamified Fitness

## Overview

The Guild: Gamified Fitness is a full-stack fitness tracking application that gamifies the workout experience through RPG-style character progression. Users can create and track workouts, earning experience and building character stats (strength, stamina, agility). The app features a mobile-friendly interface with a custom 2D avatar system, fostering long-term engagement through a unique blend of fitness and fantasy. The project aims to provide an engaging and sustainable fitness journey, with ambitions for continued content expansion and community features.

## Recent Changes (August 2, 2025)
- **ADMIN PANEL STYLING ALIGNMENT**: Successfully brought admin panel in line with app's design system by replacing ParallaxBackground with standard layout, using proper theme variables instead of hardcoded colors, and replacing NavBar with CurrencyHeader for consistency
- **MOBILE MAIL HEADER FIX**: Fixed cramped mail page header on mobile devices with responsive layout adjustments - header now stacks vertically on small screens, hides subtitle text, shows icon-only buttons, and uses proper text sizing
- **PERSISTENT EXERCISE PREFERENCES**: Implemented complete user exercise preferences system with database storage, API endpoints, and automatic saving/loading of customized workout metrics (weight, reps, RPE, duration)
- **WORKOUT SESSION ENHANCEMENT**: Updated workout session interface to auto-populate saved preferences as defaults and automatically save user modifications for future sessions
- **PRIVACY CONFIRMATION**: Confirmed and documented that custom workouts are completely private to each user account with proper user ID filtering
- **WORKOUT SESSION ERROR FIX**: Fixed workout session crash caused by sets being stored as numbers instead of arrays - now properly converts template data to session format
- **EXERCISE PREFERENCES DEBUGGING**: Working on persistent exercise preferences - added error handling and debugging logs to track saving issues

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