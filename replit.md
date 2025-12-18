# LearnSnap - Educational AI Platform

## Overview
LearnSnap is a B2C SaaS educational app that transforms textbook pages into interactive learning experiences for elementary students (ages 6-12) in Saudi Arabia. Parents upload photos of textbook pages, and AI generates interactive lessons, practice questions, and tests.

## Project State
- **Status**: MVP Complete with Production Monitoring (v1.2.0)
- **Last Updated**: December 2025

## Recent Changes
- Implemented complete database schema with PostgreSQL
- Built all parent and child app pages with RTL Arabic support
- Integrated 3-AI verification pipeline (Gemini → OpenAI → Anthropic)
- Added secure authentication with bcrypt password hashing
- Created dual design system (professional parent UI vs playful child UI)
- Added Stripe subscription integration with tiered pricing
- Built advanced analytics dashboard with charts
- Implemented gamification with badges and leaderboards
- Added voice narration using Web Speech API for children
- Created parent notification system with preferences
- **Security Hardening Complete**: Cookie-based authentication with ownership verification

## Security Architecture
- **Parent Authentication**: httpOnly JWT cookies (7-day expiry) via requireParentSession middleware
- **Child Authentication**: httpOnly JWT cookies (24-hour expiry) via requireChildAccess middleware
- **Child login requires parent session**: Parent must be authenticated before child token is issued
- **Ownership Verification**: All chapter/result/session routes verify resource belongs to authenticated user
- **Rate Limiting**: Global API (100 req/15min), auth (5 attempts/15min), AI processing (10 req/hour)
- **Security Headers**: Helmet middleware for XSS/clickjacking protection
- **No localStorage auth**: Pure cookie-based system prevents XSS token theft

## Architecture

### Tech Stack
- **Frontend**: React + Vite + wouter routing
- **Backend**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS + shadcn/ui components
- **AI**: Gemini Flash (generation), GPT-4o mini (verification), Claude Sonnet (error fixing)

### Database Schema
- `users` - Parent accounts with email/password auth
- `children` - Child profiles linked to parents
- `chapters` - AI-generated learning content
- `chapter_results` - Test scores and answers
- `chapter_photos` - Uploaded textbook images

### Key Features
1. **Parent Dashboard** - Manage children, upload chapters, view reports
2. **Photo Upload** - Drag & drop up to 20 textbook images
3. **AI Processing** - 3-stage verification pipeline for quality content
4. **Child Learning Flow**:
   - Learn: Simple explanations with visuals
   - Practice: 5 questions with instant feedback
   - Test: 10 questions for assessment
5. **Gamification** - Stars, streaks, achievements

## User Preferences
- Arabic RTL interface (Cairo font for parents, Fredoka for children)
- Dual design system:
  - Parent app: Professional blue/green palette
  - Child app: Playful coral/turquoise/yellow gradients
- No emojis in UI (use Lucide React icons)

## Project Structure
```
client/src/
├── pages/
│   ├── auth.tsx           # Login/Register
│   ├── dashboard.tsx      # Parent home
│   ├── upload.tsx         # Photo upload
│   ├── processing.tsx     # AI processing status
│   ├── chapter.tsx        # Chapter details
│   ├── report.tsx         # Performance report
│   ├── child-welcome.tsx  # Child greeting
│   ├── child-lessons.tsx  # Lessons list
│   ├── learn-stage.tsx    # Reading content
│   ├── practice-stage.tsx # Practice questions
│   ├── test-stage.tsx     # Assessment
│   └── results.tsx        # Score display
server/
├── routes.ts              # API endpoints
├── storage.ts             # Database operations
├── ai-service.ts          # AI pipeline
└── db.ts                  # Database connection
shared/
└── schema.ts              # Drizzle schema + types
```

## Environment Variables
Uses Replit AI Integrations:
- `AI_INTEGRATIONS_GEMINI_API_KEY`
- `AI_INTEGRATIONS_OPENAI_API_KEY`
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY`
- `DATABASE_URL` (PostgreSQL)
- `SESSION_SECRET`
