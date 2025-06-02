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

// Function to format timecode as MM:SS for display
function formatTimecodeMMSS(tc) {
    const parts = tc.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseFloat(parts[2]);
    const totalMinutes = hours * 60 + minutes;
    return `${totalMinutes.toString().padStart(2, '0')}:${Math.floor(seconds).toString().padStart(2, '0')}`;
}

// Helper: convert timecode (HH:MM:SS.sss) to seconds
function timecodeToSeconds(tc) {
    const parts = tc.split(':');
    let h = 0, m = 0, s = 0;
    if (parts.length === 3) {
        h = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
        s = parseFloat(parts[2]);
    } else if (parts.length === 2) {
        m = parseInt(parts[0], 10);
        s = parseFloat(parts[1]);
    } else if (parts.length === 1) {
        s = parseFloat(parts[0]);
    }
    return h * 3600 + m * 60 + s;
}

// Helper: Calculate duration of a single frame for a given frame object
function getFrameDuration(frame) {
    // Avoid division by zero if a scene has only one frame (start and end frame are the same)
    const numFrames = frame.endFrame - frame.startFrame + 1;
    if (numFrames <= 1) return 0; // If 1 or 0 frames, no trimming needed/possible
    return frame.duration / numFrames;
}

// Video modal logic
let modalLoopStart = 0;
let modalLoopEnd = 0;
function openVideoModal(frame) {
    const modal = document.getElementById('video-modal');
    const video = document.getElementById('scene-video');
    const contentDiv = document.getElementById('additional-content');
    
    // Clear previous content
    contentDiv.innerHTML = '';

    // Populate with new content
    const content = frame.content;
    if (content.title) {
        const title = document.createElement('h3');
        title.textContent = content.title;
        contentDiv.appendChild(title);
    }
    if (content.description) {
        const description = document.createElement('p');
        description.textContent = content.description;
        contentDiv.appendChild(description);
    }
    if (content.notes) {
        const notes = document.createElement('p');
        notes.textContent = `Notes: ${content.notes}`;
        contentDiv.appendChild(notes);
    }

    if (content.additionalImages && content.additionalImages.length > 0) {
        content.additionalImages.forEach(imgPath => {
            const img = document.createElement('img');
            img.src = imgPath;
            img.alt = 'Additional image';
            img.style.maxWidth = '100%'; // Basic styling
            contentDiv.appendChild(img);
        });
    }

    if (content.videoClips && content.videoClips.length > 0) {
        content.videoClips.forEach(videoPath => {
            const vid = document.createElement('video');
            vid.src = videoPath;
            vid.controls = true;
            vid.style.maxWidth = '100%'; // Basic styling
            contentDiv.appendChild(vid);
        });
    }

    const singleFrameDuration = getFrameDuration(frame);
    modalLoopStart = timecodeToSeconds(frame.startTimecode) + singleFrameDuration;
    // Calculate end time from start time + duration, then trim one frame
    modalLoopEnd = timecodeToSeconds(frame.startTimecode) + frame.duration - singleFrameDuration;

    // Ensure valid range (handle very short frames or calculation inaccuracies)
    if (modalLoopEnd <= modalLoopStart) {
         // If trimming results in an invalid range, use the original start and end times
        modalLoopStart = timecodeToSeconds(frame.startTimecode);
        modalLoopEnd = timecodeToSeconds(frame.endTimecode);
    }

    video.currentTime = modalLoopStart;
    video.muted = true; // default muted
    video.play();
    modal.style.display = 'flex';
    document.body.classList.add('modal-open'); // Add class to body
}

// Loop the segment in the modal
const sceneVideo = document.getElementById('scene-video');
sceneVideo.addEventListener('timeupdate', function() {
    // Add a small buffer and check if almost at the end
    if (sceneVideo.currentTime >= modalLoopEnd - 0.1) { // Increased buffer
        sceneVideo.currentTime = modalLoopStart;
        sceneVideo.play();
    }
});

// Close modal logic
function closeVideoModal() {
    const modal = document.getElementById('video-modal');
    const video = document.getElementById('scene-video');
    video.pause();
    modal.style.display = 'none';
    document.body.classList.remove('modal-open'); // Remove class from body
}
document.getElementById('close-video-modal').onclick = closeVideoModal;
document.querySelector('.video-modal-backdrop').onclick = closeVideoModal;

// Floating preview video logic
let previewVideo = null;
let previewOverlay = null; // Keep track of the overlay element
let previewTimeout = null;

function showPreviewVideo(frame, gridItem) {
    if (!previewVideo) {
        previewVideo = document.createElement('video');
        previewVideo.src = 'media/Memory Maker-compress.mp4';
        previewVideo.muted = true;
        previewVideo.playsInline = true;
        previewVideo.style.position = 'absolute';
        previewVideo.style.top = '0';
        previewVideo.style.left = '0';
        previewVideo.style.width = '100%';
        previewVideo.style.height = '100%';
        previewVideo.style.objectFit = 'cover';
        previewVideo.style.zIndex = '1'; // Lower z-index to be below overlay and text (z-index 2 and 3)
        previewVideo.style.pointerEvents = 'none';
        previewVideo.style.borderRadius = 'inherit';
        // previewVideo.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)'; // Remove box shadow from video itself
        previewVideo.style.display = 'none';

        previewOverlay = document.createElement('div'); // Create overlay element
        previewOverlay.className = 'preview-video-overlay';
        previewOverlay.style.zIndex = '2'; // Below text overlays (z-index 3)
    }

    // Set segment
    const singleFrameDuration = getFrameDuration(frame);
    const start = timecodeToSeconds(frame.startTimecode) + singleFrameDuration;
     // Calculate end time from start time + duration, then trim one frame
    let end = timecodeToSeconds(frame.startTimecode) + frame.duration - singleFrameDuration;

    // Ensure valid range (handle very short frames or calculation inaccuracies)
    if (end <= start) {
        const originalStart = timecodeToSeconds(frame.startTimecode);
        const originalEnd = timecodeToSeconds(frame.endTimecode);
        start = originalStart;
        end = originalEnd;
    }
    
    // Remove any existing preview video and overlay from their parents
    if (previewVideo.parentElement) {
        previewVideo.parentElement.removeChild(previewVideo);
    }
     if (previewOverlay.parentElement) {
        previewOverlay.parentElement.removeChild(previewOverlay);
    }
    
    // Add video and overlay to grid item
    gridItem.appendChild(previewVideo);
    gridItem.appendChild(previewOverlay); // Add overlay after video

    previewVideo.style.display = 'block';
    previewVideo.currentTime = start;
    
    // Start playing
    previewVideo.play().then(() => {
        // Clear any existing interval
        if (previewTimeout) {
            clearInterval(previewTimeout);
        }
        
        // Set up loop
        previewTimeout = setInterval(() => {
            // Add a small buffer and check if almost at the end
            if (previewVideo.currentTime >= end - 0.1) { // Increased buffer
                previewVideo.currentTime = start;
            }
        }, 100);
    }).catch(err => {
        console.error('Error playing preview:', err);
    });
}

function hidePreviewVideo() {
    if (previewVideo) {
        previewVideo.pause();
        previewVideo.style.display = 'none';
        // Remove the video and overlay from their parents
        if (previewVideo.parentElement) {
            previewVideo.parentElement.removeChild(previewVideo);
        }
         if (previewOverlay.parentElement) {
            previewOverlay.parentElement.removeChild(previewOverlay);
        }
        if (previewTimeout) {
            clearInterval(previewTimeout);
            previewTimeout = null;
        }
    }
}

// Function to create grid items
function createGridItem(frame, index) {
    const div = document.createElement('div');
    div.className = 'grid-item';
    
    // Use thumbnail for grid view
    const img = document.createElement('img');
    img.src = frame.thumbnail;
    img.alt = `Shot at ${frame.startTimecode}`;
    img.loading = 'lazy';
    img.onload = () => {
        div.classList.add('loaded');
    };
    
    // Shot number in bottom left
    const shotNumberDiv = document.createElement('div');
    shotNumberDiv.className = 'frame-number'; // Reusing frame-number class for styling
    // Format sceneNumber to three digits
    shotNumberDiv.textContent = frame.sceneNumber.toString().padStart(3, '0'); 

    // Timecode in top left
    const timecodeDiv = document.createElement('div');
    timecodeDiv.className = 'timecode';
    timecodeDiv.textContent = formatTimecodeMMSS(frame.startTimecode);
    
    div.appendChild(img);
    div.appendChild(shotNumberDiv); // Add shot number
    div.appendChild(timecodeDiv);
    
    // Add special content indicator if content exists
    const hasSpecialContent = frame.content && (
        (frame.content.title && frame.content.title.trim() !== '') ||
        (frame.content.description && frame.content.description.trim() !== '') ||
        (frame.content.notes && frame.content.notes.trim() !== '') ||
        (frame.content.additionalImages && frame.content.additionalImages.length > 0) ||
        (frame.content.videoClips && frame.content.videoClips.length > 0)
    );

    if (hasSpecialContent) {
        const indicatorDiv = document.createElement('div'); // Use div for font character
        indicatorDiv.className = 'special-content-indicator';
        indicatorDiv.textContent = '*'; // Use asterisk character
        div.appendChild(indicatorDiv);
    }

    // Remove Fancybox data attributes
    // div.setAttribute('data-fancybox', 'gallery');
    // div.setAttribute('data-src', frame.fullImage);
    
    // Add video preview and modal functionality
    div.addEventListener('mouseenter', () => showPreviewVideo(frame, div));
    div.addEventListener('mouseleave', hidePreviewVideo);
    div.addEventListener('click', () => openVideoModal(frame)); // Pass the entire frame object
    
    return div;
}

// Function to populate the grid
async function populateGrid() {
    const grid = document.querySelector('.grid');
    
    try {
        const response = await fetch('frames.json');
        const data = await response.json();
        
        data.frames.forEach((frame, index) => {
            const gridItem = createGridItem(frame, index);
            grid.appendChild(gridItem);
        });
    } catch (error) {
        console.error('Error loading frames:', error);
    }
}

// Initialize the grid when the page loads
document.addEventListener('DOMContentLoaded', populateGrid); 