# Launch Checklist

## Pre-Launch Testing

### Authentication
- [ ] Register new account works
- [ ] Login works
- [ ] Logout works
- [ ] JWT tokens set correctly (check browser cookies)
- [ ] Session expires after correct time
- [ ] Can't access protected routes without auth

### Parent Flow
- [ ] Can add child profile
- [ ] Can upload 1 photo
- [ ] Can upload 10 photos
- [ ] Can upload 20 photos (max)
- [ ] Upload 21 photos rejected
- [ ] Can view processing status
- [ ] Can view generated chapter
- [ ] Can view detailed report
- [ ] Can download PDF report

### Child Flow
- [ ] Child login creates JWT cookie
- [ ] Can access learning page
- [ ] Can complete Learn stage
- [ ] Can complete Practice (5 questions)
- [ ] Can complete Test (10 questions)
- [ ] Results display correctly
- [ ] Stars calculated correctly
- [ ] Badges unlock correctly

### Security
- [ ] Rate limiting works (try 101 requests)
- [ ] Invalid input rejected
- [ ] Can't access other user's data
- [ ] httpOnly cookies set
- [ ] Secure flag in production
- [ ] CORS works correctly

### AI Processing
- [ ] Upload real textbook photos
- [ ] AI generates valid content
- [ ] Content is in Arabic
- [ ] Questions have correct answers
- [ ] Processing completes in < 60s

### Monitoring
- [ ] `/health` returns 200
- [ ] `/health/ready` shows all services
- [ ] `/health/live` returns 200
- [ ] Logs appear in logs/ folder
- [ ] Errors logged correctly

## Deployment

- [ ] Environment variables set
- [ ] Database migrated
- [ ] Sample chapters seeded
- [ ] Stripe webhooks configured
- [ ] SSL certificate valid
- [ ] Domain configured

## Post-Launch

- [ ] Monitor error logs
- [ ] Monitor response times
- [ ] Check health endpoints
- [ ] Gather user feedback
- [ ] Fix critical bugs
