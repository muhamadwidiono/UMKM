# Auth-Gated App Testing Playbook

## Step 1: Create Test User & Session
Run this in MongoDB to set up a test user and active session for the testing agent.
```javascript
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  tenant_id: 'tenant-test',
  email: 'muhamad.widiono98@gmail.com',
  name: 'Muhamad Widiono',
  role: 'Owner',
  picture: 'https://images.unsplash.com/photo-1735948055457-8d816fb80a87',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
db.tenants.insertOne({
  tenant_id: 'tenant-test',
  name: 'Widiono Laundry',
  type: 'laundry',
  package: 'Pro',
  max_transactions_limit: -1,
  transaction_count: 0,
  owner_email: 'muhamad.widiono98@gmail.com',
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Test Backend API
```bash
# Test auth endpoint
curl -X GET "https://bisnis-hub-12.preview.emergentagent.com/api/auth/me" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

## Step 3: Browser Testing
```javascript
// Set cookie and navigate
await page.context.add_cookies([{
    "name": "session_token",
    "value": "YOUR_SESSION_TOKEN",
    "domain": "bisnis-hub-12.preview.emergentagent.com",
    "path": "/",
    "httpOnly": true,
    "secure": true,
    "sameSite": "None"
}]);
await page.goto("https://bisnis-hub-12.preview.emergentagent.com");
```
