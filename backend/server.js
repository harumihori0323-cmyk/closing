const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

const { config, validateConfig } = require("./config");
const { getDb, migrateFromJson, closeDb } = require("./db/init");
const { logger, httpLogger } = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const customerRoutes = require("./routes/customers");
const aiRoutes = require("./routes/ai");

// 環境変数チェック
validateConfig();

const app = express();

// --- ミドルウェア ---

// セキュリティヘッダー
app.use(
  helmet({
    contentSecurityPolicy: config.isDev ? false : undefined,
  })
);

// ログ
app.use(httpLogger);

// CORS
app.use(
  cors({
    origin: config.isDev ? true : config.corsOrigins,
  })
);

// JSON パース
app.use(express.json({ limit: "1mb" }));

// ヘルスチェック
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// AI エンドポイントにレートリミット
const aiLimiter = rateLimit({
  windowMs: config.aiRateLimit.windowMs,
  max: config.aiRateLimit.max,
  message: { error: "リクエストが多すぎます。しばらくしてから再度お試しください。" },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- ルーティング ---
app.use("/api/customers", customerRoutes);
app.use("/api/ai", aiLimiter, aiRoutes);

// --- 本番環境：フロントエンド静的ファイル配信 ---
const distPath = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("/*splat", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// --- エラーハンドリング ---
app.use(errorHandler);

// --- DB初期化 & サーバー起動 ---
getDb();
const migrated = migrateFromJson();
if (migrated > 0) {
  logger.info(`Migrated ${migrated} customers from JSON to SQLite`);
}

const server = app.listen(config.port, () => {
  logger.info(`Server running on http://localhost:${config.port}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down...");
  server.close(() => {
    closeDb();
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down...");
  server.close(() => {
    closeDb();
    process.exit(0);
  });
});
