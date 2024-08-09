import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, ArrowUpRight, Trash2, X, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useFinanceContext } from '../contexts/FinanceContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg relative max-w-md w-full mx-4"
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        {children}
      </motion.div>
    </div>
  );
};

const GoalCard = ({ goal, onDelete, onUpdate }) => {
  const { formatCurrency } = useFinanceContext();
  const progress = (goal.currentAmount / goal.targetAmount) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex items-center justify-between mb-4"
    >
      <div className="flex items-center">
        <div className="w-20 h-20 mr-6">
          <CircularProgressbar
            value={progress}
            text={`${progress.toFixed(0)}%`}
            styles={buildStyles({
              textSize: '22px',
              pathColor: `rgba(62, 152, 199, ${progress / 100})`,
              textColor: '#3e98c7',
              trailColor: '#d6d6d6',
            })}
          />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{goal.name}</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {formatCurrency(goal.currentAmount, 'USD')} / {formatCurrency(goal.targetAmount, 'USD')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Due: {new Date(goal.dueDate).toLocaleDateString()}</p>
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-2">
            {goal.category}
          </span>
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onUpdate(goal)}
          className="p-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <ArrowUpRight size={20} />
        </button>
        <button
          onClick={() => onDelete(goal.id)}
          className="p-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </motion.div>
  );
};

const GoalForm = ({ onSubmit, initialData, categories }) => {
  const [formData, setFormData] = useState(
    initialData || { name: '', targetAmount: '', currentAmount: '', dueDate: new Date(), category: '' }
  );
  const [newCategory, setNewCategory] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      onSubmit({ ...formData, category: newCategory });
      setNewCategory('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Goal Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
      <div>
        <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Target Amount
        </label>
        <input
          type="number"
          id="targetAmount"
          name="targetAmount"
          value={formData.targetAmount}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
      <div>
        <label htmlFor="currentAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Current Amount
        </label>
        <input
          type="number"
          id="currentAmount"
          name="currentAmount"
          value={formData.currentAmount}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
      <div>
        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Due Date
        </label>
        <DatePicker
          selected={formData.dueDate}
          onChange={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Category
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="">Select a category</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
          <option value="custom">Add Custom Category</option>
        </select>
      </div>
      {formData.category === 'custom' && (
        <div>
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Enter custom category"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add Category
          </button>
        </div>
      )}
      <button
        type="submit"
        className="w-full px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        {initialData ? 'Update Goal' : 'Add Goal'}
      </button>
    </form>
  );
};

const Goals = () => {
  const { goals, addGoal, updateGoal, deleteGoal, formatCurrency } = useFinanceContext();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [categories, setCategories] = useState(['Savings', 'Investment', 'Debt Repayment', 'Education', 'Travel', 'Other']);
  const [error, setError] = useState(null);

  useEffect(() => {
    const uniqueCategories = [...new Set(goals.map(goal => goal.category))];
    setCategories(prevCategories => [...new Set([...prevCategories, ...uniqueCategories])]);
  }, [goals]);

  const handleAddGoal = async (newGoal) => {
    try {
      await addGoal(newGoal);
      setShowAddForm(false);
      setError(null);
    } catch (error) {
      console.error("Failed to add goal:", error);
      setError("Failed to add goal. Please try again.");
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await deleteGoal(goalId);
      setError(null);
    } catch (error) {
      console.error("Failed to delete goal:", error);
      setError("Failed to delete goal. Please try again.");
    }
  };
  
  const handleUpdateGoal = async (updatedGoal) => {
    try {
      await updateGoal(updatedGoal);
      setEditingGoal(null);
      setError(null);
    } catch (error) {
      console.error("Failed to update goal:", error);
      setError("Failed to update goal. Please try again.");
    }
  };

  const filteredAndSortedGoals = goals
    .filter(goal => goal.name.toLowerCase().includes(filter.toLowerCase()) || 
                    goal.category.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        return sortOrder === 'asc' ? new Date(a.dueDate) - new Date(b.dueDate) : new Date(b.dueDate) - new Date(a.dueDate);
      } else if (sortBy === 'progress') {
        const progressA = (a.currentAmount / a.targetAmount) * 100;
        const progressB = (b.currentAmount / b.targetAmount) * 100;
        return sortOrder === 'asc' ? progressA - progressB : progressB - progressA;
      }
      return 0;
    });

  const totalSavings = goals.reduce((sum, goal) => sum + Number(goal.currentAmount), 0);
  const totalGoals = goals.reduce((sum, goal) => sum + Number(goal.targetAmount), 0);
  const overallProgress = totalGoals > 0 ? (totalSavings / totalGoals) * 100 : 0;

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-gray-800 dark:text-white flex items-center">
        <Target className="mr-2" />
        Financial Goals
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="mb-6 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-4 md:mb-0">
          <input
            type="text"
            placeholder="Filter goals..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2 dark:bg-gray-700 dark:text-white"
          />
          <Filter size={20} className="text-gray-500" />
        </div>
        <div className="flex items-center">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2 dark:bg-gray-700 dark:text-white"
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="progress">Sort by Progress</option>
          </select>
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300"
          >
            {sortOrder === 'asc' ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
          </button>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-500 text-white px-6 py-3 rounded-full flex items-center shadow-lg hover:bg-blue-600 transition-colors duration-300 mt-4 md:mt-0"
        >
          <Plus className="mr-2" size={20} />
          Add New Goal
        </button>
      </div>

      <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Overall Progress</h2>
        <div className="flex items-center">
          <div className="w-24 h-24 mr-6">
            <CircularProgressbar
              value={overallProgress}
              text={`${overallProgress.toFixed(0)}%`}
              styles={buildStyles({
                textSize: '22px',
                pathColor: `rgba(62, 152, 199, ${overallProgress / 100})`,
                textColor: '#3e98c7',
                trailColor: '#d6d6d6',
              })}
            />
          </div>
          <div>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Total Savings: <span className="font-bold text-green-500">{formatCurrency(totalSavings, 'USD')}</span>
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Total Goals: <span className="font-bold text-blue-500">{formatCurrency(totalGoals, 'USD')}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {filteredAndSortedGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onDelete={handleDeleteGoal}
              onUpdate={() => setEditingGoal(goal)}
            />
          ))}
        </AnimatePresence>
      </div>

      <Modal isOpen={showAddForm} onClose={() => setShowAddForm(false)} title="Add New Goal">
        <GoalForm onSubmit={handleAddGoal} categories={categories} />
      </Modal>

      <Modal isOpen={!!editingGoal} onClose={() => setEditingGoal(null)} title="Edit Goal">
        {editingGoal && <GoalForm onSubmit={handleUpdateGoal} initialData={editingGoal} categories={categories} />}
      </Modal>
    </div>
  );
};

export default Goals;