# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production (includes Prisma generation)
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript type checking (includes React Router typegen)

### Database Operations
- `npm run db:migrate` - Create and apply new migrations
- `npm run db:push` - Apply schema changes to database
- `npm run db:studio` - Open Prisma database browser
- `npm run db:reset` - Reset database with fresh migrations
- `npm run db:deploy` - Deploy migrations to production
- `npm run db:sync-to-remote` - Sync local data to remote database
- `npm run db:sync-from-remote` - Sync remote data to local database

### Other Scripts
- `npm run update-sw` - Update service worker cache
- `npm install` - Automatically runs `prisma generate` via postinstall

## Architecture Overview

This is a full-stack golf management application built with React Router v7 and PostgreSQL.

### Core Stack
- **Frontend**: React 19 with React Router v7 (SSR enabled)
- **Backend**: React Router server functions
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS v4
- **Auth**: Session-based with bcryptjs password hashing

### Key Application Models
The database schema centers around golf trip management:

- **User**: Account management with optional golfer association
- **Golfer**: Golf participants with yearly status tracking
- **Foursome**: Golf groups with tee times, courses, and scores
- **Champion**: Yearly champions with photos and Q&A data
- **Photo**: Gallery management with Cloudflare integration
- **Session**: Authentication tokens with 30-day expiration

### Project Structure
- `app/lib/` - Core utilities (auth, db, session, validation, weather, email)
- `app/components/` - Reusable UI components organized by purpose
  - `ui/` - Base UI components (Button, Card, Input, etc.)
  - `cards/` - Feature-specific card components
  - `dashboard/` - Dashboard-specific components
- `app/routes/` - React Router v7 file-based routing
- `prisma/` - Database schema and migrations
- `scripts/` - Utility scripts for database sync and service worker updates

### Authentication Flow
- Session-based authentication using httpOnly cookies
- Automatic session cleanup for expired tokens
- Password reset functionality with time-limited tokens
- Admin role support for privileged operations

### Key Features
- Multi-year golf trip data with yearly golfer status
- Photo gallery with Cloudflare storage
- Weather integration for golf conditions
- Email notifications via Resend
- PWA support with service worker
- Responsive design optimized for mobile

### Development Notes
- Database migrations are required for schema changes
- Prisma client regeneration happens automatically on build/install
- TypeScript strict mode enabled
- The app uses server-side rendering by default
- Environment variables managed through DATABASE_URL