import React, { useState, useMemo } from 'react';
import { useFinanceContext } from '../contexts/FinanceContext';
import { ChevronDown, ChevronUp, Filter, ArrowUpDown, Clock, User, Calendar, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ExpenseList = () => {
  const { expenses, formatCurrency, deleteExpense, updateExpense, getCategories } = useFinanceContext();
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });
  const [filterCategory, setFilterCategory] = useState('');
  const [expandedExpense, setExpandedExpense] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const categories = getCategories();

  const sortedExpenses = useMemo(() => {
    let sortableExpenses = [...expenses];
    if (sortConfig.key) {
      sortableExpenses.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableExpenses;
  }, [expenses, sortConfig]);

  const filteredExpenses = useMemo(() => {
    return filterCategory
      ? sortedExpenses.filter(expense => expense.category === filterCategory)
      : sortedExpenses;
  }, [sortedExpenses, filterCategory]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'ascending' ? 'descending' : 'ascending',
    }));
  };

  const handleDeleteClick = (expenseId) => {
    setDeleteConfirmation(expenseId);
  };

  const confirmDelete = async () => {
    if (deleteConfirmation) {
      try {
        await deleteExpense(deleteConfirmation);
        setDeleteConfirmation(null);
      } catch (error) {
        console.error("Error deleting expense:", error);
        setErrorMessage(`Failed to delete expense: ${error.message}`);
      }
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const handleEditClick = (expense) => {
    console.log('Edit clicked for expense:', expense);
    setEditingExpense({
      ...expense,
      date: expense.date instanceof Date ? expense.date.toISOString().split('T')[0] : expense.date
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    console.log(`Editing ${name} field:`, value);
    setEditingExpense(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    console.log('handleEditSubmit called');
    setErrorMessage('');
    try {
      if (!editingExpense || !editingExpense.id) {
        throw new Error('Invalid expense data');
      }
      const updatedExpense = {
        ...editingExpense,
        amount: parseFloat(editingExpense.amount),
        date: new Date(editingExpense.date)
      };
      console.log('Submitting updated expense:', updatedExpense);
      await updateExpense(editingExpense.id, updatedExpense);
      console.log('Expense updated successfully');
      setEditingExpense(null);
    } catch (error) {
      console.error("Error updating expense:", error);
      setErrorMessage(`Failed to update expense: ${error.message}`);
    }
  };

  if (!expenses || expenses.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400">No expenses found.</p>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Expense List</h2>
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center">
          <Filter className="mr-2 text-gray-500" size={20} />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => handleSort('date')} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-500">
            <ArrowUpDown size={16} className="mr-1" /> Date
          </button>
          <button onClick={() => handleSort('amount')} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-500">
            <ArrowUpDown size={16} className="mr-1" /> Amount
          </button>
        </div>
      </div>
      <ul className="space-y-2">
        {filteredExpenses.map(expense => (
          <li 
            key={expense.id} 
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
          >
            {editingExpense && editingExpense.id === expense.id ? (
              <form onSubmit={handleEditSubmit} className="space-y-2">
                <input
                  type="text"
                  name="description"
                  value={editingExpense.description}
                  onChange={handleEditChange}
                  className="w-full p-2 border rounded"
                  required
                />
                <input
                  type="number"
                  name="amount"
                  value={editingExpense.amount}
                  onChange={handleEditChange}
                  className="w-full p-2 border rounded"
                  required
                />
                <select
                  name="category"
                  value={editingExpense.category}
                  onChange={handleEditChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <input
                  type="date"
                  name="date"
                  value={editingExpense.date}
                  onChange={handleEditChange}
                  className="w-full p-2 border rounded"
                  required
                />
                <div className="flex justify-end space-x-2">
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEditingExpense(null)} 
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <div className="flex-grow cursor-pointer" onClick={() => setExpandedExpense(expandedExpense === expense.id ? null : expense.id)}>
                    <h3 className="font-semibold text-gray-800 dark:text-white">{expense.description}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{expense.category}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="font-bold text-green-600 dark:text-green-400 mr-2">
                      {formatCurrency(expense.amount, expense.currency)}
                    </span>
                    <button
                      onClick={() => handleEditClick(expense)}
                      className="text-blue-500 hover:text-blue-700 transition-colors duration-200 mr-2"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(expense.id)}
                      className="text-red-500 hover:text-red-700 transition-colors duration-200 mr-2"
                    >
                      <Trash2 size={20} />
                    </button>
                    {expandedExpense === expense.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
                <AnimatePresence>
                  {expandedExpense === expense.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600"
                    >
                      <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                        <Calendar className="mr-1" size={16} />
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                      {expense.time && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                          <Clock className="mr-1" size={16} />
                          {expense.time}
                        </p>
                      )}
                      {expense.paidTo && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                          <User className="mr-1" size={16} />
                          Paid to: {expense.paidTo}
                        </p>
                      )}
                      {expense.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Notes: {expense.notes}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </li>
        ))}
      </ul>
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-4">Are you sure you want to delete this expense?</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseList;