import React, { useState, useEffect, useMemo } from 'react';
import { useFinanceContext } from '../contexts/FinanceContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import Alert, {AlertDescription, AlertTitle } from '../components/ui/Alert';
import { Loader2 } from 'lucide-react';

const ReportsAndAnalytics = () => {
  const { 
    getExpensesByCategory,
    getTotalExpenses,
    getBudgetAdherence,
    getExpensesByMonth,
    formatCurrency,
    budgets,
    expenses,
    loading,
    error
  } = useFinanceContext();

  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const expensesByCategory = useMemo(() => getExpensesByCategory(selectedCurrency), [getExpensesByCategory, selectedCurrency]);
  const totalExpenses = useMemo(() => getTotalExpenses(selectedCurrency), [getTotalExpenses, selectedCurrency]);
  const budgetAdherence = useMemo(() => getBudgetAdherence(), [getBudgetAdherence]);
  const expensesByMonth = useMemo(() => getExpensesByMonth(selectedCurrency), [getExpensesByMonth, selectedCurrency]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const formatData = (data) => {
    return Object.entries(data).map(([key, value]) => ({ name: key, value }));
  };

  const BudgetVsExpenseChart = () => {
    const data = budgetAdherence.map(item => ({
      category: item.category,
      budget: item.budgeted,
      expense: item.spent
    }));

    return (
      <Card className="mt-6">
        <CardHeader>Budget vs Expense Comparison</CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="budget" fill="#8884d8" name="Budget" />
              <Bar dataKey="expense" fill="#82ca9d" name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const ExpensePieChart = () => (
    <Card className="mt-6">
      <CardHeader>Expenses by Category</CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={formatData(expensesByCategory)}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {formatData(expensesByCategory).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const ExpenseOverTimeChart = () => (
    <Card className="mt-6">
      <CardHeader>Expenses Over Time</CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formatData(expensesByMonth)}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Reports and Analytics</h1>
      <div className="flex space-x-4 mb-6">
        <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="GBP">GBP</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="quarter">Quarter</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardHeader>Summary</CardHeader>
        <CardContent>
          <p>Total Expenses: {formatCurrency(totalExpenses, selectedCurrency)}</p>
          <p>Total Budget: {formatCurrency(budgets.reduce((sum, budget) => sum + Number(budget.amount), 0), selectedCurrency)}</p>
        </CardContent>
      </Card>
      <BudgetVsExpenseChart />
      <ExpensePieChart />
      <ExpenseOverTimeChart />
    </div>
  );
};

export default ReportsAndAnalytics;