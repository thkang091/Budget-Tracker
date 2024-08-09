import React, { useState, useEffect } from 'react';
import { useFinanceContext } from '../contexts/FinanceContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Wallet, ArrowUpRight, ArrowDownRight, Filter, RefreshCw, ChevronDown, ChevronUp, Link, Unlink } from "lucide-react";

const TransactionsComponent = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [connectedBanks, setConnectedBanks] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const { getRecentTransactions, formatCurrency, getCategories, connectBankAccount, disconnectBankAccount, getConnectedBanks } = useFinanceContext();

  useEffect(() => {
    fetchTransactions();
    fetchConnectedBanks();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const recentTransactions = await getRecentTransactions(100);
      setTransactions(recentTransactions);
      setFilteredTransactions(recentTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConnectedBanks = async () => {
    try {
      const banks = await getConnectedBanks();
      setConnectedBanks(banks);
    } catch (error) {
      console.error("Error fetching connected banks:", error);
    }
  };

  useEffect(() => {
    const filtered = transactions.filter(transaction => 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (categoryFilter === '' || transaction.category === categoryFilter) &&
      (!dateRange.from || new Date(transaction.date) >= new Date(dateRange.from)) &&
      (!dateRange.to || new Date(transaction.date) <= new Date(dateRange.to))
    );
    setFilteredTransactions(filtered);
  }, [searchTerm, categoryFilter, dateRange, transactions]);

  const totalIncome = filteredTransactions.reduce((sum, transaction) => 
    transaction.amount > 0 ? sum + transaction.amount : sum, 0
  );

  const totalExpenses = filteredTransactions.reduce((sum, transaction) => 
    transaction.amount < 0 ? sum + Math.abs(transaction.amount) : sum, 0
  );

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleConnectBank = async () => {
    setIsConnecting(true);
    try {
      await connectBankAccount();
      await fetchConnectedBanks();
      await fetchTransactions();
    } catch (error) {
      console.error("Error connecting bank account:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectBank = async (bankId) => {
    try {
      await disconnectBankAccount(bankId);
      await fetchConnectedBanks();
      await fetchTransactions();
    } catch (error) {
      console.error("Error disconnecting bank account:", error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="space-y-6 p-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <Wallet className="mr-2" /> Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button 
              variant="outline" 
              className="flex items-center"
              onClick={() => setIsFilterVisible(!isFilterVisible)}
            >
              <Filter className="mr-2" /> Filters
            </Button>
            <Button onClick={fetchTransactions} className="flex items-center">
              <RefreshCw className="mr-2" /> Refresh
            </Button>
            <Button onClick={handleConnectBank} disabled={isConnecting} className="flex items-center">
              <Link className="mr-2" /> {isConnecting ? 'Connecting...' : 'Connect Bank'}
            </Button>
          </div>
          
          {connectedBanks.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Connected Banks:</h3>
              <div className="flex flex-wrap gap-2">
                {connectedBanks.map(bank => (
                  <Button
                    key={bank.id}
                    variant="outline"
                    className="flex items-center"
                    onClick={() => handleDisconnectBank(bank.id)}
                  >
                    {bank.name} <Unlink className="ml-2" size={16} />
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {isFilterVisible && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 space-y-4"
            >
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {getCategories().map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex space-x-2">
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  placeholder="From Date"
                />
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="To Date"
                />
              </div>
            </motion.div>
          )}

          <motion.div 
            className="flex justify-between mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="w-[48%]">
              <CardContent className="pt-6">
                <motion.div 
                  className="text-2xl font-semibold text-green-600 flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowUpRight className="mr-2" />
                  {formatCurrency(totalIncome)}
                </motion.div>
                <p className="text-sm text-gray-500">Total Income</p>
              </CardContent>
            </Card>
            <Card className="w-[48%]">
              <CardContent className="pt-6">
                <motion.div 
                  className="text-2xl font-semibold text-red-600 flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowDownRight className="mr-2" />
                  {formatCurrency(totalExpenses)}
                </motion.div>
                <p className="text-sm text-gray-500">Total Expenses</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <Table>
            <TableHeader>
              <TableRow>
                {['Date', 'Description', 'Amount', 'Category', 'Bank'].map((header) => (
                  <TableHead key={header} onClick={() => handleSort(header.toLowerCase())}>
                    <div className="flex items-center cursor-pointer">
                      {header}
                      {sortConfig.key === header.toLowerCase() && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="ml-1" /> : <ChevronDown className="ml-1" />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {sortedTransactions.map((transaction) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(Math.abs(transaction.amount))}
                    </TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>{transaction.bankName || 'Manual Entry'}</TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TransactionsComponent;