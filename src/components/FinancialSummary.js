import React, { useState, useMemo, useCallback } from 'react';
import { useFinanceContext } from '../contexts/FinanceContext';
import { DollarSign, CreditCard, PieChart, ArrowUpDown, Calendar, Filter, X, Edit, Save, Trash2, Check, Plus } from 'lucide-react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardHeader, CardContent, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";

const FinancialSummary = () => {
  const { 
    budgets,
    expenses,
    getTotalExpenses,
    getRemainingBudget,
    formatCurrency,
    updateBudget,
    updateExpense,
    deleteBudget,
    deleteExpense,
    addBudget,
    getBudgetPeriods,
    currencies,
    categories,
  } = useFinanceContext();

  const [activeView, setActiveView] = useState('overview');
  const [sortColumn, setSortColumn] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filters, setFilters] = useState({
    category: '',
    currency: 'all',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [editedValues, setEditedValues] = useState({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    category: '',
    subCategory: '',
    amount: '',
    currency: 'USD',
    budgetPeriod: 'Monthly',
    notes: '',
    startDate: '',
    endDate: '',
  });

  const usedCurrencies = useMemo(() => [...new Set([
    ...expenses.map(e => e.currency),
    ...budgets.map(b => b.currency)
  ])], [expenses, budgets]);

  const overviewData = useMemo(() => usedCurrencies.map(currency => ({
    currency,
    totalBudget: budgets
      .filter(b => b.currency === currency)
      .reduce((sum, b) => sum + Number(b.amount), 0),
    totalExpenses: getTotalExpenses(currency),
    remainingBudget: getRemainingBudget(currency)
  })), [usedCurrencies, budgets, getTotalExpenses, getRemainingBudget]);

  const formatDate = (date) => {
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    return date;
  };

  const sortData = useCallback((data, column) => {
    return [...data].sort((a, b) => {
      const aValue = column.includes('.') ? a[column.split('.')[0]][column.split('.')[1]] : a[column];
      const bValue = column.includes('.') ? b[column.split('.')[0]][column.split('.')[1]] : b[column];
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [sortOrder]);

  const handleSort = (column) => {
    setSortOrder(sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc');
    setSortColumn(column);
  };

  const applyFilters = useCallback((item) => {
    return (
      (!filters.category || item.category.toLowerCase().includes(filters.category.toLowerCase())) &&
      (filters.currency === 'all' || !filters.currency || item.currency === filters.currency) &&
      (!filters.dateFrom || new Date(item.startDate) >= new Date(filters.dateFrom)) &&
      (!filters.dateTo || new Date(item.endDate) <= new Date(filters.dateTo)) &&
      (!filters.amountMin || item.amount >= Number(filters.amountMin)) &&
      (!filters.amountMax || item.amount <= Number(filters.amountMax))
    );
  }, [filters]);

  const filteredBudgets = useMemo(() => 
    budgets.filter(budget => applyFilters(budget)),
    [budgets, applyFilters]
  );

  const filteredExpenses = useMemo(() => 
    expenses.filter(expense => applyFilters(expense)),
    [expenses, applyFilters]
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      currency: 'all',
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: '',
    });
  };

  const handleEdit = (id, item) => {
    setEditingId(id);
    setEditedValues(item);
  };

  const handleSave = (id) => {
    if (activeView === 'budgets') {
      updateBudget(id, { ...editedValues, amount: parseFloat(editedValues.amount) });
    } else {
      updateExpense(id, { ...editedValues, amount: parseFloat(editedValues.amount) });
    }
    setEditingId(null);
  };

  const handleDelete = (id) => {
    if (activeView === 'budgets') {
      deleteBudget(id);
    } else {
      deleteExpense(id);
    }
  };

  const handleAddNew = () => {
    const newItemWithParsedAmount = { ...newItem, amount: parseFloat(newItem.amount) };
    if (activeView === 'budgets') {
      addBudget(newItemWithParsedAmount);
    } else {
      updateExpense(Date.now().toString(), newItemWithParsedAmount);
    }
    setIsAddDialogOpen(false);
    setNewItem({
      category: '',
      subCategory: '',
      amount: '',
      currency: 'USD',
      budgetPeriod: 'Monthly',
      notes: '',
      startDate: '',
      endDate: '',
    });
  };

  const TableHeader = ({ columns }) => (
    <thead className="bg-gray-50 dark:bg-gray-700">
      <tr>
        {columns.map(column => (
          <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            {column} <ArrowUpDown onClick={() => handleSort(column.toLowerCase())} className="inline cursor-pointer" size={14} />
          </th>
        ))}
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
      </tr>
    </thead>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          onClick={() => setActiveView('overview')}
          variant={activeView === 'overview' ? 'default' : 'outline'}
          className="text-black dark:text-white"
        >
          <DollarSign className="mr-2" size={18} />
          Overview
        </Button>
        <Button
          onClick={() => setActiveView('expenses')}
          variant={activeView === 'expenses' ? 'default' : 'outline'}
          className="text-black dark:text-white"
        >
          <CreditCard className="mr-2" size={18} />
          Expenses
        </Button>
        <Button
          onClick={() => setActiveView('budgets')}
          variant={activeView === 'budgets' ? 'default' : 'outline'}
          className="text-black dark:text-white"
        >
          <PieChart className="mr-2" size={18} />
          Budgets
        </Button>
      </div>

      {activeView === 'overview' && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {overviewData.map(({ currency, totalBudget, totalExpenses, remainingBudget }) => (
            <Card key={currency} className="dark:bg-gray-700">
              <CardHeader>
                <CardTitle className="text-black dark:text-white">{currency}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-1 text-black dark:text-gray-300">Budget: {formatCurrency(totalBudget, currency)}</p>
                <p className="text-sm mb-1 text-black dark:text-gray-300">Spent: {formatCurrency(totalExpenses, currency)}</p>
                <p className={`text-sm font-bold ${remainingBudget >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  Remaining: {formatCurrency(remainingBudget, currency)}
                </p>
                <div className="mt-2 bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${totalExpenses > totalBudget ? 'bg-red-600' : 'bg-blue-600'}`} 
                    style={{ width: `${Math.min((totalExpenses / totalBudget) * 100, 100)}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(activeView === 'expenses' || activeView === 'budgets') && (
        <div>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="text"
              placeholder="Filter by category"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="bg-white dark:bg-gray-700 text-black dark:text-white"
            />
           <Select value={filters.currency} onValueChange={(value) => handleFilterChange('currency', value)}>
              <SelectTrigger className="bg-white dark:bg-gray-700 text-black dark:text-white">
                <SelectValue placeholder="Select Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Currencies</SelectItem>
                {usedCurrencies.map(currency => (
                  <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Min Amount"
                value={filters.amountMin}
                onChange={(e) => handleFilterChange('amountMin', e.target.value)}
                className="w-1/2 bg-white dark:bg-gray-700 text-black dark:text-white"
              />
              <Input
                type="number"
                placeholder="Max Amount"
                value={filters.amountMax}
                onChange={(e) => handleFilterChange('amountMax', e.target.value)}
                className="w-1/2 bg-white dark:bg-gray-700 text-black dark:text-white"
              />
            </div>
          </div>
          {activeView === 'expenses' && (
            <div className="mb-4 flex space-x-4">
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="bg-white dark:bg-gray-700 text-black dark:text-white"
              />
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="bg-white dark:bg-gray-700 text-black dark:text-white"
              />
            </div>
          )}
          <div className="mb-4 flex justify-between">
            <Button onClick={clearFilters} variant="destructive" className="text-white">
              Clear Filters <X size={18} className="ml-2" />
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              {activeView === 'budgets' ? (
                <>
                  <TableHeader columns={['Category', 'Sub-Category', 'Amount', 'Currency', 'Budget Period', 'Start Date', 'End Date', 'Notes']} />
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {sortData(filteredBudgets, sortColumn).map((budget) => (
                      <tr key={budget.id} className="text-black dark:text-white">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === budget.id ? (
                            <Input
                              value={editedValues.category}
                              onChange={(e) => setEditedValues({ ...editedValues, category: e.target.value })}
                              className="bg-white dark:bg-gray-700 text-black dark:text-white"
                            />
                          ) : budget.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === budget.id ? (
                            <Input
                              value={editedValues.subCategory}
                              onChange={(e) => setEditedValues({ ...editedValues, subCategory: e.target.value })}
                              className="bg-white dark:bg-gray-700 text-black dark:text-white"
                            />
                          ) : budget.subCategory || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === budget.id ? (
                            <Input
                              type="number"
                              value={editedValues.amount}
                              onChange={(e) => setEditedValues({ ...editedValues, amount: e.target.value })}
                              className="bg-white dark:bg-gray-700 text-black dark:text-white"
                            />
                          ) : formatCurrency(budget.amount, budget.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === budget.id ? (
                            <Select
                              value={editedValues.currency}
                              onValueChange={(value) => setEditedValues({ ...editedValues, currency: value })}
                            >
<SelectTrigger className="w-[180px] bg-white dark:bg-gray-700 text-black dark:text-white">
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                              <SelectContent>
                                {currencies.map(currency => (
                                  <SelectItem key={currency.code} value={currency.code}>{currency.code}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : budget.currency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === budget.id ? (
                            <Select
                              value={editedValues.budgetPeriod}
                              onValueChange={(value) => setEditedValues({ ...editedValues, budgetPeriod: value })}
                            >
                              <SelectTrigger className="w-[180px] bg-white dark:bg-gray-700 text-black dark:text-white">
                                <SelectValue placeholder="Select budget period" />
                              </SelectTrigger>
                              <SelectContent>
                                {getBudgetPeriods().map(period => (
                                  <SelectItem key={period} value={period}>{period}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : budget.budgetPeriod}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === budget.id ? (
                            <Input
                              type="date"
                              value={editedValues.startDate}
                              onChange={(e) => setEditedValues({ ...editedValues, startDate: e.target.value })}
                              className="bg-white dark:bg-gray-700 text-black dark:text-white"
                            />
                          ) : formatDate(budget.startDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === budget.id ? (
                            <Input
                              type="date"
                              value={editedValues.endDate}
                              onChange={(e) => setEditedValues({ ...editedValues, endDate: e.target.value })}
                              className="bg-white dark:bg-gray-700 text-black dark:text-white"
                            />
                          ) : formatDate(budget.endDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === budget.id ? (
                            <Input
                              value={editedValues.notes}
                              onChange={(e) => setEditedValues({ ...editedValues, notes: e.target.value })}
                              className="bg-white dark:bg-gray-700 text-black dark:text-white"
                            />
                          ) : budget.notes || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {editingId === budget.id ? (
                            <Button onClick={() => handleSave(budget.id)} size="sm" className="text-white">
                              <Check size={16} />
                            </Button>
                          ) : (
                            <Button onClick={() => handleEdit(budget.id, budget)} size="sm" variant="outline" className="text-black dark:text-white">
                              <Edit size={16} />
                            </Button>
                          )}
                          <Button onClick={() => handleDelete(budget.id)} size="sm" variant="destructive" className="ml-2 text-white">
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              ) : (
                <>
                  <TableHeader columns={['Date', 'Description', 'Category', 'Amount', 'Currency', 'Paid To']} />
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {sortData(filteredExpenses, sortColumn).map((expense) => (
                      <tr key={expense.id} className="text-black dark:text-white">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === expense.id ? (
                            <Input
                              type="date"
                              value={editedValues.date}
                              onChange={(e) => setEditedValues({ ...editedValues, date: e.target.value })}
                              className="bg-white dark:bg-gray-700 text-black dark:text-white"
                            />
                          ) : formatDate(expense.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === expense.id ? (
                            <Input
                              value={editedValues.description}
                              onChange={(e) => setEditedValues({ ...editedValues, description: e.target.value })}
                              className="bg-white dark:bg-gray-700 text-black dark:text-white"
                            />
                          ) : expense.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === expense.id ? (
                            <Input
                              value={editedValues.category}
                              onChange={(e) => setEditedValues({ ...editedValues, category: e.target.value })}
                              className="bg-white dark:bg-gray-700 text-black dark:text-white"
                            />
                          ) : expense.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === expense.id ? (
                            <Input
                              type="number"
                              value={editedValues.amount}
                              onChange={(e) => setEditedValues({ ...editedValues, amount: e.target.value })}
                              className="bg-white dark:bg-gray-700 text-black dark:text-white"
                            />
                          ) : formatCurrency(expense.amount, expense.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === expense.id ? (
                            <Select
                              value={editedValues.currency}
                              onValueChange={(value) => setEditedValues({ ...editedValues, currency: value })}
                            >
                              <SelectTrigger className="w-[180px] bg-white dark:bg-gray-700 text-black dark:text-white">
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                              <SelectContent>
                                {currencies.map(currency => (
                                  <SelectItem key={currency.code} value={currency.code}>{currency.code}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : expense.currency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === expense.id ? (
                            <Input
                              value={editedValues.paidTo}
                              onChange={(e) => setEditedValues({ ...editedValues, paidTo: e.target.value })}
                              className="bg-white dark:bg-gray-700 text-black dark:text-white"
                            />
                          ) : expense.paidTo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {editingId === expense.id ? (
                            <Button onClick={() => handleSave(expense.id)} size="sm" className="text-white">
                              <Check size={16} />
                            </Button>
                          ) : (
                            <Button onClick={() => handleEdit(expense.id, expense)} size="sm" variant="outline" className="text-black dark:text-white">
                              <Edit size={16} />
                            </Button>
                          )}
                          <Button onClick={() => handleDelete(expense.id)} size="sm" variant="destructive" className="ml-2 text-white">
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
          </div>
        </div>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-white dark:bg-gray-800 text-black dark:text-white">
          <DialogHeader>
            <DialogTitle>Add {activeView === 'budgets' ? 'Budget' : 'Expense'}</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Fill in the details to add a new {activeView === 'budgets' ? 'budget' : 'expense'} item.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select
                value={newItem.category}
                onValueChange={(value) => setNewItem({ ...newItem, category: value })}
              >
                <SelectTrigger className="col-span-3 bg-white dark:bg-gray-700 text-black dark:text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {activeView === 'budgets' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subCategory" className="text-right">
                  Sub-Category
                </Label>
                <Input
                  id="subCategory"
                  value={newItem.subCategory}
                  onChange={(e) => setNewItem({ ...newItem, subCategory: e.target.value })}
                  className="col-span-3 bg-white dark:bg-gray-700 text-black dark:text-white"
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                value={newItem.amount}
                onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                className="col-span-3 bg-white dark:bg-gray-700 text-black dark:text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right">
                Currency
              </Label>
              <Select
                value={newItem.currency}
                onValueChange={(value) => setNewItem({ ...newItem, currency: value })}
              >
                <SelectTrigger className="col-span-3 bg-white dark:bg-gray-700 text-black dark:text-white">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map(currency => (
                    <SelectItem key={currency.code} value={currency.code}>{currency.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {activeView === 'budgets' ? (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="budgetPeriod" className="text-right">
                    Budget Period
                  </Label>
                  <Select
                    value={newItem.budgetPeriod}
                    onValueChange={(value) => setNewItem({ ...newItem, budgetPeriod: value })}
                  >
                    <SelectTrigger className="col-span-3 bg-white dark:bg-gray-700 text-black dark:text-white">
                      <SelectValue placeholder="Select budget period" />
                    </SelectTrigger>
                    <SelectContent>
                      {getBudgetPeriods().map(period => (
                        <SelectItem key={period} value={period}>{period}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate" className="text-right">
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newItem.startDate}
                    onChange={(e) => setNewItem({ ...newItem, startDate: e.target.value })}
                    className="col-span-3 bg-white dark:bg-gray-700 text-black dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endDate" className="text-right">
                    End Date
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newItem.endDate}
                    onChange={(e) => setNewItem({ ...newItem, endDate: e.target.value })}
                    className="col-span-3 bg-white dark:bg-gray-700 text-black dark:text-white"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={newItem.date}
                    onChange={(e) => setNewItem({ ...newItem, date: e.target.value })}
                    className="col-span-3 bg-white dark:bg-gray-700 text-black dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="paidTo" className="text-right">
                    Paid To
                  </Label>
                  <Input
                    id="paidTo"
                    value={newItem.paidTo}
                    onChange={(e) => setNewItem({ ...newItem, paidTo: e.target.value })}
                    className="col-span-3 bg-white dark:bg-gray-700 text-black dark:text-white"
                  />
                </div>
              </>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Input
                id="notes"
                value={newItem.notes}
                onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                className="col-span-3 bg-white dark:bg-gray-700 text-black dark:text-white"
              />
            </div>
          </div>
          <DialogFooter>
          <Button onClick={handleAddNew} className="text-white">Add {activeView === 'budgets' ? 'Budget' : 'Expense'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancialSummary;