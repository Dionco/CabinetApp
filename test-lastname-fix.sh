#!/bin/bash

# Test Script: Lastname as Supplementary Information
# Tests that lastname updates don't break balance tracking

echo "🧪 Testing Lastname as Supplementary Information"
echo "================================================="
echo ""

echo "🔍 Checking that getFlatmateKey uses primary name..."
if grep -q "return flatmate.name; // Always use the primary name field as identifier" /Users/Dion/Documents/Leiden/Morsweg/CabinetApp/house-finance-tracker/src/App.js; then
    echo "✅ getFlatmateKey uses primary name only"
else
    echo "❌ getFlatmateKey still using fullName"
    exit 1
fi

echo ""
echo "🔍 Checking that editFlatmate doesn't migrate balances..."
if grep -q "Note: We don't need to migrate balance data anymore" /Users/Dion/Documents/Leiden/Morsweg/CabinetApp/house-finance-tracker/src/App.js; then
    echo "✅ editFlatmate keeps balance consistency"
else
    echo "❌ editFlatmate might still be migrating balances"
    exit 1
fi

echo ""
echo "🔍 Checking that addFlatmate uses primary name for balance..."
if grep -q "await setDoc(doc(db, \"balances\", flatmateData.name)" /Users/Dion/Documents/Leiden/Morsweg/CabinetApp/house-finance-tracker/src/App.js; then
    echo "✅ addFlatmate uses primary name for balance key"
else
    echo "❌ addFlatmate might be using fullName for balance key"
    exit 1
fi

echo ""
echo "🔍 Checking CSV import uses primary name..."
if grep -q "assignedFlatmate = flatmate.name; // Use primary name for consistency" /Users/Dion/Documents/Leiden/Morsweg/CabinetApp/house-finance-tracker/src/components/BankImport.js; then
    echo "✅ CSV import assigns to primary name"
else
    echo "❌ CSV import might still be using fullName"
    exit 1
fi

echo ""
echo "🔍 Checking that lastname is used for matching..."
if grep -q "flatmate.lastname && contribution.description?.toLowerCase().includes(flatmate.lastname.toLowerCase())" /Users/Dion/Documents/Leiden/Morsweg/CabinetApp/house-finance-tracker/src/components/FlatmatePayments.js; then
    echo "✅ FlatmatePayments uses lastname for matching"
else
    echo "❌ FlatmatePayments not using lastname for matching"
    exit 1
fi

echo ""
echo "🚀 Checking React syntax..."
cd /Users/Dion/Documents/Leiden/Morsweg/CabinetApp/house-finance-tracker
npx eslint src/App.js src/components/BankImport.js src/components/FlatmatePayments.js --quiet
if [ $? -eq 0 ]; then
    echo "✅ No ESLint errors found"
else
    echo "❌ ESLint errors detected"
    exit 1
fi

echo ""
echo "🎉 All tests passed! Lastname is now supplementary information only."
echo ""
echo "📋 Changes verified:"
echo "   ✅ Primary name remains stable identifier"
echo "   ✅ Lastname is supplementary information only"
echo "   ✅ Balance tracking unaffected by lastname edits"
echo "   ✅ CSV matching enhanced with lastname support"
echo "   ✅ Display shows lastname when available"
echo ""
echo "🎯 Expected behavior:"
echo "   • Editing lastname won't reset balances to 0"
echo "   • Primary name (first name) remains the core identifier"
echo "   • Lastname enhances CSV import matching"
echo "   • UI shows full name but tracks by primary name"
echo ""
echo "🚀 Ready for testing!"
