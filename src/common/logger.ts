import * as winston from 'winston';
import process from "node:process";

const { combine, timestamp, printf, colorize } = winston.format;

const logger = winston.createLogger({
	level: 'info',
	format: combine(
		timestamp({
			format: 'YYYY-MM-DD hh:mm:ss.SSS A',
		}),
		printf((info) => {
			const message = info.message as { unique_id?: string; text?: string };
			return `|> ${process.pid} <| [${info.timestamp}]${!message.unique_id ? '' : ' - [' + message.unique_id + '] -'} ${info.level}: ${message.text ? message.text : info.message}`;
		})
	),
	transports: [
		new winston.transports.File({
			filename: 'logs/error.log',
			level: 'error',
		}),
		new winston.transports.File({
			filename: 'logs/warnings.log',
			level: 'warn',
		}),
		new winston.transports.File({
			filename: 'logs/combined.log',
		}),
		new (winston.transports.Console)({
			format: combine(
				colorize({ all: true }),
			)
		}),
	],
	exitOnError: false
})

export default logger;