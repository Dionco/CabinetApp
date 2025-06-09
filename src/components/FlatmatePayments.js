import React, { useState, useEffect } from 'react';
import { format, isWithinInterval, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const FlatmatePayments = ({ flatmates, monthlyContributions, expenses }) => {
  const [paymentMatrix, setPaymentMatrix] = useState({});
  const [debtData, setDebtData] = useState({});
  const [requiredAmount, setRequiredAmount] = useState(10);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'heatmap'
  const [tooltipData, setTooltipData] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Generate last 12 months for display (most recent first)
  const months = React.useMemo(() => {
    const monthsArray = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = subMonths(currentDate, i);
      monthsArray.push({
        key: format(date, 'yyyy-MM'),
        label: format(date, 'MMM'),
        fullLabel: format(date, 'MMMM yyyy'),
        date: date
      });
    }
    
    return monthsArray;
  }, []); // Empty dependency array since we want current 12 months

  // Calculate payment status for all flatmates across all months
  const calculatePaymentMatrix = React.useCallback(() => {
    if (!flatmates || flatmates.length === 0) {
      setPaymentMatrix({});
      setDebtData({});
      return;
    }

    const matrix = {};
    const debts = {};

    flatmates.forEach(flatmate => {
      matrix[flatmate.name] = {};
      debts[flatmate.name] = 0;

      months.forEach(month => {
        const monthStart = startOfMonth(new Date(month.key + '-01'));
        const monthEnd = endOfMonth(new Date(month.key + '-01'));

        // Find all payments for this flatmate in this month
        const monthlyPayments = monthlyContributions.filter(contribution => {
          const contributionDate = contribution.timestamp?.seconds 
            ? new Date(contribution.timestamp.seconds * 1000)
            : new Date(contribution.timestamp);
          
          // Match by name or month field for CSV imports
          const nameMatch = contribution.flatmate === flatmate.name || 
                           contribution.description?.toLowerCase().includes(flatmate.name.toLowerCase());
          
          const dateMatch = isWithinInterval(contributionDate, { start: monthStart, end: monthEnd }) ||
                           contribution.month === month.key;
          
          return nameMatch && dateMatch;
        });

        const totalPaid = monthlyPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        
        let status = 'unpaid';
        let statusColor = 'bg-red-100 border-red-200 text-red-800';
        let statusIcon = '❌';
        
        if (totalPaid >= requiredAmount) {
          status = 'paid';
          statusColor = 'bg-green-100 border-green-200 text-green-800';
          statusIcon = '✅';
        } else if (totalPaid > 0) {
          status = 'partial';
          statusColor = 'bg-yellow-100 border-yellow-200 text-yellow-800';
          statusIcon = '⚠️';
        }        // Calculate debt for unpaid/partial months
        const amountOwed = Math.max(0, requiredAmount - totalPaid);
        debts[flatmate.name] += amountOwed;

        matrix[flatmate.name][month.key] = {
          status,
          statusColor,
          statusIcon,
          totalPaid,
          amountOwed,
          requiredAmount,
          payments: monthlyPayments,
          paymentDate: monthlyPayments.length > 0 ? 
            (monthlyPayments[0].timestamp?.seconds 
              ? new Date(monthlyPayments[0].timestamp.seconds * 1000)
              : new Date(monthlyPayments[0].timestamp)) : null
        };
      });
    });

    setPaymentMatrix(matrix);
    setDebtData(debts);
  }, [flatmates, monthlyContributions, requiredAmount, months]);

  useEffect(() => {
    calculatePaymentMatrix();
  }, [calculatePaymentMatrix]);

  // Handle cell hover for tooltips
  const handleCellHover = (flatmate, month, event) => {
    const cellData = paymentMatrix[flatmate]?.[month.key];
    if (!cellData) return;

    setTooltipData({
      flatmate,
      month: month.fullLabel,
      ...cellData,
      x: event.clientX,
      y: event.clientY
    });
    setShowTooltip(true);
  };

  const handleCellLeave = () => {
    setShowTooltip(false);
    setTooltipData(null);
  };

  // Get status badge component
  const StatusBadge = ({ cellData, isCompact = false }) => {
    if (!cellData) return <span className="text-gray-400">-</span>;

    const { status, statusColor, statusIcon } = cellData;
    
    if (isCompact) {
      return (
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${statusColor}`}>
          {statusIcon}
        </div>
      );
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
        <span className="mr-1">{statusIcon}</span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Calculate totals
  const totalDebt = Object.values(debtData).reduce((sum, debt) => sum + debt, 0);
  const totalExpected = flatmates.length * requiredAmount * months.length;
  const totalPaid = Object.values(paymentMatrix).reduce((sum, flatmate) => 
    sum + Object.values(flatmate).reduce((fSum, month) => fSum + month.totalPaid, 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              💳 Monthly Payment Tracker
            </h2>
            <p className="text-gray-600">
              Track payment status across all months with detailed debt tracking
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* View Mode Toggle */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">View Mode</label>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'table' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📊 Table
                </button>
                <button
                  onClick={() => setViewMode('heatmap')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'heatmap' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🗓️ Heatmap
                </button>
              </div>
            </div>

            {/* Required Amount Selector */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Required Amount</label>
              <select
                value={requiredAmount}
                onChange={(e) => setRequiredAmount(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={5}>€5.00</option>
                <option value={10}>€10.00</option>
                <option value={15}>€15.00</option>
                <option value={20}>€20.00</option>
                <option value={25}>€25.00</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">
            €{totalPaid.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Total Collected</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-800">
            €{totalExpected.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Total Expected</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className={`text-2xl font-bold ${totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
            €{totalDebt.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Total Outstanding Debt</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-purple-600">
            {((totalPaid / totalExpected) * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Payment Rate</div>
        </div>
      </div>

      {/* Monthly Payment Table */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Monthly Payment Status (Last 12 Months)
            </h3>
          </div>

          {flatmates.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Flatmates Added</h3>
              <p className="text-gray-500">
                Add flatmates first to start tracking their monthly payments.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                      Flatmate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-red-50 sticky left-[120px] z-10">
                      Total Debt
                    </th>
                    {months.map(month => (
                      <th key={month.key} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                        <div>{month.label}</div>
                        <div className="text-xs text-gray-400 normal-case">
                          {format(month.date, 'yyyy')}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {flatmates.map((flatmate) => (
                    <tr key={flatmate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-200">
                        <div className="text-sm font-medium text-gray-900">
                          {flatmate.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap bg-red-50 sticky left-[120px] z-10 border-r border-gray-200">
                        <div className={`text-sm font-bold ${
                          debtData[flatmate.name] > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          €{(debtData[flatmate.name] || 0).toFixed(2)}
                        </div>
                      </td>
                      {months.map(month => {
                        const cellData = paymentMatrix[flatmate.name]?.[month.key];
                        return (
                          <td 
                            key={month.key} 
                            className="px-3 py-4 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                            onMouseEnter={(e) => handleCellHover(flatmate.name, month, e)}
                            onMouseLeave={handleCellLeave}
                          >
                            <StatusBadge cellData={cellData} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Heatmap View */}
      {viewMode === 'heatmap' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Payment Status Heatmap
            </h3>
            <p className="text-sm text-gray-600">
              Visual overview of payment patterns across all flatmates and months
            </p>
          </div>

          {flatmates.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Data Available</h3>
              <p className="text-gray-500">Add flatmates to see the payment heatmap.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="text-gray-600 font-medium">Legend:</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-100 border-2 border-green-200 flex items-center justify-center text-xs">✅</div>
                  <span>Paid</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-yellow-100 border-2 border-yellow-200 flex items-center justify-center text-xs">⚠️</div>
                  <span>Partial</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-100 border-2 border-red-200 flex items-center justify-center text-xs">❌</div>
                  <span>Unpaid</span>
                </div>
              </div>

              {/* Heatmap Grid */}
              <div className="space-y-4">
                {flatmates.map((flatmate) => (
                  <div key={flatmate.id} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium text-gray-700 truncate">
                      {flatmate.name}
                    </div>
                    <div className="flex gap-1 flex-1">
                      {months.map(month => {
                        const cellData = paymentMatrix[flatmate.name]?.[month.key];
                        return (
                          <div
                            key={month.key}
                            className="relative group cursor-pointer"
                            onMouseEnter={(e) => handleCellHover(flatmate.name, month, e)}
                            onMouseLeave={handleCellLeave}
                          >
                            <StatusBadge cellData={cellData} isCompact={true} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="w-20 text-right">
                      <span className={`text-sm font-bold ${
                        debtData[flatmate.name] > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        €{(debtData[flatmate.name] || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Month Labels */}
              <div className="flex items-center gap-4 mt-4 pt-2 border-t border-gray-200">
                <div className="w-24"></div>
                <div className="flex gap-1 flex-1">
                  {months.map(month => (
                    <div key={month.key} className="w-6 text-xs text-gray-500 text-center">
                      {month.label.substring(0, 1)}
                    </div>
                  ))}
                </div>
                <div className="w-20 text-xs text-gray-500 text-right">Debt</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && tooltipData && (
        <div
          className="fixed z-50 bg-gray-900 text-white p-3 rounded-lg shadow-lg pointer-events-none text-sm max-w-xs"
          style={{
            left: tooltipData.x + 10,
            top: tooltipData.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="font-medium">{tooltipData.flatmate}</div>
          <div className="text-gray-300">{tooltipData.month}</div>
          <div className="mt-2 space-y-1">
            <div>Status: <span className={`font-medium ${
              tooltipData.status === 'paid' ? 'text-green-400' :
              tooltipData.status === 'partial' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {tooltipData.status.charAt(0).toUpperCase() + tooltipData.status.slice(1)}
            </span></div>
            <div>Paid: €{tooltipData.totalPaid.toFixed(2)}</div>
            <div>Required: €{tooltipData.requiredAmount.toFixed(2)}</div>
            {tooltipData.amountOwed > 0 && (
              <div>Owed: <span className="text-red-400">€{tooltipData.amountOwed.toFixed(2)}</span></div>
            )}
            {tooltipData.paymentDate && (
              <div>Date: {format(tooltipData.paymentDate, 'MMM dd, yyyy')}</div>
            )}
            {tooltipData.payments.length > 1 && (
              <div>Payments: {tooltipData.payments.length} transactions</div>
            )}
          </div>
        </div>
      )}

      {/* Debt Summary */}
      {Object.values(debtData).some(debt => debt > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h4 className="text-lg font-medium text-red-900 mb-3">
            💸 Outstanding Debts
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(debtData)
              .filter(([_, debt]) => debt > 0)
              .map(([flatmate, debt]) => (
                <div key={flatmate} className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="font-medium text-gray-900">{flatmate}</div>
                  <div className="text-2xl font-bold text-red-600">€{debt.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">
                    {Math.ceil(debt / requiredAmount)} months behind
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="text-lg font-medium text-blue-900 mb-3">
          📝 How to Use Payment Tracker
        </h4>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• <strong>Table View:</strong> Detailed monthly breakdown with payment status for each flatmate</p>
          <p>• <strong>Heatmap View:</strong> Visual overview showing payment patterns at a glance</p>
          <p>• <strong>Hover for Details:</strong> Mouse over any cell to see payment details and dates</p>
          <p>• <strong>Debt Tracking:</strong> Total debt column shows accumulated unpaid amounts</p>
          <p>• <strong>Data Sources:</strong> Payments detected from manual entries and CSV bank imports</p>
          <p>• <strong>Status Colors:</strong> Green (paid), Yellow (partial), Red (unpaid)</p>
        </div>
      </div>
    </div>
  );
};

export default FlatmatePayments;
