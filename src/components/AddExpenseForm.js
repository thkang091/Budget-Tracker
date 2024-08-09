import React, { useState, useEffect } from 'react';
import { useFinanceContext } from '../contexts/FinanceContext';
import { PlusCircle, Clock, User } from 'lucide-react';

const AddExpenseForm = ({ onExpenseAdded }) => {
  const { addExpense, categories, addCategory, currencies } = useFinanceContext();
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: '',
    subCategory: '',
    date: '',
    time: '',
    paidTo: '',
    currency: 'USD'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newExpense.description && newExpense.amount && newExpense.category && newExpense.subCategory && newExpense.date) {
      try {
        const formattedExpense = {
          ...newExpense,
          date: newExpense.date,
          time: newExpense.time || '00:00',
        };
        console.log('Submitting new expense:', formattedExpense);
        await addExpense(formattedExpense);
        console.log('Expense added successfully');
        setSuccess('Expense added successfully!');
        setNewExpense({
          description: '',
          amount: '',
          category: '',
          subCategory: '',
          date: '',
          time: '',
          paidTo: '',
          currency: 'USD'
        });
        onExpenseAdded();
      } catch (err) {
        console.error('Error adding expense:', err);
        setError('Failed to add expense. Please try again.');
      }
    } else {
      setError('Please fill in all required fields');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewExpense(prev => ({ ...prev, [name]: value }));
    
    if (name === 'category') {
      setNewExpense(prev => ({ ...prev, subCategory: '' }));
    }
  };

  const handleCustomCategorySubmit = () => {
    if (customCategory) {
      addCategory(customCategory);
      setNewExpense(prev => ({ ...prev, category: customCategory }));
      setSubCategories(prev => ({
        ...prev,
        [customCategory]: ['General', 'Misc', 'Other']
      }));
      setShowCustomCategoryInput(false);
      setCustomCategory('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-4">Add New Expense</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {success && <p className="text-green-500 mb-2">{success}</p>}
      <input
        type="text"
        placeholder="Description"
        name="description"
        value={newExpense.description}
        onChange={handleChange}
        className="w-full p-2 mb-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        required
      />
      <input
        type="number"
        placeholder="Amount"
        name="amount"
        value={newExpense.amount}
        onChange={handleChange}
        className="w-full p-2 mb-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        required
      />
      <div className="mb-2">
        {showCustomCategoryInput ? (
          <div className="flex">
            <input
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="w-full p-2 border rounded-l dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter custom category"
            />
            <button
              type="button"
              onClick={handleCustomCategorySubmit}
              className="bg-blue-500 text-white px-4 rounded-r hover:bg-blue-600"
            >
              Add
            </button>
          </div>
        ) : (
          <select
            name="category"
            value={newExpense.category}
            onChange={handleChange}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          >
            <option value="">Select Category</option>
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
            className="mt-1 text-sm text-blue-500 hover:text-blue-700"
          >
            + Add Custom Category
          </button>
        )}
      </div>
      <select
        name="subCategory"
        value={newExpense.subCategory}
        onChange={handleChange}
        className="w-full p-2 mb-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        required
        disabled={!newExpense.category}
      >
        <option value="">Select Sub-Category</option>
        {newExpense.category && subCategories[newExpense.category]?.map(subCat => (
          <option key={subCat} value={subCat}>{subCat}</option>
        ))}
      </select>
      <div className="flex space-x-2 mb-2">
        <input
          type="date"
          name="date"
          value={newExpense.date}
          onChange={handleChange}
          className="w-1/2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          required
        />
        <div className="w-1/2 relative">
          <input
            type="time"
            name="time"
            value={newExpense.time}
            onChange={handleChange}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white pl-8"
          />
          <Clock className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        </div>
      </div>
      <div className="relative mb-2">
        <input
          type="text"
          placeholder="Paid To"
          name="paidTo"
          value={newExpense.paidTo}
          onChange={handleChange}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white pl-8"
        />
        <User className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
      </div>
      <select
        name="currency"
        value={newExpense.currency}
        onChange={handleChange}
        className="w-full p-2 mb-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      >
        {currencies.map(c => (
          <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
        ))}
      </select>
      <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded flex items-center justify-center hover:bg-blue-600 transition-colors">
        <PlusCircle className="mr-2" size={18} />
        Add Expense
      </button>
    </form>
  );
};

export default AddExpenseForm;