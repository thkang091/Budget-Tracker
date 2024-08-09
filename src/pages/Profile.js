import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFinanceContext } from '../contexts/FinanceContext';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, Edit2, Save, X, Phone, Mail, MapPin, Globe, DollarSign, TrendingUp, PieChart, Award, Briefcase, Lock, HelpCircle, Settings, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import FinancialHealthWidget from '../components/FinancialHealthWidget';
import { usePlaidLink } from 'react-plaid-link';
import ConnectedAccounts from '../components/ConnectedAccounts';
import ThemeCustomizer from '../components/ThemeCustomizer';
import FinancialOverview from '../components/FinancialOverview';

const Profile = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const { 
    getExpensesByCategory, 
    getTotalExpenses, 
    getTotalIncome,
    getRecentTransactions,
    currencies,
    formatCurrency,
    generatePlaidLinkToken,
    exchangePlaidPublicToken,
    fetchPlaidAccounts,
    incomeSources,
    expenses,
    setConnectedBanks,
    getInsights,
    getRecommendations,
    error: contextError,
  } = useFinanceContext();

  const [userData, setUserData] = useState({
    name: '',
    email: '',
    photoURL: '',
    username: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    currency: 'USD'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [expensesByCategory, setExpensesByCategory] = useState({});
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);
  const [linkToken, setLinkToken] = useState(null);
  const [insights, setInsights] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [activeView, setActiveView] = useState('defaultView');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  useEffect(() => {
    if (currentUser) {
      setUserData({
        name: currentUser.displayName || '',
        email: currentUser.email || '',
        photoURL: currentUser.photoURL || '',
        username: currentUser.username || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        city: currentUser.city || '',
        state: currentUser.state || '',
        zipCode: currentUser.zipCode || '',
        country: currentUser.country || '',
        currency: currentUser.currency || 'USD'
      });
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const expenses = await getExpensesByCategory(startOfMonth, endOfMonth);
        setExpensesByCategory(expenses);
        
        const totalExp = await getTotalExpenses(startOfMonth, endOfMonth);
        setTotalExpenses(totalExp);
        
        const totalInc = await getTotalIncome(startOfMonth, endOfMonth);
        setTotalIncome(totalInc);
        
        const recentTrans = await getRecentTransactions(5);
        setRecentTransactions(recentTrans);

        setInsights(getInsights());
        setRecommendations(getRecommendations());
      } catch (err) {
        console.error("Error fetching financial data:", err);
        setError("Failed to fetch financial data. Please try again later.");
      }
    };

    fetchFinancialData();
  }, [getExpensesByCategory, getTotalExpenses, getTotalIncome, getRecentTransactions, getInsights, getRecommendations]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let photoURL = userData.photoURL;
      if (profileImage) {
        const imageRef = ref(storage, `profileImages/${currentUser.uid}`);
        await uploadBytes(imageRef, profileImage);
        photoURL = await getDownloadURL(imageRef);
      }

      const updatedUserData = {
        ...userData,
        photoURL
      };

      await updateUserProfile(updatedUserData);

      setUserData(prevData => ({
        ...prevData,
        ...updatedUserData
      }));

      setSuccess('Profile updated successfully');
      setEditMode(false);
    } catch (error) {
      setError('Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectBank = async () => {
    try {
      const token = await generatePlaidLinkToken();
      setLinkToken(token);
    } catch (error) {
      console.error('Error generating Plaid link token:', error);
      setError('Failed to initialize bank connection. Please try again.');
    }
  };

  const handleOnSuccess = async (public_token, metadata) => {
    try {
      await exchangePlaidPublicToken(public_token, metadata.institution.name);
      await fetchPlaidAccounts();
      setSuccess(`Successfully connected to ${metadata.institution.name}`);
    } catch (error) {
      console.error('Error in handleOnSuccess:', error);
      setError('Failed to connect bank. Please try again.');
    }
  };

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: handleOnSuccess,
  });

  const ProfileHeader = () => (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">Profile</h2>
      {!editMode ? (
        <Button onClick={() => setEditMode(true)} variant="outline" className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">
          <Edit2 className="mr-2 h-4 w-4" /> Edit Profile
        </Button>
      ) : (
        <div className="flex space-x-2">
          <Button onClick={handleSubmit} disabled={loading} className="bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700">
            <Save className="mr-2 h-4 w-4" /> Save
          </Button>
          <Button onClick={() => setEditMode(false)} variant="outline" className="bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700">
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
        </div>
      )}
    </div>
  );

  const handleDisconnectBank = async (bankId) => {
    try {
      const response = await fetch('/api/disconnect_bank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item_id: bankId }),
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect bank');
      }

      setConnectedBanks(prev => prev.filter(bank => bank.id !== bankId));
      setSuccess('Successfully disconnected bank');
    } catch (error) {
      console.error('Error disconnecting bank:', error);
      setError('Failed to disconnect bank. Please try again.');
    }
  };

  const ProfileImage = () => (
    <div className="relative mb-6">
      <Avatar className="w-32 h-32 border-4 border-indigo-500 dark:border-indigo-400">
        <AvatarImage src={userData.photoURL || 'https://via.placeholder.com/150'} alt="Profile" />
        <AvatarFallback className="bg-indigo-200 text-indigo-700 dark:bg-indigo-700 dark:text-indigo-200">{userData.name[0]}</AvatarFallback>
      </Avatar>
      {editMode && (
        <label htmlFor="profile-image" className="absolute bottom-0 right-0 bg-indigo-500 dark:bg-indigo-600 rounded-full p-2 cursor-pointer">
          <Camera className="h-4 w-4 text-white" />
        </label>
      )}
      <input
        type="file"
        id="profile-image"
        className="hidden"
        onChange={handleImageChange}
        accept="image/*"
        disabled={!editMode}
      />
    </div>
  );

  const ProfileForm = () => (
    <form className="space-y-4">
      <Input
        type="text"
        name="name"
        value={userData.name}
        onChange={handleChange}
        placeholder="Name"
        disabled={!editMode}
        className="border-indigo-300 focus:border-indigo-500 dark:border-indigo-600 dark:focus:border-indigo-400 dark:bg-gray-800 dark:text-white"
      />
      <Input
        type="text"
        name="username"
        value={userData.username}
        onChange={handleChange}
        placeholder="Username"
        disabled={!editMode}
        className="border-indigo-300 focus:border-indigo-500 dark:border-indigo-600 dark:focus:border-indigo-400 dark:bg-gray-800 dark:text-white"
      />
      <Input
        type="tel"
        name="phone"
        value={userData.phone}
        onChange={handleChange}
        placeholder="Phone"
        disabled={!editMode}
        className="border-indigo-300 focus:border-indigo-500 dark:border-indigo-600 dark:focus:border-indigo-400 dark:bg-gray-800 dark:text-white"
      />
      <Input
        type="text"
        name="address"
        value={userData.address}
        onChange={handleChange}
        placeholder="Address"
        disabled={!editMode}
        className="border-indigo-300 focus:border-indigo-500 dark:border-indigo-600 dark:focus:border-indigo-400 dark:bg-gray-800 dark:text-white"
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="text"
          name="city"
          value={userData.city}
          onChange={handleChange}
          placeholder="City"
          disabled={!editMode}
          className="border-indigo-300 focus:border-indigo-500 dark:border-indigo-600 dark:focus:border-indigo-400 dark:bg-gray-800 dark:text-white"
        />
        <Input
          type="text"
          name="state"
          value={userData.state}
          onChange={handleChange}
          placeholder="State"
          disabled={!editMode}
          className="border-indigo-300 focus:border-indigo-500 dark:border-indigo-600 dark:focus:border-indigo-400 dark:bg-gray-800 dark:text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="text"
          name="zipCode"
          value={userData.zipCode}
          onChange={handleChange}
          placeholder="Zip Code"
          disabled={!editMode}
          className="border-indigo-300 focus:border-indigo-500 dark:border-indigo-600 dark:focus:border-indigo-400 dark:bg-gray-800 dark:text-white"
        />
        <Input
          type="text"
          name="country"
          value={userData.country}
          onChange={handleChange}
          placeholder="Country"
          disabled={!editMode}
          className="border-indigo-300 focus:border-indigo-500 dark:border-indigo-600 dark:focus:border-indigo-400 dark:bg-gray-800 dark:text-white"
        />
      </div>
      <Select
        name="currency"
        value={userData.currency}
        onValueChange={(value) => handleChange({ target: { name: 'currency', value } })}
        disabled={!editMode}
      >
        <SelectTrigger className="border-indigo-300 focus:border-indigo-500 dark:border-indigo-600 dark:focus:border-indigo-400 dark:bg-gray-800 dark:text-white">
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          {currencies.map(currency => (
            <SelectItem key={currency.code} value={currency.code}>
              {currency.code} - {currency.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </form>
  );

  const ProfileInfo = () => (
    <div className="space-y-2 text-gray-700 dark:text-gray-300">
      <p className="flex items-center"><Phone className="mr-2 h-4 w-4 text-indigo-500 dark:text-indigo-400" /> {userData.phone}</p>
      <p className="flex items-center"><Mail className="mr-2 h-4 w-4 text-indigo-500 dark:text-indigo-400" /> {userData.email}</p>
      <p className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-indigo-500 dark:text-indigo-400" /> {userData.address}, {userData.city}, {userData.state} {userData.zipCode}</p>
      <p className="flex items-center"><Globe className="mr-2 h-4 w-4 text-indigo-500 dark:text-indigo-400" /> {userData.country}</p>
      <p className="flex items-center"><DollarSign className="mr-2 h-4 w-4 text-indigo-500 dark:text-indigo-400" /> {userData.currency}</p>
    </div>
  );

  const ExpensePieChart = () => {
    const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

    return (
      <Card className="bg-white dark:bg-gray-800 shadow-lg">
        <CardHeader className="bg-indigo-100 dark:bg-indigo-900">
          <h3 className="text-xl font-semibold flex items-center text-indigo-700 dark:text-indigo-300">
            <PieChart className="mr-2 h-5 w-5" /> Expenses by Category
          </h3>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RePieChart>
              <Pie
                data={Object.entries(expensesByCategory).map(([category, amount]) => ({
                  name: category,
                  value: amount
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {Object.entries(expensesByCategory).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', color: '#333' }} />
              <Legend />
            </RePieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const FinancialSummary = () => (
    <Card className="bg-white dark:bg-gray-800 shadow-lg">
      <CardHeader className="bg-teal-100 dark:bg-teal-900">
        <h3 className="text-xl font-semibold flex items-center text-teal-700 dark:text-teal-300">
          <TrendingUp className="mr-2 h-5 w-5" /> Financial Summary
        </h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-100 dark:bg-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-300">Total Income</p>
              <p className="text-2xl font-semibold text-green-700 dark:text-green-200">{formatCurrency(totalIncome, userData.currency)}</p>
            </div>
            <div className="text-center p-4 bg-red-100 dark:bg-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-300">Total Expenses</p>
              <p className="text-2xl font-semibold text-red-700 dark:text-red-200">{formatCurrency(totalExpenses, userData.currency)}</p>
            </div>
            <div className="text-center p-4 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-300">Net Savings</p>
              <p className="text-2xl font-semibold text-blue-700 dark:text-blue-200">{formatCurrency(totalIncome - totalExpenses, userData.currency)}</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-teal-700 dark:text-teal-300">Recent Transactions</h4>
            <ul className="space-y-2">
              {recentTransactions.map((transaction, index) => (
                <li key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-gray-700 dark:text-gray-300">{transaction.description}</span>
                  <span className={transaction.type === 'expense' ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}>
                    {formatCurrency(transaction.amount, userData.currency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ThemeCustomizationSection = () => (
    <Card className="bg-white dark:bg-gray-800 shadow-lg mt-6">
      <CardHeader className="bg-purple-100 dark:bg-purple-900">
        <h3 className="text-xl font-semibold flex items-center text-purple-700 dark:text-purple-300">
          <Settings className="mr-2 h-5 w-5" /> Theme and Layout Customization
        </h3>
      </CardHeader>
      <CardContent>
        <Button
          onClick={() => setShowThemeCustomizer(!showThemeCustomizer)}
          className="w-full justify-between bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white"
        >
          {showThemeCustomizer ? 'Hide' : 'Show'} Theme Customizer
          {showThemeCustomizer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
        <motion.div
          initial={false}
          animate={{ height: showThemeCustomizer ? 'auto' : 0, opacity: showThemeCustomizer ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ overflow: 'hidden' }}
        >
          {showThemeCustomizer && <ThemeCustomizer />}
        </motion.div>
      </CardContent>
    </Card>
  );

  const InsightsAndRecommendations = () => (
    <Card className="bg-white dark:bg-gray-800 shadow-lg">
      <CardHeader className="bg-purple-100 dark:bg-purple-900">
        <h3 className="text-xl font-semibold flex items-center text-purple-700 dark:text-purple-300">
          <Award className="mr-2 h-5 w-5" /> Insights and Recommendations
        </h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2 text-purple-700 dark:text-purple-300">Insights</h4>
            <p className="text-gray-700 dark:text-gray-300">{insights}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-purple-700 dark:text-purple-300">Recommendations</h4>
            <p className="text-gray-700 dark:text-gray-300">{recommendations}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await currentUser.updatePassword(newPassword);
      setSuccess('Password updated successfully');
      setShowPasswordChange(false);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      setError('Failed to update password: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const PasswordChangeDialog = () => (
    <Dialog open={showPasswordChange} onOpenChange={setShowPasswordChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mt-4 bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white">
          <Lock className="mr-2 h-4 w-4" /> Change Password
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">Change Password</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Enter your new password below. Make sure it's strong and unique.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password"
            required
            className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <Input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            placeholder="Confirm New Password"
            required
            className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <DialogFooter>
            <Button type="submit" disabled={loading} className="bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white">
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  const HelpCenter = () => (
    <Card className="bg-white dark:bg-gray-800 shadow-lg mt-6">
      <CardHeader className="bg-yellow-100 dark:bg-yellow-900">
        <h3 className="text-xl font-semibold flex items-center text-yellow-700 dark:text-yellow-300">
          <HelpCircle className="mr-2 h-5 w-5" /> Help Center
        </h3>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-gray-700 dark:text-gray-300">How do I update my profile information?</AccordionTrigger>
            <AccordionContent className="text-gray-600 dark:text-gray-400">
              Click the "Edit Profile" button at the top of your profile page. This will allow you to modify your personal information. Don't forget to click "Save" when you're done!
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-gray-700 dark:text-gray-300">How can I connect my bank account?</AccordionTrigger>
            <AccordionContent className="text-gray-600 dark:text-gray-400">
              Look for the "Connect Bank" button in the Connected Accounts section. Follow the prompts to securely link your bank account using our trusted partner, Plaid.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-gray-700 dark:text-gray-300">What should I do if I forget my password?</AccordionTrigger>
            <AccordionContent className="text-gray-600 dark:text-gray-400">
              If you've forgotten your password, use the "Forgot Password" link on the login page. You'll receive an email with instructions to reset your password.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger className="text-gray-700 dark:text-gray-300">How often is my financial data updated?</AccordionTrigger>
            <AccordionContent className="text-gray-600 dark:text-gray-400">
              Your financial data is typically updated daily. However, some transactions may take 1-2 business days to appear, depending on your bank's processing times.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger className="text-gray-700 dark:text-gray-300">Who made this?</AccordionTrigger>
            <AccordionContent className="text-gray-600 dark:text-gray-400">
              This was crafted by Taehoon Kang, currently a student of Computer Science at the University of Minnesota-Twin Cities. If you have any questions about the budget tracker or want to provide feedback, feel free to reach out to him at thkang091@gmail.com or kang0493@umn.edu. Your feedback would be greatly appreciated!
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto mt-10 p-6 bg-gray-100 dark:bg-gray-900">
      <ProfileHeader />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-white dark:bg-gray-800 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <ProfileImage />
              <h3 className="text-2xl font-semibold mb-2 text-indigo-700 dark:text-indigo-300">{userData.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">@{userData.username}</p>
              {editMode ? <ProfileForm /> : <ProfileInfo />}
            </div>
          </CardContent>
        </Card>
        <div className="md:col-span-2 space-y-6">
          <FinancialOverview />
          <InsightsAndRecommendations />
        </div>
        <FinancialHealthWidget />
      </div>
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20}}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md"
          >
            {error}
          </motion.div>
        )}
        {contextError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md"
          >
            {contextError}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-md"
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;