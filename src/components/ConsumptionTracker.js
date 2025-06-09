import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import PermissionWrapper from './PermissionWrapper';

// Consumption types configuration (moved outside component since it's static)
const consumptionTypes = {
  coffee: {
    label: '☕ Coffee',
    color: 'bg-amber-100 text-amber-800',
    defaultCostPerUnit: 0.50,
    unit: 'cup'
  },
  beer: {
    label: '🍺 Beer',
    color: 'bg-yellow-100 text-yellow-800',
    defaultCostPerUnit: 1.50,
    unit: 'bottle'
  },
  seltzer: {
    label: '🥤 Seltzer',
    color: 'bg-teal-100 text-teal-800',
    defaultCostPerUnit: 1.00,
    unit: 'bottle'
  }
};

const ConsumptionTracker = ({ 
  flatmates, 
  consumptionSettlements: consumptionSettlementsFromProps, 
  settlementPayments, 
  toggleSettlementPayment, 
  currentUser, 
  hasPermission, 
  PERMISSIONS 
}) => {
  // Use settlements from props, fallback to local state for compatibility
  const [localConsumptionSettlements, setLocalConsumptionSettlements] = useState([]);
  const consumptionSettlements = consumptionSettlementsFromProps || localConsumptionSettlements;
  const [loading, setLoading] = useState(!consumptionSettlementsFromProps);
  const [showNewSettlement, setShowNewSettlement] = useState(false);
  
  // Form state for new settlement
  const [settlementType, setSettlementType] = useState('coffee'); // 'coffee' or 'beer'
  const [totalCost, setTotalCost] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [consumptionData, setConsumptionData] = useState({});
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Fetch consumption settlements (only used if not provided via props)
  const fetchConsumptionSettlements = useCallback(async () => {
    if (consumptionSettlementsFromProps) {
      setLoading(false);
      return;
    }
    
    try {
      const q = query(collection(db, 'consumptionSettlements'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const settlements = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
      }));
      setLocalConsumptionSettlements(settlements);
    } catch (error) {
      console.error('Error fetching consumption settlements:', error);
    } finally {
      setLoading(false);
    }
  }, [consumptionSettlementsFromProps]);

  // Initialize consumption data for all flatmates
  const initializeConsumptionData = useCallback(() => {
    const initialData = {};
    flatmates.forEach(flatmate => {
      initialData[flatmate.name] = 0;
    });
    setConsumptionData(initialData);
  }, [flatmates]);

  // Update consumption count for a flatmate
  const updateConsumption = (flatmateName, value) => {
    setConsumptionData(prev => ({
      ...prev,
      [flatmateName]: Math.max(0, parseInt(value) || 0)
    }));
  };

  // Calculate totals
  const getTotalConsumptions = () => {
    return Object.values(consumptionData).reduce((sum, count) => sum + count, 0);
  };

  const getCalculatedCostPerUnit = () => {
    const totalConsumptions = getTotalConsumptions();
    if (totalConsumptions === 0 || !totalCost) return 0;
    return parseFloat(totalCost) / totalConsumptions;
  };

  const getIndividualCost = (flatmateName) => {
    const count = consumptionData[flatmateName] || 0;
    const unitCost = costPerUnit ? parseFloat(costPerUnit) : getCalculatedCostPerUnit();
    return count * unitCost;
  };

  const getTotalCalculatedCost = () => {
    return Object.keys(consumptionData).reduce((sum, flatmateName) => {
      return sum + getIndividualCost(flatmateName);
    }, 0);
  };

  // Add new settlement
  const addSettlement = async () => {
    if (!totalCost && !costPerUnit) {
      alert('Please enter either total cost or cost per unit');
      return;
    }

    if (getTotalConsumptions() === 0) {
      alert('Please enter consumption data for at least one person');
      return;
    }

    try {
      const settlement = {
        type: settlementType,
        date: new Date(settlementDate),
        totalCost: parseFloat(totalCost) || getTotalCalculatedCost(),
        costPerUnit: parseFloat(costPerUnit) || getCalculatedCostPerUnit(),
        consumptionData: { ...consumptionData },
        totalConsumptions: getTotalConsumptions(),
        notes: notes.trim(),
        createdAt: new Date()
      };

      await addDoc(collection(db, 'consumptionSettlements'), settlement);
      
      // Reset form
      setTotalCost('');
      setCostPerUnit('');
      setConsumptionData({});
      setNotes('');
      setShowNewSettlement(false);
      
      // Refresh data - only if using local state
      if (!consumptionSettlementsFromProps) {
        await fetchConsumptionSettlements();
      }
      
    } catch (error) {
      console.error('Error adding settlement:', error);
      alert('Error adding settlement. Please try again.');
    }
  };

  // Delete settlement
  const deleteSettlement = async (settlementId) => {
    if (window.confirm('Are you sure you want to delete this settlement?')) {
      try {
        await deleteDoc(doc(db, 'consumptionSettlements', settlementId));
        // Refresh data - only if using local state  
        if (!consumptionSettlementsFromProps) {
          await fetchConsumptionSettlements();
        }
      } catch (error) {
        console.error('Error deleting settlement:', error);
        alert('Error deleting settlement. Please try again.');
      }
    }
  };

  // Set default cost per unit when type changes
  useEffect(() => {
    setCostPerUnit(consumptionTypes[settlementType].defaultCostPerUnit.toString());
  }, [settlementType]); // consumptionTypes is now a static constant outside the component

  // Initialize consumption data when flatmates change
  useEffect(() => {
    initializeConsumptionData();
  }, [initializeConsumptionData]); // Now includes the memoized function

  // Fetch data on component mount
  useEffect(() => {
    fetchConsumptionSettlements();
  }, [fetchConsumptionSettlements]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">🍺☕🥤 Consumption Tracker</h2>
            <p className="text-gray-600 mt-2">
              Track individual consumption costs for coffee, beer, and seltzer separate from shared expenses
            </p>
          </div>
          <button
            onClick={() => setShowNewSettlement(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition duration-300 font-medium"
          >
            + New Settlement
          </button>
        </div>

        {/* Previous Settlement Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-center">
              <span className="text-2xl mr-3">☕</span>
              <div>
                <h3 className="font-semibold text-amber-800">Coffee Previous Settlement</h3>
                {(() => {
                  const latestCoffee = consumptionSettlements.find(s => s.type === 'coffee');
                  return latestCoffee ? (
                    <div className="text-amber-700">
                      <p>{latestCoffee.totalConsumptions} cups</p>
                      <p className="text-sm">€{latestCoffee.totalCost.toFixed(2)} - {latestCoffee.date.toLocaleDateString()}</p>
                    </div>
                  ) : (
                    <p className="text-amber-700">No settlements yet</p>
                  );
                })()}
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🍺</span>
              <div>
                <h3 className="font-semibold text-yellow-800">Beer Previous Settlement</h3>
                {(() => {
                  const latestBeer = consumptionSettlements.find(s => s.type === 'beer');
                  return latestBeer ? (
                    <div className="text-yellow-700">
                      <p>{latestBeer.totalConsumptions} bottles</p>
                      <p className="text-sm">€{latestBeer.totalCost.toFixed(2)} - {latestBeer.date.toLocaleDateString()}</p>
                    </div>
                  ) : (
                    <p className="text-yellow-700">No settlements yet</p>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🥤</span>
              <div>
                <h3 className="font-semibold text-teal-800">Seltzer Previous Settlement</h3>
                {(() => {
                  const latestSeltzer = consumptionSettlements.find(s => s.type === 'seltzer');
                  return latestSeltzer ? (
                    <div className="text-teal-700">
                      <p>{latestSeltzer.totalConsumptions} bottles</p>
                      <p className="text-sm">€{latestSeltzer.totalCost.toFixed(2)} - {latestSeltzer.date.toLocaleDateString()}</p>
                    </div>
                  ) : (
                    <p className="text-teal-700">No settlements yet</p>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center">
              <span className="text-2xl mr-3">💰</span>
              <div>
                <h3 className="font-semibold text-green-800">Total Settlements</h3>
                <div className="text-green-700">
                  <p>{consumptionSettlements.length} settlements</p>
                  <p className="text-sm">
                    €{consumptionSettlements.reduce((sum, s) => sum + s.totalCost, 0).toFixed(2)} total
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Settlement Form */}
      {showNewSettlement && (
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">New Consumption Settlement</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Settlement Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={settlementType}
                  onChange={(e) => setSettlementType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.entries(consumptionTypes).map(([key, type]) => (
                    <option key={key} value={key}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={settlementDate}
                  onChange={(e) => setSettlementDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Cost (€) <span className="text-gray-500">(optional if cost per unit is set)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost per {consumptionTypes[settlementType].unit} (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {totalCost && getTotalConsumptions() > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Calculated: €{getCalculatedCostPerUnit().toFixed(2)} per {consumptionTypes[settlementType].unit}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
                <textarea
                  placeholder="e.g., Bought at Albert Heijn, bulk purchase..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Right Column - Consumption Data */}
            <div>
              <h4 className="text-lg font-medium text-gray-800 mb-4">
                Individual Consumption ({consumptionTypes[settlementType].unit}s)
              </h4>
              
              <div className="space-y-3">
                {flatmates.map(flatmate => (
                  <div key={flatmate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">{flatmate.name}</span>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={consumptionData[flatmate.name] || ''}
                        onChange={(e) => updateConsumption(flatmate.name, e.target.value)}
                        className="w-20 p-2 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-600 w-16">
                        €{getIndividualCost(flatmate.name).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total {consumptionTypes[settlementType].unit}s:</span>
                    <span className="font-medium">{getTotalConsumptions()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost per {consumptionTypes[settlementType].unit}:</span>
                    <span className="font-medium">
                      €{(costPerUnit ? parseFloat(costPerUnit) : getCalculatedCostPerUnit()).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-base border-t border-indigo-300 pt-2">
                    <span>Total Cost:</span>
                    <span>€{(totalCost ? parseFloat(totalCost) : getTotalCalculatedCost()).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowNewSettlement(false)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-300"
            >
              Cancel
            </button>
            <button
              onClick={addSettlement}
              disabled={getTotalConsumptions() === 0 || (!totalCost && !costPerUnit)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Add Settlement
            </button>
          </div>
        </div>
      )}

      {/* Settlement History */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-2xl font-semibold text-gray-800 mb-6">Settlement History</h3>
        
        {consumptionSettlements.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-lg">No settlements recorded yet</p>
            <p className="text-sm">Click "New Settlement" to add your first consumption tracking entry</p>
          </div>
        ) : (
          <div className="space-y-4">
            {consumptionSettlements.map(settlement => {
              const typeInfo = consumptionTypes[settlement.type];
              return (
                <div key={settlement.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      <span className="text-gray-600">
                        {settlement.date.toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteSettlement(settlement.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Settlement Summary */}
                    <div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Total Cost:</strong> €{settlement.totalCost.toFixed(2)}</p>
                        <p><strong>Cost per {typeInfo.unit}:</strong> €{settlement.costPerUnit.toFixed(2)}</p>
                        <p><strong>Total {typeInfo.unit}s:</strong> {settlement.totalConsumptions}</p>
                        {settlement.notes && (
                          <p><strong>Notes:</strong> {settlement.notes}</p>
                        )}
                      </div>
                    </div>

                    {/* Individual Breakdown with Payment Tracking */}
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Individual Costs & Payment Status:</h5>
                      
                      {/* Settlement Payment Summary */}
                      {settlementPayments && (
                        <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Payment Status:</span>
                            <span className="font-medium">
                              {(() => {
                                const paidCount = Object.entries(settlement.consumptionData || {})
                                  .filter(([name, count]) => {
                                    if (count === 0) return true; // Consider zero consumption as "paid" (no debt)
                                    const paymentId = `consumption_${settlement.id}_${name}`;
                                    return settlementPayments[paymentId];
                                  }).length;
                                const totalCount = Object.keys(settlement.consumptionData || {}).length;
                                return `${paidCount}/${totalCount} Paid`;
                              })()}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        {Object.entries(settlement.consumptionData).map(([name, count]) => {
                          const individualCost = count * settlement.costPerUnit;
                          const paymentId = `consumption_${settlement.id}_${name}`;
                          const isPaid = settlementPayments?.[paymentId] || count === 0;
                          
                          return (
                            <div key={name} className={`flex items-center justify-between p-2 rounded ${count > 0 ? 'bg-white border' : 'bg-gray-50'}`}>
                              <div className="flex items-center space-x-2">
                                <span className={count > 0 ? '' : 'text-gray-400'}>{name}:</span>
                                <span className={`text-sm ${count > 0 ? '' : 'text-gray-400'}`}>
                                  €{individualCost.toFixed(2)} ({count})
                                </span>
                              </div>
                              
                              {/* Payment Status & Toggle */}
                              {count > 0 && settlementPayments && (
                                <div className="flex items-center space-x-2">
                                  <span className={`text-xs px-2 py-1 rounded ${isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {isPaid ? '✅ Paid' : '❌ Unpaid'}
                                  </span>
                                  
                                  {/* Payment Toggle Button */}
                                  <PermissionWrapper permission={PERMISSIONS?.MARK_PAYMENTS_PAID}>
                                    <button
                                      onClick={() => toggleSettlementPayment?.(paymentId)}
                                      className={`text-xs px-2 py-1 rounded transition-colors ${
                                        isPaid 
                                          ? 'bg-red-500 text-white hover:bg-red-600' 
                                          : 'bg-green-500 text-white hover:bg-green-600'
                                      }`}
                                    >
                                      {isPaid ? 'Mark Unpaid' : 'Mark Paid'}
                                    </button>
                                  </PermissionWrapper>
                                </div>
                              )}
                              
                              {/* Show "No debt" for zero consumption */}
                              {count === 0 && (
                                <span className="text-xs text-gray-500 px-2 py-1 rounded bg-gray-100">
                                  No debt
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsumptionTracker;
