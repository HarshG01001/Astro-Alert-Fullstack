const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); 
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json());
// This line automatically serves index.html at the root URL
app.use(express.static(path.join(__dirname, 'public')));

// Configure AI
let genAI = null;
if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
    console.warn("⚠️ GEMINI_API_KEY is missing in .env file");
}

// --- AI Route 1: Individual Technical Analysis ---
app.post('/api/analyze', async (req, res) => {
    try {
        if (!genAI) return res.status(503).json({ error: "AI unavailable." });
        
        const { title, category } = req.body;
        const prompt = `Act as a Disaster Response Specialist. Analyze the event "${title}" (${category}). 
        Provide a 2-sentence technical assessment of potential risks and severity.`;

        const model = genAI.getGenerativeModel({ model: "gemini-pro"});
        const result = await model.generateContent(prompt);
        res.json({ analysis: await result.response.text() });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "Analysis failed." });
    }
});

// --- AI Route 2: Daily Global Briefing ---
app.post('/api/briefing', async (req, res) => {
    try {
        if (!genAI) return res.status(503).json({ error: "AI unavailable." });
        
        const { eventsSummary } = req.body;
        const prompt = `You are a Planetary Defense AI. 
        Here is a summary of active natural events: ${eventsSummary}.
        Generate a "Daily Situation Report" (max 80 words). 
        Summarize active threats and conclude with a global threat level (Low/Medium/High).`;

        const model = genAI.getGenerativeModel({ model: "gemini-pro"});
        const result = await model.generateContent(prompt);
        res.json({ analysis: await result.response.text() });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "Briefing failed." });
    }
});

// (Deleted the crashing app.get(*) route)

app.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`);
});
```
