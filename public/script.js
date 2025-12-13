// Config
const NASA_API_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=100&days=90';

const eventsContainer = document.getElementById('events-container');
const loadingMessage = document.getElementById('loading-message');
let allEventsData = [];

// --- 1. Init Map ---
const map = L.map('map', {
    zoomControl: false,
    zoomSnap: 0,
    zoomDelta: 0.1,
    wheelPxPerZoomLevel: 120
}).setView([20, 0], 2.2);

map.on('focus', () => map.scrollWheelZoom.enable());
map.on('blur', () => map.scrollWheelZoom.disable());

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

// --- 2. Main Logic ---
async function fetchNaturalEvents() {
    try {
        const response = await fetch(NASA_API_URL);
        const data = await response.json();
        const events = data.events;
        allEventsData = events;

        if (!events || events.length === 0) {
            loadingMessage.innerHTML = "No active events found.";
            return;
        }

        loadingMessage.style.display = 'none';
        
        renderEvents(events);
        renderGlobalStats(); // Render the stats panel immediately
        lucide.createIcons();

    } catch (error) {
        console.error('Fetch Error:', error);
        loadingMessage.innerHTML = "Failed to load data.";
    }
}

// --- 3. Helper: Determine Region from Coordinates ---
function getRegion(lat, lon) {
    if (lat < -60) return "Antarctica";
    if (lat > 15 && lon < -30) return "North America";
    if (lat < 15 && lon < -30) return "South America";
    if (lat > 35 && lon > -30 && lon < 60) return "Europe";
    if (lat < 35 && lat > -35 && lon > -20 && lon < 60) return "Africa";
    if (lat > 10 && lon > 60) return "Asia";
    if (lat < 10 && lon > 100) return "Oceania";
    return "Oceanic/Global";
}

// --- 4. Render Global Stats & Button ---
function renderGlobalStats() {
    const output = document.getElementById('report-text');
    if (!output) return;
    
    // Calculate Counts by Category
    const stats = {};
    allEventsData.forEach(e => {
        const cat = e.categories[0].title;
        stats[cat] = (stats[cat] || 0) + 1;
    });

    // Build List HTML
    const statList = Object.entries(stats)
        .map(([key, val]) => `<div style="display:flex; justify-content:space-between; margin-bottom:4px; color:#cbd5e1;"><span>${key}</span> <strong style="color:#fff;">${val}</strong></div>`)
        .join('');
    
    output.innerHTML = `
        <div style="margin-bottom: 15px; font-size: 0.9rem; border-bottom: 1px solid #334155; padding-bottom: 10px;">
            <div style="margin-bottom:10px; color:#38bdf8;"><strong>Active Events: ${allEventsData.length}</strong></div>
            ${statList}
        </div>
        
        <button id="btn-global-forecast" class="btn-sidebar" onclick="fetchGlobalForecast()">
            <i data-lucide="sparkles" style="width:16px; display:inline-block; vertical-align:middle;"></i> Generate Detailed Analysis
        </button>
        
        <div id="forecast-result" style="margin-top:15px; font-size:0.9rem; line-height:1.6; color:#cbd5e1;"></div>
    `;
    lucide.createIcons();
}

// --- 5. Call AI with GEOGRAPHIC DATA ---
async function fetchGlobalForecast() {
    const resultBox = document.getElementById('forecast-result');
    const btn = document.getElementById('btn-global-forecast');
    
    btn.disabled = true;
    btn.innerHTML = "Processing Regional Telemetry...";
    resultBox.innerHTML = "";

    // --- CRITICAL STEP: Build Geographic Summary ---
    const geoStats = {}; 
    // Format: { "Wildfires": { "North America": 5, "Africa": 2 } }

    allEventsData.forEach(e => {
        const cat = e.categories[0].title;
        const coords = getCoords(e);
        if (coords) {
            const region = getRegion(coords.lat, coords.lon);
            
            if (!geoStats[cat]) geoStats[cat] = {};
            if (!geoStats[cat][region]) geoStats[cat][region] = 0;
            
            geoStats[cat][region]++;
        }
    });

    // Convert object to a readable string for the AI
    // Example output: "Wildfires: 15 total (North America: 10, Africa: 5). Severe Storms: 3 total (Asia: 3)."
    let aiPayload = [];
    for (const [cat, regions] of Object.entries(geoStats)) {
        const regionStr = Object.entries(regions)
            .map(([rName, count]) => `${rName}: ${count}`)
            .join(', ');
        
        // Calculate total for this cat
        const total = Object.values(regions).reduce((a, b) => a + b, 0);
        
        aiPayload.push(`Category ${cat}: ${total} total events. Distribution: [${regionStr}]`);
    }
    
    const finalPayload = aiPayload.join(". ");
    console.log("Sending to AI:", finalPayload); // Debugging

    try {
        const response = await fetch('/api/briefing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventsSummary: finalPayload })
        });

        const data = await response.json();

        if (data.analysis) {
            // Success
            resultBox.innerHTML = `<div style="border-left: 3px solid #38bdf8; padding-left: 10px;">${data.analysis}</div>`;
            btn.innerHTML = "Update Analysis";
        } else {
            throw new Error("No analysis returned");
        }

    } catch (e) {
        console.warn("Forecast failed:", e);
        resultBox.innerHTML = "AI Connection Failed. Please try again.";
        btn.innerHTML = "Retry Analysis";
    } finally {
        btn.disabled = false;
    }
}

// --- 6. Render Events (Left Panel & Map) ---
function renderEvents(events) {
    events.forEach(event => {
        const eventId = event.id;
        const title = event.title;
        const category = event.categories[0].title;
        const date = new Date(event.geometry[0].date).toLocaleDateString();
        const icon = getCategoryIcon(category);

        const coords = getCoords(event);
        if (coords) {
            const marker = L.circleMarker([coords.lat, coords.lon], {
                radius: 6,
                fillColor: getMarkerColor(category),
                color: '#ffffff',
                weight: 1,
                opacity: 0.8,
                fillOpacity: 0.7
            }).addTo(map);

            marker.bindPopup(`<b>${title}</b><br>${category}`);
            
            marker.on('click', () => {
                const card = document.getElementById(eventId);
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.classList.add('highlight');
                    setTimeout(() => card.classList.remove('highlight'), 1500);
                }
            });
        }

        const card = document.createElement('div');
        card.className = 'event-card';
        card.id = eventId;
        card.innerHTML = `
            <div class="card-header">
                <span class="card-cat"><i data-lucide="${icon}"></i> ${category}</span>
                <span>${date}</span>
            </div>
            <h3>${title}</h3>
            <div id="ai-${eventId}" class="ai-output"></div>
            <div class="card-actions">
                <a href="${event.sources[0].url}" target="_blank" class="btn btn-source">View Source</a>
                <button class="btn btn-analyze" onclick="analyzeEvent('${eventId}', '${title.replace(/'/g, "\\'")}', '${category}')">
                    Analyze Impact
                </button>
            </div>
        `;
        eventsContainer.appendChild(card);
    });
}

// --- 7. Single Event Analysis ---
async function analyzeEvent(id, title, category) {
    const output = document.getElementById(`ai-${id}`);
    const btn = document.querySelector(`button[onclick*="${id}"]`);
    
    output.style.display = 'block';
    output.innerHTML = "<i>Analyzing...</i>";
    btn.disabled = true;

    try {
        const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, category })
        });

        const data = await res.json();
        
        output.innerText = "";
        let i = 0;
        function type() {
            if (i < data.analysis.length) {
                output.innerHTML += data.analysis.charAt(i);
                i++;
                setTimeout(type, 10);
            }
        }
        type();

    } catch (e) {
        output.innerHTML = "Analysis unavailable.";
    } finally {
        btn.disabled = false;
    }
}

// Helpers
function getCoords(event) {
    const geom = event.geometry[0];
    if (geom.type === 'Point') return { lat: geom.coordinates[1], lon: geom.coordinates[0] };
    if (geom.type === 'Polygon') return { lat: geom.coordinates[0][1], lon: geom.coordinates[0][0] };
    return null;
}

function getCategoryIcon(c) {
    c = c.toLowerCase();
    if (c.includes('fire')) return 'flame';
    if (c.includes('storm')) return 'cloud-lightning';
    if (c.includes('ice')) return 'snowflake';
    if (c.includes('volcano')) return 'mountain';
    return 'activity';
}

function getMarkerColor(c) {
    c = c.toLowerCase();
    if (c.includes('fire')) return '#ef4444'; 
    if (c.includes('ice')) return '#38bdf8'; 
    if (c.includes('storm')) return '#facc15'; 
    if (c.includes('volcano')) return '#f97316'; 
    return '#4ade80'; 
}

fetchNaturalEvents();