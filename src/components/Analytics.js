import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

const Analytics = ({ expenses, categories, flatmates, monthlyContributions: contributionsData = [], consumptionSettlements = [] }) => {
  // Color palette for charts
  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];

  // Calculate category totals
  const getCategoryData = () => {
    const categoryTotals = {};
    categories.forEach(cat => {
      categoryTotals[cat.value] = 0;
    });

    expenses.forEach(expense => {
      if (categoryTotals.hasOwnProperty(expense.category)) {
        categoryTotals[expense.category] += expense.amount;
      }
    });

    return categories.map((cat, index) => ({
      name: cat.label,
      value: categoryTotals[cat.value],
      color: COLORS[index % COLORS.length]
    })).filter(item => item.value > 0);
  };

  // Calculate spending by person
  const getSpendingByPerson = () => {
    const spendingData = {};
    flatmates.forEach(flatmate => {
      spendingData[flatmate.name] = 0;
    });

    expenses.forEach(expense => {
      if (spendingData.hasOwnProperty(expense.paidBy)) {
        spendingData[expense.paidBy] += expense.amount;
      }
    });

    return Object.entries(spendingData).map(([name, amount]) => ({
      name,
      amount: parseFloat(amount.toFixed(2))
    }));
  };

  // Calculate monthly spending trends
  const getMonthlyTrends = () => {
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5);
    
    const months = eachMonthOfInterval({
      start: sixMonthsAgo,
      end: now
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.timestamp?.seconds * 1000);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      });

      const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      return {
        month: format(month, 'MMM yyyy'),
        total: parseFloat(total.toFixed(2)),
        count: monthExpenses.length
      };
    });
  };

  // Calculate weekly trends for current month
  const getWeeklyTrends = () => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const weeks = eachWeekOfInterval({
      start: monthStart,
      end: monthEnd
    });

    return weeks.map((week, index) => {
      const weekStart = startOfWeek(week);
      const weekEnd = endOfWeek(week);
      
      const weekExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.timestamp?.seconds * 1000);
        return expenseDate >= weekStart && expenseDate <= weekEnd;
      });

      const total = weekExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      return {
        week: `Week ${index + 1}`,
        total: parseFloat(total.toFixed(2)),
        count: weekExpenses.length
      };
    });
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const avgExpense = expenses.length > 0 ? totalSpent / expenses.length : 0;
    const largestExpense = expenses.length > 0 ? Math.max(...expenses.map(e => e.amount)) : 0;
    
    // This month's spending
    const now = new Date();
    const monthStart = startOfMonth(now);
    const thisMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.timestamp?.seconds * 1000);
      return expenseDate >= monthStart;
    });
    const thisMonthTotal = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    return {
      totalSpent,
      avgExpense,
      largestExpense,
      thisMonthTotal,
      expenseCount: expenses.length
    };
  };

  // Calculate monthly contribution status
  const getMonthlyContributionData = () => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const contributionStatus = {};
    
    // Initialize all flatmates as not paid
    flatmates.forEach(flatmate => {
      contributionStatus[flatmate.name] = {
        name: flatmate.name,
        paid: false,
        amount: 0,
        owed: 10 // Each person owes €10 per month
      };
    });

    // Check who has paid this month
    contributionsData.forEach(contribution => {
      const contributionMonth = format(new Date(contribution.timestamp?.seconds * 1000), 'yyyy-MM');
      if (contributionMonth === currentMonth && contributionStatus[contribution.flatmate]) {
        contributionStatus[contribution.flatmate].paid = true;
        contributionStatus[contribution.flatmate].amount = contribution.amount;
        contributionStatus[contribution.flatmate].owed = Math.max(0, 10 - contribution.amount);
      }
    });

    return Object.values(contributionStatus);
  };

  // Calculate total bank account balance
  const getBankAccountStatus = () => {
    const totalContributions = contributionsData.reduce((sum, contribution) => sum + contribution.amount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const balance = totalContributions - totalExpenses;
    
    const currentMonth = format(new Date(), 'yyyy-MM');
    const thisMonthContributions = contributionsData.filter(contribution => {
      const contributionMonth = format(new Date(contribution.timestamp?.seconds * 1000), 'yyyy-MM');
      return contributionMonth === currentMonth;
    });
    const thisMonthTotal = thisMonthContributions.reduce((sum, contribution) => sum + contribution.amount, 0);
    const expectedThisMonth = flatmates.length * 10;
    const stillOwedThisMonth = expectedThisMonth - thisMonthTotal;

    return {
      totalBalance: balance,
      thisMonthCollected: thisMonthTotal,
      thisMonthExpected: expectedThisMonth,
      thisMonthOwed: stillOwedThisMonth
    };
  };

  // Calculate consumption cost vs income analysis
  const getConsumptionAnalysis = () => {
    // Group consumption settlements by month
    const monthlyConsumption = {};
    
    consumptionSettlements.forEach(settlement => {
      const monthKey = format(settlement.date, 'yyyy-MM');
      if (!monthlyConsumption[monthKey]) {
        monthlyConsumption[monthKey] = {
          month: format(settlement.date, 'MMM yyyy'),
          totalCost: 0,
          totalIncome: 0,
          settlements: 0,
          coffee: 0,
          beer: 0,
          seltzer: 0
        };
      }
      
      monthlyConsumption[monthKey].totalCost += settlement.totalCost;
      monthlyConsumption[monthKey].totalIncome += settlement.totalCost; // Income equals cost in settlements
      monthlyConsumption[monthKey].settlements += 1;
      monthlyConsumption[monthKey][settlement.type] += settlement.totalCost;
    });

    // Get last 6 months
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5);
    const months = eachMonthOfInterval({
      start: sixMonthsAgo,
      end: now
    });

    return months.map(month => {
      const monthKey = format(month, 'yyyy-MM');
      const data = monthlyConsumption[monthKey] || {
        month: format(month, 'MMM yyyy'),
        totalCost: 0,
        totalIncome: 0,
        settlements: 0,
        coffee: 0,
        beer: 0,
        seltzer: 0
      };
      return data;
    });
  };

  // Calculate profit analysis for consumptions
  const getProfitAnalysis = () => {
    let totalRevenue = 0;
    const profitByType = {
      coffee: { actualCost: 0, revenue: 0, profit: 0, margin: 0 },
      beer: { actualCost: 0, revenue: 0, profit: 0, margin: 0 },
      seltzer: { actualCost: 0, revenue: 0, profit: 0, margin: 0 }
    };

    // Calculate actual costs from expenses in consumption categories
    expenses.forEach(expense => {
      if (expense.category === 'coffee' && profitByType.coffee) {
        profitByType.coffee.actualCost += expense.amount;
      } else if (expense.category === 'beer' && profitByType.beer) {
        profitByType.beer.actualCost += expense.amount;
      } else if (expense.category === 'seltzer' && profitByType.seltzer) {
        profitByType.seltzer.actualCost += expense.amount;
      }
    });

    // Calculate revenue from consumption settlements
    consumptionSettlements.forEach(settlement => {
      const totalUnits = Object.values(settlement.consumptionData || {}).reduce((sum, count) => sum + count, 0);
      const revenue = totalUnits * settlement.costPerUnit;

      totalRevenue += revenue;

      if (profitByType[settlement.type]) {
        profitByType[settlement.type].revenue += revenue;
      }
    });

    // Calculate total actual costs
    const totalActualCost = Object.values(profitByType).reduce((sum, data) => sum + data.actualCost, 0);

    // Calculate profit and margins
    const totalProfit = totalRevenue - totalActualCost;
    const totalMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    Object.keys(profitByType).forEach(type => {
      const data = profitByType[type];
      data.profit = data.revenue - data.actualCost;
      data.margin = data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0;
    });

    return {
      totalActualCost,
      totalRevenue,
      totalProfit,
      totalMargin,
      profitByType,
      status: totalProfit > 0 ? 'profit' : totalProfit < 0 ? 'loss' : 'break-even'
    };
  };

  // Calculate monthly profit trends
  const getMonthlyProfitTrends = () => {
    const monthlyProfit = {};
    
    // Initialize months with expense data
    expenses.forEach(expense => {
      if (['coffee', 'beer', 'seltzer'].includes(expense.category)) {
        const expenseDate = new Date(expense.timestamp?.seconds * 1000);
        const monthKey = format(expenseDate, 'yyyy-MM');
        
        if (!monthlyProfit[monthKey]) {
          monthlyProfit[monthKey] = {
            month: format(expenseDate, 'MMM yyyy'),
            actualCost: 0,
            revenue: 0,
            profit: 0,
            margin: 0
          };
        }
        
        monthlyProfit[monthKey].actualCost += expense.amount;
      }
    });
    
    // Add revenue from consumption settlements
    consumptionSettlements.forEach(settlement => {
      const monthKey = format(settlement.date, 'yyyy-MM');
      
      if (!monthlyProfit[monthKey]) {
        monthlyProfit[monthKey] = {
          month: format(settlement.date, 'MMM yyyy'),
          actualCost: 0,
          revenue: 0,
          profit: 0,
          margin: 0
        };
      }
      
      const totalUnits = Object.values(settlement.consumptionData || {}).reduce((sum, count) => sum + count, 0);
      const revenue = totalUnits * settlement.costPerUnit;
      
      monthlyProfit[monthKey].revenue += revenue;
    });

    // Calculate profit and margin for each month
    Object.values(monthlyProfit).forEach(monthData => {
      monthData.profit = monthData.revenue - monthData.actualCost;
      monthData.margin = monthData.revenue > 0 ? (monthData.profit / monthData.revenue) * 100 : 0;
    });

    // Get last 6 months
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5);
    const months = eachMonthOfInterval({
      start: sixMonthsAgo,
      end: now
    });

    return months.map(month => {
      const monthKey = format(month, 'yyyy-MM');
      return monthlyProfit[monthKey] || {
        month: format(month, 'MMM yyyy'),
        actualCost: 0,
        revenue: 0,
        profit: 0,
        margin: 0
      };
    });
  };

  // Calculate profit by consumption type for pie chart
  const getProfitByType = () => {
    const profitAnalysis = getProfitAnalysis();
    const typeLabels = {
      coffee: '☕ Coffee',
      beer: '🍺 Beer', 
      seltzer: '🥤 Seltzer'
    };

    return Object.entries(profitAnalysis.profitByType)
      .map(([type, data], index) => ({
        name: typeLabels[type],
        value: Math.max(0, data.profit), // Only show positive profits in pie chart
        profit: data.profit,
        margin: data.margin,
        color: COLORS[index % COLORS.length]
      }))
      .filter(item => item.value > 0);
  };

  // Calculate consumption by type
  const getConsumptionByType = () => {
    const typeData = {
      coffee: { name: '☕ Coffee', value: 0, color: '#F59E0B' },
      beer: { name: '🍺 Beer', value: 0, color: '#EAB308' },
      seltzer: { name: '🥤 Seltzer', value: 0, color: '#14B8A6' }
    };

    consumptionSettlements.forEach(settlement => {
      if (typeData[settlement.type]) {
        typeData[settlement.type].value += settlement.totalCost;
      }
    });

    return Object.values(typeData).filter(item => item.value > 0);
  };

  // Calculate consumption settlements over time (each settlement as a data point)
  const getConsumptionSettlementsOverTime = () => {
    return consumptionSettlements
      .sort((a, b) => a.date - b.date)
      .map((settlement, index) => ({
        settlement: `Settlement ${index + 1}`,
        date: format(settlement.date, 'MMM dd'),
        cost: settlement.totalCost,
        income: settlement.totalCost, // Income equals cost
        type: settlement.type,
        typeLabel: settlement.type === 'coffee' ? '☕' : settlement.type === 'beer' ? '🍺' : '🥤'
      }));
  };

  // Calculate individual consumption costs
  const getIndividualConsumptionCosts = () => {
    const individualCosts = {};
    
    flatmates.forEach(flatmate => {
      individualCosts[flatmate.name] = {
        name: flatmate.name,
        coffee: 0,
        beer: 0,
        seltzer: 0,
        total: 0
      };
    });

    consumptionSettlements.forEach(settlement => {
      Object.entries(settlement.consumptionData || {}).forEach(([name, count]) => {
        if (individualCosts[name]) {
          const cost = count * settlement.costPerUnit;
          individualCosts[name][settlement.type] += cost;
          individualCosts[name].total += cost;
        }
      });
    });

    return Object.values(individualCosts);
  };

  const categoryData = getCategoryData();
  const spendingByPerson = getSpendingByPerson();
  const monthlyTrends = getMonthlyTrends();
  const weeklyTrends = getWeeklyTrends();
  const stats = getSummaryStats();
  const monthlyContributions = getMonthlyContributionData();
  const bankStatus = getBankAccountStatus();
  
  // Consumption data
  const consumptionAnalysis = getConsumptionAnalysis();
  const consumptionByType = getConsumptionByType();
  const consumptionSettlementsOverTime = getConsumptionSettlementsOverTime();
  const individualConsumptionCosts = getIndividualConsumptionCosts();
  
  // Profit analysis data
  const profitAnalysis = getProfitAnalysis();
  const monthlyProfitTrends = getMonthlyProfitTrends();
  const profitByType = getProfitByType();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: €{entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Data Yet</h3>
        <p className="text-gray-500">Add some expenses to see analytics and insights!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
          <h3 className="text-sm font-medium opacity-90">Total Spent</h3>
          <p className="text-2xl font-bold">€{stats.totalSpent.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
          <h3 className="text-sm font-medium opacity-90">Bank Balance</h3>
          <p className="text-2xl font-bold">€{bankStatus.totalBalance.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
          <h3 className="text-sm font-medium opacity-90">This Month Collected</h3>
          <p className="text-2xl font-bold">€{bankStatus.thisMonthCollected.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg">
          <h3 className="text-sm font-medium opacity-90">Still Owed</h3>
          <p className="text-2xl font-bold">€{bankStatus.thisMonthOwed.toFixed(2)}</p>
        </div>
      </div>

      {/* Monthly Contributions Status */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">
          💰 Monthly Contributions - {format(new Date(), 'MMMM yyyy')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {monthlyContributions.map((contribution) => (
            <div 
              key={contribution.name} 
              className={`p-4 rounded-lg border-2 ${
                contribution.paid 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-800">{contribution.name}</h4>
                <span className={`text-2xl ${contribution.paid ? '✅' : '❌'}`}>
                  {contribution.paid ? '✅' : '❌'}
                </span>
              </div>
              <div className="text-sm">
                <p className={`font-medium ${contribution.paid ? 'text-green-600' : 'text-red-600'}`}>
                  {contribution.paid ? 'Paid' : 'Not Paid'}
                </p>
                {contribution.owed > 0 && (
                  <p className="text-red-600">
                    Still owes: €{contribution.owed.toFixed(2)}
                  </p>
                )}
                {contribution.paid && (
                  <p className="text-green-600">
                    Contributed: €{contribution.amount.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Expected</p>
              <p className="text-lg font-bold text-gray-800">€{bankStatus.thisMonthExpected.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Collected</p>
              <p className="text-lg font-bold text-green-600">€{bankStatus.thisMonthCollected.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Still Owed</p>
              <p className="text-lg font-bold text-red-600">€{bankStatus.thisMonthOwed.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bank Balance</p>
              <p className={`text-lg font-bold ${bankStatus.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                €{bankStatus.totalBalance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Spending by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `€${value.toFixed(0)}`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`€${value.toFixed(2)}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {categoryData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
                <span className="text-sm font-medium">€{item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Spending by Person */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Spending by Person</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendingByPerson}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Trends */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Monthly Spending Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Trends (Current Month) */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">
            Weekly Trends - {format(new Date(), 'MMMM yyyy')}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Consumption Analytics */}
      {consumptionSettlements.length > 0 && (
        <>
          {/* Consumption Summary Cards */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">🍺☕🥤 Consumption Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 rounded-lg">
                <h4 className="text-sm font-medium opacity-90">Total Consumption Cost</h4>
                <p className="text-xl font-bold">
                  €{consumptionSettlements.reduce((sum, s) => sum + s.totalCost, 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-4 rounded-lg">
                <h4 className="text-sm font-medium opacity-90">Total Settlements</h4>
                <p className="text-xl font-bold">{consumptionSettlements.length}</p>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-4 rounded-lg">
                <h4 className="text-sm font-medium opacity-90">Avg Settlement</h4>
                <p className="text-xl font-bold">
                  €{(consumptionSettlements.reduce((sum, s) => sum + s.totalCost, 0) / consumptionSettlements.length).toFixed(2)}
                </p>
              </div>
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4 rounded-lg">
                <h4 className="text-sm font-medium opacity-90">Most Recent</h4>
                <p className="text-xl font-bold">
                  {consumptionSettlements.length > 0 ? 
                    format(consumptionSettlements[0].date, 'MMM dd') : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Consumption by Type */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Consumption by Type</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={consumptionByType}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `€${value.toFixed(0)}`}
                    >
                      {consumptionByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`€${value.toFixed(2)}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {consumptionByType.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">€{item.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Consumption Costs */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Individual Consumption Costs</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={individualConsumptionCosts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
                              <p className="font-medium">{label}</p>
                              {payload.map((entry, index) => (
                                <p key={index} style={{ color: entry.color }}>
                                  {entry.dataKey === 'coffee' ? '☕ Coffee' : 
                                   entry.dataKey === 'beer' ? '🍺 Beer' : 
                                   entry.dataKey === 'seltzer' ? '🥤 Seltzer' : entry.dataKey}: €{entry.value.toFixed(2)}
                                </p>
                              ))}
                              <p className="font-semibold border-t pt-1 mt-1">
                                Total: €{payload.reduce((sum, entry) => sum + entry.value, 0).toFixed(2)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="coffee" stackId="consumption" fill="#F59E0B" name="☕ Coffee" />
                    <Bar dataKey="beer" stackId="consumption" fill="#EAB308" name="🍺 Beer" />
                    <Bar dataKey="seltzer" stackId="consumption" fill="#14B8A6" name="🥤 Seltzer" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600 text-center mb-3">
                  Individual consumption costs by type across all settlements
                </p>
                <div className="flex justify-center space-x-6">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                    <span className="text-sm text-gray-600">☕ Coffee</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                    <span className="text-sm text-gray-600">🍺 Beer</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-teal-500 mr-2"></div>
                    <span className="text-sm text-gray-600">🥤 Seltzer</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Consumption Trends */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Monthly Consumption Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={consumptionAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="totalCost" 
                      stroke="#F59E0B" 
                      strokeWidth={3}
                      dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Settlement Timeline */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Settlement Timeline</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={consumptionSettlementsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
                              <p className="font-medium">{data.settlement}</p>
                              <p className="text-sm text-gray-600">{data.date}</p>
                              <p style={{ color: payload[0].color }}>
                                {data.typeLabel} Cost: €{data.cost.toFixed(2)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="cost" 
                      fill="#14B8A6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Profit Analysis */}
      {consumptionSettlements.length > 0 && (
        <>
          {/* Profit Overview Cards */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">💰 Smart Profit Analysis</h3>
            
            {/* Explanation */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <span className="text-blue-500 mr-2">ℹ️</span>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">How Profit is Calculated:</p>
                  <p><strong>Actual Costs:</strong> Sum of all expenses in Coffee, Beer, and Seltzer categories</p>
                  <p><strong>Revenue:</strong> What flatmates pay for their consumption (units × price per unit)</p>
                  <p><strong>Profit:</strong> Revenue - Actual Costs</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`text-white p-4 rounded-lg ${
                profitAnalysis.status === 'profit' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                profitAnalysis.status === 'loss' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                'bg-gradient-to-r from-gray-500 to-gray-600'
              }`}>
                <h4 className="text-sm font-medium opacity-90">Total Profit</h4>
                <div className="flex items-center">
                  <span className="text-xl font-bold">€{profitAnalysis.totalProfit.toFixed(2)}</span>
                  <span className="ml-2 text-sm opacity-75">
                    {profitAnalysis.status === 'profit' ? '📈' : 
                     profitAnalysis.status === 'loss' ? '📉' : '⚖️'}
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                <h4 className="text-sm font-medium opacity-90">Profit Margin</h4>
                <p className="text-xl font-bold">{profitAnalysis.totalMargin.toFixed(1)}%</p>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                <h4 className="text-sm font-medium opacity-90">Total Revenue</h4>
                <p className="text-xl font-bold">€{profitAnalysis.totalRevenue.toFixed(2)}</p>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
                <h4 className="text-sm font-medium opacity-90">Actual Costs</h4>
                <p className="text-xl font-bold">€{profitAnalysis.totalActualCost.toFixed(2)}</p>
              </div>
            </div>

            {/* Profit Status Message */}
            <div className={`mt-4 p-4 rounded-lg ${
              profitAnalysis.status === 'profit' ? 'bg-green-50 border border-green-200' :
              profitAnalysis.status === 'loss' ? 'bg-red-50 border border-red-200' :
              'bg-gray-50 border border-gray-200'
            }`}>
              <div className="flex items-center">
                <span className="text-2xl mr-3">
                  {profitAnalysis.status === 'profit' ? '🎉' : 
                   profitAnalysis.status === 'loss' ? '⚠️' : 'ℹ️'}
                </span>
                <div>
                  <h4 className={`font-semibold ${
                    profitAnalysis.status === 'profit' ? 'text-green-800' :
                    profitAnalysis.status === 'loss' ? 'text-red-800' :
                    'text-gray-800'
                  }`}>
                    {profitAnalysis.status === 'profit' ? 'You\'re Making Money! 💰' :
                     profitAnalysis.status === 'loss' ? 'You\'re Losing Money 📉' :
                     'Breaking Even ⚖️'}
                  </h4>
                  <p className={`text-sm ${
                    profitAnalysis.status === 'profit' ? 'text-green-600' :
                    profitAnalysis.status === 'loss' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {profitAnalysis.status === 'profit' ? 
                      `You're earning €${profitAnalysis.totalProfit.toFixed(2)} profit from consumption sales with a ${profitAnalysis.totalMargin.toFixed(1)}% margin.` :
                     profitAnalysis.status === 'loss' ?
                      `You're losing €${Math.abs(profitAnalysis.totalProfit).toFixed(2)} on consumption sales. Consider adjusting your prices.` :
                      'Your consumption sales are breaking even. You\'re covering costs but not making profit.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Profit Trends */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Monthly Profit Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyProfitTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
                              <p className="font-medium">{label}</p>
                              <p className="text-sm text-gray-600">Revenue: €{data.revenue.toFixed(2)}</p>
                              <p className="text-sm text-gray-600">Costs: €{data.actualCost.toFixed(2)}</p>
                              <p className={`text-sm font-medium ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                Profit: €{data.profit.toFixed(2)} ({data.margin.toFixed(1)}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Profit by Type */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Profit by Consumption Type</h3>
              <div className="space-y-4">
                {Object.entries(profitAnalysis.profitByType).map(([type, data]) => {
                  const typeLabels = {
                    coffee: { name: '☕ Coffee', color: 'bg-amber-500' },
                    beer: { name: '🍺 Beer', color: 'bg-yellow-500' },
                    seltzer: { name: '🥤 Seltzer', color: 'bg-teal-500' }
                  };
                  const typeInfo = typeLabels[type];
                  
                  return (
                    <div key={type} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-700">{typeInfo.name}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          data.profit >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {data.profit >= 0 ? '+' : ''}€{data.profit.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Revenue:</span>
                          <span>€{data.revenue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Costs:</span>
                          <span>€{data.actualCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Margin:</span>
                          <span className={data.margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {data.margin.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Insights */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">💡 Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryData.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800">Top Category</h4>
              <p className="text-sm text-blue-600">
                Most spending: {categoryData.sort((a, b) => b.value - a.value)[0]?.name} 
                (€{categoryData.sort((a, b) => b.value - a.value)[0]?.value.toFixed(2)})
              </p>
            </div>
          )}
          
          {spendingByPerson.length > 0 && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800">Biggest Spender</h4>
              <p className="text-sm text-green-600">
                {spendingByPerson.sort((a, b) => b.amount - a.amount)[0]?.name} 
                (€{spendingByPerson.sort((a, b) => b.amount - a.amount)[0]?.amount})
              </p>
            </div>
          )}
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-800">Largest Single Expense</h4>
            <p className="text-sm text-purple-600">
              €{stats.largestExpense.toFixed(2)}
            </p>
          </div>

          {/* Consumption Insights */}
          {consumptionSettlements.length > 0 && (
            <>
              <div className="p-4 bg-amber-50 rounded-lg">
                <h4 className="font-medium text-amber-800">Top Consumption Type</h4>
                <p className="text-sm text-amber-600">
                  {consumptionByType.length > 0 && 
                    `${consumptionByType.sort((a, b) => b.value - a.value)[0]?.name} 
                    (€${consumptionByType.sort((a, b) => b.value - a.value)[0]?.value.toFixed(2)})`
                  }
                </p>
              </div>

              <div className="p-4 bg-teal-50 rounded-lg">
                <h4 className="font-medium text-teal-800">Biggest Consumer</h4>
                <p className="text-sm text-teal-600">
                  {individualConsumptionCosts.length > 0 &&
                    `${individualConsumptionCosts.sort((a, b) => b.total - a.total)[0]?.name}
                    (€${individualConsumptionCosts.sort((a, b) => b.total - a.total)[0]?.total.toFixed(2)})`
                  }
                </p>
              </div>

              {/* Profit Insights */}
              <div className={`p-4 rounded-lg ${
                profitAnalysis.status === 'profit' ? 'bg-green-50' :
                profitAnalysis.status === 'loss' ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                <h4 className={`font-medium ${
                  profitAnalysis.status === 'profit' ? 'text-green-800' :
                  profitAnalysis.status === 'loss' ? 'text-red-800' : 'text-gray-800'
                }`}>
                  Profit Status
                </h4>
                <p className={`text-sm ${
                  profitAnalysis.status === 'profit' ? 'text-green-600' :
                  profitAnalysis.status === 'loss' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {profitAnalysis.status === 'profit' ? 
                    `Making €${profitAnalysis.totalProfit.toFixed(2)} profit (${profitAnalysis.totalMargin.toFixed(1)}% margin)` :
                   profitAnalysis.status === 'loss' ?
                    `Losing €${Math.abs(profitAnalysis.totalProfit).toFixed(2)} on sales` :
                    'Breaking even on consumption sales'}
                </p>
              </div>

              <div className="p-4 bg-indigo-50 rounded-lg">
                <h4 className="font-medium text-indigo-800">Best Profit Margin</h4>
                <p className="text-sm text-indigo-600">
                  {(() => {
                    const bestType = Object.entries(profitAnalysis.profitByType)
                      .sort((a, b) => b[1].margin - a[1].margin)[0];
                    const typeLabels = { coffee: '☕ Coffee', beer: '🍺 Beer', seltzer: '🥤 Seltzer' };
                    return bestType ? 
                      `${typeLabels[bestType[0]]}: ${bestType[1].margin.toFixed(1)}%` : 
                      'No data yet';
                  })()}
                </p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800">Most Recent Settlement</h4>
                <p className="text-sm text-yellow-600">
                  {consumptionSettlements.length > 0 &&
                    `€${consumptionSettlements[0].totalCost.toFixed(2)} on ${format(consumptionSettlements[0].date, 'MMM dd')}`
                  }
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
