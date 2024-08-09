import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import { BarChart2, DollarSign, Target, Settings, Sun, Moon, LogOut, Menu, X, CreditCard, PiggyBank, Wallet, TrendingUp, Edit2, Trash2, List, ArrowUp, ArrowDown, Check, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceContext } from '../contexts/FinanceContext';
import { useAuth } from '../contexts/AuthContext';

const Budgets = () => {
  const { 
    budgets, 
    addBudget, 
    removeBudget, 
    updateBudget, 
    categories, 
    currencies, 
    addCategory,
    formatCurrency,
    convertCurrency,
    getExpensesByCategory,
    getTotalExpenses,
    getBudgetPeriods
  } = useFinanceContext();
  const { currentUser, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [totalBudget, setTotalBudget] = useState({});
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [topBarItems, setTopBarItems] = useState([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showTotalBudgetModal, setShowTotalBudgetModal] = useState(false);

  useEffect(() => {
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
    updateTotalBudgetInTopBar(total[displayCurrency]);
  };

  const updateTotalBudgetInTopBar = (totalBudgetAmount) => {
    setTopBarItems(prevItems => 
      prevItems.map(item => 
        item.id === 'totalBudget' ? { ...item, value: totalBudgetAmount } : item
      )
    );
  };

  const handleAddBudget = async (newBudget) => {
    try {
      await addBudget(newBudget);
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding budget:", error);
    }
  };

  const handleUpdateTopBarItem = (id, newValue) => {
    setTopBarItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, value: newValue } : item
      )
    );
  };

  const handleAddTopBarItem = (newItem) => {
    setTopBarItems(prevItems => [...prevItems, newItem]);
    setShowAddItemModal(false);
  };

  const handleRemoveTopBarItem = (id) => {
    setTopBarItems(prevItems => prevItems.filter(item => item.id !== id && item.editable));
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'goal': return PiggyBank;
      case 'date': return BarChart2;
      case 'budget': return DollarSign;
      case 'percentage': return TrendingUp;
      default: return Wallet;
    }
  };

  const FeatureCard = ({ id, title, value, type, editable, icon: Icon, onClick, onEdit, onRemove }) => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex items-center justify-between cursor-pointer"
      onClick={onClick}
    >
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-2xl font-bold text-green-500 dark:text-green-400">
          {type === 'budget' || type === 'goal' ? formatCurrency(value, displayCurrency) : 
           type === 'percentage' ? `${value}%` : value}
        </p>
      </div>
      <div className="flex items-center">
        <Icon size={40} className="text-blue-500 dark:text-blue-400 mr-4" />
        {editable && (
          <>
            <button onClick={(e) => { e.stopPropagation(); onEdit(id); }} className="mr-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              <Edit2 size={20} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onRemove(id); }} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
              <Trash2 size={20} />
            </button>
          </>
        )}
      </div>
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
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg relative max-w-md w-full mx-4"
          >
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
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
    
    const totalBudgetAmount = budgets.reduce((sum, budget) => sum + convertCurrency(parseFloat(budget.amount), budget.currency, displayCurrency), 0);
    const totalExpenses = getTotalExpenses(displayCurrency);
    const expensesByCategory = getExpensesByCategory(displayCurrency);
    
    const getBudgetProgress = (category) => {
      const budget = budgets.find(b => b.category === category);
      if (!budget) return 0;
      const spent = expensesByCategory[category] || 0;
      const budgetAmount = convertCurrency(parseFloat(budget.amount), budget.currency, displayCurrency);
      return Math.min((spent / budgetAmount) * 100, 100);
    };

    const getProgressColor = (progress) => {
      if (progress < 50) return 'bg-green-500 dark:bg-green-600';
      if (progress < 80) return 'bg-yellow-500 dark:bg-yellow-600';
      return 'bg-red-500 dark:bg-red-600';
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
          const aAmount = convertCurrency(parseFloat(a.amount), a.currency, displayCurrency);
          const bAmount = convertCurrency(parseFloat(b.amount), b.currency, displayCurrency);
          return sortOrder === 'asc' ? aAmount - bAmount : bAmount - aAmount;
        }
      });

    const formatData = (data) => {
      return Object.entries(data).map(([key, value]) => ({ name: key, value }));
    };
  
    const chartData = formatData(
      filteredBudgets.reduce((acc, budget) => {
        const budgetAmount = convertCurrency(parseFloat(budget.amount), budget.currency, displayCurrency);
        const expenseAmount = expensesByCategory[budget.category] || 0;
        acc[budget.category] = {
          budget: budgetAmount,
          expenses: expenseAmount
        };
        return acc;
      }, {})
    );
  
    const renderChart = () => (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
            <XAxis dataKey="name" stroke={darkMode ? "#9CA3AF" : "#4B5563"} />
            <YAxis stroke={darkMode ? "#9CA3AF" : "#4B5563"} />
            <Tooltip
              formatter={(value, name, props) => [
                formatCurrency(value, displayCurrency),
                name.charAt(0).toUpperCase() + name.slice(1)
              ]}
              contentStyle={{ 
                backgroundColor: darkMode ? '#1F2937' : '#FFFFFF', 
                borderColor: darkMode ? '#374151' : '#E5E7EB',
                color: darkMode ? '#E5E7EB' : '#111827'
              }}
            />
            <Legend />
            <Bar dataKey="value.budget" fill={darkMode ? "#60A5FA" : "#3B82F6"} name="Budget" />
            <Bar dataKey="value.expenses" fill={darkMode ? "#34D399" : "#10B981"} name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );

    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-6 transition-all duration-300">
        <div className="flex flex-wrap justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Budget List</h2>
          <div className="flex flex-wrap space-x-2 mt-2 sm:mt-0">
            <input
              type="text"
              placeholder="Filter by category"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
            >
              <option value="category">Sort by Category</option>
              <option value="amount">Sort by Amount</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white rounded transition-colors"
            >
              {sortOrder === 'asc' ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'bar' : 'list')}
              className="p-2 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white rounded transition-colors"
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
                    <span className="font-semibold">{budget.category}</span>
                    <div className="flex items-center space-x-2">
                    {editingBudget && editingBudget.id === budget.id ? (
                        <>
                          <input
                            type="number"
                            value={editingBudget.amount}
                            onChange={(e) => setEditingBudget({...editingBudget, amount: e.target.value})}
                            className="w-24 p-1 border rounded bg-white dark:bg-gray-600 text-gray-800 dark:text-white border-gray-300 dark:border-gray-500"
                          />
                          <button onClick={handleUpdate} className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover-text-green-300">
                            <Check size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="font-bold">{formatCurrency(convertCurrency(parseFloat(budget.amount), budget.currency, displayCurrency), displayCurrency)}</span>
                          <button onClick={() => handleEdit(budget.id, budget.amount)} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                            <Edit2 size={18} />
                          </button>
                        </>
                      )}
                      <button onClick={() => removeBudget(budget.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Period: {budget.period} | {budget.startDate} to {budget.endDate}
                  </div>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200 dark:text-green-400 dark:bg-green-900">
                          Progress
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-green-600 dark:text-green-400">
                          {getBudgetProgress(budget.category).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200 dark:bg-green-900">
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
          <h3 className="text-lg font-semibold mb-2">Summary</h3>
          <p>Total Budget: {formatCurrency(totalBudgetAmount, displayCurrency)}</p>
          <p>Total Expenses: {formatCurrency(totalExpenses, displayCurrency)}</p>
          <p className={`font-bold ${totalExpenses > totalBudgetAmount ? 'text-red-500' : 'text-green-500'}`}>
            {totalExpenses > totalBudgetAmount ? 'Over budget by: ' : 'Under budget by: '}
            {formatCurrency(Math.abs(totalBudgetAmount - totalExpenses), displayCurrency)}
          </p>
        </motion.div>
      </div>
    );
  };

  const BudgetForm = ({ onBudgetAdded, categories, currencies }) => {
    const [newBudget, setNewBudget] = useState({
      category: '',
      subCategory: '',
      amount: '',
      currency: 'USD',
      period: 'monthly',
      startDate: '',
      endDate: ''
    });
    const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
    const [customCategory, setCustomCategory] = useState('');
    const [subCategories, setSubCategories] = useState({});

    useEffect(() => {
      // Initialize sub-categories
      const subCats = {
        Food: ['Groceries', 'Dining Out', 'Fast Food', 'Snacks', 'Beverages'],
        Transportation: ['Public Transit', 'Fuel', 'Car Maintenance', 'Parking', 'Ride-sharing'],
        Entertainment: ['Movies', 'Concerts', 'Sports Events', 'Hobbies', 'Subscriptions'],
        Bills: ['Rent/Mortgage', 'Utilities', 'Phone', 'Internet', 'Insurance'],
        Shopping: ['Clothing', 'Electronics', 'Home Goods', 'Personal Care', 'Gifts'],
        Health: ['Doctor Visits', 'Medications', 'Gym Membership', 'Fitness Equipment', 'Mental Health'],
        Education: ['Tuition', 'Books', 'Courses', 'School Supplies', 'Tutoring'],
        Travel: ['Flights', 'Accommodation', 'Transportation', 'Food', 'Activities'],
        Savings: ['Emergency Fund', 'Retirement', 'Investments', 'Major Purchases', 'Vacation Fund']
      };
  
      // Add sub-categories for custom categories
      categories.forEach(cat => {
        if (!subCats[cat]) {
          subCats[cat] = ['General', 'Misc', 'Other'];
        }
      });
  
      setSubCategories(subCats);
    }, [categories]);

    const handleSubmit = (e) => {
      e.preventDefault();
      if (newBudget.category && newBudget.subCategory && newBudget.amount && newBudget.currency && newBudget.period && newBudget.startDate && newBudget.endDate) {
        onBudgetAdded({
          ...newBudget,
          amount: parseFloat(newBudget.amount)
        });
        setNewBudget({
          category: '',
          subCategory: '',
          amount: '',
          currency: 'USD',
          period: 'monthly',
          startDate: '',
          endDate: ''
        });
        setShowCustomCategoryInput(false);
        setCustomCategory('');
      }
    };

    const handleChange = (e) => {
      const { name, value } = e.target;
      setNewBudget(prev => ({ ...prev, [name]: value }));
      
      if (name === 'category') {
        setNewBudget(prev => ({ ...prev, subCategory: '' }));
      }
    };

    const handleCustomCategorySubmit = () => {
      if (customCategory) {
        addCategory(customCategory);
        setNewBudget(prev => ({ ...prev, category: customCategory }));
        setSubCategories(prev => ({
          ...prev,
          [customCategory]: ['General', 'Misc', 'Other']
        }));
        setShowCustomCategoryInput(false);
        setCustomCategory('');
      }
    };
    
    return (
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
            {showCustomCategoryInput ? (
              <div className="flex">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter custom category"
                />
                <button
                  type="button"
                  onClick={handleCustomCategorySubmit}
                  className="mt-1 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 rounded-r-md"
                >
                  Add
                </button>
              </div>
            ) : (
              <select
                id="category"
                name="category"
                value={newBudget.category}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
                <option value="custom">+ Add Custom Category</option>
              </select>
            )}
            {!showCustomCategoryInput && (
              <button
                type="button"
                onClick={() => setShowCustomCategoryInput(true)}
                className="mt-2 text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                + Add Custom Category
              </button>
            )}
          </div>

          <div>
            <label htmlFor="subCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sub-Category</label>
            <select
              id="subCategory"
              name="subCategory"
              value={newBudget.subCategory}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              disabled={!newBudget.category}
            >
              <option value="">Select a sub-category</option>
              {newBudget.category && subCategories[newBudget.category]?.map(subCat => (
                <option key={subCat} value={subCat}>{subCat}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={newBudget.amount}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label>
            <select
              id="currency"
              name="currency"
              value={newBudget.currency}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>{currency.code}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="period" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Period</label>
            <select
              id="period"
              name="period"
              value={newBudget.period}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              {getBudgetPeriods().map(period => (
                <option key={period} value={period.toLowerCase()}>{period}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={newBudget.startDate}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={newBudget.endDate}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center"
        >
          <Check className="mr-2" /> Add Budget
        </motion.button>
      </form>
    );
  };

  const AddNewTopBarItemForm = ({ onAddItem }) => {
    const [newItemTitle, setNewItemTitle] = useState('');
    const [newItemType, setNewItemType] = useState('goal');
    const [newItemValue, setNewItemValue] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      const newItem = {
        id: Date.now().toString(),
        title: newItemTitle,
        value: newItemValue,
        type: newItemType,
        editable: true,
        icon: getIconForType(newItemType)
      };
      onAddItem(newItem);
      setNewItemTitle('');
      setNewItemType('goal');
      setNewItemValue('');
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="itemTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Title
        </label>
        <input
          type="text"
          id="itemTitle"
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          required
        />
      </div>
      <div>
        <label htmlFor="itemType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Type
        </label>
        <select
          id="itemType"
          value={newItemType}
          onChange={(e) => setNewItemType(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          required
        >
          <option value="goal">Savings Goal</option>
          <option value="date">Date</option>
          <option value="budget">Budget</option>
          <option value="percentage">Percentage</option>
        </select>
      </div>
      <div>
        <label htmlFor="itemValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Value
        </label>
        {newItemType === 'date' ? (
          <input
            type="date"
            id="itemValue"
            value={newItemValue}
            onChange={(e) => setNewItemValue(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        ) : newItemType === 'percentage' ? (
          <input
            type="number"
            id="itemValue"
            value={newItemValue}
            onChange={(e) => setNewItemValue(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
            min="0"
            max="100"
            step="1"
          />
        ) : (
          <input
            type="number"
            id="itemValue"
            value={newItemValue}
            onChange={(e) => setNewItemValue(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
            min="0"
            step="0.01"
          />
        )}
      </div>
      <button
        type="submit"
        className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Add Item
      </button>
    </form>
  );
};

return (
  <div className="p-8 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white min-h-screen">
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-4xl font-bold flex items-center">
        <DollarSign className="mr-2" />
        Budgets
      </h1>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-yellow-400"
      >
        {darkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
      <FeatureCard 
        title="Total Budget" 
        value={totalBudget[displayCurrency] !== undefined ? totalBudget[displayCurrency] : 0}
        type="budget"
        editable={false}
        icon={DollarSign}
        onClick={() => setShowTotalBudgetModal(true)}
      />
      {topBarItems.filter(item => item.id !== 'totalBudget').map(item => (
        <FeatureCard
          key={item.id}
          id={item.id}
          title={item.title}
          value={item.value}
          type={item.type}
          editable={item.editable}
          icon={item.icon}
          onEdit={(id) => {
            const newValue = prompt(`Enter new value for ${item.title}:`, item.value);
            if (newValue !== null) {
              handleUpdateTopBarItem(id, newValue);
            }
          }}
          onRemove={handleRemoveTopBarItem}
        />
      ))}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowAddItemModal(true)}
        className="bg-blue-500 dark:bg-blue-600 text-white p-6 rounded-lg shadow-lg flex items-center justify-center"
      >
        <Plus className="mr-2" /> Add New Item
      </motion.button>
    </div>

    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowAddForm(!showAddForm)}
        className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white px-6 py-3 rounded-full flex items-center shadow-lg transition-colors duration-300"
      >
        {showAddForm ? <Minus className="mr-2" /> : <Plus className="mr-2" />}
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
      isOpen={showAddItemModal}
      onClose={() => setShowAddItemModal(false)}
      title="Add New Top Bar Item"
    >
      <AddNewTopBarItemForm onAddItem={handleAddTopBarItem} />
    </Modal>
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
          <label htmlFor="displayCurrency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Display Currency
          </label>
          <select
            id="displayCurrency"
            value={displayCurrency}
            onChange={(e) => {
              setDisplayCurrency(e.target.value);
              updateTotalBudgetInTopBar(totalBudget[e.target.value]);
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {currencies.map(currency => (
              <option key={currency.code} value={currency.code}>{currency.code}</option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  </div>
);
};

export default Budgets;