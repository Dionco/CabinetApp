#!/bin/bash

# 🏠 Student House Finance Tracker - Setup Script
# This script helps you get started with your finance tracker

echo "🏠 Welcome to Student House Finance Tracker Setup!"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔥 Setting up Firebase..."
echo "Make sure you've:"
echo "1. Created a Firebase project at https://console.firebase.google.com"
echo "2. Enabled Firestore Database"
echo "3. Updated the config in src/firebase.js"
echo ""

echo "🧪 Testing with sample data..."
echo "We'll add some demo flatmates and expenses for testing"

echo "🚀 Starting the development server..."
npm start &

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Add your flatmates"
echo "3. Test the bank import with ING_CSV_SAMPLE.csv"
echo "4. Check out the Analytics tab"
echo ""
echo "📚 Documentation:"
echo "- BANK_INTEGRATION_GUIDE.md - Complete bank integration guide"
echo "- TESTING_GUIDE.md - Testing your bank import"
echo "- README.md - General app documentation"
echo ""
echo "🏦 Bank Integration:"
echo "1. Export CSV from your ING account"
echo "2. Use the '🏦 Import Bank' button in the app"
echo "3. Upload your CSV file"
echo "4. Review and assign imported transactions"
echo ""
echo "Happy expense tracking! 💰"
