import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Lock, Mail, User, DollarSign, Shield, HelpCircle, Bell, Eye, EyeOff, Check, X } from 'lucide-react';
import Alert, {AlertTitle,AlertDescription} from './ui/Alert';
import { Progress } from './ui/progress';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [hasIncome, setHasIncome] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeFrequency, setIncomeFrequency] = useState('monthly');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, sendEmailVerification } = useAuth();
  const navigate = useNavigate();


  const [theme, setTheme] = useState('light');
  const [showPassword, setShowPassword] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [formProgress, setFormProgress] = useState(0);

  const [enableTwoFactor, setEnableTwoFactor] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState('app');
  const [securityQuestions, setSecurityQuestions] = useState([
    { category: '', answer: '' },
    { category: '', answer: '' },
    { category: '', answer: '' }
  ]);
  const [notificationPreferences, setNotificationPreferences] = useState({
    email: false,
    push: false,
    sms: false
  });

  const securityQuestionCategories = [
    "What was the name of your first pet?",
    "In what city were you born?",
    "What is your mother's maiden name?",
    "What high school did you attend?",
    "What was the make of your first car?",
    "What was your childhood nickname?",
    "What is the name of your favorite childhood friend?",
    "What street did you live on in third grade?",
    "What is the middle name of your oldest child?",
    "What is your oldest sibling's middle name?",
    "What school did you attend for sixth grade?",
    "What is your oldest cousin's first and last name?",
    "What was the name of your first stuffed animal?",
    "In what city or town did your mother and father meet?",
    "What was the last name of your third grade teacher?"
  ];

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleSecurityQuestionChange = (index, field, value) => {
    const updatedQuestions = [...securityQuestions];
    updatedQuestions[index][field] = value;
    setSecurityQuestions(updatedQuestions);
  };

  const handleNotificationPreferenceChange = (type) => {
    setNotificationPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const validateForm = () => {
    if (formStep === 0) {
      return name.length > 0 && validateEmail(email) && validatePassword(password) && password === passwordConfirm;
    } else if (formStep === 1) {
      return !hasIncome || (incomeAmount > 0 && incomeFrequency);
    } else if (formStep === 2) {
      return securityQuestions.every(q => q.category && q.answer);
    }
    return true;
  };

  useEffect(() => {
    setFormProgress((formStep + 1) * 25);
  }, [formStep]);

  const nextStep = () => {
    if (validateForm()) {
      setFormStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setFormStep(prev => Math.max(prev - 1, 0));
  };


  async function handleSubmit(e) {
    e.preventDefault();
  
    if (!validateForm()) {
      setError('Please fill out all required fields correctly.');
      return;
    }
  
    try {
      setError('');
      setLoading(true);
      console.log('Starting signup process...');
      
      const userData = {
        email,
        password,
        name,
        hasIncome,
        incomeAmount: hasIncome ? parseFloat(incomeAmount) : null,
        incomeFrequency: hasIncome ? incomeFrequency : null,
        enableTwoFactor,
        twoFactorMethod,
        securityQuestions,
        notificationPreferences
      };
  
      console.log('Signup data:', userData);
      
      const user = await signup(userData);
      console.log('User created successfully:', user);
      
      console.log('Sending email verification...');
      await sendEmailVerification(user);
      console.log('Email verification sent');
      
      navigate('/email-verification');
    } catch (error) {
      console.error('Signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please use a different email or try logging in.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address. Please check and try again.');
      } else {
        setError('Failed to create an account: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  }
  const formVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'}`}
    >
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <h2 className={`mt-6 text-center text-3xl font-extrabold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Create your account</h2>
        </motion.div>

        <Progress value={formProgress} className="w-full" />

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>


          <AnimatePresence mode="wait">
            {formStep === 0 && (
              <motion.div
                key="step0"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="rounded-md shadow-sm -space-y-px">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <label htmlFor="name" className="sr-only">Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input 
                        id="name" 
                        name="name" 
                        type="text" 
                        required 
                        className={`appearance-none rounded-none relative block w-full pl-10 px-3 py-2 border ${theme === 'light' ? 'border-gray-300 placeholder-gray-500 text-gray-900' : 'border-gray-700 placeholder-gray-400 text-white bg-gray-800'} rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <label htmlFor="email-address" className="sr-only">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input 
                        id="email-address" 
                        name="email" 
                        type="email" 
                        autoComplete="email" 
                        required 
                        className={`appearance-none rounded-none relative block w-full pl-10 px-3 py-2 border ${theme === 'light' ? 'border-gray-300 placeholder-gray-500 text-gray-900' : 'border-gray-700 placeholder-gray-400 text-white bg-gray-800'} focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      {email && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {validateEmail(email) ? (
                            <Check className="text-green-500" size={20} />
                          ) : (
                            <X className="text-red-500" size={20} />
                          )}
                        </motion.span>
                      )}
                    </div>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <label htmlFor="password" className="sr-only">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input 
                        id="password" 
                        name="password" 
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password" 
                        required 
                        className={`appearance-none rounded-none relative block w-full pl-10 pr-10 px-3 py-2 border ${theme === 'light' ? 'border-gray-300 placeholder-gray-500 text-gray-900' : 'border-gray-700 placeholder-gray-400 text-white bg-gray-800'} focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="text-gray-400" size={20} />
                        ) : (
                          <Eye className="text-gray-400" size={20} />
                        )}
                      </button>
                    </div>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <label htmlFor="password-confirm" className="sr-only">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input 
                        id="password-confirm" 
                        name="password-confirm" 
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password" 
                        required 
                        className={`appearance-none rounded-none relative block w-full pl-10 pr-10 px-3 py-2 border ${theme === 'light' ? 'border-gray-300 placeholder-gray-500 text-gray-900' : 'border-gray-700 placeholder-gray-400 text-white bg-gray-800'} rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                        placeholder="Confirm Password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                      />
                      {passwordConfirm && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {password === passwordConfirm ? (
                            <Check className="text-green-500" size={20} />
                          ) : (
                            <X className="text-red-500" size={20} />
                          )}
                        </motion.span>
                      )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {formStep === 1 && (
              <motion.div
                key="step1"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
<div className="mt-4">
                  <label className={`flex items-center ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                    <input
                      type="checkbox"
                      checked={hasIncome}
                      onChange={(e) => setHasIncome(e.target.checked)}
                      className="form-checkbox h-5 w-5 text-indigo-600"
                    />
                    <span className="ml-2">I have an income</span>
                  </label>
                </div>

                <AnimatePresence>
                  {hasIncome && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4 mt-4"
                    >
                      <div>
                        <label htmlFor="income-amount" className={`block text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Income Amount</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </div>
                          <input
                            type="number"
                            name="income-amount"
                            id="income-amount"
                            className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md ${theme === 'light' ? 'bg-white' : 'bg-gray-700 text-white'}`}
                            placeholder="0.00"
                            value={incomeAmount}
                            onChange={(e) => setIncomeAmount(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="income-frequency" className={`block text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Income Frequency</label>
                        <select
                          id="income-frequency"
                          name="income-frequency"
                          className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${theme === 'light' ? 'bg-white' : 'bg-gray-700 text-white'}`}
                          value={incomeFrequency}
                          onChange={(e) => setIncomeFrequency(e.target.value)}
                        >
                          <option value="weekly">Weekly</option>
                          <option value="bi-weekly">Bi-weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="annually">Annually</option>
                        </select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {formStep === 2 && (
              <motion.div
                key="step2"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="mt-4">
                  <label className={`flex items-center ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                    <input
                      type="checkbox"
                      checked={enableTwoFactor}
                      onChange={(e) => setEnableTwoFactor(e.target.checked)}
                      className="form-checkbox h-5 w-5 text-indigo-600"
                    />
                    <span className="ml-2 flex items-center">
                      <Shield className="mr-2" size={20} />
                      Enable Two-Factor Authentication
                    </span>
                  </label>
                </div>

                {enableTwoFactor && (
                  <div className="mt-4">
                    <label className={`block text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                      Two-Factor Authentication Method
                    </label>
                    <select
                      value={twoFactorMethod}
                      onChange={(e) => setTwoFactorMethod(e.target.value)}
                      className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${theme === 'light' ? 'bg-white' : 'bg-gray-700 text-white'}`}
                    >
                      <option value="app">Authenticator App</option>
                      <option value="sms">SMS</option>
                      <option value="email">Email</option>
                    </select>
                    <p className={`mt-2 text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                      {twoFactorMethod === 'app' && "You'll need to set up an authenticator app after registration."}
                      {twoFactorMethod === 'sms' && "You'll need to provide a phone number for SMS verification after registration."}
                      {twoFactorMethod === 'email' && "We'll send verification codes to your registered email address."}
                    </p>
                  </div>
                )}

                <div className="mt-6">
                  <h3 className={`text-lg font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Security Questions</h3>
                  {securityQuestions.map((q, index) => (
                    <motion.div 
                      key={index} 
                      className="mt-4"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <select
                        value={q.category}
                        onChange={(e) => handleSecurityQuestionChange(index, 'category', e.target.value)}
                        className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${theme === 'light' ? 'bg-white' : 'bg-gray-700 text-white'}`}
                      >
                        <option value="">Select a security question</option>
                        {securityQuestionCategories.map((category, idx) => (
                          <option key={idx} value={category}>{category}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Answer"
                        value={q.answer}
                        onChange={(e) => handleSecurityQuestionChange(index, 'answer', e.target.value)}
                        className={`mt-1 block w-full rounded-md ${theme === 'light' ? 'border-gray-300' : 'border-gray-700 bg-gray-800 text-white'}`}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {formStep === 3 && (
              <motion.div
                key="step3"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="mt-4">
                  <h3 className={`text-lg font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Notification Preferences</h3>
                  {['email', 'push', 'sms'].map((type) => (
                    <motion.label 
                      key={type} 
                      className={`flex items-center mt-4 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <input
                        type="checkbox"
                        checked={notificationPreferences[type]}
                        onChange={() => handleNotificationPreferenceChange(type)}
                        className="form-checkbox h-5 w-5 text-indigo-600"
                      />
                      <span className="ml-2 capitalize">{type} Notifications</span>
                    </motion.label>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            {formStep > 0 && (
              <motion.button
                type="button"
                onClick={prevStep}
                className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Previous
              </motion.button>
            )}
            {formStep < 3 ? (
              <motion.button
                type="button"
                onClick={nextStep}
                className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!validateForm()}
              >
                Next
              </motion.button>
            ) : (
              <motion.button 
                type="submit" 
                className={`group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? 'Signing up...' : 'Sign up'}
                <Sparkles className="ml-2" size={20} />
              </motion.button>
            )}
          </div>
        </form>

        <motion.div 
          className="text-sm text-center"
          whileHover={{ scale: 1.1 }}
        >
          <Link to="/login" className={`font-medium ${theme === 'light' ? 'text-indigo-600 hover:text-indigo-500' : 'text-indigo-400 hover:text-indigo-300'}`}>
            Already have an account? Sign in
          </Link>
        </motion.div>

        <motion.button
          onClick={toggleTheme}
          className={`mt-4 px-4 py-2 rounded-full ${theme === 'light' ? 'bg-gray-200 text-gray-800' : 'bg-gray-700 text-white'}`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          Toggle Theme
        </motion.button>
      </div>
    </motion.div>
  );
}