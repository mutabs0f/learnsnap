# LearnSnap - Educational AI Platform

## Overview
LearnSnap is a B2C SaaS educational application that transforms textbook pages into interactive AI-powered learning experiences for elementary students (ages 6-12) in Saudi Arabia. Parents upload photos of textbook pages, and AI generates interactive lessons, practice questions, and tests.

## Technology Stack
- **Frontend**: React 18 + Vite + TypeScript
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: wouter (frontend)
- **State Management**: TanStack Query v5
- **AI Integration**: 
  - Google Gemini Flash 2.0 (content generation)
  - OpenAI GPT-4o mini (verification)
  - Anthropic Claude Sonnet (error fixing)
- **Payments**: Stripe (subscriptions)
- **PDF Generation**: jspdf + html2canvas

## Implemented Features

### Core Features
1. **User Authentication**
   - Parent registration with email/password
   - Secure login with bcrypt password hashing
   - Session management with express-session
   - PostgreSQL session storage

2. **Child Profile Management**
   - Add/manage multiple children per parent account
   - Age-appropriate content (6-12 years)
   - Individual progress tracking per child

3. **Photo Upload & AI Processing**
   - Drag & drop photo upload (up to 20 images)
   - Base64 image encoding for AI processing
   - 3-stage AI verification pipeline
   - Real-time processing status updates

4. **AI Content Generation Pipeline**
   - Stage 1: Gemini Flash generates initial content
   - Stage 2: GPT-4o mini verifies and enhances
   - Stage 3: Claude Sonnet fixes any errors
   - Structured JSON output with lessons and questions

5. **Learning Flow for Children**
   - Learn Stage: Simple explanations with visual aids
   - Practice Stage: 5 questions with instant feedback
   - Test Stage: 10 questions for assessment
   - Results display with star ratings

### Premium Features (MVP Complete)

6. **Stripe Subscription Integration**
   - 4 subscription tiers: Free, Basic, Pro, Family
   - Stripe Checkout for payments
   - Webhook handling for subscription events
   - Usage limits based on tier
   - Subscription management UI

7. **Advanced Analytics Dashboard**
   - Learning time tracking per session
   - Subject-wise performance metrics
   - Progress charts over time
   - Comparison between siblings
   - Recent activity timeline

8. **Gamification System**
   - Star rewards for completed chapters
   - Achievement badges (first chapter, perfect score, streaks)
   - Streak tracking for consistent learning
   - Sibling leaderboards

9. **Voice Narration**
   - Web Speech API integration
   - Arabic text-to-speech
   - Paragraph-by-paragraph narration
   - Play/pause/stop controls
   - Auto-scroll to current paragraph

10. **Parent Notification System**
    - In-app notifications
    - Notification preferences (email, push)
    - Chapter completion alerts
    - Weekly progress summaries

11. **PDF Export**
    - Detailed performance reports
    - Charts rendered as images
    - Personalized recommendations
    - Download functionality

12. **Content Library**
    - Pre-generated sample chapters
    - Subject categories (Math, Science, Arabic)
    - Preview before assignment
    - One-click assignment to children

13. **Multi-language Support**
    - Arabic/English toggle
    - Complete i18n dictionary
    - RTL layout support
    - Localized date/time formatting
    - Language preference persistence

## Database Schema

### Tables
- `users` - Parent accounts with authentication
- `children` - Child profiles linked to parents
- `chapters` - AI-generated learning content
- `chapter_results` - Test scores and answers
- `chapter_photos` - Uploaded textbook images
- `badges` - Achievement definitions
- `child_badges` - Earned badges per child
- `notifications` - Parent notification queue
- `sample_chapters` - Pre-generated demo content

### Key Relationships
- users → children (one-to-many)
- children → chapters (one-to-many)
- chapters → chapter_results (one-to-many)
- chapters → chapter_photos (one-to-many)
- children → child_badges (one-to-many)
- users → notifications (one-to-many)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new parent account
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - End session
- `GET /api/auth/me` - Get current user

### Children
- `GET /api/children` - List children for parent
- `POST /api/children` - Add new child
- `GET /api/children/:id` - Get child details
- `PATCH /api/children/:id` - Update child

### Chapters
- `GET /api/chapters` - List chapters for child
- `POST /api/chapters` - Create new chapter
- `GET /api/chapters/:id` - Get chapter with content
- `POST /api/chapters/:id/process` - Start AI processing
- `GET /api/chapters/:id/status` - Check processing status

### Results
- `POST /api/chapters/:id/results` - Submit test results
- `GET /api/chapters/:id/results` - Get results for chapter

### Analytics
- `GET /api/analytics/children` - Performance data for all children
- `GET /api/analytics/children/:id` - Detailed analytics for child

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `GET /api/notifications/preferences` - Get preferences
- `PATCH /api/notifications/preferences` - Update preferences

### Subscriptions
- `GET /api/subscription` - Get current subscription
- `POST /api/subscription/create-checkout` - Create Stripe checkout
- `POST /api/subscription/webhook` - Stripe webhook handler

### Content Library
- `GET /api/sample-chapters` - List sample chapters
- `POST /api/sample-chapters/:id/assign` - Assign to child

## File Structure

```
learnsnap/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── contexts/         # React contexts (language, theme)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities (queryClient, i18n, utils)
│   │   ├── pages/            # Page components
│   │   │   ├── auth.tsx
│   │   │   ├── dashboard.tsx
│   │   │   ├── upload.tsx
│   │   │   ├── processing.tsx
│   │   │   ├── chapter.tsx
│   │   │   ├── report.tsx
│   │   │   ├── analytics.tsx
│   │   │   ├── notifications.tsx
│   │   │   ├── subscription.tsx
│   │   │   ├── content-library.tsx
│   │   │   ├── child-welcome.tsx
│   │   │   ├── child-lessons.tsx
│   │   │   ├── learn-stage.tsx
│   │   │   ├── practice-stage.tsx
│   │   │   ├── test-stage.tsx
│   │   │   └── results.tsx
│   │   ├── App.tsx           # Main app with routing
│   │   ├── main.tsx          # Entry point
│   │   └── index.css         # Global styles
│   └── index.html
├── server/                    # Backend Express application
│   ├── routes.ts             # API route definitions
│   ├── storage.ts            # Database operations
│   ├── ai-service.ts         # AI pipeline integration
│   ├── db.ts                 # Database connection
│   ├── index.ts              # Server entry point
│   └── vite.ts               # Vite dev server integration
├── shared/                    # Shared types and schemas
│   └── schema.ts             # Drizzle schema + Zod types
├── drizzle/                   # Database migrations
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
├── drizzle.config.ts
└── replit.md                 # Project documentation
```

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Express session secret

### AI Integrations (Replit managed)
- `AI_INTEGRATIONS_GEMINI_API_KEY` - Google Gemini API
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` - Anthropic API

### Stripe (Optional for payments)
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `VITE_STRIPE_PUBLIC_KEY` - Stripe publishable key (frontend)

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL database
- API keys for Gemini, OpenAI, Anthropic
- Stripe account (for payments)

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run database migrations: `npm run db:push`
5. Start development server: `npm run dev`

### Database Setup
```bash
# Push schema to database
npm run db:push

# Generate migrations (if needed)
npm run db:generate
```

## Design System

### Parent Interface
- Professional blue/green palette
- Cairo font (Arabic-optimized)
- Clean, modern UI
- RTL layout for Arabic

### Child Interface
- Playful coral/turquoise/yellow gradients
- Fredoka font (child-friendly)
- Large touch targets
- Animated elements
- Voice narration support

## Current Status
- **MVP Status**: Complete
- **All 8 premium features**: Implemented and tested
- **Database**: PostgreSQL with full schema
- **Authentication**: Secure with bcrypt + sessions
- **AI Pipeline**: 3-stage verification working
- **Payments**: Stripe integration complete
- **i18n**: Arabic/English support

## Known Considerations
- localStorage userId used for child flow (simplified auth)
- Voice narration requires browser support for Web Speech API
- PDF export uses client-side rendering
- Stripe webhooks require public endpoint in production
