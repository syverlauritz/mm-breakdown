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
let currentFrameIndex = -1; // Keep track of the currently displayed frame index
let allFramesData = []; // Store all frames data

function openVideoModal(frame, index) { // Pass index here
    console.log('openVideoModal called for scene', frame.sceneNumber, 'index', index);
    const modal = document.getElementById('video-modal');
    const video = document.getElementById('scene-video');
    const contentDiv = document.getElementById('additional-content');
    
    console.log('Modal element:', modal);
    console.log('Video element:', video);
    
    if (!modal || !video) {
        console.error('Modal or video element not found!');
        return;
    }
    
    currentFrameIndex = index; // Set current index
    
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
        notes.textContent = content.notes;
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

    console.log(`Modal scene ${frame.sceneNumber}: ${modalLoopStart.toFixed(3)}s to ${modalLoopEnd.toFixed(3)}s`);

    video.muted = true; // default muted
    
    console.log('About to show modal...');
    modal.style.display = 'flex';
    modal.style.zIndex = '99999';
    console.log('Modal should now be visible');
    console.log('Modal computed style:', window.getComputedStyle(modal));
    console.log('Modal display:', modal.style.display);
    console.log('Modal z-index:', modal.style.zIndex);
    
    // Wait for video metadata to load before setting currentTime
    const setVideoTimeAndPlay = () => {
        console.log('Video metadata loaded, trying currentTime approach with seekable video');
        console.log('Target start time:', modalLoopStart);
        console.log('Video duration:', video.duration);
        console.log('Video readyState:', video.readyState);
        
        // NEW APPROACH: Play first, then seek
        video.play().then(() => {
            console.log('Video started playing, now seeking to:', modalLoopStart);
            
            // Small delay to ensure playback has actually started
            setTimeout(() => {
                video.currentTime = modalLoopStart;
                console.log('Set currentTime to:', modalLoopStart);
                console.log('Actual currentTime after setting:', video.currentTime);
            }, 100);
            
        }).catch(error => {
            console.error('Error playing video:', error);
        });
    };
    
    if (video.readyState >= 1) {
        // Metadata already loaded
        setVideoTimeAndPlay();
    } else {
        // Wait for metadata to load
        video.addEventListener('loadedmetadata', setVideoTimeAndPlay, { once: true });
    }
    
    document.body.classList.add('modal-open'); // Add class to body
    document.addEventListener('keydown', handleModalKeyPress); // Add keyboard listener
}

// Loop the segment in the modal
const sceneVideo = document.getElementById('scene-video');
sceneVideo.addEventListener('timeupdate', function() {
    // Ensure we're still within the expected timeframe and not paused
    if (sceneVideo.paused || sceneVideo.ended) return;
    
    console.log('timeupdate event - currentTime:', sceneVideo.currentTime, 'modalLoopStart:', modalLoopStart, 'modalLoopEnd:', modalLoopEnd);
    
    // Check if we're at or past the end time with a smaller buffer for more precision
    if (sceneVideo.currentTime >= modalLoopEnd - 0.1) {
        console.log('Looping video back to start');
        sceneVideo.currentTime = modalLoopStart;
        // Ensure playback continues
        if (sceneVideo.paused) {
            sceneVideo.play();
        }
    }
    
    // Also check if we're somehow before the start time (shouldn't happen but safety check)
    if (sceneVideo.currentTime < modalLoopStart) {
        console.log('Video before start time, jumping to start');
        sceneVideo.currentTime = modalLoopStart;
    }
});

// Close modal logic
function closeVideoModal() {
    console.log('closeVideoModal called');
    const modal = document.getElementById('video-modal');
    const video = document.getElementById('scene-video');
    console.log('Pausing video and hiding modal');
    video.pause();
    modal.style.display = 'none';
    document.body.classList.remove('modal-open'); // Remove class from body
    document.removeEventListener('keydown', handleModalKeyPress); // Remove listener
    console.log('Modal closed');
}
document.getElementById('close-video-modal').onclick = closeVideoModal;
document.querySelector('.video-modal-backdrop').onclick = closeVideoModal;

// Add event listeners for navigation buttons
document.getElementById('prev-shot').onclick = () => {
    if (currentFrameIndex > 0) {
        openVideoModal(allFramesData[currentFrameIndex - 1], currentFrameIndex - 1);
    }
};
document.getElementById('next-shot').onclick = () => {
    if (currentFrameIndex < allFramesData.length - 1) {
        openVideoModal(allFramesData[currentFrameIndex + 1], currentFrameIndex + 1);
    }
};
document.getElementById('modal-close-text').onclick = closeVideoModal;

// Keyboard navigation for modal
function handleModalKeyPress(event) {
    if (event.key === 'Escape') {
        closeVideoModal();
    } else if (event.key === 'ArrowLeft') {
        if (currentFrameIndex > 0) {
            openVideoModal(allFramesData[currentFrameIndex - 1], currentFrameIndex - 1);
        }
    } else if (event.key === 'ArrowRight') {
        if (currentFrameIndex < allFramesData.length - 1) {
            openVideoModal(allFramesData[currentFrameIndex + 1], currentFrameIndex + 1);
        }
    }
}

// Floating preview video logic
let previewVideo = null;
let previewOverlay = null;
let previewTimeout = null;
let currentPreviewAttemptId = 0;
let previewLoopStart = 0;
let previewLoopEnd = 0;
let previewGridItem = null;

// Helper to remove all relevant listeners from previewVideo
function removePreviewListeners() {
    if (previewVideo) {
        // Remove all event listeners by cloning the element
        const newVideo = previewVideo.cloneNode(true);
        previewVideo.parentNode.replaceChild(newVideo, previewVideo);
        previewVideo = newVideo;
    }
}

// Function to update preview video position
function updatePreviewPosition() {
    if (previewOverlay && previewGridItem) {
        const rect = previewGridItem.getBoundingClientRect();
        console.log('Positioning overlay:');
        console.log('  Grid item rect:', rect);
        console.log('  Setting overlay to:', {
            top: rect.top + 'px',
            left: rect.left + 'px',
            width: rect.width + 'px',
            height: rect.height + 'px'
        });
        
        previewOverlay.style.top = rect.top + 'px';
        previewOverlay.style.left = rect.left + 'px';
        previewOverlay.style.width = rect.width + 'px';
        previewOverlay.style.height = rect.height + 'px';
        
        console.log('  Overlay after positioning:', {
            top: previewOverlay.style.top,
            left: previewOverlay.style.left,
            width: previewOverlay.style.width,
            height: previewOverlay.style.height,
            display: previewOverlay.style.display,
            zIndex: previewOverlay.style.zIndex,
            position: previewOverlay.style.position
        });
    }
}

function showPreviewVideo(frame, gridItem) {
    console.log('showPreviewVideo called for scene', frame.sceneNumber);
    
    // Increment the attempt ID to invalidate any previous attempt
    currentPreviewAttemptId++;
    const attemptId = currentPreviewAttemptId;
    previewGridItem = gridItem;
    
    // Clear any existing timeout
    if (previewTimeout) {
        clearTimeout(previewTimeout);
        previewTimeout = null;
    }
    
    // Add delay before showing preview
    previewTimeout = setTimeout(() => {
        console.log('Creating preview overlay for scene', frame.sceneNumber);
        
        // Check if this attempt is still valid
        if (attemptId !== currentPreviewAttemptId) return;
        
        // Capture the grid item reference before it can be nullified
        const currentGridItem = gridItem;
        
        // Remove any existing preview
        hidePreviewVideo();
        
        // Restore the grid item reference for positioning
        previewGridItem = currentGridItem;
        
        // Create preview overlay
        previewOverlay = document.createElement('div');
        previewOverlay.className = 'preview-video-overlay';
        
        // Add debug styling and content
        previewOverlay.style.backgroundColor = 'red';
        previewOverlay.style.opacity = '1';
        previewOverlay.style.position = 'fixed';
        previewOverlay.style.zIndex = '9999';
        previewOverlay.style.pointerEvents = 'none';
        previewOverlay.style.display = 'block';
        previewOverlay.style.border = '5px solid yellow';
        
        // Add debug text
        previewOverlay.innerHTML = `<div style="color: white; font-size: 24px; text-Align: center; padding: 20px;">SCENE ${frame.sceneNumber}</div>`;
        
        // Add to document first
        document.body.appendChild(previewOverlay);
        console.log('Preview overlay added to document for scene', frame.sceneNumber);
        console.log('Overlay element:', previewOverlay);
        console.log('Overlay computed style:', window.getComputedStyle(previewOverlay));
        
        // Position overlay over the grid item AFTER adding to DOM
        console.log('About to position overlay, previewOverlay:', previewOverlay, 'previewGridItem:', previewGridItem);
        updatePreviewPosition();
        console.log('Positioning complete');
        
        // Add scroll and resize listeners to update position
        window.addEventListener('scroll', updatePreviewPosition, { passive: true });
        window.addEventListener('resize', updatePreviewPosition, { passive: true });
        
    }, 300); // 300ms delay before showing preview
}

function hidePreviewVideo() {
    // Increment attempt ID to invalidate any pending preview
    currentPreviewAttemptId++;
    previewGridItem = null;
    
    // Clear timeout
    if (previewTimeout) {
        clearTimeout(previewTimeout);
        previewTimeout = null;
    }
    
    // Remove event listeners
    window.removeEventListener('scroll', updatePreviewPosition);
    window.removeEventListener('resize', updatePreviewPosition);
    
    // Remove preview elements
    if (previewOverlay) {
        previewOverlay.remove();
        previewOverlay = null;
    }
    
    if (previewVideo) {
        previewVideo.pause();
        previewVideo = null;
    }
}

// Function to create grid items
function createGridItem(frame, index) {
    const div = document.createElement('div');
    div.className = 'grid-item';
    
    // Use thumbnail for grid view
    const img = document.createElement('img');
    img.src = frame.thumbnail.replace(/ /g, '%20'); // Simple space replacement to avoid double-encoding
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
    div.addEventListener('mouseenter', () => {
        console.log('Hover started on scene', frame.sceneNumber);
        showPreviewVideo(frame, div);
    });
    div.addEventListener('mouseleave', () => {
        console.log('Hover ended');
        hidePreviewVideo();
    });
    div.addEventListener('click', (event) => {
        console.log('Grid item clicked for scene', frame.sceneNumber);
        console.log('Click event:', event);
        event.preventDefault();
        openVideoModal(frame, index);
    }); // Pass index
    
    return div;
}

// Function to populate the grid
async function populateGrid() {
    const grid = document.querySelector('.grid');
    
    try {
        const response = await fetch('frames.json');
        const data = await response.json();
        
        allFramesData = data.frames; // Store all frames
        
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