# Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Replit account (or similar platform)
- Stripe account (for payments)
- API keys: Gemini, OpenAI, Anthropic

## Environment Variables

### Required Variables

```bash
# Core
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SESSION_SECRET=your_random_session_secret_32chars

# AI APIs (via Replit AI Integrations)
AI_INTEGRATIONS_GEMINI_API_KEY=your_key
AI_INTEGRATIONS_OPENAI_API_KEY=your_key
AI_INTEGRATIONS_ANTHROPIC_API_KEY=your_key

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

### Optional Variables

```bash
# Auto-generated if not set
JWT_SECRET=your_32_char_random_string

# Logging (defaults to 'info')
LOG_LEVEL=info
```

## Replit Deployment

### 1. Configure Secrets
In Replit, go to Secrets tab and add all required environment variables.

### 2. Configure Replit
The `.replit` file and `replit.nix` are pre-configured for deployment.

### 3. Deploy
Click the "Deploy" button in Replit to publish your app.

### 4. Configure Database
The database is automatically provisioned by Replit. Schema is pushed on first run.

### 5. Configure Stripe Webhooks
- Add webhook endpoint: `https://your-app.replit.app/api/subscription/webhook`
- Select events: `customer.subscription.*`, `invoice.payment.*`
- Copy signing secret to `STRIPE_WEBHOOK_SECRET`

## Manual Deployment (Other Platforms)

### 1. Clone and Install

```bash
git clone <repository>
cd learnsnap
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Setup Database

```bash
# Push schema to database
npm run db:push
```

### 4. Build and Start

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Health Checks

The application exposes health check endpoints:

| Endpoint | Purpose |
|----------|---------|
| `/api/health` | Basic health check |
| `/api/health/ready` | Readiness probe (includes DB check) |
| `/api/health/live` | Liveness probe |

## Monitoring

### Application Logs
- Logs are output to stdout in production
- Use your platform's log viewer (Replit Dashboard, Vercel, etc.)

### Error Tracking
- Consider adding Sentry for error monitoring
- Set `SENTRY_DSN` environment variable if configured

### Performance Metrics
- Monitor response times for AI processing endpoints
- Track rate limit hits

## Post-Deployment Verification

1. **Health Check**: Visit `/api/health` - should return 200
2. **Registration**: Create a test account
3. **Login**: Verify authentication works
4. **Upload**: Test photo upload with a small image
5. **AI Processing**: Verify AI pipeline processes content
6. **Subscription**: Test Stripe checkout flow (use test mode first)

## Scaling Considerations

### Database
- Connection pooling is configured (max 10 connections)
- Consider increasing pool size for higher traffic

### AI Processing
- Rate limited to 10 requests/hour per user
- Consider queue-based processing for high volume

### Static Assets
- Vite builds optimized bundles
- Consider CDN for static assets in high-traffic scenarios

## Rollback Procedure

1. Replit automatically creates checkpoints
2. Use "View Checkpoints" to restore previous version
3. Database can be rolled back independently

## Security Reminders

- Never commit `.env` files
- Rotate JWT_SECRET if compromised
- Regularly update dependencies
- Monitor rate limit violations for potential attacks
