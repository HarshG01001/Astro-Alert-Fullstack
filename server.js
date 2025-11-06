// --- Imports ---
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

// --- App Initialization ---
const app = express();
const PORT = 3000;

// --- Caching Variables ---
let cachedData = null;    // This will hold our NASA event data
let lastFetchTime = 0;    // This holds the timestamp of our last successful fetch
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

// --- Middleware ---
app.use(cors());
app.use(express.static('public'));

// --- API Endpoint ---
app.get('/api/events', async (req, res) => {
    const currentTime = Date.now();
    const cacheAge = currentTime - lastFetchTime;

    // Check if we have valid, non-expired cache
    if (cachedData && (cacheAge < CACHE_DURATION)) {
        console.log("Serving from CACHE.");
        // We have good cache, send it instantly
        return res.json(cachedData);
    }

    // --- Cache is old or empty, we must fetch new data ---
    console.log("Fetching FRESH data from NASA...");
    const NASA_EONET_API = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=30';

    try {
        const response = await fetch(NASA_EONET_API, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
            },
            timeout: 15000 // Keep the 15-second timeout
        });

        if (!response.ok) {
            throw new Error(`NASA API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Save the new data to our cache
        cachedData = data.events;
        lastFetchTime = Date.now();
        
        console.log("New data fetched and cached.");
        // Send the fresh data to the user
        res.json(cachedData);

    } catch (error) {
        // --- FETCH FAILED! ---
        console.error('Full error details while fetching data:', error);

        // **This is the critical reliability fix:**
        // If the fetch fails, check if we have *any* old data (even stale)
        if (cachedData) {
            console.warn("Serving STALE data from cache due to fetch failure.");
            // Send the old, stale data. This is better than an error!
            res.json(cachedData);
        } else {
            // Fetch failed AND we have no cache at all. This is the only time the user sees an error.
            res.status(500).json({ message: 'Error fetching data from server' });
        }
    }
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`AstroAlert server running on port ${PORT}`);
});