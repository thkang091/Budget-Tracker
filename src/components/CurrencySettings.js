import React from 'react';
import { useFinanceContext } from '../contexts/FinanceContext';

const CurrencySettings = () => {
  const { currencies, defaultCurrency, setDefaultCurrency } = useFinanceContext();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Currency Settings</h2>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="defaultCurrency">
          Default Currency
        </label>
        <select
          id="defaultCurrency"
          value={defaultCurrency}
          onChange={(e) => setDefaultCurrency(e.target.value)}
          className="shadow border rounded w-full py-2 px-3 text-gray-700"
        >
          {currencies.map(currency => (
            <option key={currency.code} value={currency.code}>
              {currency.code} ({currency.symbol})
            </option>
          ))}
        </select>
      </div>
      <p className="text-sm text-gray-600">
        This setting will be used as the default currency for new expenses and budgets.
      </p>
    </div>
  );
};

export default CurrencySettings;