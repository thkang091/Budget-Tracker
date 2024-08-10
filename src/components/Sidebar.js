import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart2, DollarSign, Briefcase, Target, Settings, Sun, Moon, LogOut, Menu, X, CreditCard, PiggyBank, Wallet, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ darkMode, setDarkMode }) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  const navItems = [
    { path: '/dashboard', icon: <BarChart2 size={20} />, label: 'Dashboard' },
    ...(currentUser?.isIncomeVerified ? [{ path: '/income', icon: <TrendingUp size={20} />, label: 'Income' }] : []),
    { path: '/expenses', icon: <CreditCard size={20} />, label: 'Expenses' },
    { path: '/budgets', icon: <PiggyBank size={20} />, label: 'Budgets' },
    { path: '/goals', icon: <Target size={20} />, label: 'Goals' },
    { path: '/profile', icon: <Settings size={20} />, label: 'Profile' },
  ];

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: '-100%' },
  };

  const iconVariants = {
    hover: { scale: 1.2, rotate: 360, transition: { duration: 0.3 } },
    tap: { scale: 0.8, rotate: -45, transition: { duration: 0.1 } },
  };

  const labelVariants = {
    hover: { scale: 1.1, x: 10, transition: { duration: 0.2 } },
    tap: { scale: 0.9, transition: { duration: 0.1 } },
  };

  return (
    <>
      <motion.button
        className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-full bg-indigo-500 text-white shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </motion.button>
      <AnimatePresence>
        {(isOpen || window.innerWidth >= 1024) && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-20 lg:relative lg:translate-x-0"
          >
            <div className={`w-64 h-full p-5 flex flex-col justify-between ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'} shadow-2xl`}>
              <div>
                <motion.h1 
                  className="text-2xl font-bold mb-10 text-indigo-500"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Budget Tracker
                </motion.h1>
                <nav className="space-y-2">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onHoverStart={() => setHoveredItem(item.path)}
                      onHoverEnd={() => setHoveredItem(null)}
                    >
                      <Link
                        to={item.path}
                        className={`flex items-center py-2 px-4 rounded-lg transition-all duration-200 ${
                          location.pathname === item.path
                            ? 'bg-indigo-500 text-white shadow-md'
                            : `hover:bg-indigo-100 dark:hover:bg-indigo-800 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`
                        }`}
                      >
                        <motion.div
                          variants={iconVariants}
                          animate={hoveredItem === item.path ? 'hover' : 'initial'}
                          whileTap="tap"
                        >
                          {item.icon}
                        </motion.div>
                        <motion.span
                          className="ml-3"
                          variants={labelVariants}
                          animate={hoveredItem === item.path ? 'hover' : 'initial'}
                          whileTap="tap"
                        >
                          {item.label}
                        </motion.span>
                      </Link>
                    </motion.div>
                  ))}
                </nav>
              </div>
              <div className="space-y-2">
                <motion.button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`flex items-center w-full py-2 px-4 rounded-lg transition-all duration-200 ${darkMode ? 'bg-yellow-400 text-gray-900' : 'bg-indigo-100 text-indigo-800'}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    variants={iconVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                  </motion.div>
                  <span className="ml-3">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </motion.button>
                <motion.button 
                  onClick={logout} 
                  className={`flex items-center w-full py-2 px-4 rounded-lg ${darkMode ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'} hover:bg-red-500 hover:text-white transition-all duration-200`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    variants={iconVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <LogOut size={20} />
                  </motion.div>
                  <span className="ml-3">Logout</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
