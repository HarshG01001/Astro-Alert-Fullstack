# AstroAlert 🛰️

**Intelligent Global Natural Event Monitor**

## 🚀 Live Demo

[**View Live Project on Render**]
(https://astro-alert-upmd.onrender.com)

## 📖 Overview

**AstroAlert** is a dynamic full-stack web application designed to track, visualize, and analyze global natural events in near real-time. Developed as a capstone project for the Agnirva Space Program Software Development Internship, it serves as a centralized hub for planetary situational awareness.

The application leverages the **NASA EONET API** to source live data on wildfires, severe storms, volcanoes, and sea ice. Going beyond simple visualization, AstroAlert integrates **Google's Gemini 2.0 Flash AI** to act as an intelligent analyst, providing real-time strategic situation forecasts and tactical risk assessments for specific events.

<img width="1913" height="906" alt="image" src="https://github.com/user-attachments/assets/09a0b264-d59b-4bfe-86bd-0ab1e60b7b44" />


## ✨ Key Features

### 🌍 **Interactive Geospatial Visualization**

* **Professional Mapping:** Utilizes `Leaflet.js` with **CartoDB Dark Matter** tiles to provide a high-contrast, professional interface suitable for monitoring.

* **Dynamic Event Plotting:** Events are automatically fetched and plotted with color-coded markers (Red for Fire, Blue for Ice, Yellow for Storms) for instant visual recognition.

* **Fluid Navigation:** Optimized map controls allow for smooth zooming and panning across the globe.

### 🤖 **Dual-Mode AI Intelligence**

* **Global Situation Forecast:** The system aggregates raw event data into regional statistics and uses Google Gemini AI to generate a "Daily Situation Report." This report identifies regional hotspots and assesses the overall global threat level.

* **Tactical Event Analysis:** Users can select any specific event to receive an instant AI-generated technical assessment regarding potential severity, environmental impact, and risks.

### ⚡ **Responsive Dashboard Interface**

* **Split-View Layout:** Features a modern dashboard design with an independently scrollable event stream alongside a sticky AI briefing panel.

* **Stats-First Architecture:** Implements a "Stats-First" loading strategy, ensuring users see quantitative data immediately while AI reports generate in the background.


## 🛠️ Tech Stack

* **Front-End:** HTML5, CSS3, Vanilla JavaScript (ES6+)

* **Back-End:** Node.js, Express.js

* **Mapping Engine:** Leaflet.js

* **AI Integration:** Google Gemini API (`gemini-2.0-flash`)

* **Data Source:** NASA EONET (Earth Observatory Natural Event Tracker) API

* **Deployment:** Render (Web Service)

## 🔮 Future Roadmap

* **Historical Data Timeline:** Implementation of a time-slider to visualize the progression of events over weeks or months.

* **User Alerts System:** A notification service allowing users to subscribe to alerts for specific geographic regions or event types.

* **3D Globe Mode:** An optional WebGL-based 3D visualization using `Globe.gl` for a macro-level planetary view.
