import 'dotenv/config';

export default {
    PORT: process.env.PORT || '',
    DB_PATH: process.env.DB_PATH || '',
    MAILTO: process.env.MAILTO || '',
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || '',
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || '',
    LOTUSD_ZMQ_URL: process.env.LOTUSD_ZMQ_URL || '',
    DEBUG: process.env.DEBUG === 'true' ? true : false,
    LOGGING_DIR: process.env.LOGGING_DIR || "./logs"
}