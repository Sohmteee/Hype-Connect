# HypeConnect Backend Implementation Plan

## Project Overview

**Stack**: Next.js 15.5.6 + Firebase (Auth + Firestore + Storage) + Genkit AI  
**Payment Provider**: Paystack  
**Deployment**: Firebase App Hosting  
**Database**: Firestore with predefined schema

---

## Current State Analysis

### ✅ What's Already in Place

1. **Frontend Framework**: Next.js with TypeScript (SSR/SSG ready)
2. **Firebase Setup**:
   - Authentication configured (password + anonymous providers)
   - Firestore initialized
   - Firebase project created (`studio-2938930845-6b0d1`)
3. **AI Integration**: Genkit configured with Google Generative AI
4. **Server Actions**: Basic action function setup (dashboard)
5. **Component Library**: Complete Shadcn UI component system
6. **Styling**: Tailwind CSS + custom theme (purple/gold)

### ⚠️ What Needs to Be Implemented

---

## BACKEND IMPLEMENTATION CHECKLIST

### **PHASE 1: Firestore Schema & Security Rules**

_Status: PARTIAL - Schema defined, rules not implemented_

#### 1.1 Complete Firestore Security Rules

- **File**: `firestore.rules`
- **What needs to be done**:
  - [ ] User authentication checks (must be logged in to read/write)
  - [ ] Role-based access control (hypeman vs spotlight user rules)
  - [ ] Profile privacy rules (public vs private profiles)
  - [ ] Event access rules (only hypemanProfileId owner can modify)
  - [ ] HypeMessage write restrictions (any auth user can create, only owner/hypeman can modify status)
  - [ ] Earnings/withdrawal data protection
  - [ ] Rate limiting for hype message creation

#### 1.2 Create Firestore Indexes (if needed)

- [ ] Index for active events: `events.isActive == true` + timestamp
- [ ] Index for user's profiles: `users/{userId}/profiles`
- [ ] Index for event hypes: `events/{eventId}/hypes` sorted by timestamp
- [ ] Index for leaderboard queries: event aggregations

---

### **PHASE 2: API Routes (Backend Endpoints)**

_Status: NOT STARTED - Need to create Next.js API routes_

#### 2.1 Authentication & User Management

**Route**: `POST /api/auth/register`

- [ ] Accept email, password, display name
- [ ] Create Firebase Auth user
- [ ] Create UserProfile document in Firestore
- [ ] Initialize default profile (hypeman or spotlight)
- [ ] Return user data + JWT

**Route**: `POST /api/auth/login`

- [ ] Accept email, password
- [ ] Use Firebase Auth
- [ ] Return JWT token + user data

**Route**: `GET /api/auth/me`

- [ ] Protected route (require auth)
- [ ] Return current user profile + roles

**Route**: `POST /api/auth/logout`

- [ ] Clear session/token

#### 2.2 User Profile Management

**Route**: `GET /api/profiles/{profileId}`

- [ ] Fetch profile by ID
- [ ] Return displayName, publicBio, stats (hypesReceived, earnings)
- [ ] Respect privacy settings

**Route**: `PUT /api/profiles/{profileId}`

- [ ] Update displayName, publicBio, payoutInfo
- [ ] Protected route (owner only)
- [ ] Validate payout info if hypeman profile

**Route**: `POST /api/profiles`

- [ ] Create additional profile for user
- [ ] Accept type (hypeman or spotlight) and displayName
- [ ] Protected route

**Route**: `GET /api/users/{userId}/profiles`

- [ ] Fetch all profiles for a user
- [ ] Protected route (owner only)

#### 2.3 Event Management

**Route**: `POST /api/events`

- [ ] Create new club event
- [ ] Require auth + hypeman role
- [ ] Accept name, location, hypemanProfileId
- [ ] Generate unique event ID + QR code URL
- [ ] Set isActive = true, createdAt = now

**Route**: `GET /api/events`

- [ ] Fetch active events (with pagination)
- [ ] Optional: filter by location, hypemanProfileId
- [ ] Return event details + hypeman info

**Route**: `GET /api/events/{eventId}`

- [ ] Fetch single event details
- [ ] Include hypeman profile info

**Route**: `PUT /api/events/{eventId}`

- [ ] Update event (name, location, isActive)
- [ ] Protected route (event creator only)

**Route**: `DELETE /api/events/{eventId}`

- [ ] Soft delete or deactivate event
- [ ] Protected route (event creator only)

#### 2.4 Hype Messages (Core Transaction Logic)

**Route**: `POST /api/events/{eventId}/hypes`

- [ ] Create hype message
- [ ] Accept message, amount, senderName (or userId)
- [ ] **CRITICAL**: Integrate payment gateway (Paystack/Flutterwave/Stripe)
  - [ ] Validate payment before creating message
  - [ ] Store payment transaction ID
  - [ ] Update hypeman earnings in atomic transaction
- [ ] Set status = "new"
- [ ] Record timestamp
- [ ] Return messageId

**Route**: `GET /api/events/{eventId}/hypes`

- [ ] Fetch all hype messages for event
- [ ] Optional: filter by status (new/hyped)
- [ ] Optional: pagination
- [ ] Protected route (event hypeman only)

**Route**: `PUT /api/events/{eventId}/hypes/{hypeId}`

- [ ] Update hype message status (new → hyped)
- [ ] Protected route (hypeman only)

**Route**: `GET /api/events/{eventId}/leaderboard`

- [ ] Fetch top tippers for event
- [ ] Sort by amount descending
- [ ] Limit to top 10-20
- [ ] Return sender name, amount, message preview

#### 2.5 Earnings & Withdrawals

**Route**: `GET /api/profiles/{profileId}/earnings`

- [ ] Calculate total earnings for hypeman
- [ ] Sum all successful hype amounts
- [ ] Protected route (owner only)

**Route**: `GET /api/profiles/{profileId}/earnings/history`

- [ ] Fetch earning transactions
- [ ] Pagination + date range filtering
- [ ] Protected route (owner only)

**Route**: `POST /api/withdrawals`

- [ ] Create withdrawal request
- [ ] Validate minimum withdrawal amount
- [ ] Check available balance
- [ ] **Integrate payment gateway** for payout
- [ ] Record withdrawal with status (pending/completed/failed)
- [ ] Protected route

**Route**: `GET /api/withdrawals`

- [ ] Fetch user's withdrawal history
- [ ] Protected route (owner only)

#### 2.6 QR Code Generation

**Route**: `GET /api/events/{eventId}/qr`

- [ ] Generate QR code pointing to event hype page
- [ ] Return base64 encoded image or URL
- [ ] Optional: custom branding (club colors)

---

### **PHASE 3: Payment Gateway Integration (Paystack)**

_Status: NOT STARTED - Paystack integration_

#### 3.1 Paystack Setup

**Required Implementation**:

- [ ] Create Paystack service module: `src/services/payment/paystack.ts`
- [ ] Store Paystack API keys in environment variables (`.env.local`)
  - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (frontend)
  - `PAYSTACK_SECRET_KEY` (backend)
- [ ] Implement payment verification function using Paystack API
- [ ] Handle payment webhooks from Paystack
- [ ] Error handling & retry logic
- [ ] Support NGN and other currencies Paystack supports

**Paystack API Integration Points**:

```typescript
// Initialize payment transaction
initiatePayment(amount, email, metadata, callbackUrl);

// Verify payment after callback
verifyPaymentReference(reference);

// Get transaction status
getTransactionStatus(reference);

// Process refund (if needed)
refundTransaction(transactionId, amount);

// Validate webhook signature
validatePaystackWebhook(event, signature);
```

#### 3.2 Paystack Webhook Handler

**Route**: `POST /api/webhooks/payment/paystack`

- [ ] Receive payment events from Paystack
- [ ] Verify webhook signature using Paystack secret key
- [ ] Handle charge.success event
- [ ] Update HypeMessage status to "confirmed"
- [ ] Update hypeman earnings atomically
- [ ] Log failed/pending transactions
- [ ] Prevent duplicate processing

---

### **PHASE 4: Server Actions (Next.js 13+ Server Components)**

_Status: PARTIAL - Basic structure exists_

#### 4.1 Expand Server Actions

**File**: `src/app/dashboard/actions.ts` (expand)

- [ ] `createEventAction(name, location)` → POST /api/events
- [ ] `updateProfileAction(profileId, data)` → PUT /api/profiles/{profileId}
- [ ] `submitHypeMessageAction(eventId, message, amount)` → POST /api/events/{eventId}/hypes
- [ ] `markHypeAsHypedAction(hypeId)` → PUT /api/events/{eventId}/hypes/{hypeId}
- [ ] `requestWithdrawalAction(amount)` → POST /api/withdrawals
- [ ] `getEarningsAction()` → GET /api/profiles/{profileId}/earnings
- [ ] Error handling & validation
- [ ] Type-safe with Zod schemas

---

### **PHASE 5: Database Queries & Optimization**

_Status: PARTIAL - Use-collection hooks exist but need data fetching layers_

#### 5.1 Data Fetching Utilities

**File**: `src/lib/queries.ts` (create)

- [ ] `fetchActiveEvents()` - Get all active events
- [ ] `fetchEventDetails(eventId)` - Single event with hypeman info
- [ ] `fetchHypeMessages(eventId)` - All messages for event
- [ ] `fetchLeaderboard(eventId)` - Top tippers
- [ ] `fetchUserProfile(userId)` - User info + role
- [ ] `fetchUserProfiles(userId)` - All user profiles
- [ ] `fetchEarnings(profileId)` - Calculate earnings
- [ ] Implement caching strategy (Firestore cache, React Query, SWR, etc.)

#### 5.2 Firestore Aggregations

- [ ] Create helper functions for complex queries
- [ ] Implement real-time listeners for dashboard (WebSocket alternative)
- [ ] Batch write operations for performance

---

### **PHASE 6: Validation & Error Handling**

_Status: PARTIAL - Basic structure needs expansion_

#### 6.1 Input Validation Schemas

**File**: `src/lib/schemas.ts` (create/expand)

- [ ] User registration schema
- [ ] Profile creation/update schema
- [ ] Event creation schema
- [ ] Hype message schema (message, amount, etc.)
- [ ] Withdrawal request schema
- [ ] Payout info schema
- [ ] Use Zod for runtime validation

#### 6.2 Error Handling

- [ ] Custom error classes for different scenarios
- [ ] Centralized error middleware for API routes
- [ ] User-friendly error messages
- [ ] Logging for debugging
- [ ] Error recovery strategies

---

### **PHASE 7: Security & Authentication**

_Status: PARTIAL - Firebase Auth in place, need middleware_

#### 7.1 Authentication Middleware

**File**: `src/lib/auth.ts` (create)

- [ ] Middleware to verify JWT/Firebase tokens
- [ ] Role-based access control (RBAC) helper
- [ ] Verify token in API routes
- [ ] Secure sensitive routes
- [ ] Rate limiting on auth endpoints

#### 7.2 Security Measures

- [ ] CORS configuration
- [ ] CSRF protection if needed
- [ ] Input sanitization
- [ ] SQL injection prevention (N/A for Firestore, but validate all inputs)
- [ ] Payment data encryption (PCI DSS compliance)
- [ ] Environment variable protection

---

### **PHASE 8: Testing**

_Status: NOT STARTED_

#### 8.1 Unit Tests

- [ ] API route tests
- [ ] Server action tests
- [ ] Validation schema tests
- [ ] Payment processing tests (mock provider)
- [ ] Use Jest + Supertest for API testing

#### 8.2 Integration Tests

- [ ] Full flow: Create event → Send hype → Process payment
- [ ] User authentication flow
- [ ] Withdrawal request flow
- [ ] Database transaction atomicity

#### 8.3 E2E Tests

- [ ] User registration → Event creation → Hype submission
- [ ] Hypeman dashboard interaction

---

### **PHASE 9: Deployment & DevOps**

_Status: PARTIAL - Firebase App Hosting configured_

#### 9.1 Environment Configuration

- [ ] `.env.local` for development
- [ ] `.env.production` for Firebase App Hosting
- [ ] Environment variable validation
- [ ] Payment gateway API keys setup

#### 9.2 Firebase Deployment

- [ ] Configure `apphosting.yaml` (auto-deployable)
- [ ] Set up Cloud Functions if needed (for complex logic)
- [ ] Firestore backup strategy
- [ ] Monitoring & logging

#### 9.3 CI/CD Pipeline

- [ ] GitHub Actions workflow (if using GitHub)
- [ ] Automated tests on PR
- [ ] Automatic deployment on merge

---

## Summary: Implementation Priority

### **Critical (Must Have)**

1. Firestore security rules ⭐⭐⭐
2. Payment gateway integration ⭐⭐⭐
3. API routes for core features ⭐⭐⭐
4. Input validation & error handling ⭐⭐⭐
5. Authentication middleware ⭐⭐⭐

### **High Priority**

6. Server actions expansion
7. Data fetching utilities
8. Hype message creation/processing
9. Earnings calculation

### **Medium Priority**

10. Withdrawal system
11. Leaderboard queries
12. QR code generation

### **Nice to Have**

13. Testing suite
14. Advanced caching
15. Real-time updates optimization

---

## File Structure to Create

```
src/
├── api/
│   ├── auth/
│   │   ├── register/route.ts
│   │   ├── login/route.ts
│   │   └── logout/route.ts
│   ├── events/
│   │   ├── route.ts
│   │   └── [eventId]/
│   │       ├── route.ts
│   │       ├── hypes/route.ts
│   │       ├── leaderboard/route.ts
│   │       └── qr/route.ts
│   ├── profiles/
│   │   ├── route.ts
│   │   └── [profileId]/
│   │       ├── route.ts
│   │       └── earnings/route.ts
│   ├── withdrawals/
│   │   └── route.ts
│   └── webhooks/
│       └── payment/
│           └── paystack/route.ts
├── lib/
│   ├── auth.ts
│   ├── queries.ts
│   ├── schemas.ts
│   └── utils.ts
├── services/
│   ├── payment/
│   │   └── paystack.ts
│   └── firestore/
│       ├── events.ts
│       ├── users.ts
│       ├── hypes.ts
│       └── earnings.ts
├── middleware.ts
└── config/
    └── paystack.ts
```

---

## Environment Variables Required

Create `.env.local` with the following:

```env
# Paystack Configuration
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=studio-2938930845-6b0d1.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-2938930845-6b0d1
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=196804376543
NEXT_PUBLIC_FIREBASE_APP_ID=1:196804376543:web:1d9a10fc4d1393e842766a

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:9002
```

---

## Next Steps

1. ✅ **Decided**: Paystack for payments, Firebase for all backend services
2. **Set up environment variables** (see above)
3. **Start with Phase 1**: Complete firestore.rules

4. **Then Phase 2**: Build core API routes in order of dependency
5. **Test incrementally** as each phase is completed

Would you like me to start implementing any specific phase?
