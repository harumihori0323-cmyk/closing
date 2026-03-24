require("dotenv").config();
const path = require("path");

const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || "development",
  isDev: (process.env.NODE_ENV || "development") === "development",

  // Anthropic
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  aiModel: "claude-sonnet-4-20250514",

  // Database
  dbPath: path.join(__dirname, "db", "closing.sqlite"),

  // CORS
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
    : ["http://localhost:5173", "https://cl.milkgodo.com"],

  // Rate limit (AI endpoints)
  aiRateLimit: {
    windowMs: 60 * 1000,
    max: parseInt(process.env.AI_RATE_LIMIT, 10) || 20,
  },
};

// 環境変数バリデーション
function validateConfig() {
  if (!config.anthropicApiKey) {
    console.warn("WARNING: ANTHROPIC_API_KEY is not set. AI features will be unavailable.");
  }
}

module.exports = { config, validateConfig };
