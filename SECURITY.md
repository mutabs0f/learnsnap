# Security Documentation

## Authentication Architecture

### Parent Authentication
- **Method**: Cookie-based JWT (httpOnly)
- **Cookie Name**: `parent_token`
- **Expiration**: 7 days
- **Middleware**: `requireParentSession`
- **Password Storage**: bcrypt with 10 salt rounds

### Child Authentication
- **Method**: Cookie-based JWT (httpOnly)
- **Cookie Name**: `child_token`
- **Expiration**: 24 hours
- **Middleware**: `requireChildAccess`
- **Prerequisite**: Parent must be authenticated first

### Token Security
- Tokens stored in httpOnly cookies (not accessible via JavaScript)
- SameSite=Lax prevents CSRF in most cases
- Secure flag enabled in production
- No localStorage usage prevents XSS token theft

## Authorization

### Ownership Verification
All protected routes verify that the authenticated user owns the requested resource:

1. **Chapter Access**: Verifies `chapter.childId` matches authenticated child OR `chapter.parentId` matches authenticated parent
2. **Result Access**: Verifies result ownership through child or parent context
3. **Session Access**: Verifies session belongs to authenticated child AND chapter belongs to child
4. **Analytics Access**: Ignores URL parameters, uses authenticated IDs from cookies

### Middleware Chain
```
Request → CORS → Helmet → Rate Limiting → Cookie Parser → 
Auth Middleware (requireParentSession/requireChildAccess) → 
Ownership Verification → Route Handler
```

## Rate Limiting

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| Global API | 100 requests | 15 minutes |
| Auth endpoints (/api/auth/*) | 5 attempts | 15 minutes |
| AI processing (/api/chapters) | 10 requests | 1 hour |

Rate limit headers returned:
- `RateLimit-Limit`
- `RateLimit-Remaining`
- `RateLimit-Reset`

## Security Headers (Helmet)

| Header | Value |
|--------|-------|
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY |
| X-XSS-Protection | 1; mode=block |
| Referrer-Policy | strict-origin-when-cross-origin |
| Content-Security-Policy | Configured for app requirements |

## Input Validation

### Zod Schema Validation
All API endpoints validate input using Zod schemas from `drizzle-zod`:
- Registration: Email format, password length
- Login: Required fields validation
- Chapter creation: Child ID, subject, grade level
- File uploads: Type validation, size limits (10MB max per photo)

### SQL Injection Prevention
- Drizzle ORM uses parameterized queries
- No raw SQL execution from user input
- All IDs validated as UUIDs

## CORS Configuration

```typescript
{
  origin: process.env.FRONTEND_URL || true,
  credentials: true,  // Required for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

## Sensitive Data Handling

### Passwords
- Never logged or returned in responses
- Hashed with bcrypt (10 rounds)
- Compared using timing-safe comparison

### API Keys
- Stored only in environment variables
- Never exposed to frontend
- AI API keys managed by Replit Integrations

### Session Secrets
- JWT_SECRET: 32+ character random string
- SESSION_SECRET: Used for express-session

## Security Checklist

- [x] httpOnly cookies for tokens
- [x] SameSite cookie attribute
- [x] Secure cookies in production
- [x] Rate limiting on all endpoints
- [x] Input validation with Zod
- [x] SQL injection prevention (Drizzle ORM)
- [x] XSS prevention (httpOnly tokens)
- [x] CSRF protection (SameSite cookies)
- [x] Security headers (Helmet)
- [x] Ownership verification on all routes
- [x] Password hashing (bcrypt)
- [x] No sensitive data in logs
