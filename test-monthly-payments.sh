#!/bin/bash

# Monthly Payment Debt Testing Script
echo "🔍 Monthly Payment Debt Investigation"
echo "====================================="
echo ""

echo "📋 Testing Checklist:"
echo "□ 1. Open browser to http://localhost:3009"
echo "□ 2. Open Developer Tools (F12) and go to Console tab"
echo "□ 3. Navigate to Payments tab"
echo "□ 4. Check purple debug panel shows debt data"
echo "□ 5. Check console for FlatmatePayments debt calculations"
echo "□ 6. Navigate to Dashboard tab"
echo "□ 7. Check purple debug text shows monthly debts object"
echo "□ 8. Check console for comprehensive balance calculation"
echo "□ 9. Verify balances include monthly payment debts"
echo ""

echo "🎯 Key Debug Outputs to Look For:"
echo ""
echo "In Console:"
echo "- 'FlatmatePayments: [Name] [Month] - Paid: €X, Required: €Y, Owed: €Z'"
echo "- 'FlatmatePayments: Final debt calculation result: {...}'"
echo "- 'App.js: setMonthlyPaymentDebts called with: {...}'"
echo "- 'App.js: Starting comprehensive balance calculation'"
echo "- 'App.js: Subtracting €X debt for [Name]'"
echo ""

echo "In UI:"
echo "- Purple debug panel in Payments tab with debt data"
echo "- Purple debug text in Dashboard: 'Debug: Monthly debts = {...}'"
echo "- Balance amounts that reflect both expenses AND monthly debts"
echo ""

echo "🚨 Possible Issues to Identify:"
echo "1. Empty debt data: {...} shows all zeros"
echo "2. Missing callback: No 'setMonthlyPaymentDebts called with' log"
echo "3. Empty monthly debts in balance calculation"
echo "4. Balances not reflecting monthly payment debts"
echo ""

echo "Ready to test! Please follow the checklist above and report what you see."
echo "Press Ctrl+C to exit when done testing."

# Keep script running until user stops it
while true; do
    sleep 1
done
