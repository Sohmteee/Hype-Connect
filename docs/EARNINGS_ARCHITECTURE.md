# HypeSonovea Earnings Architecture - New Permanent Tracking System

## Overview

Fixed the critical earnings persistence issue where hypeman earnings would disappear after ending events. Implemented a permanent earnings tracking system with three separate balances.

## Problem Solved

**Before**: Earnings were calculated dynamically from active events only → disappeared when events ended  
**After**: Earnings stored permanently in user profile with automatic updates

## New Architecture

### Data Structure

Each hypeman profile now has earnings stats with three fields:

```
users/{userId}/profiles/{profileId}:
  stats:
    totalEarned: number          # Permanent total (only increases)
    totalWithdrawn: number       # Lifetime withdrawals
    withdrawableBalance: computed # = totalEarned - totalWithdrawn
    lastMigration: timestamp     # When old data was migrated
```

### Key Changes

#### 1. **Automatic Earnings Addition**

- When a hype payment is confirmed via Paystack webhook (`handlePaystackWebhook`):
  - Calls `addEarnings(userId, profileId, amount)`
  - Increments `stats.totalEarned` permanently
  - User immediately has that balance available

#### 2. **Three-Balance System**

- **Total Earned** (₦): Permanent record, never decreases, shows lifetime earnings
- **Withdrawable Balance** (₦): = Total Earned - Total Withdrawn, available to withdraw
- **Total Withdrawn** (₦): Lifetime amount withdrawn

#### 3. **Platform Fee (20%)**

- On withdrawal request:
  - Platform takes 20% fee
  - User receives 80%
  - Both amounts tracked in withdrawal record:
    - `requestedAmount`: Full amount user tried to withdraw
    - `userReceivesAmount`: 80% after platform fee
    - `platformFee`: 20% platform keeps

#### 4. **Withdrawal Flow**

1. User requests withdrawal of ₦X
2. System checks if `withdrawableBalance >= X`
3. Creates withdrawal record with fees calculated
4. Updates `totalWithdrawn` by X (deducts from withdrawable balance)
5. User can track withdrawal history

## Files Modified

### `/src/services/firestore/earnings.ts` (COMPLETELY REDESIGNED)

**New Functions:**

- `getEarnings(userId, profileId)`: Returns `{ totalEarned, withdrawableBalance, totalWithdrawn }`
- `addEarnings(userId, profileId, amount)`: Increments `totalEarned` permanently
- `deductWithdrawnAmount(userId, profileId, amount)`: Increments `totalWithdrawn`
- `createWithdrawal()`: Updated to use new structure and calculate 20% fee

### `/src/app/dashboard/actions.ts`

- `getEarningsAction()`: Simplified to call `getEarnings()` instead of calculating from events
- Now reads from permanent record (event-agnostic)

### `/src/app/webhooks/paystack/actions.ts`

- `handlePaystackWebhook()`: Now calls `addEarnings()` when payment confirmed
- Automatically updates `totalEarned` on successful payment

### `/src/app/dashboard/withdraw/page.tsx`

- Updated to show all three balances (Total Earned, Withdrawable, Total Withdrawn)
- Now uses `earnings.withdrawableBalance` for validation
- Displays earnings breakdown clearly

### `/src/services/firestore/migrations.ts` (NEW)

- `migrateEarningsToNewStructure()`: One-time migration helper
- Calculates `totalEarned` from all existing confirmed + hyped hypes
- Sets `totalWithdrawn` to 0
- Ready to run for backward compatibility

## How It Works Now

### Scenario 1: New Hype Payment

1. User sends hype → payment pending
2. Paystack payment successful → webhook triggered
3. Webhook calls `updateHypeStatus(..., "confirmed")`
4. Webhook calls `addEarnings()` → increments `totalEarned`
5. Hypeman's `withdrawableBalance` increases immediately
6. Even if event ends, balance persists in profile

### Scenario 2: Withdrawal Request

1. User requests ₦50,000 withdrawal
2. System checks: `withdrawableBalance >= 50,000`? ✓
3. Platform fee calculated: ₦50,000 × 20% = ₦10,000
4. Withdrawal created with:
   - `requestedAmount: 50,000`
   - `userReceivesAmount: 40,000` (80%)
   - `platformFee: 10,000` (20%)
5. `totalWithdrawn` incremented by 50,000
6. `withdrawableBalance` decreases to `totalEarned - totalWithdrawn`

### Scenario 3: Ending Events

1. Hypeman ends multiple events
2. Earnings don't disappear ✓
3. `totalEarned` still shows all earnings from past hypes
4. Withdrawable balance preserved
5. Hypeman can still withdraw at any time

## Backward Compatibility

**For existing users with old data:**

- Run migration: `migrateEarningsToNewStructure()`
- Calculates `totalEarned` from all confirmed + hyped hypes
- Sets `totalWithdrawn` = 0
- All existing earnings preserved
- System automatically uses new structure after migration

## Technical Details

### Database Operations

- Profile updates use Firestore field paths: `"stats.totalEarned"`
- Atomic operations ensure consistency
- No sub-collections needed, all in profile document

### Fee Calculation

```typescript
const platformFee = requestedAmount * 0.2; // 20%
const userReceivesAmount = requestedAmount - platformFee; // 80%
```

### Query Optimization

- No complex event queries needed
- Single profile document read for earnings
- O(1) lookup instead of O(n) event scanning

## Benefits

✅ **Permanent**: Earnings never lost, survive event lifecycle  
✅ **Simple**: Single profile document, no complex calculations  
✅ **Transparent**: Users see total earned, withdrawn, and available  
✅ **Scalable**: Works at any earnings level  
✅ **Fee-aware**: Clear platform fee deduction on withdrawal  
✅ **Event-independent**: Withdrawal works regardless of event status  
✅ **Backward compatible**: Existing data can be migrated

## Testing Checklist

- [ ] Hype payment confirmed → `totalEarned` increments
- [ ] End event → earnings persist
- [ ] Withdrawal request → `totalWithdrawn` increments
- [ ] Withdrawal fee → 20% deducted from `withdrawableBalance`
- [ ] Multiple payments → all added to `totalEarned`
- [ ] Withdrawal history → displayed correctly
- [ ] Migration script → existing earnings calculated correctly
