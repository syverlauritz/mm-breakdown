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
let previewGridItem = null;
let previewLoopStart = 0;
let previewLoopEnd = 0;

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
        previewOverlay.style.position = 'fixed';
        previewOverlay.style.zIndex = '9999';
        previewOverlay.style.pointerEvents = 'none';
        previewOverlay.style.display = 'block';
        previewOverlay.style.borderRadius = '4px';
        previewOverlay.style.overflow = 'hidden';
        
        // Create video element for preview
        previewVideo = document.createElement('video');
        previewVideo.src = 'media/memory-maker.mp4'; // Use the main video file
        previewVideo.muted = true;
        previewVideo.loop = false; // We'll handle looping manually
        previewVideo.style.width = '100%';
        previewVideo.style.height = '100%';
        previewVideo.style.objectFit = 'cover';
        
        // Calculate scene timing
        const singleFrameDuration = getFrameDuration(frame);
        const loopStart = timecodeToSeconds(frame.startTimecode) + singleFrameDuration;
        let loopEnd = timecodeToSeconds(frame.startTimecode) + frame.duration - singleFrameDuration;
        
        // Ensure valid range
        if (loopEnd <= loopStart) {
            previewLoopStart = timecodeToSeconds(frame.startTimecode);
            previewLoopEnd = timecodeToSeconds(frame.endTimecode);
        } else {
            previewLoopStart = loopStart;
            previewLoopEnd = loopEnd;
        }
        
        // Add video to overlay
        previewOverlay.appendChild(previewVideo);
        
        // Add to document first
        document.body.appendChild(previewOverlay);
        
        // Position overlay over the grid item AFTER adding to DOM
        updatePreviewPosition();
        
        // Set up video playback
        previewVideo.addEventListener('loadedmetadata', () => {
            previewVideo.currentTime = previewLoopStart;
            previewVideo.play().catch(error => {
                console.log('Preview video play failed (this is normal):', error);
            });
        });
        
        // Handle looping
        previewVideo.addEventListener('timeupdate', () => {
            if (previewVideo.currentTime >= previewLoopEnd - 0.1) {
                previewVideo.currentTime = previewLoopStart;
            }
        });
        
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
    // Create container for the whole item
    const container = document.createElement('div');
    container.className = 'grid-item-container';
    
    // Create the actual grid item (image)
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

    // Timecode in top left (stays inside the frame)
    const timecodeDiv = document.createElement('div');
    timecodeDiv.className = 'timecode';
    timecodeDiv.textContent = formatTimecodeMMSS(frame.startTimecode);
    
    div.appendChild(img);
    div.appendChild(timecodeDiv);
    
    // Create info section below the frame
    const infoDiv = document.createElement('div');
    infoDiv.className = 'grid-item-info';
    
    // Shot number in bottom left (now below the frame)
    const shotNumberDiv = document.createElement('div');
    shotNumberDiv.className = 'frame-number-below';
    // Format sceneNumber to three digits
    shotNumberDiv.textContent = frame.sceneNumber.toString().padStart(3, '0'); 
    
    // Add special content indicator if content exists (now below the frame)
    const hasSpecialContent = frame.content && (
        (frame.content.title && frame.content.title.trim() !== '') ||
        (frame.content.description && frame.content.description.trim() !== '') ||
        (frame.content.notes && frame.content.notes.trim() !== '') ||
        (frame.content.additionalImages && frame.content.additionalImages.length > 0) ||
        (frame.content.videoClips && frame.content.videoClips.length > 0)
    );

    // Check for specific content types
    const hasImages = frame.content && frame.content.additionalImages && frame.content.additionalImages.length > 0;
    const hasVideos = frame.content && frame.content.videoClips && frame.content.videoClips.length > 0;
    const hasOtherContent = frame.content && (
        (frame.content.title && frame.content.title.trim() !== '') ||
        (frame.content.description && frame.content.description.trim() !== '') ||
        (frame.content.notes && frame.content.notes.trim() !== '')
    );

    // Create the icons container
    let iconsContainer = null;
    if (hasImages || hasVideos || hasOtherContent) {
        iconsContainer = document.createElement('div');
        iconsContainer.className = 'content-icons-container';
        
        // Create three fixed spots for icons
        // Spot 1: Solid square (images)
        const solidSpot = document.createElement('div');
        solidSpot.className = 'icon-spot solid-spot';
        if (hasImages) {
            const solidIcon = document.createElement('img');
            solidIcon.src = 'assets/solidsquare.svg';
            solidIcon.alt = 'Images';
            solidIcon.className = 'content-icon';
            solidSpot.appendChild(solidIcon);
        }
        
        // Spot 2: Stroke square (videos)
        const strokeSpot = document.createElement('div');
        strokeSpot.className = 'icon-spot stroke-spot';
        if (hasVideos) {
            const strokeIcon = document.createElement('img');
            strokeIcon.src = 'assets/strokesquare.svg';
            strokeIcon.alt = 'Videos';
            strokeIcon.className = 'content-icon';
            strokeSpot.appendChild(strokeIcon);
        }
        
        // Spot 3: Asterisk (other content)
        const asteriskSpot = document.createElement('div');
        asteriskSpot.className = 'icon-spot asterisk-spot';
        if (hasOtherContent) {
            const asteriskIcon = document.createElement('img');
            asteriskIcon.src = 'assets/asterisk.svg';
            asteriskIcon.alt = 'Special content';
            asteriskIcon.className = 'content-icon';
            asteriskSpot.appendChild(asteriskIcon);
        }
        
        iconsContainer.appendChild(solidSpot);
        iconsContainer.appendChild(strokeSpot);
        iconsContainer.appendChild(asteriskSpot);
    }
    
    // Add elements to info div
    infoDiv.appendChild(shotNumberDiv);
    if (iconsContainer) {
        infoDiv.appendChild(iconsContainer);
    }
    
    // Add everything to container
    container.appendChild(div);
    container.appendChild(infoDiv);

    // Add video preview and modal functionality to the grid item (not container)
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
    
    return container;
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