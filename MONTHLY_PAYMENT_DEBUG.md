# 🔍 Monthly Payment Debt Debugging

## 🎯 Investigation Focus

The user reports that **missing monthly contributions may not be properly included in the balance display calculation**. We need to verify:

1. **Data Flow**: Are monthly payment debts properly flowing from FlatmatePayments to App.js?
2. **Calculation Logic**: Is the comprehensive balance calculation correctly including monthly debts?
3. **UI Display**: Are the balances showing the correct comprehensive amounts?

## 🛠️ Debugging Added

### 1. FlatmatePayments Component Debug
```javascript
// In FlatmatePayments.js, useEffect for onDebtUpdate:
useEffect(() => {
  if (onDebtUpdate) {
    console.log('FlatmatePayments: Updating parent with debt data:', debtData);
    onDebtUpdate(debtData);
  }
}, [debtData, onDebtUpdate]);
```

### 2. App.js State Update Debug
```javascript
// Custom setter with debugging:
const setMonthlyPaymentDebts = (newDebts) => {
  console.log('App.js: setMonthlyPaymentDebts called with:', newDebts);
  setMonthlyPaymentDebtsState(newDebts);
};
```

### 3. Comprehensive Balance Calculation Debug
```javascript
function calculateComprehensiveBalances() {
  console.log('App.js: Starting comprehensive balance calculation');
  console.log('App.js: monthlyPaymentDebts:', monthlyPaymentDebts);
  console.log('App.js: flatmates:', flatmates.map(f => f.name));
  
  // ... calculation logic with detailed logging
  
  console.log('App.js: Final comprehensive balances:', comprehensiveBalances);
  return comprehensiveBalances;
}
```

## 🧪 Testing Steps

### Step 1: Check Console Output
1. Open browser console (F12)
2. Navigate to the Payments tab
3. Look for debug logs:
   - `FlatmatePayments: Updating parent with debt data:`
   - `App.js: setMonthlyPaymentDebts called with:`

### Step 2: Check Balance Display
1. Navigate back to Dashboard
2. Look for debug logs:
   - `App.js: Starting comprehensive balance calculation`
   - `App.js: monthlyPaymentDebts:`
   - `App.js: Final comprehensive balances:`

### Step 3: Verify Data Content
1. Check if `monthlyPaymentDebts` contains expected flatmate debt amounts
2. Verify that flatmates with unpaid monthly contributions show positive debt values
3. Confirm that comprehensive balances correctly subtract these debts

## 🔍 Expected Behavior

### Working Scenario:
```javascript
// Expected console output:
FlatmatePayments: Updating parent with debt data: { "Alice": 20, "Bob": 10, "Charlie": 0 }
App.js: setMonthlyPaymentDebts called with: { "Alice": 20, "Bob": 10, "Charlie": 0 }
App.js: Starting comprehensive balance calculation
App.js: monthlyPaymentDebts: { "Alice": 20, "Bob": 10, "Charlie": 0 }
App.js: Subtracting €20 debt for Alice
App.js: Subtracting €10 debt for Bob
App.js: Final comprehensive balances: { "Alice": -20, "Bob": -10, "Charlie": 0 }
```

### Broken Scenario:
```javascript
// Possible broken output:
FlatmatePayments: Updating parent with debt data: { "Alice": 20, "Bob": 10, "Charlie": 0 }
// Missing: App.js: setMonthlyPaymentDebts called with:
App.js: Starting comprehensive balance calculation
App.js: monthlyPaymentDebts: {} // Empty object - indicates callback issue
App.js: No monthly payment debts available
App.js: Final comprehensive balances: { "Alice": 0, "Bob": 0, "Charlie": 0 }
```

## 🎯 Next Steps

Based on console output, we can identify:

1. **Callback Issue**: If `setMonthlyPaymentDebts` is never called
2. **Data Issue**: If debt data is empty or malformed
3. **Calculation Issue**: If debts aren't properly subtracted
4. **Display Issue**: If calculation works but UI doesn't reflect changes

---

*Continue investigation based on console debugging output...*
