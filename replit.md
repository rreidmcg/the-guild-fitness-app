# The Guild: Gamified Fitness - Fitness Tracking Application

## Overview

The Guild: Gamified Fitness is a full-stack fitness tracking application that gamifies the workout experience through RPG-style character progression. Users can create workouts, track their sessions, and earn experience points while building their character's stats (strength, stamina, endurance, flexibility). The app features a mobile-friendly bottom navigation with dedicated pages for Stats, Workouts, and Settings, plus a custom 2D avatar system.

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

**July 29, 2025 - Authentication UI Enhancement & Branding Fix:**
- **Enhanced Authentication Page Backgrounds**: Added visual depth and character to login/signup pages
  - Implemented gradient background from background to muted/20 for subtle depth
  - Added decorative floating orbs with blur effects for atmospheric feel
  - Logo and cards positioned with proper z-index layering and drop shadows
  - Cards enhanced with shadow-xl and backdrop-blur-sm for modern glass effect
- **Fixed Remaining Branding**: Updated settings page footer to show "The Guild: Gamified Fitness v1.0.0"
  - Removed last instance of old "Dumbbells & Dragons" name from app
  - All branding now consistently shows correct app name throughout interface

**July 29, 2025 - Change Password & Push Notification System Fix:**
- **Fixed Change Password Functionality**: Implemented secure password change system with user-friendly interface
  - Added `/api/user/password` PATCH endpoint with current password verification and secure hashing
  - Created `ChangePasswordDialog` component with password visibility toggles and validation
  - Added current/new/confirm password fields with 6+ character minimum requirement
  - Removed duplicate non-functional Change Password button in settings page
  - Password change now properly validates current password before updating
- **Enhanced Push Notification System**: Improved notification settings with real-time status updates
  - Added notification permission handling in settings page with clear status messages
  - Daily workout reminders scheduled for 6 PM, atrophy warnings at 10 PM
  - Achievement alerts and streak warnings properly integrated with permission system
  - Service worker configured for push notifications with proper event handling
  - Notification switches now show descriptive status based on permission state

**July 29, 2025 - Comprehensive Streak Bonus System Implementation:**
- **Completed Streak Bonus System**: Implemented 1.5x XP multiplier for users with 3+ day streaks
  - Applied streak bonus to all XP gains: daily quest XP, workout session XP, and stat XP
  - Backend integration with applyStreakBonus function for consistent bonus calculation
  - Updated workout completion endpoint to apply streak bonuses to both main XP and individual stat XP gains
  - Enhanced UI with streak bonus indicators in currency header (1.5x XP badge when active)
  - Updated daily quest notifications to show bonus XP amounts when streak is active
  - Added streak bonus display to workout victory modal with flame and trending up icons
  - Streak bonus applies meaningfully but not overwhelming: 50% increase for consistent players
- **Enhanced Daily Quest XP System**: Changed XP system to reward 5 XP for each individual quest completion plus 5 XP bonus for completing all four
  - Individual quest completion: 5 XP each (hydration, steps, protein, sleep)
  - All four quests completed: Additional 5 XP bonus (total 25 XP for all quests)
  - Updated UI to reflect new reward structure with clear messaging
  - Fixed leaderboard avatar border system to properly separate titles from avatar rarity
  - Avatar borders now based on skin selection only, not user status

**July 29, 2025 - Deployment Ready & Email Authentication Migration:**
- **Email-Based Authentication System**: Successfully migrated from username to email-based login
  - Updated Zero's test account to use guildmasterreid@gmail.com with properly hashed password
  - Email verification system working correctly with database email lookup
  - All authentication pages now use consistent app theme styling instead of custom colors
- **Fixed Currency Header Spacing Issues**: Resolved deployment-blocking UI problems
  - Improved mobile responsive spacing with tighter element positioning
  - Settings button now properly visible and accessible on all screen sizes
  - Responsive design with adaptive spacing using Tailwind breakpoints
- **Resolved Build Issues**: Fixed duplicate method warnings in storage.ts file
  - Removed duplicate getAllUsers, getExercises, and purchaseShopItem methods
  - Clean build process with no syntax errors or compilation failures
  - Application successfully builds and runs without warnings
- **Database Connection Verified**: PostgreSQL database ready for deployment
  - All schema migrations working correctly
  - User authentication and data persistence functioning properly
  - Application fully tested and operational

**July 29, 2025 - Deployment Preparation & App Branding Fixes:**
- **Complete App Branding Update**: Fixed all remaining references to old "Dumbbells & Dragons" name
  - Updated signup page title and success messages to "The Guild: Gamified Fitness"
  - Fixed all liability waiver modal references and legal documentation
  - Updated login page branding and welcome messages
  - Corrected medical disclaimer text to reference proper app name
- **Liability Waiver Submission Fix**: Resolved waiver acceptance issues preventing account creation
  - Fixed API request format to use proper JSON body structure
  - Corrected apiRequest function call to match expected parameters
  - Waiver submission now works correctly for new user registration
- **Dropdown UI Improvements**: Enhanced select component styling for better visibility
  - Added explicit text-foreground class to SelectItem components
  - Improved hover states and contrast for dropdown menu items
  - Fixed dark text visibility issues across all dropdown menus
- **Analytics & User Data Reset**: Complete reset for deployment preparation
  - Reset Zero's character stats to Level 1 with 0 XP and base stats
  - Removed test user data, keeping only Rob (admin) and Zero (test user)
  - Reset all analytics data to show 0 revenue, workouts, and engagement metrics
  - Updated user creation timestamps for fresh analytics tracking from deployment

**January 28, 2025 - Boss-Themed Title System & Avatar Border Separation:**
- **Updated Title System with Boss Names**: Replaced generic "Conqueror" titles with boss-themed progression titles
  - E-rank: "Goblin Slayer" (defeat Goblin King, Lv 1-10)
  - D-rank: "Orc Crusher" (defeat Orc Warlord, Lv 11-20)
  - C-rank: "Dragon Vanquisher" (defeat Ancient Wyrm, Lv 21-30)
  - B-rank: "Demon Hunter" (defeat Demon Lord, Lv 31-40) - In Development
  - A-rank: "Titan Slayer" (defeat Primordial Titan, Lv 41-50) - In Development
  - S-rank: "God Killer" (defeat Fallen God, Lv 51+) - In Development
- **G.M. Title Access**: Unlocked G.M. title for Zero alongside Rob, hidden from all other users
- **Avatar Border System**: Separated avatar borders from user status - now based on avatar rarity only
  - Yellow border for legendary avatars (Founders Pack "The First Flame" or Legendary Hunter skin)
  - Gray border for common/default avatars
  - User status (G.M.) only displayed through title text, not avatar borders
- **Enhanced Wardrobe Modal**: Updated title progression display with boss-themed requirements
- **Backend Validation**: Updated server-side title validation to match new boss titles
- **Fixed JSON Parsing**: Resolved double encoding issue in wardrobe title/avatar updates

**January 28, 2025 - Legendary Hunter Skin Integration & Shop Reorganization:**
- **Legendary Hunter Skin for Founders Pack**: Integrated custom pixel art skin "The Legendary Hunter" with yellow border styling
  - Added skin asset to Avatar2D component with special rarity detection for "The First Flame" title holders
  - Enhanced Founders Pack display in shop with skin preview and yellow legendary border
  - Updated stats page to show yellow border for Founders Pack users (matching G.M. red border system)
  - Skin automatically displays for users with "The First Flame" title or hasLegendaryHunterSkin property
- **Shop Reorganization Complete**: Streamlined shop structure with 4-tab layout
  - Removed Gem Shop and Founders Pack buttons from Quest page header for cleaner UI
  - Created dedicated "Bundles" tab with Gift icon and orange legendary styling
  - Moved Founders Pack to its own section with proper skin preview and features list
  - Added "Coming Soon" section for future bundle offers and seasonal packages
- **Email Service Enhancement**: Updated to use dedicated business email guildmasterreid@gmail.com for all admin notifications
  - Centralized all liability waiver and admin notifications to professional business email
  - Maintained MailerSend integration with proper error handling and logging
  - Admin notifications now route to dedicated business email instead of previous addresses

**January 28, 2025 - App Rebranding & MailerLite Integration:**
- **Complete App Rebranding**: Updated app name from "Dumbbells & Dragons" to "The Guild: Gamified Fitness"
  - Updated PWA manifest with new name and short name "The Guild"
  - Added proper HTML title and meta description for better SEO
  - Updated all email templates and legal documentation with new branding
  - Updated project documentation and code comments throughout codebase
- **MailerLite Email Integration Configured**: Successfully set up MailerLite API key and email service
  - Email service verified and working for liability waiver notifications
  - Admin notifications configured to guildmasterreid@gmail.com (dedicated business email)
  - Professional branded email templates for user confirmations and admin notifications
  - API connection tested and confirmed operational
  - Automatic liability waiver notifications sent when users create accounts

**January 28, 2025 - Founders Pack Exclusive Limited Edition:**
- **Exclusive Founders Pack**: Limited to first 100 users at $29.97 with comprehensive reward system
  - 1,000 gold coins + 200 premium gems + legendary "The First Flame" title + 12-week workout plan
  - Complete tracking system with claim numbers (1-100) and duplicate purchase prevention
  - Built scalable 12-week at-home workout program with beginner/intermediate/advanced variations
  - Added "The First Flame" as exclusive legendary title in the rarity system with proper yellow/legendary styling
  - Founders Pack prominently featured in Quest page and Gem Shop for maximum visibility
- **Avatar Rarity Borders**: Added colored borders around avatars on stats page to display rarity
  - Red border with glow for G.M. users (Rob's exclusive avatar)
  - Grey border with glow for basic male/female avatars
  - Creates visual distinction and exclusive status recognition
- **Enhanced User Experience**: Improved error messaging for potion usage at full health
  - Clear "Full Health. Cannot use potion" message for healing potions
  - Clear "Full Mana. Cannot use potion" message for mana potions
  - Prevents confusion and provides specific feedback to users
- **Business Strategy**: Three-tier monetization complete - workout programs ($9.97) + gems ($1.99-$19.99) + exclusive Founders Pack ($29.97)

**January 28, 2025 - Gems Currency System & Dual Monetization:**
- **Complete Gems Currency System**: Implemented premium currency for in-app purchases
  - Gems displayed in currency header alongside gold coins
  - Four gem pack tiers: 100 gems ($1.99), 250 gems ($4.99), 500 gems ($9.99), 1000 gems ($19.99)
  - Full Stripe payment integration for real money gem purchases with secure backend validation
  - Comprehensive gem shop page with modern UI and payment flow
- **Consumable Item System**: Streak freezes purchasable with gems only (25 gems each, max 2)
  - Prevents monetizing essential game mechanics with real money
  - Creates sustainable gem economy for consumable items
  - Integrated with existing streak protection and atrophy systems
- **Dual Revenue Model**: Two distinct monetization streams
  - One-time workout program purchases ($9.97 each) for premium content access
  - Recurring gem purchases for consumable items and future premium features
  - Gem Shop button prominently placed in Quest page header for discovery
- **Enhanced Navigation**: Fixed program navigation from Quest page to properly show workout program details
- **Business Strategy**: Sustainable revenue requiring only 5-10 workout program sales for break-even vs 1000+ subscription users

**January 28, 2025 - Workout Program Monetization System:**
- **Complete Workout Program Purchase System**: Implemented three-tier workout program structure at $9.97 each
  - Novice Fitness Foundation: Beginner-friendly 4-week program with bodyweight exercises
  - Intermediate Strength Builder: Progressive compound movements for experienced users
  - Advanced Athletic Performance: Elite training with Olympic lifts and plyometrics
- **Stripe Payment Integration**: One-time purchase system with lifetime access to programs
  - Complete payment flow with Stripe Elements for secure transactions
  - Purchase confirmation and user program tracking in database
  - Backend validation and program access control
- **Professional Program Content**: Created 12 detailed workout sessions across all difficulty levels
  - Week-by-week progression with specific exercises, sets, reps, and instructions
  - Tailored for different fitness levels and equipment access
  - Professional coaching notes and form cues included
- **Enhanced UI Navigation**: Added Programs button to workout page for easy discovery
- **Business Model Pivot**: Shifted from subscription AI features to one-time program purchases
  - AI Workouts button temporarily hidden to focus on core monetization
  - Sustainable revenue model requiring only 5-10 sales vs 1000 users for break-even

**January 28, 2025 - Comprehensive Analytics Dashboard for Admin Users:**
- **Complete Analytics System**: Built comprehensive analytics dashboard with real database-driven metrics
  - User metrics: Total users, active users, new user acquisition, average level, workout completion stats
  - Retention analytics: Daily, weekly, monthly retention with cohort analysis and signup-to-activity tracking
  - Engagement metrics: Workout completion rates, session duration, battles per user, popular exercises, level distribution
  - Revenue projections: Lifetime value calculations, subscription conversion rates, break-even analysis
- **Admin-Only Access**: Analytics restricted to users with "<G.M.>" title for security and data privacy
- **Real Data Integration**: All metrics calculated from actual database records (users, workout sessions, achievements)
- **Interactive Visualizations**: Charts and graphs using Recharts library for comprehensive data insights
- **Performance Optimized**: Efficient database queries with proper indexing and caching considerations

**January 28, 2025 - AI Features Temporarily Disabled:**
- **Cost Optimization**: Disabled AI workout recommendation system to reduce OpenAI API costs during pre-revenue phase
- **Routes Commented Out**: All AI-related API endpoints and frontend routes temporarily disabled
- **UI Elements Removed**: AI Workouts button and premium subscription flows hidden from interface
- **Infrastructure Preserved**: Complete AI system architecture remains intact for future activation when cash flow permits
- **Easy Reactivation**: Simply uncomment routes and restore UI elements when ready to monetize AI features

**January 27, 2025 - AI Workout Recommendation System with Premium Subscription:**
- **Complete AI-Powered Workout System**: Integrated OpenAI to generate personalized workout recommendations
  - Advanced prompt engineering with user stats, equipment access, and fitness level consideration
  - Equipment-specific recommendations (full gym, home gym, bodyweight only)
  - Adaptive training plans that adjust based on user feedback and progress
  - Multi-stat exercise selection with proper stat allocation and RPE integration
- **3-Month Minimum Premium Subscription**: Comprehensive Stripe integration with installment payments
  - $29.97 total cost charged as $9.99/month for 3 months
  - 30-day money-back guarantee with automatic refund processing
  - Premium feature gating for AI recommendations with graceful upgrade prompts
  - Subscription management with cancellation and refund capabilities
- **Advanced Workout Preferences System**: Detailed user preference tracking for personalized AI
  - Equipment access levels, training frequency, session duration preferences
  - Fitness level assessment, training style selection (strength, cardio, balanced)
  - Injury limitations tracking and exercise avoidance preferences
  - Preferred muscle group targeting with visual checkbox selection
- **Comprehensive Feedback Learning Loop**: AI system improves through user interaction
  - Workout difficulty rating collection and analysis
  - Volume and intensity feedback tracking for adaptive recommendations
  - Exercise replacement suggestions and success rate monitoring
  - Continuous learning database to enhance future recommendations
- **Premium Feature Discovery**: Strategic placement of AI features throughout app
  - Prominent AI Workouts button in workout page header with crown icon for non-subscribers
  - Gradient purple-to-pink styling to highlight premium nature
  - Seamless integration with existing workout creation workflow

**January 27, 2025 - Realistic Stat Progression with Diminishing Returns:**
- **Implemented XP-Based Stat Progression**: Replaced linear stat growth with realistic athletic development curve
  - Each stat (Strength, Stamina, Agility) now uses individual XP pools with exponential level requirements
  - Formula: level^2.5 × 50 creates strong diminishing returns mimicking real strength gains
  - Early levels are fast (noob gains), later levels require exponentially more effort
- **Balanced XP Distribution**: Realistic workout focus with 50% Strength, 30% Stamina, 20% Agility XP gains
- **Stat Squish Implementation**: Reduced XP numbers by 80% while maintaining progression curve
  - Strength training: 12 STR/7 STA/4 AGI XP per workout (was 60/36/24)
  - Cardio training: 1 STR/12 STA/3 AGI XP per workout (was 9/62/18)
  - Level requirements: Level 10 = 2,430 XP (was 12,150 XP)
  - Same progression timeline with cleaner, smaller numbers
- **Smart Workout Type Detection**: Automatically detects cardio vs strength training
  - Cardio (volume < 20 lbs/min): 10% Strength, 70% Stamina, 20% Agility XP
  - Strength (volume ≥ 20 lbs/min): 50% Strength, 30% Stamina, 20% Agility XP
- **Athletic Realism**: Level 9 strength after 1 year vs old system's unrealistic 2,350 stat points
- **Database Integration**: Utilizes existing strengthXp, staminaXp, agilityXp fields for proper progression tracking

**January 27, 2025 - MailerLite Integration & Liability Protection:**
- **MailerLite Email Service Integration**: Replaced SendGrid with MailerLite for all email communications
  - Comprehensive liability waiver system with professional HTML email templates
  - User confirmation emails with medical disclaimers and physician consultation requirements
  - Admin notification emails to coachreidmcg@gmail.com with detailed waiver acceptance records
  - Integrated into signup flow requiring waiver acceptance before account activation
  - Graceful handling when API key not configured (development mode)
- **Enhanced Legal Protection**: Complete liability waiver system with database storage
  - Medical disclaimers requiring physician approval before starting any exercise program
  - Entertainment-only purpose clauses protecting against medical liability
  - Comprehensive assumption of risk and release language
  - IP address and user agent tracking for legal documentation
  - Required acceptance during account creation process
- **DEPLOYMENT REMINDER**: Set up MailerLite API key before deploying the application

**January 27, 2025 - Title System Overhaul + Rarity Rebalance:**
- **Replaced Level-Based Titles with Dungeon Rank Completion System**: Future-proofed for expansion content
  - New titles tied to completing specific dungeon ranks (E/D/C/B/A/S-rank completion)
  - Removed dependency on character level to prevent title inflation with level cap increases
  - Added visual distinction between available titles and locked "In Development" content
- **Dungeon Rarity Color Rebalance**: Dropped all rarity tiers down one level for future S+ content
  - E-rank: White/Common (was Green/Uncommon)
  - D-rank: Green/Uncommon (was Blue/Rare) 
  - C-rank: Blue/Rare (was Purple/Epic)
  - B-rank: Purple/Epic (was Yellow/Legendary) + "In Development" lock
  - A-rank: Yellow/Legendary (was Orange/Mythic) + "In Development" lock
  - S-rank: Orange/Mythic (was Red/Relic) + "In Development" lock
  - Removed Relic tier completely for now, preserving expansion room
- **Updated Battle Page and Settings**: Consistent rarity display across all dungeon progression systems
  - Battle page shows new color scheme and development status with level ranges (E-rank: Lv 1-10, D-rank: Lv 11-20, etc.)
  - Settings page shows title progression with dungeon completion requirements and level ranges
  - All higher-tier content clearly marked as "In Development"
  - Level ranges follow clean 10-level increments for each dungeon rank

**January 27, 2025 - Performance & Polish + Progression Rebalance:**
- **Rebalanced XP Progression System**: Exponential leveling curve for long-term engagement
  - Level 50 now takes exactly 52 weeks (1 year) of consistent training (3 workouts/week)
  - Level 100 takes ~3.6 years, creating meaningful long-term progression
  - **Complete XP Stat Squish**: Reduced all XP numbers by 80% for cleaner, more readable progression
  - Character XP: Formula `level^1.8 × 16` (was 82) - Level 5 now needs 194 XP instead of 994 XP
  - Early levels still progress quickly for new user satisfaction
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