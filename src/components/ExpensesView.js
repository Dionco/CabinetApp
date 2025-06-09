import React, { useState } from 'react';
import { format } from 'date-fns';
import { useUser } from '../contexts/UserContext';
import PermissionWrapper from './PermissionWrapper';

const ExpensesView = ({ 
  expenses, 
  categories, 
  flatmates, 
  deleteExpense,
  editingExpense,
  editExpenseName,
  editAmount,
  editCategory,
  editPaidBy,
  startEditingExpense,
  cancelEditing,
  submitExpenseEdit,
  setEditExpenseName,
  setEditAmount,
  setEditCategory,
  setEditPaidBy
}) => {
  const { PERMISSIONS } = useUser();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter and sort expenses
  const filteredExpenses = expenses
    .filter(expense => {
      // Category filter
      if (filter !== 'all' && expense.category !== filter) return false;
      
      // Search filter
      if (searchTerm && !expense.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.amount - a.amount;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'date':
        default:
          const aDate = new Date(a.timestamp?.seconds * 1000);
          const bDate = new Date(b.timestamp?.seconds * 1000);
          return bDate - aDate;
      }
    });

  // Calculate totals for filtered expenses
  const filteredTotal = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="date">Date (Newest First)</option>
              <option value="amount">Amount (Highest First)</option>
              <option value="name">Name (A-Z)</option>
              <option value="category">Category</option>
            </select>
          </div>

          {/* Results Summary */}
          <div className="flex flex-col justify-end">
            <div className="p-2 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
              </p>
              <p className="font-medium text-gray-800">
                Total: €{filteredTotal.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">
          {filter === 'all' ? 'All Expenses' : `${categories.find(c => c.value === filter)?.label} Expenses`}
        </h3>
        
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-gray-500">
              {searchTerm || filter !== 'all' 
                ? 'No expenses match your filters' 
                : 'No expenses found'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((expense) => {
              const category = categories.find(cat => cat.value === expense.category);
              const isEditing = editingExpense && editingExpense.id === expense.id;
              
              return (
                <div key={expense.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  {isEditing ? (
                    // Edit Form
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-800 text-lg">Edit Expense</h4>
                        <button
                          onClick={cancelEditing}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <input
                            type="text"
                            value={editExpenseName}
                            onChange={(e) => setEditExpenseName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Expense description"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (€)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="0.00"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            {categories.map(cat => (
                              <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Paid By</label>
                          <select
                            value={editPaidBy}
                            onChange={(e) => setEditPaidBy(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            {flatmates.map(flatmate => (
                              <option key={flatmate.name} value={flatmate.name}>{flatmate.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={submitExpenseEdit}
                          disabled={!editExpenseName || !editAmount || !editPaidBy}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 text-lg">{expense.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${category?.color}`}>
                              {category?.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {expense.timestamp && format(new Date(expense.timestamp.seconds * 1000), 'MMM dd, yyyy')}
                            </span>
                            {expense.editedAt && (
                              <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                                Edited
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-800">€{expense.amount?.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">€{expense.splitAmount?.toFixed(2)} each</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Paid by:</span> {expense.paidBy}
                        </div>
                        <div>
                          <span className="font-medium">Split:</span> Evenly between all flatmates
                        </div>
                        <div className="flex justify-between items-center">
                          <span>
                            <span className="font-medium">Each pays:</span> €{expense.splitAmount?.toFixed(2)}
                          </span>
                          <div className="flex space-x-2">
                            <PermissionWrapper permission={PERMISSIONS.EDIT_EXPENSE}>
                              <button
                                onClick={() => startEditingExpense(expense)}
                                className="text-indigo-500 hover:text-indigo-700 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                              >
                                Edit
                              </button>
                            </PermissionWrapper>
                            <PermissionWrapper permission={PERMISSIONS.DELETE_EXPENSE}>
                              <button
                                onClick={() => deleteExpense(expense.id)}
                                className="text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                              >
                                Delete
                              </button>
                            </PermissionWrapper>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {filteredExpenses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="text-sm font-medium text-gray-700">Average Expense</h4>
            <p className="text-2xl font-bold text-indigo-600">
              €{(filteredTotal / filteredExpenses.length).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="text-sm font-medium text-gray-700">Largest Expense</h4>
            <p className="text-2xl font-bold text-green-600">
              €{Math.max(...filteredExpenses.map(e => e.amount)).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="text-sm font-medium text-gray-700">Most Recent</h4>
            <p className="text-sm font-medium text-gray-800">
              {filteredExpenses[0]?.name}
            </p>
            <p className="text-xs text-gray-500">
              {filteredExpenses[0]?.timestamp && 
                format(new Date(filteredExpenses[0].timestamp.seconds * 1000), 'MMM dd, yyyy')
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesView;
