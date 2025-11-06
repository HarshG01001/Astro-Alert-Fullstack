// --- DOM Elements ---
const eventsContainer = document.getElementById('events-container');
const loadingMessage = document.getElementById('loading-message');
const mapElement = document.getElementById('map');

// ---
// CHANGE 1: We use the NASA API URL directly
// ---
const NASA_API_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=30';

// --- Map Initialization ---
let map;
try {
    map = L.map(mapElement).setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
} catch (e) {
    console.error("Could not initialize map:", e);
    if(mapElement) mapElement.innerHTML = "Map could not be loaded.";
}

// --- Functions ---
function getEventCoordinates(event) {
    const geometry = event.geometry[0];
    if (geometry.type === 'Point') {
        const [lon, lat] = geometry.coordinates;
        return { lat, lon };
    } else if (geometry.type === 'Polygon') {
        const [lon, lat] = geometry.coordinates[0][0];
        return { lat, lon };
    }
    return null;
}

function getCategoryIcon(categoryTitle) {
    const lowerCaseTitle = categoryTitle.toLowerCase();
    
    if (lowerCaseTitle.includes('wildfire')) return 'flame';
    if (lowerCaseTitle.includes('volcano')) return 'mountain';
    if (lowerCaseTitle.includes('storm')) return 'wind';
    if (lowerCaseTitle.includes('ice')) return 'snowflake';
    if (lowerCaseTitle.includes('earthquake')) return 'activity';
    if (lowerCaseTitle.includes('landslide')) return 'mountain-2';
    
    return 'globe-2';
}

async function fetchNaturalEvents() {
    try {
        // We fetch directly from NASA
        const response = await fetch(NASA_API_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // --- 
        // CHANGE 2: The data from NASA is an object { events: [...] }
        // We must extract the 'events' array from it.
        // ---
        const data = await response.json();
        const events = data.events; // This is the new, crucial line

        if (!events || events.length === 0) {
            loadingMessage.innerText = "No active events found.";
            return;
        }

        loadingMessage.style.display = 'none';

        events.forEach(event => {
            const card = document.createElement('div');
            card.classList.add('event-card');
            
            const eventDate = new Date(event.geometry[0].date).toLocaleDateString();
            const category = event.categories[0].title;
            const iconName = getCategoryIcon(category);

            card.innerHTML = `
                <div class="card-header">
                    <span class="card-category">
                        <i data-lucide="${iconName}"></i>
                        ${category}
                    </span>
                    <span class="card-date">${eventDate}</span>
                </div>
                <h3>${event.title}</h3>
                <div class="card-footer">
                    <a href="${event.sources[0].url}" target="_blank" rel="noopener noreferrer">View Source</a>
                </div>
            `;
            eventsContainer.appendChild(card);

            // Add marker to map
            if (map) {
                const coords = getEventCoordinates(event);
                if (coords) {
                    L.marker([coords.lat, coords.lon])
                        .addTo(map)
                        .bindPopup(`
                            <strong>${event.title}</strong>
                            <br>
                            Category: ${category}
                            <br>
                            Date: ${eventDate}
                        `);
                }
            }
        });
        
        lucide.createIcons();

    } catch (error) {
        console.error('Error fetching data:', error);
        // This is the error message you see, now with more detail
        loadingMessage.innerHTML = `
            <p style="color: red; font-weight: bold;">
                Could not fetch data. Please try again later.
            </p>
            <p>Error: ${error.message}</p>
        `;
    }
}

// --- Run on Page Load ---
// A small delay to ensure 'lucide' is ready
setTimeout(() => {
    fetchNaturalEvents();
}, 100);