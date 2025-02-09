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
import OpenAI from 'openai';

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

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
    console.log("📥 Received request for analysis");
    let { imageUrl } = req.body;
    
    if (!imageUrl) {
      throw new Error("No image URL provided");
    }

    // Vision Analysis
    let visionDescription;
    try {
      const visionResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image in detail and identify:
1. All food and beverage items present
2. Any visible brands, labels, or packaging (e.g., "Red Bull 8.4oz can", "Doritos Family Size")
3. Portion sizes and container sizes
4. Preparation methods
5. Any visible nutritional information or ingredients lists
6. State of the food/drink (e.g., "partially consumed", "unopened", "freshly prepared")

Please be specific about brands and sizes when visible, but don't make assumptions if not clearly visible.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });
      visionDescription = visionResponse.choices[0].message.content;
      console.log("👁️ Vision Analysis:", visionDescription);
    } catch (visionError) {
      console.error("Vision API Error:", visionError);
      throw new Error("Failed to analyze image: " + visionError.message);
    }

    // Nutritional Analysis
    try {
      const chatResponse = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a precise nutritional analyst. When analyzing foods and beverages:
1. If brand information is provided, use that for exact nutritional data
2. For packaged items with sizes, calculate nutrition based on the specific portion
3. For prepared foods, estimate based on visible ingredients and portions
4. Consider whether items are partially consumed when calculating nutrition
5. If exact brands aren't visible, provide ranges or estimates based on similar products`
          },
          {
            role: "user",
            content: `Based on this detailed vision analysis: "${visionDescription}", 
            provide nutritional information in JSON format. Include brand-specific details when available.
            
            Schema:
            {
              "primaryIngredients": string (include brand names if identified),
              "portionSize": string (be specific about container/serving sizes),
              "macronutrients": {
                "protein": number,
                "carbs": number,
                "fats": number,
                "calories": number
              },
              "micronutrients": {
                "vitamins": [string],
                "minerals": [string]
              },
              "nutrientDensity": string,
              "explanation": string (include any brand-specific insights)
            }`
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        stream: false,
        response_format: { type: "json_object" }
      });
      const nutritionalAnalysis = JSON.parse(chatResponse.choices[0].message.content);
      
      // Validate the response format
      if (!nutritionalAnalysis.macronutrients || !nutritionalAnalysis.micronutrients) {
        throw new Error("Invalid nutritional analysis format");
      }

      // Emit and respond
      imageEventEmitter.emit('newImage', {
        imageUrl,
        visionDescription,
        nutritionalAnalysis,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        visionDescription,
        nutritionalAnalysis
      });

    } catch (groqError) {
      console.error("Groq API Error:", groqError);
      throw new Error("Failed to analyze nutrition: " + groqError.message);
    }

  } catch (error) {
    console.error("💥 Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.stack 
    });
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

    // Emit call_started event
    imageEventEmitter.emit('webhook_update', {
      type: 'call_started',
      data: {
        callId: llm_id,
        from: from_number,
        to: to_number
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Error handling inbound variables:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add this new SSE endpoint for webhook data
app.get('/api/webhook-stream', (req, res) => {
  console.log("🌟 New webhook SSE connection attempt");
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial connection confirmation
  res.write(`data: ${JSON.stringify({ status: 'connected' })}\n\n`);
  console.log("✅ Sent initial webhook SSE connection message");

  // Handler for webhook events
  const webhookHandler = (data) => {
    console.log("📤 Sending webhook data through SSE:", data);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Add the handler to your event emitter
  imageEventEmitter.on('webhook_update', webhookHandler);

  req.on('close', () => {
    console.log("❌ Webhook SSE Connection closed");
    imageEventEmitter.off('webhook_update', webhookHandler);
  });
});

// At the top with other imports
const processedImages = new Set();

app.post("/webhook", async (req, res) => {
  try {
    const { event, call } = req.body;
    const imageId = call?.image_id || call?.call_id;
    const timestamp = new Date().toISOString();

    if (event === "call_analyzed") {
      if (processedImages.has(imageId)) {
        console.log("🔄 Skipping duplicate image:", imageId);
        return res.status(200).json({ message: "Duplicate image skipped" });
      }

      processedImages.add(imageId);
      setTimeout(() => processedImages.delete(imageId), 10000);

      const { health_goal, additional_notes, user_age, user_height, user_name, user_gender, dietary_preference, user_weight } = call.call_analysis?.custom_analysis_data || {};

      // Check if essential data is present
      if (health_goal || dietary_preference) {  // Make validation less strict
        imageEventEmitter.emit('webhook_update', {
          type: 'image_data',
          data: {
            health_goal: health_goal || 'gain muscle',
            additional_notes: additional_notes || '',
            user_age: user_age || 21,
            user_height: user_height || "5'10",
            user_name: user_name || 'User',
            user_gender: user_gender || 'male',
            dietary_preference: dietary_preference || 'None',
            user_weight: user_weight || 170,
            timestamp
          }
        });
        console.log("✅ Emitting user data with defaults where needed");
      } else {
        console.warn("⚠️ No health goal or dietary preference received.");
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from the public directory
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Add at the top with other imports
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Modify your image processing logic
const processImage = debounce(async (imageData) => {
  try {
    // Your existing image processing code
    const analysis = await analyzeImage(imageData);
    imageEventEmitter.emit('webhook_update', {
      type: 'image_data',
      data: analysis
    });
  } catch (error) {
    console.error("❌ Error processing image:", error);
  }
}, 1000); // 1 second debounce

// Use the debounced function in your route handler
app.post('/api/process-image', async (req, res) => {
  const imageData = req.body;
  processImage(imageData);
  res.status(200).json({ message: "Processing image..." });
});

// Recipe Generation Endpoint
app.post("/api/generate-recipe", async (req, res) => {
  try {
    console.log("📥 Received request for personalized recipe generation");
    const { user_height, user_weight, dietary_preference, health_goal, additional_notes } = req.body;

    if (!dietary_preference || !health_goal) {
      return res.status(400).json({ error: "Missing dietary preference or health goal" });
    }

    console.log("👨‍🍳 Generating recipe for:", { user_height, user_weight, dietary_preference, health_goal, additional_notes });

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_RECIPE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are a personalized AI chef that generates recipes tailored to users' dietary needs and health goals. 
            Generate a **balanced, nutritious recipe** that helps the user achieve their health goals. Consider the user's:
            - Height: ${user_height || "Unknown"} cm
            - Weight: ${user_weight || "Unknown"} kg
            - Dietary Preference: ${dietary_preference}
            - Health Goal: ${health_goal}
            - Additional Notes: ${additional_notes || "None"}
            Ensure that the recipe is suitable for their dietary restrictions and assists in achieving their health goal.
            
            **Output the response as a JSON object using this schema:**
            {
              "recipe_name": "string",
              "ingredients": [
                { "name": "string", "quantity": "string", "quantity_unit": "string | null" }
              ],
              "directions": ["Step-by-step cooking instructions"]
            }`
          }
        ],
        temperature: 0.6,
        stream: false,
        response_format: { type: "json_object" }
      })
    });

    const groqData = await groqResponse.json();
    console.log("🟢 Groq API Response:", groqData);

    if (!groqData.choices || !groqData.choices[0].message.content) {
      throw new Error("Invalid response from Groq API");
    }

    const parsedData = JSON.parse(groqData.choices[0].message.content);
    res.json({
      success: true,
      message: "Personalized recipe generated successfully",
      recipe: parsedData
    });

  } catch (error) {
    console.error("❌ Error generating recipe:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// TTS Endpoint for Recipe Directions
app.post("/api/tts-directions", async (req, res) => {
  try {
    console.log("📥 Received request to convert directions to TTS");
    const { directions } = req.body;

    if (!directions || directions.length === 0) {
      return res.status(400).json({ error: "No directions provided" });
    }

    const textToConvert = directions.join(" "); // Convert array to a single string
    console.log("🔊 Sending text to Memenome API:", textToConvert);

    const ttsResponse = await fetch("https://api.memenome.ai/translations/with-tts", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "x-api-key": process.env.MEMENOME_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        voice: {
          url: "https://res.cloudinary.com/dxwu6rssz/video/upload/v1739085639/Fetty_Wap_Falling_Off_Isolated_xmgdms.mp3"
        },
        message: {
          type: "text",
          text: textToConvert
        }
      })
    });

    const ttsData = await ttsResponse.json();
    console.log("🎵 Memenome API Response:", ttsData);

    if (!ttsData.audio_base64) {
      console.error("❌ Memenome API Error:", ttsData);
      throw new Error("Failed to generate TTS audio.");
    }

    res.json({
      success: true,
      message: "TTS generated successfully",
      audio_base64: ttsData.audio_base64
    });

  } catch (error) {
    console.error("❌ Error generating TTS:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("Ready to receive images, analyze them with RetellAI and Groq AI!");
}); 