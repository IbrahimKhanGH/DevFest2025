import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';  // Ensure you have installed node-fetch version 2
import { Retell } from 'retell-sdk';
import Groq from 'groq-sdk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

// Configure dotenv first
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3103;

// Initialize Retell client with correct syntax
const retell = new Retell({ apiKey: process.env.RETELL_API_KEY });

// Initialize Groq client
if (!process.env.GROQ_API_KEY) {
  console.error("❌ ERROR: GROQ_API_KEY is missing from .env file.");
  process.exit(1);
}
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Middleware
app.use(cors({
  origin: "http://localhost:5173", // Adjust as needed
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Handle Preflight Requests (CORS for OPTIONS)
app.options("/api/analyze-image", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.sendStatus(204);
});

app.options("/api/nutritional-analysis", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.sendStatus(204);
});

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

// Helper function to format call analysis
function formatRetellCallAnalysis(call) {
  const customData = call?.call_analysis?.custom_analysis_data;
  
  return {
    customAnalysis: {
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
            const filename = `retell_image_${Date.now()}.jpg`;
            const uploadsDir = path.join(__dirname, 'public', 'uploads');
            
            // Create directory if it doesn't exist
            await mkdir(uploadsDir, { recursive: true });
            
            const filepath = path.join(uploadsDir, filename);
            
            // Save the file
            await writeFile(filepath, buffer);
            
            // Generate URL for the saved image
            processedUrl = `http://localhost:${PORT}/uploads/${filename}`;
            console.log('\n🖼️  New RetellAI image saved:');
            console.log('📂 Location:', filepath);
            console.log('🔗 Access URL:', processedUrl, '\n');
        } else {
            // Handle regular URLs
            processedUrl = await shortenUrl(imageUrl);
            console.log('\n🔗 RetellAI Shortened URL:', processedUrl, '\n');
        }

        res.json({
            success: true,
            message: "Image received",
            shortUrl: processedUrl
        });
    } catch (error) {
        console.error("❌ RetellAI Server Error:", error);
        res.status(500).json({ success: false, error: error.message || "Error processing image" });
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
            user_name: "John Doe",
            user_email: "john@example.com",
            // Add any other variables your bot needs
            current_seat: "12A",
            requested_seat: "15B",
            user_height: 5.9, // Example height in feet
            user_weight: 160, // Example weight in pounds
            dietary_preference: "Vegan",
            health_goal: "Lose weight",
            additional_notes: "Prefers low-carb meals."
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
                const analysis = formatRetellCallAnalysis(call);
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

// Serve static files from the public directory
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.post("/api/nutritional-analysis", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    console.log("🟢 Received Groq AI Image URL:", imageUrl);

    if (!imageUrl) {
      console.error("❌ No image URL provided for Groq AI!");
      return res.status(400).json({ success: false, error: "No image URL provided" });
    }

    // Define the schema
    const schema = {
      properties: {
        macronutrients: {
          type: "object",
          properties: {
            protein: { type: "number", title: "Protein (g)" },
            fats: { type: "number", title: "Fats (g)" },
            carbs: { type: "number", title: "Carbohydrates (g)" }
          },
          required: ["protein", "fats", "carbs"],
          title: "Macronutrients"
        },
        micronutrients: {
          type: "object",
          properties: {
            vitamins: { type: "array", items: { type: "string" }, title: "Vitamins" },
            minerals: { type: "array", items: { type: "string" }, title: "Minerals" }
          },
          required: ["vitamins", "minerals"],
          title: "Micronutrients"
        },
        is_nutrient_dense: { type: "boolean", title: "Is Nutrient Dense?" },
        explanation: { type: "string", title: "Nutrient Density Explanation" }
      },
      required: ["macronutrients", "micronutrients", "is_nutrient_dense", "explanation"],
      title: "Nutritional Analysis",
      type: "object"
    };

    // Pretty printing improves response accuracy
    const jsonSchema = JSON.stringify(schema, null, 4);

    console.log("🟢 Sending image URL to Groq AI for nutritional analysis...");

    const chatResponse = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an AI nutritionist that analyzes food images and outputs structured nutritional data in JSON.\nThe JSON object must use this schema: ${jsonSchema}`
        },
        {
          role: "user",
          content: `Analyze the following food image for macronutrients, micronutrients, and nutrient density: ${imageUrl}`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      stream: false,
      response_format: { type: "json_object" }
    });

    console.log("🟢 Groq AI Response Received:", chatResponse);

    const parsedData = JSON.parse(chatResponse.choices[0].message.content);

    res.json({
      success: true,
      message: "Image processed successfully",
      nutritionalAnalysis: parsedData
    });

  } catch (error) {
    console.error("❌ Groq AI Server Error:", error);
    res.status(500).json({ success: false, error: error.message || "Error processing image" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log("Ready to receive images, analyze them with RetellAI and Groq AI!");
}); 