import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
            await sharp(inputPath)
                .resize(400, 225, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({
                    quality: 80,
                    progressive: true
                })
                .toFile(outputPath);

            console.log(`Created thumbnail for ${file}`);
        } catch (error) {
            console.error(`Error processing ${file}:`, error);
        }
    }
}

createThumbnails().catch(console.error); 