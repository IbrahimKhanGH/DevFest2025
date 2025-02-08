import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';  // Ensure you have installed node-fetch version 2
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3103;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Function to shorten URL using TinyURL's API
async function shortenUrl(longUrl) {
  try {
    const response = await fetch(`http://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
    const shortUrl = await response.text();
    return shortUrl;
  } catch (error) {
    console.error("Error shortening URL:", error);
    return longUrl; // Return original URL if shortening fails
  }
}

// Simple endpoint that just echoes back the image URL
app.post('/api/analyze-image', async (req, res) => {
    try {
        const { imageUrl, isBase64 } = req.body;
        let processedUrl;
        
        if (!imageUrl) {
            return res.status(400).json({ 
                success: false,
                error: "No image URL provided" 
            });
        }

        if (isBase64) {
            // Convert base64 to file and save it
            const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            
            // Create a unique filename
            const filename = `image_${Date.now()}.jpg`;
            const uploadsDir = path.join(__dirname, 'public', 'uploads');
            
            // Create directory if it doesn't exist
            await mkdir(uploadsDir, { recursive: true });
            
            const filepath = path.join(uploadsDir, filename);
            
            // Save the file
            await writeFile(filepath, buffer);
            
            // Generate URL for the saved image
            processedUrl = `http://localhost:3103/uploads/${filename}`;
            console.log('\n🖼️  New image saved:');
            console.log('📂 Location:', filepath);
            console.log('🔗 Access URL:', processedUrl, '\n');
        } else {
            // Handle regular URLs
            processedUrl = await shortenUrl(imageUrl);
            console.log('\n🔗 Shortened URL:', processedUrl, '\n');
        }

        res.json({
            success: true,
            message: "Image received",
            shortUrl: processedUrl
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Serve static files from the public directory
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Ready to receive images!');
}); 