import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck } from 'react-icons/fa';

const BudgetForm = ({ onBudgetAdded, categories, currencies }) => {
  const [newBudget, setNewBudget] = useState({
    category: '',
    amount: '',
    currency: 'USD',
    period: 'monthly',
    startDate: '',
    endDate: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newBudget.category && newBudget.amount && newBudget.currency && newBudget.period && newBudget.startDate && newBudget.endDate) {
      onBudgetAdded({
        ...newBudget,
        amount: parseFloat(newBudget.amount)
      });
      setNewBudget({
        category: '',
        amount: '',
        currency: 'USD',
        period: 'monthly',
        startDate: '',
        endDate: '',
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewBudget(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
          <select
            id="category"
            name="category"
            value={newBudget.category}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={newBudget.amount}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700">Currency</label>
          <select
            id="currency"
            name="currency"
            value={newBudget.currency}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          >
            {currencies.map(currency => (
              <option key={currency.code} value={currency.code}>{currency.code}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="period" className="block text-sm font-medium text-gray-700">Period</label>
          <select
            id="period"
            name="period"
            value={newBudget.period}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={newBudget.startDate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={newBudget.endDate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="submit"
        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center"
      >
        <FaCheck className="mr-2" /> Add Budget
      </motion.button>
    </form>
  );
};

export default BudgetForm;