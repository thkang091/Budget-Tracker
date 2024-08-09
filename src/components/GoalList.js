import React, { useState } from 'react';
import { useFinanceContext } from '../contexts/FinanceContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrash, FaEdit, FaCheckCircle, FaChevronDown, FaChevronUp, FaDollarSign, FaCalendarAlt, FaChartLine, FaPercent, FaList } from 'react-icons/fa';

const GoalList = () => {
  const { goals = [], removeGoal, updateGoal, formatCurrency } = useFinanceContext();
  const [editingGoal, setEditingGoal] = useState(null);
  const [expandedGoal, setExpandedGoal] = useState(null);

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setExpandedGoal(null);
  };

  const handleUpdate = (updatedGoal) => {
    updateGoal(updatedGoal);
    setEditingGoal(null);
  };

  const toggleExpand = (goalId) => {
    setExpandedGoal(expandedGoal === goalId ? null : goalId);
    setEditingGoal(null);
  };

  const calculateProgress = (goal) => {
    if (!goal.currentSavings || !goal.targetAmount || goal.targetAmount <= 0) return 0;
    const progress = (goal.currentSavings / goal.targetAmount) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg shadow-md mt-6"
    >
      <h2 className="text-2xl font-bold mb-4">Financial Goals</h2>
      {goals.length === 0 ? (
        <p>No financial goals set yet.</p>
      ) : (
        <ul className="space-y-4">
          <AnimatePresence>
            {goals.map(goal => (
              <motion.li 
                key={goal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-gray-50 rounded-lg shadow-sm overflow-hidden"
              >
                {editingGoal?.id === goal.id ? (
                  <EditGoalForm goal={goal} onUpdate={handleUpdate} onCancel={() => setEditingGoal(null)} />
                ) : (
                  <div>
                    <div className="p-4 cursor-pointer" onClick={() => toggleExpand(goal.id)}>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-lg">{goal.title}</span>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(goal); }}
                            className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeGoal(goal.id); }}
                            className="text-red-500 hover:text-red-700 transition-colors duration-200"
                          >
                            <FaTrash />
                          </button>
                          {expandedGoal === goal.id ? <FaChevronUp /> : <FaChevronDown />}
                        </div>
                      </div>
                      {goal.category && <div className="text-sm text-gray-600 mt-1">{goal.category}</div>}
                      <div className="mt-2">
                        <div className="text-sm text-gray-600">Progress</div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <motion.div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            initial={{ width: 0 }}
                            animate={{ width: `${calculateProgress(goal)}%` }}
                            transition={{ duration: 0.5 }}
                          ></motion.div>
                        </div>
                        <div className="text-right text-sm text-gray-600 mt-1">
                          {goal.currentSavings !== undefined && goal.targetAmount !== undefined ? (
                            `${formatCurrency(goal.currentSavings, goal.currency)} / ${formatCurrency(goal.targetAmount, goal.currency)}`
                          ) : (
                            'Progress not available'
                          )}
                        </div>
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedGoal === goal.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="px-4 pb-4"
                        >
                          <div className="space-y-2 text-sm">
                            {goal.description && <p><strong>Description:</strong> {goal.description}</p>}
                            {goal.startDate && <p><FaCalendarAlt className="inline mr-2" /> Start: {formatDate(goal.startDate)}</p>}
                            {goal.deadline && <p><FaCalendarAlt className="inline mr-2" /> Deadline: {formatDate(goal.deadline)}</p>}
                            {goal.monthlyContribution !== undefined && <p><FaDollarSign className="inline mr-2" /> Monthly Contribution: {formatCurrency(goal.monthlyContribution, goal.currency)}</p>}
                            {goal.interestRate !== undefined && <p><FaPercent className="inline mr-2" /> Interest Rate: {goal.interestRate}%</p>}
                            {goal.milestones && (
                              <div>
                                <strong>Milestones:</strong>
                                <ul className="list-disc list-inside ml-4">
                                  {goal.milestones.split('\n').filter(Boolean).map((milestone, index) => (
                                    <li key={index}>{milestone}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </motion.div>
  );
};

const EditGoalForm = ({ goal, onUpdate, onCancel }) => {
  const [editedGoal, setEditedGoal] = useState(goal);
  const { currencies = [] } = useFinanceContext();

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(editedGoal);
  };

  const inputClassName = "w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-100 rounded-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input
          type="text"
          value={editedGoal.title}
          onChange={(e) => setEditedGoal({...editedGoal, title: e.target.value})}
          className={inputClassName}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={editedGoal.description || ''}
          onChange={(e) => setEditedGoal({...editedGoal, description: e.target.value})}
          className={`${inputClassName} h-20 resize-none`}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <input
            type="text"
            value={editedGoal.category || ''}
            onChange={(e) => setEditedGoal({...editedGoal, category: e.target.value})}
            className={inputClassName}
            placeholder="Enter a category"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select
            value={editedGoal.currency}
            onChange={(e) => setEditedGoal({...editedGoal, currency: e.target.value})}
            className={inputClassName}
          >
            {currencies.map(currency => (
              <option key={currency.code} value={currency.code}>{currency.code} ({currency.symbol})</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount *</label>
          <input
            type="number"
            value={editedGoal.targetAmount || ''}
            onChange={(e) => setEditedGoal({...editedGoal, targetAmount: e.target.value})}
            className={inputClassName}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Savings</label>
          <input
            type="number"
            value={editedGoal.currentSavings || ''}
            onChange={(e) => setEditedGoal({...editedGoal, currentSavings: e.target.value})}
            className={inputClassName}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={editedGoal.startDate || ''}
            onChange={(e) => setEditedGoal({...editedGoal, startDate: e.target.value})}
            className={inputClassName}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
          <input
            type="date"
            value={editedGoal.deadline || ''}
            onChange={(e) => setEditedGoal({...editedGoal, deadline: e.target.value})}
            className={inputClassName}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Contribution</label>
          <input
            type="number"
            value={editedGoal.monthlyContribution || ''}
            onChange={(e) => setEditedGoal({...editedGoal, monthlyContribution: e.target.value})}
            className={inputClassName}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
          <input
            type="number"
            step="0.01"
            value={editedGoal.interestRate || ''}
            onChange={(e) => setEditedGoal({...editedGoal, interestRate: e.target.value})}
            className={inputClassName}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Milestones</label>
        <textarea
          value={editedGoal.milestones || ''}
          onChange={(e) => setEditedGoal({...editedGoal, milestones: e.target.value})}
          className={`${inputClassName} h-20 resize-none`}
          placeholder="Enter milestones, one per line"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          className="bg-green-500 text-white p-2 rounded flex items-center"
        >
          <FaCheckCircle className="mr-2" /> Save
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onCancel}
          className="bg-gray-500 text-white p-2 rounded"
        >
          Cancel
        </motion.button>
      </div>
    </form>
  );
};

export default GoalList;