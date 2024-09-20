// Global variables
let dungeons = [];
const filters = {};

// Function to fetch and parse the dungeons.txt file
async function fetchDungeons() {
    try {
        const response = await fetch('dungeons.txt');
        const text = await response.text();
        dungeons = parseDungeons(text);
        setupFilters();
        displayDungeons(dungeons);
    } catch (error) {
        console.error('Error fetching dungeons:', error);
    }
}

// Function to parse the dungeon text into an array of dungeon objects
function parseDungeons(text) {
    const dungeons = [];
    const dungeonTexts = text.split('*name=').slice(1);

    for (const dungeonText of dungeonTexts) {
        const dungeon = {};
        const lines = dungeonText.split('\n');

        dungeon.name = lines[0].trim(); // Set the name directly

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('*')) {
                const [key, value] = line.slice(1).split('=');
                dungeon[key.trim()] = value.trim();
            } else if (line.startsWith('||')) {
                const descriptionEnd = dungeonText.lastIndexOf('||');
                if (descriptionEnd > i) {
                    // Preserve line breaks in the description
                    dungeon.description = dungeonText.slice(dungeonText.indexOf('||') + 2, descriptionEnd)
                        .split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 0);
                }
                break;
            }
        }

        dungeons.push(dungeon);
    }

    return dungeons;
}

// Function to setup filters
function setupFilters() {
    const filtersContainer = document.getElementById('filters');
    filtersContainer.innerHTML = ''; // Clear existing filters

    // Collect all possible tags
    const tags = new Set();
    dungeons.forEach(dungeon => {
        Object.keys(dungeon).forEach(key => {
            if (key !== 'description' && key !== 'name') {
                tags.add(key);
            }
        });
    });

    // Create dropdown for each tag
    tags.forEach(tag => {
        const values = new Set(['none']);
        dungeons.forEach(dungeon => {
            if (dungeon[tag]) {
                values.add(dungeon[tag]);
            }
        });

        const select = document.createElement('select');
        select.id = tag;
        select.innerHTML = sortOptions(Array.from(values)).map(value => 
            `<option value="${value}">${value === 'none' ? 'All' : value}</option>`
        ).join('');

        const label = document.createElement('label');
        label.htmlFor = tag;
        label.textContent = tag + ': ';

        const div = document.createElement('div');
        div.appendChild(label);
        div.appendChild(select);

        filtersContainer.appendChild(div);

        // Add event listener for automatic filtering
        select.addEventListener('change', filterDungeons);
    });
}

// Function to sort options
function sortOptions(options) {
    return options.sort((a, b) => {
        if (a === 'none') return -1;
        if (b === 'none') return 1;

        const aNum = parseInt(a);
        const bNum = parseInt(b);

        if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
        } else if (!isNaN(aNum)) {
            return -1;
        } else if (!isNaN(bNum)) {
            return 1;
        } else {
            return a.localeCompare(b);
        }
    });
}

// Function to filter dungeons based on selected options
function filterDungeons() {
    // Update filters object
    document.querySelectorAll('#filters select').forEach(select => {
        filters[select.id] = select.value;
    });

    const filteredDungeons = dungeons.filter(dungeon => {
        return Object.entries(filters).every(([key, value]) => {
            return value === 'none' || dungeon[key] === value;
        });
    });

    displayDungeons(filteredDungeons);
}

// Function to display dungeons
function displayDungeons(dungeons) {
    const dungeonsContainer = document.getElementById('dungeons');
    dungeonsContainer.innerHTML = '';

    for (const dungeon of dungeons) {
        const dungeonElement = document.createElement('div');
        let dungeonHtml = `<h2>${dungeon.name}</h2>`; // Use name as the heading

        // Add all properties except description and name
        Object.entries(dungeon).forEach(([key, value]) => {
            if (key !== 'name' && key !== 'description') {
                dungeonHtml += `<p><strong>${key}:</strong> ${value}</p>`;
            }
        });

        // Display description with preserved formatting
        dungeonHtml += `<p><strong>Description:</strong></p><pre>${dungeon.description.join('\n')}</pre>`;

        dungeonElement.innerHTML = dungeonHtml;
        dungeonsContainer.appendChild(dungeonElement);
    }
}

// Initialize the page
fetchDungeons();
