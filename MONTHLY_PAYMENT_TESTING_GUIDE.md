# 🔍 Monthly Payment Debt Investigation - Step by Step Guide

## 🎯 What We're Testing

You reported that **missing monthly contributions may not be properly included in the balance display calculation**. We've added extensive debugging to trace the data flow from the FlatmatePayments component to the main balance calculation.

## 🛠️ Debug Features Added

### 1. Visual Debug Panels
- **Purple debug panel** in Payments tab showing debt calculation
- **Purple debug text** in Dashboard showing monthly debt state
- **Console logging** for detailed data flow tracking

### 2. Console Debug Output
- FlatmatePayments debt calculation per month/flatmate
- Final debt totals from FlatmatePayments
- Data flow from FlatmatePayments to App.js
- Comprehensive balance calculation with monthly debts

## 📋 Testing Steps

### Step 1: Open Browser Console
1. Open your browser to http://localhost:3009
2. Press **F12** to open Developer Tools
3. Click on the **Console** tab
4. Clear any existing logs

### Step 2: Test FlatmatePayments Data Flow
1. Navigate to the **Payments** tab
2. Look at the **purple debug panel** at the top:
   - Does "Debt Data" show non-zero values for flatmates with unpaid months?
   - Does "Has onDebtUpdate callback" show "Yes"?
3. Check the **console** for logs like:
   ```
   FlatmatePayments: Alice 2025-05 - Paid: €0, Required: €10, Owed: €10, Total debt so far: €10
   FlatmatePayments: Final debt calculation result: { "Alice": 30, "Bob": 20, "Charlie": 0 }
   FlatmatePayments: Updating parent with debt data: { "Alice": 30, "Bob": 20, "Charlie": 0 }
   ```

### Step 3: Test App.js Data Reception
1. Still on Payments tab, check console for:
   ```
   App.js: setMonthlyPaymentDebts called with: { "Alice": 30, "Bob": 20, "Charlie": 0 }
   ```
   - **If you see this log**: Data flow is working ✅
   - **If you DON'T see this log**: Callback issue ❌

### Step 4: Test Balance Calculation
1. Navigate to the **Dashboard** tab
2. Look at flatmate cards - each should show:
   - Purple debug text: `Debug: Monthly debts = {"Alice": 30, "Bob": 20, "Charlie": 0}`
3. Check console for:
   ```
   App.js: Starting comprehensive balance calculation
   App.js: monthlyPaymentDebts: { "Alice": 30, "Bob": 20, "Charlie": 0 }
   App.js: Processing monthly payment debts
   App.js: Subtracting €30 debt for Alice
   App.js: Subtracting €20 debt for Bob
   App.js: Final comprehensive balances: { "Alice": -30, "Bob": -20, "Charlie": 0 }
   ```

### Step 5: Verify Balance Display
1. Check that flatmate balances are actually affected by monthly debts
2. Compare the displayed balance with the "Final comprehensive balances" in console
3. Verify that flatmates with monthly payment debts show more negative balances

## 🔍 What to Look For

### ✅ Working Correctly (Expected Results):
```
Console Output:
- FlatmatePayments logs showing debt calculations per month
- "Final debt calculation result" with proper debt amounts
- "setMonthlyPaymentDebts called with" showing data transfer
- "Starting comprehensive balance calculation" with non-empty monthlyPaymentDebts
- "Subtracting €X debt for [Name]" for each flatmate with debt
- Balance display matches final comprehensive calculation

UI Output:
- Purple debug panel shows non-zero debt values
- Purple debug text in Dashboard shows debt object
- Flatmate balances reflect both expenses AND monthly payment debts
```

### ❌ Issues to Identify:

#### Issue 1: Debt Calculation Problem
```console
FlatmatePayments: Final debt calculation result: { "Alice": 0, "Bob": 0, "Charlie": 0 }
```
**Cause**: Monthly contributions data or calculation logic issue

#### Issue 2: Callback Not Working
```console
FlatmatePayments: Updating parent with debt data: { "Alice": 30, "Bob": 20 }
// Missing: App.js: setMonthlyPaymentDebts called with...
```
**Cause**: onDebtUpdate callback not reaching App.js

#### Issue 3: Balance Calculation Not Using Monthly Debts
```console
App.js: monthlyPaymentDebts: {}
App.js: No monthly payment debts available
```
**Cause**: State not being updated or calculation running before state update

## 📊 Sample Test Data

To create test conditions:
1. Go to **Payments** tab
2. Set "Required Amount" to €10
3. The system tracks last 12 months
4. Any month without a €10 contribution creates debt
5. Multiple unpaid months accumulate debt

## 🎯 Next Steps

Based on your test results:

1. **If everything works correctly**: The system is functioning properly, issue may be elsewhere
2. **If debt calculation is zero**: Need to investigate monthly contributions data
3. **If callback doesn't work**: Need to fix component communication
4. **If balance calculation ignores monthly debts**: Need to fix state management

Please run these tests and report back what you see in both the console and the UI debug panels!

---

*Remember to check both the console logs AND the visual debug panels for a complete picture.*
