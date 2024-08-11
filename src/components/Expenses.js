import React, { useState, useEffect, useCallback } from 'react';
import { useFinanceContext } from '../contexts/FinanceContext';
import AddExpenseForm from './AddExpenseForm';
import ExpenseList from './ExpenseList';
import ExpenseCalendar from './ExpenseCalendar';
import ExpenseStats from './ExpenseStats';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, TrendingUp, PieChart, Calendar, List, Plus, X, RefreshCw, ArrowUpDown } from 'lucide-react';
import confetti from 'canvas-confetti';

const currencySymbols = {
  USD: '$', KRW: '₩', EUR: '€', GBP: '£', JPY: '¥'
};

const Expenses = () => {
  const { 
    expenses, 
    error, 
    getTotalExpenses, 
    getExpensesByCategory,
    convertCurrency,
    formatCurrency
  } = useFinanceContext();

  const [activeView, setActiveView] = useState('list');
  const [showAddForm, setShowAddForm] = useState(false);
  const [expenseAdded, setExpenseAdded] = useState(false);
  const [totalExpenses, setTotalExpenses] = useState({});
  const [calculationError, setCalculationError] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    if (expenseAdded) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => setExpenseAdded(false), 2000);
    }
  }, [expenseAdded]);

  const calculateTotalExpenses = useCallback(async () => {
    try {
      const usedCurrencies = [...new Set(expenses.map(expense => expense.currency))];
      const totals = {};

      for (const targetCurrency of usedCurrencies) {
        let total = getTotalExpenses(targetCurrency);
        totals[targetCurrency] = total;
      }

      setTotalExpenses(totals);
      setCalculationError(null);
    } catch (err) {
      console.error('Error calculating total expenses:', err);
      setCalculationError('Failed to calculate total expenses. Please try again.');
    }
  }, [expenses, getTotalExpenses]);

  useEffect(() => {
    calculateTotalExpenses();
  }, [calculateTotalExpenses]);

  const viewOptions = [
    { id: 'list', icon: List, label: 'List View' },
    { id: 'calendar', icon: Calendar, label: 'Calendar View' },
    { id: 'stats', icon: PieChart, label: 'Statistics' },
  ];

  const sortedTotalExpenses = Object.entries(totalExpenses).sort((a, b) => 
    sortOrder === 'desc' ? b[1] - a[1] : a[1] - b[1]
  );


  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="p-6 bg-red-100 dark:bg-red-900 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-red-800 dark:text-red-200">Error</h2>
        <p className="text-red-600 dark:text-red-300">{error}</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <motion.h1 initial={{ y: -50 }} animate={{ y: 0 }}
        className="text-4xl font-bold mb-6 text-gray-800 dark:text-white flex items-center">
        <DollarSign className="mr-2" />
        Expenses
      </motion.h1>

      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
            <TrendingUp className="mr-2" />
            Total Expenses
          </h2>
          <div className="flex items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSortOrder(prevOrder => prevOrder === 'desc' ? 'asc' : 'desc')}
              className="mr-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              <ArrowUpDown size={20} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={calculateTotalExpenses}
              className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
            >
              <RefreshCw size={20} />
            </motion.button>
          </div>
        </div>
        {calculationError ? (
          <p className="text-red-500 dark:text-red-400">{calculationError}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedTotalExpenses.map(([currency, amount]) => (
              <motion.div
                key={currency}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{currency}</h3>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(amount, currency)}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <div className="flex flex-wrap justify-between items-center mb-6">
        <div className="flex flex-wrap space-x-2 mb-2 sm:mb-0">
          {viewOptions.map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveView(option.id)}
              className={`px-4 py-2 rounded-lg flex items-center mb-2 sm:mb-0 ${
                activeView === option.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
              }`}
            >
              <option.icon className="mr-2" size={18} />
              {option.label}
            </motion.button>
          ))}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus className="mr-2" size={18} />
          Add Expense
        </motion.button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg relative max-w-md w-full mx-4">
              <button
                onClick={() => setShowAddForm(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
              <AddExpenseForm
                onExpenseAdded={() => {
                  setShowAddForm(false);
                  setExpenseAdded(true);
                  calculateTotalExpenses();
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeView === 'list' && <ExpenseList expenses={expenses} />}
          {activeView === 'calendar' && <ExpenseCalendar expenses={expenses} />}
          {activeView === 'stats' && <ExpenseStats expenses={expenses} getExpensesByCategory={getExpensesByCategory} />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default Expenses;
