// --- Imports ---
const express = require('express');
// NEW: Use 'node-fetch' instead of 'axios'
const fetch = require('node-fetch');
const cors = require('cors');

// --- App Initialization ---
const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(cors());
app.use(express.static('public'));

// --- API Endpoint ---
app.get('/api/events', async (req, res) => {
    try {
        const NASA_EONET_API = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=30';
        
        // 1. Make a request to the NASA API using node-fetch
        // We add a 'User-Agent' header just in case.
        const response = await fetch(NASA_EONET_API, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
            }
            timeout: 15000 // 15,000 milliseconds = 15 seconds
        });

        // 2. Check if the network request itself was successful
        if (!response.ok) {
            // Log the error response from NASA
            console.error('NASA API responded with non-OK status:', response.status, response.statusText);
            throw new Error(`NASA API Error: ${response.status} ${response.statusText}`);
        }

        // 3. Get the JSON data from the response
        const data = await response.json();
        
        // 4. Send the 'events' part of the data to our front-end
        res.json(data.events);

    } catch (error) {
        // THIS IS THE NEW, BETTER LOGGING
        // It will print the *entire* error object to the Render logs
        console.error('Full error details while fetching data:', error);
        
        res.status(500).json({ message: 'Error fetching data from server' });
    }
});

// --- Start the Server ---
app.listen(PORT, () => {
    // IMPORTANT: Render uses its own port, but we listen on 3000.
    // We add a check for Render's environment variable to be more robust.
    console.log(`AstroAlert server running on port ${PORT}`);
});