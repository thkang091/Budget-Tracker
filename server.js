const express = require('express');
const cors = require('cors');
const path = require('path');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
require('dotenv').config();


const app = express();

// Increase the limit for request headers and enable CORS
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Plaid configuration
const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(config);
app.use(express.static(path.join(__dirname, 'build')));

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Plaid API server');
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Create a link token
app.post('/api/create_link_token', async (req, res) => {
  try {
    console.log('Received request to create link token');
    const clientUserId = 'user_' + Math.random().toString(36).substring(2, 15);
    const request = {
      user: { client_user_id: clientUserId },
      client_name: 'Your App Name',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    };

    console.log('Creating link token with request:', JSON.stringify(request));
    const createTokenResponse = await plaidClient.linkTokenCreate(request);
    console.log('Link token created successfully:', createTokenResponse.data.link_token);
    res.json({ link_token: createTokenResponse.data.link_token });
  } catch (error) {
    console.error('Error creating link token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Exchange public token for access token
app.post('/api/exchange_public_token', async (req, res) => {
  const { public_token } = req.body;
  try {
    console.log('Exchanging public token:', public_token);
    const response = await plaidClient.itemPublicTokenExchange({ public_token });
    console.log('Public token exchanged successfully');
    // TODO: Save the access_token and item_id to your database
    res.json({ access_token: response.data.access_token, item_id: response.data.item_id });
  } catch (error) {
    console.error('Error exchanging public token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch accounts
app.get('/api/accounts', async (req, res) => {
  // TODO: Retrieve the access_token from your database
  const access_token = 'YOUR_ACCESS_TOKEN';
  try {
    console.log('Fetching accounts for access token:', access_token);
    const response = await plaidClient.accountsGet({ access_token });
    console.log('Accounts fetched successfully');
    res.json({ accounts: response.data.accounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Plaid environment:', process.env.PLAID_ENV);
  console.log('Plaid client ID:', process.env.PLAID_CLIENT_ID);
  console.log('Plaid secret:', process.env.PLAID_SECRET ? '[SET]' : '[NOT SET]');
});