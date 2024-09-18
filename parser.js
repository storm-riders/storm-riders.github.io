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

        for (const line of lines) {
            if (line.startsWith('*')) {
                const [key, value] = line.slice(1).split('=');
                dungeon[key.trim()] = value.trim();
            } else if (line.startsWith('||')) {
                break;
            }
        }

        const descriptionStart = dungeonText.indexOf('||') + 2;
        const descriptionEnd = dungeonText.lastIndexOf('||');
        if (descriptionStart > 1 && descriptionEnd > descriptionStart) {
            dungeon.description = dungeonText.slice(descriptionStart, descriptionEnd).trim();
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
            if (key !== 'description') {
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

        // Sort dropdowns based on custom rules
        let sortedValues = Array.from(values);
        if (tag === 'members') {
            sortedValues = sortedValues.sort((a, b) => {
                const order = ['none', 'solo', '1 to 2', '2 to 3', '2 to 4'];
                return order.indexOf(a) - order.indexOf(b);
            });
        } else if (['area', 'material'].includes(tag)) {
            sortedValues = sortedValues.sort((a, b) => a.localeCompare(b));
        } else if (['MaxDailyRuns', 'MinLevel', 'points'].includes(tag)) {
            sortedValues = sortedValues.sort((a, b) => (a === 'none' ? -1 : b === 'none' ? 1 : a - b));
        }

        // Create dropdown select
        const select = document.createElement('select');
        select.id = tag;
        select.innerHTML = sortedValues.map(value => 
            `<option value="${value}">${value}</option>`
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

    // Create "Set All to None" button
    const setAllButton = document.createElement('button');
    setAllButton.textContent = 'Set All to None';
    setAllButton.addEventListener('click', () => {
        document.querySelectorAll('#filters select').forEach(select => {
            select.value = 'none';
        });
        filterDungeons(); // Trigger filtering after resetting
    });
    filtersContainer.insertBefore(setAllButton, filtersContainer.firstChild);
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

    if (dungeons.length === 0) {
        dungeonsContainer.innerHTML = '<p>No search results found</p>';
        return;
    }

    for (const dungeon of dungeons) {
        const dungeonElement = document.createElement('div');
        let dungeonHtml = `<h2>${dungeon.name}</h2>`;

        // Add all properties except description
        Object.entries(dungeon).forEach(([key, value]) => {
            if (key !== 'name' && key !== 'description') {
                dungeonHtml += `<p>${key}: ${value}</p>`;
            }
        });

        dungeonHtml += `<p>Description: ${dungeon.description}</p>`;
        dungeonElement.innerHTML = dungeonHtml;
        dungeonsContainer.appendChild(dungeonElement);
    }
}

// Initialize the page
fetchDungeons();
