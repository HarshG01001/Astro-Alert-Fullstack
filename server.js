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

// 2. Tell Express to serve all files from the 'public' folder.
// This ALSO serves 'index.html' at the root URL.
app.use(express.static(path.join(__dirname, 'public')));

// --- (The crashing 'app.get(*)' route has been removed) ---

// --- Start the Server ---
app.listen(PORT, HOST, () => {
    // This will now listen on 0.0.0.0:10000 (on Render)
    console.log(`AstroAlert server (static) running on ${HOST}:${PORT}`);
});