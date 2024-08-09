import React, { useState, useEffect } from 'react';
import { useFinanceContext } from '../contexts/FinanceContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaMinus, FaCheck, FaInfoCircle, FaCalendarAlt, FaDollarSign } from 'react-icons/fa';
import { Edit2, Trash2, BarChart2, List, ArrowUp, ArrowDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from 'recharts';

const Budgets = () => {
  const { 
    budgets, 
    addBudget, 
    removeBudget, 
    updateBudget, 
    categories, 
    currencies, 
    formatCurrency,
    convertCurrency,
    getExpensesByCategory,
    getTotalExpenses
  } = useFinanceContext();

  const [showAddForm, setShowAddForm] = useState(false);
  const [totalBudget, setTotalBudget] = useState({});
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [savingsGoal, setSavingsGoal] = useState(5000);
  const [nextPayday, setNextPayday] = useState('2024-07-15');
  const [showTotalBudgetModal, setShowTotalBudgetModal] = useState(false);
  const [showSavingsGoalModal, setShowSavingsGoalModal] = useState(false);
  const [showPaydayModal, setShowPaydayModal] = useState(false);
  const [tempSavingsGoal, setTempSavingsGoal] = useState(savingsGoal);
  const [tempNextPayday, setTempNextPayday] = useState(nextPayday);

  useEffect(() => {
    console.log("Current budgets:", budgets);
    calculateTotalBudget();
  }, [budgets, currencies]);

  const calculateTotalBudget = () => {
    const total = currencies.reduce((acc, currency) => ({ ...acc, [currency.code]: 0 }), {});
    budgets.forEach(budget => {
      const amountInUSD = convertCurrency(parseFloat(budget.amount), budget.currency, 'USD');
      currencies.forEach(currency => {
        total[currency.code] += convertCurrency(amountInUSD, 'USD', currency.code);
      });
    });
    setTotalBudget(total);
  };

  const handleAddBudget = async (newBudget) => {
    try {
      await addBudget(newBudget);
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding budget:", error);
      // You might want to show an error message to the user here
    }
  };

  const handleSavingsGoalSubmit = (e) => {
    e.preventDefault();
    setSavingsGoal(parseFloat(tempSavingsGoal));
    setShowSavingsGoalModal(false);
  };

  const handlePaydaySubmit = (e) => {
    e.preventDefault();
    setNextPayday(tempNextPayday);
    setShowPaydayModal(false);
  };

  const FeatureCard = ({ title, value, icon: Icon, onClick }) => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="bg-white p-6 rounded-lg shadow-lg flex items-center justify-between cursor-pointer"
      onClick={onClick}
    >
      <div>
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        <p className="text-2xl font-bold text-green-500">{value}</p>
      </div>
      <Icon size={40} className="text-blue-500" />
    </motion.div>
  );

  const Modal = ({ isOpen, onClose, title, children }) => (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="bg-white p-6 rounded-lg shadow-lg relative max-w-md w-full mx-4"
          >
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4">{title}</h2>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const BudgetList = () => {
    const [editingBudget, setEditingBudget] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [filterCategory, setFilterCategory] = useState('');
    const [sortBy, setSortBy] = useState('category');
    const [sortOrder, setSortOrder] = useState('asc');
    
    const totalBudgetAmount = budgets.reduce((sum, budget) => sum + parseFloat(budget.amount), 0);
    const totalExpenses = getTotalExpenses();
    const expensesByCategory = getExpensesByCategory();
    
    const getBudgetProgress = (category) => {
      const budget = budgets.find(b => b.category === category);
      if (!budget) return 0;
      const spent = expensesByCategory[category] || 0;
      const budgetAmount = parseFloat(budget.amount);
      return Math.min((spent / budgetAmount) * 100, 100);
    };

    const getProgressColor = (progress) => {
      if (progress < 50) return 'bg-green-500';
      if (progress < 80) return 'bg-yellow-500';
      return 'bg-red-500';
    };

    const handleEdit = (budgetId, amount) => {
      setEditingBudget({ id: budgetId, amount: amount.toString() });
    };

    const handleUpdate = () => {
      if (editingBudget) {
        updateBudget(editingBudget.id, { amount: parseFloat(editingBudget.amount) });
        setEditingBudget(null);
      }
    };

    const filteredBudgets = budgets
      .filter(budget => budget.category.toLowerCase().includes(filterCategory.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'category') {
          return sortOrder === 'asc' ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category);
        } else {
          return sortOrder === 'asc' ? parseFloat(a.amount) - parseFloat(b.amount) : parseFloat(b.amount) - parseFloat(a.amount);
        }
      });


    const chartData = filteredBudgets.map(budget => ({
      name: budget.category,
      value: parseFloat(budget.amount),
      expenses: expensesByCategory[budget.category] || 0
    }));

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

        {budgets.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No budgets set yet.</p>
        ) : viewMode === 'list' ? (
          <ul className="space-y-4">
            <AnimatePresence>
              {filteredBudgets.map((budget) => (
                <motion.li
                  key={budget.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-800 dark:text-white">{budget.category}</span>
                    <div className="flex items-center space-x-2">
                      {editingBudget && editingBudget.id === budget.id ? (
                        <>
                          <input
                            type="number"
                            value={editingBudget.amount}
                            onChange={(e) => setEditingBudget({...editingBudget, amount: e.target.value})}
                            className="w-24 p-1 border rounded dark:bg-gray-600 dark:text-white"
                          />
                          <button onClick={handleUpdate} className="text-green-500 hover:text-green-700">
                            <FaCheck size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="font-bold">{formatCurrency(budget.amount, budget.currency)}</span>
                          <button onClick={() => handleEdit(budget.id, budget.amount)} className="text-blue-500 hover:text-blue-700">
                            <Edit2 size={18} />
                          </button>
                        </>
                      )}
                      <button onClick={() => removeBudget(budget.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {budget.startDate} to {budget.endDate}
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
                          {getBudgetProgress(budget.category).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${getBudgetProgress(budget.category)}%` }}
                        transition={{ duration: 0.5 }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${getProgressColor(getBudgetProgress(budget.category))}`}
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
          <p className="text-gray-600 dark:text-gray-300">Total Budget: {formatCurrency(totalBudgetAmount, 'USD')}</p>
          <p className="text-gray-600 dark:text-gray-300">Total Expenses: {formatCurrency(totalExpenses, 'USD')}</p>
          <p className={`font-bold ${totalExpenses > totalBudgetAmount ? 'text-red-500' : 'text-green-500'}`}>
            {totalExpenses > totalBudgetAmount ? 'Over budget by: ' : 'Under budget by: '}
            {formatCurrency(Math.abs(totalBudgetAmount - totalExpenses), 'USD')}
          </p>
        </motion.div>
      </div>
    );
  };

  const BudgetForm = ({ onBudgetAdded, categories, currencies }) => {
    const [newBudget, setNewBudget] = useState({
      category: '',
      amount: '',
      currency: 'USD',
      period: 'monthly',
      startDate: '',
      endDate: ''
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
          endDate: ''
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

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-4 text-gray-800 flex items-center">
        <FaDollarSign className="mr-2" />
        Budgets
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <FeatureCard 
          title="Total Budget" 
          value={totalBudget[displayCurrency] !== undefined ? formatCurrency(totalBudget[displayCurrency], displayCurrency) : 'Loading...'}
          icon={FaDollarSign}
          onClick={() => setShowTotalBudgetModal(true)}
        />
        <FeatureCard 
          title="Savings Goal" 
          value={formatCurrency(savingsGoal, 'USD')}
          icon={FaInfoCircle}
          onClick={() => setShowSavingsGoalModal(true)}
        />
        <FeatureCard 
          title="Next Payday" 
          value={nextPayday} 
          icon={FaCalendarAlt}
          onClick={() => setShowPaydayModal(true)}
        />
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-500 text-white px-6 py-3 rounded-full flex items-center shadow-lg hover:bg-green-600 transition-colors duration-300"
        >
          {showAddForm ? <FaMinus className="mr-2" /> : <FaPlus className="mr-2" />}
          {showAddForm ? 'Hide Form' : 'Add New Budget'}
        </motion.button>

        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <BudgetForm 
                onBudgetAdded={handleAddBudget}
                categories={categories}
                currencies={currencies}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <BudgetList />
      </div>

      <Modal
        isOpen={showTotalBudgetModal}
        onClose={() => setShowTotalBudgetModal(false)}
        title="Total Budget"
      >
        <div className="space-y-4">
          {Object.entries(totalBudget).map(([currencyCode, amount]) => (
            <div key={currencyCode} className="flex justify-between items-center">
              <span>{currencyCode}</span>
              <span>{formatCurrency(amount, currencyCode)}</span>
            </div>
          ))}
          <div>
            <label htmlFor="displayCurrency" className="block text-sm font-medium text-gray-700">
              Display Currency
            </label>
            <select
              id="displayCurrency"
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>{currency.code}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showSavingsGoalModal}
        onClose={() => setShowSavingsGoalModal(false)}
        title="Set Savings Goal"
      >
        <form onSubmit={handleSavingsGoalSubmit} className="space-y-4">
          <div>
            <label htmlFor="savingsGoal" className="block text-sm font-medium text-gray-700">
              Savings Goal (USD)
            </label>
            <input
              type="number"
              id="savingsGoal"
              value={tempSavingsGoal}
              onChange={(e) => setTempSavingsGoal(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Set Savings Goal
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={showPaydayModal}
        onClose={() => setShowPaydayModal(false)}
        title="Set Next Payday"
      >
        <form onSubmit={handlePaydaySubmit} className="space-y-4">
          <div>
            <label htmlFor="nextPayday" className="block text-sm font-medium text-gray-700">
              Next Payday
            </label>
            <input
              type="date"
              id="nextPayday"
              value={tempNextPayday}
              onChange={(e) => setTempNextPayday(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Set Next Payday
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Budgets;