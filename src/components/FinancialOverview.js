import React, { useState, useEffect } from 'react';
import { useFinanceContext } from '../contexts/FinanceContext';
import { Card, CardHeader, CardContent } from './ui/card';
import { PieChart, ArrowUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import Alert, { AlertDescription } from './ui/Alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';

const FinancialOverview = () => {
  const { 
    expenses,
    income,
    goals,
    formatCurrency, 
    currencies,
    convertCurrency,
    loading,
    error
  } = useFinanceContext();

  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [totalGoals, setTotalGoals] = useState(0);
  const [expensesByCategory, setExpensesByCategory] = useState({});
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [userInputBalance, setUserInputBalance] = useState(() => {
    const savedBalance = localStorage.getItem('userInputBalance');
    return savedBalance ? parseFloat(savedBalance) : '';
  });

  useEffect(() => {
    calculateTotalExpenses();
    calculateTotalIncome();
    calculateTotalGoals();
    calculateExpensesByCategory();
  }, [expenses, income, goals, selectedCurrency]);

  useEffect(() => {
    calculateCurrentBalance();
  }, [totalIncome, totalExpenses, userInputBalance]);

  const calculateTotalExpenses = () => {
    const total = expenses.reduce((sum, expense) => {
      return sum + convertCurrency(expense.amount, expense.currency, selectedCurrency);
    }, 0);
    setTotalExpenses(total);
  };

  const calculateTotalIncome = () => {
    const total = income.reduce((sum, income) => {
      return sum + convertCurrency(income.amount, income.currency, selectedCurrency);
    }, 0);
    setTotalIncome(total);
  };

  const calculateTotalGoals = () => {
    const total = goals.reduce((sum, goal) => {
      return sum + convertCurrency(goal.targetAmount, goal.currency || 'USD', selectedCurrency);
    }, 0);
    setTotalGoals(total);
  };

  const calculateCurrentBalance = () => {
    if (totalIncome > 0) {
      setCurrentBalance(totalIncome - totalExpenses);
    } else if (userInputBalance) {
      setCurrentBalance(parseFloat(userInputBalance) - totalExpenses);
    } else {
      setIsBalanceModalOpen(true);
    }
  };

  const calculateExpensesByCategory = () => {
    const categoryExpenses = expenses.reduce((acc, expense) => {
      const convertedAmount = convertCurrency(expense.amount, expense.currency, selectedCurrency);
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += convertedAmount;
      return acc;
    }, {});
    setExpensesByCategory(categoryExpenses);
  };

  const handleCurrencyChange = (value) => {
    setSelectedCurrency(value);
  };

  const handleBalanceSubmit = (e) => {
    e.preventDefault();
    const balance = parseFloat(userInputBalance);
    setUserInputBalance(balance);
    localStorage.setItem('userInputBalance', balance.toString());
    setIsBalanceModalOpen(false);
    calculateCurrentBalance();
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const overviewItems = [
    { label: 'Total Expenses', value: totalExpenses, bgColor: 'bg-red-100 dark:bg-red-900', textColor: 'text-red-700 dark:text-white' },
    { label: 'Current Balance', value: currentBalance, bgColor: 'bg-blue-100 dark:bg-blue-900', textColor: 'text-blue-700 dark:text-white' },
    { label: 'Total Goals', value: totalGoals, bgColor: 'bg-green-100 dark:bg-green-900', textColor: 'text-green-700 dark:text-white' },
  ];

  return (
    <>
      <Card className="bg-white dark:bg-gray-800 shadow-lg">
        <CardHeader className="bg-yellow-100 dark:bg-yellow-900">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold flex items-center text-indigo-700 dark:text-white">
              <PieChart className="mr-2 h-5 w-5 dark:text-white" /> Financial Overview
            </h3>
            <div className="flex items-center dark: text-white">
              <ArrowUpDown className="mr-2 h-4 w-4 text-indigo-700 dark:text-indigo-300" />
              <Select onValueChange={handleCurrencyChange} defaultValue={selectedCurrency}>
                <SelectTrigger className="w-[100px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700">
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code} className="text-gray-900 dark:text-gray-100">
                      {currency.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {overviewItems.map((item, index) => (
                <div key={index} className={`${item.bgColor} rounded-lg p-4`}>
                  <p className={`text-sm ${item.textColor.replace('700', '600').replace('200', '300')} mb-1`}>{item.label}</p>
                  <p className={`text-lg sm:text-xl font-semibold ${item.textColor} break-all`}>
                    {formatCurrency(item.value, selectedCurrency)}
                  </p>
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-indigo-700 dark:text-white">Top Expense Categories</h4>
              {Object.keys(expensesByCategory).length > 0 ? (
                <ul className="space-y-2">
                  {Object.entries(expensesByCategory)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([category, amount], index) => (
                      <li key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="text-gray-700 dark:text-white truncate flex-1 mr-2">{category}</span>
                        <span className="text-red-500 dark:text-red-400 whitespace-nowrap text-right min-w-[100px]">
                          {formatCurrency(amount, selectedCurrency)}
                        </span>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">No expense data to display.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isBalanceModalOpen} onOpenChange={setIsBalanceModalOpen}>
        <DialogContent className="bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Enter Your Current Balance</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Please enter your current balance to calculate your financial overview.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBalanceSubmit}>
            <Input
              type="number"
              placeholder="Enter your current balance"
              value={userInputBalance}
              onChange={(e) => setUserInputBalance(e.target.value)}
              required
              className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <DialogFooter>
              <Button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700">Submit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FinancialOverview;