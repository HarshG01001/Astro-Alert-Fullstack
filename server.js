// --- Imports ---
// 1. 'express' is the server framework
const express = require('express');
// 2. 'axios' is for making API requests
const axios = require('axios');
// 3. 'cors' allows our front-end to talk to our back-end
const cors = require('cors');

// --- App Initialization ---
const app = express();
// We'll run our server on port 3000
const PORT = 3000;

// --- Middleware ---
// 1. Use CORS to allow cross-origin requests
app.use(cors());
// 2. Tell Express to serve our 'public' folder as the front-end
app.use(express.static('public'));

// --- API Endpoint ---
// This is the core of our back-end.
// We create a new API endpoint at '/api/events'
app.get('/api/events', async (req, res) => {
    try {
        // The NASA API we want to get data from
        const NASA_EONET_API = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=30';
        
        // 1. Make a request to the NASA API using axios
        const response = await axios.get(NASA_EONET_API);
        
        // 2. Get the specific data we want (the list of events)
        const events = response.data.events;
        
        // 3. Send that data back to our front-end as JSON
        res.json(events);

    } catch (error) {
        // If anything goes wrong, log it and send an error message
        console.error('Error fetching data from NASA API:', error.message);
        res.status(500).json({ message: 'Error fetching data' });
    }
});

// --- Start the Server ---
// This tells our app to "listen" for requests on our defined port
app.listen(PORT, () => {
    console.log(`AstroAlert server running on http://localhost:${PORT}`);
});
