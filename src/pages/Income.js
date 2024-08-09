import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Plus, Edit2, Trash2, BarChart2, PieChart, ArrowUpCircle, ArrowDownCircle, Calendar, Tag, RefreshCw, Search, Sliders, ChevronRight, ChevronLeft } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useFinanceContext } from '../contexts/FinanceContext';

const mockExchangeRates = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110.14,
};

const Income = () => {
  const { income, addIncome, updateIncome, deleteIncome, currencies } = useFinanceContext();
  const [incomeSources, setIncomeSources] = useState([]);
  const [newIncome, setNewIncome] = useState({
    amount: '',
    frequency: 'monthly',
    source: '',
    category: '',
    date: new Date(),
    currency: 'USD',
    isRecurring: false,
    recurringInterval: 'monthly'
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [exchangeRates, setExchangeRates] = useState(mockExchangeRates);
  const [filterDate, setFilterDate] = useState(new Date());
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [customCategories, setCustomCategories] = useState(['Freelance', 'Dividends', 'Rental']);
  const [showPrediction, setShowPrediction] = useState(false);
  const [incomeGoal, setIncomeGoal] = useState({ amount: 0, period: 'monthly' });
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [showTaxInfo, setShowTaxInfo] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [formErrors, setFormErrors] = useState({});
  const [showChart, setShowChart] = useState(false);
  const [chartType, setChartType] = useState('line');

  useEffect(() => {
    setIncomeSources(income);
  }, [income]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingId) {
        await updateIncome(editingId, newIncome);
        toast.success("Income updated successfully!");
      } else {
        const addedIncome = await addIncome(newIncome);
        toast.success("New income added successfully!");
      }
      setNewIncome({
        amount: '',
        frequency: 'monthly',
        source: '',
        category: '',
        date: new Date(),
        currency: 'USD',
        isRecurring: false,
        recurringInterval: 'monthly'
      });
      setEditingId(null);
      setShowForm(false);
      setFormStep(1);
    } catch (error) {
      console.error("Error adding/updating income:", error);
      toast.error("Failed to save income. Please try again.");
    }
  };

  const handleEdit = (incomeItem) => {
    setNewIncome(incomeItem);
    setEditingId(incomeItem.id);
    setShowForm(true);
    setFormStep(1);
  };

  const handleDelete = async (id) => {
    try {
      await deleteIncome(id);
      toast.success("Income deleted successfully!");
    } catch (error) {
      console.error("Error deleting income:", error);
      toast.error("Failed to delete income. Please try again.");
    }
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    if (!showForm) {
      setEditingId(null);
      setNewIncome({
        amount: '',
        frequency: 'monthly',
        source: '',
        category: '',
        date: new Date(),
        currency: 'USD',
        isRecurring: false,
        recurringInterval: 'monthly'
      });
      setFormStep(1);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!newIncome.amount) errors.amount = "Amount is required";
    if (!newIncome.source) errors.source = "Source is required";
    if (!newIncome.category) errors.category = "Category is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (formStep < 3) setFormStep(formStep + 1);
  };

  const prevStep = () => {
    if (formStep > 1) setFormStep(formStep - 1);
  };

  const toggleChart = () => {
    setShowChart(!showChart);
  };

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const handleCurrencyChange = (newCurrency) => {
    setSelectedCurrency(newCurrency);
  };

  const filteredIncomeSources = useMemo(() => {
    return incomeSources
      .filter(inc => 
        (selectedCategory === 'All' || inc.category === selectedCategory) &&
        (inc.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
         inc.amount.toString().includes(searchTerm)) &&
        new Date(inc.date).getMonth() === filterDate.getMonth() &&
        new Date(inc.date).getFullYear() === filterDate.getFullYear()
      )
      .sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return sortOrder === 'asc' ? -1 : 1;
        if (a[sortBy] > b[sortBy]) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [incomeSources, selectedCategory, searchTerm, filterDate, sortBy, sortOrder]);

  const totalIncome = useMemo(() => {
    return filteredIncomeSources.reduce((sum, income) => {
      const rate = exchangeRates[income.currency] / exchangeRates[selectedCurrency];
      return sum + (income.amount * rate);
    }, 0);
  }, [filteredIncomeSources, exchangeRates, selectedCurrency]);

  const incomeGoalProgress = useMemo(() => {
    if (incomeGoal.amount <= 0) return 0;
    return Math.min((totalIncome / incomeGoal.amount) * 100, 100);
  }, [totalIncome, incomeGoal.amount]);

  const chartData = useMemo(() => {
    return filteredIncomeSources.map(income => ({
      name: income.source,
      amount: income.amount * (exchangeRates[income.currency] / exchangeRates[selectedCurrency])
    }));
  }, [filteredIncomeSources, exchangeRates, selectedCurrency]);

  const categoryChartData = useMemo(() => {
    const incomeByCategory = filteredIncomeSources.reduce((acc, income) => {
      const category = income.category || 'Uncategorized';
      const amount = income.amount * (exchangeRates[income.currency] / exchangeRates[selectedCurrency]);
      acc[category] = (acc[category] || 0) + amount;
      return acc;
    }, {});

    return Object.entries(incomeByCategory).map(([category, amount]) => ({
      name: category,
      amount: amount
    }));
  }, [filteredIncomeSources, exchangeRates, selectedCurrency]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

  const predictedIncome = useMemo(() => {
    const lastThreeMonths = filteredIncomeSources.slice(-3);
    const average = lastThreeMonths.reduce((sum, income) => sum + income.amount, 0) / 3;
    return [
      { month: 'Current', amount: average },
      { month: 'Next', amount: average * 1.05 },
      { month: 'After Next', amount: average * 1.1 },
    ];
  }, [filteredIncomeSources]);

  const estimatedTax = useMemo(() => {
    return totalIncome * 0.2;
  }, [totalIncome]);

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-white">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">Income</h1>
            <div className="flex items-center">
              <select
                value={selectedCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.keys(exchangeRates).map((currency) => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">Total Income: {formatCurrency(totalIncome, selectedCurrency)}</h2>
            <button
              onClick={toggleForm}
              className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out flex items-center"
            >
              <Plus size={20} className="mr-2" />
              {showForm ? 'Cancel' : 'Add New Income'}
            </button>
          </div>
          
          <div className="flex items-center mb-4">
            <input
              type="number"
              placeholder="Set Income Goal"
              value={incomeGoal.amount}
              onChange={(e) => setIncomeGoal({ ...incomeGoal, amount: e.target.value })}
              className="mr-2 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow"
            />
            <select
              value={incomeGoal.period}
              onChange={(e) => setIncomeGoal({ ...incomeGoal, period: e.target.value })}
              className="mr-2 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
              style={{ width: `${incomeGoalProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Progress: {incomeGoalProgress.toFixed(1)}%</p>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
                <div className="mb-6 flex justify-between items-center">
                  <h2 className="text-3xl font-bold text-gray-800 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                    {editingId ? 'Edit Income' : 'Add New Income'}
                  </h2>
                  <div className="flex items-center">
                    <span className="mr-4 text-gray-600 dark:text-gray-400">Step {formStep} of 3</span>
                    <div className="flex">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={prevStep}
                        disabled={formStep === 1}
                        className="mr-2 p-2 bg-gray-200 dark:bg-gray-700 rounded-full disabled:opacity-50 transition duration-300 ease-in-out"
                      >
                        <ChevronLeft size={24} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={nextStep}
                        disabled={formStep === 3}
                        className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full disabled:opacity-50 transition duration-300 ease-in-out"
                      >
                        <ChevronRight size={24} />
                      </motion.button>
                    </div>
                  </div>
                </div>
  
                <AnimatePresence mode="wait">
                  {formStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="mb-6">
                        <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300" htmlFor="amount">
                          Amount
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                          </div>
                          <input
                            type="number"
                            id="amount"
                            className={`w-full pl-10 pr-3 py-2 rounded-md border ${formErrors.amount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300`}
                            value={newIncome.amount}
                            onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                            required
                          />
                        </div>
                        {formErrors.amount && <p className="text-red-500 text-xs italic mt-1">{formErrors.amount}</p>}
                      </div>
                      <div className="mb-6">
                        <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300" htmlFor="currency">
                          Currency
                        </label>
                        <select
                          id="currency"
                          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
                          value={newIncome.currency}
                          onChange={(e) => setNewIncome({ ...newIncome, currency: e.target.value })}
                          required
                        >
                          {Object.keys(exchangeRates).map(currency => (
                            <option key={currency} value={currency}>{currency}</option>
                          ))}
                        </select>
                      </div>
                    </motion.div>
                  )}
  
                  {formStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="mb-6">
                        <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300" htmlFor="source">
                          Source
                        </label>
                        <input
                          type="text"
                          id="source"
                          className={`w-full px-3 py-2 rounded-md border ${formErrors.source ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300`}
                          value={newIncome.source}
                          onChange={(e) => setNewIncome({ ...newIncome, source: e.target.value })}
                          required
                        />
                        {formErrors.source && <p className="text-red-500 text-xs italic mt-1">{formErrors.source}</p>}
                      </div>
                      <div className="mb-6">
                        <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300" htmlFor="category">
                          Category
                        </label>
                        <select
                          id="category"
                          className={`w-full px-3 py-2 rounded-md border ${formErrors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300`}
                          value={newIncome.category}
                          onChange={(e) => setNewIncome({ ...newIncome, category: e.target.value })}
                          required
                        >
                          <option value="">Select a category</option>
                          <option value="Salary">Salary</option>
                          <option value="Business">Business</option>
                          <option value="Investments">Investments</option>
                          {customCategories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                          <option value="custom">+ Add Custom Category</option>
                        </select>
                        {formErrors.category && <p className="text-red-500 text-xs italic mt-1">{formErrors.category}</p>}
                      </div>
                    </motion.div>
                  )}
  
                  {formStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="mb-6">
                        <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300" htmlFor="frequency">
                          Frequency
                        </label>
                        <select
                          id="frequency"
                          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
                          value={newIncome.frequency}
                          onChange={(e) => setNewIncome({ ...newIncome, frequency: e.target.value })}
                          required
                        >
                          <option value="one-time">One-time</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="bi-weekly">Bi-weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="annually">Annually</option>
                        </select>
                      </div>
                      <div className="mb-6">
                        <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300" htmlFor="date">
                          Date
                        </label>
                        <DatePicker
                          selected={newIncome.date}
                          onChange={(date) => setNewIncome({ ...newIncome, date })}
                          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
                          dateFormat="MMMM d, yyyy"
                        />
                      </div>
                      <div className="flex items-center mb-6">
                        <input
                          type="checkbox"
                          id="isRecurring"
                          className="mr-2"
                          checked={newIncome.isRecurring}
                          onChange={(e) => setNewIncome({ ...newIncome, isRecurring: e.target.checked })}
                        />
                        <label htmlFor="isRecurring" className="text-sm font-bold text-gray-700 dark:text-gray-300">
                          Recurring Income
                        </label>
                      </div>
                      {newIncome.isRecurring && (
                        <div className="mb-6">
                          <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300" htmlFor="recurringInterval">
                            Recurring Interval
                          </label>
                          <select
                            id="recurringInterval"
                            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
                            value={newIncome.recurringInterval}
                            onChange={(e) => setNewIncome({ ...newIncome, recurringInterval: e.target.value })}
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="bi-weekly">Bi-weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="annually">Annually</option>
                          </select>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
  
                <div className="flex justify-between mt-8">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={prevStep}
                    className="bg-gray-200 dark:bg-gray-700 text-black dark:text-white px-4 py-2 rounded-md"
                  >
                    Previous
                  </motion.button>
                  {formStep < 3 ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={nextStep}
                      className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-md"
                    >
                      Next
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      className="bg-green-500 dark:bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-600 dark:hover:bg-green-700 transition-colors duration-300"
                    >
                      {editingId ? 'Update Income' : 'Add Income'}
                    </motion.button>
                  )}
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-wrap justify-between items-center mb-6">
            <div className="w-full md:w-1/3 mb-4 md:mb-0">
              <input
                type="text"
                placeholder="Search income sources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-full md:w-1/3 md:px-4 mb-4 md:mb-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Categories</option>
                <option value="Salary">Salary</option>
                <option value="Business">Business</option>
                <option value="Investments">Investments</option>
                {customCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-1/3 flex justify-end">
              <button
                onClick={toggleChart}
                className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-300 flex items-center mr-2"
              >
                {showChart ? <PieChart size={20} className="mr-2" /> : <BarChart2 size={20} className="mr-2" />}
                {showChart ? 'Hide Chart' : 'Show Chart'}
              </button>
              <button
                onClick={() => setShowTaxInfo(!showTaxInfo)}
                className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-300"
              >
                {showTaxInfo ? 'Hide Tax Info' : 'Show Tax Info'}
              </button>
            </div>
          </div>
  
          {showChart && (
            <div className="mb-8 bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setChartType('line')}
                  className={`mr-2 px-3 py-1 rounded ${chartType === 'line' ? 'bg-blue-500 dark:bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}
                >
                  Line
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`mr-2 px-3 py-1 rounded ${chartType === 'bar' ? 'bg-blue-500 dark:bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}
                >
                  Bar
                </button>
                <button
                  onClick={() => setChartType('pie')}
                  className={`px-3 py-1 rounded ${chartType === 'pie' ? 'bg-blue-500 dark:bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}
                  >
                    Pie
                  </button>
                </div>
               
                <ResponsiveContainer width="100%" height={400}>
                  {chartType === 'line' ? (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB dark:#4B5563" />
                      <XAxis dataKey="name" stroke="#4B5563 dark:#9CA3AF" />
                      <YAxis stroke="#4B5563 dark:#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF dark:#1F2937', color: '#000000 dark:#FFFFFF' }} />
                      <Legend />
                      <Line type="monotone" dataKey="amount" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  ) : chartType === 'bar' ? (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB dark:#4B5563" />
                      <XAxis dataKey="name" stroke="#4B5563 dark:#9CA3AF" />
                      <YAxis stroke="#4B5563 dark:#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF dark:#1F2937', color: '#000000 dark:#FFFFFF' }} />
                      <Legend />
                      <Bar dataKey="amount" fill="#8884d8" />
                    </BarChart>
                  ) : (
                    <RePieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF dark:#1F2937', color: '#000000 dark:#FFFFFF' }} />
                      <Legend />
                    </RePieChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
    
            {showTaxInfo && (
              <div className="mb-8 bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Estimated Tax Information</h3>
                <p className="text-lg mb-2 text-gray-700 dark:text-gray-300">Estimated Tax: {formatCurrency(estimatedTax, selectedCurrency)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Note: This is a rough estimate. Please consult a tax professional for accurate calculations.</p>
              </div>
            )}
    
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white-300uppercase tracking-wider cursor-pointer" onClick={() => handleSort('source')}>
                      Source {sortBy === 'source' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('amount')}>
                      Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('frequency')}>
                      Frequency {sortBy === 'frequency' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('category')}>
                      Category {sortBy === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('date')}>
                      Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {filteredIncomeSources.map((income) => (
                    <tr key={income.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{income.source}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-300">{formatCurrency(income.amount, income.currency)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-300">{income.frequency}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          {income.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-300">{new Date(income.date).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(income)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(income.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
  
          {showPrediction && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Income Prediction</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={predictedIncome}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB dark:#4B5563" />
                  <XAxis dataKey="month" stroke="#4B5563 dark:#9CA3AF" />
                  <YAxis stroke="#4B5563 dark:#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF dark:#1F2937', color: '#000000 dark:#FFFFFF' }} />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
    
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setShowPrediction(!showPrediction)}
              className="bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white px-6 py-3 rounded-full transition-colors duration-300 flex items-center"
            >
              {showPrediction ? <ArrowUpCircle size={20} className="mr-2" /> : <ArrowDownCircle size={20} className="mr-2" />}
              {showPrediction ? 'Hide Income Prediction' : 'Show Income Prediction'}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  export default Income;