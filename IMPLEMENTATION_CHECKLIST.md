# HypeConnect Backend - Exact Implementation Checklist

## 🎯 Technology Stack (CONFIRMED)

- **Frontend**: Next.js 15.5.6 + React 18 + TypeScript
- **Backend**: Next.js API Routes + Server Actions
- **Database**: Firestore (already configured)
- **Authentication**: Firebase Auth (already configured)
- **Storage**: Firebase Storage
- **Payment**: Paystack
- **Deployment**: Firebase App Hosting

---

## 📋 PHASE-BY-PHASE IMPLEMENTATION

### **PHASE 1: Firestore Security Rules** ⭐⭐⭐ CRITICAL

**File to modify**: `firestore.rules`
**Status**: Not started

#### Tasks:

- [ ] 1.1 - Set up authentication checks (only authenticated users can read/write)
- [ ] 1.2 - Implement role-based rules (hypeman vs spotlight profiles)
- [ ] 1.3 - Set privacy controls (public vs private profiles)
- [ ] 1.4 - Secure event access (only creator can modify)
- [ ] 1.5 - Protect hype messages (any user can create, only hypeman/owner can modify status)
- [ ] 1.6 - Lock down earnings data (only profile owner can read)
- [ ] 1.7 - Add rate limiting for hype message creation (prevent spam)

**Estimated time**: 2-3 hours

---

### **PHASE 2: Core API Routes** ⭐⭐⭐ CRITICAL

**Directory**: `src/api/`
**Status**: Not started

#### 2A - Authentication Routes

**Files to create**:

- [ ] 2A.1 - `src/api/auth/register/route.ts`
  - Accept: email, password, displayName
  - Create Firebase Auth user
  - Create UserProfile in Firestore
  - Return: user data + auth token
- [ ] 2A.2 - `src/api/auth/login/route.ts`
  - Accept: email, password
  - Firebase Auth sign in
  - Return: JWT token + user data
- [ ] 2A.3 - `src/api/auth/logout/route.ts`
  - Clear session
  - Return success

**Estimated time**: 3-4 hours

#### 2B - Event Management Routes

**Files to create**:

- [ ] 2B.1 - `src/api/events/route.ts`
  - GET: Fetch all active events (paginated)
  - POST: Create new event (requires hypeman role)
- [ ] 2B.2 - `src/api/events/[eventId]/route.ts`
  - GET: Fetch single event with hypeman details
  - PUT: Update event (owner only)
  - DELETE: Deactivate event (owner only)
- [ ] 2B.3 - `src/api/events/[eventId]/qr/route.ts`
  - GET: Generate QR code for event
  - Return: Base64 image or URL

**Estimated time**: 4-5 hours

#### 2C - Hype Messages & Payments Routes

**Files to create**:

- [ ] 2C.1 - `src/api/events/[eventId]/hypes/route.ts`
  - POST: Create hype message
    - Validate message + amount
    - **Integrate Paystack payment**
    - Create HypeMessage in Firestore
    - Update hypeman earnings (atomic)
  - GET: Fetch all hype messages for event (hypeman only)
- [ ] 2C.2 - `src/api/events/[eventId]/hypes/[hypeId]/route.ts`
  - PUT: Mark hype as "hyped" (hypeman only)
- [ ] 2C.3 - `src/api/events/[eventId]/leaderboard/route.ts`
  - GET: Fetch top 10-20 tippers for event
  - Return: name, amount, timestamp

**Estimated time**: 5-6 hours (includes payment logic)

#### 2D - Profile Routes

**Files to create**:

- [ ] 2D.1 - `src/api/profiles/route.ts`
  - POST: Create new profile (hypeman or spotlight)
- [ ] 2D.2 - `src/api/profiles/[profileId]/route.ts`
  - GET: Fetch profile (public/private based on settings)
  - PUT: Update profile (owner only)
- [ ] 2D.3 - `src/api/profiles/[profileId]/earnings/route.ts`
  - GET: Calculate total earnings for hypeman
  - GET: Fetch earning history with pagination

**Estimated time**: 3-4 hours

#### 2E - Withdrawal Routes

**Files to create**:

- [ ] 2E.1 - `src/api/withdrawals/route.ts`
  - POST: Request withdrawal
    - Validate minimum amount
    - Check available balance
    - Process Paystack payout
    - Record withdrawal with status
  - GET: Fetch withdrawal history (owner only)

**Estimated time**: 3-4 hours

**TOTAL PHASE 2**: 18-23 hours

---

### **PHASE 3: Payment Service (Paystack Integration)** ⭐⭐⭐ CRITICAL

**Directory**: `src/services/payment/` + `src/config/`
**Status**: Not started

#### Files to create:

- [ ] 3.1 - `src/config/paystack.ts`
  - Initialize Paystack with API keys
  - Export configured client
- [ ] 3.2 - `src/services/payment/paystack.ts`
  - `initiatePayment(amount, email, metadata)` → Returns payment URL
  - `verifyPaymentReference(reference)` → Verify transaction
  - `getTransactionStatus(reference)` → Get status
  - `validateWebhookSignature(event, signature)` → Verify webhook
  - `processRefund(transactionId, amount)` → Handle refunds
- [ ] 3.3 - `src/api/webhooks/payment/paystack/route.ts`
  - POST endpoint to receive Paystack events
  - Verify webhook signature
  - Handle charge.success event
  - Update HypeMessage status
  - Update hypeman earnings (atomic transaction)
  - Prevent duplicate processing

**Estimated time**: 4-5 hours

---

### **PHASE 4: Validation & Error Handling**

**Directory**: `src/lib/`
**Status**: Not started

#### Files to create:

- [ ] 4.1 - `src/lib/schemas.ts`
  - Zod schema for user registration
  - Zod schema for profile creation/update
  - Zod schema for event creation
  - Zod schema for hype message
  - Zod schema for withdrawal request
  - Zod schema for payout info
- [ ] 4.2 - Update `src/firebase/errors.ts`
  - Custom error classes for different failure scenarios
  - Format errors for client-side display

**Estimated time**: 2-3 hours

---

### **PHASE 5: Authentication Middleware & Helpers**

**Directory**: `src/lib/`
**Status**: Not started

#### Files to create:

- [ ] 5.1 - `src/lib/auth.ts`
  - `getAuthUser(request)` → Extract and verify Firebase token
  - `requireAuth(handler)` → Middleware wrapper for protected routes
  - `requireRole(role, handler)` → Role-based access control
  - `getFirebaseApp()` → Server-side Firebase initialization
- [ ] 5.2 - `src/middleware.ts` (if needed for global protection)

**Estimated time**: 2-3 hours

---

### **PHASE 6: Data Fetching Utilities**

**Directory**: `src/lib/` + `src/services/firestore/`
**Status**: Partially started (use-collection and use-doc hooks exist)

#### Files to create:

- [ ] 6.1 - `src/services/firestore/users.ts`
  - `fetchUserProfile(userId)`
  - `createUserProfile(userData)`
  - `updateUserProfile(userId, data)`
- [ ] 6.2 - `src/services/firestore/events.ts`
  - `fetchActiveEvents(limit, offset)`
  - `fetchEventById(eventId)`
  - `createEvent(eventData)`
  - `updateEvent(eventId, data)`
  - `deactivateEvent(eventId)`
- [ ] 6.3 - `src/services/firestore/hypes.ts`
  - `createHypeMessage(hypeData)`
  - `fetchHypeMessages(eventId, limit, offset)`
  - `updateHypeStatus(hypeId, status)`
  - `fetchLeaderboard(eventId, limit)`
- [ ] 6.4 - `src/services/firestore/earnings.ts`
  - `calculateEarnings(profileId)` → Sum all hype amounts
  - `fetchEarningHistory(profileId, limit, offset)`
  - `createWithdrawalRequest(profileId, amount)`
  - `fetchWithdrawalHistory(profileId, limit, offset)`
- [ ] 6.5 - `src/lib/queries.ts`
  - Export all query functions for easy access

**Estimated time**: 3-4 hours

---

### **PHASE 7: Server Actions Expansion**

**Directory**: `src/app/`
**Status**: Partially started (only AI suggestions exist)

#### Files to update/create:

- [ ] 7.1 - Expand `src/app/dashboard/actions.ts`
  - `createEventAction(name, location)`
  - `updateProfileAction(profileId, data)`
  - `submitHypeMessageAction(eventId, message, amount)`
  - `markHypeAsHypedAction(eventId, hypeId)`
  - `requestWithdrawalAction(profileId, amount)`
  - `getEarningsAction(profileId)`
  - Zod validation for each
  - Proper error handling
- [ ] 7.2 - Create `src/app/auth/actions.ts`
  - `registerAction(email, password, displayName)`
  - `loginAction(email, password)`
  - `logoutAction()`
- [ ] 7.3 - Create server actions for profiles
  - `createProfileAction(type, displayName)`
  - `updateProfileAction(profileId, data)`

**Estimated time**: 2-3 hours

---

### **PHASE 8: Environment Setup**

**Status**: Not started

#### Tasks:

- [ ] 8.1 - Create `.env.local` file with:

  ```
  # Paystack
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
  PAYSTACK_SECRET_KEY=sk_test_xxxxx

  # Firebase (already configured in firebase/config.ts)
  NEXT_PUBLIC_FIREBASE_API_KEY=xxx
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
  NEXT_PUBLIC_FIREBASE_APP_ID=xxx

  # App
  NEXT_PUBLIC_APP_URL=http://localhost:9002
  ```

- [ ] 8.2 - Create `.env.production` for Firebase App Hosting
- [ ] 8.3 - Add env variable validation (startup check)

**Estimated time**: 30 mins

---

### **PHASE 9: Testing** (Optional but recommended)

**Status**: Not started

#### Tasks:

- [ ] 9.1 - Unit tests for validation schemas (Jest)
- [ ] 9.2 - Unit tests for Paystack service (mock API)
- [ ] 9.3 - Integration tests for API routes
- [ ] 9.4 - E2E tests for critical flows (user registration → event creation → hype submission)

**Estimated time**: 6-8 hours (optional)

---

### **PHASE 10: Frontend Integration**

**Status**: Not started

#### Tasks:

- [ ] 10.1 - Connect registration form to `/api/auth/register`
- [ ] 10.2 - Connect login form to `/api/auth/login`
- [ ] 10.3 - Connect dashboard to fetch events and hypes
- [ ] 10.4 - Integrate Paystack payment button in hype submission
- [ ] 10.5 - Connect withdrawal form to `/api/withdrawals`
- [ ] 10.6 - Display leaderboard from `/api/events/{eventId}/leaderboard`

**Estimated time**: 4-5 hours

---

## 📊 SUMMARY

| Phase | Task                 | Time   | Critical |
| ----- | -------------------- | ------ | -------- |
| 1     | Firestore Rules      | 2-3h   | ⭐⭐⭐   |
| 2     | API Routes           | 18-23h | ⭐⭐⭐   |
| 3     | Payment Service      | 4-5h   | ⭐⭐⭐   |
| 4     | Validation           | 2-3h   | ⭐⭐     |
| 5     | Auth Middleware      | 2-3h   | ⭐⭐⭐   |
| 6     | Data Fetching        | 3-4h   | ⭐⭐⭐   |
| 7     | Server Actions       | 2-3h   | ⭐⭐     |
| 8     | Environment          | 0.5h   | ⭐       |
| 9     | Testing              | 6-8h   | Optional |
| 10    | Frontend Integration | 4-5h   | ⭐⭐     |

**Total estimated time**: ~45-60 hours of development

---

## 🚀 Recommended Start Order

1. **Day 1**: Phase 1 (Firestore Rules) + Phase 8 (Env Setup)
2. **Days 2-3**: Phase 2 (API Routes - start with Auth)
3. **Days 4-5**: Phase 2 continued (Events + Hypes) + Phase 3 (Paystack)
4. **Day 6**: Phase 4 (Validation) + Phase 5 (Auth Middleware)
5. **Day 7**: Phase 6 (Data Fetching) + Phase 7 (Server Actions)
6. **Days 8-9**: Phase 10 (Frontend Integration)
7. **Days 10+**: Phase 9 (Testing) + Bug fixes

---

## 🔧 Quick Reference: Key Implementation Details

### Atomic Transaction Pattern (for earnings updates)

```typescript
// When processing hype payment:
1. Verify payment with Paystack
2. Get hypeman profile reference
3. Create HypeMessage document with amount
4. Atomically update profile.stats.earnings += amount
5. Return confirmation
```

### Webhook Security

```typescript
// Paystack webhook validation:
1. Extract HMAC from header
2. Hash request body with secret key
3. Compare with HMAC
4. Only process if valid
```

### Role-Based Access Pattern

```typescript
// In API routes:
1. Extract user from Firebase token
2. Get user's roles from UserProfile.roles
3. Check if hypeman/spotlight as needed
4. Return 403 Forbidden if insufficient role
```

---

## ✅ Success Criteria

Backend is complete when:

1. ✅ All Firestore rules are in place and tested
2. ✅ All API routes are deployed and working
3. ✅ Paystack payment processing is working end-to-end
4. ✅ User can register → Create event → Send hype with payment
5. ✅ Hypeman can view real-time messages and earnings
6. ✅ Withdrawal requests are processed
7. ✅ Zero security vulnerabilities in rules and routes
8. ✅ All sensitive data is protected (earnings, payout info)
9. ✅ Rate limiting prevents spam
10. ✅ Tests pass (if implemented)
