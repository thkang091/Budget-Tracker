import React, { useState, useMemo, useCallback } from 'react';
import { useFinanceContext } from '../contexts/FinanceContext';
import { Edit2, Trash2, BarChart2, List, ArrowUp, ArrowDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const BudgetList = () => {
  const { budgets = {}, removeBudget, updateBudget, formatCurrency, getExpensesByCategory, getTotalExpenses } = useFinanceContext();
  const [editingBudget, setEditingBudget] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('category');
  const [sortOrder, setSortOrder] = useState('asc');
  
  const totalBudget = useMemo(() => Object.values(budgets).reduce((sum, budget) => sum + budget.amount, 0), [budgets]);
  const totalExpenses = getTotalExpenses();
  const expensesByCategory = getExpensesByCategory();
  
  const getBudgetProgress = useCallback((category) => {
    const spent = expensesByCategory[category] || 0;
    const budgetAmount = budgets[category].amount;
    return Math.min((spent / budgetAmount) * 100, 100);
  }, [expensesByCategory, budgets]);

  const getProgressColor = useCallback((progress) => {
    if (progress < 50) return 'bg-green-500';
    if (progress < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  }, []);

  const handleEdit = (category, amount) => {
    setEditingBudget({ category, amount: amount.toString() });
  };

  const handleUpdate = () => {
    if (editingBudget) {
      updateBudget(editingBudget.category, parseFloat(editingBudget.amount));
      setEditingBudget(null);
    }
  };

  const filteredBudgets = useMemo(() => {
    return Object.entries(budgets)
      .filter(([category]) => category.toLowerCase().includes(filterCategory.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'category') {
          return sortOrder === 'asc' ? a[0].localeCompare(b[0]) : b[0].localeCompare(a[0]);
        } else {
          return sortOrder === 'asc' ? a[1].amount - b[1].amount : b[1].amount - a[1].amount;
        }
      });
  }, [budgets, filterCategory, sortBy, sortOrder]);

  const chartData = useMemo(() => {
    return filteredBudgets.map(([category, budget]) => ({
      name: category,
      value: budget.amount,
      expenses: expensesByCategory[category] || 0
    }));
  }, [filteredBudgets, expensesByCategory]);

  const renderChart = () => {
    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value, 'USD')} />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" name="Budget" />
            <Bar dataKey="expenses" fill="#82ca9d" name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-6 transition-all duration-300">
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Budget List</h2>
        <div className="flex flex-wrap space-x-2 mt-2 sm:mt-0">
          <input
            type="text"
            placeholder="Filter by category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-2 border rounded dark:bg-gray-700 dark:text-white"
          >
            <option value="category">Sort by Category</option>
            <option value="amount">Sort by Amount</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {sortOrder === 'asc' ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'bar' : 'list')}
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {viewMode === 'list' ? <BarChart2 size={20} /> : <List size={20} />}
          </button>
        </div>
      </div>

      {Object.entries(budgets).length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No budgets set yet.</p>
      ) : viewMode === 'list' ? (
        <ul className="space-y-4">
          <AnimatePresence>
            {filteredBudgets.map(([category, budget]) => (
              <motion.li
                key={category}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-800 dark:text-white">{category}</span>
                  <div className="flex items-center space-x-2">
                    {editingBudget && editingBudget.category === category ? (
                      <>
                        <input
                          type="number"
                          value={editingBudget.amount}
                          onChange={(e) => setEditingBudget({...editingBudget, amount: e.target.value})}
                          className="w-24 p-1 border rounded dark:bg-gray-600 dark:text-white"
                        />
                        <button onClick={handleUpdate} className="text-green-500 hover:text-green-700">
                          Save
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="font-bold">{formatCurrency(budget.amount, budget.currency)}</span>
                        <button onClick={() => handleEdit(category, budget.amount)} className="text-blue-500 hover:text-blue-700">
                          <Edit2 size={18} />
                        </button>
                      </>
                    )}
                    <button onClick={() => removeBudget(category)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                        Progress
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-green-600">
                        {getBudgetProgress(category).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${getBudgetProgress(category)}%` }}
                      transition={{ duration: 0.5 }}
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${getProgressColor(getBudgetProgress(category))}`}
                    ></motion.div>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        renderChart()
      )}

      <motion.div 
        className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Summary</h3>
        <p className="text-gray-600 dark:text-gray-300">Total Budget: {formatCurrency(totalBudget, 'USD')}</p>
        <p className="text-gray-600 dark:text-gray-300">Total Expenses: {formatCurrency(totalExpenses, 'USD')}</p>
        <p className={`font-bold ${totalExpenses > totalBudget ? 'text-red-500' : 'text-green-500'}`}>
          {totalExpenses > totalBudget ? 'Over budget by: ' : 'Under budget by: '}
          {formatCurrency(Math.abs(totalBudget - totalExpenses), 'USD')}
        </p>
      </motion.div>
    </div>
  );
};

export default BudgetList;