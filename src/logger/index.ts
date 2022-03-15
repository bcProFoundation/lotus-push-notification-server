import { createLogger, format, Logger, transports } from 'winston';
const { combine, timestamp, label, prettyPrint } = format;
import  DailyRotateFile from 'winston-daily-rotate-file';
import config from '../config';
const { DEBUG, LOGGING_DIR } = config;
const ERROR_LOG_FILE = `${LOGGING_DIR}/error.log`;
const ALL_LOG_FILE = `${LOGGING_DIR}/all.log`;
const DEBUG_LOG_FILE = `${LOGGING_DIR}/debug.log`;
const DEV_LOG_FILE =`${LOGGING_DIR}/dev.log.${Date.now()}`

let logger: Logger;
// Logging for Local Development
if ( process.env.NODE_ENV === 'development' ) {
    logger = createLogger({
        level: 'debug',
        format: combine(
            format.timestamp(),
            format.json(),
        ),
        transports: [
            new transports.File({ filename: DEV_LOG_FILE }),
            new transports.Console({
                format: format.combine(
                    format.colorize(),
                    format.simple()
                )
            }),
        ],
        exitOnError: false,
        silent: false,
    });
// Logging with DEBUG mode set to 'true'
} else if ( DEBUG ) {
    logger = createLogger({
        level: 'debug',
        format: combine(
            format.timestamp(),
            format.json(),
        ),
        transports: [
            new DailyRotateFile({ filename: `${DEBUG_LOG_FILE}-%DATE%`, maxSize: '40m', maxFiles: '7d' }),
        ],
        exitOnError: false,
        silent: false,
    });
// Default logging, for production
} else {
    logger = createLogger({
        level: 'info',
        format: combine(
            format.timestamp(),
            format.json(),
        ),
        transports: [
            new DailyRotateFile({ filename: `${ERROR_LOG_FILE}-%DATE%` , level: 'error', maxSize: '20m', maxFiles: '14d' }),
            new DailyRotateFile({ filename: `${ALL_LOG_FILE}-%DATE%`, maxSize: '20m', maxFiles: '14d' }),
        ],
        exitOnError: false,
        silent: false,
    });
}

export default logger;