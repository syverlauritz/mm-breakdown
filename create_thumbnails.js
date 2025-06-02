const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

// Create thumbnails directory if it doesn't exist
const thumbnailsDir = path.join(__dirname, 'output', 'shots', 'thumbnails');
if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir, { recursive: true });
}

// Process each image
async function createThumbnails() {
    const shotsDir = path.join(__dirname, 'output', 'shots');
    const files = fs.readdirSync(shotsDir).filter(file => file.endsWith('.jpg'));

    for (const file of files) {
        const inputPath = path.join(shotsDir, file);
        const outputPath = path.join(thumbnailsDir, file);

        try {
            const image = await Jimp.read(inputPath);
            await image
                .resize(400, 225) // 16:9 aspect ratio
                .quality(80) // Set JPEG quality
                .writeAsync(outputPath);

            console.log(`Created thumbnail for ${file}`);
        } catch (error) {
            console.error(`Error processing ${file}:`, error);
        }
    }
}

createThumbnails().catch(console.error); 