import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, doc, setDoc, query, orderBy, deleteDoc } from "firebase/firestore";
import { UserProvider, useUser } from "./contexts/UserContext";
import LoginComponent from "./components/LoginComponent";
import TabNavigation from "./components/TabNavigation";
import Analytics from "./components/Analytics";
import ExpensesView from "./components/ExpensesView";
import BankImport from "./components/BankImport";
import FlatmatePayments from "./components/FlatmatePayments";
import ConsumptionTracker from "./components/ConsumptionTracker";
import UserManagement from "./components/UserManagement";
import PermissionWrapper from "./components/PermissionWrapper";

function MainApp() {
  const { currentUser, hasPermission, PERMISSIONS, logoutUser } = useUser();
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState({});
  const [monthlyContributions, setMonthlyContributions] = useState([]);
  const [settlementPayments, setSettlementPayments] = useState({}); // Track who has paid their settlements
  const [flatmates, setFlatmates] = useState([]);
  const [consumptionSettlements, setConsumptionSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Form states
  const [newExpense, setNewExpense] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState("food");
  const [paidBy, setPaidBy] = useState("");
  const [showAddFlatmate, setShowAddFlatmate] = useState(false);
  const [newFlatmateName, setNewFlatmateName] = useState("");
  const [newFlatmateLastname, setNewFlatmateLastname] = useState("");
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [showBankImport, setShowBankImport] = useState(false);

  // Edit expense states
  const [editingExpense, setEditingExpense] = useState(null);
  const [editExpenseName, setEditExpenseName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("food");
  const [editPaidBy, setEditPaidBy] = useState("");

  // Categories for expenses
  const categories = [
    { value: "food", label: "🍕 Food & Cooking", color: "bg-green-100 text-green-800" },
    { value: "cleaning", label: "🧽 Cleaning Products", color: "bg-blue-100 text-blue-800" },
    { value: "toiletries", label: "🧻 Toilet Paper", color: "bg-purple-100 text-purple-800" },
    { value: "beer", label: "🍺 Beer", color: "bg-yellow-100 text-yellow-800" },
    { value: "seltzer", label: "🥤 Seltzer", color: "bg-teal-100 text-teal-800" },
    { value: "coffee", label: "☕ Coffee", color: "bg-amber-100 text-amber-800" },
    { value: "utilities", label: "⚡ Utilities", color: "bg-red-100 text-red-800" },
    { value: "activities", label: "🎉 Activities & Fun", color: "bg-pink-100 text-pink-800" },
    { value: "contribution", label: "💵 Monthly Contribution", color: "bg-indigo-100 text-indigo-800" },
    { value: "other", label: "📦 Other", color: "bg-gray-100 text-gray-800" }
  ];

  // Error handling wrapper
  async function handleAsync(asyncFunction) {
    try {
      setError(null);
      return await asyncFunction();
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "An error occurred");
      throw err;
    }
  }

  // Fetch all expenses
  async function fetchExpenses() {
    return handleAsync(async () => {
      const q = query(collection(db, "expenses"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      setExpenses(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }

  // Helper function to get flatmate display name
  const getFlatmateDisplayName = (flatmate) => {
    if (typeof flatmate === 'string') {
      // For backward compatibility with old data
      return flatmate;
    }
    return flatmate.fullName || flatmate.name || 'Unknown';
  };

  // Helper function to get flatmate search key (for balance lookups)
  const getFlatmateKey = (flatmate) => {
    if (typeof flatmate === 'string') {
      return flatmate;
    }
    return flatmate.fullName || flatmate.name;
  };

  // Fetch flatmates
  async function fetchFlatmates() {
    return handleAsync(async () => {
      const querySnapshot = await getDocs(collection(db, "flatmates"));
      const flatmatesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFlatmates(flatmatesList);
      if (flatmatesList.length > 0 && !paidBy) {
        setPaidBy(flatmatesList[0].name);
      }
    });
  }

  // Fetch balances
  async function fetchBalances() {
    return handleAsync(async () => {
      const querySnapshot = await getDocs(collection(db, "balances"));
      const balanceData = {};
      querySnapshot.docs.forEach(doc => {
        balanceData[doc.id] = doc.data().balance || 0;
      });
      setBalances(balanceData);
    });
  }

  // Fetch monthly contributions
  async function fetchMonthlyContributions() {
    return handleAsync(async () => {
      const q = query(collection(db, "monthlyContributions"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      setMonthlyContributions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }

  // Fetch consumption settlements
  async function fetchConsumptionSettlements() {
    return handleAsync(async () => {
      const q = query(collection(db, "consumptionSettlements"), orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      const settlements = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
      }));
      setConsumptionSettlements(settlements);
    });
  }

  // Fetch settlement payments
  async function fetchSettlementPayments() {
    return handleAsync(async () => {
      const querySnapshot = await getDocs(collection(db, "settlementPayments"));
      const paymentData = {};
      querySnapshot.docs.forEach(doc => {
        paymentData[doc.id] = doc.data();
      });
      setSettlementPayments(paymentData);
    });
  }

  // Toggle settlement payment status
  async function toggleSettlementPayment(debtorName, creditorName, amount) {
    if (!hasPermission(PERMISSIONS.EDIT_EXPENSE)) {
      alert('You do not have permission to mark settlement payments');
      return;
    }

    return handleAsync(async () => {
      const paymentId = `${debtorName}_${creditorName}`;
      const paymentRef = doc(db, "settlementPayments", paymentId);
      
      const currentPayment = settlementPayments[paymentId];
      const newStatus = !currentPayment?.paid;
      
      await setDoc(paymentRef, {
        debtorName,
        creditorName,
        amount,
        paid: newStatus,
        lastUpdated: new Date(),
        updatedBy: currentUser?.name || 'Unknown'
      });

      // Refresh settlement payments
      await fetchSettlementPayments();
    });
  }

  // Toggle consumption payment status (for individual consumption debts)
  async function toggleConsumptionPayment(paymentId, flatmateName, settlementId, amount) {
    if (!hasPermission(PERMISSIONS.EDIT_EXPENSE)) {
      alert('You do not have permission to mark settlement payments');
      return;
    }

    return handleAsync(async () => {
      const paymentRef = doc(db, "settlementPayments", paymentId);
      
      const currentPayment = settlementPayments[paymentId];
      const newStatus = !currentPayment?.paid;
      
      await setDoc(paymentRef, {
        type: 'consumption',
        flatmateName,
        settlementId,
        amount,
        paid: newStatus,
        lastUpdated: new Date(),
        updatedBy: currentUser?.name || 'Unknown'
      });

      // Refresh settlement payments
      await fetchSettlementPayments();
    });
  }

  // Add monthly contribution
  async function addMonthlyContribution(flatmateName, amount = 10) {
    return handleAsync(async () => {
      const contribution = {
        flatmate: flatmateName,
        amount: parseFloat(amount),
        timestamp: new Date(),
        month: new Date().toISOString().slice(0, 7) // YYYY-MM format
      };

      // Add to Firebase
      await addDoc(collection(db, "monthlyContributions"), contribution);
      
      // Update bank balance (contributions increase the balance)
      const currentBalance = balances[flatmateName] || 0;
      await setDoc(doc(db, "balances", flatmateName), {
        balance: currentBalance + parseFloat(amount)
      });

      // Refresh data
      await Promise.all([fetchMonthlyContributions(), fetchBalances()]);
    });
  }

  // Delete expense (with permission check)
  async function deleteExpense(expenseId) {
    if (!hasPermission(PERMISSIONS.DELETE_EXPENSE)) {
      setError("You don't have permission to delete expenses");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    
    return handleAsync(async () => {
      const expense = expenses.find(e => e.id === expenseId);
      if (!expense) return;
      
      // Reverse the balance changes
      const { amount, paidBy, participants } = expense;
      const splitAmount = amount / participants.length;
      
      // Reverse payer's balance
      const payerCurrentBalance = balances[paidBy] || 0;
      await setDoc(doc(db, "balances", paidBy), {
        balance: payerCurrentBalance - amount + splitAmount
      });
      
      // Reverse participants' balances (use existing participants from the expense)
      for (const participant of participants) {
        if (participant !== paidBy) {
          const participantCurrentBalance = balances[participant] || 0;
          await setDoc(doc(db, "balances", participant), {
            balance: participantCurrentBalance + splitAmount
          });
        }
      }
      
      // Delete the expense
      await deleteDoc(doc(db, "expenses", expenseId));
      
      // Refresh data
      await Promise.all([fetchExpenses(), fetchBalances()]);
    });
  }

  // Edit expense (with permission check)
  async function editExpense(expenseId, updatedExpenseData) {
    if (!hasPermission(PERMISSIONS.EDIT_EXPENSE)) {
      setError("You don't have permission to edit expenses");
      return;
    }
    
    return handleAsync(async () => {
      const originalExpense = expenses.find(e => e.id === expenseId);
      if (!originalExpense) {
        setError("Expense not found");
        return;
      }
      
      // First, reverse the original expense's balance changes
      const { amount: originalAmount, paidBy: originalPaidBy, participants: originalParticipants } = originalExpense;
      const originalSplitAmount = originalAmount / originalParticipants.length;
      
      // Reverse original payer's balance
      const originalPayerCurrentBalance = balances[originalPaidBy] || 0;
      await setDoc(doc(db, "balances", originalPaidBy), {
        balance: originalPayerCurrentBalance - originalAmount + originalSplitAmount
      });
      
      // Reverse original participants' balances
      for (const participant of originalParticipants) {
        if (participant !== originalPaidBy) {
          const participantCurrentBalance = balances[participant] || 0;
          await setDoc(doc(db, "balances", participant), {
            balance: participantCurrentBalance + originalSplitAmount
          });
        }
      }
      
      // Create updated expense object
      const participantNames = flatmates.map(f => f.name);
      const updatedExpense = {
        name: updatedExpenseData.name.trim(),
        amount: parseFloat(updatedExpenseData.amount),
        category: updatedExpenseData.category,
        paidBy: updatedExpenseData.paidBy,
        participants: participantNames,
        timestamp: originalExpense.timestamp, // Keep original timestamp
        splitAmount: parseFloat(updatedExpenseData.amount) / participantNames.length,
        editedAt: new Date() // Add edit timestamp
      };
      
      // Update the expense in Firestore
      await setDoc(doc(db, "expenses", expenseId), updatedExpense);
      
      // Apply new balance changes
      const newSplitAmount = updatedExpense.amount / participantNames.length;
      
      // Update new payer's balance
      const newPayerCurrentBalance = balances[updatedExpense.paidBy] || 0;
      await setDoc(doc(db, "balances", updatedExpense.paidBy), {
        balance: newPayerCurrentBalance + updatedExpense.amount - newSplitAmount
      });
      
      // Update all flatmates' balances for new split
      for (const flatmate of flatmates) {
        if (flatmate.name !== updatedExpense.paidBy) {
          const participantCurrentBalance = balances[flatmate.name] || 0;
          await setDoc(doc(db, "balances", flatmate.name), {
            balance: participantCurrentBalance - newSplitAmount
          });
        }
      }
      
      // Refresh data
      await Promise.all([fetchExpenses(), fetchBalances()]);
    });
  }

  // Add new flatmate (with permission check)
  async function addFlatmate() {
    if (!hasPermission(PERMISSIONS.ADD_FLATMATE)) {
      setError("You don't have permission to add flatmates");
      return;
    }
    
    if (!newFlatmateName.trim()) return;
    
    return handleAsync(async () => {
      const flatmateData = {
        name: newFlatmateName.trim(),
        lastname: newFlatmateLastname.trim() || "",
        fullName: `${newFlatmateName.trim()} ${newFlatmateLastname.trim()}`.trim(),
        joinedAt: new Date()
      };
      
      await addDoc(collection(db, "flatmates"), flatmateData);
      
      // Initialize balance for new flatmate (using full name for backward compatibility)
      const balanceKey = flatmateData.fullName || flatmateData.name;
      await setDoc(doc(db, "balances", balanceKey), {
        balance: 0
      });
      
      setNewFlatmateName("");
      setNewFlatmateLastname("");
      setShowAddFlatmate(false);
      await Promise.all([fetchFlatmates(), fetchBalances()]);
    });
  }

  // Remove flatmate (with permission check)
  async function removeFlatmate(flatmateId, flatmateName) {
    if (!hasPermission(PERMISSIONS.REMOVE_FLATMATE)) {
      setError("You don't have permission to remove flatmates");
      return;
    }
    
    if (!window.confirm(`Are you sure you want to remove ${flatmateName}? This action cannot be undone.`)) {
      return;
    }
    
    return handleAsync(async () => {
      // Delete flatmate document
      await deleteDoc(doc(db, "flatmates", flatmateId));
      
      // Delete their balance document
      await deleteDoc(doc(db, "balances", flatmateName));
      
      // Refresh data
      await Promise.all([fetchFlatmates(), fetchBalances()]);
    });
  }

  // Reset all balances (admin function)
  async function resetAllBalances() {
    if (!hasPermission(PERMISSIONS.RESET_BALANCES)) {
      setError("You don't have permission to reset balances");
      return;
    }
    
    if (!window.confirm("Are you sure you want to reset all balances to zero? This action cannot be undone.")) {
      return;
    }
    
    return handleAsync(async () => {
      // Reset all flatmate balances to zero
      for (const flatmate of flatmates) {
        await setDoc(doc(db, "balances", flatmate.name), {
          balance: 0
        });
      }
      
      // Refresh balances
      await fetchBalances();
    });
  }

  // Update balances after expense
  async function updateBalances(expense) {
    const { amount, paidBy } = expense;
    const splitAmount = amount / flatmates.length;
    
    // Update payer's balance (they get credited)
    const payerCurrentBalance = balances[paidBy] || 0;
    await setDoc(doc(db, "balances", paidBy), {
      balance: payerCurrentBalance + amount - splitAmount
    });
    
    // Update all flatmates' balances (they owe money)
    for (const flatmate of flatmates) {
      if (flatmate.name !== paidBy) {
        const participantCurrentBalance = balances[flatmate.name] || 0;
        await setDoc(doc(db, "balances", flatmate.name), {
          balance: participantCurrentBalance - splitAmount
        });
      }
    }
  }

  // Add a new expense
  async function addExpense() {
    if (!newExpense.trim() || !newAmount || flatmates.length === 0) {
      setError("Please fill in all fields");
      return;
    }

    return handleAsync(async () => {
      const participantNames = flatmates.map(f => f.name);
      const expense = {
        name: newExpense.trim(),
        amount: parseFloat(newAmount),
        category: newCategory,
        paidBy: paidBy,
        participants: participantNames,
        timestamp: new Date(),
        splitAmount: parseFloat(newAmount) / participantNames.length
      };

      // Add the expense to Firestore
      await addDoc(collection(db, "expenses"), expense);
      
      // Update balances
      await updateBalances(expense);

      // Reset form
      setNewExpense("");
      setNewAmount("");

      // Refresh data
      await Promise.all([fetchExpenses(), fetchBalances()]);
    });
  }

  // Start editing an expense
  function startEditingExpense(expense) {
    setEditingExpense(expense);
    setEditExpenseName(expense.name);
    setEditAmount(expense.amount.toString());
    setEditCategory(expense.category);
    setEditPaidBy(expense.paidBy);
  }

  // Cancel editing
  function cancelEditing() {
    setEditingExpense(null);
    setEditExpenseName("");
    setEditAmount("");
    setEditCategory("food");
    setEditPaidBy("");
  }

  // Submit expense edit
  async function submitExpenseEdit() {
    if (!editExpenseName.trim() || !editAmount || !editPaidBy) {
      setError("Please fill in all fields");
      return;
    }

    const updatedData = {
      name: editExpenseName,
      amount: editAmount,
      category: editCategory,
      paidBy: editPaidBy
    };

    await editExpense(editingExpense.id, updatedData);
    cancelEditing();
  }

  // Calculate comprehensive balances including monthly payments and consumption settlements
  // Note: Expenses are NOT included as they are covered by monthly contributions
  function calculateComprehensiveBalances() {
    const comprehensiveBalances = {};
    
    // Initialize balances for all flatmates (using the correct key)
    flatmates.forEach(flatmate => {
      const flatmateKey = getFlatmateKey(flatmate);
      comprehensiveBalances[flatmateKey] = 0;
    });
    
    // 1. Calculate and subtract monthly payment debts directly
    const currentMonthlyDebts = calculateMonthlyPaymentDebts();
    
    Object.entries(currentMonthlyDebts).forEach(([flatmateName, debt]) => {
      if (comprehensiveBalances.hasOwnProperty(flatmateName)) {
        comprehensiveBalances[flatmateName] -= debt || 0;
      }
    });
    
    // 2. Calculate and subtract consumption settlement debts
    if (consumptionSettlements && consumptionSettlements.length > 0) {
      consumptionSettlements.forEach(settlement => {
        if (settlement.consumptionData) {
          Object.entries(settlement.consumptionData).forEach(([flatmateName, count]) => {
            if (count > 0 && comprehensiveBalances.hasOwnProperty(flatmateName)) {
              const individualCost = count * settlement.costPerUnit;
              const paymentId = `consumption_${settlement.id}_${flatmateName}`;
              const isPaid = settlementPayments?.[paymentId]?.paid || false;
              
              // Only subtract if not paid
              if (!isPaid) {
                comprehensiveBalances[flatmateName] -= individualCost;
              }
            }
          });
        }
      });
    }
    
    return comprehensiveBalances;
  }

  // Calculate monthly payment debts directly (independent of FlatmatePayments component)
  function calculateMonthlyPaymentDebts() {
    if (!flatmates || flatmates.length === 0) {
      return {};
    }

    const debts = {};
    const requiredAmount = 10; // €10 per month per flatmate
    
    // Generate last 12 months
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        date: date
      });
    }

    flatmates.forEach(flatmate => {
      const flatmateKey = getFlatmateKey(flatmate);
      debts[flatmateKey] = 0;

      months.forEach(month => {
        const monthStart = new Date(month.date.getFullYear(), month.date.getMonth(), 1);
        const monthEnd = new Date(month.date.getFullYear(), month.date.getMonth() + 1, 0);

        // Find all payments for this flatmate in this month
        const monthlyPayments = monthlyContributions.filter(contribution => {
          const contributionDate = contribution.timestamp?.seconds 
            ? new Date(contribution.timestamp.seconds * 1000)
            : new Date(contribution.timestamp);
          
          // Enhanced name matching for new flatmate structure
          const nameMatch = contribution.flatmate === flatmateKey || 
                           contribution.flatmate === flatmate.name ||
                           contribution.description?.toLowerCase().includes(flatmate.name.toLowerCase()) ||
                           (flatmate.lastname && contribution.description?.toLowerCase().includes(flatmate.lastname.toLowerCase()));
          
          const dateMatch = (contributionDate >= monthStart && contributionDate <= monthEnd) ||
                           contribution.month === month.key;
          
          return nameMatch && dateMatch;
        });

        const totalPaid = monthlyPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        const amountOwed = Math.max(0, requiredAmount - totalPaid);
        debts[flatmateKey] += amountOwed;
      });
    });

    return debts;
  }

  // Use useEffect to fetch data when the component mounts
  useEffect(() => {
    async function loadData() {
      try {
        await Promise.all([fetchFlatmates(), fetchExpenses(), fetchBalances(), fetchMonthlyContributions(), fetchConsumptionSettlements(), fetchSettlementPayments()]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your finance tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-4xl font-bold text-center mb-4 text-indigo-600">
          🏠 Student House Finance Tracker
        </h1>

        {/* User Header */}
        <div className="mb-6 flex justify-between items-center bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">
              {currentUser.role === 'admin' ? '👑' : 
               currentUser.role === 'treasurer' ? '💰' : 
               currentUser.role === 'moderator' ? '🛡️' : '👤'}
            </span>
            <div>
              <p className="font-semibold text-gray-800">
                Welcome, {currentUser.name}
              </p>
              <p className="text-sm text-gray-600 capitalize">
                {currentUser.role === 'admin' ? 'Administrator' : 
                 currentUser.role === 'treasurer' ? 'Treasurer' : 
                 currentUser.role === 'moderator' ? 'Moderator' : 'Member'}
              </p>
            </div>
          </div>
          <button
            onClick={logoutUser}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button 
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Demo Notice for empty state */}
            {flatmates.length === 0 && (
              <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">👋 Welcome to your Finance Tracker!</h3>
                <p className="text-blue-700">
                  Start by adding your flatmates below. Once you have flatmates, you can begin tracking shared expenses 
                  like groceries, utilities, and household supplies.
                </p>
              </div>
            )}

            {/* Flatmate Management */}
            <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-700">Flatmates & Balances</h2>
                <div className="flex gap-2 flex-wrap">
                  <PermissionWrapper permission={PERMISSIONS.IMPORT_DATA}>
                    <button
                      onClick={() => setShowBankImport(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
                    >
                      🏦 Import Bank
                    </button>
                  </PermissionWrapper>
                  <button
                    onClick={() => setShowContributionForm(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300"
                  >
                    💰 Add Contribution
                  </button>
                  <PermissionWrapper permission={PERMISSIONS.ADD_FLATMATE}>
                    <button
                      onClick={() => setShowAddFlatmate(true)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-300"
                    >
                      + Add Flatmate
                    </button>
                  </PermissionWrapper>
                  <PermissionWrapper permission={PERMISSIONS.RESET_BALANCES}>
                    <button
                      onClick={resetAllBalances}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-300"
                    >
                      🔄 Reset Balances
                    </button>
                  </PermissionWrapper>
                </div>
              </div>
              
              {showContributionForm && (
                <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">Record Monthly Contribution</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select
                      className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      onChange={(e) => {
                        if (e.target.value) {
                          addMonthlyContribution(e.target.value);
                          setShowContributionForm(false);
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="">Select flatmate...</option>
                      {flatmates.map(flatmate => (
                        <option key={flatmate.id} value={flatmate.name}>{flatmate.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowContributionForm(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-sm text-green-700 mt-2">Default contribution: €10.00</p>
                </div>
              )}
              
              {showAddFlatmate && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="First name (e.g., Nathalie)"
                        value={newFlatmateName}
                        onChange={(e) => setNewFlatmateName(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        onKeyPress={(e) => e.key === 'Enter' && addFlatmate()}
                      />
                      <input
                        type="text"
                        placeholder="Last name (e.g., van Wijk)"
                        value={newFlatmateLastname}
                        onChange={(e) => setNewFlatmateLastname(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        onKeyPress={(e) => e.key === 'Enter' && addFlatmate()}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={addFlatmate}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex-1"
                      >
                        Add Flatmate
                      </button>
                      <button
                        onClick={() => {
                          setShowAddFlatmate(false);
                          setNewFlatmateName("");
                          setNewFlatmateLastname("");
                        }}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    💡 Adding last names helps auto-detect contributions from bank imports
                  </p>
                </div>
              )}

              {flatmates.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No flatmates added yet. Click "Add Flatmate" to get started!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {flatmates.map((flatmate) => (
                    <div key={flatmate.id} className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 relative">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-800">{getFlatmateDisplayName(flatmate)}</h3>
                          {flatmate.lastname && (
                            <p className="text-xs text-gray-500">
                              First: {flatmate.name} | Last: {flatmate.lastname}
                            </p>
                          )}
                        </div>
                        <PermissionWrapper permission={PERMISSIONS.REMOVE_FLATMATE}>
                          <button
                            onClick={() => removeFlatmate(flatmate.id, getFlatmateKey(flatmate))}
                            className="text-red-500 hover:text-red-700 text-sm p-1 rounded hover:bg-red-50 transition-colors"
                            title="Remove flatmate"
                          >
                            ✕
                          </button>
                        </PermissionWrapper>
                      </div>
                      <p className={`text-xl font-bold ${
                        (() => {
                          const comprehensiveBalances = calculateComprehensiveBalances();
                          const flatmateKey = getFlatmateKey(flatmate);
                          return (comprehensiveBalances[flatmateKey] || 0) >= 0 ? 'text-green-600' : 'text-red-600';
                        })()
                      }`}>
                        €{(() => {
                          const comprehensiveBalances = calculateComprehensiveBalances();
                          const flatmateKey = getFlatmateKey(flatmate);
                          return (comprehensiveBalances[flatmateKey] || 0).toFixed(2);
                        })()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {(() => {
                          const comprehensiveBalances = calculateComprehensiveBalances();
                          const flatmateKey = getFlatmateKey(flatmate);
                          return (comprehensiveBalances[flatmateKey] || 0) >= 0 ? 'Is owed' : 'Owes';
                        })()}
                      </p>
                      
                      {/* Balance breakdown tooltip */}
                      <div className="text-xs text-gray-500 mt-1 space-y-1">
                        {(() => {
                          const currentMonthlyDebts = calculateMonthlyPaymentDebts();
                          const flatmateKey = getFlatmateKey(flatmate);
                          return currentMonthlyDebts[flatmateKey] > 0 && (
                            <div>Monthly debts: -€{(currentMonthlyDebts[flatmateKey] || 0).toFixed(2)}</div>
                          );
                        })()}
                        {(() => {
                          let consumptionDebt = 0;
                          const flatmateKey = getFlatmateKey(flatmate);
                          if (consumptionSettlements) {
                            consumptionSettlements.forEach(settlement => {
                              if (settlement.consumptionData && settlement.consumptionData[flatmateKey]) {
                                const count = settlement.consumptionData[flatmateKey];
                                if (count > 0) {
                                  const paymentId = `consumption_${settlement.id}_${flatmateKey}`;
                                  const isPaid = settlementPayments?.[paymentId]?.paid || false;
                                  if (!isPaid) {
                                    consumptionDebt += count * settlement.costPerUnit;
                                  }
                                }
                              }
                            });
                          }
                          return consumptionDebt > 0 ? (
                            <div>Consumption debts: -€{consumptionDebt.toFixed(2)}</div>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {flatmates.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Add Expense Section */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-2xl font-semibold mb-6 text-gray-700">Add New Expense</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expense Description</label>
                      <input
                        type="text"
                        placeholder="e.g., Weekly groceries, Toilet paper, Beer for party"
                        value={newExpense}
                        onChange={(e) => setNewExpense(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amount (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Paid By</label>
                      <select
                        value={paidBy}
                        onChange={(e) => setPaidBy(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {flatmates.map(flatmate => (
                          <option key={flatmate.id} value={flatmate.name}>{flatmate.name}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={addExpense}
                      disabled={!newExpense || !newAmount || flatmates.length === 0}
                      className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Add Expense
                    </button>
                  </div>
                </div>

                {/* Recent Expenses */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-2xl font-semibold mb-6 text-gray-700">Recent Expenses</h3>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {expenses.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No expenses yet. Add your first expense to get started!</p>
                    ) : (
                      expenses.slice(0, 5).map((expense) => {
                        const category = categories.find(cat => cat.value === expense.category);
                        return (
                          <div key={expense.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-800">{expense.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${category?.color}`}>
                                    {category?.label}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-800">€{expense.amount?.toFixed(2)}</p>
                                <p className="text-sm text-gray-600">€{expense.splitAmount?.toFixed(2)} each</p>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              <p>Paid by: <span className="font-medium">{expense.paidBy}</span></p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    {expenses.length > 5 && (
                      <button
                        onClick={() => setActiveTab('expenses')}
                        className="w-full text-indigo-600 hover:text-indigo-800 font-medium py-2"
                      >
                        View all {expenses.length} expenses →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Contribution Status for Dashboard */}
            {flatmates.length > 0 && (
              <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-2xl font-semibold mb-4 text-gray-700">
                  🏦 Monthly Contributions - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {flatmates.map((flatmate) => {
                    const currentMonth = new Date().toISOString().slice(0, 7);
                    const hasContributed = monthlyContributions.some(contribution => 
                      contribution.flatmate === flatmate.name && 
                      contribution.month === currentMonth
                    );
                    
                    return (
                      <div 
                        key={flatmate.id}
                        className={`p-4 rounded-lg border-2 ${
                          hasContributed 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-gray-800">{flatmate.name}</h4>
                          <span className="text-2xl">
                            {hasContributed ? '✅' : '❌'}
                          </span>
                        </div>
                        <p className={`text-sm font-medium ${
                          hasContributed ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {hasContributed ? 'Contributed €10.00' : 'Owes €10.00'}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Expected</p>
                      <p className="text-lg font-bold">€{(flatmates.length * 10).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Collected</p>
                      <p className="text-lg font-bold text-green-600">
                        €{monthlyContributions
                          .filter(c => c.month === new Date().toISOString().slice(0, 7))
                          .reduce((sum, c) => sum + c.amount, 0)
                          .toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Still Needed</p>
                      <p className="text-lg font-bold text-red-600">
                        €{Math.max(0, (flatmates.length * 10) - monthlyContributions
                          .filter(c => c.month === new Date().toISOString().slice(0, 7))
                          .reduce((sum, c) => sum + c.amount, 0))
                          .toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Import Modal */}
            {showBankImport && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-semibold text-gray-700">Bank Import</h2>
                      <button
                        onClick={() => setShowBankImport(false)}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                      >
                        ×
                      </button>
                    </div>
                    <BankImport 
                      flatmates={flatmates}
                      onImportComplete={(results) => {
                        console.log('Import completed:', results);
                        // Refresh data after import
                        Promise.all([fetchExpenses(), fetchBalances(), fetchMonthlyContributions()]);
                        setShowBankImport(false);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'analytics' && (
          <Analytics 
            expenses={expenses} 
            categories={categories} 
            flatmates={flatmates} 
            monthlyContributions={monthlyContributions}
            consumptionSettlements={consumptionSettlements}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView 
            expenses={expenses} 
            categories={categories} 
            flatmates={flatmates} 
            deleteExpense={deleteExpense}
            editingExpense={editingExpense}
            editExpenseName={editExpenseName}
            editAmount={editAmount}
            editCategory={editCategory}
            editPaidBy={editPaidBy}
            startEditingExpense={startEditingExpense}
            cancelEditing={cancelEditing}
            submitExpenseEdit={submitExpenseEdit}
            setEditExpenseName={setEditExpenseName}
            setEditAmount={setEditAmount}
            setEditCategory={setEditCategory}
            setEditPaidBy={setEditPaidBy}
          />
        )}

        {activeTab === 'payments' && (
          <FlatmatePayments 
            flatmates={flatmates} 
            monthlyContributions={monthlyContributions} 
            expenses={expenses}
          />
        )}

        {activeTab === 'consumption' && (
          <ConsumptionTracker 
            flatmates={flatmates}
            consumptionSettlements={consumptionSettlements}
            settlementPayments={settlementPayments}
            toggleSettlementPayment={toggleSettlementPayment}
            toggleConsumptionPayment={toggleConsumptionPayment}
            currentUser={currentUser}
            hasPermission={hasPermission}
            PERMISSIONS={PERMISSIONS}
          />
        )}

        {activeTab === 'users' && (
          <PermissionWrapper permission={PERMISSIONS.MANAGE_ROLES}>
            <UserManagement />
          </PermissionWrapper>
        )}
      </div>
    </div>
  );
}

// Main App wrapper with UserProvider
function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

// App content that requires user context
function AppContent() {
  const { currentUser, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginComponent />;
  }

  return <MainApp />;
}

export default App;
