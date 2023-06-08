const winston = require('winston');
const path = require('path');
const os = require('os');
const hostname = os.hostname();
const rfs = require('rotating-file-stream');
require('winston-daily-rotate-file');
const dateFormat = require('date-fns/format')

const logger = {};

logger.logLevel = process.env.APP_LOG_LEVEL || 'debug';

logger.dateFormatStr = 'yyyy-MM-dd';

logger.dateNow = dateFormat(new Date(), logger.dateFormatStr);

logger.skipRoutes = [
  "/version",
  "/healthcheck",
  "/robots.txt",
  "/favicon.ico"
];

logger.skipLogs = (req, res) => {
  let skipLogsAnswer = false;
  logger.skipRoutes.forEach(routeToSkip => {
    if (req.originalUrl && req.originalUrl.indexOf(routeToSkip) > -1) { 
      skipLogsAnswer = true;
    }
  });
  return skipLogsAnswer;
}

// Console logs and errors write to file using winston
logger.console = winston.createLogger({
  level: logger.logLevel,
  format: winston.format.json(),
  transports: [
    new winston.transports.DailyRotateFile(
      {
        filename: `${hostname}_console_%DATE%.log`,
        dirname: `logs`,
        dateFormat: logger.dateFormatStr,
        maxSize: '20m',
        maxFiles: '14d'
      }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// API request logs write to file config
logger.requestLogStream = rfs.createStream(`./${hostname}_request_${logger.dateNow}.log`, {
  interval: '1d', // Rotate daily
  maxFiles: 30, // Maximum number of rotated files to keep in storage
  path: path.join(__dirname, `../logs`)
});

module.exports = logger;