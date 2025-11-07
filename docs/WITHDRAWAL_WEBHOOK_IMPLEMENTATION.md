# Withdrawal & Paystack Transfer Webhook Implementation

## Overview

This document describes the complete withdrawal flow with automatic Paystack webhook handling for transfer status updates.

## Withdrawal Flow

### 1. User Requests Withdrawal

**File:** `src/app/dashboard/withdraw/page.tsx`

User submits withdrawal form with:

- Amount (in Naira)
- Bank details (name, code, account number, account name)

### 2. Create Withdrawal Record

**File:** `src/services/firestore/earnings.ts` → `createWithdrawal()`

```
Action: requestWithdrawalAction()
├─ Parse & validate form data (bankCode now required)
├─ Check sufficient balance
├─ Calculate amounts:
│  ├─ Platform fee: 20% of requested amount
│  └─ User receives: 80% of requested amount
├─ Create withdrawal document with status: "pending"
├─ Store: bankCode, bankName, accountNumber, accountName
├─ Deduct total amount from withdrawable balance
└─ Return: withdrawal record with ID
```

**Withdrawal Document Structure:**

```javascript
{
  withdrawalId: string,
  userId: string,
  profileId: string,
  requestedAmount: number,        // What user requested
  userReceivesAmount: number,     // After 20% fee
  platformFee: number,            // 20% of requested
  bankName: string,               // e.g., "GTBank"
  bankCode: string,               // e.g., "033"
  accountNumber: string,
  accountName: string,
  status: "pending",              // pending → processing → completed/failed
  paystackTransferId: null,       // Set when transfer initiated
  requestedAt: ISO timestamp,
  processedAt: null,              // Set when status changes
}
```

### 3. Admin Initiates Transfer

**File:** `src/app/dashboard/actions.ts` → `processWithdrawalAction()`

```
Action: processWithdrawalAction(withdrawalId)
├─ Fetch withdrawal record
├─ Create transfer recipient:
│  ├─ Type: "nuban" (Nigerian bank account)
│  ├─ Account: accountNumber + bankCode
│  └─ Name: accountName
├─ Update withdrawal status → "processing"
├─ Initiate Paystack transfer:
│  ├─ Amount: userReceivesAmount (after fee)
│  ├─ Reference: withdrawalId
│  └─ Reason: "Withdrawal for {accountName}"
├─ Store transfer code (from Paystack response)
└─ Return: transfer code + status
```

### 4. Paystack Initiates Transfer

**Paystack API** → Initiates the actual transfer

The transfer moves funds from your Paystack balance to the recipient's bank account.

### 5. Paystack Sends Webhooks

**File:** `src/app/webhooks/paystack/actions.ts` → `handlePaystackWebhook()`

Paystack fires events as the transfer progresses:

#### Event: `transfer.success`

```javascript
{
  event: "transfer.success",
  data: {
    reference: withdrawalId,
    transfer_code: "TRF_xxxxxxxxx",
    amount: userReceivesAmount,
    metadata: { withdrawalId: "..." },
    recipient: { ... }
  }
}
```

**Handler:**

```
├─ Validate webhook signature
├─ Extract withdrawalId from reference/metadata
├─ Update withdrawal status → "completed"
├─ Store transfer code (paystackTransferId)
├─ Set processedAt timestamp
└─ Log success: "Transfer completed"
```

#### Event: `transfer.failed`

```javascript
{
  event: "transfer.failed",
  data: {
    reference: withdrawalId,
    metadata: { withdrawalId: "..." }
  }
}
```

**Handler:**

```
├─ Validate webhook signature
├─ Extract withdrawalId from reference/metadata
├─ Update withdrawal status → "failed"
├─ Set processedAt timestamp
└─ Log failure: "Transfer failed"
```

### 6. Check Withdrawal Status

**File:** `src/services/firestore/earnings.ts` → `getWithdrawal()`
**File:** `src/services/firestore/earnings.ts` → `getWithdrawalHistory()`

```
getWithdrawal(withdrawalId):
├─ Fetch withdrawal document
└─ Return current status + details

getWithdrawalHistory(userId):
├─ Query all withdrawals for user
├─ Order by requestedAt (newest first)
└─ Return paginated history
```

## Database Updates

### Function: `updateWithdrawalStatus()`

**Location:** `src/services/firestore/earnings.ts`

```typescript
updateWithdrawalStatus(
  withdrawalId: string,
  status: "pending" | "processing" | "completed" | "failed",
  paystackTransferId?: string
)
```

**Updates:**

- `status`: New status
- `processedAt`: Current timestamp
- `paystackTransferId`: Transfer code (if provided)

**Timeline:**

```
Creation: status = "pending", processedAt = null
↓
Admin initiates: status = "processing", paystackTransferId = "TRF_xxx"
↓
Webhook success: status = "completed", processedAt = 2025-11-07T...
  OR
Webhook fail: status = "failed", processedAt = 2025-11-07T...
```

## Webhook Signature Validation

All webhooks are validated using Paystack secret key:

**File:** `src/services/payment/paystack.ts`

```typescript
PaystackService.validateWebhookSignature(body: string, signature: string): boolean
```

- Prevents unauthorized webhook handlers
- Uses HMAC-SHA512 hashing
- Compares against `x-paystack-signature` header

## Schema Changes

### Updated Zod Schema

**File:** `src/lib/schemas.ts`

```typescript
withdrawalSchema = z.object({
  amount: z.number().int().min(1000),
  bankName: z.string().min(2),
  bankCode: z.string().min(2), // NEW!
  accountNumber: z.string().regex(/^\d{10,}$/),
  accountName: z.string().min(2),
});
```

## Error Handling

### In `processWithdrawalAction()`

- ❌ Withdrawal not found → Return error
- ❌ Transfer recipient creation fails → Throw error
- ❌ Transfer initiation fails → Throw error
- ✅ All steps succeed → Return transfer code

### In Webhook Handler

- ❌ Invalid signature → Reject webhook
- ❌ Withdrawal not found → Log error, continue
- ✅ Status update successful → Log success

## Key Endpoints

### Create/Request Withdrawal

```
POST /dashboard/withdraw
Body: { amount, bankName, bankCode, accountNumber, accountName }
Response: { success, data: withdrawal | error }
```

### Process Withdrawal (Admin)

```
POST /dashboard/process-withdrawal
Body: { withdrawalId }
Response: { success, data: { withdrawalId, transferCode, status } | error }
```

### Paystack Webhook

```
POST /api/webhooks/paystack
Headers: { x-paystack-signature: "..." }
Body: { event, data }
Response: { success, message }
```

### Get Withdrawal History

```
POST /dashboard/withdrawal-history
Body: { limit?, offset? }
Response: { success, data: withdrawal[] }
```

## Testing Checklist

- [ ] User submits withdrawal form
- [ ] Withdrawal record created with "pending" status
- [ ] Balance deducted immediately (20% fee calculated)
- [ ] Admin initiates transfer
- [ ] Status changes to "processing"
- [ ] Paystack transfer initiated successfully
- [ ] Paystack sends `transfer.success` webhook
- [ ] Webhook handler updates status to "completed"
- [ ] User can view withdrawal history
- [ ] Failed transfer test:
  - [ ] Initiate transfer with invalid account
  - [ ] Paystack sends `transfer.failed` webhook
  - [ ] Status changes to "failed"

## Important Notes

1. **Platform Fee**: 20% deducted automatically

   - Example: User requests ₦1000 → Gets ₦800, Platform keeps ₦200

2. **Immediate Deduction**: Balance is deducted when withdrawal is requested (status: pending)

   - User cannot double-spend the amount

3. **Webhook Order**: Could arrive out of order

   - Handler is idempotent (status already updated = skip)

4. **Bank Codes**: Must match Paystack's actual codes

   - Fetched dynamically from Paystack API
   - Validated during account resolution

5. **Test Mode Limits**: Max 3 live bank resolves per day
   - Use test bank code `001` for unlimited testing

## Files Modified

1. `src/app/webhooks/paystack/actions.ts` - Added transfer event handlers
2. `src/app/dashboard/actions.ts` - Added `processWithdrawalAction()`
3. `src/services/firestore/earnings.ts` - Added bankCode to withdrawal
4. `src/lib/schemas.ts` - Added bankCode to validation schema
5. `src/app/dashboard/withdraw/page.tsx` - Already has bank selection + search

## Next Steps

1. **Test complete flow** with test bank code `001`
2. **Monitor Paystack dashboard** for transfer status
3. **Add admin dashboard** to view/manage withdrawals
4. **Set up alerts** for failed transfers
5. **Add retry logic** for failed transfers
