const pino = require("pino");
const pinoHttp = require("pino-http");
const { config } = require("../config");

const logger = pino({
  level: config.isDev ? "debug" : "info",
  transport: config.isDev
    ? { target: "pino/file", options: { destination: 1 } }
    : undefined,
});

const httpLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === "/api/health",
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});

module.exports = { logger, httpLogger };
