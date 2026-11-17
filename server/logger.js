/**
 * Lightweight structured logger (JSON lines to stdout/stderr).
 * No external dependencies.
 *
 * Env:
 *   LOG_LEVEL = error | warn | info | debug   (default: info)
 *   LOG_PRETTY = 1                            (human-readable instead of JSON)
 */

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const configuredLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
const minLevel = LEVELS[configuredLevel] !== undefined ? LEVELS[configuredLevel] : LEVELS.info;
const pretty = process.env.LOG_PRETTY === '1' || process.env.LOG_PRETTY === 'true';

function write(level, msg, meta = {}) {
	if (LEVELS[level] > minLevel) return;

	const entry = {
		level,
		time: new Date().toISOString(),
		msg,
		...meta,
	};

	// Never accidentally log secrets
	if (entry.apiKey) delete entry.apiKey;
	if (entry.password) delete entry.password;
	if (entry.password_hash) delete entry.password_hash;

	let line;
	if (pretty) {
		const { time, level: lvl, msg: message, ...rest } = entry;
		const extra = Object.keys(rest).length ? ' ' + JSON.stringify(rest) : '';
		line = `${time} [${lvl.toUpperCase()}] ${message}${extra}`;
	} else {
		line = JSON.stringify(entry);
	}

	if (level === 'error') {
		console.error(line);
	} else {
		console.log(line);
	}
}

const logger = {
	error(msg, meta) { write('error', msg, meta); },
	warn(msg, meta) { write('warn', msg, meta); },
	info(msg, meta) { write('info', msg, meta); },
	debug(msg, meta) { write('debug', msg, meta); },

	/**
	 * Express middleware: logs one structured line per finished request.
	 * Place after API-key middleware so req.apiConsumer is available.
	 */
	requestLogger(req, res, next) {
		const start = process.hrtime.bigint();

		res.on('finish', () => {
			const durationNs = process.hrtime.bigint() - start;
			const durationMs = Number(durationNs) / 1e6;

			const meta = {
				method: req.method,
				path: req.originalUrl || req.url,
				status: res.statusCode,
				durationMs: Math.round(durationMs * 100) / 100,
			};

			if (req.apiConsumer) meta.consumer = req.apiConsumer;
			if (req.ip) meta.ip = req.ip;

			// Prefer warn for 4xx, error for 5xx
			if (res.statusCode >= 500) {
				logger.error('request', meta);
			} else if (res.statusCode >= 400) {
				logger.warn('request', meta);
			} else {
				logger.info('request', meta);
			}
		});

		next();
	},
};

module.exports = logger;
