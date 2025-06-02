const fs = require('fs');
const csv = require('csv-parse/sync');

// Read the CSV file
const csvContent = fs.readFileSync('Memory Maker-Scenes.csv', 'utf-8');

// Parse CSV content, skipping the first row (header)
const records = csv.parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    from_line: 2 // Skip the first line which contains the timecode list
});

// Create frames array
const frames = records.map(record => {
    const sceneNumber = parseInt(record['Scene Number']);
    const paddedSceneNumber = sceneNumber.toString().padStart(3, '0');
    
    return {
        sceneNumber: sceneNumber,
        startTimecode: record['Start Timecode'],
        endTimecode: record['End Timecode'],
        startFrame: parseInt(record['Start Frame']),
        endFrame: parseInt(record['End Frame']),
        duration: parseFloat(record['Length (seconds)']),
        thumbnail: `output/shots/thumbnails/Memory Maker-Scene-${paddedSceneNumber}-01.jpg`,
        fullImage: `output/shots/Memory Maker-Scene-${paddedSceneNumber}-01.jpg`,
        content: {
            title: "",
            description: "",
            additionalImages: [],
            videoClips: [],
            notes: ""
        }
    };
});

// Create the final JSON structure
const jsonData = {
    frames: frames
};

// Write to file
fs.writeFileSync('frames.json', JSON.stringify(jsonData, null, 2));
console.log('frames.json has been generated successfully!'); 