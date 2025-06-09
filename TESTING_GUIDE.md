# 🧪 Bank Integration Test Plan

## Testing Your ING Bank Integration

### Prerequisites
1. App is running at http://localhost:3000
2. Sample CSV file is available: `ING_CSV_SAMPLE.csv`
3. At least 2-3 flatmates are added to the app

## Test Scenario 1: Basic CSV Import

### Step 1: Setup Flatmates
1. Open the app
2. Add flatmates:
   - Alice
   - Bob  
   - Charlie
   - Diana

### Step 2: Test CSV Import
1. Click "🏦 Import Bank" button
2. Upload the `ING_CSV_SAMPLE.csv` file
3. Click "Import Transactions"
4. Verify results:
   - ✅ Should import 8 expenses
   - ✅ Should import 3 contributions  
   - ✅ Should show success message

### Expected Results
**Imported Expenses:**
- Albert Heijn: €45.67 (Food category)
- Action Leiden: €12.50 (Cleaning category)
- Kruidvat: €8.99 (Toiletries category)
- Sligro: €25.00 (Drinks category)
- Jumbo: €38.45 (Food category)
- Vattenfall: €85.50 (Utilities category)
- Etos: €15.75 (Toiletries category)
- HEMA: €22.95 (Other category)

**Imported Contributions:**
- 3 × €10.00 contributions (marked as "Unassigned")

## Test Scenario 2: Analytics Verification

### Step 1: Check Analytics Tab
1. Click "📊 Analytics" tab
2. Verify data appears in charts:
   - Pie chart shows expense categories
   - Bar chart shows spending by person
   - Monthly trends display

### Step 2: Check Bank Balance
1. Verify bank balance calculation:
   - Total Contributions: €30.00
   - Total Expenses: €254.81
   - Bank Balance: -€224.81 (negative means more spent than contributed)

## Test Scenario 3: Manual Assignment

### Step 1: Assign Contributions
1. Go to Analytics tab
2. Find monthly contributions section
3. Note that contributions are "Unassigned"
4. (Future feature: manually assign to specific flatmates)

## Test Scenario 4: Error Handling

### Step 1: Test Invalid CSV
1. Create a text file with random content
2. Try to import it
3. Should show error message: "No valid transactions found"

### Step 2: Test Empty CSV
1. Create empty CSV file
2. Try to import
3. Should show error message about empty file

## Test Scenario 5: Real ING Data

### Step 1: Export from ING
1. Log into your ING account
2. Go to transaction history
3. Download CSV for last month
4. Import into app

### Step 2: Verify Categorization
1. Check if your actual transactions are categorized correctly:
   - Grocery stores → Food
   - Drug stores → Toiletries
   - Utility companies → Utilities
   - Your flatmate transfers → Contributions

## Troubleshooting Guide

### Issue: "No valid transactions found"
**Cause:** CSV format doesn't match expected ING format
**Solution:** 
- Check if file is actually from ING
- Verify it contains transaction data, not just headers
- Ensure proper date format (DD-MM-YYYY or YYYY-MM-DD)

### Issue: Wrong categories assigned
**Cause:** Transaction descriptions don't match our keywords
**Solution:**
- Manually edit expenses after import
- Update categorization keywords in BankImport.js

### Issue: Contributions not detected
**Cause:** Amount outside €8-€15 range or missing keywords
**Solution:**
- Ensure transfers include keywords like "house", "shared", "huishoudpot"
- Amount should be between €8-€15

## Performance Benchmarks

### Expected Import Times
- Small file (10-20 transactions): < 2 seconds
- Medium file (50-100 transactions): < 5 seconds  
- Large file (200+ transactions): < 10 seconds

### Expected Accuracy
- Grocery categorization: 95%+
- Utility categorization: 90%+
- Contribution detection: 85%+
- Date parsing: 99%+

## Next Steps After Testing

### If Everything Works:
1. Document your specific bank export process
2. Train flatmates on monthly import routine
3. Set up regular backup of Firebase data

### If Issues Found:
1. Check browser console for errors
2. Verify Firebase connection
3. Test with different CSV formats
4. Report specific error messages

## Advanced Testing (Optional)

### Large Data Import
1. Combine multiple months of ING exports
2. Test with 100+ transactions
3. Verify performance and accuracy

### Edge Cases
1. Test with special characters in descriptions
2. Test with very large amounts (€1000+)
3. Test with zero amounts
4. Test with future dates

Your bank integration is now ready for real-world use! 🚀
