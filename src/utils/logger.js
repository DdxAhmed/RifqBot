const LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const currentLevelName = (process.env.LOG_LEVEL || 'info').toLowerCase();
const currentLevel = LEVELS[currentLevelName] ?? LEVELS.info;

function formatMessage(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const prefix = `[${level.toUpperCase()}] [${timestamp}]`;
  if (args.length > 0) {
    return [prefix, message, ...args];
  }
  return [prefix, message];
}

export const logger = {
  debug(message, ...args) {
    if (currentLevel <= LEVELS.debug) {
      console.debug(...formatMessage('debug', message, ...args));
    }
  },
  info(message, ...args) {
    if (currentLevel <= LEVELS.info) {
      console.info(...formatMessage('info', message, ...args));
    }
  },
  warn(message, ...args) {
    if (currentLevel <= LEVELS.warn) {
      console.warn(...formatMessage('warn', message, ...args));
    }
  },
  error(message, ...args) {
    if (currentLevel <= LEVELS.error) {
      console.error(...formatMessage('error', message, ...args));
    }
  }
};
