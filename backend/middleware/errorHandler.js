function errorHandler(err, req, res, _next) {
  const logger = req.log || console;

  // Anthropic APIエラー
  if (err.status && err.type) {
    logger.error({ err, type: "anthropic_api" }, "Anthropic API error");
    const statusCode = err.status >= 500 ? 502 : 500;
    return res.status(statusCode).json({
      error: "AI応答の生成に失敗しました。しばらくしてから再度お試しください。",
    });
  }

  // SyntaxError (JSON parse)
  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({ error: "リクエストの形式が不正です" });
  }

  // その他のエラー
  logger.error({ err }, "Unhandled error");
  res.status(err.status || 500).json({
    error: "サーバーエラーが発生しました",
  });
}

module.exports = errorHandler;
