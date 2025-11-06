// --- DOM Elements ---
const eventsContainer = document.getElementById('events-container');
const loadingMessage = document.getElementById('loading-message');

// --- API URL ---
const API_URL = '/api/events';

// --- NEW: Map Initialization ---
// Initialize the map and set its view to a global perspective
// [20, 0] is a good center latitude, 2 is a good zoom level to see the world.
const map = L.map('map').setView([20, 0], 2);

// Add the "tiles" to the map (the actual map images)
// We're using OpenStreetMap, which is free.
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


// --- Functions ---

/**
 * Gets the correct icon for each event category.
 */
function getCategoryIcon(categoryTitle) {
    const title = categoryTitle.toLowerCase();
    if (title.includes('wildfire')) return 'flame';
    if (title.includes('volcano')) return 'mountain';
    if (title.includes('storm')) return 'cloud-lightning';
    if (title.includes('ice')) return 'snowflake';
    if (title.includes('flood')) return 'cloud-drizzle';
    if (title.includes('landslide')) return 'mountain';
    if (title.includes('earthquake')) return 'activity';
    return 'globe-2'; // Default icon
}

/**
 * NEW: Safely extracts coordinates from an EONET event.
 * Handles both "Point" and "Polygon" event types.
 */
function getEventCoordinates(event) {
    const geometry = event.geometry[0]; // Get the most recent geometry
    
    if (geometry.type === 'Point') {
        // EONET uses [longitude, latitude]
        const [lon, lat] = geometry.coordinates;
        return { lat, lon };
    } else if (geometry.type === 'Polygon') {
        // For polygons, just take the first coordinate pair
        // EONET format: [[[lon, lat], [lon, lat], ...]]
        const [lon, lat] = geometry.coordinates[0][0];
        return { lat, lon };
    }
    return null; // No valid coordinates
}


/**
 * Fetches event data from our back-end API.
 */
async function fetchNaturalEvents() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const events = await response.json();

        // Hide the loading message
        loadingMessage.style.display = 'none';

        // Loop through each event
        events.forEach(event => {
            // --- 1. Create the Event Card (Same as before) ---
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

            // --- 2. NEW: Add a Marker to the Map ---
            const coords = getEventCoordinates(event);
            
            if (coords) {
                // Leaflet uses [latitude, longitude]
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
        });

        // Tell the lucide-icons library to draw all the new icons
        lucide.createIcons();

    } catch (error) {
        // Show a user-friendly error message
        console.error('Error fetching data:', error);
        loadingMessage.innerHTML = '<p>Error: Could not fetch data. Is the server running?</p>';
    }
}

// --- Run on Page Load ---
fetchNaturalEvents();

