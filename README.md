# 🏠 Student House Finance Tracker

A comprehensive React-based web application designed specifically for Dutch student flatmates to track shared expenses, manage monthly contributions, and integrate with ING bank accounts. Keep track of who paid for what, how much everyone owes, and easily split bills for groceries, cleaning supplies, utilities, and more.

## ✨ Key Features

### 💰 **Smart Expense Management**
- **👥 Flatmate Management**: Add and manage all your housemates
- **💳 Flexible Expense Tracking**: Record expenses with intelligent categorization
- **📊 Automatic Splitting**: Split expenses among selected participants
- **💸 Real-time Balance Tracking**: See who owes money and who is owed money
- **🏷️ Smart Categories**: Food, cleaning, utilities, toiletries, drinks, and more

### 🏦 **ING Bank Integration** 🇳🇱
- **📄 CSV Import**: Upload your ING bank exports for automatic processing
- **🤖 Smart Categorization**: Automatically categorizes transactions by merchant
- **💰 Contribution Detection**: Recognizes monthly contributions from flatmates
- **🔄 Duplicate Prevention**: Prevents importing the same transactions twice
- **📈 Bank Balance Tracking**: See your house account balance in real-time

### 📊 **Advanced Analytics**
- **📈 Spending Trends**: Monthly and weekly spending patterns
- **🥧 Category Breakdown**: Visual breakdown of expenses by type
- **👤 Individual Spending**: See who spends most on house expenses
- **💳 Monthly Contributions**: Track who has paid their monthly contribution
- **🏦 Bank Account Status**: Monitor your house account balance

### 📱 **User-Friendly Interface**
- **📱 Responsive Design**: Works perfectly on mobile and desktop
- **🎨 Modern UI**: Clean, intuitive interface with Tailwind CSS
- **⚡ Real-time Updates**: Instant balance updates when expenses are added
- **🔍 Advanced Filtering**: Search and filter expenses by category, person, or date

## 🇳🇱 Perfect for Dutch Student Houses

Specifically designed for Dutch student living situations:

### 🍕 **Common Expense Types**
- Weekly grocery shopping (Albert Heijn, Jumbo, Lidl)
- Household supplies (Action, Blokker, HEMA)  
- Toiletries and personal care (Kruidvat, Etos)
- Utilities (Vattenfall, Eneco, Essent)
- Beer and drinks for parties (Sligro, Gall & Gall)

### 🏦 **ING Bank Integration**
- Direct CSV import from ING accounts
- Recognizes Dutch merchant names
- Handles European date formats (DD-MM-YYYY)
- Supports Dutch transaction descriptions

### 💰 **Monthly Contribution System**
- €10 monthly contribution per flatmate (customizable)
- Track who has paid and who hasn't
- Automatic balance calculations
- Bank account balance monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Firebase account (free tier sufficient)
- ING bank account (for bank integration)

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd house-finance-tracker

# Install dependencies
npm install

# Run the setup script
./setup.sh

# Start the development server
npm start
```

### Firebase Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Update the config in `src/firebase.js` with your Firebase credentials
4. Deploy Firestore rules from `firestore.rules`

## 📋 How to Use

### 1. **Setup Flatmates**
- Add all your housemates using the "Add Flatmate" button
- Each flatmate gets their own balance tracking

### 2. **Record Expenses**
- When someone buys something for the house, add it as an expense
- Select who paid and who should split the cost
- Balances update automatically

### 3. **Monthly Contributions** 
- Each flatmate contributes €10/month to the house pot
- Record contributions using the "Add Contribution" button
- Track payment status in the Analytics tab

### 4. **Bank Import (ING)** 🏦
- Export CSV from your ING account (mijn.ing.nl)
- Click "🏦 Import Bank" in the app
- Upload the CSV file for automatic processing
- Review and assign imported transactions

### 5. **Settlement**
- Check the Settlement Summary to see who owes what
- Use bank transfers for easy tracking
- Aim to settle weekly or monthly

## 🎯 Example Workflow

1. **Alice buys groceries** for €60 → Split between Alice, Bob, Charlie
   - Alice balance: +€40 (paid €60, owes €20)
   - Bob & Charlie: -€20 each

2. **Bob pays utilities** for €90 → Split between everyone
   - Bob balance: +€67.50 (paid €90, owes €22.50) 
   - Others: -€22.50 each

3. **Monthly contributions** → Everyone pays €10
   - Bank account: +€40 total
   - Individual balances: +€10 each

4. **Settlement time** → App shows "Charlie owes Alice €42.50"

## 🏦 Bank Integration Guide

### Supported Features
- ✅ ING CSV import
- ✅ Automatic categorization
- ✅ Contribution detection
- ✅ Duplicate prevention
- ✅ Date format handling
- ✅ Error handling

### How to Export from ING
1. Log into [mijn.ing.nl](https://mijn.ing.nl)
2. Select your shared house account
3. Go to "Transacties" (Transactions)
4. Click "Download" → Choose CSV format
5. Select date range (last month recommended)
6. Upload to the app using "🏦 Import Bank"

### Automatic Categorization
The app recognizes these Dutch merchants:
- **Food**: Albert Heijn, Jumbo, Lidl, Plus, Aldi
- **Toiletries**: Kruidvat, Etos
- **Cleaning**: Action, Blokker, HEMA
- **Drinks**: Sligro, Gall & Gall
- **Utilities**: Vattenfall, Eneco, Essent

## 📊 Analytics & Insights

### Available Charts
- **Category Breakdown**: Pie chart of spending by type
- **Spending by Person**: Bar chart of individual contributions
- **Monthly Trends**: Line chart of spending over time
- **Weekly Patterns**: Current month weekly breakdown

### Key Metrics
- Total amount spent
- Average expense amount
- Largest single expense
- Bank account balance
- Monthly contribution status
- Settlement summary

## 🛠️ Tech Stack

- **Frontend**: React 19, Tailwind CSS
- **Backend**: Firebase Firestore
- **Charts**: Recharts
- **Date Handling**: date-fns
- **Hosting**: Can be deployed to Vercel, Netlify, or Firebase Hosting

## 📚 Documentation

- **[BANK_INTEGRATION_GUIDE.md](BANK_INTEGRATION_GUIDE.md)** - Complete bank integration guide
- **[USER_MANUAL.md](USER_MANUAL.md)** - User guide for flatmates  
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Testing your bank import
- **[IMPROVEMENTS.md](IMPROVEMENTS.md)** - App improvement history

## 🔐 Privacy & Security

- ✅ **Local CSV processing**: Bank data processed in your browser
- ✅ **No credentials stored**: Only transaction data is saved
- ✅ **Firebase security**: Data encrypted and secured in Google Cloud
- ✅ **GDPR compliant**: No personal data shared with third parties
- ✅ **Open source**: Full transparency of code and data handling

## 🚀 Future Enhancements

### Planned Features
- **Real-time API integration** with ING Developer Portal
- **Recurring payment detection** for utilities and subscriptions
- **Receipt scanning** with OCR for expense verification
- **Budget tracking** with category limits
- **Mobile app** for iOS and Android
- **Multi-bank support** (Rabobank, ABN AMRO)

### API Integration Roadmap
1. **Phase 1**: CSV import (✅ Complete)
2. **Phase 2**: ING Developer API integration
3. **Phase 3**: Open Banking (PSD2) support
4. **Phase 4**: Multi-bank aggregation

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Report bugs** in the issues section
2. **Suggest features** for student house needs
3. **Improve bank categorization** for Dutch merchants
4. **Add support for other banks** (Rabobank, ABN AMRO)
5. **Translate to Dutch** for better accessibility

## 📞 Support

Need help? Check these resources:

1. **[USER_MANUAL.md](USER_MANUAL.md)** - Complete user guide
2. **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Troubleshooting import issues
3. **GitHub Issues** - Report bugs or request features
4. **Firebase Console** - Check your database status

## 📄 License

This project is open source and available under the MIT License.

---

## Available Scripts

In the project directory, you can run:

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm test`
Launches the test runner in interactive watch mode

### `npm run build`
Builds the app for production to the `build` folder

### `./setup.sh`
Runs the complete setup process for new users

---

**Made with ❤️ for Dutch student houses**

*Perfect for tracking shared expenses in Leiden, Amsterdam, Utrecht, and beyond! 🇳🇱*
