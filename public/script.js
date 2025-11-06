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
        const response = await fetch(NASA_API_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const events = data.events; 

        if (!events || events.length === 0) {
            loadingMessage.innerText = "No active events found.";
            return;
        }

        loadingMessage.style.display = 'none';

        events.forEach(event => {
            // --- NEW: Get the unique event ID from NASA ---
            const eventId = event.id;

            // --- 1. Create the Event Card ---
            const card = document.createElement('div');
            card.classList.add('event-card');
            
            // --- NEW: Set the card's ID to the event ID ---
            // This is how we'll find it later
            card.id = eventId; 
            
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

            // --- 2. Add marker to map ---
            if (map) {
                const coords = getEventCoordinates(event);
                if (coords) {
                    const marker = L.marker([coords.lat, coords.lon])
                        .addTo(map)
                        .bindPopup(`
                            <strong>${event.title}</strong>
                            <br>
                            Category: ${category}
                            <br>
                            Date: ${eventDate}
                        `);

                    // --- NEW: Add the click listener to the marker ---
                    marker.on('click', () => {
                        // Find the card on the page using the ID
                        const cardElement = document.getElementById(eventId);
                        
                        if (cardElement) {
                            // Scroll the page to the card
                            cardElement.scrollIntoView({
                                behavior: 'smooth', // Smooth scroll
                                block: 'center'     // Put it in the center of the screen
                            });

                            // --- Add the highlight animation ---
                            
                            // Remove the class first (if it's already there)
                            cardElement.classList.remove('highlight');
                            
                            // This is a small "hack" to force the animation to restart
                            void cardElement.offsetWidth; 
                            
                            // Add the class to trigger the animation
                            cardElement.classList.add('highlight');

                            // Remove the class after the animation finishes
                            setTimeout(() => {
                                cardElement.classList.remove('highlight');
                            }, 1500); // 1.5 seconds, matching our CSS
                        }
                    });
                }
            }
        });
        
        lucide.createIcons();

    } catch (error) {
        console.error('Error fetching data:', error);
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