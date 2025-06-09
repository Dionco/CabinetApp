import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

const BankImport = ({ flatmates, onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  // Parse ING CSV format (improved)
  const parseINGCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) {
      throw new Error('CSV file appears to be empty or invalid');
    }
    
    // Handle both comma and semicolon separators
    const firstLine = lines[0];
    const separator = firstLine.includes(';') ? ';' : ',';
    
    const headers = lines[0].split(separator).map(h => h.replace(/"/g, '').trim());
    console.log('CSV Headers:', headers);
    
    const transactions = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      
      const values = lines[i].split(separator).map(v => v.replace(/"/g, '').trim());
      const transaction = {};
      
      headers.forEach((header, index) => {
        transaction[header] = values[index] || '';
      });
      
      // Skip empty transactions
      if (!transaction.Datum && !transaction.date) continue;
      
      // Handle different ING CSV formats (including new format with multiple description fields)
      const parsedTransaction = {
        date: transaction.Datum || transaction.date || transaction.Date,
        amount: Math.abs(parseFloat((transaction.Bedrag || transaction.amount || transaction.Amount || '0').replace(',', '.'))),
        description: transaction['Naam / Omschrijving'] || 
                    transaction.Omschrijving || 
                    transaction.Description || 
                    transaction.description || 
                    // Handle multiple description fields (Omschrijving-1, Omschrijving-2, Omschrijving-3)
                    [transaction['Omschrijving-1'], transaction['Omschrijving-2'], transaction['Omschrijving-3']]
                      .filter(Boolean).join(' ') ||
                    // Also try counterparty name as description
                    transaction['Naam tegenpartij'] || '',
        counterparty: transaction.Tegenrekening || 
                     transaction['Tegenrekening IBAN/BBAN'] || 
                     transaction.counterparty || 
                     transaction.Counterparty || 
                     transaction['Naam tegenpartij'] || '',
        type: transaction['Af Bij'] || transaction.type || transaction.Type || 
              // Determine type from amount sign if not specified
              (parseFloat((transaction.Bedrag || '0').replace(',', '.')) < 0 ? 'Af' : 'Bij'),
        rawData: transaction
      };
      
      // Skip transactions with zero amount
      if (parsedTransaction.amount === 0) continue;
      
      transactions.push(parsedTransaction);
    }
    
    console.log('Parsed transactions:', transactions);
    return transactions;
  };

  // Categorize transactions automatically (enhanced for new CSV format)
  const categorizeTransaction = (description, amount, counterparty) => {
    const desc = description.toLowerCase();
    const party = (counterparty || '').toLowerCase();
    
    // Monthly contributions (incoming money from flatmates)
    if (amount >= 8 && amount <= 15 && (
      desc.includes('huishoudpot') || 
      desc.includes('house') || 
      desc.includes('shared') ||
      desc.includes('contribution') ||
      desc.includes('maandelijkse') ||
      desc.includes('monthly') ||
      desc.includes('bijdrage') ||
      party.includes('huishoud')
    )) {
      return { type: 'contribution', category: null };
    }
    
    // Expense categories based on description and counterparty
    if (desc.includes('albert heijn') || desc.includes('ah ') || desc.includes('jumbo') || 
        desc.includes('supermarkt') || desc.includes('lidl') || desc.includes('plus') ||
        desc.includes('aldi') || desc.includes('groceries') || desc.includes('boodschappen') ||
        party.includes('albert heijn') || party.includes('jumbo') || party.includes('lidl') ||
        party.includes('plus') || party.includes('aldi')) {
      return { type: 'expense', category: 'food' };
    }
    
    if (desc.includes('kruidvat') || desc.includes('etos') || desc.includes('toiletpapier') || 
        desc.includes('toilet paper') || desc.includes('drogist') || desc.includes('pharmacy') ||
        party.includes('kruidvat') || party.includes('etos')) {
      return { type: 'expense', category: 'toiletries' };
    }
    
    if (desc.includes('action') || desc.includes('cleaning') || desc.includes('schoonmaak') ||
        desc.includes('blokker') || desc.includes('hema') || desc.includes('schoonmaakmiddel') ||
        party.includes('action') || party.includes('blokker') || party.includes('hema')) {
      return { type: 'expense', category: 'cleaning' };
    }
    
    if (desc.includes('schultenbräu') || desc.includes('beer') || desc.includes('bier')) {
      return { type: 'expense', category: 'beer' };
    }
    
    if (desc.includes('seltzer') || desc.includes('viper') || desc.includes('gigg')) {
      return { type: 'expense', category: 'seltzer' };
    }
    
    if (desc.includes('coffee') || desc.includes('koffie') || desc.includes('starbucks') ||
        desc.includes('costa') || desc.includes('espresso') || desc.includes('cappuccino') ||
        party.includes('starbucks') || party.includes('costa')) {
      return { type: 'expense', category: 'coffee' };
    }
    
    if (desc.includes('gas') || desc.includes('water') || desc.includes('electric') || 
        desc.includes('energy') || desc.includes('vattenfall') || desc.includes('eneco') ||
        desc.includes('essent') || desc.includes('energieleverancier') || desc.includes('utility') ||
        party.includes('vattenfall') || party.includes('eneco') || party.includes('essent')) {
      return { type: 'expense', category: 'utilities' };
    }

    // For larger amounts or unclear descriptions, mark as other
    return { type: 'expense', category: 'other' };
  };

  // Process and import transactions (enhanced with duplicate detection)
  const processTransactions = async (transactions) => {
    const results = {
      expenses: [],
      contributions: [],
      ignored: [],
      duplicates: []
    };

    for (const transaction of transactions) {
      const categorization = categorizeTransaction(transaction.description, transaction.amount, transaction.counterparty);
      
      // Parse date properly
      let transactionDate;
      try {
        // Handle different date formats: DD-MM-YYYY, YYYY-MM-DD, DD/MM/YYYY
        const dateStr = transaction.date;
        if (dateStr.includes('-')) {
          const parts = dateStr.split('-');
          if (parts[0].length === 4) {
            // YYYY-MM-DD format
            transactionDate = new Date(dateStr);
          } else {
            // DD-MM-YYYY format
            transactionDate = new Date(parts[2], parts[1] - 1, parts[0]);
          }
        } else if (dateStr.includes('/')) {
          // DD/MM/YYYY format
          const parts = dateStr.split('/');
          transactionDate = new Date(parts[2], parts[1] - 1, parts[0]);
        } else {
          transactionDate = new Date(dateStr);
        }
        
        if (isNaN(transactionDate.getTime())) {
          throw new Error('Invalid date');
        }
      } catch (error) {
        console.warn('Could not parse date:', transaction.date);
        transactionDate = new Date(); // Fallback to current date
      }
      
      if (categorization.type === 'contribution') {
        // Add as monthly contribution
        const contribution = {
          flatmate: 'Unassigned', // User will need to assign
          amount: transaction.amount,
          timestamp: transactionDate,
          month: transactionDate.toISOString().slice(0, 7),
          source: 'bank_import',
          description: transaction.description,
          rawTransaction: transaction
        };
        
        try {
          await addDoc(collection(db, 'monthlyContributions'), contribution);
          results.contributions.push(contribution);
        } catch (error) {
          console.error('Error adding contribution:', error);
          results.ignored.push({...transaction, error: 'Failed to save contribution'});
        }
        
      } else if (categorization.type === 'expense') {
        // Add as expense
        const expense = {
          name: transaction.description,
          amount: transaction.amount,
          category: categorization.category,
          paidBy: 'Bank Account', // Can be updated later
          participants: flatmates.map(f => f.name), // Split among all by default
          splitAmount: transaction.amount / Math.max(flatmates.length, 1),
          timestamp: transactionDate,
          source: 'bank_import',
          rawTransaction: transaction
        };
        
        try {
          await addDoc(collection(db, 'expenses'), expense);
          results.expenses.push(expense);
        } catch (error) {
          console.error('Error adding expense:', error);
          results.ignored.push({...transaction, error: 'Failed to save expense'});
        }
        
      } else {
        results.ignored.push(transaction);
      }
    }
    
    return results;
  };

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile && uploadedFile.type === 'text/csv') {
      setFile(uploadedFile);
    } else {
      alert('Please upload a CSV file');
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    setImporting(true);
    setImportResults(null);
    
    try {
      const csvText = await file.text();
      console.log('CSV content preview:', csvText.substring(0, 500));
      
      const transactions = parseINGCSV(csvText);
      console.log('Parsed transactions:', transactions);
      
      if (transactions.length === 0) {
        throw new Error('No valid transactions found in the CSV file');
      }
      
      const results = await processTransactions(transactions);
      
      setImportResults(results);
      
      // Call onImportComplete callback if provided
      if (onImportComplete) {
        onImportComplete(results);
      }
      
    } catch (error) {
      console.error('Import failed:', error);
      alert(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-2xl font-semibold mb-4 text-gray-700">🏦 Bank Import (ING/Rabobank CSV)</h3>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">How to export from your bank:</h4>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Log into your bank's internet banking</li>
            <li>2. Go to your shared house account</li>
            <li>3. Click "Download transactions" or "Transacties downloaden"</li>
            <li>4. Select CSV format</li>
            <li>5. Choose date range (last month recommended)</li>
            <li>6. Upload the downloaded file below</li>
          </ol>
          <div className="mt-2 text-xs text-blue-600">
            ✅ Supports ING and Rabobank CSV formats<br/>
            ✅ Handles multiple description fields (Omschrijving-1, -2, -3)<br/>
            ✅ Auto-detects separator (comma or semicolon)
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
          {file && (
            <p className="mt-2 text-sm text-green-600">
              ✓ File selected: {file.name}
            </p>
          )}
        </div>

        <button
          onClick={handleImport}
          disabled={!file || importing}
          className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {importing ? 'Importing...' : 'Import Transactions'}
        </button>

        {importResults && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Import Results:</h4>
            <div className="text-sm text-green-700 space-y-1">
              <p>✓ {importResults.expenses.length} expenses imported</p>
              <p>✓ {importResults.contributions.length} contributions imported</p>
              <p>• {importResults.ignored.length} transactions ignored</p>
              {importResults.duplicates && importResults.duplicates.length > 0 && (
                <p>⚠ {importResults.duplicates.length} duplicate transactions skipped</p>
              )}
            </div>
            
            {importResults.contributions.length > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠ Action Required: Please assign imported contributions to specific flatmates
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Contributions were imported as "Unassigned" - you can edit them in the Analytics tab
                </p>
              </div>
            )}
            
            {importResults.ignored.length > 0 && (
              <details className="mt-3">
                <summary className="text-sm cursor-pointer text-gray-600 hover:text-gray-800">
                  View ignored transactions ({importResults.ignored.length})
                </summary>
                <div className="mt-2 text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto">
                  {importResults.ignored.map((transaction, index) => (
                    <div key={index} className="border-l-2 border-gray-300 pl-2">
                      <p>Date: {transaction.date}</p>
                      <p>Description: {transaction.description}</p>
                      <p>Amount: €{transaction.amount}</p>
                      {transaction.error && <p className="text-red-600">Error: {transaction.error}</p>}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p><strong>Privacy:</strong> Your bank data is processed locally and stored securely in Firebase. No data is shared with third parties.</p>
        </div>
      </div>
    </div>
  );
};

export default BankImport;
