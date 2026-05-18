export const logger = {
  info: (msg: string) => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`),
  warn: (msg: string) => console.warn(`[${new Date().toISOString()}] [WARN] ${msg}`),
  error: (msg: string) => console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`),

  logApiRequest: (method: string, url: string, body?: unknown) => {
    const entry = { time: new Date().toISOString(), direction: 'REQUEST', method, url, body };
    logger.info(`${method} ${url}`);
    appendApiLog(entry);
  },

  logApiResponse: (status: number, url: string, body: unknown, durationMs: number) => {
    const entry = { time: new Date().toISOString(), direction: 'RESPONSE', status, url, body, durationMs };
    logger.info(`${status} ${url} (${durationMs}ms)`);
    appendApiLog(entry);
  },
};

function appendApiLog(entry: unknown) {
  import('fs').then((fs) => {
    import('path').then((path) => {
      const logFile = path.join('logs', 'api-calls.json');
      fs.mkdirSync('logs', { recursive: true });
      let existing: unknown[] = [];
      try {
        existing = JSON.parse(fs.readFileSync(logFile, 'utf-8')) as unknown[];
      } catch {}
      existing.push(entry);
      fs.writeFileSync(logFile, JSON.stringify(existing, null, 2));
    });
  });
}
