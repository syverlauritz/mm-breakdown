// Initialize Fancybox
Fancybox.bind("[data-fancybox]", {
    // Custom options
    dragToClose: false,
    toolbar: true,
    closeButton: "top",
    Image: {
        zoom: true,
    },
    // Prepare for future content
    on: {
        ready: (fancybox) => {
            // This will be used when we add content
            const container = fancybox.container;
            container.classList.add('scrollable-content');
        }
    }
});

// Function to format timecode
function formatTimecode(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30); // Assuming 30fps

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
}

// Function to create grid items
function createGridItem(shotNumber, timecode) {
    const div = document.createElement('div');
    div.className = 'grid-item';
    
    // Use thumbnail for grid view
    const thumbnailPath = `output/shots/thumbnails/Memory Maker-Scene-${shotNumber}-01.jpg`;
    const fullImagePath = `output/shots/Memory Maker-Scene-${shotNumber}-01.jpg`;
    
    const img = document.createElement('img');
    img.src = thumbnailPath;
    img.alt = `Shot at ${timecode}`;
    img.loading = 'lazy';
    img.onload = () => {
        div.classList.add('loaded');
    };
    
    const timecodeDiv = document.createElement('div');
    timecodeDiv.className = 'timecode';
    timecodeDiv.textContent = timecode;
    
    div.appendChild(img);
    div.appendChild(timecodeDiv);
    
    // Add Fancybox data attribute with full resolution image
    div.setAttribute('data-fancybox', 'gallery');
    div.setAttribute('data-src', fullImagePath);
    
    return div;
}

// Function to populate the grid
async function populateGrid() {
    const grid = document.querySelector('.grid');
    const totalShots = 99; // Total number of shots
    
    for (let i = 1; i <= totalShots; i++) {
        const shotNumber = i.toString().padStart(3, '0');
        const timecode = formatTimecode(i * 2.8); // Assuming 2.8 seconds per shot
        
        const gridItem = createGridItem(shotNumber, timecode);
        grid.appendChild(gridItem);
    }
}

// Initialize the grid when the page loads
document.addEventListener('DOMContentLoaded', populateGrid); 