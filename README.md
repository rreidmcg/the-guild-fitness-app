# The Guild: Gamified Fitness

![CI](https://github.com/rreidmcg/the-guild-fitness-app/actions/workflows/ci.yml/badge.svg)

A full-stack fitness tracking application that gamifies the workout experience through RPG-style character progression. Users can create and track workouts, earning experience and building character stats (strength, stamina, agility).

## Features

- **Character Progression**: RPG-style leveling with strength, stamina, and agility stats
- **Gamified Workouts**: Earn XP and gold from completing workouts and battles
- **Dungeon System**: Story-driven progression through challenging content
- **Real-time Battles**: WebSocket-based multiplayer combat system
- **Analytics Dashboard**: Comprehensive user analytics and insights
- **Mobile-First Design**: Responsive interface optimized for mobile devices

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with session management
- **Real-time**: WebSockets for multiplayer features

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Run tests
pnpm run test

# Type checking
pnpm run typecheck

# Linting
pnpm run lint

# Build for production
pnpm run build
```

## CI/CD

This project uses GitHub Actions for continuous integration. All pushes and pull requests automatically run:

- Type checking
- Linting
- Tests
- Coverage reporting
- Production builds