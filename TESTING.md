# Testing Guide

## Manual Testing Checklist

### Parent Registration & Login
- [ ] Register new account with valid email
- [ ] Register with invalid email (should fail)
- [ ] Register with short password (should fail)
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Login rate limiting (5 attempts max)
- [ ] Logout clears session cookie

### Child Management
- [ ] Add child profile with name, age, grade
- [ ] View list of children
- [ ] Verify child appears in dashboard

### Photo Upload
- [ ] Upload 1 photo (test basic flow)
- [ ] Upload 10 photos (test multiple)
- [ ] Upload 20 photos (max limit)
- [ ] Try upload 21 photos (should fail)
- [ ] Upload invalid file type (should fail)
- [ ] Upload oversized file (should fail, >10MB)

### AI Processing
- [ ] View processing status page
- [ ] Wait for 3-stage AI verification
- [ ] Verify chapter content is generated
- [ ] Check for valid questions (5 practice, 10 test)

### Child Learning Flow
- [ ] Access child lessons list
- [ ] See available chapters
- [ ] Complete Learn stage (read content)
- [ ] Complete Practice stage (5 questions)
- [ ] View instant feedback on answers
- [ ] Complete Test stage (10 questions)
- [ ] View results with star rating
- [ ] Verify stars are awarded

### Gamification
- [ ] Check star count increases after test
- [ ] Check streak updates on consecutive days
- [ ] Verify badge unlocking works
- [ ] View sibling leaderboard

### Reports & Analytics
- [ ] View chapter detail page
- [ ] View performance report
- [ ] Check analytics dashboard
- [ ] Download PDF report

### Subscription Flow
- [ ] View subscription page
- [ ] Select a plan
- [ ] Complete Stripe checkout (test mode)
- [ ] Verify subscription status updates

### Voice Narration (Child App)
- [ ] Enable voice narration
- [ ] Verify text is read aloud
- [ ] Test pause/resume functionality

## Security Testing

### Authentication
- [ ] Verify JWT token is in httpOnly cookie
- [ ] Verify token not accessible via JavaScript
- [ ] Check parent token expires after 7 days
- [ ] Check child token expires after 24 hours

### Rate Limiting
- [ ] Make 101+ requests quickly (should get 429)
- [ ] Verify rate limit headers in response
- [ ] Test auth endpoint (5 attempts limit)

### Authorization
- [ ] Try accessing another user's chapters (should fail 403)
- [ ] Try accessing another user's children (should fail 403)
- [ ] Verify child can only access own chapters

### Input Validation
- [ ] Submit form with missing required fields
- [ ] Submit malformed JSON to API
- [ ] Try XSS payloads in form fields
- [ ] Try SQL injection in inputs

### CORS
- [ ] Request from allowed origin (should work)
- [ ] Request from different origin (should fail)

## Error Handling Testing

### Client-Side Errors
- [ ] Disconnect internet (offline banner appears)
- [ ] Submit invalid form (validation messages show)
- [ ] Navigate to non-existent route (404 page)
- [ ] Trigger component error (ErrorBoundary catches)

### Server-Side Errors
- [ ] Verify 400 for bad requests
- [ ] Verify 401 for unauthenticated requests
- [ ] Verify 403 for unauthorized access
- [ ] Verify 429 for rate limited requests
- [ ] Verify 500 errors are handled gracefully

## Browser Compatibility

### Desktop Browsers
- [ ] Chrome 90+
- [ ] Firefox 90+
- [ ] Safari 14+
- [ ] Edge 90+

### Mobile Browsers
- [ ] Chrome Mobile (Android)
- [ ] Safari iOS
- [ ] Samsung Internet

### RTL Support
- [ ] Arabic text displays correctly
- [ ] Layout is mirrored properly
- [ ] Icons are positioned correctly

## Performance Testing

| Metric | Target |
|--------|--------|
| Page load time | < 2 seconds |
| AI processing | < 60 seconds |
| Photo upload | < 5 seconds per image |
| Report generation | < 1 second |
| API response time | < 200ms |

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Sufficient color contrast
- [ ] Focus indicators visible
- [ ] Alt text on images

## Test Data

### Sample Parent Account
- Email: test@example.com
- Password: TestPassword123!

### Sample Child
- Name: أحمد (Ahmed)
- Age: 8
- Grade: 3

### Sample Test Image
- Use any clear textbook page image
- JPEG or PNG format
- Under 10MB

## Automated Testing (Future)

Consider adding:
- Jest for unit tests
- React Testing Library for component tests
- Playwright for E2E tests
- API integration tests with supertest
