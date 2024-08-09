import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FinanceProvider } from './contexts/FinanceContext';
import Dashboard from './pages/Dashboard';
import Expenses from './components/Expenses';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';
import Profile from './pages/Profile';
import Login from './components/Login';
import IncomeVerification from './components/IncomeVerification';
import Signup from './components/Signup';
import DashboardLayout from './components/DashboardLayout';
import Income from './pages/Income';


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  console.log('PrivateRoute - currentUser:', currentUser);
  return currentUser ? <DashboardLayout>{children}</DashboardLayout> : <Navigate to="/login" />;
};

function AppRoutes() {
  const { currentUser } = useAuth();
  console.log('AppRoutes - currentUser:', currentUser);

  return (
    <Routes>
      <Route path="/login" element={
        currentUser ? <Navigate to="/dashboard" /> : <Login />
      } />
      <Route path="/signup" element={
        currentUser ? <Navigate to="/dashboard" /> : <Signup />
      } />
      <Route path="/income-verification" element={<IncomeVerification />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
      <Route path="/budgets" element={<PrivateRoute><Budgets /></PrivateRoute>} />
      <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/income" element={<PrivateRoute><Income /></PrivateRoute>} />
      <Route path="/" element={<Navigate replace to="/dashboard" />} />
    </Routes>
  );
}


function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <FinanceProvider>
            <Router>
              <AppRoutes />
            </Router>
        </FinanceProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;