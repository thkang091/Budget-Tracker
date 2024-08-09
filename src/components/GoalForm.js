import React, { useState, useEffect } from 'react';
import { useFinanceContext } from '../contexts/FinanceContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaMinus, FaCheck, FaTimes, FaDollarSign, FaCalendarAlt, FaChartLine, FaPercent, FaList } from 'react-icons/fa';

const GoalForm = () => {
  const { addGoal, currencies = [] } = useFinanceContext();
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: '',
    targetAmount: '',
    currency: 'USD',
    startDate: '',
    deadline: '',
    currentSavings: '',
    monthlyContribution: '',
    interestRate: '',
    milestones: ''
  });
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [formProgress, setFormProgress] = useState(0);

  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => setShowSuccessMessage(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  useEffect(() => {
    const requiredFields = ['title', 'targetAmount'];
    const filledRequiredFields = requiredFields.filter(field => newGoal[field]).length;
    const otherFilledFields = Object.values(newGoal).filter(Boolean).length - filledRequiredFields;
    const totalProgress = (filledRequiredFields / requiredFields.length) * 70 + (otherFilledFields / (Object.keys(newGoal).length - requiredFields.length)) * 30;
    setFormProgress(totalProgress);
  }, [newGoal]);

  const validateForm = () => {
    const newErrors = {};
    if (!newGoal.title.trim()) newErrors.title = "Title is required";
    if (!newGoal.targetAmount || newGoal.targetAmount <= 0) newErrors.targetAmount = "Valid target amount is required";
    if (newGoal.currentSavings && newGoal.currentSavings < 0) newErrors.currentSavings = "Current savings cannot be negative";
    if (newGoal.monthlyContribution && newGoal.monthlyContribution < 0) newErrors.monthlyContribution = "Monthly contribution cannot be negative";
    if (newGoal.interestRate && (newGoal.interestRate < 0 || newGoal.interestRate > 100)) newErrors.interestRate = "Interest rate must be between 0 and 100";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating API call
        addGoal(newGoal);
        setNewGoal({
          title: '',
          description: '',
          category: '',
          targetAmount: '',
          currency: 'USD',
          startDate: '',
          deadline: '',
          currentSavings: '',
          monthlyContribution: '',
          interestRate: '',
          milestones: ''
        });
        setIsFormVisible(false);
        setShowSuccessMessage(true);
      } catch (error) {
        console.error("Error adding goal:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const inputClassName = "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline transition duration-300 ease-in-out";
  const errorClassName = "text-red-500 text-xs italic mt-1";

  const renderField = (field, icon = null) => (
    <motion.div key={field} className="mb-4" initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={field}>
        {field.split(/(?=[A-Z])/).join(" ").toLowerCase().replace(/^\w/, c => c.toUpperCase())}
        {field === 'title' || field === 'targetAmount' ? ' *' : ''}
      </label>
      <div className="relative">
        {field === 'category' ? (
          <input
            type="text"
            id={field}
            value={newGoal[field]}
            onChange={(e) => setNewGoal({...newGoal, [field]: e.target.value})}
            className={inputClassName}
            placeholder="Enter a category"
          />
        ) : field === 'currency' ? (
          <select
            id={field}
            value={newGoal[field]}
            onChange={(e) => setNewGoal({...newGoal, [field]: e.target.value})}
            className={inputClassName}
          >
            {currencies.map(currency => (
              <option key={currency.code} value={currency.code}>{currency.code} ({currency.symbol})</option>
            ))}
          </select>
        ) : field === 'description' || field === 'milestones' ? (
          <textarea
            id={field}
            value={newGoal[field]}
            onChange={(e) => setNewGoal({...newGoal, [field]: e.target.value})}
            className={`${inputClassName} ${errors[field] ? 'border-red-500' : ''}`}
            rows="3"
          />
        ) : (
          <>
            <input
              id={field}
              type={field.includes('Date') || field === 'deadline' ? 'date' : field === 'targetAmount' || field === 'currentSavings' || field === 'monthlyContribution' ? 'number' : field === 'interestRate' ? 'number' : 'text'}
              value={newGoal[field]}
              onChange={(e) => setNewGoal({...newGoal, [field]: e.target.value})}
              className={`${inputClassName} ${errors[field] ? 'border-red-500' : ''} ${icon ? 'pl-8' : ''}`}
              step={field === 'interestRate' ? '0.01' : undefined}
            />
            {icon && <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">{icon}</span>}
          </>
        )}
      </div>
      {errors[field] && <p className={errorClassName}>{errors[field]}</p>}
    </motion.div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <motion.button
        onClick={() => setIsFormVisible(!isFormVisible)}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center transition duration-300 ease-in-out transform hover:scale-105"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isFormVisible ? <FaMinus className="mr-2" /> : <FaPlus className="mr-2" />}
        {isFormVisible ? 'Hide Form' : 'Add New Goal'}
      </motion.button>
      
      <AnimatePresence>
        {isFormVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <form onSubmit={handleSubmit} className="mt-4">
              <h2 className="text-2xl font-bold mb-4">Add New Financial Goal</h2>
              
              <motion.div 
                className="w-full bg-gray-200 rounded-full h-2.5 mb-4"
                initial={{ width: 0 }}
                animate={{ width: `${formProgress}%` }}
                transition={{ duration: 0.5 }}
              >
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${formProgress}%` }}></div>
              </motion.div>

              {renderField('title')}
              {renderField('description')}
              {renderField('category')}
              {renderField('targetAmount', <FaDollarSign />)}
              {renderField('currency')}
              {renderField('startDate', <FaCalendarAlt />)}
              {renderField('deadline', <FaCalendarAlt />)}
              {renderField('currentSavings', <FaDollarSign />)}
              {renderField('monthlyContribution', <FaDollarSign />)}
              {renderField('interestRate', <FaPercent />)}
              {renderField('milestones')}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center w-full ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-t-2 border-b-2 border-white rounded-full"
                  />
                ) : (
                  <>
                    <FaCheck className="mr-2" /> Add Goal
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.5 }}
            className="mt-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4"
            role="alert"
          >
            <p className="font-bold">Success!</p>
            <p>Goal added successfully!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GoalForm;