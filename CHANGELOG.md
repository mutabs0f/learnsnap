# LearnSnap Changelog

## [v1.2.0] - Production Monitoring & Observability - 2024-12-18

### Logging System
- [x] Winston logging with daily file rotation
- [x] Separate log files: errors (30d), combined (14d), http (7d)
- [x] Console logging in development, file-only in production
- [x] Structured JSON logging with timestamps
- [x] HTTP request logging middleware

### Health Check Endpoints
- [x] `/health` - Basic health status with uptime and version
- [x] `/health/ready` - Service readiness (database, AI keys, Stripe)
- [x] `/health/live` - Kubernetes liveness probe support

### Environment Configuration
- [x] Zod schema validation for environment variables
- [x] Fail-fast in production for missing required keys
- [x] Warnings in development for optional keys
- [x] Type-safe config access throughout application

### Graceful Shutdown
- [x] SIGTERM/SIGINT signal handling
- [x] 30-second timeout for graceful cleanup
- [x] HTTP server close before exit
- [x] Uncaught exception and unhandled rejection handlers

### Error Handling
- [x] Enhanced useErrorHandler hook with Arabic messages
- [x] Detailed error titles for all HTTP status codes
- [x] Auto-redirect to auth on 401 with delay
- [x] Success message helper function added

### Files Added
- server/logger.ts - Winston logging configuration
- server/config.ts - Environment validation with Zod

### Files Modified
- server/index.ts - Graceful shutdown, logger integration
- server/routes.ts - Health check endpoints
- server/storage.ts - healthCheck() method for DB connectivity
- client/src/hooks/useErrorHandler.ts - Enhanced error messages
- .gitignore - Added logs directory

## [v1.1.0] - Security & Production Hardening - 2024-12-18

### Security Improvements
- [x] Implemented cookie-based JWT authentication for child flow (httpOnly, 24h expiry)
- [x] Implemented cookie-based JWT authentication for parent flow (httpOnly, 7-day expiry)
- [x] Added rate limiting (global: 100 req/15min, auth: 5 attempts/15min, AI: 10 req/hour)
- [x] Configured CORS properly with credentials support
- [x] Enhanced input validation with Zod schemas on all endpoints
- [x] Added security headers with helmet middleware
- [x] Implemented ownership verification on all protected routes
- [x] Child login requires verified parent session

### Route Protection
- [x] All parent routes use requireParentSession middleware
- [x] All child routes use requireChildAccess middleware
- [x] Chapter routes verify ownership (childId or parentId match)
- [x] Learning session routes verify both child and chapter ownership
- [x] Result routes verify authenticated context owns the result
- [x] Analytics routes use authenticated IDs, ignore URL params

### Authentication Architecture
- [x] Pure cookie-based authentication (no localStorage) prevents XSS token theft
- [x] Separate tokens for parent (parent_token) and child (child_token)
- [x] requireParentSession extracts authenticatedParentId from cookie
- [x] requireChildAccess accepts child JWT or parent session with ownership check

### Error Handling
- [x] Added React ErrorBoundary component
- [x] Created useErrorHandler hook for consistent error handling
- [x] Improved form validation messages throughout app
- [x] Added proper HTTP status codes for all error responses

### Files Added
- server/auth.ts - JWT utilities, cookie management, authentication middleware
- server/security.ts - Rate limiting, helmet, CORS configuration
- client/src/components/ErrorBoundary.tsx - React error boundary
- client/src/hooks/useErrorHandler.ts - Error handling hook
- client/src/hooks/useChildAuth.ts - Child authentication hook
- CHANGELOG.md - This file
- SECURITY.md - Security documentation
- DEPLOYMENT.md - Deployment guide
- TESTING.md - Testing checklist
- IMPROVEMENTS_SUMMARY.md - Summary of all improvements

### Files Modified
- server/routes.ts - Added JWT middleware, rate limiting, ownership verification
- server/index.ts - Added security middleware, cookie-parser
- server/storage.ts - Added getLearningSessionById, getNotificationById helpers
- replit.md - Updated with security architecture documentation
- All protected routes - Added ownership verification checks

### Dependencies Added
- jsonwebtoken + @types/jsonwebtoken
- cookie-parser + @types/cookie-parser
- express-rate-limit
- helmet
- cors + @types/cors

### Environment Variables
- JWT_SECRET (auto-generated if not set)
- SESSION_SECRET (required)
- DATABASE_URL (required)

## [v1.0.0] - Initial MVP - 2024-12-17

### Features
- Parent dashboard with child management
- Photo upload (up to 20 images per chapter)
- 3-AI verification pipeline (Gemini Flash, GPT-4o mini, Claude Sonnet)
- Child learning flow (Learn, Practice, Test stages)
- Gamification with stars, streaks, and badges
- Voice narration using Web Speech API
- Stripe subscription integration
- Advanced analytics dashboard
- PDF report export
- Arabic RTL support with dual design system
