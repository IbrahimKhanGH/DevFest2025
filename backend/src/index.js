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
import { url } from 'inspector';
import { EventEmitter } from 'events';
import crypto from 'crypto';

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

const imageEventEmitter = new EventEmitter();

// Increase payload size limit for large images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://www.messenger.com'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle Preflight Requests (CORS for OPTIONS)
app.options("/api/analyze-image", (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).send();
});

app.options("/api/nutritional-analysis", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.sendStatus(204);
});

// Define the schema
const schema = {
  primaryIngredients: "string",
  portionSize: "string",
  macronutrients: {
    protein: "number",
    carbs: "number",
    fats: "number",
    calories: "number"
  },
  micronutrients: {
    vitamins: ["string"],
    minerals: ["string"]
  },
  nutrientDensity: "string",
  explanation: "string"
};

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

// SSE endpoint for image stream
app.get('/api/image-stream', (req, res) => {
  console.log("🌟 New SSE connection attempt");
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  console.log("📡 SSE Headers set");

  // Send initial connection confirmation
  res.write(`data: ${JSON.stringify({ status: 'connected' })}\n\n`);
  console.log("✅ Sent initial SSE connection message");

  // Handler for new images
  const newImageHandler = (imageData) => {
    console.log("🎯 Received image data in SSE handler:", imageData);
    res.write(`data: ${JSON.stringify(imageData)}\n\n`);
    console.log("📤 Sent image data through SSE");
  };

  imageEventEmitter.on('newImage', newImageHandler);

  req.on('close', () => {
    console.log("❌ SSE Connection closed");
    imageEventEmitter.off('newImage', newImageHandler);
  });
});

// Add this helper function after your schema definition
async function saveBase64Image(base64Data) {
  try {
    // Remove the data:image/jpeg;base64, prefix if it exists
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    // Create a unique filename
    const filename = `${crypto.randomBytes(16).toString('hex')}.jpg`;
    
    // Ensure the uploads directory exists
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    
    // Save the file
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, base64Image, 'base64');
    
    // Return the HTTP URL
    return `http://localhost:${PORT}/uploads/${filename}`;
  } catch (error) {
    console.error("❌ Error saving image:", error);
    throw error;
  }
}

// Nutritional Analysis endpoint
app.post("/api/nutritional-analysis", async (req, res) => {
  try {
    console.log("📥 Received request to /api/nutritional-analysis");
    
    let { imageUrl } = req.body;
    
    // If it's a base64 image, save it and get an HTTP URL
    if (imageUrl && imageUrl.startsWith('data:image')) {
      console.log("💾 Converting base64 to file...");
      imageUrl = await saveBase64Image(imageUrl);
      console.log("🔗 Created HTTP URL:", imageUrl);
    }

    if (!imageUrl) {
      console.error("❌ No image URL provided!");
      return res.status(400).json({ success: false, error: "No image URL provided" });
    }

    console.log("🤖 Starting Groq AI analysis...");
    const chatResponse = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `
You are an advanced AI nutritionist specializing in visual food and beverage analysis. Your task is to:

1. FIRST CAREFULLY OBSERVE the image and identify ALL items present
   - Look for multiple food items or beverages
   - Note portion sizes, ingredients, and preparation methods
   - Consider mixed dishes, sides, and beverages

2. ANALYZE based on what you actually see:
   - For foods: Identify main ingredients, cooking methods, and portions
   - For beverages: Identify type, brand (if visible), and serving size
   - For packaged items: Use visible nutritional information if available

3. Provide analysis in this exact JSON format:
{
  "primaryIngredients": "Detailed list of ALL items identified",
  "portionSize": "Estimated serving size for each item",
  "macronutrients": {
    "protein": number (in grams),
    "carbs": number (in grams),
    "fats": number (in grams),
    "calories": number
  },
  "micronutrients": {
    "vitamins": ["list of primary vitamins present"],
    "minerals": ["list of primary minerals present"]
  },
  "nutrientDensity": "Analysis of nutritional value",
  "explanation": "Detailed breakdown of nutritional components and health implications"
}

IMPORTANT:
- Never assume ingredients not visible in the image
- Be specific about what you actually see
- If uncertain about exact values, provide reasonable estimates based on visible portions
- Consider cultural and contextual clues in the image
`
        },
        {
          role: "user",
          content: `Analyze this image and provide a detailed nutritional breakdown: ${imageUrl}

Please identify ALL items visible in the image and provide accurate nutritional information based on what you can actually see.`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      stream: false,
      response_format: { type: "json_object" }
    });
      
    console.log("🟢 Groq AI Response:", chatResponse.choices[0].message.content);

    const parsedData = JSON.parse(chatResponse.choices[0].message.content);

    console.log("✨ Analysis complete, emitting event");
    imageEventEmitter.emit('newImage', {
      imageUrl: imageUrl,
      nutritionalAnalysis: parsedData,
      timestamp: new Date().toISOString()
    });

    console.log("🎉 Sending response to client");
    res.json({
      success: true,
      message: "Image processed successfully",
      nutritionalAnalysis: parsedData
    });

  } catch (error) {
    console.error("💥 Error in nutritional analysis:", error);
    res.status(500).json({ success: false, error: error.message });
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
    try {
        const { event, call } = req.body;
        console.log('\n📩 Webhook event received:', event);
        
        // Format the analysis first
        const analysis = formatRetellCallAnalysis(call);
        
        switch (event) {
            case "call_started":
                console.log("📞 Call started:", call.call_id);
                console.log("📱 Phone number:", call.from_number);
                break;
                
            case "call_ended":
                console.log("🔚 Call ended:", call.call_id);
                console.log("📊 Call analysis:", JSON.stringify(analysis, null, 2));
                break;
                
            case "call_analyzed":
                console.log("🔍 Call analyzed:", call.call_id);
                console.log("📝 Transcript:", call.transcript);
                if (call.call_analysis?.custom_analysis_data) {
                    console.log("🎯 Custom Analysis:", JSON.stringify(call.call_analysis.custom_analysis_data, null, 2));
                    // Send the event to connected clients
                    if (req.app.locals.sendEvent) {
                        req.app.locals.sendEvent({
                            event: 'call_analyzed',
                            customAnalysis: call.call_analysis.custom_analysis_data
                        });
                    }
                }
                break;
                
            default:
                console.log("❓ Unknown event:", event);
        }
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("❌ Error processing webhook:", error);
        res.status(500).json({ error: error.message });
    }
});

// Serve static files from the public directory
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("Ready to receive images, analyze them with RetellAI and Groq AI!");
}); 