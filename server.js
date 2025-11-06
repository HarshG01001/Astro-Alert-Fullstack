// --- Imports ---
const express = require('express');
const cors = require('cors');
const path = require('path'); // Node.js 'path' module

// --- App Initialization ---
const app = express();
// This is the correct way to get Render's port
const PORT = process.env.PORT || 3000;
// This is the host Render's docs recommend
const HOST = '0.0.0.0';

// --- Middleware ---
// 1. Enable CORS for all routes (good practice)
app.use(cors());

// 2. Tell Express to serve all files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// 3. A "catch-all" route to serve index.html
// This ensures that visiting your main URL serves the page
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Start the Server ---
app.listen(PORT, HOST, () => {
    // This will now listen on 0.0.0.0:10000 (on Render)
    console.log(`AstroAlert server (static) running on ${HOST}:${PORT}`);
});