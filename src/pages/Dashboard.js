import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useFinanceContext } from '../contexts/FinanceContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import { DollarSign, Briefcase, TrendingUp, Lightbulb, FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import FinancialSummary from '../components/FinancialSummary';
import Alert, {  AlertTitle, AlertDescription } from '../components/ui/Alert';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { 
    getFinancialData,
    getCategories,
    formatCurrency,
    currencies,
    predictFutureExpenses,
    getSavingSuggestions,
    getExpensesByCategory, 
    getTotalExpenses, 
    getRemainingBudget,
    getExpensesByMonth,
    getBudgetAdherence,
    budgets,
    goals,
    getInsights,
    getRecommendations,
    expenses,
    loading,
    error
  } = useFinanceContext();

  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date());
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [reportType, setReportType] = useState('monthly');
  const [selectedReport, setSelectedReport] = useState('spending');
  const [expandedSections, setExpandedSections] = useState({
    reportSettings: false,
    financialSummary: true,
    reportsAnalytics: true,
    predictions: false,
    suggestions: false,
  });
  const [exportStatus, setExportStatus] = useState({ type: '', message: '' });
  const [financialData, setFinancialData] = useState({});

  const categories = useMemo(() => getCategories() || [], [getCategories]);

  const fetchFinancialData = useCallback(async () => {
    const data = await getFinancialData(startDate, endDate, selectedCategories, selectedCurrency);
    setFinancialData(data);
  }, [getFinancialData, startDate, endDate, selectedCategories, selectedCurrency]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData, expenses]);

  const handleCategoryChange = useCallback((category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }, []);

  const handleExportPDF = () => {
    const exportData = {
      expenses: financialData.expenses || [],
      budgets: budgets,
      totalExpenses: getTotalExpenses(selectedCurrency),
      totalBudget: financialData.totalBudget || 0,
      expensesByCategory: getExpensesByCategory(selectedCurrency),
      savingsGoals: goals,
      insights: getInsights(),
      recommendations: getRecommendations()
    };
  
    const result = exportToPDF(exportData, selectedCurrency, startDate, endDate, reportType);
    setExportStatus(result);
  };
  
  const handleExportExcel = () => {
    const exportData = {
      expenses: financialData.expenses || [],
      budgets: budgets,
      totalExpenses: getTotalExpenses(selectedCurrency),
      totalBudget: financialData.totalBudget || 0,
      expensesByCategory: getExpensesByCategory(selectedCurrency),
      savingsGoals: goals,
      insights: getInsights(),
      recommendations: getRecommendations()
    };
  
    const result = exportToExcel(exportData, selectedCurrency, startDate, endDate, reportType);
    setExportStatus(result);
  };

  const expensesByCategory = useMemo(() => getExpensesByCategory(selectedCurrency) || {}, [getExpensesByCategory, selectedCurrency, expenses]);
  const totalExpenses = useMemo(() => getTotalExpenses(selectedCurrency), [getTotalExpenses, selectedCurrency, expenses]);
  const remainingBudget = useMemo(() => getRemainingBudget(selectedCurrency) || 0, [getRemainingBudget, selectedCurrency, expenses]);
  const expensesByMonth = useMemo(() => getExpensesByMonth(selectedCurrency) || {}, [getExpensesByMonth, selectedCurrency, expenses]);
  const budgetAdherence = useMemo(() => getBudgetAdherence(), [getBudgetAdherence, expenses, budgets]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const formatData = (data) => {
    return Object.entries(data).map(([key, value]) => ({ name: key, value }));
  };

  const pieChartData = useMemo(() => formatData(expensesByCategory), [expensesByCategory]);

  const barChartData = useMemo(() => {
    const budgetData = budgets.reduce((acc, budget) => {
      acc[budget.category] = Number(budget.amount);
      return acc;
    }, {});

    const expenseData = expensesByCategory;

    const categories = [...new Set([...Object.keys(budgetData), ...Object.keys(expenseData)])];

    return categories.map(category => ({
      name: category,
      budget: budgetData[category] || 0,
      expenses: expenseData[category] || 0
    }));
  }, [budgets, expensesByCategory]);

  const lineChartData = useMemo(() => formatData(expensesByMonth), [expensesByMonth]);

  const cards = [
    { title: 'Total Expenses', value: totalExpenses, icon: DollarSign, color: 'bg-red-500 dark:text-white' },
    { title: 'Total Budget', value: financialData.totalBudget || 0, icon: Briefcase, color: 'bg-blue-500 dark:text-white' },
    { title: 'Remaining Budget', value: remainingBudget, icon: TrendingUp, color: 'bg-green-500 dark:text-white' },
  ];

  const predictedExpenses = useMemo(() => predictFutureExpenses() || 0, [predictFutureExpenses]);
  const savingSuggestion = useMemo(() => getSavingSuggestions() || "No suggestions available at this time.", [getSavingSuggestions]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const SectionHeader = ({ title, section }) => (
    <div 
      className="flex justify-between items-center cursor-pointer bg-gray-100 dark:bg-gray-700 p-4 rounded-t-lg"
      onClick={() => toggleSection(section)}
    >
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h2>
      {expandedSections[section] ? <ChevronUp /> : <ChevronDown />}
    </div>
  );

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-6 p-6 bg-gray-100 dark:bg-gray-900 min-h-screen transition-all duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white">Welcome, {currentUser?.displayName || 'User'}</h1>
        <p className="text-gray-600 dark:text-gray-400">Here's your financial overview</p>
      </div>
      
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        <div className="flex items-center space-x-4">
          <div>
            <label htmlFor="currency" className="mr-2 text-gray-700 dark:text-gray-300">Currency:</label>
            <select
              id="currency"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="p-2 border rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {currencies.map(c => (
                <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex space-x-2">
          <button onClick={handleExportPDF} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors flex items-center">
            <FileText className="mr-2" size={18} />
            Export PDF
          </button>
          <button onClick={handleExportExcel} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors flex items-center">
            <Download className="mr-2" size={18} />
            Export Excel
          </button>
        </div>
      </div>

      {exportStatus.message && (
        <Alert variant={exportStatus.type === 'success' ? 'success' : 'destructive'}>
          <AlertTitle>{exportStatus.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
          <AlertDescription>{exportStatus.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {cards.map((card, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center space-x-4 hover:shadow-lg transition-shadow">
            <div className={`p-3 rounded-full ${card.color}`}>
              <card.icon size={24} className="text-white" />
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{card.title}</p>
              <p className="text-2xl font-semibold dark:text-white">{formatCurrency(card.value, selectedCurrency)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
        <SectionHeader title="Report Settings" section="reportSettings" />
        {expandedSections.reportSettings && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                <DatePicker
                  selected={startDate}
                  onChange={date => setStartDate(date)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                <DatePicker
                  selected={endDate}
                  onChange={date => setEndDate(date)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categories</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedCategories.includes(category)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
        <SectionHeader title="Financial Summary" section="financialSummary" />
        {expandedSections.financialSummary && (
          <div className="p-6">
            <FinancialSummary data={financialData} currency={selectedCurrency} />
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
        <SectionHeader title="Reports and Analytics" section="reportsAnalytics" />
        {expandedSections.reportsAnalytics && (
          <div className="p-6">
            <div className="mb-4">
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="p-2 border rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="spending">Spending by Category</option>
                <option value="budget">Budget vs Expenses</option>
                <option value="trend">Spending Trend</option>
              </select>
            </div>
            <div className="h-80">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                </div>
              ) : (
<>
                  {selectedReport === 'spending' && pieChartData.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
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
                        <Tooltip formatter={(value) => formatCurrency(value, selectedCurrency)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {selectedReport === 'budget' && barChartData.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value, selectedCurrency)} />
                        <Legend />
                        <Bar dataKey="budget" fill="#8884d8" name="Budget" />
                        <Bar dataKey="expenses" fill="#82ca9d" name="Expenses" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {selectedReport === 'trend' && lineChartData.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineChartData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value, selectedCurrency)} />
                        <Legend />
                        <Line type="monotone" dataKey="value" stroke="#8884d8" name="Expenses" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                  {((selectedReport === 'spending' && pieChartData.length === 0) ||
                    (selectedReport === 'budget' && barChartData.length === 0) ||
                    (selectedReport === 'trend' && lineChartData.length === 0)) && (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                      No data available for the selected report type.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <SectionHeader title="Expense Prediction" section="predictions" />
          {expandedSections.predictions && (
            <div className="p-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="mr-2 text-blue-500" />
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Based on your recent spending habits, we predict your expenses next month will be around:
                </p>
              </div>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                {formatCurrency(predictedExpenses, selectedCurrency)}
              </p>
              {financialData.predictedExpensesByCategory && (
                <div className="mt-4">
                  <h3 className="text-xl font-semibold mb-2">Breakdown by Category</h3>
                  <ul className="space-y-2">
                    {Object.entries(financialData.predictedExpensesByCategory).map(([category, amount]) => (
                      <li key={category} className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">{category}</span>
                        <span className="font-medium">{formatCurrency(amount, selectedCurrency)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <SectionHeader title="Smart Suggestions" section="suggestions" />
          {expandedSections.suggestions && (
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Lightbulb className="mr-2 text-yellow-500" />
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {savingSuggestion}
                </p>
              </div>
              {financialData.potentialSavings && (
                <div className="mt-4">
                  <h3 className="text-xl font-semibold mb-2">Potential Savings</h3>
                  <ul className="space-y-2">
                    {Object.entries(financialData.potentialSavings).map(([category, amount]) => (
                      <li key={category} className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">{category}</span>
                        <span className="font-medium text-green-500">{formatCurrency(amount, selectedCurrency)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {financialData.recentTransactions && financialData.recentTransactions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Recent Transactions</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {financialData.recentTransactions.map((transaction, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(transaction.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{transaction.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatCurrency(transaction.amount, selectedCurrency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;