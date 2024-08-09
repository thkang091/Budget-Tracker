import React from 'react';
import { useFinanceContext } from '../contexts/FinanceContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const Home = () => {
  const { 
    getExpensesByCategory, 
    getExpensesByDate, 
    getTotalIncome, 
    getTotalExpenses 
  } = useFinanceContext();

  const expensesByCategory = getExpensesByCategory();
  const expensesByDate = getExpensesByDate();
  const totalIncome = getTotalIncome();
  const totalExpenses = getTotalExpenses();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const pieChartData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    name: category,
    value: amount
  }));

  const barChartData = Object.entries(expensesByDate).map(([date, amount]) => ({
    date,
    amount
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold mb-6">Financial Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Expenses by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Expenses Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="amount" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Income vs Expenses</h2>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-lg">Total Income: <span className="font-bold text-green-500">${totalIncome.toFixed(2)}</span></p>
            <p className="text-lg">Total Expenses: <span className="font-bold text-red-500">${totalExpenses.toFixed(2)}</span></p>
          </div>
          <div className="text-2xl font-bold">
            Balance: <span className={totalIncome - totalExpenses >= 0 ? "text-green-500" : "text-red-500"}>
              ${(totalIncome - totalExpenses).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;