# The Guild: Gamified Fitness

## Overview

The Guild: Gamified Fitness is a full-stack fitness tracking application that gamifies the workout experience through RPG-style character progression. Users can create and track workouts, earning experience and building character stats (strength, stamina, agility). The app features a mobile-friendly interface with a custom 2D avatar system, fostering long-term engagement through a unique blend of fitness and fantasy. The project aims to provide an engaging and sustainable fitness journey, with ambitions for continued content expansion and community features.

## Recent Changes (January 2025)

**Authentication & UX Improvements:**
- **Streamlined Login Process**: Removed email verification requirement for initial login - users can now access their accounts immediately after registration
- **Enhanced Security**: Email verification still required for password reset functionality to maintain account security
- **Improved Liability Waiver**: Enhanced text readability with larger fonts, better contrast, and improved spacing for better user experience during signup
- **Email Service Integration**: Implemented Nodemailer as primary email service with Gmail SMTP, maintaining MailerSend as fallback option

**Mail Interface & New Player Experience:**
- **Enhanced Mail Hierarchy**: Improved visual hierarchy with larger bold sender names, smaller bold subjects, and light-weight body previews
- **Cleaner Badge Placement**: Moved mail type badges to the right of sender names and removed redundant icons
- **New Player Protection Clarity**: Added detailed explanation that new players are "Protected from losing experience points due to inactivity until [date]"

**Critical Bug Fixes:**
- **Fixed Atrophy System**: Resolved issue where XP was being lost on every app redeployment by removing atrophy processing from startup sequence
- **Enhanced Atrophy Timing**: Modified atrophy system to require 2 consecutive days of inactivity before XP loss begins, providing more grace period for players
- **Improved Streak Logic**: Strengthened streak advancement requirements to ensure minimum activity levels are met before advancing streaks

## User Preferences

Preferred communication style: Simple, everyday language.

**Development Standards:**
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
- **AI Integration**: OpenAI GPT-4o API integration for intelligent development assistance and enhanced workout recommendations
- **Monorepo Structure**: Shared TypeScript schemas between frontend and backend for type safety.

### Core Features & System Design
- **Authentication & User Management**: Secure registration/login with immediate account access (email verification no longer required for login but still required for password reset), password recovery, username validation with profanity filtering and reserved words, admin access control. Includes a comprehensive title rarity system and RPG-style leveling.
- **Character Progression**: RPG-style character progression with level, experience, and three-stat tracking (Strength, Stamina, Agility). Features an advanced stat allocation engine and an exponential leveling formula. Includes an Atrophy System with daily stat degradation and activity tracking to prevent loss.
- **Gamification**:
    - **Dual Resource System**: HP (Health Points) and MP (Magic Points) with regeneration mechanics.
    - **Dual Economy System**: XP from workouts for progression, Gold from monster battles for purchases.
    - **Combat System**: Stat-based combat mechanics influencing damage, HP, MP, and evasion.
    - **Dungeon Progression**: Story-driven, exponential dungeon progression representing years of content, designed to promote sustainable workout routines.
    - **Achievements**: Personal records and boss-themed title progression tied to dungeon completion.
    - **Streak System**: Comprehensive streak bonus for consistent activity and an auto-streak freeze system to prevent loss.
- **Workout System**: Template-based workout creation with JSON exercise configuration. Real-time workout session tracking with a timer and post-workout victory screen detailing gains. Includes a comprehensive exercise library with categorization and multi-stat allocation. Features AI-powered workout recommendations using OpenAI GPT-4o for personalized training plans.
- **Analytics**: Comprehensive analytics dashboard for admin users with real-time metrics on users, retention, engagement, and revenue projections.
- **AI Development Tools**: Advanced development assistant system providing code review, optimization analysis, error debugging, architecture evaluation, test suggestions, and refactoring recommendations powered by OpenAI GPT-4o with admin-only access controls via a dedicated /dev-tools page.
- **Monetization**: One-time workout program purchases with Stripe integration. Gems currency system for in-app purchases of consumables like streak freezes.

## External Dependencies

- **@neondatabase/serverless**: Neon PostgreSQL driver
- **drizzle-orm**: ORM for database operations
- **express**: Web application framework
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: UI component primitives
- **wouter**: Routing library
- **@types/three**: 3D graphics library (for future avatar implementation)
- **bcrypt**: Password hashing
- **openai**: OpenAI GPT-4o API integration for AI-powered development assistance and workout recommendations
- **MailerSend**: Email service for verification and notifications
- **Stripe**: Payment processing for workout programs and gem purchases