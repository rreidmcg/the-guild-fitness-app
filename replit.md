# FitQuest - Gamified Fitness Tracking Application

## Overview

FitQuest is a full-stack fitness tracking application that gamifies the workout experience through RPG-style character progression. Users can create workouts, track their sessions, and earn experience points while building their character's stats (strength, stamina, endurance, flexibility). The app features a mobile-friendly bottom navigation with dedicated pages for Stats, Workouts, and Settings, plus a custom 2D avatar system.

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
- **Users**: Character progression with level, experience, and stat tracking
- **Exercises**: Exercise library with categories and muscle group targeting
- **Workouts**: Template-based workout creation with JSON exercise configuration
- **Workout Sessions**: Completed workout tracking with performance metrics
- **Exercise Performances**: Individual exercise set/rep/weight tracking
- **Personal Records**: Achievement tracking for user milestones

## Key Components

### Authentication & User Management
- User registration and login system (implementation pending)
- Character progression system with RPG-style leveling
- Stat tracking (strength, stamina, endurance, flexibility)

### Exercise Management
- Comprehensive exercise library with categorization
- Muscle group targeting and stat type associations
- Exercise search and filtering capabilities

### Workout System
- Template-based workout creation
- JSON-based exercise configuration with sets, reps, weights
- Real-time workout session tracking with timer
- Progress tracking and performance logging

### Gamification Features
- XP calculation based on workout duration, volume, and exercise count
- Level progression with title system
- Stat gains based on workout type and intensity
- Achievement system through personal records

### User Interface
- Dark gaming theme with custom color palette
- Mobile-responsive design with bottom navigation
- Bottom navigation bar with Stats, Workouts, and Settings pages
- Custom 2D avatar system with visual progression based on stats
- Real-time workout session interface
- Dedicated pages for different app functions

## Data Flow

1. **User Registration/Login** → Character creation with initial stats
2. **Exercise Library** → Browse/search exercises by category and muscle groups
3. **Workout Creation** → Template builder with exercise selection and configuration
4. **Workout Execution** → Real-time session tracking with timer and performance logging
5. **Progress Calculation** → XP and stat gains based on workout completion
6. **Character Progression** → Level ups and stat improvements reflected in dashboard

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