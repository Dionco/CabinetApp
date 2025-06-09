# 🏦 ING Bank Integration - Complete Guide

## 🇳🇱 Your Dutch Student House Bank Integration is Ready!

Your app now supports **CSV import** from ING bank accounts, making it easy to automatically import and categorize your shared house expenses.

## 🚀 Quick Start (CSV Import)

### Step 1: Export from ING
1. Log into [mijn.ing.nl](https://mijn.ing.nl)
2. Select your shared house account
3. Go to "Afschriften" (Statements) or "Transacties" (Transactions)
4. Click "Download" or "Exporteren"
5. Choose **CSV format**
6. Select your date range (last month recommended)
7. Download the file

### Step 2: Import into Your App
1. Open your Student House Finance Tracker
2. Click the **"🏦 Import Bank"** button
3. Upload your CSV file
4. Review the automatic categorization
5. Imported expenses and contributions appear instantly!

## 🤖 Smart Auto-Categorization

Your app automatically recognizes:

### 🍕 **Food & Groceries**
- Albert Heijn, Jumbo, Lidl, Plus, Aldi
- Any transaction with "boodschappen", "groceries", "supermarkt"

### 🧻 **Toiletries**
- Kruidvat, Etos, pharmacy stores
- "toiletpapier", "toilet paper", "drogist"

### 🧽 **Cleaning Supplies**
- Action, Blokker, HEMA
- "cleaning", "schoonmaak", "schoonmaakmiddel"

### 🍺 **Drinks & Alcohol**
- Sligro, Gall & Gall, Mitra
- "beer", "bier", "alcohol", "wine", "wijn"

### ⚡ **Utilities**
- Vattenfall, Eneco, Essent
- "gas", "water", "electric", "energy"

### 💰 **Monthly Contributions**
- Amounts between €8-€15 with keywords:
- "huishoudpot", "house", "shared", "contribution", "maandelijkse"

## 📊 Sample ING CSV Format

Your app handles this ING format:
```csv
Datum,Naam / Omschrijving,Rekening,Tegenrekening,Code,Af Bij,Bedrag,MutatieSoort,Mededelingen
20231201,Albert Heijn 2567 Leiden,NL91INGB0000000123,NL91RABO0123456789,BA,Af,-45.67,Betaalautomaat,Contactloos betalen
20231201,Monthly House Contribution,NL91INGB0000000123,NL91ABNA0123456789,OV,Bij,10.00,Overschrijving,Huishoudpot december
```

## 🔧 What Happens After Import

### ✅ Automatic Processing
- **Expenses**: Automatically split among all flatmates
- **Contributions**: Added to monthly tracking (need manual flatmate assignment)
- **Categories**: Smart categorization based on merchant names
- **Balances**: Automatically updated

### ⚠️ Manual Steps Required
1. **Assign contributions**: Imported contributions show as "Unassigned"
2. **Review categories**: Double-check auto-categorization
3. **Adjust participants**: Some expenses might not include everyone

## 🎯 Advanced Features

### Duplicate Detection
- Prevents importing the same transactions twice
- Compares date, amount, and description

### Error Handling
- Shows detailed results after import
- Lists ignored transactions with reasons
- Handles different date formats (DD-MM-YYYY, YYYY-MM-DD)

### Multiple Formats
- Supports both comma (,) and semicolon (;) separators
- Handles quoted and unquoted CSV fields
- Works with different ING export variations

## 📋 Best Practices

### For Student Houses
1. **Designate one account**: Use one shared ING account for house expenses
2. **Regular imports**: Import weekly or monthly
3. **Clear descriptions**: When transferring money, use clear descriptions like "House contribution December"
4. **Review before finalizing**: Always check imported data before accepting

### Monthly Workflow
1. **Export last month's transactions** from ING
2. **Import CSV** into your app
3. **Assign unassigned contributions** to correct flatmates
4. **Review and adjust** any miscategorized expenses
5. **Check settlement summary** to see who owes what

## 🔮 Future Enhancements

### Phase 2: Real-time API Integration
- **ING Developer API**: Direct account connection
- **Automatic sync**: Real-time transaction import
- **OAuth2 security**: Bank-grade authentication
- **Instant notifications**: Know immediately when expenses are added

### Phase 3: Advanced Features
- **Recurring payment detection**: Automatically handle monthly bills
- **Receipt matching**: Take photos of receipts to match transactions
- **Budget tracking**: Set monthly budgets per category
- **Predictive categorization**: Learn from your corrections

## 🔐 Privacy & Security

- ✅ **Local processing**: CSV files processed in your browser
- ✅ **No bank credentials stored**: Only CSV data is used
- ✅ **Firebase security**: Data encrypted and secured
- ✅ **GDPR compliant**: No personal data shared with third parties

## 🆘 Troubleshooting

### CSV Import Issues
**Problem**: "No valid transactions found"
- **Solution**: Check if file is actually from ING and contains transaction data

**Problem**: "Date parsing errors"
- **Solution**: ING uses DD-MM-YYYY format, ensure your export is recent

**Problem**: "Wrong categories assigned"
- **Solution**: You can manually edit expenses after import

### Common Fixes
1. **Ensure proper CSV export** from ING (not PDF or other format)
2. **Check date range** - empty periods return empty CSV
3. **Verify account selection** - make sure you're exporting the right account

## 📞 Next Steps

Want more advanced integration? Consider:

1. **ING Developer Portal**: Register at [developer.ing.com](https://developer.ing.com)
2. **Open Banking APIs**: Use services like Nordigen or TrueLayer
3. **Business account**: ING Business accounts have better API access

Your CSV import solution works perfectly for most student house needs and provides a solid foundation for future enhancements!

---

*Happy expense tracking! 🏠💰*
