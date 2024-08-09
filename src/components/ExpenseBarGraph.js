import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFinanceContext } from '../contexts/FinanceContext';

const ExpenseBarGraph = () => {
  const { expenses } = useFinanceContext();

  const dailyExpenses = expenses ? expenses.reduce((acc, expense) => {
    const date = expense.date.split('T')[0];
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += parseFloat(expense.amount);
    return acc;
  }, {}) : {};

  const data = Object.entries(dailyExpenses).map(([date, amount]) => ({
    date,
    amount,
  }));

  return (
    <div className="h-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="amount" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpenseBarGraph;