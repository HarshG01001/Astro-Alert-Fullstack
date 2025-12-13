const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); 
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configure AI
const genAI = process.env.GEMINI_API_KEY 
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) 
    : null;

// Route 1: Analysis
app.post('/api/analyze', async (req, res) => {
    try {
        if (!genAI) return res.status(503).json({ error: "AI unavailable." });
        const { title, category } = req.body;
        
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite"});
        const result = await model.generateContent(`Analyze event: "${title}" (${category}). 1 sentence on severity.`);
        res.json({ analysis: await result.response.text() });
    } catch (error) {
        if (error.status === 429) return res.json({ analysis: "⚠️ AI Busy." });
        res.status(500).json({ error: "Failed" });
    }
});

// Route 2: Detailed Global Forecast
app.post('/api/briefing', async (req, res) => {
    try {
        if (!genAI) return res.status(503).json({ error: "AI unavailable." });
        
        const { eventsSummary } = req.body;
        
        // Detailed, Elaborate Prompt
        const prompt = `
        Act as a Senior Planetary Hazard Analyst.
        Input Data (Active Events by Region): ${eventsSummary}.
        
        Task: Write a comprehensive "Global Situation Forecast" (approx 150 words).
        
        Structure:
        1. **Global Executive Summary**: A brief overview of the current state of the planet's natural events.
        2. **Regional Hotspots**: Identify which continents are facing the highest activity and what type of events they are (e.g., "North America is currently the epicenter for wildfire activity...").
        3. **Risk & Aftereffects**: Describe the potential severity and typical aftereffects for the dominant event types (e.g., air quality issues for fires, flooding for storms).
        
        Tone: Professional, scientific, and authoritative. Use HTML formatting (<br>, <strong>) for readability.
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite"});
        const result = await model.generateContent(prompt);
        res.json({ analysis: await result.response.text() });

    } catch (error) {
        console.error("Briefing Error:", error.message);
        res.status(500).json({ error: "Failed" });
    }
});

app.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`);
});