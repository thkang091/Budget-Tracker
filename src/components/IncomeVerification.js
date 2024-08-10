import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DollarSign } from 'lucide-react';

export default function IncomeVerification() {
  const [hasIncome, setHasIncome] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeFrequency, setIncomeFrequency] = useState('monthly');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { updateIncomeInfo, currentUser } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (hasIncome && (!incomeAmount || isNaN(incomeAmount) || incomeAmount <= 0)) {
      setError('Please enter a valid income amount.');
      setLoading(false);
      return;
    }

    try {
      await updateIncomeInfo(hasIncome, parseFloat(incomeAmount), incomeFrequency);
      navigate('/dashboard');
    } catch (error) {
      console.error('Income verification error:', error);
      setError('Failed to update income information. Please try again.');
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Income Verification
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please provide your income information to complete your profile.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={hasIncome}
                  onChange={(e) => setHasIncome(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-indigo-600"
                />
                <span className="ml-2 text-gray-700">I have an income</span>
              </label>
            </div>
            {hasIncome && (
              <>
                <div className="mt-4">
                  <label htmlFor="income-amount" className="sr-only">Income Amount</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="number"
                      name="income-amount"
                      id="income-amount"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                      value={incomeAmount}
                      onChange={(e) => setIncomeAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="income-frequency" className="sr-only">Income Frequency</label>
                  <select
                    id="income-frequency"
                    name="income-frequency"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={incomeFrequency}
                    onChange={(e) => setIncomeFrequency(e.target.value)}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

          <div>
            <button
              type="submit"
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Income Information'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
