# LearnSnap v1.1.0 Updates

## What's New

### Security Enhancements
- **Cookie-based JWT Authentication**: Both parent and child sessions now use httpOnly cookies, preventing XSS attacks from stealing tokens
- **Ownership Verification**: All protected routes verify that the authenticated user owns the requested resource
- **Rate Limiting**: Prevents abuse with configurable limits on API endpoints
- **Security Headers**: Helmet middleware adds comprehensive security headers

### Authentication Flow

#### Parent Flow
1. Parent registers/logs in
2. Server issues `parent_token` cookie (7-day expiry)
3. All parent routes check this cookie via `requireParentSession`
4. Parent ID extracted from token, not URL params

#### Child Flow
1. Parent must be authenticated first
2. Child logs in via parent session
3. Server issues `child_token` cookie (24-hour expiry)
4. Child routes check this cookie via `requireChildAccess`
5. Fallback: Parent cookie accepted with ownership verification

### Protected Routes

| Route | Protection |
|-------|------------|
| `/api/children` | Parent session required |
| `/api/chapters` | Parent/child session + ownership |
| `/api/analytics/*` | Parent session required |
| `/api/notifications/*` | Parent session required |
| `/api/subscription/*` | Parent session required |
| `/api/sessions/*` | Child session + ownership |

### Rate Limits

| Endpoint | Limit |
|----------|-------|
| Global API | 100 requests / 15 min |
| Auth endpoints | 5 attempts / 15 min |
| AI processing | 10 requests / hour |

## Configuration

### Environment Variables

Required:
```bash
DATABASE_URL=postgresql://...
SESSION_SECRET=your_32_char_secret
```

Auto-generated if not set:
```bash
JWT_SECRET=auto_generated_if_missing
```

AI APIs (via Replit Integrations):
```bash
AI_INTEGRATIONS_GEMINI_API_KEY=...
AI_INTEGRATIONS_OPENAI_API_KEY=...
AI_INTEGRATIONS_ANTHROPIC_API_KEY=...
```

Stripe:
```bash
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
VITE_STRIPE_PUBLIC_KEY=...
```

## Documentation

- **CHANGELOG.md** - Complete changelog
- **SECURITY.md** - Security architecture
- **DEPLOYMENT.md** - Deployment guide
- **TESTING.md** - Testing checklist
- **IMPROVEMENTS_SUMMARY.md** - Summary of changes

## Upgrade Notes

### From v1.0.0
1. No database migrations required
2. New dependencies added automatically
3. JWT_SECRET auto-generated if not set
4. All existing user sessions remain valid

### Breaking Changes
- None for end users
- API authentication now requires cookies (was already cookie-based)

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:5000
```

## Support

For issues or questions, refer to:
- DEPLOYMENT.md for setup issues
- SECURITY.md for security questions
- TESTING.md for testing guidance
