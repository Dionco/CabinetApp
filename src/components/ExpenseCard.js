import React from 'react';

const ExpenseCard = ({ expense, categories, onDelete }) => {
  const category = categories.find(cat => cat.value === expense.category);
  
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
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
        <div className="flex justify-between items-center mt-2">
          {expense.timestamp && (
            <p className="text-xs text-gray-500">
              {new Date(expense.timestamp.seconds * 1000).toLocaleDateString()}
            </p>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(expense.id)}
              className="text-red-500 hover:text-red-700 text-xs font-medium"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseCard;
