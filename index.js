// Load environment variables from .env
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();

// Load env vars
const PORT = process.env.PORT || 3000;
const HUBSPOT_PRIVATE_APP_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
const HUBSPOT_ACCOUNT_ID = process.env.HUBSPOT_ACCOUNT_ID;
const HUBSPOT_CUSTOM_OBJECT_TYPE = process.env.HUBSPOT_CUSTOM_OBJECT_TYPE;

// Basic safety check for required env vars
if (!HUBSPOT_PRIVATE_APP_TOKEN || !HUBSPOT_CUSTOM_OBJECT_TYPE) {
  console.warn('Missing HubSpot env vars. Check your .env file.');
}

// Express configuration
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Axios instance for HubSpot API
const hubspotApi = axios.create({
  baseURL: 'https://api.hubapi.com',
  headers: {
    Authorization: `Bearer ${HUBSPOT_PRIVATE_APP_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// 1) Homepage route ("/") – list custom object records
app.get('/', async (req, res) => {
  try {
    const limit = 50;
    const properties = ['name', 'species', 'bio']; // update if your property internal names differ

    const response = await hubspotApi.get(
      `/crm/v3/objects/${HUBSPOT_CUSTOM_OBJECT_TYPE}`,
      {
        params: {
          limit,
          properties: properties.join(',')
        }
      }
    );

    const records = response.data.results || [];

    res.render('homepage', {
      title: 'Custom Object Records | Integrating With HubSpot I Practicum',
      records,
      properties
    });
  } catch (error) {
    console.error(
      'Error fetching custom object records from HubSpot:',
      error.response?.data || error.message
    );
    res.status(500).send('Error fetching records from HubSpot');
  }
});

// 2) GET "/update-cobj" – render the form
app.get('/update-cobj', (req, res) => {
  res.render('updates', {
    title: 'Update Custom Object Form | Integrating With HubSpot I Practicum'
  });
});

// 3) POST "/update-cobj" – create new record and redirect home
app.post('/update-cobj', async (req, res) => {
  const { name, species, bio } = req.body; // field names must match your form inputs

  const data = {
    properties: {
      name,
      species,
      bio
    }
  };

  try {
    await hubspotApi.post(
      `/crm/v3/objects/${HUBSPOT_CUSTOM_OBJECT_TYPE}`,
      data
    );
    res.redirect('/');
  } catch (error) {
    console.error(
      'Error creating custom object record in HubSpot:',
      error.response?.data || error.message
    );
    res.status(500).send('Error creating record in HubSpot');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});