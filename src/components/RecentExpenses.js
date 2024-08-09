import React from 'react';
import { useFinanceContext } from '../contexts/FinanceContext';

const RecentExpenses = () => {
  const { expenses, formatCurrency } = useFinanceContext();

  const recentExpenses = expenses.slice(0, 5);  // Get the 5 most recent expenses

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Recent Expenses</h2>
      {recentExpenses.length === 0 ? (
        <p>No recent expenses.</p>
      ) : (
        <ul>
          {recentExpenses.map(expense => (
            <li key={expense.id} className="mb-2 pb-2 border-b">
              <div className="flex justify-between">
                <span>{expense.description}</span>
                <span>{formatCurrency(expense.amount, expense.currency)}</span>
              </div>
              <div className="text-sm text-gray-500">
                {expense.category} - {new Date(expense.date).toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentExpenses;