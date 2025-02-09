import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';  // Ensure you have installed node-fetch version 2
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { Retell } from 'retell-sdk';

// Configure dotenv first
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3103;

// Initialize Retell client with correct syntax
const retell = new Retell({ apiKey: process.env.RETELL_API_KEY });

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

// Endpoint for inbound call dynamic variables
app.post('/api/inbound-variables', async (req, res) => {
    try {
        const { llm_id, from_number, to_number } = req.body;
        
        console.log('📞 Inbound call request received:');
        console.log('🤖 LLM ID:', llm_id);
        console.log('📱 From:', from_number);
        console.log('📞 To:', to_number);

        // Here you would typically lookup user info based on the phone number
        // For now, we'll return sample data
        const response = {
            user_name: "Test User",
            user_email: "test@example.com",
            // Add any other variables your bot needs
            current_seat: "12A",
            requested_seat: "15B"
        };

        console.log('✅ Returning variables:', response);
        res.json(response);
    } catch (error) {
        console.error('❌ Error handling inbound variables:', error);
        res.status(500).json({ error: error.message });
    }
});

// Existing webhook endpoint
app.post("/webhook", async (req, res) => {
    const { event, call } = req.body;
    
    try {
        console.log('\n📩 Webhook event received:', event);
        
        switch (event) {
            case "call_started":
                console.log("📞 Call started:", call.call_id);
                console.log("📱 Phone number:", call.from_number);
                break;
                
            case "call_ended":
                console.log("🔚 Call ended:", call.call_id);
                const analysis = formatCallAnalysis(call);
                console.log("📊 Call analysis:", JSON.stringify(analysis, null, 2));
                break;
                
            case "call_analyzed":
                console.log("🔍 Call analyzed:", call.call_id);
                console.log("📝 Transcript:", call.transcript);
                if (call.call_analysis?.custom_analysis_data) {
                    console.log("🎯 Custom Analysis:", JSON.stringify(call.call_analysis.custom_analysis_data, null, 2));
                }
                break;
                
            default:
                console.log("❓ Unknown event:", event);
        }
        
        res.status(204).send();
    } catch (error) {
        console.error("❌ Error processing webhook:", error);
        res.status(500).json({ error: error.message });
    }
});

// Helper function to format call analysis
function formatCallAnalysis(call) {
  const customData = call?.call_analysis?.custom_analysis_data;
  
  return {
    customAnalysis: {
      user_name: customData?.user_name,
      user_age: customData?.user_age,  
      user_height: customData?.user_height,
      user_weight: customData?.user_weight,
      dietary_preference: customData?.dietary_preference,
      health_goal: customData?.health_goal,
      additional_notes: customData?.additional_notes
    },
    generalInfo: {
      call_id: call.call_id,
      bot_type: call.metadata?.bot_type || 'nutrition_bot',
      duration: call.end_timestamp ? 
        `${(call.end_timestamp - call.start_timestamp) / 1000} seconds` : null,
      user_sentiment: call.call_analysis?.user_sentiment,
      transcript: call.transcript
    }
  };
}

// Serve static files from the public directory
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Ready to receive images!');
}); 