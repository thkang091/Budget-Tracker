import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Briefcase, Plus, X } from 'lucide-react';
import { useFinanceContext } from '../contexts/FinanceContext';
import { usePlaidLink } from 'react-plaid-link';
import { toast } from 'react-toastify';

const ConnectedAccounts = () => {
  const { 
    connectedAccounts, 
    generatePlaidLinkToken, 
    exchangePlaidPublicToken,
    fetchPlaidAccounts,
    formatCurrency,
    handleDisconnectBank
  } = useFinanceContext();

  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Generating Plaid link token...');
      const token = await generatePlaidLinkToken();
      console.log('Plaid link token generated:', token);
      setLinkToken(token);
    } catch (error) {
      console.error('Error generating Plaid link token:', error);
      setError(`Failed to initialize bank connection: ${error.message}`);
      toast.error(`Failed to connect to bank: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [generatePlaidLinkToken]);

  useEffect(() => {
    generateToken();
  }, [generateToken]);

  const handleOnSuccess = useCallback(async (publicToken, metadata) => {
    console.log('Plaid Link success:', publicToken, metadata);
    try {
      await exchangePlaidPublicToken(publicToken, metadata.institution.name);
      await fetchPlaidAccounts();
      toast.success(`Successfully connected to ${metadata.institution.name}`);
    } catch (error) {
      console.error('Error in Plaid link onSuccess:', error);
      toast.error('Failed to connect bank account. Please try again.');
    }
  }, [exchangePlaidPublicToken, fetchPlaidAccounts]);

  const handleOnExit = useCallback((err, metadata) => {
    console.log('Plaid Link exit:', err, metadata);
    if (err != null) {
      console.error('Plaid link error:', err, metadata);
      toast.error('An error occurred while connecting your bank. Please try again.');
    }
  }, []);

  const config = {
    token: linkToken,
    onSuccess: handleOnSuccess,
    onExit: handleOnExit,
  };

  const { open, ready } = usePlaidLink(config);

  const handleConnectBank = () => {
    if (linkToken) {
      console.log('Opening Plaid Link...');
      open();
    } else {
      console.log('No link token, generating...');
      generateToken();
    }
  };

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader className="bg-blue-100">
        <h3 className="text-xl font-semibold flex items-center text-blue-700">
          <Briefcase className="mr-2 h-5 w-5" /> Connected Bank Accounts
        </h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {connectedAccounts.map((account) => (
            <div key={account.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div>
                <span className="text-gray-700 font-semibold">{account.name}</span>
                <p className="text-sm text-gray-500">{account.official_name}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-blue-600 font-semibold">
                  {formatCurrency(account.balances.current, account.balances.iso_currency_code)}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDisconnectBank(account.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button 
            onClick={handleConnectBank}
            disabled={!ready || loading}
            className="w-full bg-blue-500 text-white hover:bg-blue-600"
          >
            {loading ? 'Connecting...' : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Connect New Bank
              </>
            )}
          </Button>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectedAccounts;