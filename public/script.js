// Config: 90 days lookback, 100 event limit
const NASA_API_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=100&days=90';

const eventsContainer = document.getElementById('events-container');
const loadingMessage = document.getElementById('loading-message');
let allEventsData = [];

// --- 1. Init Map (Satellite + Smooth Zoom Fix) ---
const map = L.map('map', {
    zoomSnap: 0.25,        // Allows fractional zoom levels
    zoomDelta: 0.5,        // Smaller steps when clicking +/-
    wheelPxPerZoomLevel: 120 // Smoother scroll wheel
}).setView([20, 0], 2.25);

// Esri World Imagery (Satellite Tiles)
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri'
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
        lucide.createIcons();

        // AUTOMATIC AI BRIEFING
        generateDailyBriefing();

    } catch (error) {
        console.error('Fetch Error:', error);
        loadingMessage.innerHTML = "Failed to load NASA data.";
    }
}

// --- 3. Render Functions ---
function renderEvents(events) {
    events.forEach(event => {
        const eventId = event.id;
        const title = event.title;
        const category = event.categories[0].title;
        const date = new Date(event.geometry[0].date).toLocaleDateString();
        const icon = getCategoryIcon(category);

        // Map Marker
        const coords = getCoords(event);
        if (coords) {
            const marker = L.circleMarker([coords.lat, coords.lon], {
                radius: 6,
                fillColor: getMarkerColor(category),
                color: '#ffffff',
                weight: 1.5,
                opacity: 1,
                fillOpacity: 0.9
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

        // List Card
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
                <a href="${event.sources[0].url}" target="_blank" class="btn btn-source">Source</a>
                <button class="btn btn-analyze" onclick="analyzeEvent('${eventId}', '${title.replace(/'/g, "\\'")}', '${category}')">
                    Analyze Impact
                </button>
            </div>
        `;
        eventsContainer.appendChild(card);
    });
}

// --- 4. AI Functions ---

async function generateDailyBriefing() {
    const output = document.getElementById('briefing-text');
    
    // Summary of top 10 events
    const summary = allEventsData.slice(0, 10).map(e => e.title).join(", ");
    
    try {
        const res = await fetch('/api/briefing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventsSummary: summary })
        });
        const data = await res.json();
        typeWriter(output, data.analysis);
    } catch (e) {
        output.innerHTML = "Briefing unavailable.";
    }
}

async function analyzeEvent(id, title, category) {
    const output = document.getElementById(`ai-${id}`);
    const btn = document.querySelector(`button[onclick*="${id}"]`);
    
    output.style.display = 'block';
    output.innerHTML = "<i>Analyzing telemetry...</i>";
    btn.disabled = true;

    try {
        const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, category })
        });
        const data = await res.json();
        typeWriter(output, data.analysis);
    } catch (e) {
        output.innerHTML = "Analysis unavailable.";
    } finally {
        btn.disabled = false;
    }
}

// Helpers
function typeWriter(element, text) {
    element.innerHTML = "";
    let i = 0;
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, 20);
        }
    }
    type();
}

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
    if (c.includes('fire')) return '#f87171'; 
    if (c.includes('ice')) return '#38bdf8'; 
    if (c.includes('storm')) return '#facc15'; 
    return '#4ade80'; 
}

fetchNaturalEvents();