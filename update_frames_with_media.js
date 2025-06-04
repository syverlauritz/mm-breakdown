const fs = require('fs');
const path = require('path');

const FRAMES_PATH = 'frames.json';
const MEDIA_DIR = 'media';
const IMAGE_EXTS = ['.png', '.jpg', '.jpeg'];
const VIDEO_EXTS = ['.mp4', '.webm'];
const TXT_EXT = '.txt';

// Read frames.json
const framesData = JSON.parse(fs.readFileSync(FRAMES_PATH, 'utf8'));
const frames = framesData.frames;

// Read all files in media dir
const mediaFiles = fs.readdirSync(MEDIA_DIR);

// Group files by scene ID (e.g., 009, 027)
const mediaByScene = {};
for (const file of mediaFiles) {
    const match = file.match(/^(\d{3})-(\d{2})\.(\w+)$/);
    if (match) {
        const sceneId = match[1];
        if (!mediaByScene[sceneId]) mediaByScene[sceneId] = [];
        mediaByScene[sceneId].push(file);
    }
}

// For each frame, update content.additionalImages, videoClips, notes
for (const frame of frames) {
    const sceneId = frame.sceneNumber.toString().padStart(3, '0');
    const files = mediaByScene[sceneId] || [];
    // Group by ID (e.g., 009-03)
    const byId = {};
    for (const file of files) {
        const idMatch = file.match(/^(\d{3}-\d{2})\.(\w+)$/);
        if (idMatch) {
            const id = idMatch[1];
            const ext = '.' + idMatch[2].toLowerCase();
            if (!byId[id]) byId[id] = {};
            if (ext === TXT_EXT) byId[id].txt = file;
            else if (IMAGE_EXTS.includes(ext)) byId[id].image = file;
            else if (VIDEO_EXTS.includes(ext)) byId[id].video = file;
        }
    }
    // Sort files by filename to respect the intended order
    const additionalImages = [];
    const videoClips = [];
    const orderedContent = []; // New: single ordered array for mixed content
    let notes = ''; // Start with empty notes instead of existing ones
    
    // Get all IDs and sort them to maintain filename order
    const sortedIds = Object.keys(byId).sort();
    
    for (const id of sortedIds) {
        const fileGroup = byId[id];
        
        // Add content to ordered array based on file type
        if (fileGroup.txt) {
            const txtPath = path.join(MEDIA_DIR, fileGroup.txt);
            const txtContent = fs.readFileSync(txtPath, 'utf8');
            orderedContent.push({
                type: 'text',
                content: txtContent.trim(),
                filename: fileGroup.txt
            });
            // Also keep for backwards compatibility
            notes += (notes ? '\n' : '') + txtContent.trim();
        }
        
        if (fileGroup.image) {
            orderedContent.push({
                type: 'image',
                src: path.join(MEDIA_DIR, fileGroup.image),
                filename: fileGroup.image
            });
            // Also keep for backwards compatibility
            additionalImages.push(path.join(MEDIA_DIR, fileGroup.image));
        }
        
        if (fileGroup.video) {
            orderedContent.push({
                type: 'video',
                src: path.join(MEDIA_DIR, fileGroup.video),
                filename: fileGroup.video
            });
            // Also keep for backwards compatibility
            videoClips.push(path.join(MEDIA_DIR, fileGroup.video));
        }
    }
    
    // Set both new ordered content and legacy format
    frame.content.orderedContent = orderedContent;
    frame.content.additionalImages = additionalImages;
    frame.content.videoClips = videoClips;
    frame.content.notes = notes;
}

// Write back to frames.json
fs.writeFileSync(FRAMES_PATH, JSON.stringify(framesData, null, 2));
console.log('frames.json updated with media files.'); 