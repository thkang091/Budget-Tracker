import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, addDoc, deleteDoc, query, onSnapshot, Timestamp, orderBy, getDocs, doc, getDoc, limit, updateDoc, where } from 'firebase/firestore';
import { db, auth } from '../firebase';

const FinanceContext = createContext();

export const useFinanceContext = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinanceContext must be used within a FinanceProvider');
  }
  return context;
};

export const FinanceProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState(['Food', 'Transportation', 'Entertainment', 'Bills', 'Other']);
  const [income, setIncome] = useState([]);
  const [goals, setGoals] = useState([]);
  const [savings, setSavings] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [incomeSources, setIncomeSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectedAccounts, setConnectedAccounts] = useState([]);

  const currencies = [
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
    { code: 'JPY', symbol: '¥' },
    { code: 'CAD', symbol: 'C$' },
    { code: 'AUD', symbol: 'A$' },
    { code: 'CHF', symbol: 'CHF' },
    { code: 'CNY', symbol: '¥' },
    { code: 'INR', symbol: '₹' },
    { code: 'KRW', symbol: '₩' },
  ];

  const exchangeRates = {
    USD: 1,
    EUR: 0.85,
    GBP: 0.73,
    JPY: 110.33,
    CAD: 1.25,
    AUD: 1.34,
    CHF: 0.92,
    CNY: 6.47,
    INR: 74.38,
    KRW: 1136.93,
  };

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const expensesRef = collection(db, 'expenses');
        const q = query(expensesRef, orderBy('date', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const expensesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date.toDate()
          }));
          setExpenses(expensesData);
          setLoading(false);
        }, (err) => {
          console.error("Error in expenses listener:", err);
          setError("Failed to update expenses in real-time. Please refresh the page.");
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error("Error fetching expenses:", err);
        setError("Failed to fetch expenses. Please try again later.");
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);


  useEffect(() => {
    const fetchCategories = async () => {
      const userDoc = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(userDoc);
      if (docSnap.exists() && docSnap.data().categories) {
        setCategories(docSnap.data().categories);
      }
      setLoading(false);
    };

    if (auth.currentUser) {
      fetchCategories();
    }
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};
  const fetchBudgets = async () => {
    if (auth.currentUser) {
      try {
        const budgetsRef = collection(db, 'budgets');
        const q = query(budgetsRef, where('userId', '==', auth.currentUser.uid));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const budgetsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log("Fetched budgets:", budgetsData);
          setBudgets(budgetsData);
        }, (error) => {
          console.error("Error fetching budgets:", error);
          setError("Failed to fetch budgets in real-time. Please refresh the page.");
        });
      } catch (error) {
        console.error("Error setting up budgets listener:", error);
        setError("Failed to set up budgets listener. Please try again later.");
      }
    }
  };

  fetchBudgets();

  return () => unsubscribe();
}, [auth.currentUser]);

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const addExpenseToState = (expense) => {
    setExpenses(prev => [...prev, { ...expense, id: Date.now() }]);
  };

  const addIncome = async (incomeData) => {
    try {
      if (!auth.currentUser) {
        throw new Error("No authenticated user");
      }
      const incomeRef = collection(db, 'income');
      const docRef = await addDoc(incomeRef, {
        ...incomeData,
        userId: auth.currentUser.uid,
        createdAt: Timestamp.now(),
        date: Timestamp.fromDate(new Date(incomeData.date))
      });
      const newIncome = { id: docRef.id, ...incomeData };
      setIncome(prevIncome => [...prevIncome, newIncome]);
      return newIncome;
    } catch (error) {
      console.error("Error adding income:", error);
      throw error;
    }
  };
  
  
  const predictIncome = (incomeSources, months = 3) => {
    const now = new Date();
    const predictedIncome = Array(months).fill().map((_, index) => {
      const month = new Date(now.getFullYear(), now.getMonth() + index, 1);
      const totalIncome = incomeSources.reduce((sum, income) => {
        if (income.frequency === 'monthly') {
          return sum + Number(income.amount);
        } else if (income.frequency === 'annually') {
          return sum + (Number(income.amount) / 12);
        }
        // Add more conditions for other frequencies if needed
        return sum;
      }, 0);
      return {
        month: month.toLocaleString('default', { month: 'long', year: 'numeric' }),
        amount: totalIncome
      };
    });
    return predictedIncome;
  };

  const estimateTax = (income, taxRate = 0.2) => {
    return income * taxRate;
  };

  const getExchangeRate = (fromCurrency, toCurrency) => {
    // This is a simplified version. In a real app, you'd want to fetch current rates from an API
    return exchangeRates[toCurrency] / exchangeRates[fromCurrency];
  };

  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };


  const addIncomeCategory = async (newCategory) => {
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      let incomeCategories = userDoc.data().incomeCategories || [];
      incomeCategories.push(newCategory);
      await updateDoc(userRef, { incomeCategories });
      return newCategory;
    } catch (error) {
      console.error("Error adding income category:", error);
      throw error;
    }
  };

  const generateIncomeReport = async (incomeData, currency) => {
    // This is a placeholder function. In a real app, you'd generate a more comprehensive report
    const totalIncome = incomeData.reduce((sum, income) => sum + Number(income.amount), 0);
    const report = {
      totalIncome: formatCurrency(totalIncome, currency),
      incomeBySource: incomeData.reduce((acc, income) => {
        acc[income.source] = (acc[income.source] || 0) + Number(income.amount);
        return acc;
      }, {}),
      averageIncome: formatCurrency(totalIncome / incomeData.length, currency),
      reportGenerated: new Date().toISOString()
    };
    return report;
  };





 
  const updateExpense = async (expenseId, updatedExpense) => {
    console.log('updateExpense called with:', expenseId, updatedExpense);
    try {
      const expenseRef = doc(db, 'expenses', expenseId);
      
      // Ensure the date is a Firestore Timestamp
      const firestoreDate = updatedExpense.date instanceof Date 
        ? Timestamp.fromDate(updatedExpense.date) 
        : Timestamp.fromDate(new Date(updatedExpense.date));

      const expenseToUpdate = {
        ...updatedExpense,
        date: firestoreDate,
        amount: Number(updatedExpense.amount), // Ensure amount is a number
        updatedAt: Timestamp.now()
      };

      console.log('Updating Firestore with:', expenseToUpdate);
      await updateDoc(expenseRef, expenseToUpdate);
      
      // Update local state
      setExpenses(prevExpenses => 
        prevExpenses.map(expense => 
          expense.id === expenseId 
            ? { ...expense, ...updatedExpense, date: new Date(updatedExpense.date) } 
            : expense
        )
      );
      
      console.log('Expense updated successfully');
      return { id: expenseId, ...updatedExpense };
    } catch (error) {
      console.error("Error updating expense:", error);
      throw error;
    }
  };

  const addCategory = async (newCategory) => {
    if (!categories.includes(newCategory)) {
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        categories: updatedCategories
      });
    }
  };

  const removeCategory = async (categoryToRemove) => {
    if (categories.length > 1) {
      const updatedCategories = categories.filter(c => c !== categoryToRemove);
      setCategories(updatedCategories);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        categories: updatedCategories
      });
    }
  };

  const editCategory = async (oldCategory, newCategory) => {
    if (oldCategory !== newCategory && !categories.includes(newCategory)) {
      const updatedCategories = categories.map(c => c === oldCategory ? newCategory : c);
      setCategories(updatedCategories);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        categories: updatedCategories
      });
    }
  };

  const deleteExpense = async (expenseId) => {
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
      setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== expenseId));
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  };


 
  const getTotalExpenses = (targetCurrency = 'USD') => {
    return expenses.reduce((total, expense) => {
      const convertedAmount = convertCurrency(Number(expense.amount), expense.currency, targetCurrency);
      return total + convertedAmount;
    }, 0);
  };


  useEffect(() => {
    const fetchIncome = async () => {
      if (auth.currentUser) {
        const incomeRef = collection(db, 'income');
        const q = query(
          incomeRef,
          where('userId', '==', auth.currentUser.uid),
          orderBy('date', 'desc')
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const incomeData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date.toDate()
          }));
          setIncome(incomeData);
        }, (error) => {
          console.error("Error fetching income:", error);
          setError("Failed to fetch income in real-time. Please refresh the page.");
        });

        return () => unsubscribe();
      }
    };
    fetchIncome();
  }, [auth.currentUser]);



  const fetchIncomeSources = useCallback(async () => {
    if (auth.currentUser) {
      try {
        const incomeSourcesRef = collection(db, 'incomeSources');
        const q = query(
          incomeSourcesRef,
          where('userId', '==', auth.currentUser.uid),
          orderBy('date', 'desc')
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const incomeData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date.toDate()
          }));
          setIncomeSources(incomeData);
        }, (error) => {
          console.error("Error fetching income sources:", error);
          setError("Failed to fetch income sources in real-time. Please refresh the page.");
        });
  
        return () => unsubscribe();
      } catch (error) {
        console.error("Error setting up income sources listener:", error);
        setError("Failed to set up income sources listener. Please try again later.");
      }
    }
  }, [auth.currentUser]);
  
  const addIncomeSource = async (incomeData) => {
    try {
      if (!auth.currentUser) {
        throw new Error("No authenticated user");
      }
      const incomeSourcesRef = collection(db, 'incomeSources');
      const docRef = await addDoc(incomeSourcesRef, {
        ...incomeData,
        userId: auth.currentUser.uid,
        createdAt: Timestamp.now(),
        date: Timestamp.fromDate(new Date(incomeData.date))
      });
      const newIncome = { id: docRef.id, ...incomeData };
      setIncomeSources(prev => [...prev, newIncome]);
      return newIncome;
    } catch (error) {
      console.error("Error adding income source:", error);
      throw error;
    }
  };

  const updateIncome = async (incomeId, updatedIncome) => {
    try {
      const incomeRef = doc(db, 'income', incomeId);
      await updateDoc(incomeRef, {
        ...updatedIncome,
        date: Timestamp.fromDate(new Date(updatedIncome.date))
      });
      setIncome(prevIncome => 
        prevIncome.map(inc => 
          inc.id === incomeId ? { ...inc, ...updatedIncome } : inc
        )
      );
    } catch (error) {
      console.error("Error updating income:", error);
      throw error;
    }
  };

  const updateIncomeSource = async (incomeId, updatedIncome) => {
    try {
      const incomeRef = doc(db, 'incomeSources', incomeId);
      await updateDoc(incomeRef, {
        ...updatedIncome,
        date: Timestamp.fromDate(new Date(updatedIncome.date))
      });
      setIncomeSources(prevSources => 
        prevSources.map(source => 
          source.id === incomeId ? { ...source, ...updatedIncome } : source
        )
      );
    } catch (error) {
      console.error("Error updating income source:", error);
      throw error;
    }
  };
  
  const deleteIncome = async (incomeId) => {
    try {
      await deleteDoc(doc(db, 'income', incomeId));
      setIncome(prevIncome => prevIncome.filter(inc => inc.id !== incomeId));
    } catch (error) {
      console.error("Error deleting income:", error);
      throw error;
    }
  };

  const deleteIncomeSource = async (incomeId) => {
    try {
      await deleteDoc(doc(db, 'incomeSources', incomeId));
      setIncomeSources(prevSources => prevSources.filter(source => source.id !== incomeId));
    } catch (error) {
      console.error("Error deleting income source:", error);
      throw error;
    }
  };

  const getTotalIncome = useCallback((startDate, endDate) => {
    return incomeSources
      .filter(inc => {
        const incomeDate = new Date(inc.date);
        return (!startDate || incomeDate >= startDate) && (!endDate || incomeDate <= endDate);
      })
      .reduce((total, inc) => total + Number(inc.amount), 0);
  }, [incomeSources]);

  const getSavingsRate = (startDate, endDate) => {
    const totalIncome = getTotalIncome(startDate, endDate);
    const totalExpenses = getTotalExpenses(startDate, endDate);
    return totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  };

  const getExpensesByCategory = (targetCurrency = 'USD') => {
    return expenses.reduce((acc, expense) => {
      const convertedAmount = convertCurrency(Number(expense.amount), expense.currency, targetCurrency);
      acc[expense.category] = (acc[expense.category] || 0) + convertedAmount;
      return acc;
    }, {});
  };

  const getBudgetAdherence = (startDate, endDate) => {
    const expensesByCategory = getExpensesByCategory(startDate, endDate);
    return budgets.map(budget => {
      const spent = expensesByCategory[budget.category] || 0;
      const adherencePercentage = (spent / Number(budget.amount)) * 100;
      return {
        category: budget.category,
        budgeted: Number(budget.amount),
        spent,
        adherencePercentage,
        remaining: Number(budget.amount) - spent
      };
    });
  };

  const getGoalProgress = () => {
    return goals.map(goal => {
      const now = new Date();
      const totalDays = (goal.dueDate - goal.createdAt) / (1000 * 60 * 60 * 24);
      const daysPassed = (now - goal.createdAt) / (1000 * 60 * 60 * 24);
      const expectedProgress = (daysPassed / totalDays) * goal.targetAmount;
      const actualProgress = goal.currentAmount;
      const progressPercentage = (actualProgress / goal.targetAmount) * 100;
      return {
        ...goal,
        expectedProgress,
        actualProgress,
        progressPercentage,
        isOnTrack: actualProgress >= expectedProgress
      };
    });
  };

  const getExpensesByMonth = (targetCurrency = 'USD') => {
    return expenses.reduce((acc, expense) => {
      const month = new Date(expense.date).toLocaleString('default', { month: 'short' });
      const convertedAmount = convertCurrency(Number(expense.amount), expense.currency, targetCurrency);
      acc[month] = (acc[month] || 0) + convertedAmount;
      return acc;
    }, {});
  };

 
  useEffect(() => {
    const fetchGoals = async () => {
      if (auth.currentUser) {
        const goalsRef = collection(db, 'goals');
        const q = query(goalsRef, where('userId', '==', auth.currentUser.uid), orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const goalsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            dueDate: doc.data().dueDate.toDate()
          }));
          setGoals(goalsData);
        }, (error) => {
          console.error("Error fetching goals:", error);
          setError("Failed to fetch goals in real-time. Please refresh the page.");
        });

        return () => unsubscribe();
      }
    };

    fetchGoals();
  }, [auth.currentUser]);

  const addGoal = async (newGoal) => {
    try {
      const goalsRef = collection(db, 'goals');
      const docRef = await addDoc(goalsRef, {
        ...newGoal,
        userId: auth.currentUser.uid,
        createdAt: Timestamp.now(),
        dueDate: Timestamp.fromDate(new Date(newGoal.dueDate)),
        targetAmount: Number(newGoal.targetAmount),
        currentAmount: Number(newGoal.currentAmount)
      });
      return { id: docRef.id, ...newGoal };
    } catch (error) {
      console.error("Error adding goal:", error);
      throw error;
    }
  };

  const updateGoal = async (updatedGoal) => {
    try {
      const goalRef = doc(db, 'goals', updatedGoal.id);
      await updateDoc(goalRef, {
        ...updatedGoal,
        dueDate: Timestamp.fromDate(new Date(updatedGoal.dueDate)),
        targetAmount: Number(updatedGoal.targetAmount),
        currentAmount: Number(updatedGoal.currentAmount)
      });
    } catch (error) {
      console.error("Error updating goal:", error);
      throw error;
    }
  };

  const deleteGoal = async (goalId) => {
    try {
      await deleteDoc(doc(db, 'goals', goalId));
    } catch (error) {
      console.error("Error deleting goal:", error);
      throw error;
    }
  };
  const addBudget = async (budget) => {
    try {
      const budgetsRef = collection(db, 'budgets');
      const docRef = await addDoc(budgetsRef, {
        ...budget,
        userId: auth.currentUser.uid,
        createdAt: Timestamp.now(),
        period: budget.period // Ensure the period is included
      });
      const newBudget = { id: docRef.id, ...budget };
      console.log("Adding new budget:", newBudget);
      // No need to update state here, as the onSnapshot listener will handle it
      return newBudget;
    } catch (error) {
      console.error("Error adding budget:", error);
      throw error;
    }
  };
  const handleDisconnectBank = async (itemId) => {
    try {
      const response = await fetch('/api/disconnect_bank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item_id: itemId }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to disconnect bank');
      }
  
      setConnectedAccounts(prev => prev.filter(account => account.item_id !== itemId));
      // You might want to show a success message here
    } catch (error) {
      console.error('Error disconnecting bank:', error);
      // You might want to show an error message here
      throw error;
    }
  };
  const removeBudget = async (budgetId) => {
    try {
      const budgetRef = doc(db, 'budgets', budgetId);
      await deleteDoc(budgetRef);
      console.log("Budget deleted:", budgetId);
      // The onSnapshot listener will update the state automatically
    } catch (error) {
      console.error("Error removing budget:", error);
      throw error;
    }
  };
  
  const deleteBudget = async (budgetId) => {
    try {
      await deleteDoc(doc(db, 'budgets', budgetId));
      // Update local state
      setBudgets(prevBudgets => {
        const newBudgets = { ...prevBudgets };
        delete newBudgets[budgetId];
        return newBudgets;
      });
    } catch (error) {
      console.error("Error deleting budget:", error);
      throw error;
    }
  };
  const getInsights = () => {
    const totalExpenses = getTotalExpenses() || 0;
    const totalIncome = getTotalIncome() || 0;
    const savingsRate = totalIncome !== 0 ? (totalIncome - totalExpenses) / totalIncome : 0;
  
    let insights = [];
  
    if (savingsRate < 0) {
      insights.push("You're currently spending more than you're earning. Consider reviewing your expenses to find areas where you can cut back.");
    } else if (savingsRate < 0.2) {
      insights.push("Your current savings rate is below 20%. Try to increase your savings to build a stronger financial foundation.");
    } else {
      insights.push("Great job! You're saving more than 20% of your income.");
    }
  
    const expensesByCategory = getExpensesByCategory();
    const topExpenseCategory = Object.entries(expensesByCategory || {}).sort((a, b) => b[1] - a[1])[0];
    
    if (topExpenseCategory && totalExpenses > 0) {
      insights.push(`Your highest expense category is ${topExpenseCategory[0]}, accounting for ${((topExpenseCategory[1] / totalExpenses) * 100).toFixed(2)}% of your total expenses.`);
    }
  
    if (goals && goals.length > 0) {
      const nextGoal = goals.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
      if (nextGoal) {
        insights.push(`Your next financial goal "${nextGoal.name}" is due on ${new Date(nextGoal.dueDate).toLocaleDateString()}.`);
      }
    }
  
    return insights.join(" ");
  };
  
  const getRecommendations = () => {
    const totalExpenses = getTotalExpenses() || 0;
    const totalIncome = getTotalIncome() || 0;
    const savingsRate = totalIncome !== 0 ? (totalIncome - totalExpenses) / totalIncome : 0;
  
    let recommendations = [];
  
    if (savingsRate < 0.2) {
      recommendations.push("Aim to save at least 20% of your income. Look for areas where you can reduce expenses.");
    }
  
    const expensesByCategory = getExpensesByCategory();
    const sortedExpenses = Object.entries(expensesByCategory || {}).sort((a, b) => b[1] - a[1]);
    if (sortedExpenses.length > 0) {
      const topExpenseCategory = sortedExpenses[0];
      recommendations.push(`Consider ways to reduce spending in your highest expense category: ${topExpenseCategory[0]}.`);
    }
  
    if (!budgets || budgets.length === 0) {
      recommendations.push("Set up budgets for your main expense categories to better track and control your spending.");
    }
  
    if (!goals || goals.length === 0) {
      recommendations.push("Set some financial goals to give direction to your saving and spending habits.");
    }
  
    if (!income || income.length === 0) {
      recommendations.push("Make sure to track all your income sources for a complete financial picture.");
    }
  
    return recommendations.join(" ");
  };

  const updateBudget = async (budgetId, updatedBudget) => {
    try {
      const budgetRef = doc(db, 'budgets', budgetId);
      await updateDoc(budgetRef, updatedBudget);
      setBudgets(prevBudgets => 
        prevBudgets.map(budget => 
          budget.id === budgetId ? { ...budget, ...updatedBudget } : budget
        )
      );
    } catch (error) {
      console.error("Error updating budget:", error);
      throw error;
    }
  };

  const getRemainingBudget = (targetCurrency = 'USD') => {
    const totalBudget = budgets.reduce((total, budget) => {
      const convertedAmount = convertCurrency(Number(budget.amount), budget.currency, targetCurrency);
      return total + convertedAmount;
    }, 0);
    const totalExpenses = getTotalExpenses(targetCurrency);
    return totalBudget - totalExpenses;
  };

  const formatCurrency = (amount, currencyCode = 'USD') => {
    const currency = currencies.find(c => c.code === currencyCode);
    return `${currency ? currency.symbol : ''}${Number(amount).toFixed(2)}`;
  };


 

  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    const inUSD = amount / exchangeRates[fromCurrency];
    return inUSD * exchangeRates[toCurrency];
  };

  const checkAchievements = () => {
    const newAchievements = [];

    if (expenses.length >= 10) {
      newAchievements.push({ id: 'TRACK_10', title: 'Expense Tracker', description: 'Tracked 10 expenses' });
    }

    if (budgets.length >= 5) {
      newAchievements.push({ id: 'BUDGET_5', title: 'Budget Master', description: 'Created 5 budget categories' });
    }

    if (savings >= 1000) {
      newAchievements.push({ id: 'SAVE_1000', title: 'Super Saver', description: 'Saved $1000' });
    }

    setAchievements(prevAchievements => {
      const newUniqueAchievements = newAchievements.filter(
        achievement => !prevAchievements.some(prevAchievement => prevAchievement.id === achievement.id)
      );
      return [...prevAchievements, ...newUniqueAchievements];
    });
  };

  const predictFutureExpenses = () => {
    const last3MonthsExpenses = expenses
      .filter(expense => new Date(expense.date) >= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
      .reduce((total, expense) => total + Number(expense.amount), 0);

    const averageMonthlyExpense = last3MonthsExpenses / 3;
    return averageMonthlyExpense * 1.1; // Predicting a 10% increase
  };

  const getSavingSuggestions = () => {
    const totalIncome = income.reduce((total, inc) => total + Number(inc.amount), 0);
    const totalExpenses = expenses.reduce((total, expense) => total + Number(expense.amount), 0);

    if (totalExpenses > totalIncome * 0.9) {
      return "Consider reducing expenses in non-essential categories.";
    } else if (savings < totalIncome * 0.2) {
      return "Try to save at least 20% of your income each month.";
    } else {
      return "Great job managing your finances! Keep it up!";
    }
  };

  const getFinancialData = (startDate, endDate, selectedCategories, selectedCurrency) => {
    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate && 
             (selectedCategories.length === 0 || selectedCategories.includes(expense.category));
    });

    const data = filteredExpenses.map(expense => ({
      ...expense,
      amount: convertCurrency(expense.amount, expense.currency, selectedCurrency)
    }));

    const totalExpenses = data.reduce((sum, expense) => sum + expense.amount, 0);
    const totalBudget = Object.values(budgets)
      .filter(budget => selectedCategories.length === 0 || selectedCategories.includes(budget.category))
      .reduce((sum, budget) => sum + convertCurrency(budget.amount, budget.currency, selectedCurrency), 0);

    return {
      expenses: data,
      totalExpenses,
      totalBudget,
      remainingBudget: totalBudget - totalExpenses
    };
  };


  const getCategories = () => {
    return categories;
  };

  const getExpensesByDate = async (date) => {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const expensesRef = collection(db, 'expenses');
      const q = query(
        expensesRef,
        where('date', '>=', Timestamp.fromDate(startOfDay)),
        where('date', '<=', Timestamp.fromDate(endOfDay))
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      }));
    } catch (error) {
      console.error("Error fetching expenses by date:", error);
      throw error;
    }
  };

  const addExpense = async (expenseData) => {
    try {
      const { date, ...rest } = expenseData;
      let firestoreDate;

      if (date instanceof Date && !isNaN(date)) {
        firestoreDate = Timestamp.fromDate(date);
      } else if (typeof date === 'string') {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          firestoreDate = Timestamp.fromDate(parsedDate);
        } else {
          throw new Error('Invalid date format');
        }
      } else {
        throw new Error('Invalid date format');
      }

      const expensesRef = collection(db, 'expenses');
      const docRef = await addDoc(expensesRef, {
        ...rest,
        date: firestoreDate,
        createdAt: Timestamp.now(),
        userId: auth.currentUser.uid
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding expense:", error);
      throw error;
    }
  };

  const addBankAccount = async (accountData) => {
    try {
      const bankAccountsRef = collection(db, 'bankAccounts');
      const docRef = await addDoc(bankAccountsRef, {
        ...accountData,
        userId: auth.currentUser.uid,
        createdAt: Timestamp.now()
      });
      const newAccount = { id: docRef.id, ...accountData };
      setBankAccounts(prev => [...prev, newAccount]);
      return newAccount;
    } catch (error) {
      console.error("Error adding bank account:", error);
      throw error;
    }
  };


  const generatePlaidLinkToken = async () => {
    try {
      console.log('Initiating Plaid link token creation...');
      const response = await fetch('/api/create_link_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Only send necessary data
        body: JSON.stringify({ userId: 'unique_user_id' }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
  
      const data = await response.json();
  
      if (!data.link_token) {
        console.error('No link_token in response:', data);
        throw new Error('No link_token in response');
      }
  
      console.log('Successfully created Plaid link token');
      return data.link_token;
    } catch (error) {
      console.error('Error in generatePlaidLinkToken:', error);
      throw error;
    }
  };
  
  

  const getRecentTransactions = async (limitCount = 5) => {
    try {
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('userId', '==', auth.currentUser.uid),
        orderBy('date', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      }));
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
      throw error;
    }
  };
  const exchangePlaidPublicToken = async (publicToken, institutionName) => {
    try {
      const response = await fetch('/api/exchange_public_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token: publicToken, institution: institutionName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    } catch (error) {
      console.error('Error exchanging Plaid public token:', error);
      throw error;
    }
  };

  const forecastExpenses = (months = 3) => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
    const recentExpenses = expenses.filter(expense => new Date(expense.date) >= threeMonthsAgo);
    const averageMonthlyExpense = recentExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0) / 3;
    
    return Array(months).fill().map((_, index) => {
      const month = new Date(now.getFullYear(), now.getMonth() + index, 1);
      return {
        month: month.toLocaleString('default', { month: 'long', year: 'numeric' }),
        forecast: averageMonthlyExpense
      };
    });
  };
  const fetchPlaidAccounts = async () => {
    try {
      const response = await fetch('/api/accounts', { method: 'GET' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setConnectedAccounts(data.accounts);
    } catch (error) {
      console.error('Error fetching Plaid accounts:', error);
      throw error;
    }
  };

  const getBudgetPeriods = () => {
    return ['Monthly', 'Quarterly', 'Yearly'];
  };


  
  const value = {
    user,
    updateUser,
    expenses,
    addExpense: addExpenseToState,
    addExpense,
    budgets,
    addBudget,
    removeBudget,
    updateBudget,
    categories,
    addCategory,
    removeCategory,
    editCategory,
    currencies,
    convertCurrency,
    getTotalExpenses,
    getRemainingBudget,
    formatCurrency,
    income,
    addIncome,
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    getExpensesByCategory,
    getExpensesByMonth,
    getTotalIncome,
    achievements,
    predictFutureExpenses,
    getSavingSuggestions,
    getFinancialData,
    getSavingsRate, getBudgetAdherence, getGoalProgress,
    getCategories,
    getExpensesByDate,
    bankAccounts,
    addBankAccount,
    deleteExpense,
    incomeSources,
    addIncomeSource,
    generatePlaidLinkToken,
    exchangePlaidPublicToken,
    fetchPlaidAccounts,
    connectedAccounts,
    loading,
    forecastExpenses,
    getRecentTransactions,
    getInsights,updateIncome, deleteIncome,
    predictIncome,
    handleDisconnectBank,
    estimateTax,
    getExchangeRate,
    addIncomeCategory,
    generateIncomeReport,
    updateIncomeSource,
    deleteIncomeSource,
    getRecommendations,
    fetchIncomeSources,
    deleteBudget,
    darkMode,
    toggleDarkMode,
    error,
    updateExpense,
    getBudgetPeriods
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};

export default FinanceProvider;