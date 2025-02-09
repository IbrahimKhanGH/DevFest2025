import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch"; // Ensure node-fetch v2 is installed
import { fileURLToPath } from "url";
import { dirname } from "path";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import Groq from "groq-sdk";

// ✅ Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3103;

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

// ✅ Enable CORS for Frontend (http://localhost:5173)
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// ✅ Handle Preflight Requests (CORS for OPTIONS)
app.options("/api/analyze-image", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.sendStatus(204);
});

// ✅ Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ✅ Serve static files from the public directory
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// ✅ Ensure Groq API Key Exists
if (!process.env.GROQ_API_KEY) {
  console.error("❌ ERROR: GROQ_API_KEY is missing from .env file.");
  process.exit(1);
}
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ✅ Function to Shorten URL using TinyURL API
async function shortenUrl(longUrl) {
  try {
    const response = await fetch(`http://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
    return await response.text();
  } catch (error) {
    console.error("Error shortening URL:", error);
    return longUrl; // Return original URL if shortening fails
  }
}

// ✅ Image Processing & AI Analysis Route
app.post("/api/analyze-image", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    console.log("🟢 Received Image URL:", imageUrl);

    if (!imageUrl) {
      console.error("❌ No image URL provided!");
      return res.status(400).json({ success: false, error: "No image URL provided" });
    }

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

    console.log("🟢 Groq Response Received:", chatResponse);

    const parsedData = JSON.parse(chatResponse.choices[0].message.content);

    res.json({
      success: true,
      message: "Image processed successfully",
      nutritionalAnalysis: parsedData
    });

  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({ success: false, error: error.message || "Error processing image" });
  }
});



// ✅ Start the Server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log("Ready to receive images and analyze them!");
});
